/**
 * Floating Batch Action Bar for Quick Page Operations
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  Scissors,
  X,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onRotate180: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onMoveToStart: () => void;
  onMoveToEnd: () => void;
  onDeselectAll: () => void;
  onClearWorkspace: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalCount,
  onRotateCW,
  onRotateCCW,
  onRotate180,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveToStart,
  onMoveToEnd,
  onDeselectAll,
  onClearWorkspace,
}) => {
  if (totalCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none"
      >
        {/* Selection status badge */}
        <div className="px-2 sm:px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 sm:gap-1.5 shrink-0">
          <CheckSquare className="w-4 h-4 text-blue-500" />
          <span>
            {selectedCount > 0 ? `${selectedCount} Selected` : `All ${totalCount} Pages`}
          </span>
          {selectedCount > 0 && (
            <button
              onClick={onDeselectAll}
              className="p-0.5 hover:bg-blue-500/25 rounded ml-1"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Rotate Left 90° */}
        <button
          onClick={onRotateCCW}
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold shrink-0"
          title="Rotate Left 90° (Shift+R)"
        >
          <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="hidden md:inline">Left 90°</span>
        </button>

        {/* Rotate Right 90° */}
        <button
          onClick={onRotateCW}
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold shrink-0"
          title="Rotate Right 90° (R)"
        >
          <RotateCw className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="hidden md:inline">Right 90°</span>
        </button>

        {/* Rotate 180° */}
        <button
          onClick={onRotate180}
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold hidden sm:flex shrink-0"
          title="Rotate 180°"
        >
          <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="hidden md:inline">180°</span>
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold shrink-0"
          title="Duplicate Selected (Ctrl+D)"
        >
          <Copy className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="hidden lg:inline">Duplicate</span>
        </button>

        {/* Lock/Unlock */}
        <button
          onClick={onToggleLock}
          className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold hidden sm:flex shrink-0"
          title="Toggle Lock"
        >
          <Lock className="w-4 h-4 text-purple-500 shrink-0" />
          <span className="hidden lg:inline">Lock</span>
        </button>

        {/* Move Start / End */}
        {selectedCount > 0 && (
          <>
            <button
              onClick={onMoveToStart}
              className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold hidden md:flex shrink-0"
              title="Move Selected to Start"
            >
              <ArrowUpToLine className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="hidden lg:inline">To Top</span>
            </button>

            <button
              onClick={onMoveToEnd}
              className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold hidden md:flex shrink-0"
              title="Move Selected to End"
            >
              <ArrowDownToLine className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="hidden lg:inline">To End</span>
            </button>
          </>
        )}

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Delete */}
        <button
          onClick={onDelete}
          className="p-1.5 sm:p-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 rounded-xl transition flex items-center gap-1 sm:gap-1.5 font-bold shrink-0"
          title="Delete Pages (Del)"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
