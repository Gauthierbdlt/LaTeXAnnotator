import SwiftUI
import WebKit
import UniformTypeIdentifiers
import Combine

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var isTargetedForDrop = false
    
    var body: some View {
        ZStack {
            // Fond sombre macOS identique à l'interface d'Aperçu (#242426)
            Color(red: 0.14, green: 0.14, blue: 0.15)
                .ignoresSafeArea()
            
            // Vue WebKit intégrant l'application avec communication native bidirectionnelle
            MacWebView(store: webViewStore)
                .ignoresSafeArea()
            
            // Indicateur visuel lors du glisser-déposer de PDF / image
            if isTargetedForDrop {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue, lineWidth: 3)
                    .background(Color.blue.opacity(0.2))
                    .overlay(
                        VStack(spacing: 12) {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 54))
                                .foregroundColor(.blue)
                            Text("Déposez votre document PDF ou image ici")
                                .font(.title2.bold())
                                .foregroundColor(.white)
                            Text("Ouverture instantanée dans Aperçu")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    )
                    .ignoresSafeArea()
            }
        }
        .frame(minWidth: 1000, minHeight: 720)
        .onDrop(of: [.pdf, .image, .fileURL], isTargeted: $isTargetedForDrop) { providers in
            handleDrop(providers: providers)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: {
                    openFilePicker()
                }) {
                    Label("Ouvrir", systemImage: "folder")
                }
                .help("Ouvrir un document sur votre Mac (⌘O)")
                .keyboardShortcut("o", modifiers: .command)
                
                Button(action: {
                    webViewStore.exportPDF()
                }) {
                    Label("Enregistrer", systemImage: "square.and.arrow.down")
                }
                .help("Enregistrer le document annoté (⌘S / ⌘E)")
                .keyboardShortcut("s", modifiers: .command)
                
                Button(action: {
                    webViewStore.closeDocument()
                }) {
                    Label("Fermer", systemImage: "xmark.circle")
                }
                .help("Fermer le document actuel (⌘W)")
                .keyboardShortcut("w", modifiers: .command)
                
                Button(action: {
                    webViewStore.reload()
                }) {
                    Label("Actualiser", systemImage: "arrow.clockwise")
                }
                .help("Actualiser l'application (⌘R)")
                .keyboardShortcut("r", modifiers: .command)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .openFileRequested)) { _ in
            openFilePicker()
        }
        .onReceive(NotificationCenter.default.publisher(for: .exportPDFRequested)) { _ in
            webViewStore.exportPDF()
        }
        .onReceive(NotificationCenter.default.publisher(for: .closeDocRequested)) { _ in
            webViewStore.closeDocument()
        }
    }
    
    // Ouvre le sélecteur natif de fichiers macOS (Finder)
    private func openFilePicker() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.canCreateDirectories = false
        panel.allowedContentTypes = [.pdf, .png, .jpeg, .image]
        panel.message = "Sélectionnez votre document PDF ou image sur votre Mac"
        panel.prompt = "Ouvrir"
        
        if panel.runModal() == .OK, let url = panel.url {
            loadFile(from: url)
        }
    }
    
    private func handleDrop(providers: [NSItemProvider]) -> Bool {
        guard let provider = providers.first else { return false }
        
        provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { item, error in
            if let data = item as? Data, let url = URL(dataRepresentation: data, relativeTo: nil) {
                DispatchQueue.main.async {
                    self.loadFile(from: url)
                }
            } else if let url = item as? URL {
                DispatchQueue.main.async {
                    self.loadFile(from: url)
                }
            }
        }
        return true
    }
    
    // Charge les octets du fichier en mémoire et les injecte via le protocole natif
    private func loadFile(from url: URL) {
        let isSecured = url.startAccessingSecurityScopedResource()
        defer {
            if isSecured {
                url.stopAccessingSecurityScopedResource()
            }
        }
        
        guard let data = try? Data(contentsOf: url) else {
            print("Erreur de lecture du fichier:", url)
            return
        }
        
        let filename = url.lastPathComponent
        let isPDF = url.pathExtension.lowercased() == "pdf"
        let mimeType = isPDF ? "application/pdf" : "image/\(url.pathExtension.lowercased())"
        
        DispatchQueue.main.async {
            self.webViewStore.openDocument(data: data, filename: filename, mimeType: mimeType)
        }
    }
}

