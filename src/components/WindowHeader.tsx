import React from 'react';
import { 
  Sidebar as SidebarIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  PenTool, 
  Share2, 
  Info, 
  Search,
  FileText,
  Maximize2,
  FolderOpen,
  Download
} from 'lucide-react';

interface WindowHeaderProps {
  filename: string;
  isModified: boolean;
  currentPage: number;
  totalPages: number;
  zoom: number;
  isSidebarOpen: boolean;
  isMarkupOpen: boolean;
  isInspectorOpen: boolean;
  isMenuBarVisible?: boolean;
  onOpenFile?: () => void;
  onSavePDF?: () => void;
  onToggleSidebar: () => void;
  onToggleMarkup: () => void;
  onToggleInspector: () => void;
  onToggleMenuBar?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onRotateRight: () => void;
  onRotateLeft: () => void;
  onSearchChange?: (val: string) => void;
}

export const WindowHeader: React.FC<WindowHeaderProps> = ({
  filename,
  isModified,
  currentPage,
  totalPages,
  zoom,
  isSidebarOpen,
  isMarkupOpen,
  isInspectorOpen,
  isMenuBarVisible = true,
  onOpenFile,
  onSavePDF,
  onToggleSidebar,
  onToggleMarkup,
  onToggleInspector,
  onToggleMenuBar,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRotateRight,
  onRotateLeft,
  onSearchChange,
}) => {
  return (
    <div className="h-13 bg-[#2d2d30] border-b border-[#1c1c1f] flex items-center justify-between px-3 text-[#dcdcdc] select-none shrink-0 shadow-sm">
      {/* Left section: Traffic lights + Sidebar Toggle + Zoom */}
      <div className="flex items-center gap-3">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2 group mr-2">
          <div 
            title="Fermer" 
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center cursor-default transition-transform hover:scale-105"
          >
            <span className="text-[9px] text-[#700000] font-bold opacity-0 group-hover:opacity-100 leading-none">×</span>
          </div>
          <div 
            title="Placer dans le Dock" 
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center cursor-default transition-transform hover:scale-105"
          >
            <span className="text-[9px] text-[#784d00] font-bold opacity-0 group-hover:opacity-100 leading-none">−</span>
          </div>
          <div 
            title="Activer le mode plein écran" 
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center cursor-default transition-transform hover:scale-105"
          >
            <span className="text-[7px] text-[#004f08] font-bold opacity-0 group-hover:opacity-100 leading-none">▲</span>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Masquer la barre latérale" : "Afficher la barre latérale"}
          className={`h-7 px-2 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${
            isSidebarOpen 
              ? 'bg-[#3b82f6] border-[#2563eb] text-white shadow-inner' 
              : 'bg-[#3a3a3d] border-[#48484d] hover:bg-[#48484d] text-gray-300'
          }`}
        >
          <SidebarIcon className="w-3.5 h-3.5 mr-1.5" />
          <span>Barre latérale</span>
        </button>

        {/* Open Document Button */}
        {onOpenFile && (
          <button
            onClick={onOpenFile}
            title="Ouvrir un document PDF ou Image (⌘O)"
            className="h-7 px-2.5 flex items-center justify-center rounded-md border border-[#48484d] bg-[#3a3a3d] hover:bg-[#48484d] text-gray-200 text-xs font-medium transition-colors active:bg-[#2a2a2d] shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            <span>Ouvrir</span>
          </button>
        )}

        {/* Save Document Button */}
        {onSavePDF && (
          <button
            onClick={onSavePDF}
            title="Enregistrer le document annoté (⌘S)"
            className="h-7 px-2.5 flex items-center justify-center rounded-md border border-[#48484d] bg-[#3a3a3d] hover:bg-[#48484d] text-gray-200 text-xs font-medium transition-colors active:bg-[#2a2a2d] shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Enregistrer</span>
          </button>
        )}

        {/* Zoom Segmented Control */}
        <div className="flex items-center bg-[#3a3a3d] border border-[#48484d] rounded-md overflow-hidden h-7">
          <button
            onClick={onZoomOut}
            title="Zoom arrière (⌘-)"
            className="px-2 h-full hover:bg-[#4a4a4f] text-gray-300 border-r border-[#48484d] flex items-center justify-center active:bg-[#2e2e32]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomReset}
            title="Taille réelle 100% (⌘0)"
            className="px-2.5 h-full text-[11px] font-mono hover:bg-[#4a4a4f] text-gray-300 border-r border-[#48484d] flex items-center justify-center min-w-[50px]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title="Zoom avant (⌘+)"
            className="px-2 h-full hover:bg-[#4a4a4f] text-gray-300 flex items-center justify-center active:bg-[#2e2e32]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center section: Document title proxy icon + Name + Page Indicator */}
      <div className="flex flex-col items-center justify-center max-w-[40%] text-center">
        <div className="flex items-center gap-1.5 font-medium text-xs text-gray-200 truncate">
          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{filename}</span>
          {isModified && (
            <span 
              title="Modifié" 
              className="w-2 h-2 rounded-full bg-gray-400 inline-block shrink-0 ml-0.5" 
            />
          )}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          Page {currentPage + 1} sur {totalPages}
        </div>
      </div>

      {/* Right section: Rotate, Markup toggle, Inspector, Search */}
      <div className="flex items-center gap-2">
        {/* Rotate Left / Right */}
        <div className="flex items-center bg-[#3a3a3d] border border-[#48484d] rounded-md overflow-hidden h-7">
          <button
            onClick={onRotateLeft}
            title="Pivoter à gauche (⌘L)"
            className="px-2 h-full hover:bg-[#4a4a4f] text-gray-300 border-r border-[#48484d] flex items-center justify-center active:bg-[#2e2e32]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRotateRight}
            title="Pivoter à droite (⌘R)"
            className="px-2 h-full hover:bg-[#4a4a4f] text-gray-300 flex items-center justify-center active:bg-[#2e2e32]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* macOS Markup Button (Stylo dans un cercle) */}
        <button
          onClick={onToggleMarkup}
          title={isMarkupOpen ? "Masquer la barre d'outils d'annotation" : "Afficher la barre d'outils d'annotation"}
          className={`h-7 px-2.5 flex items-center gap-1.5 rounded-md border text-xs font-medium transition-colors ${
            isMarkupOpen 
              ? 'bg-[#3b82f6] border-[#2563eb] text-white shadow-sm' 
              : 'bg-[#3a3a3d] border-[#48484d] hover:bg-[#48484d] text-gray-300'
          }`}
        >
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isMarkupOpen ? 'border-white text-white' : 'border-gray-400 text-gray-400'}`}>
            <PenTool className="w-2.5 h-2.5" />
          </div>
          <span>Annoter</span>
        </button>

        {/* Inspector Button (⌘I) */}
        <button
          onClick={onToggleInspector}
          title="Inspecteur (⌘I)"
          className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs transition-colors ${
            isInspectorOpen
              ? 'bg-[#3b82f6] border-[#2563eb] text-white'
              : 'bg-[#3a3a3d] border-[#48484d] hover:bg-[#48484d] text-gray-300'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-gray-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher"
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-7 w-28 focus:w-36 transition-all duration-200 bg-[#212124] border border-[#404045] rounded-md pl-6 pr-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Toggle Menu Bar (Mode iPad / Plein écran) */}
        {onToggleMenuBar && (
          <button
            onClick={onToggleMenuBar}
            title={isMenuBarVisible ? "Masquer la barre de menus (Mode iPad / Épuré)" : "Afficher la barre de menus macOS"}
            className={`h-7 px-2 flex items-center gap-1 rounded-md border text-[11px] font-medium transition-colors ${
              !isMenuBarVisible 
                ? 'bg-purple-600 border-purple-500 text-white' 
                : 'bg-[#3a3a3d] border-[#48484d] hover:bg-[#48484d] text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{isMenuBarVisible ? 'Mode iPad' : 'Mode Mac'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
