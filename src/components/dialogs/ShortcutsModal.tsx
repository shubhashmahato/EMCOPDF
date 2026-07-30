/**
 * Keyboard Shortcuts Reference Dialog Component
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + A / Cmd + A', desc: 'Select all pages in workspace' },
    { key: 'Ctrl + Z / Cmd + Z', desc: 'Undo last action' },
    { key: 'Ctrl + Y / Cmd + Shift + Z', desc: 'Redo action' },
    { key: 'Ctrl + S / Cmd + S', desc: 'Open PDF export dialog' },
    { key: 'Ctrl + O / Cmd + O', desc: 'Open file picker' },
    { key: 'Ctrl + D / Cmd + D', desc: 'Duplicate selected pages' },
    { key: 'Delete / Backspace', desc: 'Delete selected pages' },
    { key: 'R', desc: 'Rotate selected pages Clockwise 90°' },
    { key: 'Shift + R', desc: 'Rotate selected pages Counter-Clockwise 90°' },
    { key: 'Shift + Click', desc: 'Range select pages' },
    { key: 'Ctrl + Click / Cmd + Click', desc: 'Toggle individual page selection' },
    { key: 'Double Click', desc: 'Open Full Page Viewer' },
    { key: 'Right Click', desc: 'Open page Context Menu' },
    { key: 'Esc', desc: 'Close open viewer / context menu / modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 dark:text-slate-200 max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Keyboard className="w-5 h-5" />
            </div>
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-2 overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80"
            >
              <span className="font-medium text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};
