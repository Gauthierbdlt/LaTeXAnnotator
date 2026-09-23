import Foundation
import SwiftUI

/// Représente les différents outils disponibles dans la barre d'annotation style Aperçu
public enum AnnotationTool: String, CaseIterable, Identifiable {
    case select = "Sélectionner"
    case pen = "Dessiner"
    case highlight = "Surligner"
    case text = "Texte"
    case latex = "Formule LaTeX"
    case image = "Coller Image"
    case rectangle = "Rectangle"
    case oval = "Ovale"
    case arrow = "Flèche"
    case note = "Note"
    
    public var id: String { rawValue }
    
    public var iconName: String {
        switch self {
        case .select: return "cursorarrow"
        case .pen: return "pencil.tip"
        case .highlight: return "highlighter"
        case .text: return "textformat"
        case .latex: return "function"
        case .image: return "photo.badge.plus"
        case .rectangle: return "square"
        case .oval: return "circle"
        case .arrow: return "arrow.right"
        case .note: return "note.text"
        }
    }
}
