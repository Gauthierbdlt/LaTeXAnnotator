import SwiftUI
import PDFKit
import UniformTypeIdentifiers

/// Interface principale macOS clone d'Aperçu (Preview) avec barre d'annotation et support LaTeX/Image
public struct ContentView: View {
    @State private var document: PDFDocument?
    @State private var activeTool: AnnotationTool = .select
    @State private var currentPageIndex: Int = 0
    @State private var isSidebarVisible: Bool = true
    @State private var isMarkupVisible: Bool = true
    @State private var isInspectorVisible: Bool = false
    
    // État de l'éditeur de formule LaTeX
    @State private var showLatexEditor: Bool = false
    @State private var latexInput: String = "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)"
    @State private var latexFontSize: CGFloat = 22.0
    @State private var editingAnnotation: LaTeXAnnotation? = nil
    @State private var isRenderingLatex: Bool = false
    @State private var latexErrorMessage: String? = nil
    
    public init() {}
    
    public var body: some View {
        NavigationSplitView {
            if isSidebarVisible {
                PageSidebarView(document: document, currentPageIndex: $currentPageIndex)
            }
        } detail: {
            VStack(spacing: 0) {
                // Barre d'outils d'annotation style Aperçu
                if isMarkupVisible {
                    MarkupToolbarView(
                        activeTool: $activeTool,
                        onOpenLatex: {
                            editingAnnotation = nil
                            showLatexEditor = true
                        },
                        onPasteImage: {
                            pasteImageFromClipboard()
                        }
                    )
                }
                
                // Visionneuse PDF principale
                PDFKitView(
                    document: $document,
                    activeTool: $activeTool,
                    onLaTeXEditRequested: { annot in
                        editingAnnotation = annot
                        latexInput = annot.latexCode
                        latexFontSize = annot.fontSize
                        showLatexEditor = true
                    }
                )
            }
        }
        .toolbar {
            // Bouton Barre latérale
            ToolbarItem(placement: .navigation) {
                Button(action: { isSidebarVisible.toggle() }) {
                    Image(systemName: "sidebar.leading")
                }
                .help("Afficher ou masquer la barre latérale")
            }
            
            // Titre du document
            ToolbarItem(placement: .principal) {
                VStack(spacing: 2) {
                    Text(document?.documentURL?.lastPathComponent ?? "Sans titre.pdf")
                        .font(.system(size: 13, weight: .semibold))
                    if let doc = document {
                        Text("Page \(currentPageIndex + 1) sur \(doc.pageCount)")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Outil Annoter & Inspecteur
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: { isMarkupVisible.toggle() }) {
                    Image(systemName: isMarkupVisible ? "pencil.tip.crop.circle.fill" : "pencil.tip.crop.circle")
                }
                .help("Barre d'outils d'annotation")
                
                Button(action: { isInspectorVisible.toggle() }) {
                    Image(systemName: "info.circle")
                }
                .help("Afficher l'inspecteur (⌘I)")
            }
        }
        .sheet(isPresented: $showLatexEditor) {
            LatexEditorSheet(
                latexCode: $latexInput,
                fontSize: $latexFontSize,
                errorMessage: $latexErrorMessage,
                onCancel: { showLatexEditor = false },
                onConfirm: {
                    insertOrUpdateLatex()
                    showLatexEditor = false
                }
            )
        }
        .onAppear {
            loadDefaultDocument()
        }
    }
    
    private func loadDefaultDocument() {
        if let url = Bundle.main.url(forResource: "sample", withExtension: "pdf") {
            self.document = PDFDocument(url: url)
        }
    }
    
    private func pasteImageFromClipboard() {
        let pb = NSPasteboard.general
        if let image = NSImage(pasteboard: pb) {
            // Transmis via la vue annotable
        }
    }
    
    private func insertOrUpdateLatex() {
        isRenderingLatex = true
        latexErrorMessage = nil
        
        LaTeXRenderer.shared.render(latex: latexInput) { result in
            DispatchQueue.main.async {
                self.isRenderingLatex = false
                switch result {
                case .success(let renderedImage):
                    if let existing = self.editingAnnotation {
                        existing.latexCode = self.latexInput
                        existing.fontSize = self.latexFontSize
                        existing.renderedImage = renderedImage
                    } else if let doc = self.document, let page = doc.page(at: self.currentPageIndex) {
                        let pageBounds = page.bounds(for: .cropBox)
                        let w = renderedImage.size.width
                        let h = renderedImage.size.height
                        let bounds = CGRect(
                            x: (pageBounds.width - w) / 2,
                            y: (pageBounds.height - h) / 2,
                            width: w,
                            height: h
                        )
                        let annot = LaTeXAnnotation(bounds: bounds, latex: self.latexInput, renderedImage: renderedImage)
                        annot.fontSize = self.latexFontSize
                        page.addAnnotation(annot)
                    }
                case .failure(let err):
                    self.latexErrorMessage = err.localizedDescription
                }
            }
        }
    }
}

/// Barre d'outils d'annotation native macOS
private struct MarkupToolbarView: View {
    @Binding var activeTool: AnnotationTool
    var onOpenLatex: () -> Void
    var onPasteImage: () -> Void
    
    var body: some View {
        HStack(spacing: 8) {
            Picker("Outil", selection: $activeTool) {
                ForEach(AnnotationTool.allCases) { tool in
                    Image(systemName: tool.iconName).tag(tool)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 320)
            
            Divider()
                .frame(height: 18)
            
            // Bouton direct pour l'annotation LaTeX
            Button(action: onOpenLatex) {
                HStack(spacing: 4) {
                    Text("√x").italic().bold()
                    Text("Formule LaTeX")
                }
                .font(.system(size: 11, weight: .medium))
            }
            
            // Bouton direct pour coller une image
            Button(action: onPasteImage) {
                HStack(spacing: 4) {
                    Image(systemName: "photo.badge.plus")
                    Text("Coller Image")
                }
                .font(.system(size: 11, weight: .medium))
            }
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(NSColor.windowBackgroundColor))
        .border(Color(NSColor.separatorColor), width: 0.5)
    }
}

/// Fenêtre modale / Popover pour l'édition de LaTeX
private struct LatexEditorSheet: View {
    @Binding var latexCode: String
    @Binding var fontSize: CGFloat
    @Binding var errorMessage: String?
    var onCancel: () -> Void
    var onConfirm: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Insérer une formule LaTeX")
                .font(.headline)
            
            TextEditor(text: $latexCode)
                .font(.system(.body, design: .monospaced))
                .frame(height: 80)
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.gray.opacity(0.4), lineWidth: 1))
            
            if let error = errorMessage {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            
            HStack {
                Text("Taille : \(Int(fontSize)) pt")
                Slider(value: $fontSize, in: 12...48, step: 1)
            }
            
            HStack {
                Spacer()
                Button("Annuler", action: onCancel)
                Button("Insérer", action: onConfirm)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(18)
        .frame(width: 440)
    }
}
