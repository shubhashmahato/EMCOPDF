/**
 * PDF Export & Manipulation Service using pdf-lib, JSZip, and file-saver
 */

import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ExportOptions, PdfPageItem, SplitMode, SplitRange, PageNumberSettings } from '../types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace(/^#/, '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r: r / 255, g: g / 255, b: b / 255 };
}
import { parsePageRangeString } from '../utils/formatters';

export class PdfExportService {
  /**
   * Export ordered list of pages as a single unified PDF
   */
  static async exportPagesAsPdf(
    pages: PdfPageItem[],
    documents: Map<string, ArrayBuffer>,
    options: ExportOptions
  ): Promise<Uint8Array> {
    // Filter out soft-deleted pages if active non-deleted pages exist
    const activePages = pages.filter(p => !p.isDeleted);
    const pagesToExport = activePages.length > 0 ? activePages : pages;

    if (pagesToExport.length === 0) {
      throw new Error('No pages selected for export');
    }

    const mergedPdf = await PDFDocument.create();

    // Cache loaded PDFDoc instances to avoid re-parsing same source doc repeatedly
    const loadedPdfLibDocs = new Map<string, PDFDocument>();

    // Lazy load or load all provided buffers safely
    for (const docId of Array.from(documents.keys())) {
      const buffer = documents.get(docId);
      if (buffer) {
        try {
          const loadedDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          loadedPdfLibDocs.set(docId, loadedDoc);
        } catch (err: any) {
          console.error(`Error loading document ${docId} in pdf-lib:`, err);
        }
      }
    }

    let pageNumberCounter = 1;

    for (const pageItem of pagesToExport) {
      let srcDoc = loadedPdfLibDocs.get(pageItem.docId);
      if (!srcDoc) {
        // Fallback: try fetching buffer from documents map directly if not cached
        const buf = documents.get(pageItem.docId);
        if (buf) {
          try {
            srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            loadedPdfLibDocs.set(pageItem.docId, srcDoc);
          } catch (err) {
            console.error(`Failed loading document buffer for page ${pageItem.docName}`, err);
          }
        }
      }

      if (!srcDoc) {
        console.warn(`Source document missing for page ${pageItem.pageNumber} (${pageItem.docName})`);
        continue;
      }

      if (pageItem.originalPageIndex < 0 || pageItem.originalPageIndex >= srcDoc.getPageCount()) {
        console.warn(`Invalid page index ${pageItem.originalPageIndex} for doc with ${srcDoc.getPageCount()} pages`);
        continue;
      }

      // Copy page into new document
      const [copiedPage] = await mergedPdf.copyPages(srcDoc, [pageItem.originalPageIndex]);
      
      // Calculate final rotation
      const existingRot = copiedPage.getRotation().angle || 0;
      const additionalRot = pageItem.rotation || 0;
      const finalAngle = (existingRot + additionalRot) % 360;
      copiedPage.setRotation(degrees(finalAngle));

      // Optional Watermark
      if (options.watermarkText && options.watermarkText.trim()) {
        try {
          const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
          const { width, height } = copiedPage.getSize();
          copiedPage.drawText(options.watermarkText.trim(), {
            x: width / 4,
            y: height / 2,
            size: Math.min(width, height) / 12,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.35,
            rotate: degrees(45),
          });
        } catch (e) {
          console.warn('Could not draw watermark', e);
        }
      }

      // Optional Page Numbers
      const settings = options.pageNumberSettings || (options.includePageNumbers ? {
        enabled: true,
        pattern: '{NUM} / {CNT}',
        fontFamily: 'Sans' as const,
        fontSize: 10,
        isBold: false,
        isItalic: false,
        color: '#4b5563',
        opacity: 1,
        position: 'bottom_center' as const,
        angle: 0,
        offsetX: 5,
        offsetY: 7,
        startPage: 1,
        startNumber: 1,
        lastPageEnabled: false,
        lastPageValue: pagesToExport.length,
        totalCountEnabled: false,
        totalCountValue: pagesToExport.length
      } : null);

      if (settings && settings.enabled) {
        try {
          const startPage = settings.startPage || 1;
          const lastPageValue = settings.lastPageValue || pagesToExport.length;
          const isPageNumberable = pageNumberCounter >= startPage && (!settings.lastPageEnabled || pageNumberCounter <= lastPageValue);

          if (isPageNumberable) {
            const numValue = pageNumberCounter - startPage + (settings.startNumber || 1);
            const cntValue = settings.totalCountEnabled && settings.totalCountValue !== undefined 
              ? settings.totalCountValue 
              : pagesToExport.length;

            const text = settings.pattern
              .replace('{NUM}', numValue.toString())
              .replace('{CNT}', cntValue.toString());

            let fontName = StandardFonts.Helvetica;
            if (settings.fontFamily === 'Sans') {
              if (settings.isBold && settings.isItalic) fontName = StandardFonts.HelveticaBoldOblique;
              else if (settings.isBold) fontName = StandardFonts.HelveticaBold;
              else if (settings.isItalic) fontName = StandardFonts.HelveticaOblique;
              else fontName = StandardFonts.Helvetica;
            } else if (settings.fontFamily === 'Serif') {
              if (settings.isBold && settings.isItalic) fontName = StandardFonts.TimesRomanBoldItalic;
              else if (settings.isBold) fontName = StandardFonts.TimesRomanBold;
              else if (settings.isItalic) fontName = StandardFonts.TimesRomanItalic;
              else fontName = StandardFonts.TimesRoman;
            } else if (settings.fontFamily === 'Monospace') {
              if (settings.isBold && settings.isItalic) fontName = StandardFonts.CourierBoldOblique;
              else if (settings.isBold) fontName = StandardFonts.CourierBold;
              else if (settings.isItalic) fontName = StandardFonts.CourierOblique;
              else fontName = StandardFonts.Courier;
            }

            const font = await mergedPdf.embedFont(fontName);
            const { width, height } = copiedPage.getSize();
            const size = settings.fontSize || 10;
            const textWidth = font.widthOfTextAtSize(text, size);
            const textHeight = font.heightAtSize(size);

            const MM_TO_POINTS = 2.83464;
            const sX = (settings.offsetX !== undefined ? settings.offsetX : 5) * MM_TO_POINTS;
            const sY = (settings.offsetY !== undefined ? settings.offsetY : 5) * MM_TO_POINTS;

            let x = 0;
            let y = 0;
            const pos = settings.position || 'bottom_center';
            if (pos.startsWith('bottom_')) {
              y = sY;
            } else if (pos.startsWith('top_')) {
              y = height - textHeight - sY;
            }

            if (pos.endsWith('_left')) {
              x = sX;
            } else if (pos.endsWith('_center')) {
              x = width / 2 - textWidth / 2;
            } else if (pos.endsWith('_right')) {
              x = width - textWidth - sX;
            }

            const { r, g, b } = hexToRgb(settings.color || '#000000');

            copiedPage.drawText(text, {
              x,
              y,
              size,
              font,
              color: rgb(r, g, b),
              opacity: settings.opacity !== undefined ? settings.opacity : 1,
              rotate: degrees(settings.angle || 0),
            });
          }
        } catch (e) {
          console.warn('Could not draw customized page number', e);
        }
      }

      mergedPdf.addPage(copiedPage);
      pageNumberCounter++;
    }

    if (mergedPdf.getPageCount() === 0) {
      throw new Error('No valid pages could be merged. Please check that the selected files are valid PDF documents.');
    }

    // Set metadata if preserved
    if (options.preserveMetadata) {
      mergedPdf.setTitle(options.filename.replace('.pdf', ''));
      mergedPdf.setProducer('EMCOPDF');
      mergedPdf.setCreator('EMCOPDF Client');
      mergedPdf.setModificationDate(new Date());
    }

    const pdfBytes = await mergedPdf.save({
      useObjectStreams: options.compressionQuality !== 'none',
    });

    return pdfBytes;
  }

