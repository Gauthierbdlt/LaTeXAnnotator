import React from 'react';
import { SidebarTab, LoadedDocument, AnyAnnotation } from '../types';
import { LayoutGrid, ListTree, Highlighter, Bookmark, Trash2 } from 'lucide-react';

interface SidebarProps {
  tab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  document: LoadedDocument;
  currentPage: number;
  onSelectPage: (index: number) => void;
  annotations: AnyAnnotation[];
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tab,
  onChangeTab,
  document,
  currentPage,
  onSelectPage,
  annotations,
  onSelectAnnotation,
  onDeleteAnnotation,
  selectedAnnotationId,
}) => {
  return (
    <div className="w-56 bg-[#252528] border-r border-[#1a1a1c] flex flex-col shrink-0 select-none text-xs text-gray-300">
      {/* Sidebar Mode Selector */}
      <div className="p-2 border-b border-[#34343a] flex items-center justify-between">
        <div className="flex w-full bg-[#1b1b1e] p-0.5 rounded-lg border border-[#34343a]">
          <button
            onClick={() => onChangeTab('thumbnails')}
            title="Vignettes (Pages)"
            className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
              tab === 'thumbnails' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeTab('outline')}
            title="Table des matières"
            className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
              tab === 'outline' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeTab('annotations')}
            title="Liste des annotations"
            className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
              tab === 'annotations' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {tab === 'thumbnails' && (
          <div className="space-y-4">
            {document.pages.map((p, idx) => {
              const isSelected = currentPage === idx;
              const countAnnots = annotations.filter(a => a.pageIndex === idx).length;

              return (
                <div 
                  key={p.index} 
                  onClick={() => onSelectPage(idx)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div 
                    className={`relative w-36 aspect-[1/1.414] bg-white rounded shadow-md overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-[#3b82f6] ring-2 ring-blue-500/40 shadow-blue-900/30' : 'border-[#44444a] group-hover:border-gray-400'
                    }`}
                  >
                    {p.canvasImage ? (
                      <img 
                        src={p.canvasImage} 
                        alt={`Page ${idx + 1}`} 
                        className="w-full h-full object-cover pointer-events-none" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Page {idx + 1}
                      </div>
                    )}

                    {countAnnots > 0 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] text-white font-bold shadow">
                        {countAnnots}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${isSelected ? 'text-blue-400 font-semibold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'outline' && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Plan du document
            </div>
            {document.pages.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPage(idx)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                  currentPage === idx ? 'bg-[#3b82f6] text-white font-medium' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <span className="truncate">{p.title || `Section ${idx + 1}`}</span>
                <span className="text-[10px] text-gray-400 ml-2">{idx + 1}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'annotations' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Annotations ({annotations.length})</span>
            </div>

            {annotations.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-6">
                Aucune annotation.<br />
                Utilisez la barre d'outils ou collez une image.
              </div>
            ) : (
              annotations.map((annot) => {
                const isSelected = selectedAnnotationId === annot.id;
                let label = 'Annotation';
                let iconColor = 'text-blue-400';

                if (annot.type === 'latex') {
                  label = `Formule: ${annot.latex.slice(0, 18)}...`;
                  iconColor = 'text-emerald-400';
                } else if (annot.type === 'image') {
                  label = `Calque Image (${Math.round(annot.width)}×${Math.round(annot.height)})`;
                  iconColor = 'text-purple-400';
                } else if (annot.type === 'shape') {
                  label = `Forme: ${annot.shapeType}`;
                  iconColor = 'text-amber-400';
                } else if (annot.type === 'note') {
                  label = `Note: ${annot.text.slice(0, 15)}...`;
                  iconColor = 'text-yellow-400';
                } else if (annot.type === 'text') {
                  label = `Texte: ${annot.text.slice(0, 15)}...`;
                }

                return (
                  <div
                    key={annot.id}
                    onClick={() => {
                      onSelectPage(annot.pageIndex);
                      onSelectAnnotation(annot.id);
                    }}
                    className={`group p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#3b82f6]/20 border-blue-500 text-white'
                        : 'bg-[#1e1e21] border-[#38383f] hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className={`font-medium truncate ${iconColor}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Page {annot.pageIndex + 1}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(annot.id);
                      }}
                      title="Supprimer l'annotation"
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
