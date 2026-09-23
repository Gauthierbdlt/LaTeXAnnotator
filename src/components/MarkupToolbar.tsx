import React, { useState, useRef, useEffect } from 'react';
import { ToolMode, GridMode } from '../types';
import { 
  MousePointer, 
  Hand,
  Pen, 
  Highlighter, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type, 
  StickyNote, 
  Image as ImageIcon, 
  ChevronDown,
  Grid,
  Tablet,
  Check
} from 'lucide-react';

interface MarkupToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  fillColor: string;
  onChangeFillColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (w: number) => void;
  highlightColor: string;
  onChangeHighlightColor: (color: string) => void;
  onOpenLatexEditor: () => void;
  onInsertImageClick: () => void;
  gridMode?: GridMode;
  onChangeGridMode?: (mode: GridMode) => void;
  onOpenCompanionModal?: () => void;
  isCompanionConnected?: boolean;
  onInsertShapeDirectly?: (type: 'rectangle' | 'rounded-rect' | 'oval' | 'line' | 'arrow') => void;
}

export const MarkupToolbar: React.FC<MarkupToolbarProps> = ({
  activeTool,
  onSelectTool,
  strokeColor,
  onChangeStrokeColor,
  fillColor,
  onChangeFillColor,
  strokeWidth,
  onChangeStrokeWidth,
  highlightColor,
  onChangeHighlightColor,
  onOpenLatexEditor,
  onInsertImageClick,
  gridMode = 'none',
  onChangeGridMode,
  onOpenCompanionModal,
  isCompanionConnected = false,
  onInsertShapeDirectly,
}) => {
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [showGridPicker, setShowGridPicker] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowStrokePicker(false);
        setShowHighlightPicker(false);
        setShowWidthPicker(false);
        setShowGridPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const strokeColors = [
    '#0f172a', '#3b82f6', '#10b981', '#ef4444', 
    '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'
  ];

  const highlightColors = [
    '#fef08a', // Yellow
    '#bbf7d0', // Green
    '#bae6fd', // Blue
    '#fbcfe8', // Pink
    '#fed7aa', // Orange
    '#e9d5ff', // Purple
  ];

  const strokeWidths = [
    { label: 'Fin (1px)', val: 1 },
    { label: 'Normal (2px)', val: 2 },
    { label: 'Moyen (3.5px)', val: 3.5 },
    { label: 'Épais (5px)', val: 5 },
    { label: 'Fort (8px)', val: 8 },
  ];

  const shapesOverview = [
    { id: 'rectangle', title: 'Rectangle', icon: Square },
    { id: 'oval', title: 'Cercle / Ovale', icon: Circle },
    { id: 'arrow', title: 'Flèche', icon: ArrowRight },
    { id: 'line', title: 'Ligne', icon: Minus },
  ] as const;

  return (
    <div className="w-full flex justify-center py-2 px-3 bg-[#131317]/90 backdrop-blur-md border-b border-white/5 select-none z-20 shrink-0">
      {/* Floating Airy Island Dock - Fully responsive, zero horizontal scroll */}
      <div 
        ref={toolbarRef}
        className="flex items-center justify-center flex-wrap gap-2 px-3 py-1.5 bg-[#1a1a21]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-gray-200"
      >
        {/* GROUP 1: Navigation & Main */}
        <div className="flex items-center gap-0.5 bg-[#25252e]/80 p-0.5 rounded-xl border border-white/5">
          <button
            onClick={() => onSelectTool('select')}
            title="Pointeur de sélection (V)"
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTool('hand')}
            title="Main pour naviguer (H)"
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'hand'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 2: Dessin Apple Pencil & Surligneur texte façon Mac */}
        <div className="flex items-center gap-0.5 bg-[#25252e]/80 p-0.5 rounded-xl border border-white/5">
          {/* Dessin icon-only */}
          <button
            onClick={() => onSelectTool('pen')}
            title="Dessin / Crayon fin (P)"
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'pen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
          </button>

          {/* Surligneur de sélection de texte comme sur Mac */}
          <div className="relative flex items-center">
            <button
              onClick={() => onSelectTool(activeTool === 'highlight' ? 'select' : 'highlight')}
              title="Surligneur de texte (sélectionnez du texte sur le PDF comme sur Mac)"
              className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg transition-all ${
                activeTool === 'highlight'
                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <div 
                className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: highlightColor }}
              />
            </button>

            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              title="Couleur du surligneur"
              className="p-1 text-gray-400 hover:text-white"
            >
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showHighlightPicker && (
              <div className="absolute left-0 top-full mt-2 p-2 bg-[#212128]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl z-50 w-36">
                <div className="text-[9px] uppercase font-semibold text-gray-400 mb-1.5 px-1">Surlignage texte</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {highlightColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onChangeHighlightColor(c);
                        setShowHighlightPicker(false);
                      }}
                      className="w-7 h-6 rounded-md border border-black/10 hover:scale-105 transition-transform flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: c }}
                    >
                      {highlightColor === c && <Check className="w-3 h-3 text-gray-800" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 3: FORMES GÉOMÉTRIQUES EN OVERVIEW DIRECT (Toutes visibles d'un coup sans scroll) */}
        <div className="flex items-center gap-0.5 bg-[#25252e]/80 p-0.5 rounded-xl border border-white/5">
          {shapesOverview.map((shape) => {
            const Icon = shape.icon;
            const isSelected = activeTool === shape.id;
            return (
              <button
                key={shape.id}
                onClick={() => {
                  onSelectTool(isSelected ? 'select' : shape.id);
                  if (onInsertShapeDirectly && !isSelected) {
                    onInsertShapeDirectly(shape.id);
                  }
                }}
                title={`${shape.title} (cliquez ou tracez sur la page)`}
                className={`p-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 4: BOUTON LATEX ÉPURÉ (Uniquement le symbole Somme ∑) */}
        <button
          onClick={onOpenLatexEditor}
          title="Insérer une formule mathématique LaTeX vectorielle (⌥⌘L)"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 border border-blue-400/40 text-blue-200 hover:text-white shadow-sm hover:shadow-blue-500/20 hover:scale-105 transition-all"
        >
          <span className="font-serif italic font-bold text-base leading-none text-blue-300 drop-shadow">∑</span>
        </button>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 5: Texte direct sur fichier, Post-it & Image */}
        <div className="flex items-center gap-0.5 bg-[#25252e]/80 p-0.5 rounded-xl border border-white/5">
          <button
            onClick={() => onSelectTool('text')}
            title="Texte d'annotation direct (cliquez sur le PDF pour écrire directement)"
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectTool('note')}
            title="Ajouter un Post-it / Note (N)"
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'note'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onInsertImageClick}
            title="Insérer un schéma ou image"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 6: Style (Couleur de tracé & Épaisseur) */}
        <div className="flex items-center gap-1">
          {/* Couleur de tracé / forme */}
          <div className="relative">
            <button
              onClick={() => setShowStrokePicker(!showStrokePicker)}
              title="Couleur de trait ou texte"
              className="flex items-center gap-1 p-1 rounded-lg bg-[#25252e]/80 border border-white/5 hover:border-white/20 transition-all"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                style={{ backgroundColor: strokeColor === 'transparent' ? '#000000' : strokeColor }}
              />
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>

            {showStrokePicker && (
              <div className="absolute right-0 top-full mt-2 p-2 bg-[#212128]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl z-50 w-36">
                <div className="text-[9px] uppercase font-semibold text-gray-400 mb-1.5 px-1">Couleur</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {strokeColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onChangeStrokeColor(c);
                        setShowStrokePicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform relative flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: c }}
                    >
                      {strokeColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Épaisseur */}
          <div className="relative">
            <button
              onClick={() => setShowWidthPicker(!showWidthPicker)}
              title="Épaisseur de tracé"
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#25252e]/80 border border-white/5 hover:border-white/20 text-xs text-gray-300 transition-all font-mono"
            >
              <span className="text-[11px]">{strokeWidth}px</span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>

            {showWidthPicker && (
              <div className="absolute right-0 top-full mt-2 p-1.5 bg-[#212128]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl z-50 w-40 space-y-0.5">
                <div className="px-2 py-1 text-[9px] uppercase font-semibold text-gray-400 border-b border-white/10 mb-1">
                  Épaisseur
                </div>
                {strokeWidths.map((w) => (
                  <button
                    key={w.val}
                    onClick={() => {
                      onChangeStrokeWidth(w.val);
                      setShowWidthPicker(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors ${
                      strokeWidth === w.val ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{w.label}</span>
                    <div
                      className="w-6 rounded-full bg-current"
                      style={{ height: `${Math.min(5, Math.max(1, w.val))}px` }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* GROUP 7: Grille Ingénieur & iPad */}
        <div className="flex items-center gap-1">
          {/* Grille */}
          <div className="relative">
            <button
              onClick={() => setShowGridPicker(!showGridPicker)}
              title="Grille d'ingénieur"
              className={`p-1.5 rounded-lg border transition-all ${
                gridMode !== 'none'
                  ? 'bg-sky-600/30 border-sky-400/50 text-sky-300'
                  : 'bg-[#25252e]/80 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {showGridPicker && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#212128]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1 text-xs z-50">
                <button
                  onClick={() => { onChangeGridMode?.('none'); setShowGridPicker(false); }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-white/10 ${gridMode === 'none' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                >
                  <span>Sans grille</span>
                  {gridMode === 'none' && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => { onChangeGridMode?.('millimeter'); setShowGridPicker(false); }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-white/10 ${gridMode === 'millimeter' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                >
                  <span>📐 Millimétré</span>
                  {gridMode === 'millimeter' && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => { onChangeGridMode?.('dot'); setShowGridPicker(false); }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-white/10 ${gridMode === 'dot' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                >
                  <span>• À points</span>
                  {gridMode === 'dot' && <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => { onChangeGridMode?.('lines'); setShowGridPicker(false); }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-white/10 ${gridMode === 'lines' ? 'text-blue-400 font-semibold' : 'text-gray-300'}`}
                >
                  <span>≡ Lignes</span>
                  {gridMode === 'lines' && <Check className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* iPad Companion */}
          {onOpenCompanionModal && (
            <button
              onClick={onOpenCompanionModal}
              title="Mode Compagnon iPad pour dessiner à l'Apple Pencil en direct"
              className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-white transition-all relative"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isCompanionConnected ? 'bg-emerald-400' : 'bg-purple-400'}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
