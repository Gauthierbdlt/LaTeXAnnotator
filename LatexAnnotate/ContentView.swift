import SwiftUI
import WebKit
import UniformTypeIdentifiers
import Combine

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var isTargetedForDrop = false
    
    var body: some View {
        ZStack {
            // Fond sombre macOS identique à l'interface d'Aperçu
            Color(red: 0.11, green: 0.11, blue: 0.13)
                .ignoresSafeArea()
            
            // WebView intégrée sans re-render intempestif
            MacWebView(store: webViewStore)
                .ignoresSafeArea()
            
            // Indicateur visuel élégant lors du glisser-déposer de PDF / image
            if isTargetedForDrop {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue, lineWidth: 3)
                    .background(Color.blue.opacity(0.15))
                    .overlay(
                        VStack(spacing: 10) {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 48))
                                .foregroundColor(.blue)
                            Text("Déposez votre document PDF ou image ici")
                                .font(.title3.bold())
                                .foregroundColor(.white)
                            Text("Ouverture instantanée dans Aperçu")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    )
                    .ignoresSafeArea()
            }
        }
        .frame(minWidth: 960, minHeight: 680)
        .onDrop(of: [.pdf, .image, .fileURL], isTargeted: $isTargetedForDrop) { providers in
            handleDrop(providers: providers)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: {
                    openFilePicker()
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
                .help("Exporter le document avec annotations LaTeX et formes (⌘E)")
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
            openFilePicker()
        }
        .onReceive(NotificationCenter.default.publisher(for: .exportPDFRequested)) { _ in
            webViewStore.exportPDF()
        }
    }
    
    // Sélecteur de fichiers macOS avec accès complet
    private func openFilePicker() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.canCreateDirectories = false
        panel.allowedContentTypes = [.pdf, .png, .jpeg, .image]
        panel.message = "Sélectionnez un document PDF ou une image à annoter"
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
        
        let base64 = data.base64EncodedString()
        let filename = url.lastPathComponent
        let isPDF = url.pathExtension.lowercased() == "pdf"
        let mimeType = isPDF ? "application/pdf" : "image/\(url.pathExtension.lowercased())"
        let dataUrl = "data:\(mimeType);base64,\(base64)"
        
        DispatchQueue.main.async {
            self.webViewStore.openFileInWeb(dataUrl: dataUrl, filename: filename, mimeType: mimeType)
        }
    }
}

// Notification keys pour la barre de menu macOS (Fichier > Ouvrir...)
extension Notification.Name {
    static let openFileRequested = Notification.Name("openFileRequested")
    static let exportPDFRequested = Notification.Name("exportPDFRequested")
}

// Store contrôleur pour WKWebView sans publication pendant les passes SwiftUI
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
        
        // 1. Bundle local dist/index.html empaqueté dans l'application
        if let bundleUrl = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            let distFolder = bundleUrl.deletingLastPathComponent()
            webView.loadFileURL(bundleUrl, allowingReadAccessTo: distFolder)
            return
        }
        
        // 2. Recherche récursive du fichier index.html dans le paquet d'application
        if let fallbackUrl = Bundle.main.url(forResource: "index", withExtension: "html") {
            let parentFolder = fallbackUrl.deletingLastPathComponent()
            webView.loadFileURL(fallbackUrl, allowingReadAccessTo: parentFolder)
            return
        }
        
        // 3. Mode développement si le serveur local est actif
        if let localDevUrl = URL(string: "http://localhost:3000") {
            webView.load(URLRequest(url: localDevUrl))
        }
    }
    
    func reload() {
        webView?.reload()
    }
    
    func openFileInWeb(dataUrl: String, filename: String, mimeType: String) {
        let escapedFilename = filename.replacingOccurrences(of: "'", with: "\\'")
        let script = "if (window.openNativeFile) { window.openNativeFile('\(dataUrl)', '\(escapedFilename)', '\(mimeType)'); }"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script) { _, error in
                if let error = error {
                    print("Erreur JavaScript lors de l'ouverture du document:", error)
                }
            }
        }
    }
    
    func exportPDF() {
        let script = "if (window.exportNativePDF) { window.exportNativePDF(); }"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
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
