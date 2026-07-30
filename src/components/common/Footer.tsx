/**
 * Workspace Footer Status Bar Component
 */

import React from 'react';
import { ShieldCheck, HardDrive, Layers, CheckSquare } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

interface FooterProps {
  totalPages: number;
  selectedPages: number;
  totalSize: number;
  documentsCount: number;
  onOpenAboutModal?: () => void;
  sidebarOpen?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  totalPages,
  selectedPages,
  totalSize,
  documentsCount,
  onOpenAboutModal,
  sidebarOpen = false,
}) => {
  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-30 h-8 glass-toolbar border-t border-slate-200/60 dark:border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-200 font-semibold select-none transition-all duration-300 ${
      sidebarOpen ? 'md:pl-[304px]' : ''
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <HardDrive className="w-3.5 h-3.5 text-blue-500" />
          <span>{documentsCount} Files ({formatFileSize(totalSize)})</span>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>{totalPages} Total Pages</span>
        </div>

        {selectedPages > 0 && (
          <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{selectedPages} Selected</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 hidden sm:flex">
        <button
          onClick={onOpenAboutModal}
          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer font-medium"
          title="View About EMCOPDF"
        >
          <span>EMCOPDF v1.0.0</span>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span>Shubhashchandra Mahato</span>
        </button>

        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline & In-Browser Processing</span>
        </div>
      </div>
    </footer>
  );
};
