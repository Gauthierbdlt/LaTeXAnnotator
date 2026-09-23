import React, { useState, useRef, useEffect } from 'react';
import { Pen, Highlighter, Eraser, RotateCcw, ChevronLeft, ChevronRight, Monitor, CheckCircle2 } from 'lucide-react';
import { PenStrokeItem, Point, LoadedDocument } from '../types';

interface CompanionTabletViewProps {
  document: LoadedDocument;
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onAddStroke: (stroke: PenStrokeItem) => void;
  onCloseCompanion: () => void;
  channel: BroadcastChannel | null;
}

export const CompanionTabletView: React.FC<CompanionTabletViewProps> = ({
  document,
  currentPageIndex,
  onPageChange,
  onAddStroke,
  onCloseCompanion,
  channel,
}) => {
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const page = document.pages[currentPageIndex] || document.pages[0];

  const colors = [
    '#0f172a', // noir encre
    '#2563eb', // bleu bic
    '#dc2626', // rouge correction
    '#16a34a', // vert ingé
    '#9333ea', // violet
    '#f59e0b', // ambre
  ];

  // Draw current strokes on preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw active drawing path
    if (currentPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.strokeStyle = tool === 'highlighter' ? 'rgba(250, 204, 21, 0.45)' : color;
      ctx.lineWidth = tool === 'highlighter' ? 18 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [currentPoints, tool, color, strokeWidth]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getCanvasCoords(e);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasCoords(e);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (currentPoints.length > 1) {
      const stroke: PenStrokeItem = {
        id: `stroke-ipad-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        pageIndex: currentPageIndex,
        type: 'pen',
        points: currentPoints,
        strokeColor: tool === 'highlighter' ? 'rgba(250, 204, 21, 0.4)' : color,
        strokeWidth: tool === 'highlighter' ? 16 : strokeWidth,
        isHighlighter: tool === 'highlighter',
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
        createdAt: Date.now(),
      };

      onAddStroke(stroke);

      // Broadcast immediately to the Mac
      if (channel) {
        channel.postMessage({
          type: 'ADD_STROKE',
          stroke,
        });
      }
    }
    setCurrentPoints([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] text-white flex flex-col select-none touch-none">
      {/* Top iPad Bar */}
      <div className="h-14 px-4 bg-[#1c1c1e] border-b border-[#2e2e32] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCloseCompanion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#38383c] text-xs font-medium text-gray-200 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>Revenir au mode Mac</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>iPad Synchronisé en Direct</span>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2 bg-[#2c2c2e] px-2 py-1 rounded-lg">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-1">
            Page {currentPageIndex + 1} / {document.pages.length}
          </span>
          <button
            onClick={() => onPageChange(Math.min(document.pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === document.pages.length - 1}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-[#0d0d0f]">
        <div 
          className="relative bg-white shadow-2xl rounded-sm overflow-hidden"
          style={{
            width: `${page.width}px`,
            maxWidth: '100%',
            height: `${page.height}px`,
            maxHeight: '100%',
            aspectRatio: `${page.width} / ${page.height}`,
          }}
        >
          {/* Background page canvas image */}
          {page.canvasImage && (
            <img
              src={page.canvasImage}
              alt={`Page ${currentPageIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          )}

          {/* Active drawing surface */}
          <canvas
            ref={canvasRef}
            width={page.width}
            height={page.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* Floating Apple Pencil Style Toolbar at Bottom */}
      <div className="p-3 bg-[#1c1c1e] border-t border-[#2e2e32] flex items-center justify-center gap-4">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-[#2c2c2e] p-1 rounded-xl">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              tool === 'pen' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Pen className="w-4 h-4" />
            <span>Stylet Apple Pencil</span>
          </button>

          <button
            onClick={() => setTool('highlighter')}
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              tool === 'highlighter' ? 'bg-amber-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <span>Surligneur</span>
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-2 bg-[#2c2c2e] px-3 py-1.5 rounded-xl">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c && tool === 'pen' ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#2c2c2e]' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2 bg-[#2c2c2e] px-3 py-1.5 rounded-xl text-xs text-gray-300">
          <span>Épaisseur :</span>
          <input
            type="range"
            min={1}
            max={10}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-20 accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
