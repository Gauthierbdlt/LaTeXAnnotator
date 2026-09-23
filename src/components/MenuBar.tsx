import React, { useState, useEffect, useRef } from 'react';

interface MenuBarProps {
  onOpenFile: () => void;
  onSavePDF: () => void;
  onExportPNG: () => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onPasteImageTrigger: () => void;
  onInsertLatex: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  filename: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenFile,
  onSavePDF,
  onExportPNG,
  onPrint,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPasteImageTrigger,
  onInsertLatex,
  onRotateLeft,
  onRotateRight,
  onToggleSidebar,
  onToggleInspector,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onNextPage,
  onPrevPage,
  filename,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const executeAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div 
      ref={menuBarRef}
      className="h-7 w-full bg-[#1e1e20]/95 backdrop-blur-md text-[#dcdcdc] text-[13px] px-3.5 flex items-center select-none border-b border-[#323236] z-50 shrink-0 font-normal tracking-wide"
    >
      {/* Apple Logo */}
      <div 
        className={`px-2 py-0.5 rounded cursor-default flex items-center justify-center transition-colors ${activeMenu === 'apple' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
        onClick={() => handleMenuClick('apple')}
        onMouseEnter={() => handleMenuHover('apple')}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.5-7.7-11.44-13.99-4.88-7.79-8.87-16.73-11.96-26.8-3.09-10.08-4.64-19.98-4.64-29.71 0-14.42 3.69-26.15 11.08-35.19 7.39-9.04 16.59-13.62 27.6-13.73 5.43 0 11.16 1.48 17.2 4.45 6.04 2.97 9.87 4.51 11.48 4.63 1.41 0 5.48-1.63 12.2-4.9 6.72-3.27 12.44-4.67 17.15-4.21 12.98.87 23.3 5.66 30.98 14.37-11.3 6.84-16.84 16.3-16.63 28.38.22 9.45 3.91 17.39 11.08 23.8 7.17 6.41 15.65 10.05 25.43 10.92-2.17 6.63-4.89 13.59-8.15 20.87zM119.22 31.86c0-7.39 2.66-14.35 7.97-20.87 5.32-6.52 11.79-10.43 19.42-11.74.22 1.09.33 2.17.33 3.26 0 7.39-2.82 14.57-8.47 21.52-5.65 6.96-12.06 10.87-19.25 11.74-.22-1.3-.33-2.61-.33-3.91z" />
        </svg>
      </div>

      {/* Aperçu App Menu */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded font-semibold transition-colors ${activeMenu === 'apercu' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('apercu')}
          onMouseEnter={() => handleMenuHover('apercu')}
        >
          Aperçu
        </button>
        {activeMenu === 'apercu' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>À propos d’Aperçu</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Réglages...</span>
              <span className="text-gray-400">⌘,</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Masquer Aperçu</span>
              <span className="text-gray-400">⌘H</span>
            </button>
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Masquer les autres</span>
              <span className="text-gray-400">⌥⌘H</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Quitter Aperçu</span>
              <span className="text-gray-400">⌘Q</span>
            </button>
          </div>
        )}
      </div>

      {/* Fichier */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'fichier' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('fichier')}
          onMouseEnter={() => handleMenuHover('fichier')}
        >
          Fichier
        </button>
        {activeMenu === 'fichier' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onOpenFile)}
            >
              <span>Ouvrir...</span>
              <span className="text-gray-400">⌘O</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onSavePDF)}
            >
              <span>Enregistrer</span>
              <span className="text-gray-400">⌘S</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onSavePDF)}
            >
              <span>Exporter au format PDF...</span>
              <span className="text-gray-400">⇧⌘S</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onExportPNG)}
            >
              <span>Exporter au format PNG...</span>
              <span className="text-gray-400">⌥⌘E</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onPrint)}
            >
              <span>Imprimer...</span>
              <span className="text-gray-400">⌘P</span>
            </button>
          </div>
        )}
      </div>

      {/* Édition */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'edition' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('edition')}
          onMouseEnter={() => handleMenuHover('edition')}
        >
          Édition
        </button>
        {activeMenu === 'edition' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button 
              disabled={!canUndo}
              className={`w-full text-left px-3 py-1 flex justify-between ${canUndo ? 'hover:bg-[#3b82f6] hover:text-white' : 'text-gray-500 cursor-default'}`}
              onClick={() => canUndo && executeAction(onUndo)}
            >
              <span>Annuler</span>
              <span className="text-gray-400">⌘Z</span>
            </button>
            <button 
              disabled={!canRedo}
              className={`w-full text-left px-3 py-1 flex justify-between ${canRedo ? 'hover:bg-[#3b82f6] hover:text-white' : 'text-gray-500 cursor-default'}`}
              onClick={() => canRedo && executeAction(onRedo)}
            >
              <span>Rétablir</span>
              <span className="text-gray-400">⇧⌘Z</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onPasteImageTrigger)}
            >
              <span>Coller l'image (Presse-papiers)</span>
              <span className="text-gray-400">⌘V</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onInsertLatex)}
            >
              <span>Insérer une formule LaTeX...</span>
              <span className="text-gray-400">⌥⌘L</span>
            </button>
          </div>
        )}
      </div>

      {/* Présentation */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'presentation' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('presentation')}
          onMouseEnter={() => handleMenuHover('presentation')}
        >
          Présentation
        </button>
        {activeMenu === 'presentation' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onToggleSidebar)}
            >
              <span>Barre latérale (Vignettes)</span>
              <span className="text-gray-400">⌥⌘1</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onZoomIn)}
            >
              <span>Zoom avant</span>
              <span className="text-gray-400">⌘+</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onZoomOut)}
            >
              <span>Zoom arrière</span>
              <span className="text-gray-400">⌘-</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onZoomReset)}
            >
              <span>Taille réelle (100%)</span>
              <span className="text-gray-400">⌘0</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onZoomFit)}
            >
              <span>Ajuster à la taille</span>
              <span className="text-gray-400">⌘9</span>
            </button>
          </div>
        )}
      </div>

      {/* Aller */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'aller' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('aller')}
          onMouseEnter={() => handleMenuHover('aller')}
        >
          Aller
        </button>
        {activeMenu === 'aller' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onNextPage)}
            >
              <span>Page suivante</span>
              <span className="text-gray-400">↓</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onPrevPage)}
            >
              <span>Page précédente</span>
              <span className="text-gray-400">↑</span>
            </button>
          </div>
        )}
      </div>

      {/* Outils */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'outils' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('outils')}
          onMouseEnter={() => handleMenuHover('outils')}
        >
          Outils
        </button>
        {activeMenu === 'outils' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onToggleInspector)}
            >
              <span>Afficher l'inspecteur</span>
              <span className="text-gray-400">⌘I</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onRotateLeft)}
            >
              <span>Pivoter vers la gauche</span>
              <span className="text-gray-400">⌘L</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onRotateRight)}
            >
              <span>Pivoter vers la droite</span>
              <span className="text-gray-400">⌘R</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onInsertLatex)}
            >
              <span>Nouvelle annotation LaTeX</span>
              <span className="text-gray-400">⌥⌘L</span>
            </button>
            <button 
              className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between"
              onClick={() => executeAction(onPasteImageTrigger)}
            >
              <span>Coller un calque photo</span>
              <span className="text-gray-400">⌘V</span>
            </button>
          </div>
        )}
      </div>

      {/* Fenêtre */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'fenetre' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('fenetre')}
          onMouseEnter={() => handleMenuHover('fenetre')}
        >
          Fenêtre
        </button>
        {activeMenu === 'fenetre' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Réduire</span>
              <span className="text-gray-400">⌘M</span>
            </button>
            <button className="w-full text-left px-3 py-1 hover:bg-[#3b82f6] hover:text-white flex justify-between">
              <span>Agrandir</span>
            </button>
            <div className="my-1 border-t border-[#38383c]" />
            <div className="px-3 py-1 text-gray-400 truncate">
              ✓ {filename}
            </div>
          </div>
        )}
      </div>

      {/* Aide */}
      <div className="relative">
        <button 
          className={`px-2 py-0.5 rounded transition-colors ${activeMenu === 'aide' ? 'bg-[#3b82f6] text-white' : 'hover:bg-white/10'}`}
          onClick={() => handleMenuClick('aide')}
          onMouseEnter={() => handleMenuHover('aide')}
        >
          Aide
        </button>
        {activeMenu === 'aide' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-[#252528]/95 backdrop-blur-xl border border-[#404044] rounded-lg shadow-2xl py-1 text-[#e0e0e0] text-xs z-50">
            <div className="px-3 py-1.5 font-semibold text-white">
              Aperçu macOS avec LaTeX & Images
            </div>
            <p className="px-3 py-1 text-[11px] text-gray-300 leading-relaxed">
              • Glissez-déposez ou collez (⌘V) n'importe quelle image comme calque déplaçable/redimensionnable.<br/>
              • Cliquez sur l'outil LaTeX (√x) pour éditer et insérer des équations vectorielles en temps réel.
            </p>
          </div>
        )}
      </div>

      {/* Right side system indicators */}
      <div className="ml-auto flex items-center gap-3 text-xs text-gray-400 font-medium">
        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300">
          Aperçu 2026
        </span>
        <span>FR</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
