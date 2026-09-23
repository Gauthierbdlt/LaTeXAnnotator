import SwiftUI
import PDFKit

/// Barre latérale style Aperçu avec vignettes des pages
public struct PageSidebarView: View {
    public var document: PDFDocument?
    @Binding public var currentPageIndex: Int
    
    public init(document: PDFDocument?, currentPageIndex: Binding<Int>) {
        self.document = document
        self._currentPageIndex = currentPageIndex
    }
    
    public var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if let doc = document {
                    ForEach(0..<doc.pageCount, id: \.self) { index in
                        if let page = doc.page(at: index) {
                            PageThumbnailCell(
                                page: page,
                                pageNumber: index + 1,
                                isSelected: currentPageIndex == index
                            )
                            .onTapGesture {
                                currentPageIndex = index
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 12)
        }
        .frame(minWidth: 140, idealWidth: 160, maxWidth: 220)
        .background(Color(NSColor.controlBackgroundColor))
    }
}

private struct PageThumbnailCell: View {
    let page: PDFPage
    let pageNumber: Int
    let isSelected: Bool
    
    var body: some View {
        VStack(spacing: 6) {
            Image(nsImage: page.thumbnail(of: CGSize(width: 130, height: 170), for: .cropBox))
                .resizable()
                .scaledToFit()
                .frame(width: 120, height: 160)
                .background(Color.white)
                .cornerRadius(4)
                .shadow(color: Color.black.opacity(0.2), radius: 3, x: 0, y: 2)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(isSelected ? Color.accentColor : Color.gray.opacity(0.3), lineWidth: isSelected ? 2.5 : 1)
                )
            
            Text("\(pageNumber)")
                .font(.system(size: 11, weight: isSelected ? .bold : .regular))
                .foregroundColor(isSelected ? .accentColor : .secondary)
        }
    }
}
