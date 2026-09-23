import React, { useRef } from 'react';
import { ShapeAnnotationItem } from '../types';
import { Trash2 } from 'lucide-react';

interface ShapeLayerComponentProps {
  shape: ShapeAnnotationItem;
  scale: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Partial<ShapeAnnotationItem>) => void;
  onDelete: () => void;
}

export const ShapeLayerComponent: React.FC<ShapeLayerComponentProps> = ({
  shape,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: shape.x, initialY: shape.y });

  // Move shape via mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: shape.x,
      initialY: shape.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = (moveEvent.clientX - dragStartRef.current.x) / scale;
      const dy = (moveEvent.clientY - dragStartRef.current.y) / scale;

      onUpdate({
        x: Math.round(dragStartRef.current.initialX + dx),
        y: Math.round(dragStartRef.current.initialY + dy),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize handle dragging (for 2D shapes: rectangle, rounded-rect, oval)
  const handleResizeDown = (e: React.MouseEvent, corner: 'nw' | 'ne' | 'se' | 'sw' | 'e' | 's') => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = shape.x;
    const initialY = shape.y;
    const initialW = shape.width;
    const initialH = shape.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      if (corner === 'se') {
        newW = Math.max(20, initialW + dx);
        newH = Math.max(20, initialH + dy);
      } else if (corner === 'sw') {
        newW = Math.max(20, initialW - dx);
        newX = initialX + (initialW - newW);
        newH = Math.max(20, initialH + dy);
      } else if (corner === 'ne') {
        newW = Math.max(20, initialW + dx);
        newH = Math.max(20, initialH - dy);
        newY = initialY + (initialH - newH);
      } else if (corner === 'nw') {
        newW = Math.max(20, initialW - dx);
        newX = initialX + (initialW - newW);
        newH = Math.max(20, initialH - dy);
        newY = initialY + (initialH - newH);
      } else if (corner === 'e') {
        newW = Math.max(20, initialW + dx);
      } else if (corner === 's') {
        newH = Math.max(20, initialH + dy);
      }

      onUpdate({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const isLineOrArrow = shape.shapeType === 'line' || shape.shapeType === 'arrow';
  const arrowMarkerId = `arrowhead-${shape.id}`;

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${shape.x * scale}px`,
        top: `${shape.y * scale}px`,
        width: `${shape.width * scale}px`,
        height: `${shape.height * scale}px`,
        zIndex: isSelected ? 30 : 15,
      }}
      className={`group select-none cursor-move ${isSelected ? 'ring-1 ring-blue-500/50' : 'hover:ring-1 hover:ring-blue-400/30'}`}
    >
      {/* SVG Shape Graphic */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${shape.width} ${shape.height}`}
        className="overflow-visible pointer-events-none"
      >
        <defs>
          {shape.shapeType === 'arrow' && (
            <marker
              id={arrowMarkerId}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={shape.strokeColor} />
            </marker>
          )}
        </defs>

        {shape.shapeType === 'rectangle' && (
          <rect
            x={shape.strokeWidth / 2}
            y={shape.strokeWidth / 2}
            width={Math.max(1, shape.width - shape.strokeWidth)}
            height={Math.max(1, shape.height - shape.strokeWidth)}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={shape.fillColor === 'transparent' ? 'none' : shape.fillColor}
          />
        )}

        {shape.shapeType === 'rounded-rect' && (
          <rect
            x={shape.strokeWidth / 2}
            y={shape.strokeWidth / 2}
            width={Math.max(1, shape.width - shape.strokeWidth)}
            height={Math.max(1, shape.height - shape.strokeWidth)}
            rx="12"
            ry="12"
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={shape.fillColor === 'transparent' ? 'none' : shape.fillColor}
          />
        )}

        {shape.shapeType === 'oval' && (
          <ellipse
            cx={shape.width / 2}
            cy={shape.height / 2}
            rx={Math.max(1, (shape.width - shape.strokeWidth) / 2)}
            ry={Math.max(1, (shape.height - shape.strokeWidth) / 2)}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            fill={shape.fillColor === 'transparent' ? 'none' : shape.fillColor}
          />
        )}

        {shape.shapeType === 'line' && (
          <line
            x1="4"
            y1={shape.height / 2}
            x2={shape.width - 4}
            y2={shape.height / 2}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
          />
        )}

        {shape.shapeType === 'arrow' && (
          <line
            x1="4"
            y1={shape.height / 2}
            x2={shape.width - 8}
            y2={shape.height / 2}
            stroke={shape.strokeColor}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            markerEnd={`url(#${arrowMarkerId})`}
          />
        )}
      </svg>

      {/* Resize handles & quick action controls when selected */}
      {isSelected && (
        <>
          {/* Top-left */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize shadow-md"
          />
          {/* Top-right */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize shadow-md"
          />
          {/* Bottom-left */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize shadow-md"
          />
          {/* Bottom-right */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize shadow-md"
          />

          {/* Width / Height midpoints */}
          <div
            onMouseDown={(e) => handleResizeDown(e, 'e')}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-blue-500 rounded-sm cursor-ew-resize shadow-sm"
          />
          <div
            onMouseDown={(e) => handleResizeDown(e, 's')}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border border-blue-500 rounded-sm cursor-ns-resize shadow-sm"
          />

          {/* Quick Floating Action: Delete */}
          <div className="absolute -top-8 right-0 flex items-center gap-1 bg-[#1e1e24] border border-white/20 rounded-md px-1.5 py-0.5 shadow-xl backdrop-blur-md">
            <span className="text-[10px] text-gray-300 capitalize font-medium pr-1 border-r border-gray-600">
              {shape.shapeType}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Supprimer la forme (Retour arrière)"
              className="p-1 hover:text-red-400 text-gray-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