// Notification keys pour le menu macOS
extension Notification.Name {
    static let openFileRequested = Notification.Name("openFileRequested")
    static let exportPDFRequested = Notification.Name("exportPDFRequested")
    static let closeDocRequested = Notification.Name("closeDocRequested")
}

// Gestionnaire de schéma d'URL mémoire (doc-asset://) évitant tout dépassement IPC Mach / base64
class DocSchemeHandler: NSObject, WKURLSchemeHandler {
    static var currentData: Data?
    static var currentMime: String = "application/pdf"
    
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let data = DocSchemeHandler.currentData else {
            urlSchemeTask.didFailWithError(NSError(domain: "DocScheme", code: 404, userInfo: nil))
            return
        }
        let response = HTTPURLResponse(
            url: urlSchemeTask.request.url!,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": DocSchemeHandler.currentMime,
                "Content-Length": "\(data.count)",
                "Access-Control-Allow-Origin": "*"
            ]
        )!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }
    
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

// Store contrôleur pour WKWebView
class WebViewStore: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler {
    var webView: WKWebView?
    
    // Suivi des morceaux de sauvegarde transmis par l'interface web
    private var pendingTransfers: [String: [Data]] = [:]
    private var pendingFilenames: [String: String] = [:]
    
    func getOrCreateWebView() -> WKWebView {
        if let existing = webView {
            return existing
        }
        
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeApp")
        config.userContentController = contentController
        
        // Enregistre le gestionnaire de protocole natif haute performance
        let docSchemeHandler = DocSchemeHandler()
        config.setURLSchemeHandler(docSchemeHandler, forURLScheme: "doc-asset")
        
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.navigationDelegate = self
        wv.setValue(false, forKey: "drawsBackground")
        self.webView = wv
        
        DispatchQueue.main.async {
            self.loadApp()
        }
        return wv
    }
    
    func loadApp() {
        guard let webView = webView else { return }
        
        // 1. Recherche du bundle HTML autonome index.html
        if let bundleUrl = Bundle.main.url(forResource: "index", withExtension: "html") ??
                           Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            if let htmlContent = try? String(contentsOf: bundleUrl, encoding: .utf8) {
                webView.loadHTMLString(htmlContent, baseURL: bundleUrl.deletingLastPathComponent())
                return
            }
            webView.loadFileURL(bundleUrl, allowingReadAccessTo: bundleUrl.deletingLastPathComponent())
            return
        }
        
        // 2. Recherche récursive de tout fichier HTML dans les ressources
        if let resPath = Bundle.main.resourcePath,
           let items = try? FileManager.default.contentsOfDirectory(atPath: resPath) {
            for item in items where item.hasSuffix(".html") {
                let fileUrl = URL(fileURLWithPath: resPath).appendingPathComponent(item)
                if let htmlContent = try? String(contentsOf: fileUrl, encoding: .utf8) {
                    webView.loadHTMLString(htmlContent, baseURL: fileUrl.deletingLastPathComponent())
                    return
                }
            }
        }
        
