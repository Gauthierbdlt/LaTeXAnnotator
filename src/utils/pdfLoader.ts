import * as pdfjsLib from 'pdfjs-dist';
// Import worker as local bundled URL through Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentPage, LoadedDocument, TextLine } from '../types';

// Configure local PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export async function loadPDFDocument(fileData: ArrayBuffer | Uint8Array, filename: string, fileSize: number): Promise<LoadedDocument> {
  const loadingTask = pdfjsLib.getDocument({
    data: fileData,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pages: DocumentPage[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // Render at 2x scale for crisp Retina display
    const renderScale = 2.0;
    const viewport = page.getViewport({ scale: renderScale });
    const normalViewport = page.getViewport({ scale: 1.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    }

    // Extract text content for selectable text layer
    const textLines: TextLine[] = [];
    try {
      const textContent = await page.getTextContent();
      for (const item of textContent.items as any[]) {
        if (item.str && item.str.trim()) {
          const x = item.transform[4] / renderScale;
          const y = (viewport.height - item.transform[5]) / renderScale;
          textLines.push({
            text: item.str,
            x: Math.round(x),
            y: Math.round(y - (item.height || 12)),
            fontSize: Math.round(item.height || 12),
            fontFamily: item.fontName || 'sans-serif',
          });
        }
      }
    } catch (e) {
      console.warn('Text content extraction skipped for page', pageNum, e);
    }

    pages.push({
      index: pageNum - 1,
      width: Math.round(normalViewport.width),
      height: Math.round(normalViewport.height),
      title: `Page ${pageNum}`,
      canvasImage: canvas.toDataURL('image/png'),
      textLines,
    });
  }

  return {
    id: `doc-${Date.now()}`,
    filename,
    fileType: 'pdf',
    fileSize,
    lastModified: Date.now(),
    pageCount,
    pages,
  };
}
