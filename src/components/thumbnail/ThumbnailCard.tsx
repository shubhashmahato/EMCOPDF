/**
 * High Performance PDF Page Thumbnail Card Component - Screenshot Layout
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import { motion } from 'motion/react';
import {
  RotateCw,
  Scissors,
  Eye,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { PdfPageItem, AppSettings } from '../../types';
import { PdfService } from '../../services/pdfService';

interface ThumbnailCardProps {
  page: PdfPageItem;
  docBuffer: ArrayBuffer | undefined;
  docColor?: string;
  settings: AppSettings;
  onToggleSelect: (pageId: string, e?: React.MouseEvent) => void;
  onRotateCW: (pageId: string) => void;
  onToggleDelete: (pageId: string) => void;
  onToggleSplit: (pageId: string) => void;
  onPreview: (pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
  // Drag and drop props
  isDragging?: boolean;
  dragHandleProps?: Record<string, any>;
  setNodeRef?: (element: HTMLElement | null) => void;
  dragStyle?: React.CSSProperties;
}

export const ThumbnailCard: React.FC<ThumbnailCardProps> = memo(({
  page,
  docBuffer,
  docColor = '#3B82F6',
  settings,
  onToggleSelect,
  onRotateCW,
  onToggleDelete,
  onToggleSplit,
  onPreview,
  onContextMenu,
  isDragging = false,
  dragHandleProps,
  setNodeRef,
  dragStyle,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(page.thumbnailDataUrl || null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState<boolean>(!page.thumbnailDataUrl);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid triggering if clicked on any interactive elements (buttons, checkbox, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onToggleSelect(page.id, e);
  };

  // Lazy Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Render thumbnail when visible
  useEffect(() => {
    if (!isVisible || !docBuffer) return;

    let isMounted = true;
    setIsLoadingThumbnail(true);

    const scaleMap = {
      fast: 0.6,
      balanced: 0.9,
      high: 1.3,
    };
    const scale = scaleMap[settings.renderQuality] || 0.9;

    PdfService.renderThumbnailDataUrl(docBuffer, page.originalPageIndex, page.rotation, scale, undefined, page.docId)
      .then(url => {
        if (isMounted) {
          setDataUrl(url);
          setIsLoadingThumbnail(false);
        }
      })
      .catch(err => {
        console.error(`Error rendering page ${page.pageNumber}:`, err);
        if (isMounted) setIsLoadingThumbnail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isVisible, docBuffer, page.originalPageIndex, page.rotation, settings.renderQuality, page.docId]);

  const cardSizes = {
    sm: 'w-[43vw] h-[58vw] max-w-[176px] sm:w-44 sm:h-60',
    md: 'w-[45vw] h-[60vw] max-w-[224px] sm:w-56 sm:h-72',
    lg: 'w-[47vw] h-[62vw] max-w-[272px] sm:w-68 sm:h-84',
    xl: 'w-[49vw] h-[64vw] max-w-[320px] sm:w-80 sm:h-96',
  };

  const combinedRef = (node: HTMLDivElement | null) => {
    cardRef.current = node;
    if (setNodeRef) setNodeRef(node);
  };

  return (
    <motion.div
      ref={combinedRef}
      style={dragStyle}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      layoutId={page.id}
      onContextMenu={e => onContextMenu(e, page.id)}
      onClick={handleCardClick}
      className={`group relative flex flex-col rounded-xl sm:rounded-2xl border transition-all duration-200 select-none bg-white dark:bg-slate-900 cursor-pointer ${
        cardSizes[settings.thumbnailSize]
      } ${
        isDragging
          ? 'border-2 border-dashed border-blue-400/60 dark:border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/5 opacity-30 shadow-inner scale-[0.98]'
          : page.isSelected
            ? 'ring-2 ring-blue-500 border-blue-500 shadow-xl'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
      } ${page.isLocked ? 'opacity-90' : ''}`}
    >
      {/* Top Left: Checkbox & Document Color Dot & Drag Handle */}
      {!isDragging && (
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 flex items-center gap-1 sm:gap-1.5 bg-white/90 dark:bg-slate-900/90 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur">
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleSelect(page.id, e);
            }}
            className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded flex items-center justify-center border transition ${
              page.isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 bg-white dark:bg-slate-800'
            }`}
            title="Select Page"
          >
            {page.isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
          </button>

          <span
            className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: docColor }}
            title={page.docName}
          />

          <div
            {...dragHandleProps}
            className="p-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
            title="Drag to reorder"
          >
            <GripVertical className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </div>
        </div>
      )}

      {/* Top Right: Stack of Per-Page Function Buttons (Full View, Rotate, Delete & Split) */}
      {!isDragging && (
        <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-20 flex flex-col gap-1 sm:gap-1.5">
        {/* 1. Full Page View Button (Blue Button) */}
        <button
          onClick={e => {
            e.stopPropagation();
            onPreview(page.id);
          }}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md active:scale-90 transition flex items-center justify-center"
          title="Full Page View"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </button>

        {/* 2. Rotate Page Button (Amber Button) */}
        <button
          onClick={e => {
            e.stopPropagation();
            onRotateCW(page.id);
          }}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-90 transition flex items-center justify-center"
          title={`Rotate Page Clockwise (+90°) - Current: ${page.rotation || 0}°`}
        >
          <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </button>

        {/* 3. Delete Toggle (Red Button with White X) */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleDelete(page.id);
          }}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg text-white shadow-md active:scale-90 transition flex items-center justify-center ${
            page.isDeleted
              ? 'bg-rose-700 ring-1 sm:ring-2 ring-white hover:bg-rose-800'
              : 'bg-rose-500 hover:bg-rose-600'
          }`}
          title={page.isDeleted ? 'Unmark Deletion' : 'Mark for Deletion'}
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </button>

        {/* 4. Split Toggle (Purple Button with Scissors Icon) */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleSplit(page.id);
          }}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg text-white shadow-md active:scale-90 transition flex items-center justify-center ${
            page.isSplitPoint
              ? 'bg-purple-800 ring-1 sm:ring-2 ring-purple-300 hover:bg-purple-900'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          title={page.isSplitPoint ? 'Remove Split Boundary' : 'Add Split Boundary'}
        >
          <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </button>
      </div>
    )}

      {/* Main Thumbnail Preview Canvas */}
      <div className={`relative flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden rounded-t-xl sm:rounded-t-2xl rounded-b-none bg-slate-100/70 dark:bg-slate-950/60`}>
        {isDragging ? (
          <div className="flex flex-col items-center gap-1 sm:gap-1.5 text-blue-500/50 dark:text-blue-400/40 select-none text-center">
            <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider">Reordering</span>
            <span className="text-sm sm:text-base font-black">Page {page.pageNumber}</span>
          </div>
        ) : isLoadingThumbnail ? (
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-slate-400">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] sm:text-[10px]">Loading...</span>
          </div>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`Page ${page.pageNumber}`}
            className="max-h-[85%] max-w-[85%] object-contain shadow-md rounded border border-slate-200/80 dark:border-slate-800 transition-all duration-300"
          />
        ) : (
          <span className="text-xs text-slate-400">Failed to load</span>
        )}

        {/* Dynamic Rotation Angle Indicator Badge on Page */}
        {!isDragging && (
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-10 pointer-events-none">
            <div
              className={`px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-mono font-bold shadow-md flex items-center gap-0.5 sm:gap-1 backdrop-blur border transition-all duration-200 ${
                page.rotation !== undefined && page.rotation !== 0
                  ? 'bg-purple-600 text-white border-purple-400/40'
                  : 'bg-slate-900/80 dark:bg-slate-800/80 text-slate-200 border-slate-700/50'
              }`}
            >
              <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-300" />
              <span>{page.rotation ?? 0}°</span>
            </div>
          </div>
        )}

        {/* Red Soft-Delete Highlight Overlay with Center Circular X (Matching Screenshot) */}
        {!isDragging && page.isDeleted && (
          <div className="absolute inset-0 bg-rose-500/85 dark:bg-rose-600/85 backdrop-blur-[1px] rounded-xl sm:rounded-2xl z-10 flex items-center justify-center transition-all duration-200">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 border-white/90 flex items-center justify-center bg-transparent text-white shadow-2xl">
              <X className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Right: Page Number Badge (Matching Screenshot Layout) */}
      {!isDragging && (
        <div className="absolute bottom-11 right-1.5 sm:bottom-12 sm:right-2.5 z-10 pointer-events-none">
          <div className="min-w-[20px] sm:min-w-[26px] h-5 sm:h-7 px-1 sm:px-2 rounded sm:rounded-md bg-blue-600 text-white font-extrabold text-[10px] sm:text-xs shadow-md flex items-center justify-center">
            {page.pageNumber}
          </div>
        </div>
      )}

      {/* Red Vertical Dashed Split Line (Matching Screenshot Layout) */}
      {page.isSplitPoint && (
        <div className="absolute -right-2 sm:-right-3.5 top-[-6px] sm:top-[-10px] bottom-[-6px] sm:bottom-[-10px] z-20 pointer-events-none flex items-center justify-center">
          <div className="h-[calc(100%+12px)] sm:h-[calc(100%+20px)] border-r-2 border-dashed border-red-500 stroke-[2]" />
        </div>
      )}

      {/* Bottom Info Bar: Source Doc Name & Original Page */}
      {!isDragging && (
        <div className="w-full px-2 sm:px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200/50 dark:border-slate-800/80 rounded-b-xl sm:rounded-b-2xl flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium z-10">
          <span className="truncate max-w-[65%]" title={page.docName}>
            {page.docName}
          </span>
          <span className="shrink-0 font-mono text-[8px] sm:text-[10px] bg-slate-200/50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            Orig: p.{page.originalPageIndex + 1}
          </span>
        </div>
      )}
    </motion.div>
  );
});

ThumbnailCard.displayName = 'ThumbnailCard';

