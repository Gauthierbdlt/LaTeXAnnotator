import Foundation
import PDFKit
import AppKit

/// Annotation PDF dédiée au rendu vectoriel d'équations LaTeX
public class LaTeXAnnotation: PDFAnnotation {
    public var latexCode: String
    public var renderedImage: NSImage?
    public var fontSize: CGFloat = 20.0
    public var textColor: NSColor = .black
    public var bgColor: NSColor? = nil // Fond transparent par défaut
    public var isSelected: Bool = false
    
    public init(bounds: CGRect, latex: String, renderedImage: NSImage? = nil) {
        self.latexCode = latex
        self.renderedImage = renderedImage
        super.init(bounds: bounds, forType: .stamp, withProperties: nil)
    }
    
    required init?(coder: NSCoder) {
        self.latexCode = coder.decodeObject(forKey: "latexCode") as? String ?? ""
        self.fontSize = CGFloat(coder.decodeFloat(forKey: "fontSize"))
        super.init(coder: coder)
    }
    
    public override func encode(with coder: NSCoder) {
        super.encode(with: coder)
        coder.encode(latexCode, forKey: "latexCode")
        coder.encode(Float(fontSize), forKey: "fontSize")
    }
    
    public override func draw(with box: PDFDisplayBox, in context: CGContext) {
        super.draw(with: box, in: context)
        
        context.saveGState()
        
        // 1. Fond optionnel
        if let bg = bgColor, bg != .clear {
            context.setFillColor(bg.cgColor)
            let path = CGPath(roundedRect: bounds, cornerWidth: 6, cornerHeight: 6, transform: nil)
            context.addPath(path)
            context.fillPath()
        }
        
        // 2. Dessin de l'image vectorielle KaTeX pré-rendue
        if let image = renderedImage, let cgImg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
            context.draw(cgImg, in: bounds)
        } else {
            // Rendu de secours textuel
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: fontSize),
                .foregroundColor: textColor
            ]
            let str = NSAttributedString(string: latexCode, attributes: attrs)
            str.draw(in: bounds)
        }
        
        // 3. Poignées de sélection macOS
        if isSelected {
            context.setStrokeColor(NSColor.systemBlue.cgColor)
            context.setLineWidth(2.0)
            context.stroke(bounds)
            
            // Poignées circulaires aux 4 coins
            let handleSize: CGFloat = 8.0
            let corners = [
                CGPoint(x: bounds.minX - handleSize/2, y: bounds.minY - handleSize/2),
                CGPoint(x: bounds.maxX - handleSize/2, y: bounds.minY - handleSize/2),
                CGPoint(x: bounds.maxX - handleSize/2, y: bounds.maxY - handleSize/2),
                CGPoint(x: bounds.minX - handleSize/2, y: bounds.maxY - handleSize/2)
            ]
            
            context.setFillColor(NSColor.white.cgColor)
            for pt in corners {
                let rect = CGRect(origin: pt, size: CGSize(width: handleSize, height: handleSize))
                context.fillEllipse(in: rect)
                context.strokeEllipse(in: rect)
            }
        }
        
        context.restoreGState()
    }
}
