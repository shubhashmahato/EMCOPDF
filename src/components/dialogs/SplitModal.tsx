/**
 * Split PDF Builder Dialog Component
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scissors,
  Check,
  FileCheck,
  FileSpreadsheet,
  Bookmark,
  FileCode2,
  Download,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { PdfPageItem, SplitMode } from '../../types';
import { PdfService } from '../../services/pdfService';
import { PdfExportService } from '../../services/pdfExportService';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  onAddToast: (toast: any) => void;
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  pages,
  docBuffersMap,
  onAddToast,
}) => {
  const [splitMode, setSplitMode] = useState<SplitMode>('every_page');
  const [everyN, setEveryN] = useState<number>(2);
  const [customRange, setCustomRange] = useState<string>('1-2, 3-5');
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [isDetectingBlanks, setIsDetectingBlanks] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const totalPages = pages.filter(p => !p.isDeleted).length;
  const splitPointsCount = pages.filter(p => p.isSplitPoint && !p.isDeleted).length;

  // Auto select 'by_split_points' mode if split points exist when opening
  useEffect(() => {
    if (isOpen) {
      if (splitPointsCount > 0) {
        setSplitMode('by_split_points');
      }
    }
  }, [isOpen, splitPointsCount]);

  // Auto detect blank pages when mode is changed to 'blank_pages'
  useEffect(() => {
    if (splitMode === 'blank_pages' && pages.length > 0) {
      setIsDetectingBlanks(true);
      const firstBuffer = docBuffersMap.get(pages[0].docId);
      if (firstBuffer) {
        PdfService.detectBlankPages(firstBuffer, totalPages, pages[0].docId)
          .then(blanks => {
            setBlankIndices(blanks);
            setIsDetectingBlanks(false);
          })
          .catch(() => setIsDetectingBlanks(false));
      } else {
        setIsDetectingBlanks(false);
      }
    }
  }, [splitMode, pages, docBuffersMap, totalPages]);

  const handleExportSplit = async (exportAsZip: boolean) => {
    if (pages.length === 0) return;
    setIsExporting(true);

    try {
      const baseName = pages[0]?.docName ? pages[0].docName.replace(/\.pdf$/i, '') : 'Split_Doc';
      const splitFiles = await PdfExportService.splitPdfToFiles(
        pages,
        docBuffersMap,
        splitMode,
        {
          everyNPages: everyN,
          customRangeString: customRange,
          blankPageIndices: blankIndices,
        },
        baseName
      );

      if (splitFiles.length === 0) {
        onAddToast({ type: 'warning', title: 'No files generated from split options' });
        setIsExporting(false);
        return;
      }

      const zipFileName = `${baseName}_Split.zip`;
      await PdfExportService.exportFilesAsZip(
        splitFiles.map(f => ({ filename: f.filename, data: f.data })),
        zipFileName
      );
      onAddToast({
        type: 'success',
        title: 'Split Export Complete',
        message: `Saved ZIP archive (${zipFileName}) containing ${splitFiles.length} PDF file(s).`,
      });

      setIsExporting(false);
      onClose();
    } catch (err: any) {
      console.error('Split export failed:', err);
      onAddToast({ type: 'error', title: 'Export Failed', message: err?.message });
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 dark:text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Scissors className="w-5 h-5" />
            </div>
            <span>Split PDF Options</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Modes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* By Marked Split Lines */}
            <button
              onClick={() => setSplitMode('by_split_points')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'by_split_points'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Scissors className="w-5 h-5 shrink-0 mt-0.5 text-purple-500" />
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>Marked Split Boundaries</span>
                  {splitPointsCount > 0 && (
                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                      {splitPointsCount} line{splitPointsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Split at red dashed lines set on page thumbnails ({splitPointsCount} boundary line{splitPointsCount !== 1 ? 's' : ''} → {splitPointsCount + 1} PDF file{splitPointsCount !== 0 ? 's' : ''}).
                </p>
              </div>
            </button>

            {/* Every Page */}
            <button
              onClick={() => setSplitMode('every_page')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'every_page'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Every Page</div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Split document into single-page individual PDF files ({totalPages} files).
                </p>
              </div>
            </button>

            {/* Every N Pages */}
            <button
              onClick={() => setSplitMode('every_n_pages')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'every_n_pages'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Layers className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Every N Pages</div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Chunk pages into files of custom page counts (e.g. every 2 pages).
                </p>
              </div>
            </button>

            {/* Selected Pages */}
            <button
              onClick={() => setSplitMode('selected')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'selected'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Selected Pages</div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Separate selected pages vs unselected pages into 2 distinct PDFs.
                </p>
              </div>
            </button>

            {/* Custom Ranges */}
            <button
              onClick={() => setSplitMode('custom_range')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'custom_range'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <FileCode2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Custom Ranges</div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Define specific ranges (e.g. "1-3, 4-8, 9-12").
                </p>
              </div>
            </button>

            {/* Blank Pages */}
            <button
              onClick={() => setSplitMode('blank_pages')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                splitMode === 'blank_pages'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Bookmark className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">At Blank Pages</div>
                <p className="text-[11px] opacity-70 mt-0.5">
                  Automatically split PDF whenever a blank divider page is detected.
                </p>
              </div>
            </button>
          </div>

          {/* Mode Configuration Inputs */}
          {splitMode === 'every_n_pages' && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Split every N pages:
              </span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={everyN}
                onChange={e => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold"
              />
            </div>
          )}

          {splitMode === 'custom_range' && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Custom Page Ranges:
              </span>
              <input
                type="text"
                value={customRange}
                onChange={e => setCustomRange(e.target.value)}
                placeholder="e.g. 1-3, 4-6, 7, 8-10"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
              />
              <span className="text-[11px] text-slate-400">
                Separate ranges with commas. Example: "1-2, 3-5, 6-10" will generate 3 separate PDF files.
              </span>
            </div>
          )}

          {splitMode === 'blank_pages' && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              {isDetectingBlanks ? (
                <div className="text-center py-3 text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning document for blank pages...</span>
                </div>
              ) : (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Found <span className="font-bold text-purple-500">{blankIndices.length}</span> blank page(s) in document. The document will be split into{' '}
                  <span className="font-bold text-purple-500">{blankIndices.length + 1}</span> section(s).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={() => handleExportSplit(true)}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FolderArchive className="w-4 h-4" />
            )}
            <span>Export Split ZIP Archive</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
