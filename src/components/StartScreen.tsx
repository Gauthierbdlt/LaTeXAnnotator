import React from 'react';
import { 
  FolderOpen, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  Sparkles, 
  Trash2, 
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import { RecentFileItem } from '../types';

interface StartScreenProps {
  onOpenFile: () => void;
  onOpenSample: () => void;
  recentFiles: RecentFileItem[];
  onClearRecentFiles: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onOpenFile,
  onOpenSample,
  recentFiles,
  onClearRecentFiles,
}) => {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Aujourd'hui à ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e20] text-gray-100 overflow-y-auto select-none">
      {/* macOS Window Top Bar */}
      <div className="h-12 bg-[#2d2d30] border-b border-[#18181a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>
        <div className="text-xs font-semibold tracking-wide text-gray-300">
          Aperçu LaTeX • Accueil
        </div>
        <div className="w-14" />
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto p-8 flex flex-col items-center">
        {/* App Hero Badge */}
        <div className="mt-4 mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl border border-blue-400/30">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-gray-900 shadow">
              LaTeX
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Aperçu macOS & Annotations LaTeX
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            Ouvrez n'importe quel PDF ou image de votre Mac, annotez avec de véritables formules mathématiques vectorielles et exportez vos documents.
          </p>
        </div>

        {/* Primary Action Card: Open File Dialog */}
        <div className="w-full max-w-xl bg-[#28282c] border border-[#3e3e46] rounded-xl p-6 shadow-xl flex flex-col items-center mb-8">
          <button
            onClick={onOpenFile}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-lg shadow-lg flex items-center justify-center gap-3 text-base transition-all duration-150 transform active:scale-[0.99] cursor-pointer"
          >
            <FolderOpen className="w-5 h-5" />
            <span>Ouvrir un document sur mon Mac...</span>
            <span className="ml-auto text-xs bg-blue-700/60 px-2 py-0.5 rounded text-blue-200">⌘O</span>
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-gray-500" />
              Glissez-déposez n'importe quel PDF ou image
            </span>
            <span>•</span>
            <button
              onClick={onOpenSample}
              className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ouvrir l'exemple
            </button>
          </div>
        </div>

        {/* Recent Files Section */}
        <div className="w-full max-w-xl flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              Fichiers récents
            </h2>
            {recentFiles.length > 0 && (
              <button
                onClick={onClearRecentFiles}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Effacer
              </button>
            )}
          </div>

          {recentFiles.length === 0 ? (
            <div className="bg-[#242428] border border-[#35353a] rounded-xl p-8 text-center text-gray-500 text-xs">
              Aucun fichier récent. Vos documents ouverts apparaîtront ici pour un accès rapide.
            </div>
          ) : (
            <div className="bg-[#242428] border border-[#35353a] rounded-xl overflow-hidden divide-y divide-[#323238]">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={onOpenFile}
                  className="p-3.5 flex items-center gap-3.5 hover:bg-[#2c2c32] active:bg-[#34343a] transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#303036] border border-[#404048] flex items-center justify-center shrink-0">
                    {file.fileType === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                      {file.filename}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{formatDate(file.lastOpened)}</span>
                      <span>•</span>
                      <span>{file.pageCount} {file.pageCount > 1 ? 'pages' : 'page'}</span>
                      <span>•</span>
                      <span>{formatSize(file.fileSize)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="mt-12 text-center text-[11px] text-gray-500 flex items-center justify-center gap-6">
          <span><kbd className="px-1.5 py-0.5 bg-[#2c2c30] rounded border border-[#3e3e44] text-gray-300">⌘O</kbd> Ouvrir</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#2c2c30] rounded border border-[#3e3e44] text-gray-300">⌘S</kbd> Sauvegarder</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#2c2c30] rounded border border-[#3e3e44] text-gray-300">⌘E</kbd> Exporter PDF</span>
          <span><kbd className="px-1.5 py-0.5 bg-[#2c2c30] rounded border border-[#3e3e44] text-gray-300">L</kbd> Insérer formule LaTeX</span>
        </div>
      </div>
    </div>
  );
};
