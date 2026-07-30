/**
 * Loaded Documents Manager Sidebar Component
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Trash2, Plus, X, ChevronLeft, ChevronRight, HardDrive, ArrowUp, ArrowDown } from 'lucide-react';
import { PdfDocument } from '../../types';
import { formatFileSize } from '../../utils/formatters';

interface DocumentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  documents: PdfDocument[];
  onRemoveDocument: (docId: string) => void;
  onOpenFilePicker: () => void;
  onReorderDocument: (fromIndex: number, toIndex: number) => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  isOpen,
  onToggle,
  documents,
  onRemoveDocument,
  onOpenFilePicker,
  onReorderDocument,
}) => {
  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-20 left-0 z-30 p-2 rounded-r-xl glass-panel shadow-xl border border-l-0 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition ${
          isOpen ? 'translate-x-72' : 'translate-x-0'
        }`}
        title={isOpen ? 'Collapse Documents' : 'Expand Loaded Documents'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-16 left-0 bottom-0 z-30 w-72 glass-panel border-r shadow-2xl flex flex-col p-4 text-xs select-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-100">
                <HardDrive className="w-4 h-4 text-blue-500" />
                <span>Source Files ({documents.length})</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Append File Button (Permanently visible at the top of the sidebar below header) */}
            <div className="pt-3 pb-1">
              <button
                onClick={onOpenFilePicker}
                className="w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another PDF</span>
              </button>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto my-2 flex flex-col gap-2.5 pr-1">
              {documents.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No documents loaded</p>
                </div>
              ) : (
                documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col gap-2 group hover:border-blue-500/50 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: doc.color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {doc.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => onReorderDocument(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none rounded-lg transition"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onReorderDocument(index, index + 1)}
                          disabled={index === documents.length - 1}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none rounded-lg transition"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveDocument(doc.id)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Remove Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{doc.pageCount} pages</span>
                      <span>{formatFileSize(doc.size)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
