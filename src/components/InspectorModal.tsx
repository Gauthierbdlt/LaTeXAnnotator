import React, { useState } from 'react';
import { LoadedDocument, AnyAnnotation } from '../types';
import { X, FileText, Layers, Sliders, Info, Eye, EyeOff, Trash2 } from 'lucide-react';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LoadedDocument;
  annotations: AnyAnnotation[];
  onDeleteAnnotation: (id: string) => void;
  onSelectAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
  document,
  annotations,
  onDeleteAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'layers' | 'adjust'>('general');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-6 z-50 w-80 bg-[#252528]/95 backdrop-blur-xl border border-[#44444a] rounded-xl shadow-2xl flex flex-col overflow-hidden text-gray-200 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Title bar */}
      <div className="h-9 px-3 bg-[#1e1e21] border-b border-[#38383e] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Inspecteur Aperçu</span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#38383e] bg-[#222225] p-1 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'general' ? 'bg-[#3b82f6] text-white font-medium shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Général</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'layers' ? 'bg-[#3b82f6] text-white font-medium shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Calques ({annotations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'adjust' ? 'bg-[#3b82f6] text-white font-medium shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Ajuster</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3 text-xs space-y-3 max-h-96 overflow-y-auto">
        {activeTab === 'general' && (
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Nom du fichier :</span>
              <span className="font-medium text-white max-w-[150px] truncate">{document.filename}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Type de document :</span>
              <span className="text-gray-200 uppercase">{document.fileType} Document</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Taille du fichier :</span>
              <span className="text-gray-200">{(document.fileSize / 1024 / 1024).toFixed(2)} Mo</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Nombre de pages :</span>
              <span className="text-gray-200">{document.pageCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Dimensions :</span>
              <span className="text-gray-200">{document.pages[0]?.width || 640} × {document.pages[0]?.height || 905} pt</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#333338]">
              <span className="text-gray-400">Résolution :</span>
              <span className="text-gray-200">300 ppp (Retina vectoriel)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Dernière modif :</span>
              <span className="text-gray-200">{new Date(document.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-1.5">
            {annotations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Aucun calque ou objet sur ce document.
              </div>
            ) : (
              annotations.map((annot, i) => (
                <div
                  key={annot.id}
                  onClick={() => onSelectAnnotation(annot.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedAnnotationId === annot.id
                      ? 'bg-[#3b82f6]/30 border-blue-500 text-white'
                      : 'bg-[#1b1b1e] border-[#38383f] hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-gray-500 font-mono">#{i + 1}</span>
                    <span className="capitalize font-medium truncate">
                      {annot.type === 'latex' ? 'Formule LaTeX' : annot.type === 'image' ? 'Calque Image' : annot.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(annot.id);
                      }}
                      className="p-1 hover:text-red-400 text-gray-400 transition-colors"
                      title="Supprimer ce calque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'adjust' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Luminosité</span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-gray-700 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Contraste</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-gray-700 rounded"
              />
            </div>

            <button
              onClick={() => { setBrightness(100); setContrast(100); }}
              className="w-full py-1 text-xs text-gray-400 hover:text-white bg-[#333338] hover:bg-[#3f3f46] rounded border border-[#44444a] transition-colors"
            >
              Réinitialiser les réglages
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
