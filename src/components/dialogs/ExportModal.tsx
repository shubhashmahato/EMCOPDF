/**
 * Unified PDF Export Settings Dialog Component
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Download, FileText, Hash, HardDrive, Scissors, CheckCircle2, PlusCircle } from 'lucide-react';
import { ExportOptions, PdfPageItem } from '../../types';
import { PdfExportService } from '../../services/pdfExportService';
import { parsePageRangeString } from '../../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  onAddToast: (toast: any) => void;
  onClearWorkspace?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pages,
  docBuffersMap,
  onAddToast,
  onClearWorkspace,
}) => {
  const selectedCount = pages.filter(p => p.isSelected && !p.isDeleted).length;

  const [filename, setFilename] = useState<string>('Exported_Document.pdf');
  const [targetPages, setTargetPages] = useState<'all' | 'selected' | 'range'>(
    selectedCount > 0 ? 'selected' : 'all'
  );
  const [customRangeStr, setCustomRangeStr] = useState<string>('1-5');
  const [compression, setCompression] = useState<'none' | 'low' | 'medium' | 'high'>('low');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Page number custom settings
  const [pgNumEnabled, setPgNumEnabled] = useState<boolean>(false);
  const [pgNumPattern, setPgNumPattern] = useState<string>('{NUM} / {CNT}');
  const [pgNumFontFamily, setPgNumFontFamily] = useState<'Sans' | 'Serif' | 'Monospace'>('Sans');
  const [pgNumFontSize, setPgNumFontSize] = useState<number>(8);
  const [pgNumIsBold, setPgNumIsBold] = useState<boolean>(false);
  const [pgNumIsItalic, setPgNumIsItalic] = useState<boolean>(false);
  const [pgNumColor, setPgNumColor] = useState<string>('#4b5563');
  const [pgNumOpacity, setPgNumOpacity] = useState<number>(1);
  const [pgNumPosition, setPgNumPosition] = useState<'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right'>('bottom_center');
  const [pgNumAngle, setPgNumAngle] = useState<number>(0);
  const [pgNumOffsetX, setPgNumOffsetX] = useState<number>(5);
  const [pgNumOffsetY, setPgNumOffsetY] = useState<number>(5);
  const [pgNumStartPage, setPgNumStartPage] = useState<number>(1);
  const [pgNumStartNumber, setPgNumStartNumber] = useState<number>(1);
  const [pgNumLastPageEnabled, setPgNumLastPageEnabled] = useState<boolean>(false);
  const [pgNumLastPageValue, setPgNumLastPageValue] = useState<number>(1);
  const [pgNumTotalCountEnabled, setPgNumTotalCountEnabled] = useState<boolean>(false);
  const [pgNumTotalCountValue, setPgNumTotalCountValue] = useState<number>(1);

  // Reset success state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Synchronize dynamic default values with exported page count
  useEffect(() => {
    const exportCount = getExportSubset().length;
    if (exportCount > 0) {
      setPgNumLastPageValue(prev => Math.min(prev, exportCount) || exportCount);
      setPgNumTotalCountValue(prev => Math.min(prev, exportCount) || exportCount);
    }
  }, [targetPages, customRangeStr, pages]);

  const getPreviewPageNumberStyle = () => {
    const pxScale = 1.3;
    const padX = `${pgNumOffsetX * pxScale}px`;
    const padY = `${pgNumOffsetY * pxScale}px`;

    // Calculate a high-contrast text shadow so the preview text is always visible regardless of theme background or selected text color
    const colorHex = (pgNumColor || '#4b5563').trim().replace('#', '');
    let textShadow = '0px 0px 2px rgba(0,0,0,0.3)';
    if (colorHex.length === 3 || colorHex.length === 6) {
      const r = parseInt(colorHex.length === 3 ? colorHex[0] + colorHex[0] : colorHex.substring(0, 2), 16);
      const g = parseInt(colorHex.length === 3 ? colorHex[1] + colorHex[1] : colorHex.substring(2, 4), 16);
      const b = parseInt(colorHex.length === 3 ? colorHex[2] + colorHex[2] : colorHex.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      // If the selected color is dark (YIQ < 128), add a rich white shadow. If light, add a rich dark shadow.
      textShadow = yiq < 128
        ? '0 0 2.5px rgba(255, 255, 255, 0.95), 0 0 1px rgba(255, 255, 255, 0.95), 0px 0px 4px rgba(255, 255, 255, 0.5)'
        : '0 0 2.5px rgba(0, 0, 0, 0.95), 0 0 1px rgba(0, 0, 0, 0.95), 0px 0px 4px rgba(0, 0, 0, 0.5)';
    }

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      fontSize: `${Math.max(6, pgNumFontSize * 1.15)}px`,
      color: pgNumColor,
      opacity: pgNumOpacity,
      fontWeight: pgNumIsBold ? 'bold' : 'normal',
      fontStyle: pgNumIsItalic ? 'italic' : 'normal',
      fontFamily: pgNumFontFamily === 'Sans' ? 'sans-serif' : pgNumFontFamily === 'Serif' ? 'serif' : 'monospace',
      transform: `rotate(${pgNumAngle}deg)`,
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease-out',
      textShadow,
    };

    switch (pgNumPosition) {
      case 'bottom_left':
        return { ...baseStyle, bottom: padY, left: padX };
      case 'bottom_center':
        return { 
          ...baseStyle, 
          bottom: padY, 
          left: '50%', 
          transform: `translateX(-50%) rotate(${pgNumAngle}deg)` 
        };
      case 'bottom_right':
        return { ...baseStyle, bottom: padY, right: padX };
      case 'top_left':
        return { ...baseStyle, top: padY, left: padX };
      case 'top_center':
        return { 
          ...baseStyle, 
          top: padY, 
          left: '50%', 
          transform: `translateX(-50%) rotate(${pgNumAngle}deg)` 
        };
      case 'top_right':
        return { ...baseStyle, top: padY, right: padX };
      default:
        return baseStyle;
    }
  };

  // Detect user's system / OS
  const systemInfo = useMemo(() => {
    if (typeof window === 'undefined') return { os: 'Unknown', isMobile: false };
    const ua = window.navigator.userAgent;
    const platform = (window.navigator as any).userAgentData?.platform || window.navigator.platform || '';
    
    let os = 'Unknown';
    let isMobile = false;
    
    if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      os = 'iOS / iPadOS';
      isMobile = true;
    } else if (/Android/.test(ua)) {
      os = 'Android';
      isMobile = true;
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform) || /Mac OS X/.test(ua)) {
      os = 'macOS';
    } else if (/Win32|Win64|Windows|wWin15/.test(platform) || /Windows/.test(ua)) {
      os = 'Windows';
    } else if (/Linux/.test(platform) || /Linux/.test(ua)) {
      os = 'Linux';
    }
    
    return { os, isMobile };
  }, []);

  const [exportFormat, setExportFormat] = useState<'pdf' | 'zip'>('pdf');

  const getExportSubset = (): PdfPageItem[] => {
    const activePages = pages.filter(p => !p.isDeleted);
    if (targetPages === 'selected') {
      return activePages.filter(p => p.isSelected);
    }
    if (targetPages === 'range') {
      const indices = parsePageRangeString(customRangeStr, activePages.length);
      return indices.map(idx => activePages[idx]).filter(Boolean);
    }
    return activePages;
  };

  const pagesToExport = getExportSubset();
  const splitPointsCount = pagesToExport.filter(p => p.isSplitPoint).length;
  const hasSplitPoints = splitPointsCount > 0;

  // Synchronize filename extension with the selected export format
  useEffect(() => {
    setFilename(prev => {
      const base = prev.replace(/\.pdf$/i, '').replace(/\.zip$/i, '');
      if (hasSplitPoints) {
        return `${base}.zip`;
      }
      return `${base}.${exportFormat}`;
    });
  }, [exportFormat, hasSplitPoints]);

  const handleExport = async () => {
    if (pagesToExport.length === 0) {
      onAddToast({ type: 'warning', title: 'No pages matching export target' });
      return;
    }

    setIsExporting(true);

    try {
      const baseName = filename.replace(/\.pdf$/i, '').replace(/\.zip$/i, '') || 'Exported_Document';

      if (hasSplitPoints) {
        const splitFiles = await PdfExportService.splitPdfToFiles(
          pagesToExport,
          docBuffersMap,
          'by_split_points',
          {
            pageNumberSettings: pgNumEnabled ? {
              enabled: pgNumEnabled,
              pattern: pgNumPattern,
              fontFamily: pgNumFontFamily,
              fontSize: pgNumFontSize,
              isBold: pgNumIsBold,
              isItalic: pgNumIsItalic,
              color: pgNumColor,
              opacity: pgNumOpacity,
              position: pgNumPosition,
              angle: pgNumAngle,
              offsetX: pgNumOffsetX,
              offsetY: pgNumOffsetY,
              startPage: pgNumStartPage,
              startNumber: pgNumStartNumber,
              lastPageEnabled: pgNumLastPageEnabled,
              lastPageValue: pgNumLastPageValue,
              totalCountEnabled: pgNumTotalCountEnabled,
              totalCountValue: pgNumTotalCountValue,
            } : undefined
          },
          baseName
        );

        const zipFileName = `${baseName}_Split.zip`;
        await PdfExportService.exportFilesAsZip(
          splitFiles.map(f => ({ filename: f.filename, data: f.data })),
          zipFileName
        );

        onAddToast({
          type: 'success',
          title: 'Split Export Complete',
          message: `Saved ${zipFileName} containing ${splitFiles.length} separate PDF split files.`,
        });
      } else {
        const options: ExportOptions = {
          filename: `${baseName}.pdf`,
          mode: 'single_pdf',
          targetPages,
          compressionQuality: compression,
          preserveMetadata: true,
          includePageNumbers: pgNumEnabled,
          pageNumberSettings: {
            enabled: pgNumEnabled,
            pattern: pgNumPattern,
            fontFamily: pgNumFontFamily,
            fontSize: pgNumFontSize,
            isBold: pgNumIsBold,
            isItalic: pgNumIsItalic,
            color: pgNumColor,
            opacity: pgNumOpacity,
            position: pgNumPosition,
            angle: pgNumAngle,
            offsetX: pgNumOffsetX,
            offsetY: pgNumOffsetY,
            startPage: pgNumStartPage,
            startNumber: pgNumStartNumber,
            lastPageEnabled: pgNumLastPageEnabled,
            lastPageValue: pgNumLastPageValue,
            totalCountEnabled: pgNumTotalCountEnabled,
            totalCountValue: pgNumTotalCountValue,
          }
        };

        const pdfBytes = await PdfExportService.exportPagesAsPdf(
          pagesToExport,
          docBuffersMap,
          options
        );

        if (exportFormat === 'pdf' || systemInfo.isMobile) {
          const directPdfName = `${baseName}.pdf`;
          PdfExportService.savePdfFile(pdfBytes, directPdfName);

          onAddToast({
            type: 'success',
            title: 'PDF Export Complete',
            message: `Saved ${directPdfName} (${pagesToExport.length} pages) directly to your ${systemInfo.os} device.`,
          });
        } else {
          const innerPdfName = `${baseName}.pdf`;
          const zipFileName = `${baseName}.zip`;

          await PdfExportService.exportFilesAsZip(
            [{ filename: innerPdfName, data: pdfBytes }],
            zipFileName
          );

          onAddToast({
            type: 'success',
            title: 'ZIP Export Downloaded',
            message: `Saved ${zipFileName} containing ${innerPdfName} (${pagesToExport.length} pages)`,
          });
        }
      }

      setIsExporting(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      onAddToast({ type: 'error', title: 'Export Failed', message: err?.message });
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const activePagesCount = getExportSubset().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full ${isSuccess || hasSplitPoints ? 'max-w-lg' : 'max-w-3xl'} rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 dark:text-slate-200`}
      >
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 animate-pulse">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Export Completed Successfully!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-xs leading-relaxed">
                Your PDF document has been successfully processed, optimized, and downloaded to your {systemInfo.os} device.
              </p>
            </div>

            <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60 my-2" />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {onClearWorkspace && (
                <button
                  onClick={() => {
                    onClearWorkspace();
                    onClose();
                  }}
                  id="btn-process-more"
                  className="w-full sm:w-auto flex-1 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Process More Files</span>
                </button>
              )}
              <button
                onClick={onClose}
                id="btn-close-success"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs active:scale-95 transition text-slate-700 dark:text-slate-300"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-800 dark:text-slate-100">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Download className="w-5 h-5" />
                </div>
                <span>Export PDF Document</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`grid grid-cols-1 ${hasSplitPoints ? '' : 'md:grid-cols-5'} gap-6 p-6 max-h-[70vh] overflow-y-auto`}>
              {/* Left Column - Parameters */}
              <div className={`${hasSplitPoints ? '' : 'md:col-span-3'} flex flex-col gap-5`}>
                {hasSplitPoints && (
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 flex items-start gap-3 text-xs">
                    <Scissors className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
                    <div>
                      <div className="font-bold">Split Lines Active ({splitPointsCount} boundary line{splitPointsCount > 1 ? 's' : ''})</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Your document contains red split lines. Exporting will create {splitPointsCount + 1} separate PDF files (one for each split range) packaged together in a ZIP archive.
                      </div>
                    </div>
                  </div>
                )}

                {/* Filename */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Filename:
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={e => setFilename(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                  />
                </div>

                {/* Target Pages */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Export Scope:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTargetPages('all')}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                        targetPages === 'all'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      All ({pages.length})
                    </button>
                    <button
                      onClick={() => setTargetPages('selected')}
                      disabled={selectedCount === 0}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                        targetPages === 'selected'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      Selected ({selectedCount})
                    </button>
                    <button
                      onClick={() => setTargetPages('range')}
                      className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                        targetPages === 'range'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Custom Range
                    </button>
                  </div>

                  {targetPages === 'range' && (
                    <input
                      type="text"
                      value={customRangeStr}
                      onChange={e => setCustomRangeStr(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="mt-1 w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  )}
                </div>

                {/* Export Format Selector (Based on detected system) */}
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Export Format:</span>
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      System: {systemInfo.os}
                    </span>
                  </div>
                  
                  {hasSplitPoints ? (
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      Multiple split files will be packaged as a ZIP archive for your system.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setExportFormat('pdf')}
                          className={`py-2 px-3 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                            exportFormat === 'pdf'
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>Direct PDF (.pdf)</span>
                          <span className="text-[9px] opacity-75 font-medium">Recommended for {systemInfo.os}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportFormat('zip')}
                          disabled={systemInfo.isMobile}
                          className={`py-2 px-3 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                            exportFormat === 'zip'
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40'
                          }`}
                        >
                          <span>ZIP Archive (.zip)</span>
                          <span className="text-[9px] opacity-75 font-medium">
                            {systemInfo.isMobile ? 'Not supported on mobile' : 'Pack in compressed folder'}
                          </span>
                        </button>
                      </div>
                      {systemInfo.isMobile && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                          * Direct PDF download is selected automatically to ensure full compatibility with your mobile device.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Page Numbering Options Block */}
                {!hasSplitPoints && (
                  <div className="flex flex-col gap-4 border-t border-slate-200/60 dark:border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Add Page Numbering</span>
                      <span className="text-[10px] text-slate-400">Configure page headers or footers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPgNumEnabled(!pgNumEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pgNumEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pgNumEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {pgNumEnabled && (
                    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-800/60">
                      {/* Pattern Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200">
                          Pattern:
                        </label>
                        <input
                          type="text"
                          value={pgNumPattern}
                          onChange={e => setPgNumPattern(e.target.value)}
                          placeholder="{NUM} / {CNT}"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                        />
                      </div>

                      {/* Font Family & Styles (Bold, Italic) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Font Family:
                          </label>
                          <select
                            value={pgNumFontFamily}
                            onChange={e => setPgNumFontFamily(e.target.value as any)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          >
                            <option value="Sans">Sans-Serif (Helvetica)</option>
                            <option value="Serif">Serif (Times Roman)</option>
                            <option value="Monospace">Monospace (Courier)</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Format options:
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPgNumIsBold(!pgNumIsBold)}
                              className={`flex-1 py-1.5 rounded-xl border font-extrabold text-center transition text-xs ${
                                pgNumIsBold
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => setPgNumIsItalic(!pgNumIsItalic)}
                              className={`flex-1 py-1.5 rounded-xl border italic font-extrabold text-center transition text-xs ${
                                pgNumIsItalic
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              I
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Font Size, Color & Alpha */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Font size:
                          </label>
                          <input
                            type="number"
                            min={4}
                            max={72}
                            value={pgNumFontSize}
                            onChange={e => setPgNumFontSize(Number(e.target.value) || 8)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Color:
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="color"
                              value={pgNumColor}
                              onChange={e => setPgNumColor(e.target.value)}
                              className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0 overflow-hidden"
                            />
                            <input
                              type="text"
                              value={pgNumColor.toUpperCase()}
                              onChange={e => setPgNumColor(e.target.value)}
                              className="w-full min-w-0 px-1 py-1.5 text-[9px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Alpha:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            value={pgNumOpacity}
                            onChange={e => setPgNumOpacity(Math.max(0, Math.min(1, Number(e.target.value) || 1)))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Position & Angle */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Position:
                          </label>
                          <select
                            value={pgNumPosition}
                            onChange={e => setPgNumPosition(e.target.value as any)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          >
                            <option value="bottom_center">Bottom Center</option>
                            <option value="bottom_left">Bottom Left</option>
                            <option value="bottom_right">Bottom Right</option>
                            <option value="top_center">Top Center</option>
                            <option value="top_left">Top Left</option>
                            <option value="top_right">Top Right</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            Angle (°):
                          </label>
                          <input
                            type="number"
                            min={-360}
                            max={360}
                            value={pgNumAngle}
                            onChange={e => setPgNumAngle(Number(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Spacing (offsetX, offsetY) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-800 dark:text-slate-200">
                          Space offset (X & Y in mm):
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono w-4">X:</span>
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={pgNumOffsetX}
                              onChange={e => setPgNumOffsetX(Number(e.target.value) || 0)}
                              className="w-full px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono w-4">Y:</span>
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={pgNumOffsetY}
                              onChange={e => setPgNumOffsetY(Number(e.target.value) || 0)}
                              className="w-full px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Start Page & Start Number */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            First page:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={pagesToExport.length || 1}
                            value={pgNumStartPage}
                            onChange={e => setPgNumStartPage(Number(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-slate-800 dark:text-slate-200">
                            First number:
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={pgNumStartNumber}
                            onChange={e => setPgNumStartNumber(Number(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Last Page Limit & CNT value Override */}
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id="last-page-check"
                              checked={pgNumLastPageEnabled}
                              onChange={e => setPgNumLastPageEnabled(e.target.checked)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <label htmlFor="last-page-check" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                              Last page:
                            </label>
                          </div>
                          <input
                            type="number"
                            min={1}
                            disabled={!pgNumLastPageEnabled}
                            value={pgNumLastPageValue}
                            onChange={e => setPgNumLastPageValue(Number(e.target.value) || 1)}
                            className="w-full px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs disabled:opacity-40"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id="cnt-val-check"
                              checked={pgNumTotalCountEnabled}
                              onChange={e => setPgNumTotalCountEnabled(e.target.checked)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <label htmlFor="cnt-val-check" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                              CNT value:
                            </label>
                          </div>
                          <input
                            type="number"
                            min={1}
                            disabled={!pgNumTotalCountEnabled}
                            value={pgNumTotalCountValue}
                            onChange={e => setPgNumTotalCountValue(Number(e.target.value) || 1)}
                            className="w-full px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs disabled:opacity-40"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* Right Column - Sticky Live Preview */}
              {!hasSplitPoints && (
                <div className="md:col-span-2 flex flex-col gap-3">
                <div className="sticky top-0 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Live Preview</span>
                    <span className="text-[10px] px-2 py-0.5 font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Real-time
                    </span>
                  </div>
                  
                  <div className="relative w-full aspect-[1/1.41] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-4 flex flex-col justify-between overflow-hidden">
                    {/* Page content wireframe simulator */}
                    <div className="flex flex-col gap-2 opacity-10 pointer-events-none select-none w-full">
                      <div className="h-2 w-1/3 bg-slate-400 rounded-full" />
                      <div className="h-1 w-full bg-slate-300 rounded-full" />
                      <div className="h-1 w-full bg-slate-300 rounded-full" />
                      <div className="h-1 w-5/6 bg-slate-300 rounded-full" />
                      <div className="h-2 w-1/2 bg-slate-400 rounded-full mt-3" />
                      <div className="h-1 w-full bg-slate-300 rounded-full" />
                      <div className="h-1 w-full bg-slate-300 rounded-full" />
                      <div className="h-1 w-4/5 bg-slate-300 rounded-full" />
                      <div className="h-1 w-11/12 bg-slate-300 rounded-full" />
                      <div className="h-2 w-2/5 bg-slate-400 rounded-full mt-3" />
                      <div className="h-1 w-full bg-slate-300 rounded-full" />
                      <div className="h-1 w-3/4 bg-slate-300 rounded-full" />
                    </div>

                    {/* Custom Page Number Placement indicator */}
                    {pgNumEnabled && (
                      <div style={getPreviewPageNumberStyle()}>
                        {pgNumPattern
                          .replace('{NUM}', pgNumStartNumber.toString())
                          .replace('{CNT}', (pgNumTotalCountEnabled ? pgNumTotalCountValue : pagesToExport.length).toString())}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Adjust page number parameters on the left to see instant updates in this simulated document canvas.
                  </p>
                </div>
              </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting || activePagesCount === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export {activePagesCount} Pages</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
