/**
 * Top Main Navigation and Workspace Toolbar Component
 */

import React, { useState, useRef, useEffect } from 'react';
import emcoPdfIcon from '../../assets/images/emco_pdf_icon_1784817804482.jpg';
import {
  FilePlus,
  Undo2,
  Redo2,
  Scissors,
  Layers,
  Download,
  Settings,
  HelpCircle,
  Info,
  Sun,
  Moon,
  Grid,
  List,
  CheckSquare,
  Square,
  Sparkles,
  RotateCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AppSettings, PdfPageItem } from '../../types';

interface MainToolbarProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  pages: PdfPageItem[];
  selectedPagesCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetWorkspace?: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onSelectRotated: () => void;
  onInvertSelection: () => void;
  onOpenFilePicker: () => void;
  onOpenSplitModal: () => void;
  onOpenMergeModal: () => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenAboutModal: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light' | 'system';
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  settings,
  onUpdateSettings,
  pages,
  selectedPagesCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetWorkspace,
  onSelectAll,
  onDeselectAll,
  onSelectOdd,
  onSelectEven,
  onSelectRotated,
  onInvertSelection,
  onOpenFilePicker,
  onOpenSplitModal,
  onOpenMergeModal,
  onOpenExportModal,
  onOpenSettingsModal,
  onOpenShortcutsModal,
  onOpenAboutModal,
  onToggleTheme,
  theme,
}) => {
  const totalPages = pages.length;
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSelectionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-toolbar border-b px-4 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Brand & File Upload */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenAboutModal} 
          className="flex items-center gap-2 text-left group hover:opacity-90 transition cursor-pointer"
          title="About EMCOPDF"
        >
          <img 
            src={emcoPdfIcon} 
            alt="EMCOPDF" 
            className="w-9 h-9 rounded-xl object-cover shadow-md shadow-blue-500/20 group-hover:scale-105 transition border border-slate-200/50 dark:border-slate-700/50" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>EMCOPDF</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                OFFLINE
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 hidden sm:block">
              Desktop-grade page editor & splitter
            </p>
          </div>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

        <button
          onClick={onOpenFilePicker}
          className="px-2 py-1.5 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
          title="Add PDF File"
        >
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add PDF</span>
        </button>
      </div>

      {/* Center: History Undo/Redo & Selection Quick Controls */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition ${
              canUndo
                ? 'hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                : 'text-slate-300 dark:text-slate-500 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition ${
              canRedo
                ? 'hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                : 'text-slate-300 dark:text-slate-500 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Preset Dropdown */}
        {totalPages > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSelectionOpen(!isSelectionOpen)}
              className="px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-95"
            >
              <CheckSquare className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">
                {selectedPagesCount > 0
                  ? `${selectedPagesCount}/${totalPages} Selected`
                  : 'Select'}
              </span>
              {selectedPagesCount > 0 ? (
                <span className="sm:hidden text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-extrabold leading-none">
                  {selectedPagesCount}
                </span>
              ) : (
                <span className="sm:hidden">Select</span>
              )}
            </button>

            {isSelectionOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 text-xs font-medium">
                <button
                  onClick={() => {
                    onSelectAll();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Select All (Ctrl+A)
                </button>
                <button
                  onClick={() => {
                    onDeselectAll();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Deselect All
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                <button
                  onClick={() => {
                    onSelectOdd();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Select Odd Pages
                </button>
                <button
                  onClick={() => {
                    onSelectEven();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Select Even Pages
                </button>
                <button
                  onClick={() => {
                    onSelectRotated();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Select Rotated Pages
                </button>
                <button
                  onClick={() => {
                    onInvertSelection();
                    setIsSelectionOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-500/10 text-slate-800 dark:text-white font-semibold"
                >
                  Invert Selection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Primary Tools & Export */}
      <div className="flex items-center gap-2">
        {totalPages > 0 && (
          <>
            <button
              onClick={onOpenExportModal}
              className="px-2.5 py-1.5 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
              title="Export PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {onResetWorkspace && (
              <button
                onClick={onResetWorkspace}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition active:scale-95"
                title="Reset Workspace (Restore original page actions)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
          </>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 hidden sm:flex">
          <button
            onClick={() => onUpdateSettings({ viewMode: 'grid' })}
            className={`p-1.5 rounded-lg transition ${
              settings.viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateSettings({ viewMode: 'list' })}
            className={`p-1.5 rounded-lg transition ${
              settings.viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition border border-slate-200 dark:border-slate-700 hidden sm:block"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={onOpenShortcutsModal}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition border border-slate-200 dark:border-slate-700 hidden md:block"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* About */}
        <button
          onClick={onOpenAboutModal}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition border border-slate-200 dark:border-slate-700 hidden sm:block"
          title="About EMCOPDF"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition border border-slate-200 dark:border-slate-700"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
