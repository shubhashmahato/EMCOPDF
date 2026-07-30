/**
 * Context Menu Component for Page Thumbnails
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  CheckSquare,
  Square,
  Scissors,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { ContextMenuState, PdfPageItem } from '../../types';

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  page: PdfPageItem | undefined;
  onPreview: (pageId: string) => void;
  onRotateCW: (pageIds: string[]) => void;
  onRotateCCW: (pageIds: string[]) => void;
  onRotate180: (pageIds: string[]) => void;
  onDuplicate: (pageIds: string[]) => void;
  onDelete: (pageIds: string[]) => void;
  onToggleLock: (pageIds: string[]) => void;
  onMoveToStart: () => void;
  onMoveToEnd: () => void;
  onToggleSelect: (pageId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  page,
  onPreview,
  onRotateCW,
  onRotateCCW,
  onRotate180,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveToStart,
  onMoveToEnd,
  onToggleSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, onClose]);

  if (!state.isOpen || !page) return null;

  const targetIds = state.targetPageIds.length > 0 ? state.targetPageIds : [page.id];
  const count = targetIds.length;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          top: Math.min(state.y, window.innerHeight - 340),
          left: Math.min(state.x, window.innerWidth - 220),
        }}
        className="fixed z-50 w-56 rounded-2xl border bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-2xl py-1 text-xs font-semibold text-slate-800 dark:text-white select-none"
      >
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center">
          <span>Page {page.pageNumber} {count > 1 ? `(${count} selected)` : ''}</span>
          <span className="text-[10px] font-normal">{page.dimensions.formatName}</span>
        </div>

        <button
          onClick={() => {
            onPreview(page.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <Eye className="w-4 h-4 text-blue-500" />
          <span>Full Page Preview</span>
        </button>

        <button
          onClick={() => {
            onToggleSelect(page.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          {page.isSelected ? (
            <>
              <Square className="w-4 h-4 text-slate-400" />
              <span>Deselect Page</span>
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4 text-blue-500" />
              <span>Select Page</span>
            </>
          )}
        </button>

        <div className="my-1 border-t border-slate-200/60 dark:border-slate-800/80" />

        <button
          onClick={() => {
            onRotateCW(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <RotateCw className="w-4 h-4 text-amber-500" />
          <span>Rotate Right 90°</span>
        </button>

        <button
          onClick={() => {
            onRotateCCW(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <span>Rotate Left 90°</span>
        </button>

        <button
          onClick={() => {
            onRotate180(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <RotateCw className="w-4 h-4 text-amber-500" />
          <span>Rotate 180°</span>
        </button>

        <div className="my-1 border-t border-slate-200/60 dark:border-slate-800/80" />

        <button
          onClick={() => {
            onDuplicate(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <Copy className="w-4 h-4 text-emerald-500" />
          <span>Duplicate Page{count > 1 ? 's' : ''}</span>
        </button>

        <button
          onClick={() => {
            onToggleLock(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          {page.isLocked ? (
            <>
              <Unlock className="w-4 h-4 text-purple-500" />
              <span>Unlock Page</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-purple-500" />
              <span>Lock Page</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            onMoveToStart();
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowUpToLine className="w-4 h-4 text-indigo-500" />
          <span>Move to Start</span>
        </button>

        <button
          onClick={() => {
            onMoveToEnd();
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowDownToLine className="w-4 h-4 text-indigo-500" />
          <span>Move to End</span>
        </button>

        <div className="my-1 border-t border-slate-200/60 dark:border-slate-800/80" />

        <button
          onClick={() => {
            onDelete(targetIds);
            onClose();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition font-medium"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Delete Page{count > 1 ? 's' : ''}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
