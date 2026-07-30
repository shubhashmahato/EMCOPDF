/**
 * Professional Full Page Viewer Modal Component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Hand,
  Trash2,
  Copy,
  Download,
  Lock,
  Unlock,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PdfPageItem, RotationAngle } from '../../types';
import { PdfService } from '../../services/pdfService';
import { PdfExportService } from '../../services/pdfExportService';

interface FullPageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: PdfPageItem | undefined;
  pages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  onNavigatePage: (pageId: string) => void;
  onRotateCW: (pageId: string) => void;
  onRotateCCW: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onToggleLock: (pageId: string) => void;
  onToggleSelect: (pageId: string) => void;
}

export const FullPageViewer: React.FC<FullPageViewerProps> = ({
  isOpen,
  onClose,
  currentPage,
  pages,
  docBuffersMap,
  onNavigatePage,
  onRotateCW,
  onRotateCCW,
  onDuplicate,
  onDelete,
  onToggleLock,
  onToggleSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentIndex = pages.findIndex(p => p?.id === currentPage?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < pages.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigatePage(pages[currentIndex - 1].id);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [hasPrev, currentIndex, pages, onNavigatePage]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigatePage(pages[currentIndex + 1].id);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [hasNext, currentIndex, pages, onNavigatePage]);

  // Render canvas when page or zoom changes
  useEffect(() => {
    if (!isOpen || !currentPage) return;

    const buffer = docBuffersMap.get(currentPage.docId);
    if (!buffer || !canvasRef.current) return;

    let isMounted = true;
    setIsLoading(true);

    PdfService.renderFullPageToCanvas(
      buffer,
      currentPage.originalPageIndex,
      canvasRef.current,
      currentPage.rotation,
      zoomScale,
      undefined,
      currentPage.docId
    )
      .then(() => {
        if (isMounted) setIsLoading(false);
      })
      .catch(err => {
        console.error('Error rendering full page viewer canvas:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentPage, zoomScale, docBuffersMap]);

  // Keyboard navigation inside viewer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') setZoomScale(z => Math.min(4.0, z + 0.2));
      if (e.key === '-') setZoomScale(z => Math.max(0.4, z - 0.2));
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode || zoomScale > 1.5) {
      setIsDraggingPan(true);
      dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPan) {
      setPanPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPan(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownloadSinglePage = async () => {
    if (!currentPage) return;
    const buffer = docBuffersMap.get(currentPage.docId);
    if (!buffer) return;

    try {
      const pdfBytes = await PdfExportService.exportPagesAsPdf(
        [currentPage],
        new Map([[currentPage.docId, buffer]]),
        {
          filename: `Page_${currentPage.pageNumber}.pdf`,
          mode: 'single_pdf',
          targetPages: 'all',
          compressionQuality: 'low',
          preserveMetadata: true,
          includePageNumbers: false,
        }
      );
      PdfExportService.savePdfFile(pdfBytes, `Page_${currentPage.pageNumber}.pdf`);
    } catch (err) {
      console.error('Download single page error:', err);
    }
  };

  if (!isOpen || !currentPage) return null;

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col select-none"
      >
        {/* Top Controls Header Bar */}
        <div className="flex items-center justify-between px-3 md:px-6 py-2.5 md:py-3 border-b border-white/10 glass-panel">
          {/* Left: Page Title & Meta */}
          <div className="flex items-center gap-2 md:gap-4 text-slate-200 text-xs md:text-sm">
            <span className="font-bold text-white">
              Page {currentPage.pageNumber}/{pages.length}
            </span>
            <span className="text-slate-400 text-xs truncate max-w-xs hidden sm:inline">
              {currentPage.docName}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] md:text-xs font-mono hidden sm:inline">
              {currentPage.dimensions.formatName || `${currentPage.dimensions.width}x${currentPage.dimensions.height}`}
            </span>
            {currentPage.rotation !== 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] md:text-xs font-semibold">
                {currentPage.rotation}°
              </span>
            )}
          </div>

          {/* Center: Zoom & Tool Options */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 md:p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setZoomScale(z => Math.max(0.4, z - 0.2))}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-300 rounded-xl transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5 md:w-4 h-4" />
            </button>

            <span className="text-[11px] md:text-xs font-mono font-semibold px-1 md:px-2 text-slate-200">
              {Math.round(zoomScale * 100)}%
            </span>

            <button
              onClick={() => setZoomScale(z => Math.min(4.0, z + 0.2))}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-300 rounded-xl transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5 md:w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setZoomScale(1.0);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="p-2 hover:bg-white/10 text-slate-300 rounded-xl transition hidden sm:block"
              title="Reset Zoom"
            >
              <span className="text-[11px] font-bold">100%</span>
            </button>

            <div className="w-px h-5 bg-white/15 mx-1 hidden sm:block" />

            <button
              onClick={() => setIsPanMode(!isPanMode)}
              className={`p-2 rounded-xl transition hidden sm:flex ${
                isPanMode ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
              title="Pan Hand Tool"
            >
              <Hand className="w-4 h-4" />
            </button>

            <button
              onClick={() => onRotateCCW(currentPage.id)}
              className="p-2 hover:bg-white/10 text-slate-300 rounded-xl transition hidden sm:flex"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => onRotateCW(currentPage.id)}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-300 rounded-xl transition"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-3.5 h-3.5 md:w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Right: Actions & Close */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => onToggleSelect(currentPage.id)}
              className={`px-2 py-1.5 md:px-3 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
                currentPage.isSelected
                  ? 'bg-blue-500 border-blue-400 text-white'
                  : 'border-white/15 hover:bg-white/10 text-slate-200'
              }`}
            >
              {currentPage.isSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Selected</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Select</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSinglePage}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-200 rounded-xl transition hidden sm:block"
              title="Download Single Page"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => onDuplicate(currentPage.id)}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-200 rounded-xl transition hidden sm:block"
              title="Duplicate Page"
            >
              <Copy className="w-4 h-4 text-indigo-400" />
            </button>

            <button
              onClick={() => onToggleLock(currentPage.id)}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-200 rounded-xl transition hidden sm:block"
              title={currentPage.isLocked ? 'Unlock Page' : 'Lock Page'}
            >
              {currentPage.isLocked ? (
                <Unlock className="w-4 h-4 text-purple-400" />
              ) : (
                <Lock className="w-4 h-4 text-purple-400" />
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 md:p-2 hover:bg-white/10 text-slate-200 rounded-xl transition hidden sm:block"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 md:p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-xl transition border border-rose-500/30 ml-1"
              title="Close Viewer (Esc)"
            >
              <X className="w-4 h-4 md:w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle Main Canvas View Area */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex-1 overflow-auto flex items-center justify-center p-8 ${
            isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* Navigation Overlay Buttons */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-6 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl backdrop-blur transition border border-white/15"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-6 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl backdrop-blur transition border border-white/15"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Canvas Wrapper */}
          <div
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px)`,
              transition: isDraggingPan ? 'none' : 'transform 0.1s ease-out',
            }}
            className="shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white"
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm text-white">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
