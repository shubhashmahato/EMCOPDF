/**
 * Merge Multiple PDFs Dialog Component
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Layers, Download, FileText, ArrowUp, ArrowDown, Trash2, Plus, RotateCcw } from 'lucide-react';
import { PdfDocument, PdfPageItem } from '../../types';
import { PdfExportService } from '../../services/pdfExportService';
import { formatBytes } from '../../utils/formatters';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: PdfDocument[];
  pages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  onAddToast: (toast: any) => void;
  onReorderDocuments: (fromIndex: number, toIndex: number) => void;
  onRemoveDocument: (docId: string) => void;
  onAddPdfFiles: (files: File[]) => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  documents,
  pages,
  docBuffersMap,
  onAddToast,
  onReorderDocuments,
  onRemoveDocument,
  onAddPdfFiles,
}) => {
  const [outputFilename, setOutputFilename] = useState<string>('Merged_Document.pdf');
  const [mergeScope, setMergeScope] = useState<'all' | 'selected'>('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'zip'>('pdf');
  const [isMerging, setIsMerging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPagesCount = pages.filter(p => p.isSelected && !p.isDeleted).length;
  const activePages = pages.filter(p => !p.isDeleted);
  const targetPages = mergeScope === 'selected' && selectedPagesCount > 0
    ? activePages.filter(p => p.isSelected)
    : activePages;

  const handleResetOptions = () => {
    setOutputFilename('Merged_Document.pdf');
    setMergeScope('all');
    setExportFormat('pdf');
    onAddToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'Reset merge configuration to default values.',
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pdfFiles = Array.from(e.target.files).filter(
        (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onAddPdfFiles(pdfFiles);
      }
      e.target.value = '';
    }
  };

  const handleMerge = async () => {
    if (targetPages.length === 0) {
      onAddToast({ type: 'warning', title: 'No pages to merge' });
      return;
    }

    setIsMerging(true);

    try {
      const pdfBytes = await PdfExportService.exportPagesAsPdf(targetPages, docBuffersMap, {
        filename: outputFilename,
        mode: 'single_pdf',
        targetPages: mergeScope,
        compressionQuality: 'low',
        preserveMetadata: true,
        includePageNumbers: false,
      });

      const baseName = outputFilename.replace(/\.pdf$/i, '').replace(/\.zip$/i, '') || 'Merged_Document';
      const cleanPdfName = `${baseName}.pdf`;

      if (exportFormat === 'zip') {
        const zipFileName = `${baseName}.zip`;
        await PdfExportService.exportFilesAsZip(
          [{ filename: cleanPdfName, data: pdfBytes }],
          zipFileName
        );
        onAddToast({
          type: 'success',
          title: 'ZIP Downloaded',
          message: `Saved ${zipFileName} containing ${cleanPdfName} (${targetPages.length} pages)`,
        });
      } else {
        PdfExportService.savePdfFile(pdfBytes, cleanPdfName);
        onAddToast({
          type: 'success',
          title: 'Merge Complete',
          message: `Downloaded merged PDF "${cleanPdfName}" (${targetPages.length} pages)`,
        });
      }

      setIsMerging(false);
      onClose();
    } catch (err: any) {
      console.error('Merge error:', err);
      onAddToast({ type: 'error', title: 'Merge Failed', message: err?.message || 'Failed to merge PDF files.' });
      setIsMerging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 dark:text-slate-200 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Layers className="w-5 h-5" />
            </div>
            <span>Merge PDF Files</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Filename Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200">
              Merged File Name:
            </label>
            <input
              type="text"
              value={outputFilename}
              onChange={e => setOutputFilename(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Documents Reordering List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Files to Merge ({documents.length}):</span>
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More PDFs</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                No PDF files uploaded yet. Click "Add More PDFs" to select files.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: doc.color || '#6366f1' }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} • {formatBytes(doc.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={() => onReorderDocuments(idx, idx - 1)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        disabled={idx === documents.length - 1}
                        onClick={() => onReorderDocuments(idx, idx + 1)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scope Selector */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200">
              Merge Scope:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMergeScope('all')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                  mergeScope === 'all'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Pages ({activePages.length})
              </button>
              <button
                onClick={() => setMergeScope('selected')}
                disabled={selectedPagesCount === 0}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                  mergeScope === 'selected'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-60'
                }`}
              >
                Selected Pages ({selectedPagesCount})
              </button>
            </div>
          </div>

          {/* Download Format */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium pt-1">
            <span>Download Format:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                  className="text-indigo-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-100">PDF (.pdf)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="zip"
                  checked={exportFormat === 'zip'}
                  onChange={() => setExportFormat('zip')}
                  className="text-indigo-600"
                />
                <span className="font-bold text-slate-800 dark:text-slate-100">ZIP Archive (.zip)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleResetOptions}
              className="px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 transition text-xs"
              title="Reset options to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <button
            onClick={handleMerge}
            disabled={isMerging || targetPages.length === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
          >
            {isMerging ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Merge & Download ({targetPages.length} Pages)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