        // 3. Mode dev local si actif
        if let localDevUrl = URL(string: "http://localhost:3000") {
            webView.load(URLRequest(url: localDevUrl))
        }
    }
    
    func reload() {
        webView?.reload()
    }
    
    func closeDocument() {
        let script = "void(window.closeNativeDocument && window.closeNativeDocument());"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    
    // Transmet le document à l'interface sans limite de taille
    func openDocument(data: Data, filename: String, mimeType: String) {
        DocSchemeHandler.currentData = data
        DocSchemeHandler.currentMime = mimeType
        let escapedFilename = filename.replacingOccurrences(of: "'", with: "\\'")
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        // Utilisation de void(...) pour éviter l'erreur WKErrorDomain Code 5 sur les Promises JavaScript
        let script = "void(window.loadFromDocScheme && window.loadFromDocScheme('doc-asset://document/\(escapedFilename)?t=\(timestamp)', '\(escapedFilename)', '\(mimeType)'));"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script) { _, error in
                if let error = error {
                    print("Erreur JavaScript loadFromDocScheme:", error)
                }
            }
        }
    }
    
    func exportPDF() {
        let script = "void(window.exportNativePDF && window.exportNativePDF());"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    
    // Boîte de dialogue native macOS pour enregistrer le fichier annoté (Finder)
    private func presentSavePanel(for data: Data, defaultFilename: String) {
        let savePanel = NSSavePanel()
        savePanel.canCreateDirectories = true
        savePanel.nameFieldStringValue = defaultFilename
        
        let ext = (defaultFilename as NSString).pathExtension.lowercased()
        if ext == "png" {
            savePanel.allowedContentTypes = [.png]
        } else {
            savePanel.allowedContentTypes = [.pdf]
        }
        
        savePanel.title = "Enregistrer le document annoté"
        savePanel.message = "Choisissez l'emplacement sur votre Mac où sauvegarder votre fichier"
        savePanel.prompt = "Enregistrer"
        
        if savePanel.runModal() == .OK, let targetUrl = savePanel.url {
            do {
                try data.write(to: targetUrl)
                NSSound(named: "Glass")?.play()
                print("Fichier sauvegardé avec succès à :", targetUrl.path)
            } catch {
                let alert = NSAlert()
                alert.messageText = "Erreur de sauvegarde"
                alert.informativeText = "Impossible d'enregistrer le fichier : \(error.localizedDescription)"
                alert.alertStyle = .warning
                alert.runModal()
            }
        }
    }
    
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        print("Web process interrompu, rechargement automatique...")
        self.loadApp()
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Erreur de navigation WKWebView:", error)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Erreur de navigation provisoire WKWebView:", error)
    }
    
    // Reçoit les messages provenant de l'interface (clic sur Ouvrir, transfert de fichiers pour sauvegarde)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeApp" else { return }
        
        if let bodyStr = message.body as? String {
            if bodyStr == "openFileDialog" {
                NotificationCenter.default.post(name: .openFileRequested, object: nil)
            }
            return
        }
        
        if let dict = message.body as? [String: Any], let action = dict["action"] as? String {
            switch action {
            case "openFileDialog":
                NotificationCenter.default.post(name: .openFileRequested, object: nil)
                
            case "saveFileStart":
                if let transferId = dict["transferId"] as? String,
                   let filename = dict["filename"] as? String {
                    pendingTransfers[transferId] = []
                    pendingFilenames[transferId] = filename
                }
                
            case "saveFileChunk":
                if let transferId = dict["transferId"] as? String,
                   let chunkBase64 = dict["data"] as? String,
                   let data = Data(base64Encoded: chunkBase64) {
                    pendingTransfers[transferId]?.append(data)
                }
                
            case "saveFileFinish":
                if let transferId = dict["transferId"] as? String,
                   let chunks = pendingTransfers[transferId],
                   let filename = pendingFilenames[transferId] {
                    var fullData = Data()
                    for c in chunks { fullData.append(c) }
                    pendingTransfers.removeValue(forKey: transferId)
                    pendingFilenames.removeValue(forKey: transferId)
                    
                    DispatchQueue.main.async {
                        self.presentSavePanel(for: fullData, defaultFilename: filename)
                    }
                }
                
            default:
                break
            }
        }
    }
}

// Composant SwiftUI représentant la WKWebView
struct MacWebView: NSViewRepresentable {
    let store: WebViewStore
    
    func makeNSView(context: Context) -> WKWebView {
        return store.getOrCreateWebView()
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
