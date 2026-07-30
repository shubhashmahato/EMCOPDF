/**
 * PDF Processing & Rendering Service using pdfjs-dist
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PageDimensions, RotationAngle } from '../types';
import { getPageFormatLabel } from '../utils/formatters';

// Configure PDFJS worker using Vite's native URL constructor.
// This is compiled by Vite as a clean, standalone, same-origin worker file in both development and production,
// which avoids Vite HMR /@vite/client issues, CORS iframe restrictions, and cross-browser loading errors.
if (typeof window !== 'undefined') {
  try {
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (err) {
    console.warn('Failed to resolve Vite native worker URL, falling back to CDN:', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/build/pdf.worker.min.mjs`;
  }
}

export interface LoadedPdfMeta {
  pageCount: number;
  pagesDimensions: PageDimensions[];
  pagesOriginalRotation: RotationAngle[];
  isEncrypted: boolean;
  docTitle?: string;
}

export class PdfService {
  // Global document proxy cache to avoid reloading/reparsing heavy PDFs
  private static docCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

  static getCachedDocument(
    docId: string,
    arrayBuffer: ArrayBuffer,
    password?: string
  ): Promise<pdfjsLib.PDFDocumentProxy> {
    let cached = this.docCache.get(docId);
    if (!cached) {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer.slice(0)),
        password: password || '',
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/cmaps/`,
        cMapPacked: true,
      });
      cached = loadingTask.promise;
      this.docCache.set(docId, cached);
    }
    return cached;
  }

  static clearCache(docId?: string) {
    if (docId) {
      this.docCache.delete(docId);
    } else {
      this.docCache.clear();
    }
  }

  /**
   * Load PDF document from ArrayBuffer and inspect page metadata
   */
  static async loadDocument(
    arrayBuffer: ArrayBuffer,
    password?: string,
    docId?: string,
    onProgress?: (percent: number) => void
  ): Promise<LoadedPdfMeta> {
    let pdfDoc: pdfjsLib.PDFDocumentProxy;
    try {
      if (docId) {
        pdfDoc = await this.getCachedDocument(docId, arrayBuffer, password);
      } else {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer.slice(0)),
          password: password || '',
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/cmaps/`,
          cMapPacked: true,
        });
        pdfDoc = await loadingTask.promise;
      }
    } catch (err: any) {
      if (err?.name === 'PasswordException') {
        throw new Error('PASSWORD_REQUIRED');
      }
      throw new Error(err?.message || 'Failed to load PDF file');
    }

    const pageCount = pdfDoc.numPages;
    const pagesDimensions: PageDimensions[] = new Array(pageCount);
    const pagesOriginalRotation: RotationAngle[] = new Array(pageCount);

    // Resolve all page metadata in parallel (extremely fast, zero blocking)
    let resolvedCount = 0;
    const pagePromises: Promise<void>[] = [];
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      pagePromises.push((async (pNum) => {
        const page = await pdfDoc.getPage(pNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const rawRotation = (page.rotate || 0) % 360;
        const rotation = (rawRotation < 0 ? rawRotation + 360 : rawRotation) as RotationAngle;

        const width = viewport.width;
        const height = viewport.height;
        const formatName = getPageFormatLabel(width, height);

        pagesDimensions[pNum - 1] = {
          width: Math.round(width),
          height: Math.round(height),
          aspectRatio: width / height,
          formatName,
        };

        pagesOriginalRotation[pNum - 1] = rotation;
        
        resolvedCount++;
        if (onProgress) {
          onProgress(Math.floor((resolvedCount / pageCount) * 100));
        }
      })(pageNum));
    }

    await Promise.all(pagePromises);

    let docTitle: string | undefined;
    try {
      const metadata = await pdfDoc.getMetadata();
      docTitle = (metadata?.info as any)?.Title;
    } catch {
      // Ignore metadata error
    }

    return {
      pageCount,
      pagesDimensions,
      pagesOriginalRotation,
      isEncrypted: false,
      docTitle,
    };
  }

  /**
   * Render thumbnail for a specific page onto an offscreen canvas and return data URL
   */
  static async renderThumbnailDataUrl(
    arrayBuffer: ArrayBuffer,
    pageIndex: number, // 0-based
    rotationAngle: RotationAngle = 0,
    renderScale: number = 1.0,
    password?: string,
    docId?: string
  ): Promise<string> {
    const pdfDoc = docId
      ? await this.getCachedDocument(docId, arrayBuffer, password)
      : await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password || '',
        }).promise;

    const page = await pdfDoc.getPage(pageIndex + 1);

    // Combine original metadata rotation with user rotation
    const totalRotation = ((page.rotate || 0) + rotationAngle) % 360;
    const viewport = page.getViewport({ scale: renderScale, rotation: totalRotation });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext as any).promise;

    const dataUrl = canvas.toDataURL('image/png', 0.85);

    // Clean up
    canvas.width = 0;
    canvas.height = 0;

    // Only clean up and destroy if we are not utilizing the shared document cache
    if (!docId) {
      try {
        await pdfDoc.cleanup();
      } catch {
        // Ignore cleanup error
      }
    }

    return dataUrl;
  }

  /**
   * Render full-resolution page for interactive viewer
   */
  static async renderFullPageToCanvas(
    arrayBuffer: ArrayBuffer,
    pageIndex: number,
    canvas: HTMLCanvasElement,
    rotationAngle: RotationAngle = 0,
    scale: number = 1.5,
    password?: string,
    docId?: string
  ): Promise<void> {
    const pdfDoc = docId
      ? await this.getCachedDocument(docId, arrayBuffer, password)
      : await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password || '',
        }).promise;

    const page = await pdfDoc.getPage(pageIndex + 1);

    const totalRotation = ((page.rotate || 0) + rotationAngle) % 360;
    const viewport = page.getViewport({ scale, rotation: totalRotation });

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    // Handle high DPI crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);

    ctx.scale(dpr, dpr);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext as any).promise;

    if (!docId) {
      try {
        await pdfDoc.cleanup();
      } catch {
        // Ignore cleanup error
      }
    }
  }

  /**
   * Extract PDF outline/bookmarks for bookmark-based splitting
   */
  static async getBookmarks(arrayBuffer: ArrayBuffer): Promise<{ title: string; pageIndex: number }[]> {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdfDoc = await loadingTask.promise;
    const outline = await pdfDoc.getOutline();

    if (!outline || outline.length === 0) {
      try {
        await pdfDoc.cleanup();
        await loadingTask.destroy();
      } catch {
        // Ignore
      }
      return [];
    }

    const bookmarks: { title: string; pageIndex: number }[] = [];

    for (const item of outline) {
      if (item.dest) {
        try {
          let dest = item.dest;
          if (typeof dest === 'string') {
            dest = await pdfDoc.getDestination(dest);
          }
          if (Array.isArray(dest) && dest[0]) {
            const pageRef = dest[0];
            const pageIndex = await pdfDoc.getPageIndex(pageRef);
            bookmarks.push({ title: item.title, pageIndex });
          }
        } catch {
          // Skip unresolvable bookmark destination
        }
      }
    }

    try {
      await pdfDoc.cleanup();
      await loadingTask.destroy();
    } catch {
      // Ignore
    }
    return bookmarks;
  }

  /**
   * Detect blank pages in a PDF document (based on canvas pixel analysis & text content length)
   */
  static async detectBlankPages(
    arrayBuffer: ArrayBuffer,
    totalPages: number,
    docId?: string
  ): Promise<number[]> {
    const pdfDoc = docId
      ? await this.getCachedDocument(docId, arrayBuffer)
      : await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        }).promise;

    const blankIndices: number[] = [];
    const BATCH_SIZE = 50;

    for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
      const batchPromises: Promise<number | null>[] = [];
      const end = Math.min(i + BATCH_SIZE - 1, totalPages);

      for (let j = i; j <= end; j++) {
        batchPromises.push((async (pageNum) => {
          try {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const textLength = textContent.items.reduce(
              (acc: number, item: any) => acc + (item.str ? item.str.trim().length : 0),
              0
            );

            if (textLength === 0) {
              // Render tiny low-res thumbnail to inspect image pixels
              const viewport = page.getViewport({ scale: 0.1 });
              const canvas = document.createElement('canvas');
              canvas.width = Math.floor(viewport.width);
              canvas.height = Math.floor(viewport.height);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport } as any).promise;
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let nonWhitePixels = 0;
                for (let p = 0; p < imgData.data.length; p += 4) {
                  const r = imgData.data[p];
                  const g = imgData.data[p + 1];
                  const b = imgData.data[p + 2];
                  // Check if pixel is substantially different from pure white (255,255,255)
                  if (r < 240 || g < 240 || b < 240) {
                    nonWhitePixels++;
                  }
                }
                // If less than 0.5% non-white pixels, consider it a blank page!
                if (nonWhitePixels < (imgData.data.length / 4) * 0.005) {
                  return pageNum - 1;
                }
              }
            }
          } catch (err) {
            console.error(`Error scanning page ${pageNum} for blankness:`, err);
          }
          return null;
        })(j));
      }

      const results = await Promise.all(batchPromises);
      for (const res of results) {
        if (res !== null) {
          blankIndices.push(res);
        }
      }
    }

    if (!docId) {
      try {
        await pdfDoc.cleanup();
      } catch {
        // Ignore
      }
    }

    return blankIndices.sort((a, b) => a - b);
  }
}
