import SwiftUI
import WebKit
import UniformTypeIdentifiers
import Combine

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var isTargetedForDrop = false
    
    var body: some View {
        ZStack {
            // Fond sombre macOS correspondant à l'interface d'Aperçu (#242426)
            Color(red: 0.14, green: 0.14, blue: 0.15)
                .ignoresSafeArea()
            
            // WebView intégrée affichant la version complète de l'application
            MacWebView(store: webViewStore)
                .ignoresSafeArea()
            
            // Indicateur visuel lors du glisser-déposer de PDF / image
            if isTargetedForDrop {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue, lineWidth: 3)
                    .background(Color.blue.opacity(0.18))
                    .overlay(
                        VStack(spacing: 12) {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 52))
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
        .frame(minWidth: 980, minHeight: 700)
        .onDrop(of: [.pdf, .image, .fileURL], isTargeted: $isTargetedForDrop) { providers in
            handleDrop(providers: providers)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: {
                    webViewStore.triggerOpenFile()
                }) {
                    Label("Ouvrir un document", systemImage: "folder")
                }
                .help("Ouvrir un fichier PDF ou image (⌘O)")
                .keyboardShortcut("o", modifiers: .command)
                
                Button(action: {
                    webViewStore.exportPDF()
                }) {
                    Label("Exporter PDF", systemImage: "square.and.arrow.up")
                }
                .help("Exporter le document avec annotations (⌘E)")
                .keyboardShortcut("e", modifiers: .command)
                
                Button(action: {
                    webViewStore.reload()
                }) {
                    Label("Actualiser", systemImage: "arrow.clockwise")
                }
                .help("Actualiser (⌘R)")
                .keyboardShortcut("r", modifiers: .command)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .openFileRequested)) { _ in
            webViewStore.triggerOpenFile()
        }
        .onReceive(NotificationCenter.default.publisher(for: .exportPDFRequested)) { _ in
            webViewStore.exportPDF()
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
    
    private func loadFile(from url: URL) {
        let isSecured = url.startAccessingSecurityScopedResource()
        defer {
            if isSecured {
                url.stopAccessingSecurityScopedResource()
            }
        }
        
        guard let data = try? Data(contentsOf: url) else {
            print("Erreur de lecture du fichier à l'URL:", url)
            return
        }
        
        let filename = url.lastPathComponent
        let isPDF = url.pathExtension.lowercased() == "pdf"
        let mimeType = isPDF ? "application/pdf" : "image/\(url.pathExtension.lowercased())"
        
        DispatchQueue.main.async {
            self.webViewStore.openFileInWebChunked(data: data, filename: filename, mimeType: mimeType)
        }
    }
}

// Notification keys pour le menu macOS (Fichier > Ouvrir...)
extension Notification.Name {
    static let openFileRequested = Notification.Name("openFileRequested")
    static let exportPDFRequested = Notification.Name("exportPDFRequested")
}

// Store contrôleur pour WKWebView
class WebViewStore: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler {
    var webView: WKWebView?
    
    func getOrCreateWebView() -> WKWebView {
        if let existing = webView {
            return existing
        }
        
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeApp")
        config.userContentController = contentController
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
        
        // 1. Recherche directe du fichier index.html autonome
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
    
    // Déclenche le sélecteur de fichiers natif macOS via l'input HTML du webview
    func triggerOpenFile() {
        let script = "if (window.triggerNativeOpenFile) { window.triggerNativeOpenFile(); }"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    
    // Transfert sécurisé par blocs de 64KB sans jamais dépasser la limite de taille XPC
    func openFileInWebChunked(data: Data, filename: String, mimeType: String) {
        let escapedName = filename.replacingOccurrences(of: "'", with: "\\'")
        let totalBytes = data.count
        let initScript = "window.nativeFileTransfer = { name: '\(escapedName)', mime: '\(mimeType)', chunks: [] };"
        
        webView?.evaluateJavaScript(initScript) { [weak self] _, _ in
            guard let self = self else { return }
            let chunkSize = 64 * 1024
            var offset = 0
            
            func sendNextChunk() {
                guard offset < totalBytes else {
                    let finalizeScript = """
                    (function() {
                        if (!window.nativeFileTransfer) return;
                        const chunks = window.nativeFileTransfer.chunks;
                        const blob = new Blob(chunks, { type: window.nativeFileTransfer.mime });
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            if (window.openNativeFile) {
                                window.openNativeFile(e.target.result, window.nativeFileTransfer.name, window.nativeFileTransfer.mime);
                            }
                        };
                        if (window.nativeFileTransfer.mime.startsWith('image/')) {
                            reader.readAsDataURL(blob);
                        } else {
                            reader.readAsArrayBuffer(blob);
                        }
                    })();
                    """
                    self.webView?.evaluateJavaScript(finalizeScript, completionHandler: nil)
                    return
                }
                
                let end = min(offset + chunkSize, totalBytes)
                let subData = data.subdata(in: offset..<end)
                let chunkBase64 = subData.base64EncodedString()
                let chunkScript = """
                (function() {
                    const bin = atob('\(chunkBase64)');
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                    window.nativeFileTransfer.chunks.push(bytes);
                })();
                """
                offset = end
                self.webView?.evaluateJavaScript(chunkScript) { _, _ in
                    sendNextChunk()
                }
            }
            sendNextChunk()
        }
    }
    
    func exportPDF() {
        let script = "if (window.exportNativePDF) { window.exportNativePDF(); }"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        print("Web process terminé de manière inattendue, rechargement automatique...")
        self.loadApp()
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Erreur de navigation WKWebView:", error)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Erreur de navigation provisoire WKWebView:", error)
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        print("Message reçu de l'interface web:", message.body)
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