  /**
   * Split pages according to split configuration and return list of split PDF files
   */
  static async splitPdfToFiles(
    pages: PdfPageItem[],
    documents: Map<string, ArrayBuffer>,
    mode: SplitMode,
    splitSettings: {
      everyNPages?: number;
      customRangeString?: string;
      selectedPageIndices?: number[];
      blankPageIndices?: number[];
      bookmarks?: { title: string; pageIndex: number }[];
      pageNumberSettings?: PageNumberSettings;
    },
    baseFilename: string = 'Document'
  ): Promise<{ filename: string; data: Uint8Array; pageCount: number }[]> {
    const activePages = pages.filter(p => !p.isDeleted);
    if (activePages.length === 0) return [];

    const splitRanges: { label: string; pages: PdfPageItem[] }[] = [];
    const totalPages = activePages.length;

    const hasSplitPoints = activePages.some(p => p.isSplitPoint);

    if (mode === 'by_split_points' || (hasSplitPoints && mode !== 'every_page' && mode !== 'every_n_pages' && mode !== 'custom_range' && mode !== 'selected' && mode !== 'blank_pages')) {
      let groupCount = 1;
      let currentGroup: PdfPageItem[] = [];

      for (let i = 0; i < totalPages; i++) {
        const page = activePages[i];
        currentGroup.push(page);

        if (page.isSplitPoint || i === totalPages - 1) {
          const firstNum = currentGroup[0].pageNumber || (i - currentGroup.length + 2);
          const lastNum = currentGroup[currentGroup.length - 1].pageNumber || (i + 1);
          const label = firstNum === lastNum
            ? `${baseFilename}_Part_${groupCount}_(Page_${firstNum})`
            : `${baseFilename}_Part_${groupCount}_(Pages_${firstNum}-${lastNum})`;

          splitRanges.push({
            label,
            pages: [...currentGroup],
          });
          groupCount++;
          currentGroup = [];
        }
      }
    } else if (mode === 'every_page') {
      for (let i = 0; i < totalPages; i++) {
        const page = activePages[i];
        splitRanges.push({
          label: `${baseFilename}_Page_${page.pageNumber || (i + 1)}`,
          pages: [page],
        });
      }
    } else if (mode === 'every_n_pages') {
      const n = Math.max(1, splitSettings.everyNPages || 2);
      let fileCount = 1;
      for (let i = 0; i < totalPages; i += n) {
        const groupPages = activePages.slice(i, Math.min(i + n, totalPages));
        const firstNum = groupPages[0].pageNumber || (i + 1);
        const lastNum = groupPages[groupPages.length - 1].pageNumber || (i + groupPages.length);
        splitRanges.push({
          label: `${baseFilename}_Part_${fileCount}_(p${firstNum}-${lastNum})`,
          pages: groupPages,
        });
        fileCount++;
      }
    } else if (mode === 'selected') {
      const selectedPages = activePages.filter(p => p.isSelected);
      const unselectedPages = activePages.filter(p => !p.isSelected);

      if (selectedPages.length > 0) {
        splitRanges.push({
          label: `${baseFilename}_Selected_Pages`,
          pages: selectedPages,
        });
      }
      if (unselectedPages.length > 0) {
        splitRanges.push({
          label: `${baseFilename}_Unselected_Pages`,
          pages: unselectedPages,
        });
      }
    } else if (mode === 'custom_range') {
      const rangesStr = splitSettings.customRangeString || '1';
      const parts = rangesStr.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
      let rangeCounter = 1;
      for (const part of parts) {
        const indices = parsePageRangeString(part, totalPages);
        if (indices.length > 0) {
          const subset = indices.map(idx => activePages[idx]).filter(Boolean);
          if (subset.length > 0) {
            splitRanges.push({
              label: `${baseFilename}_Range_${part.replace(/\s+/g, '')}_(${rangeCounter})`,
              pages: subset,
            });
            rangeCounter++;
          }
        }
      }
    } else if (mode === 'blank_pages') {
      const blanks = new Set(splitSettings.blankPageIndices || []);
      let currentGroup: PdfPageItem[] = [];
      let groupCount = 1;

      for (let i = 0; i < totalPages; i++) {
        if (blanks.has(i)) {
          if (currentGroup.length > 0) {
            splitRanges.push({
              label: `${baseFilename}_Section_${groupCount}`,
              pages: [...currentGroup],
            });
            groupCount++;
            currentGroup = [];
          }
        } else {
          currentGroup.push(activePages[i]);
        }
      }
      if (currentGroup.length > 0) {
        splitRanges.push({
          label: `${baseFilename}_Section_${groupCount}`,
          pages: [...currentGroup],
        });
      }
    } else {
      // Fallback
      splitRanges.push({
        label: `${baseFilename}_Export`,
        pages: [...activePages],
      });
    }

    const exportOptionsDefaults: ExportOptions = {
      filename: '',
      mode: 'single_pdf',
      targetPages: 'all',
      compressionQuality: 'low',
      preserveMetadata: true,
      includePageNumbers: splitSettings.pageNumberSettings?.enabled || false,
      pageNumberSettings: splitSettings.pageNumberSettings,
    };

    const results: { filename: string; data: Uint8Array; pageCount: number }[] = [];

    for (const range of splitRanges) {
      if (range.pages.length === 0) continue;
      const pdfBytes = await this.exportPagesAsPdf(range.pages, documents, {
        ...exportOptionsDefaults,
        filename: `${range.label}.pdf`,
      });

      results.push({
        filename: `${range.label}.pdf`,
        data: pdfBytes,
        pageCount: range.pages.length,
      });
    }

    return results;
  }

  /**
   * Package multiple files into a JSZip archive and trigger browser download
   */
  static async exportFilesAsZip(
    files: { filename: string; data: Uint8Array }[],
    zipFilename: string = 'PDF_Page_Editor_Export.zip'
  ): Promise<void> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.filename, file.data);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
  }

  /**
   * Directly save a single PDF Uint8Array to disk
   */
  static savePdfFile(data: Uint8Array, filename: string): void {
    const blob = new Blob([data.buffer], { type: 'application/pdf' });
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    saveAs(blob, cleanFilename);
  }
}
