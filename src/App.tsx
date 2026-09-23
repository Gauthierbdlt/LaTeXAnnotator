import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LoadedDocument, 
  ToolMode, 
  SidebarTab, 
  AnyAnnotation, 
  LaTeXAnnotationItem, 
  ImageLayerItem,
  ShapeAnnotationItem,
  GridMode,
  PageViewMode,
  PenStrokeItem,
  RecentFileItem 
} from './types';
import { createSampleDocument, createInitialAnnotations } from './utils/sampleData';
import { exportDocumentAsPDF, downloadBlob, exportPageToCanvas } from './utils/exportUtils';
import { loadPDFDocument } from './utils/pdfLoader';
import { MenuBar } from './components/MenuBar';
import { WindowHeader } from './components/WindowHeader';
import { MarkupToolbar } from './components/MarkupToolbar';
import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { LatexEditorModal } from './components/LatexEditorModal';
import { InspectorModal } from './components/InspectorModal';
import { CompanionModal } from './components/CompanionModal';
import { CompanionTabletView } from './components/CompanionTabletView';
import { StartScreen } from './components/StartScreen';

const RECENT_FILES_KEY = 'latex_annotate_recent_files';

export const App: React.FC = () => {
  // Document state (starts without demo document so user can open their own files)
  const [doc, setDoc] = useState<LoadedDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isModified, setIsModified] = useState(false);

  // Recent files list in localStorage
  const [recentFiles, setRecentFiles] = useState<RecentFileItem[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_FILES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Annotations state & Undo/Redo history
  const [annotations, setAnnotations] = useState<AnyAnnotation[]>([]);
  const [history, setHistory] = useState<AnyAnnotation[][]>([]);
  const [future, setFuture] = useState<AnyAnnotation[][]>([]);

  // UI Views state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('thumbnails');
  const [isMarkupOpen, setIsMarkupOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMenuBarVisible, setIsMenuBarVisible] = useState(true);
  const [zoom, setZoom] = useState(1.05);

  // Engineering Grid & Note taking features
  const [gridMode, setGridMode] = useState<GridMode>('none');
  const [highlightColor, setHighlightColor] = useState('#fef08a');

  // Dual-screen iPad Companion Sync state
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isCompanionConnected, setIsCompanionConnected] = useState(false);
  const [isCompanionTabletView, setIsCompanionTabletView] = useState(() => 
    typeof window !== 'undefined' && window.location.search.includes('mode=ipad-companion')
  );
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Markup & Tools
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // LaTeX Modal State
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [editingLatexItem, setEditingLatexItem] = useState<LaTeXAnnotationItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time synchronization between MacBook and iPad Companion
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('apercu_dual_device_sync');
      channelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data;
        if (msg?.type === 'ADD_STROKE' && msg.stroke) {
          setAnnotations((prev) => [...prev, msg.stroke]);
          setIsCompanionConnected(true);
          setIsModified(true);
        } else if (msg?.type === 'PAGE_CHANGE' && typeof msg.pageIndex === 'number') {
          setCurrentPage(msg.pageIndex);
        } else if (msg?.type === 'PING') {
          setIsCompanionConnected(true);
          bc?.postMessage({ type: 'PONG' });
        } else if (msg?.type === 'PONG') {
          setIsCompanionConnected(true);
        }
      };
      // Send handshake ping
      bc.postMessage({ type: 'PING' });
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // Cross-tab / Cross-window storage fallback sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'apercu_live_stroke' && e.newValue) {
        try {
          const stroke = JSON.parse(e.newValue);
          setAnnotations((prev) => [...prev, stroke]);
          setIsCompanionConnected(true);
          setIsModified(true);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Push state to Undo history
  const saveSnapshot = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), annotations]);
    setFuture([]);
    setIsModified(true);
  }, [annotations]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [annotations, ...prev]);
    setAnnotations(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }, [history, annotations]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [...prev, annotations]);
    setAnnotations(next);
    setFuture((prev) => prev.slice(1));
  }, [future, annotations]);

  // Annotations CRUD
  const handleAddAnnotation = (annot: AnyAnnotation) => {
    saveSnapshot();
    setAnnotations((prev) => [...prev, annot]);
    setSelectedAnnotationId(annot.id);
  };

  const handleUpdateAnnotation = (id: string, updated: Partial<AnyAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...updated } as AnyAnnotation) : a))
    );
    setIsModified(true);
  };

  const handleDeleteAnnotation = (id: string) => {
    saveSnapshot();
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  const handleDuplicateAnnotation = (id: string) => {
    const item = annotations.find((a) => a.id === id);
    if (!item) return;
    saveSnapshot();
    const copy: AnyAnnotation = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      x: item.x + 20,
      y: item.y + 20,
      createdAt: Date.now(),
    };
    setAnnotations((prev) => [...prev, copy]);
    setSelectedAnnotationId(copy.id);
  };

  const handleBringToFront = (id: string) => {
    const item = annotations.find((a) => a.id === id);
    if (!item) return;
    saveSnapshot();
    setAnnotations((prev) => [...prev.filter((a) => a.id !== id), item]);
  };

  const handleSendToBack = (id: string) => {
    const item = annotations.find((a) => a.id === id);
    if (!item) return;
    saveSnapshot();
    setAnnotations((prev) => [item, ...prev.filter((a) => a.id !== id)]);
  };

  // ★ FEATURE A: Paste / Insert Image Layer ★
  const handlePasteImage = useCallback((dataUrl: string, name?: string, dropX?: number, dropY?: number) => {
    const img = new Image();
    img.onload = () => {
      saveSnapshot();
      const page = doc.pages[currentPage] || doc.pages[0];
      
      // Calculate sensible initial size fitting on page
      let targetW = img.width;
      let targetH = img.height;
      const maxW = page.width * 0.55;
      const maxH = page.height * 0.45;

      if (targetW > maxW || targetH > maxH) {
        const ratio = Math.min(maxW / targetW, maxH / targetH);
        targetW = Math.round(targetW * ratio);
        targetH = Math.round(targetH * ratio);
      }

      const initialX = dropX !== undefined ? Math.round(dropX - targetW / 2) : Math.round((page.width - targetW) / 2);
      const initialY = dropY !== undefined ? Math.round(dropY - targetH / 2) : Math.round((page.height - targetH) / 2);

      const newImageLayer: ImageLayerItem = {
        id: `img-layer-${Date.now()}`,
        pageIndex: currentPage,
        type: 'image',
        src: dataUrl,
        filename: name || 'image.png',
        x: Math.max(10, initialX),
        y: Math.max(10, initialY),
        width: targetW,
        height: targetH,
        naturalWidth: img.width,
        naturalHeight: img.height,
        opacity: 1,
        hasShadow: true,
        createdAt: Date.now(),
      };

      setAnnotations((prev) => [...prev, newImageLayer]);
      setSelectedAnnotationId(newImageLayer.id);
      setActiveTool('select');
    };
    img.src = dataUrl;
  }, [doc, currentPage, saveSnapshot]);

  // Listen to toolbar image insertion event
  useEffect(() => {
    const handleInsertEvent = (e: any) => {
      if (e.detail?.src) {
        handlePasteImage(e.detail.src, e.detail.name);
      }
    };
    window.addEventListener('applet-insert-image', handleInsertEvent);
    return () => window.removeEventListener('applet-insert-image', handleInsertEvent);
  }, [handlePasteImage]);

  // ★ FEATURE B: Save / Insert LaTeX Formula ★
  const handleSaveLatexFormula = (latex: string, fontSize: number, color: string, bgColor: string) => {
    saveSnapshot();
    const page = doc.pages[currentPage] || doc.pages[0];

    if (editingLatexItem) {
      // Update existing item
      handleUpdateAnnotation(editingLatexItem.id, {
        latex,
        fontSize,
        color,
        backgroundColor: bgColor,
      });
      setEditingLatexItem(null);
    } else {
      // Create new LaTeX formula annotation
      const estimatedWidth = Math.min(500, Math.max(160, latex.length * 12));
      const estimatedHeight = Math.max(50, Math.round(fontSize * 2.2));

      const isTrans = !bgColor || bgColor === 'transparent';
      const newLatex: LaTeXAnnotationItem = {
        id: `latex-${Date.now()}`,
        pageIndex: currentPage,
        type: 'latex',
        latex,
        fontSize,
        color,
        backgroundColor: bgColor || 'transparent',
        borderColor: isTrans ? 'transparent' : '#3b82f6',
        borderWidth: isTrans ? 0 : 1,
        x: Math.round((page.width - estimatedWidth) / 2),
        y: Math.round((page.height - estimatedHeight) / 2),
        width: estimatedWidth,
        height: estimatedHeight,
        createdAt: Date.now(),
      };

      setAnnotations((prev) => [...prev, newLatex]);
      setSelectedAnnotationId(newLatex.id);
    }
  };

  // Direct shape insertion from menu or click
  const handleInsertShapeDirectly = (type: 'rectangle' | 'rounded-rect' | 'oval' | 'line' | 'arrow') => {
    saveSnapshot();
    const page = doc.pages[currentPage] || doc.pages[0];
    const defW = type === 'line' || type === 'arrow' ? 180 : 150;
    const defH = type === 'line' || type === 'arrow' ? 36 : 95;
    const newShape: ShapeAnnotationItem = {
      id: `shape-${Date.now()}`,
      pageIndex: currentPage,
      type: 'shape',
      shapeType: type,
      x: Math.round((page.width - defW) / 2),
      y: Math.round((page.height - defH) / 2),
      width: defW,
      height: defH,
      strokeColor: strokeColor === 'transparent' ? '#3b82f6' : strokeColor,
      fillColor: fillColor,
      strokeWidth: strokeWidth,
      strokeStyle: 'solid',
      createdAt: Date.now(),
    };
    setAnnotations((prev) => [...prev, newShape]);
    setSelectedAnnotationId(newShape.id);
  };

  // Open LaTeX editor for an existing item
  const handleEditLatex = (item: LaTeXAnnotationItem) => {
    setEditingLatexItem(item);
    setIsLatexModalOpen(true);
  };

  // Native file export helper using safe chunking
  const sendExportToNative = async (bytes: Uint8Array, defaultFilename: string): Promise<boolean> => {
    const nativeApp = (window as any).webkit?.messageHandlers?.nativeApp;
    if (!nativeApp) return false;

    const chunkSize = 128 * 1024; // 128KB chunks
    const totalChunks = Math.ceil(bytes.length / chunkSize);
    const transferId = 'tx_' + Date.now();

    nativeApp.postMessage({
      action: 'saveFileStart',
      transferId,
      filename: defaultFilename,
      totalChunks,
      totalBytes: bytes.length,
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, bytes.length);
      const slice = bytes.subarray(start, end);
      let binary = '';
      for (let j = 0; j < slice.length; j++) {
        binary += String.fromCharCode(slice[j]);
      }
      const chunkBase64 = btoa(binary);
      nativeApp.postMessage({
        action: 'saveFileChunk',
        transferId,
        chunkIndex: i,
        data: chunkBase64,
      });
    }

    nativeApp.postMessage({
      action: 'saveFileFinish',
      transferId,
    });

    return true;
  };

  // Save / Export Actions
  const handleSavePDF = async () => {
    if (!doc) return;
    try {
      const pdfBytes = await exportDocumentAsPDF(doc, annotations);
      const defaultFilename = `Apercu_${doc.filename.replace(/\.[^/.]+$/, '')}_annote.pdf`;

      if ((window as any).webkit?.messageHandlers?.nativeApp) {
        await sendExportToNative(pdfBytes, defaultFilename);
        setIsModified(false);
        return;
      }

      const blob = new Blob([new Uint8Array(pdfBytes) as any], { type: 'application/pdf' });
      downloadBlob(blob, defaultFilename);
      setIsModified(false);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      alert('Erreur lors de la sauvegarde du document: ' + (err?.message || err));
    }
  };

  const handleExportPNG = async () => {
    if (!doc) return;
    try {
      const canvas = await exportPageToCanvas(doc, currentPage, annotations);
      const defaultFilename = `Apercu_${doc.filename.replace(/\.[^/.]+$/, '')}_page${currentPage + 1}.png`;

      if ((window as any).webkit?.messageHandlers?.nativeApp) {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        await sendExportToNative(bytes, defaultFilename);
        return;
      }

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, defaultFilename);
        }
      });
    } catch (err: any) {
      console.error('Export PNG error:', err);
      alert('Erreur lors de l\'export PNG: ' + (err?.message || err));
    }
  };

  const handlePrint = async () => {
    if (!doc) return;
    try {
      const canvas = await exportPageToCanvas(doc, currentPage, annotations);
      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>Imprimer - ${doc.filename}</title></head><body style="margin:0;display:flex;justify-content:center;"><img src="${dataUrl}" style="max-width:100%;height:auto;" onload="window.print();window.close();"/></body></html>`);
        win.document.close();
      }
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  // Open File (PDF or Image)
  const handleOpenFileClick = () => {
    if ((window as any).webkit?.messageHandlers?.nativeApp) {
      try {
        (window as any).webkit.messageHandlers.nativeApp.postMessage('openFileDialog');
        return;
      } catch (e) {
        console.warn('Native open message failed, falling back to file input:', e);
      }
    }
    fileInputRef.current?.click();
  };

  const updateRecentFiles = (item: RecentFileItem) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f.filename !== item.filename);
      const next = [item, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const processLoadedFile = async (data: ArrayBuffer | string, filename: string, fileSize: number, isImage: boolean) => {
    try {
      if (isImage) {
        const dataUrl = typeof data === 'string' ? data : '';
        const img = new Image();
        img.onload = () => {
          setDoc({
            id: `doc-${Date.now()}`,
            filename,
            fileType: 'image',
            fileSize,
            lastModified: Date.now(),
            pageCount: 1,
            pages: [
              {
                index: 0,
                width: img.width,
                height: img.height,
                title: filename,
                canvasImage: dataUrl,
              },
            ],
          });
          setCurrentPage(0);
          setAnnotations([]);
          setHistory([]);
          setFuture([]);
          setIsModified(false);

          updateRecentFiles({
            id: `rec-${Date.now()}`,
            filename,
            fileType: 'image',
            fileSize,
            lastOpened: Date.now(),
            pageCount: 1,
          });
        };
        img.onerror = (e) => {
          console.error('Image decode error:', e);
          alert(`Impossible d'afficher l'image: ${filename}`);
        };
        img.src = dataUrl;
      } else {
        // PDF document
        let buffer: ArrayBuffer;
        if (typeof data === 'string') {
          const rawBase64 = data.includes(',') ? data.split(',')[1] : data;
          const binaryString = atob(rawBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          buffer = bytes.buffer;
        } else {
          buffer = data;
        }
        const loadedPdf = await loadPDFDocument(buffer, filename, fileSize);
        setDoc(loadedPdf);
        setCurrentPage(0);
        setAnnotations([]);
        setHistory([]);
        setFuture([]);
        setIsModified(false);

        updateRecentFiles({
          id: `rec-${Date.now()}`,
          filename,
          fileType: 'pdf',
          fileSize,
          lastOpened: Date.now(),
          pageCount: loadedPdf.pageCount,
        });
      }
    } catch (err: any) {
      console.error('Failed to load file:', err);
      alert(`Impossible d'ouvrir le document "${filename}": ` + (err?.message || 'Format non reconnu ou fichier corrompu'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImg = file.type.startsWith('image/');
      if (isImg) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          processLoadedFile(loadEvent.target?.result as string, file.name, file.size, true);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          processLoadedFile(loadEvent.target?.result as ArrayBuffer, file.name, file.size, false);
        };
        reader.readAsArrayBuffer(file);
      }
      e.target.value = '';
    }
  };

  // Expose bridge for macOS Xcode native app wrapper
  useEffect(() => {
    (window as any).openNativeFile = (dataUrlOrBase64: string, filename: string, mimeType?: string) => {
      const isImg = (mimeType && mimeType.startsWith('image/')) || /\.(png|jpe?g|webp)$/i.test(filename);
      processLoadedFile(dataUrlOrBase64, filename, dataUrlOrBase64.length, isImg);
    };

    (window as any).exportNativePDF = () => {
      handleSavePDF();
    };

    (window as any).triggerNativeOpenFile = () => {
      handleOpenFileClick();
    };

    (window as any).closeNativeDocument = () => {
      setDoc(null);
    };

    (window as any).loadFromDocScheme = async (url: string, filename: string, mimeType: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const isImg = (mimeType && mimeType.startsWith('image/')) || /\.(png|jpe?g|webp)$/i.test(filename);
        if (isImg) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            processLoadedFile(e.target?.result as string, filename, blob.size, true);
          };
          reader.readAsDataURL(blob);
        } else {
          const arrayBuffer = await response.arrayBuffer();
          await processLoadedFile(arrayBuffer, filename, arrayBuffer.byteLength, false);
        }
      } catch (err: any) {
        console.error('Failed to load from doc scheme:', err);
        alert(`Erreur lors du chargement de "${filename}": ` + (err?.message || err));
      }
    };

    return () => {
      delete (window as any).openNativeFile;
      delete (window as any).exportNativePDF;
      delete (window as any).triggerNativeOpenFile;
      delete (window as any).closeNativeDocument;
      delete (window as any).loadFromDocScheme;
    };
  }, [doc, annotations, currentPage]);

  // Rotate Document Page
  const handleRotateRight = () => {
    // Rotate preview or canvas
    saveSnapshot();
  };

  const handleRotateLeft = () => {
    saveSnapshot();
  };

  // Keyboard Shortcuts (macOS standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleSavePDF();
      } else if (isCmdOrCtrl && e.key === 'w') {
        e.preventDefault();
        setDoc(null);
      } else if (isCmdOrCtrl && e.key === 'o') {
        e.preventDefault();
        handleOpenFileClick();
      } else if (isCmdOrCtrl && e.key === 'i') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(3.0, z + 0.15));
      } else if (isCmdOrCtrl && e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.4, z - 0.15));
      } else if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      } else if (isCmdOrCtrl && e.key === '9') {
        e.preventDefault();
        setZoom(0.85);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'd' && selectedAnnotationId) {
        e.preventDefault();
        handleDuplicateAnnotation(selectedAnnotationId);
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && selectedAnnotationId) {
        // Only if not typing in an input/textarea
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleDeleteAnnotation(selectedAnnotationId);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentPage < doc.pageCount - 1 && (e.target as HTMLElement).tagName !== 'INPUT') {
          setCurrentPage((p) => p + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentPage > 0 && (e.target as HTMLElement).tagName !== 'INPUT') {
          setCurrentPage((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedAnnotationId, currentPage, doc?.pageCount]);

  // If in iPad Companion Tablet Mode (drawing board for Apple Pencil)
  if (isCompanionTabletView && doc) {
    return (
      <CompanionTabletView
        document={doc}
        currentPageIndex={currentPage}
        onPageChange={(idx) => {
          setCurrentPage(idx);
          channelRef.current?.postMessage({ type: 'PAGE_CHANGE', pageIndex: idx });
        }}
        onAddStroke={(stroke) => {
          setAnnotations((prev) => [...prev, stroke]);
          channelRef.current?.postMessage({ type: 'ADD_STROKE', stroke });
          try {
            localStorage.setItem('apercu_live_stroke', JSON.stringify(stroke));
          } catch {}
        }}
        onCloseCompanion={() => setIsCompanionTabletView(false)}
        channel={channelRef.current}
      />
    );
  }

  // If no document is open, show the macOS Start Screen with recent files
  if (!doc) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#1e1e20] text-gray-200 overflow-hidden font-sans select-none">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,image/*"
          className="hidden"
        />

        {isMenuBarVisible && (
          <MenuBar
            onOpenFile={handleOpenFileClick}
            onSavePDF={() => {}}
            onExportPNG={() => {}}
            onPrint={() => {}}
            onUndo={() => {}}
            onRedo={() => {}}
            canUndo={false}
            canRedo={false}
            onPasteImageTrigger={() => {}}
            onInsertLatex={() => {}}
            onRotateLeft={() => {}}
            onRotateRight={() => {}}
            onToggleSidebar={() => {}}
            onToggleInspector={() => {}}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onZoomReset={() => {}}
            onZoomFit={() => {}}
            onNextPage={() => {}}
            onPrevPage={() => {}}
            filename="Aucun document"
          />
        )}

        <StartScreen
          onOpenFile={handleOpenFileClick}
          onOpenSample={() => {
            const sample = createSampleDocument();
            setDoc(sample);
            setCurrentPage(0);
            setAnnotations(createInitialAnnotations());
            setHistory([]);
            setFuture([]);
            setIsModified(false);
          }}
          recentFiles={recentFiles}
          onClearRecentFiles={() => {
            try {
              localStorage.removeItem(RECENT_FILES_KEY);
            } catch {}
            setRecentFiles([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e20] text-gray-200 overflow-hidden font-sans select-none">
      {/* Hidden file picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {/* 1. macOS Top Menu Bar (Can be hidden to switch to clean iPad / Fullscreen view) */}
      {isMenuBarVisible && (
        <MenuBar
          onOpenFile={handleOpenFileClick}
          onSavePDF={handleSavePDF}
          onCloseDocument={() => setDoc(null)}
          onExportPNG={handleExportPNG}
          onPrint={handlePrint}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          onPasteImageTrigger={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const r = new FileReader();
                r.onload = (re) => handlePasteImage(re.target?.result as string, file.name);
                r.readAsDataURL(file);
              }
            };
            input.click();
          }}
          onInsertLatex={() => {
            setEditingLatexItem(null);
            setIsLatexModalOpen(true);
          }}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          onZoomIn={() => setZoom((z) => Math.min(3.0, z + 0.15))}
          onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          onZoomReset={() => setZoom(1.0)}
          onZoomFit={() => setZoom(0.85)}
          onNextPage={() => currentPage < doc.pageCount - 1 && setCurrentPage((p) => p + 1)}
          onPrevPage={() => currentPage > 0 && setCurrentPage((p) => p - 1)}
          filename={doc.filename}
        />
      )}

      {/* 2. macOS Window Title Bar + Standard Toolbar */}
      <WindowHeader
        filename={doc.filename}
        isModified={isModified}
        currentPage={currentPage}
        totalPages={doc.pageCount}
        zoom={zoom}
        isSidebarOpen={isSidebarOpen}
        isMarkupOpen={isMarkupOpen}
        isInspectorOpen={isInspectorOpen}
        isMenuBarVisible={isMenuBarVisible}
        onOpenFile={handleOpenFileClick}
        onSavePDF={handleSavePDF}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleMarkup={() => setIsMarkupOpen((prev) => !prev)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        onToggleMenuBar={() => setIsMenuBarVisible((prev) => !prev)}
        onZoomIn={() => setZoom((z) => Math.min(3.0, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.15))}
        onZoomReset={() => setZoom(1.0)}
        onRotateRight={handleRotateRight}
        onRotateLeft={handleRotateLeft}
      />

      {/* 3. Floating Airy Markup Dock (Collapsible) */}
      {isMarkupOpen && (
        <MarkupToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool);
            if (tool === 'latex') {
              setEditingLatexItem(null);
              setIsLatexModalOpen(true);
            }
          }}
          strokeColor={strokeColor}
          onChangeStrokeColor={setStrokeColor}
          fillColor={fillColor}
          onChangeFillColor={setFillColor}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          highlightColor={highlightColor}
          onChangeHighlightColor={setHighlightColor}
          gridMode={gridMode}
          onChangeGridMode={setGridMode}
          onInsertShapeDirectly={handleInsertShapeDirectly}
          onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          isCompanionConnected={isCompanionConnected}
          onOpenLatexEditor={() => {
            setEditingLatexItem(null);
            setIsLatexModalOpen(true);
          }}
          onInsertImageClick={() => {
            fileInputRef.current?.click();
          }}
        />
      )}

      {/* 4. Main Body: Sidebar + Document Canvas Area (Continuous Vertical Scroll) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            tab={sidebarTab}
            onChangeTab={setSidebarTab}
            document={doc}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
            annotations={annotations}
            onSelectAnnotation={(id) => setSelectedAnnotationId(id)}
            onDeleteAnnotation={handleDeleteAnnotation}
            selectedAnnotationId={selectedAnnotationId}
          />
        )}

        {/* Central Viewport Canvas (Permanent Continuous Scroll) */}
        <CanvasArea
          document={doc}
          currentPage={currentPage}
          zoom={zoom}
          activeTool={activeTool}
          strokeColor={strokeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          highlightColor={highlightColor}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          gridMode={gridMode}
          onPageChange={setCurrentPage}
          onSelectAnnotation={(id) => setSelectedAnnotationId(id)}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onDuplicateAnnotation={handleDuplicateAnnotation}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onAddAnnotation={handleAddAnnotation}
          onEditLatex={handleEditLatex}
          onPasteImage={handlePasteImage}
        />

        {/* Floating macOS Inspector (⌘I) */}
        <InspectorModal
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          document={doc}
          annotations={annotations}
          onDeleteAnnotation={handleDeleteAnnotation}
          onSelectAnnotation={(id) => setSelectedAnnotationId(id)}
          selectedAnnotationId={selectedAnnotationId}
        />
      </div>

      {/* LaTeX Formula Editor Modal */}
      <LatexEditorModal
        isOpen={isLatexModalOpen}
        initialLatex={editingLatexItem?.latex}
        initialFontSize={editingLatexItem?.fontSize}
        initialColor={editingLatexItem?.color}
        initialBgColor={editingLatexItem?.backgroundColor || 'transparent'}
        onSave={handleSaveLatexFormula}
        onClose={() => {
          setIsLatexModalOpen(false);
          setEditingLatexItem(null);
        }}
      />

      {/* iPad Live Companion Sync Modal */}
      <CompanionModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
        onOpenCompanionView={() => setIsCompanionTabletView(true)}
        isCompanionConnected={isCompanionConnected}
      />
    </div>
  );
};
export default App;
