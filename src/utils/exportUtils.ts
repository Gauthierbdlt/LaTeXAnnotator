import { LoadedDocument, AnyAnnotation, LaTeXAnnotationItem, ImageLayerItem } from '../types';
import katex from 'katex';
import { PDFDocument, rgb } from 'pdf-lib';

export async function exportPageToCanvas(
  doc: LoadedDocument,
  pageIndex: number,
  annotations: AnyAnnotation[]
): Promise<HTMLCanvasElement> {
  const page = doc.pages[pageIndex];
  const canvas = document.createElement('canvas');
  // High resolution scale factor (2x for Retina quality)
  const scale = 2;
  canvas.width = page.width * scale;
  canvas.height = page.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.scale(scale, scale);

  // 1. Draw base page
  if (page.canvasImage) {
    const baseImg = await loadImage(page.canvasImage);
    ctx.drawImage(baseImg, 0, 0, page.width, page.height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, page.width, page.height);
  }

  // 2. Draw annotations on this page
  const pageAnnots = annotations.filter(a => a.pageIndex === pageIndex);

  for (const annot of pageAnnots) {
    ctx.save();

    if (annot.type === 'image') {
      const imgLayer = annot as ImageLayerItem;
      try {
        const img = await loadImage(imgLayer.src);
        ctx.globalAlpha = imgLayer.opacity ?? 1;

        if (imgLayer.rotation) {
          ctx.translate(imgLayer.x + imgLayer.width / 2, imgLayer.y + imgLayer.height / 2);
          ctx.rotate((imgLayer.rotation * Math.PI) / 180);
          ctx.translate(-(imgLayer.x + imgLayer.width / 2), -(imgLayer.y + imgLayer.height / 2));
        }

        if (imgLayer.hasShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
        }

        ctx.drawImage(img, imgLayer.x, imgLayer.y, imgLayer.width, imgLayer.height);
      } catch (err) {
        console.error('Failed to draw image layer:', err);
      }
    } else if (annot.type === 'latex') {
      const latexAnnot = annot as LaTeXAnnotationItem;
      // Draw background if any
      if (latexAnnot.backgroundColor && latexAnnot.backgroundColor !== 'transparent') {
        ctx.fillStyle = latexAnnot.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(latexAnnot.x, latexAnnot.y, latexAnnot.width, latexAnnot.height, 6);
        ctx.fill();
      }

      if (latexAnnot.borderColor && (latexAnnot.borderWidth || 0) > 0) {
        ctx.strokeStyle = latexAnnot.borderColor;
        ctx.lineWidth = latexAnnot.borderWidth || 1;
        ctx.beginPath();
        ctx.roundRect(latexAnnot.x, latexAnnot.y, latexAnnot.width, latexAnnot.height, 6);
        ctx.stroke();
      }

      // Render KaTeX HTML into an SVG foreignObject or temporary container image
      try {
        const katexHtml = katex.renderToString(latexAnnot.latex, {
          displayMode: true,
          throwOnError: false,
        });

        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${latexAnnot.width}" height="${latexAnnot.height}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: ${latexAnnot.fontSize}px; color: ${latexAnnot.color}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; font-family: 'KaTeX_Main', serif;">
                <style>
                  @import url('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css');
                </style>
                ${katexHtml}
              </div>
            </foreignObject>
          </svg>
        `;

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const svgImg = await loadImage(svgUrl);
        ctx.drawImage(svgImg, latexAnnot.x, latexAnnot.y, latexAnnot.width, latexAnnot.height);
        URL.revokeObjectURL(svgUrl);
      } catch (e) {
        // Fallback text drawing
        ctx.fillStyle = latexAnnot.color;
        ctx.font = `${latexAnnot.fontSize}px serif`;
        ctx.fillText(latexAnnot.latex, latexAnnot.x + 10, latexAnnot.y + latexAnnot.height / 2 + 5);
      }
    } else if (annot.type === 'shape') {
      ctx.strokeStyle = annot.strokeColor;
      ctx.lineWidth = annot.strokeWidth;
      ctx.fillStyle = annot.fillColor;

      if (annot.strokeStyle === 'dashed') ctx.setLineDash([6, 4]);
      if (annot.strokeStyle === 'dotted') ctx.setLineDash([2, 2]);

      if (annot.shapeType === 'rectangle') {
        if (annot.fillColor && annot.fillColor !== 'transparent') ctx.fillRect(annot.x, annot.y, annot.width, annot.height);
        if (annot.strokeWidth > 0) ctx.strokeRect(annot.x, annot.y, annot.width, annot.height);
      } else if (annot.shapeType === 'rounded-rect') {
        ctx.beginPath();
        ctx.roundRect(annot.x, annot.y, annot.width, annot.height, 10);
        if (annot.fillColor && annot.fillColor !== 'transparent') ctx.fill();
        if (annot.strokeWidth > 0) ctx.stroke();
      } else if (annot.shapeType === 'oval') {
        ctx.beginPath();
        ctx.ellipse(annot.x + annot.width / 2, annot.y + annot.height / 2, Math.abs(annot.width / 2), Math.abs(annot.height / 2), 0, 0, Math.PI * 2);
        if (annot.fillColor && annot.fillColor !== 'transparent') ctx.fill();
        if (annot.strokeWidth > 0) ctx.stroke();
      } else if (annot.shapeType === 'line' || annot.shapeType === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(annot.x, annot.y);
        ctx.lineTo(annot.x + annot.width, annot.y + annot.height);
        ctx.stroke();
      }
    } else if (annot.type === 'pen') {
      if (annot.points && annot.points.length > 1) {
        ctx.strokeStyle = annot.strokeColor;
        ctx.lineWidth = annot.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (annot.isHighlighter) {
          ctx.globalAlpha = 0.4;
        }
        ctx.beginPath();
        ctx.moveTo(annot.points[0].x, annot.points[0].y);
        for (let i = 1; i < annot.points.length; i++) {
          ctx.lineTo(annot.points[i].x, annot.points[i].y);
        }
        ctx.stroke();
      }
    } else if (annot.type === 'text') {
      ctx.fillStyle = annot.color;
      const weight = annot.isBold ? 'bold ' : '';
      const style = annot.isItalic ? 'italic ' : '';
      ctx.font = `${style}${weight}${annot.fontSize}px ${annot.fontFamily || 'sans-serif'}`;
      ctx.fillText(annot.text, annot.x + 4, annot.y + annot.fontSize);
    } else if (annot.type === 'note') {
      // Draw macOS sticky note icon
      ctx.fillStyle = annot.color || '#fef08a';
      ctx.fillRect(annot.x, annot.y, 28, 28);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(annot.x, annot.y, 28, 28);
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('N', annot.x + 8, annot.y + 18);
    }

    ctx.restore();
  }

  return canvas;
}

export async function exportDocumentAsPDF(doc: LoadedDocument, annotations: AnyAnnotation[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const canvas = await exportPageToCanvas(doc, i, annotations);
    const pngDataUrl = canvas.toDataURL('image/png');
    const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    const pdfPage = pdfDoc.addPage([page.width, page.height]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: page.width,
      height: page.height,
    });
  }

  return pdfDoc.save();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
