import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LoadedDocument, 
  ToolMode, 
  AnyAnnotation, 
  ImageLayerItem, 
  LaTeXAnnotationItem,
  ShapeAnnotationItem,
  PenStrokeItem,
  TextAnnotationItem,
  HighlightAnnotationItem,
  Point,
  NoteAnnotationItem,
  GridMode
} from '../types';
import { ImageLayerComponent } from './ImageLayerComponent';
import { LatexLayerComponent } from './LatexLayerComponent';
import { ShapeLayerComponent } from './ShapeLayerComponent';
import { InlineTextAnnotation } from './InlineTextAnnotation';
import { StickyNote, X, Highlighter, Trash2 } from 'lucide-react';

interface CanvasAreaProps {
  document: LoadedDocument;
  currentPage: number;
  zoom: number;
  activeTool: ToolMode;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  highlightColor?: string;
  annotations: AnyAnnotation[];
  selectedAnnotationId: string | null;
  gridMode?: GridMode;
  onPageChange?: (pageIndex: number) => void;
  onSelectAnnotation: (id: string | null) => void;
  onUpdateAnnotation: (id: string, updated: Partial<AnyAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onDuplicateAnnotation: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onAddAnnotation: (annot: AnyAnnotation) => void;
  onEditLatex: (annot: LaTeXAnnotationItem) => void;
  onPasteImage: (dataUrl: string, name?: string, dropX?: number, dropY?: number) => void;
}

interface ShapePreviewData {
  pageIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  minX: number;
  minY: number;
  w: number;
  h: number;
}

interface FloatingHighlightMenuData {
  x: number;
  y: number;
  pageIndex: number;
  rects: { x: number; y: number; width: number; height: number }[];
  text: string;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  document: doc,
  currentPage,
  zoom,
  activeTool,
  strokeColor,
  fillColor,
  strokeWidth,
  highlightColor = '#fef08a',
  annotations,
  selectedAnnotationId,
  gridMode = 'none',
  onPageChange,
  onSelectAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onDuplicateAnnotation,
  onBringToFront,
  onSendToBack,
  onAddAnnotation,
  onEditLatex,
  onPasteImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalScrollRef = useRef(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPageIndex, setDrawingPageIndex] = useState<number>(0);
  const [currentPenStroke, setCurrentPenStroke] = useState<Point[]>([]);
  const [shapePreview, setShapePreview] = useState<ShapePreviewData | null>(null);

  // Floating text selection highlight pill (like macOS Preview)
  const [floatingHighlightMenu, setFloatingHighlightMenu] = useState<FloatingHighlightMenuData | null>(null);

  // Active sticky note modal
  const [activeNoteModal, setActiveNoteModal] = useState<NoteAnnotationItem | null>(null);

  // Scroll to page when currentPage changes externally (e.g. sidebar click)
  useEffect(() => {
    if (!isInternalScrollRef.current) {
      const pageEl = window.document.getElementById(`page-canvas-${currentPage}`);
      if (pageEl && containerRef.current) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    isInternalScrollRef.current = false;
  }, [currentPage]);

  // Handle continuous vertical scroll to update active page in sidebar
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onPageChange) return;

    const containerTop = containerRef.current.getBoundingClientRect().top;
    const midPoint = containerTop + containerRef.current.clientHeight * 0.3;

    let closestPage = 0;
    let minDistance = Infinity;

