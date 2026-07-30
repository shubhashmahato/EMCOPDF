/**
 * Detailed List View Layout for PDF Pages
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Check,
} from 'lucide-react';
import { PdfPageItem, AppSettings } from '../../types';

interface ThumbnailListViewProps {
  pages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  docColorsMap: Map<string, string>;
  settings: AppSettings;
  onToggleSelect: (pageId: string, e?: React.MouseEvent) => void;
  onRotateCW: (pageId: string) => void;
  onRotateCCW: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onToggleLock: (pageId: string) => void;
  onPreview: (pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

interface ThumbnailListRowProps {
  page: PdfPageItem;
  docColor: string;
  onToggleSelect: (pageId: string, e?: React.MouseEvent) => void;
  onRotateCW: (pageId: string) => void;
  onRotateCCW: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onToggleLock: (pageId: string) => void;
  onPreview: (pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

const ThumbnailListRow: React.FC<ThumbnailListRowProps> = ({
  page,
  docColor,
  onToggleSelect,
  onRotateCW,
  onRotateCCW,
  onDuplicate,
  onDelete,
  onToggleLock,
  onPreview,
  onContextMenu,
}) => {
  const handleRowClick = (e: React.MouseEvent) => {
    // Avoid triggering if clicked on any interactive elements (buttons, checkbox, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onToggleSelect(page.id, e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onContextMenu={e => onContextMenu(e, page.id)}
      onClick={handleRowClick}
      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer glass-card ${
        page.isSelected
          ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 ring-1 ring-blue-500'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleSelect(page.id, e);
          }}
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
            page.isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          }`}
        >
          {page.isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Page Number & Document Tag */}
        <div className="flex items-center gap-2.5 w-32">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: docColor }}
          />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
            Page {page.pageNumber}
          </span>
        </div>

        {/* Document Name */}
        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate hidden sm:block">
          {page.docName}
        </div>

        {/* Format & Dimensions */}
        <div className="text-xs text-slate-400 font-mono hidden md:block">
          {page.dimensions.formatName || `${page.dimensions.width}×${page.dimensions.height}`}
        </div>

        {/* Rotation Angle Indicator */}
        <span className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold font-mono flex items-center gap-1 border ${
          page.rotation !== undefined && page.rotation !== 0
            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        }`}>
          <RotateCw className="w-3 h-3" />
          {page.rotation ?? 0}°
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={e => {
            e.stopPropagation();
            onRotateCCW(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Rotate CCW 90°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onRotateCW(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Rotate CW 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onPreview(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDuplicate(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleLock(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-purple-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title={page.isLocked ? 'Unlock' : 'Lock'}
        >
          {page.isLocked ? <Unlock className="w-4 h-4 text-purple-500" /> : <Lock className="w-4 h-4" />}
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const ThumbnailListView: React.FC<ThumbnailListViewProps> = ({
  pages,
  docColorsMap,
  onToggleSelect,
  onRotateCW,
  onRotateCCW,
  onDuplicate,
  onDelete,
  onToggleLock,
  onPreview,
  onContextMenu,
}) => {
  return (
    <div className="flex flex-col gap-2 max-w-5xl mx-auto w-full pb-12">
      {pages.map((page) => {
        const docColor = docColorsMap.get(page.docId) || '#3B82F6';

        return (
          <ThumbnailListRow
            key={page.id}
            page={page}
            docColor={docColor}
            onToggleSelect={onToggleSelect}
            onRotateCW={onRotateCW}
            onRotateCCW={onRotateCCW}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggleLock={onToggleLock}
            onPreview={onPreview}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  );
};
