import React, { useState, useRef, useEffect } from 'react';
import { TextAnnotationItem } from '../types';
import { Trash2 } from 'lucide-react';

interface InlineTextAnnotationProps {
  annotation: TextAnnotationItem;
  scale: number;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Partial<TextAnnotationItem>) => void;
  onDelete: () => void;
}

export const InlineTextAnnotation: React.FC<InlineTextAnnotationProps> = ({
  annotation,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(annotation.text === 'Texte d\'annotation' || annotation.text === '');
  const [currentText, setCurrentText] = useState(annotation.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: annotation.x, initialY: annotation.y });

  useEffect(() => {
    setCurrentText(annotation.text);
  }, [annotation.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (!currentText.trim()) {
      onDelete();
    } else {
      onUpdate({ text: currentText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onUpdate({ text: currentText });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect(e);

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: annotation.x,
      initialY: annotation.y,
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        position: 'absolute',
        left: `${annotation.x * scale}px`,
        top: `${annotation.y * scale}px`,
        zIndex: isSelected || isEditing ? 35 : 20,
      }}
      className={`group select-none ${
        isEditing 
          ? 'cursor-text' 
          : isSelected 
          ? 'cursor-move ring-1.5 ring-blue-500 rounded' 
          : 'cursor-move hover:ring-1 hover:ring-blue-400/40 rounded'
      }`}
    >
      {isEditing ? (
        <div className="relative">
          <textarea
            ref={inputRef}
            value={currentText}
            onChange={(e) => {
              setCurrentText(e.target.value);
              onUpdate({ text: e.target.value });
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={Math.max(1, currentText.split('\n').length)}
            style={{
              fontSize: `${annotation.fontSize * scale}px`,
              color: annotation.color || '#0f172a',
              lineHeight: 1.3,
            }}
            className="bg-white/80 backdrop-blur-xs border border-blue-500 rounded px-1.5 py-0.5 shadow-sm outline-none resize-none font-sans min-w-[120px]"
            placeholder="Écrivez votre texte..."
          />
        </div>
      ) : (
        <div
          style={{
            fontSize: `${annotation.fontSize * scale}px`,
            color: annotation.color || '#0f172a',
            lineHeight: 1.3,
            padding: '2px 4px',
          }}
          className="font-sans font-medium whitespace-pre-wrap select-text"
        >
          {annotation.text || 'Texte vide'}
        </div>
      )}

      {/* Floating delete button when selected */}
      {isSelected && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Supprimer (Retour arrière)"
          className="absolute -top-7 right-0 p-1 bg-[#1e1e24] hover:text-red-400 text-gray-400 rounded border border-white/10 shadow-lg text-[10px] flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