    doc.pages.forEach((_, idx) => {
      const el = window.document.getElementById(`page-canvas-${idx}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - midPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestPage = idx;
        }
      }
    });

    if (closestPage !== currentPage) {
      isInternalScrollRef.current = true;
      onPageChange(closestPage);
    }
  }, [doc.pages, currentPage, onPageChange]);

  // Convert mouse coordinate relative to unscaled document page
  const getDocPoint = (e: React.MouseEvent, pageEl: HTMLElement): Point => {
    const rect = pageEl.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // Image Drag & Drop onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, pageIndex: number, pageEl: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const pt = getDocPoint(e as any, pageEl);
        onPasteImage(loadEvent.target?.result as string, file.name, pt.x, pt.y);
      };
      reader.readAsDataURL(file);
    }
  };

  // Text selection handler for macOS-like highlighting
  const handleTextLayerMouseUp = (pageIndex: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setFloatingHighlightMenu(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) return;

    const pageEl = window.document.getElementById(`page-canvas-${pageIndex}`);
    if (!pageEl) return;

    const pageRect = pageEl.getBoundingClientRect();
    const rects = clientRects.map((cr) => ({
      x: (cr.left - pageRect.left) / zoom,
      y: (cr.top - pageRect.top) / zoom,
      width: cr.width / zoom,
      height: cr.height / zoom,
    }));

    // If text highlighter tool is active, immediately create highlight like macOS Preview
    if (activeTool === 'highlight') {
      const newHighlight: HighlightAnnotationItem = {
        id: `hl-${Date.now()}`,
        pageIndex,
        type: 'highlight',
        rects,
        color: highlightColor,
        selectedText: sel.toString(),
        x: rects[0].x,
        y: rects[0].y,
        width: rects.reduce((max, r) => Math.max(max, r.x + r.width - rects[0].x), 0),
        height: rects[rects.length - 1].y + rects[rects.length - 1].height - rects[0].y,
        createdAt: Date.now(),
      };
      onAddAnnotation(newHighlight);
      sel.removeAllRanges();
      setFloatingHighlightMenu(null);
    } else {
      // Show macOS floating pill directly near the selection
      const lastRect = clientRects[clientRects.length - 1];
      setFloatingHighlightMenu({
        x: lastRect.right,
        y: lastRect.top - 42,
        pageIndex,
        rects,
        text: sel.toString(),
      });
    }
  };

  const applyFloatingHighlight = (chosenColor: string) => {
    if (!floatingHighlightMenu) return;
    const newHighlight: HighlightAnnotationItem = {
      id: `hl-${Date.now()}`,
      pageIndex: floatingHighlightMenu.pageIndex,
      type: 'highlight',
      rects: floatingHighlightMenu.rects,
      color: chosenColor,
      selectedText: floatingHighlightMenu.text,
      x: floatingHighlightMenu.rects[0].x,
      y: floatingHighlightMenu.rects[0].y,
      width: floatingHighlightMenu.rects.reduce((max, r) => Math.max(max, r.x + r.width - floatingHighlightMenu.rects[0].x), 0),
      height: floatingHighlightMenu.rects[floatingHighlightMenu.rects.length - 1].y + floatingHighlightMenu.rects[floatingHighlightMenu.rects.length - 1].height - floatingHighlightMenu.rects[0].y,
      createdAt: Date.now(),
    };
    onAddAnnotation(newHighlight);
    window.getSelection()?.removeAllRanges();
    setFloatingHighlightMenu(null);
  };

  // Mouse Handlers for Drawing, Shapes, and Inline Text Insertion
  const handleMouseDownOnPage = (e: React.MouseEvent, pageIndex: number) => {
    const pageEl = e.currentTarget as HTMLElement;
    const pt = getDocPoint(e, pageEl);

    // If clicked on canvas background, clear selection
    if (e.target === pageEl || (e.target as HTMLElement).tagName === 'IMG') {
      onSelectAnnotation(null);
      setFloatingHighlightMenu(null);
    }

    setDrawingPageIndex(pageIndex);

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentPenStroke([pt]);
    } else if (['rectangle', 'rounded-rect', 'oval', 'line', 'arrow'].includes(activeTool)) {
      setIsDrawing(true);
      setShapePreview({
        pageIndex,
        startX: pt.x,
        startY: pt.y,
        currentX: pt.x,
        currentY: pt.y,
        minX: pt.x,
        minY: pt.y,
        w: 0,
        h: 0,
      });
    } else if (activeTool === 'text') {
      // Direct on-file inline text insertion!
      const newText: TextAnnotationItem = {
        id: `text-${Date.now()}`,
        pageIndex,
        type: 'text',
        text: 'Nouveau texte',
        fontSize: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: strokeColor === 'transparent' ? '#0f172a' : strokeColor,
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: 160,
        height: 32,
        createdAt: Date.now(),
      };
      onAddAnnotation(newText);
      onSelectAnnotation(newText.id);
    } else if (activeTool === 'note') {
      const newNote: NoteAnnotationItem = {
        id: `note-${Date.now()}`,
        pageIndex,
        type: 'note',
        text: 'Note de cours...',
        color: '#fef08a',
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: 32,
        height: 32,
        createdAt: Date.now(),
        isOpen: true,
      };
      onAddAnnotation(newNote);
      setActiveNoteModal(newNote);
    }
  };

  const handleMouseMoveOnPage = (e: React.MouseEvent, pageIndex: number) => {
    if (!isDrawing || drawingPageIndex !== pageIndex) return;
    const pageEl = e.currentTarget as HTMLElement;
    const pt = getDocPoint(e, pageEl);

    if (activeTool === 'pen') {
      setCurrentPenStroke((prev) => [...prev, pt]);
    } else if (shapePreview) {
      const minX = Math.min(shapePreview.startX, pt.x);
      const minY = Math.min(shapePreview.startY, pt.y);
      const w = Math.abs(pt.x - shapePreview.startX);
      const h = Math.abs(pt.y - shapePreview.startY);
      setShapePreview({
        ...shapePreview,
        currentX: pt.x,
        currentY: pt.y,
        minX,
        minY,
        w,
        h,
      });
    }
  };

  const handleMouseUpOnPage = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'pen' && currentPenStroke.length > 1) {
      const targetPage = doc.pages[drawingPageIndex] || doc.pages[0];
      const newPen: PenStrokeItem = {
        id: `pen-${Date.now()}`,
        pageIndex: drawingPageIndex,
        type: 'pen',
        points: currentPenStroke,
        strokeColor: strokeColor === 'transparent' ? '#000000' : strokeColor,
        strokeWidth: strokeWidth,
        isHighlighter: false,
        x: 0,
        y: 0,
        width: targetPage.width,
        height: targetPage.height,
        createdAt: Date.now(),
      };
      onAddAnnotation(newPen);
      setCurrentPenStroke([]);
    } else if (shapePreview) {
      const isDrag = shapePreview.w > 8 || shapePreview.h > 8;
      const finalX = isDrag ? shapePreview.minX : shapePreview.startX - 65;
      const finalY = isDrag ? shapePreview.minY : shapePreview.startY - 35;
      const finalW = isDrag 
        ? Math.max(16, shapePreview.w) 
        : (activeTool === 'line' || activeTool === 'arrow' ? 160 : 130);
      const finalH = isDrag 
        ? Math.max(12, shapePreview.h) 
        : (activeTool === 'line' || activeTool === 'arrow' ? 32 : 80);

      const newShape: ShapeAnnotationItem = {
        id: `shape-${Date.now()}`,
        pageIndex: drawingPageIndex,
        type: 'shape',
        shapeType: activeTool as any,
        x: Math.round(finalX),
        y: Math.round(finalY),
        width: Math.round(finalW),
        height: Math.round(finalH),
        strokeColor: strokeColor === 'transparent' ? '#3b82f6' : strokeColor,
        fillColor: fillColor,
        strokeWidth: strokeWidth,
        strokeStyle: 'solid',
        createdAt: Date.now(),
      };

      onAddAnnotation(newShape);
      onSelectAnnotation(newShape.id);
      setShapePreview(null);
    }
  };

  // Render individual page inside continuous scroll
  const renderPage = (page: typeof doc.pages[0], pageIdx: number) => {
    const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIdx);
    const isCurrent = pageIdx === currentPage;

    return (
      <div
        key={page.index}
        id={`page-canvas-${pageIdx}`}
        onMouseDown={(e) => handleMouseDownOnPage(e, pageIdx)}
        onMouseMove={(e) => handleMouseMoveOnPage(e, pageIdx)}
        onMouseUp={handleMouseUpOnPage}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, pageIdx, e.currentTarget)}
        style={{
          width: `${page.width * zoom}px`,
          height: `${page.height * zoom}px`,
        }}
        className={`relative bg-white shadow-[0_16px_48px_rgba(0,0,0,0.55)] rounded-sm select-none transition-shadow ${
          isCurrent ? 'ring-2 ring-blue-500/30' : ''
        }`}
      >
        {/* Page counter tag */}
        <div className="absolute top-2 right-2 text-[10px] font-mono text-gray-500 bg-gray-100/90 px-1.5 py-0.5 rounded border border-gray-200 pointer-events-none z-10">
          Page {pageIdx + 1} / {doc.pageCount}
        </div>

        {/* Base rendered PDF canvas image */}
        {page.canvasImage ? (
          <img
            src={page.canvasImage}
            alt={`Page ${pageIdx + 1}`}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
            Page {pageIdx + 1}
          </div>
        )}

        {/* Transparent Selectable Text Layer (Like Apple Preview) */}
        {page.textLines && page.textLines.length > 0 && (
          <div 
            onMouseUp={() => handleTextLayerMouseUp(pageIdx)}
            className={`absolute inset-0 select-text overflow-hidden z-[6] ${
              activeTool === 'highlight' ? 'cursor-text' : 'pointer-events-auto'
            }`}
          >
            {page.textLines.map((line, lineIdx) => (
              <div
                key={lineIdx}
                style={{
                  position: 'absolute',
                  left: `${line.x * zoom}px`,
                  top: `${line.y * zoom}px`,
                  fontSize: `${line.fontSize * zoom}px`,
                  fontWeight: line.fontWeight as any || 'normal',
                  fontFamily: line.fontFamily || 'Georgia, serif',
                  color: 'transparent',
                  lineHeight: 1.15,
                }}
                className="select-text whitespace-nowrap cursor-text"
              >
                {line.text}
              </div>
            ))}
          </div>
        )}

        {/* Rendered Text Highlight Annotations (Native macOS multiply style) */}
        {pageAnnotations
          .filter((a) => a.type === 'highlight')
          .map((hl) => {
            const h = hl as HighlightAnnotationItem;
            return (
              <div
                key={h.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnnotation(h.id);
                }}
                className="group absolute z-[4] cursor-pointer"
              >
                {h.rects.map((r, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      position: 'absolute',
                      left: `${r.x * zoom}px`,
                      top: `${r.y * zoom}px`,
                      width: `${r.width * zoom}px`,
                      height: `${r.height * zoom}px`,
                      backgroundColor: h.color || '#fef08a',
                      mixBlendMode: 'multiply',
                      opacity: 0.68,
                    }}
                    className="rounded-xs hover:opacity-90 transition-opacity"
                  />
                ))}

                {/* Quick delete on hover/select */}
                {selectedAnnotationId === h.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(h.id);
                    }}
                    style={{
                      left: `${h.rects[0].x * zoom}px`,
                      top: `${Math.max(0, (h.rects[0].y - 24) * zoom)}px`,
                    }}
                    className="absolute z-50 px-2 py-0.5 bg-[#1c1c20] text-red-400 border border-white/10 rounded-md text-[10px] shadow-lg flex items-center gap-1 hover:bg-red-950"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Supprimer surlignage</span>
                  </button>
                )}
              </div>
            );
          })}

        {/* Engineering Grid Overlay */}
        {gridMode !== 'none' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80 z-[2]">
            <defs>
              {gridMode === 'millimeter' && (
                <>
                  <pattern id={`smallGrid-${pageIdx}`} width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#38bdf8" strokeWidth="0.4" opacity="0.3" />
                  </pattern>
                  <pattern id={`grid-${pageIdx}`} width="50" height="50" patternUnits="userSpaceOnUse">
                    <rect width="50" height="50" fill={`url(#smallGrid-${pageIdx})`} />
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#0284c7" strokeWidth="0.9" opacity="0.45" />
                  </pattern>
                </>
              )}
              {gridMode === 'dot' && (
                <pattern id={`dotGrid-${pageIdx}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#64748b" opacity="0.5" />
                </pattern>
              )}
              {gridMode === 'lines' && (
                <pattern id={`lineGrid-${pageIdx}`} width="100%" height="26" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="25" x2="100%" y2="25" stroke="#94a3b8" strokeWidth="0.8" opacity="0.4" />
                </pattern>
              )}
            </defs>
            <rect 
              width="100%" 
              height="100%" 
              fill={
                gridMode === 'millimeter' 
                  ? `url(#grid-${pageIdx})` 
                  : gridMode === 'dot' 
                  ? `url(#dotGrid-${pageIdx})` 
                  : `url(#lineGrid-${pageIdx})`
              } 
            />
          </svg>
        )}

        {/* SVG Drawing Layer: Pen strokes & live shape preview */}
        <svg
          className="absolute inset-0 pointer-events-none z-[5]"
          width="100%"
          height="100%"
          viewBox={`0 0 ${page.width} ${page.height}`}
        >
          {/* Saved pen strokes */}
          {pageAnnotations
            .filter((a) => a.type === 'pen')
            .map((pen: any) => {
              if (!pen.points || pen.points.length < 2) return null;
              const d = pen.points.reduce(
                (acc: string, pt: Point, i: number) =>
                  i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
                ''
              );
              return (
                <path
                  key={pen.id}
                  d={d}
                  fill="none"
                  stroke={pen.strokeColor}
                  strokeWidth={pen.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

          {/* Current Live Pen Stroke */}
          {isDrawing && drawingPageIndex === pageIdx && currentPenStroke.length > 1 && (
            <path
              d={currentPenStroke.reduce(
                (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                ''
              )}
              fill="none"
              stroke={strokeColor === 'transparent' ? '#000000' : strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Live Shape Preview while dragging */}
          {isDrawing && shapePreview && shapePreview.pageIndex === pageIdx && (
            <>
              {activeTool === 'oval' ? (
                <ellipse
                  cx={shapePreview.minX + shapePreview.w / 2}
                  cy={shapePreview.minY + shapePreview.h / 2}
                  rx={Math.max(1, shapePreview.w / 2)}
                  ry={Math.max(1, shapePreview.h / 2)}
                  fill={fillColor === 'transparent' ? 'none' : fillColor}
                  stroke={strokeColor === 'transparent' ? '#3b82f6' : strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 2"
                />
              ) : activeTool === 'line' || activeTool === 'arrow' ? (
                <line
                  x1={shapePreview.startX}
                  y1={shapePreview.startY}
                  x2={shapePreview.currentX}
                  y2={shapePreview.currentY}
                  stroke={strokeColor === 'transparent' ? '#3b82f6' : strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 2"
                />
              ) : (
                <rect
                  x={shapePreview.minX}
                  y={shapePreview.minY}
                  width={shapePreview.w}
                  height={shapePreview.h}
                  rx={activeTool === 'rounded-rect' ? 12 : 0}
                  fill={fillColor === 'transparent' ? 'none' : fillColor}
                  stroke={strokeColor === 'transparent' ? '#3b82f6' : strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 2"
                />
              )}
            </>
          )}
        </svg>

        {/* Interactive Shape Layer Items (Rectangle, Oval, Line, Arrow) */}
        {pageAnnotations
          .filter((a) => a.type === 'shape')
          .map((shape) => (
            <ShapeLayerComponent
              key={shape.id}
              shape={shape as ShapeAnnotationItem}
              scale={zoom}
              isSelected={selectedAnnotationId === shape.id}
              onSelect={(e) => {
                e.stopPropagation();
                onSelectAnnotation(shape.id);
              }}
              onUpdate={(updated) => onUpdateAnnotation(shape.id, updated)}
              onDelete={() => onDeleteAnnotation(shape.id)}
            />
          ))}

        {/* Interactive LaTeX Formula Layers */}
        {pageAnnotations
          .filter((a) => a.type === 'latex')
          .map((latexItem) => (
            <LatexLayerComponent
              key={latexItem.id}
              layer={latexItem as LaTeXAnnotationItem}
              scale={zoom}
              isSelected={selectedAnnotationId === latexItem.id}
              onSelect={(e) => {
                e.stopPropagation();
                onSelectAnnotation(latexItem.id);
              }}
              onDoubleClick={() => onEditLatex(latexItem as LaTeXAnnotationItem)}
              onChange={(updated: Partial<LaTeXAnnotationItem>) => onUpdateAnnotation(latexItem.id, updated)}
              onDelete={() => onDeleteAnnotation(latexItem.id)}
              onDuplicate={() => onDuplicateAnnotation(latexItem.id)}
            />
          ))}

        {/* Interactive Image Layers */}
        {pageAnnotations
          .filter((a) => a.type === 'image')
          .map((imageItem) => (
            <ImageLayerComponent
              key={imageItem.id}
              layer={imageItem as ImageLayerItem}
              scale={zoom}
              isSelected={selectedAnnotationId === imageItem.id}
              onSelect={(e) => {
                e.stopPropagation();
                onSelectAnnotation(imageItem.id);
              }}
              onChange={(updated: Partial<ImageLayerItem>) => onUpdateAnnotation(imageItem.id, updated)}
              onDelete={() => onDeleteAnnotation(imageItem.id)}
              onDuplicate={() => onDuplicateAnnotation(imageItem.id)}
              onBringToFront={() => onBringToFront(imageItem.id)}
              onSendToBack={() => onSendToBack(imageItem.id)}
            />
          ))}

        {/* Direct on-file editable Text Annotations */}
        {pageAnnotations
          .filter((a) => a.type === 'text')
          .map((textItem) => (
            <InlineTextAnnotation
              key={textItem.id}
              annotation={textItem as TextAnnotationItem}
              scale={zoom}
              isSelected={selectedAnnotationId === textItem.id}
              onSelect={(e) => {
                e.stopPropagation();
                onSelectAnnotation(textItem.id);
              }}
              onUpdate={(updated) => onUpdateAnnotation(textItem.id, updated)}
              onDelete={() => onDeleteAnnotation(textItem.id)}
            />
          ))}

        {/* Sticky Notes */}
        {pageAnnotations
          .filter((a) => a.type === 'note')
          .map((noteItem: any) => (
            <div
              key={noteItem.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAnnotation(noteItem.id);
                setActiveNoteModal(noteItem);
              }}
              style={{
                position: 'absolute',
                left: `${noteItem.x * zoom}px`,
                top: `${noteItem.y * zoom}px`,
                zIndex: 25,
              }}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              <div 
                className="w-7 h-7 rounded shadow-md border flex items-center justify-center"
                style={{ backgroundColor: noteItem.color || '#fef08a' }}
              >
                <StickyNote className="w-4 h-4 text-amber-900" />
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-auto bg-[#1c1c20] p-6 flex flex-col items-center select-none ${
        activeTool === 'hand' 
          ? 'cursor-grab active:cursor-grabbing' 
          : activeTool === 'pen' 
          ? 'cursor-crosshair' 
          : activeTool === 'highlight'
          ? 'cursor-text'
          : 'cursor-default'
      }`}
    >
      {/* Continuous Vertical Scroll Layout */}
      <div className="flex flex-col items-center space-y-8 py-6">
        {doc.pages.map((page, index) => renderPage(page, index))}
      </div>

      {/* Floating macOS Text Selection Highlight Menu */}
      {floatingHighlightMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.max(20, floatingHighlightMenu.x - 70)}px`,
            top: `${Math.max(60, floatingHighlightMenu.y)}px`,
            zIndex: 100,
          }}
          className="flex items-center gap-1.5 p-1.5 bg-[#1e1e24]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 pl-1 pr-1.5 text-xs text-amber-300 font-medium border-r border-white/10">
            <Highlighter className="w-3 h-3" />
            <span>Surligner</span>
          </div>

          <div className="flex items-center gap-1">
            {['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8'].map((c) => (
              <button
                key={c}
                onClick={() => applyFloatingHighlight(c)}
                title="Surligner dans cette couleur"
                className="w-5 h-5 rounded-full border border-black/20 hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            onClick={() => setFloatingHighlightMenu(null)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sticky Note Popover Modal */}
      {activeNoteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
          onClick={() => setActiveNoteModal(null)}
        >
          <div 
            className="w-80 bg-amber-100 border border-amber-300 rounded-xl shadow-2xl p-4 text-gray-900 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Note d'annotation</span>
              </div>
              <button 
                onClick={() => setActiveNoteModal(null)}
                className="p-1 hover:bg-amber-200 rounded text-amber-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              autoFocus
              value={activeNoteModal.text}
              onChange={(e) => {
                const newText = e.target.value;
                setActiveNoteModal({ ...activeNoteModal, text: newText });
                onUpdateAnnotation(activeNoteModal.id, { text: newText });
              }}
              rows={4}
              className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none resize-none font-sans"
              placeholder="Écrivez votre commentaire..."
            />

            <div className="flex justify-between items-center pt-2 border-t border-amber-200 mt-2 text-xs">
              <button
                onClick={() => {
                  onDeleteAnnotation(activeNoteModal.id);
                  setActiveNoteModal(null);
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Supprimer
              </button>
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-3 py-1 bg-amber-800 text-white rounded-md hover:bg-amber-900 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
