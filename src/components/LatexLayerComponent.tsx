import React, { useState, useRef, useMemo } from 'react';
import { LaTeXAnnotationItem } from '../types';
import katex from 'katex';
import { Edit3, Trash2, Copy, AlertCircle } from 'lucide-react';

interface LatexLayerProps {
  layer: LaTeXAnnotationItem;
  isSelected: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onChange: (updated: Partial<LaTeXAnnotationItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const LatexLayerComponent: React.FC<LatexLayerProps> = ({
  layer,
  isSelected,
  scale,
  onSelect,
  onDoubleClick,
  onChange,
  onDelete,
  onDuplicate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startDimsRef = useRef<{ x: number; y: number; width: number; height: number; fontSize: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontSize: 20,
  });

  // Vector rendering with KaTeX
  const { html, error } = useMemo(() => {
    try {
      const rendered = katex.renderToString(layer.latex, {
        displayMode: true,
        throwOnError: true,
        strict: false,
      });
      return { html: rendered, error: null };
    } catch (err: any) {
      return { html: '', error: err.message };
    }
  }, [layer.latex]);

  const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.stopPropagation();
    onSelect(e);

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startDimsRef.current = {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      fontSize: layer.fontSize,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startPosRef.current.x) / scale;
      const dy = (moveEvent.clientY - startPosRef.current.y) / scale;

      if (!handle) {
        // Drag position
        onChange({
          x: Math.round(startDimsRef.current.x + dx),
          y: Math.round(startDimsRef.current.y + dy),
        });
      } else {
        // Resizing box & scale font size proportionally
        let newWidth = startDimsRef.current.width;
        let newHeight = startDimsRef.current.height;
        let newX = startDimsRef.current.x;
        let newY = startDimsRef.current.y;

        if (handle.includes('e')) newWidth = Math.max(80, startDimsRef.current.width + dx);
        if (handle.includes('s')) newHeight = Math.max(40, startDimsRef.current.height + dy);
        if (handle.includes('w')) {
          const w = Math.max(80, startDimsRef.current.width - dx);
          newX = startDimsRef.current.x + (startDimsRef.current.width - w);
          newWidth = w;
        }
        if (handle.includes('n')) {
          const h = Math.max(40, startDimsRef.current.height - dy);
          newY = startDimsRef.current.y + (startDimsRef.current.height - h);
          newHeight = h;
        }

        const widthRatio = newWidth / startDimsRef.current.width;
        const newFontSize = Math.min(50, Math.max(12, Math.round(startDimsRef.current.fontSize * widthRatio)));

        onChange({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
          fontSize: newFontSize,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isTransparent = !layer.backgroundColor || layer.backgroundColor === 'transparent';

  return (
    <div
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseDown={(e) => handleMouseDown(e, null)}
      style={{
        position: 'absolute',
        left: `${layer.x * scale}px`,
        top: `${layer.y * scale}px`,
        minWidth: `${layer.width * scale}px`,
        minHeight: `${layer.height * scale}px`,
        zIndex: isSelected ? 30 : 15,
        backgroundColor: isTransparent ? 'transparent' : layer.backgroundColor,
        borderColor: isTransparent ? 'transparent' : (layer.borderColor || '#3b82f6'),
        borderWidth: isTransparent ? 0 : (layer.borderWidth ? `${layer.borderWidth * scale}px` : undefined),
      }}
      className={`group select-none cursor-move rounded flex items-center justify-center p-1 transition-all ${
        isSelected 
          ? 'ring-2 ring-[#3b82f6] bg-blue-500/10 shadow-md' 
          : 'hover:ring-1 hover:ring-blue-400/40'
      }`}
    >
      {/* KaTeX Vector Math */}
      {error ? (
        <div className="flex items-center gap-1.5 text-red-500 text-xs font-mono p-1 bg-red-50 rounded">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Erreur LaTeX</span>
        </div>
      ) : (
        <div
          className="katex-rendered-layer pointer-events-none select-none text-center"
          style={{
            fontSize: `${layer.fontSize * scale}px`,
            color: layer.color,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {/* Selected handles & Quick HUD */}
      {isSelected && (
        <>
          {/* 4 Corner Handles */}
          {['nw', 'ne', 'se', 'sw'].map((pos) => {
            let posClass = '';
            let cursor = '';
            switch (pos) {
              case 'nw': posClass = '-top-1.5 -left-1.5'; cursor = 'nwse-resize'; break;
              case 'ne': posClass = '-top-1.5 -right-1.5'; cursor = 'nesw-resize'; break;
              case 'se': posClass = '-bottom-1.5 -right-1.5'; cursor = 'nwse-resize'; break;
              case 'sw': posClass = '-bottom-1.5 -left-1.5'; cursor = 'nesw-resize'; break;
            }

            return (
              <div
                key={pos}
                onMouseDown={(e) => handleMouseDown(e, pos)}
                className={`absolute w-3 h-3 bg-white border-2 border-[#3b82f6] rounded-full shadow-sm z-30 ${posClass}`}
                style={{ cursor }}
              />
            );
          })}

          {/* Quick Actions HUD */}
          <div 
            onMouseDown={(e) => e.stopPropagation()} 
            className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-[#202024]/95 backdrop-blur-md border border-[#44444a] rounded-lg shadow-xl px-2 py-0.5 flex items-center gap-1.5 z-40 text-xs text-gray-200 whitespace-nowrap"
          >
            <button
              onClick={onDoubleClick}
              title="Modifier la formule LaTeX (Double-clic)"
              className="px-1.5 py-0.5 hover:bg-white/10 rounded text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
            >
              <Edit3 className="w-3 h-3" />
              <span>Modifier</span>
            </button>

            <button
              onClick={onDuplicate}
              title="Dupliquer la formule (⌘D)"
              className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
            >
              <Copy className="w-3 h-3" />
            </button>

            <button
              onClick={onDelete}
              title="Supprimer la formule"
              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
