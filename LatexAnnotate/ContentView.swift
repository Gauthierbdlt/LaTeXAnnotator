import SwiftUI
import WebKit
import UniformTypeIdentifiers

struct ContentView: View {
    @StateObject private var webViewStore = WebViewStore()
    @State private var isTargetedForDrop = false
    
    var body: some View {
        ZStack {
            // Fond sombre natif macOS correspondant à la palette d'Aperçu
            Color(red: 0.11, green: 0.11, blue: 0.13)
                .ignoresSafeArea()
            
            // WebView affichant la version complète de l'application
            MacWebView(store: webViewStore)
                .ignoresSafeArea()
            
            // Indicateur visuel lors du glisser-déposer de PDF / image
            if isTargetedForDrop {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue, lineWidth: 3)
                    .background(Color.blue.opacity(0.12))
                    .overlay(
                        VStack(spacing: 8) {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 44))
                                .foregroundColor(.blue)
                            Text("Déposez votre PDF ou image pour l'ouvrir")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                    )
                    .ignoresSafeArea()
            }
        }
        .frame(minWidth: 900, minHeight: 650)
        .onDrop(of: [.pdf, .image, .fileURL], isTargeted: $isTargetedForDrop) { providers in
            handleDrop(providers: providers)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: {
                    openFilePicker()
                }) {
                    Label("Ouvrir un fichier", systemImage: "doc.badge.plus")
                }
                .help("Ouvrir un PDF ou une image (⌘O)")
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
    }
    
    // Dialogue natif macOS pour ouvrir un fichier (PDF ou image)
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
        guard let data = try? Data(contentsOf: url) else { return }
        let base64 = data.base64EncodedString()
        let filename = url.lastPathComponent
        let isPDF = url.pathExtension.lowercased() == "pdf"
        let mimeType = isPDF ? "application/pdf" : "image/\(url.pathExtension.lowercased())"
        let dataUrl = "data:\(mimeType);base64,\(base64)"
        
        webViewStore.openFileInWeb(dataUrl: dataUrl, filename: filename, mimeType: mimeType)
    }
}

// Notification keys pour le menu système macOS
extension Notification.Name {
    static let openFileRequested = Notification.Name("openFileRequested")
    static let exportPDFRequested = Notification.Name("exportPDFRequested")
}

// Store pour communiquer avec la WKWebView
class WebViewStore: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler {
    var webView: WKWebView?
    
    func setupWebView() -> WKWebView {
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeApp")
        config.userContentController = contentController
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        let wv = WKWebView(frame: .zero, configuration: config)
        wv.navigationDelegate = self
        wv.setValue(false, forKey: "drawsBackground") // fond transparent sans flash blanc
        self.webView = wv
        
        loadApp()
        return wv
    }
    
    func loadApp() {
        guard let webView = webView else { return }
        
        // 1. Essai de chargement du bundle local dist/index.html inclus dans l'app
        if let bundleUrl = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            let distFolder = bundleUrl.deletingLastPathComponent()
            webView.loadFileURL(bundleUrl, allowingReadAccessTo: distFolder)
            return
        }
        
        // 2. Recherche récursive du fichier index.html dans le Bundle
        if let fallbackUrl = Bundle.main.url(forResource: "index", withExtension: "html") {
            let parentFolder = fallbackUrl.deletingLastPathComponent()
            webView.loadFileURL(fallbackUrl, allowingReadAccessTo: parentFolder)
            return
        }
        
        // 3. Mode développement : connexion au serveur local si actif
        if let localDevUrl = URL(string: "http://localhost:3000") {
            webView.load(URLRequest(url: localDevUrl))
        }
    }
    
    func reload() {
        webView?.reload()
    }
    
    func openFileInWeb(dataUrl: String, filename: String, mimeType: String) {
        let script = "if (window.openNativeFile) { window.openNativeFile('\(dataUrl)', '\(filename)', '\(mimeType)'); }"
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
    
    func exportPDF() {
        let script = "if (window.exportNativePDF) { window.exportNativePDF(); }"
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // Communication de la WebApp vers macOS
        print("Message reçu de l'app web:", message.body)
    }
}

// Wrapper SwiftUI pour WKWebView AppKit
struct MacWebView: NSViewRepresentable {
    @ObservedObject var store: WebViewStore
    
    func makeNSView(context: Context) -> WKWebView {
        return store.setupWebView()
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
