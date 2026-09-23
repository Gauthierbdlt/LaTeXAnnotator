import SwiftUI
import PDFKit

/// Pont SwiftUI pour la vue PDF native macOS
public struct PDFKitView: NSViewRepresentable {
    @Binding public var document: PDFDocument?
    @Binding public var activeTool: AnnotationTool
    public var onLaTeXEditRequested: ((LaTeXAnnotation) -> Void)?
    
    public init(
        document: Binding<PDFDocument?>,
        activeTool: Binding<AnnotationTool>,
        onLaTeXEditRequested: ((LaTeXAnnotation) -> Void)? = nil
    ) {
        self._document = document
        self._activeTool = activeTool
        self.onLaTeXEditRequested = onLaTeXEditRequested
    }
    
    public func makeNSView(context: Context) -> AnnotatablePDFView {
        let pdfView = AnnotatablePDFView()
        pdfView.autoScales = true
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        pdfView.displaysPageBreaks = true
        pdfView.backgroundColor = NSColor(red: 0.12, green: 0.12, blue: 0.13, alpha: 1.0)
        pdfView.onLaTeXEditRequested = onLaTeXEditRequested
        return pdfView
    }
    
    public func updateNSView(_ nsView: AnnotatablePDFView, context: Context) {
        if nsView.document != document {
            nsView.document = document
        }
        nsView.currentTool = activeTool
        nsView.onLaTeXEditRequested = onLaTeXEditRequested
    }
}
