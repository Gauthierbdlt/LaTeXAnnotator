import Foundation
import PDFKit
import AppKit

/// Calque d'image indépendant superposé sur le document PDF
public class ImageAnnotation: PDFAnnotation {
    public var image: NSImage
    public var opacity: CGFloat = 1.0
    public var isSelected: Bool = false
    public var rotationAngle: CGFloat = 0.0 // en degrés
    
    public init(bounds: CGRect, image: NSImage) {
        self.image = image
        super.init(bounds: bounds, forType: .stamp, withProperties: nil)
    }
    
    required init?(coder: NSCoder) {
        if let data = coder.decodeObject(forKey: "imageData") as? Data,
           let img = NSImage(data: data) {
            self.image = img
        } else {
            self.image = NSImage()
        }
        self.opacity = CGFloat(coder.decodeFloat(forKey: "opacity"))
        super.init(coder: coder)
    }
    
    public override func encode(with coder: NSCoder) {
        super.encode(with: coder)
        if let tiff = image.tiffRepresentation {
            coder.encode(tiff, forKey: "imageData")
        }
        coder.encode(Float(opacity), forKey: "opacity")
    }
    
    public override func draw(with box: PDFDisplayBox, in context: CGContext) {
        super.draw(with: box, in: context)
        
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            return
        }
        
        context.saveGState()
        context.setAlpha(opacity)
        
        // Rotation autour du centre du calque
        if rotationAngle != 0 {
            let midX = bounds.midX
            let midY = bounds.midY
            context.translateBy(x: midX, y: midY)
            context.rotate(by: rotationAngle * .pi / 180.0)
            context.translateBy(x: -midX, y: -midY)
        }
        
        // Dessin de l'image
        context.draw(cgImage, in: bounds)
        
        // Cadre de sélection macOS actif
        if isSelected {
            context.setStrokeColor(NSColor.systemBlue.cgColor)
            context.setLineWidth(2.0)
            context.stroke(bounds)
            
            // 8 Poignées de redimensionnement
            let handleSize: CGFloat = 8.0
            let pts = [
                CGPoint(x: bounds.minX - handleSize/2, y: bounds.minY - handleSize/2),
                CGPoint(x: bounds.midX - handleSize/2, y: bounds.minY - handleSize/2),
                CGPoint(x: bounds.maxX - handleSize/2, y: bounds.minY - handleSize/2),
                CGPoint(x: bounds.maxX - handleSize/2, y: bounds.midY - handleSize/2),
                CGPoint(x: bounds.maxX - handleSize/2, y: bounds.maxY - handleSize/2),
                CGPoint(x: bounds.midX - handleSize/2, y: bounds.maxY - handleSize/2),
                CGPoint(x: bounds.minX - handleSize/2, y: bounds.maxY - handleSize/2),
                CGPoint(x: bounds.minX - handleSize/2, y: bounds.midY - handleSize/2)
            ]
            
            context.setFillColor(NSColor.white.cgColor)
            for pt in pts {
                let rect = CGRect(origin: pt, size: CGSize(width: handleSize, height: handleSize))
                context.fillEllipse(in: rect)
                context.strokeEllipse(in: rect)
            }
        }
        
        context.restoreGState()
    }
}
