import React, { useState, useRef, useEffect } from 'react';
import { ImageLayerItem } from '../types';
import { 
  Trash2, 
  Copy, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  Sliders, 
  RotateCw,
  Sun
} from 'lucide-react';

interface ImageLayerProps {
  layer: ImageLayerItem;
  isSelected: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onChange: (updated: Partial<ImageLayerItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const ImageLayerComponent: React.FC<ImageLayerProps> = ({
  layer,
  isSelected,
  scale,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startDimsRef = useRef<{ x: number; y: number; width: number; height: number; rotation: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
  });

  // Handle Drag Move & Resize
  const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.stopPropagation();
    onSelect(e);

    setIsDragging(true);
    setDragHandle(handle);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startDimsRef.current = {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation || 0,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startPosRef.current.x) / scale;
      const dy = (moveEvent.clientY - startPosRef.current.y) / scale;

      if (!handle) {
        // Simple dragging of whole layer
        onChange({
          x: Math.round(startDimsRef.current.x + dx),
          y: Math.round(startDimsRef.current.y + dy),
        });
      } else if (handle === 'rotate') {
        // Rotation handle
        const centerX = (startDimsRef.current.x + startDimsRef.current.width / 2) * scale;
        const centerY = (startDimsRef.current.y + startDimsRef.current.height / 2) * scale;
        const rad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
        let deg = Math.round((rad * 180) / Math.PI) - 90;
        if (moveEvent.shiftKey) {
          deg = Math.round(deg / 15) * 15; // snap to 15 degrees
        }
        onChange({ rotation: deg });
      } else {
        // Resizing with 8 handles
        let newWidth = startDimsRef.current.width;
        let newHeight = startDimsRef.current.height;
        let newX = startDimsRef.current.x;
        let newY = startDimsRef.current.y;
        const aspectRatio = startDimsRef.current.width / startDimsRef.current.height;

        if (handle.includes('e')) newWidth = Math.max(30, startDimsRef.current.width + dx);
        if (handle.includes('s')) newHeight = Math.max(30, startDimsRef.current.height + dy);
        if (handle.includes('w')) {
          const w = Math.max(30, startDimsRef.current.width - dx);
          newX = startDimsRef.current.x + (startDimsRef.current.width - w);
          newWidth = w;
        }
        if (handle.includes('n')) {
          const h = Math.max(30, startDimsRef.current.height - dy);
          newY = startDimsRef.current.y + (startDimsRef.current.height - h);
          newHeight = h;
        }

        // Keep aspect ratio by default (hold Shift to unlock free resize)
        if (!moveEvent.shiftKey && (handle === 'se' || handle === 'sw' || handle === 'ne' || handle === 'nw')) {
          newHeight = newWidth / aspectRatio;
        }

        onChange({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => handleMouseDown(e, null)}
      style={{
        position: 'absolute',
        left: `${layer.x * scale}px`,
        top: `${layer.y * scale}px`,
        width: `${layer.width * scale}px`,
        height: `${layer.height * scale}px`,
        transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        zIndex: isSelected ? 30 : 10,
      }}
      className={`group select-none cursor-move ${isSelected ? 'ring-2 ring-[#3b82f6]' : 'hover:ring-1 hover:ring-blue-400/50'}`}
    >
      {/* Image Content */}
      <img
        src={layer.src}
        alt="Calque collé"
        draggable={false}
        className="w-full h-full object-fill pointer-events-none rounded transition-opacity"
        style={{
          opacity: layer.opacity ?? 1,
          filter: layer.hasShadow ? 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4))' : undefined,
        }}
      />

      {/* macOS Handles when Selected */}
      {isSelected && (
        <>
          {/* 8 Bounding Box Handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((pos) => {
            let posClass = '';
            let cursor = '';

            switch (pos) {
              case 'nw': posClass = '-top-1.5 -left-1.5'; cursor = 'nwse-resize'; break;
              case 'n':  posClass = '-top-1.5 left-1/2 -translate-x-1/2'; cursor = 'ns-resize'; break;
              case 'ne': posClass = '-top-1.5 -right-1.5'; cursor = 'nesw-resize'; break;
              case 'e':  posClass = 'top-1/2 -right-1.5 -translate-y-1/2'; cursor = 'ew-resize'; break;
              case 'se': posClass = '-bottom-1.5 -right-1.5'; cursor = 'nwse-resize'; break;
              case 's':  posClass = '-bottom-1.5 left-1/2 -translate-x-1/2'; cursor = 'ns-resize'; break;
              case 'sw': posClass = '-bottom-1.5 -left-1.5'; cursor = 'nesw-resize'; break;
              case 'w':  posClass = 'top-1/2 -left-1.5 -translate-y-1/2'; cursor = 'ew-resize'; break;
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

          {/* Rotation Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            title="Faire pivoter l'image"
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#3b82f6] rounded-full shadow cursor-grab flex items-center justify-center hover:scale-125 transition-transform z-30"
          >
            <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
            {/* Guide line */}
            <div className="absolute top-4 w-[1px] h-3 bg-[#3b82f6]" />
          </div>

          {/* Quick HUD Bar on Top/Bottom */}
          <div 
            onMouseDown={(e) => e.stopPropagation()} 
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#202024]/95 backdrop-blur-md border border-[#44444a] rounded-lg shadow-xl px-2 py-1 flex items-center gap-2 z-40 text-xs text-gray-200 whitespace-nowrap"
          >
            {/* Opacity slider */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-[#3a3a40]">
              <Sun className="w-3 h-3 text-amber-400" />
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={layer.opacity ?? 1}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                className="w-16 accent-blue-500 h-1 bg-gray-600 rounded cursor-pointer"
                title="Opacité de l'image"
              />
            </div>

            {/* Shadow toggle */}
            <button
              onClick={() => onChange({ hasShadow: !layer.hasShadow })}
              title="Ombre portée"
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${layer.hasShadow ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 text-gray-400'}`}
            >
              Ombre
            </button>

            {/* Layer Reordering */}
            <button
              onClick={onBringToFront}
              title="Mettre au premier plan"
              className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSendToBack}
              title="Mettre à l'arrière-plan"
              className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate */}
            <button
              onClick={onDuplicate}
              title="Dupliquer (⌘D)"
              className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              title="Supprimer (Suppr)"
              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
