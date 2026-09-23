import Foundation
import PDFKit
import AppKit

/// Vue PDF personnalisée gérant la sélection, le déplacement, le redimensionnement et le collage d'images
public class AnnotatablePDFView: PDFView {
    public var currentTool: AnnotationTool = .select
    public var onLaTeXEditRequested: ((LaTeXAnnotation) -> Void)?
    
    private var selectedAnnotation: PDFAnnotation?
    private var isDragging = false
    private var dragStartLocation: CGPoint = .zero
    private var annotationInitialBounds: CGRect = .zero
    
    public override init(frame: NSRect) {
        super.init(frame: frame)
        setupDragAndDrop()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupDragAndDrop()
    }
    
    private func setupDragAndDrop() {
        registerForDraggedTypes([.fileURL, .tiff, .png])
    }
    
    // MARK: - Gestion du Collage (⌘V)
    @objc public override func paste(_ sender: Any?) {
        let pasteboard = NSPasteboard.general
        
        // 1. Collage d'image depuis le presse-papiers
        if let image = NSImage(pasteboard: pasteboard) {
            pasteImageOnCurrentPage(image: image)
            return
        }
        
        super.paste(sender)
    }
    
    /// Insère l'image comme calque indépendant au centre de la page active
    public func pasteImageOnCurrentPage(image: NSImage, at point: CGPoint? = nil) {
        guard let page = currentPage else { return }
        
        let pageBounds = page.bounds(for: displayBox)
        
        // Calcul d'une taille proportionnelle raisonnable
        var targetSize = image.size
        let maxSize = CGSize(width: pageBounds.width * 0.5, height: pageBounds.height * 0.4)
        if targetSize.width > maxSize.width || targetSize.height > maxSize.height {
            let scale = min(maxSize.width / targetSize.width, maxSize.height / targetSize.height)
            targetSize = CGSize(width: targetSize.width * scale, height: targetSize.height * scale)
        }
        
        let origin: CGPoint
        if let pt = point {
            origin = CGPoint(x: pt.x - targetSize.width / 2, y: pt.y - targetSize.height / 2)
        } else {
            origin = CGPoint(
                x: (pageBounds.width - targetSize.width) / 2,
                y: (pageBounds.height - targetSize.height) / 2
            )
        }
        
        let bounds = CGRect(origin: origin, size: targetSize)
        let annotation = ImageAnnotation(bounds: bounds, image: image)
        annotation.isSelected = true
        
        page.addAnnotation(annotation)
        self.selectedAnnotation = annotation
        self.needsDisplay = true
    }
    
    // MARK: - Drag and Drop d'images externes
    public override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        return .copy
    }
    
    public override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        let pasteboard = sender.draggingPasteboard
        
        if let image = NSImage(pasteboard: pasteboard) {
            let windowPt = sender.draggingLocation
            let viewPt = convert(windowPt, from: nil)
            guard let page = page(for: viewPt, nearest: true) else { return false }
            let pagePt = convert(viewPt, to: page)
            
            pasteImageOnCurrentPage(image: image, at: pagePt)
            return true
        }
        
        return false
    }
    
    // MARK: - Événements Souris (Sélection, Déplacement & Redimensionnement)
    public override func mouseDown(with event: NSEvent) {
        let location = convert(event.locationInWindow, from: nil)
        guard let page = page(for: location, nearest: true) else {
            super.mouseDown(with: event)
            return
        }
        
        let pagePoint = convert(location, to: page)
        
        // Double-clic sur annotation LaTeX -> ouvre l'éditeur
        if event.clickCount == 2 {
            if let latex = page.annotation(at: pagePoint) as? LaTeXAnnotation {
                onLaTeXEditRequested?(latex)
                return
            }
        }

        // Création directe de formes géométriques si un outil de forme est actif
        if currentTool == .rectangle || currentTool == .oval || currentTool == .arrow {
            let shapeBounds = CGRect(x: pagePoint.x - 70, y: pagePoint.y - 45, width: 140, height: 90)
            let subtype: PDFAnnotationSubtype = currentTool == .oval ? .circle : (currentTool == .arrow ? .line : .square)
            let shape = PDFAnnotation(bounds: shapeBounds, forType: subtype, withProperties: nil)
            shape.color = .systemBlue
            let border = PDFBorder()
            border.lineWidth = 2.5
            shape.border = border
            page.addAnnotation(shape)
            self.selectedAnnotation = shape
            self.needsDisplay = true
            return
        }
        
        if let hit = page.annotation(at: pagePoint) {
            // Sélectionner l'annotation
            if let prev = selectedAnnotation as? ImageAnnotation { prev.isSelected = false }
            if let prev = selectedAnnotation as? LaTeXAnnotation { prev.isSelected = false }
            
            self.selectedAnnotation = hit
            if let img = hit as? ImageAnnotation { img.isSelected = true }
            if let ltx = hit as? LaTeXAnnotation { ltx.isSelected = true }
            
            self.isDragging = true
            self.dragStartLocation = pagePoint
            self.annotationInitialBounds = hit.bounds
            self.needsDisplay = true
            return
        } else {
            // Désélectionner
            if let prev = selectedAnnotation as? ImageAnnotation { prev.isSelected = false }
            if let prev = selectedAnnotation as? LaTeXAnnotation { prev.isSelected = false }
            self.selectedAnnotation = nil
            self.needsDisplay = true
        }
        
        super.mouseDown(with: event)
    }
    
    public override func mouseDragged(with event: NSEvent) {
        if isDragging, let annot = selectedAnnotation, let page = currentPage {
            let location = convert(event.locationInWindow, from: nil)
            let pagePoint = convert(location, to: page)
            
            let dx = pagePoint.x - dragStartLocation.x
            let dy = pagePoint.y - dragStartLocation.y
            
            annot.bounds = CGRect(
                x: annotationInitialBounds.origin.x + dx,
                y: annotationInitialBounds.origin.y + dy,
                width: annotationInitialBounds.width,
                height: annotationInitialBounds.height
            )
            self.needsDisplay = true
            return
        }
        
        super.mouseDragged(with: event)
    }
    
    public override func mouseUp(with event: NSEvent) {
        isDragging = false
        super.mouseUp(with: event)
    }
    
    // Supprimer l'annotation sélectionnée avec Retour arrière
    public override func keyDown(with event: NSEvent) {
        if event.keyCode == 51 || event.keyCode == 117 { // Delete / Backspace
            if let annot = selectedAnnotation, let page = annot.page {
                page.removeAnnotation(annot)
                self.selectedAnnotation = nil
                self.needsDisplay = true
                return
            }
        }
        super.keyDown(with: event)
    }
}
