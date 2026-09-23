import Foundation
import WebKit
import AppKit

/// Moteur de rendu LaTeX vectoriel hors écran basé sur KaTeX
public class LaTeXRenderer: NSObject, WKNavigationDelegate {
    public static let shared = LaTeXRenderer()
    
    private var webView: WKWebView!
    private var isReady = false
    private var pendingCompletions: [(Result<NSImage, Error>) -> Void] = []
    
    private override init() {
        super.init()
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 800, height: 400), configuration: config)
        webView.navigationDelegate = self
        
        loadKaTeXEngine()
    }
    
    private func loadKaTeXEngine() {
        let html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
            <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
            <style>
                body { margin: 0; padding: 10px; background: transparent; display: inline-block; }
                #math-output { display: inline-block; font-size: 26px; color: black; }
            </style>
        </head>
        <body>
            <div id="math-output"></div>
            <script>
                function renderMath(latex) {
                    try {
                        const el = document.getElementById('math-output');
                        katex.render(latex, el, { displayMode: true, throwOnError: true });
                        const rect = el.getBoundingClientRect();
                        return JSON.stringify({ success: true, width: rect.width, height: rect.height });
                    } catch (e) {
                        return JSON.stringify({ success: false, error: e.message });
                    }
                }
            </script>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isReady = true
    }
    
    /// Rendu asynchrone d'une chaîne LaTeX en image vectorielle Retina
    public func render(latex: String, completion: @escaping (Result<NSImage, Error>) -> Void) {
        let escaped = latex.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: " ")
        
        let js = "renderMath('\(escaped)')"
        
        webView.evaluateJavaScript(js) { [weak self] result, error in
            guard let self = self else { return }
            
            if let err = error {
                completion(.failure(err))
                return
            }
            
            guard let jsonString = result as? String,
                  let data = jsonString.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "LaTeXRenderer", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])))
                return
            }
            
            if let success = json["success"] as? Bool, success {
                let w = CGFloat(json["width"] as? Double ?? 200.0) + 20.0
                let h = CGFloat(json["height"] as? Double ?? 60.0) + 20.0
                
                // Capture du snapshot vectoriel
                let snapshotConfig = WKSnapshotConfiguration()
                snapshotConfig.rect = CGRect(x: 0, y: 0, width: w, height: h)
                
                self.webView.takeSnapshot(with: snapshotConfig) { image, snapError in
                    if let img = image {
                        completion(.success(img))
                    } else {
                        completion(.failure(snapError ?? NSError(domain: "LaTeXRenderer", code: -2, userInfo: nil)))
                    }
                }
            } else {
                let errMsg = json["error"] as? String ?? "Erreur de syntaxe LaTeX"
                completion(.failure(NSError(domain: "LaTeXRenderer", code: 1, userInfo: [NSLocalizedDescriptionKey: errMsg])))
            }
        }
    }
}
