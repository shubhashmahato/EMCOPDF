/**
 * Central State Hook for PDF Workspace Management with Unlimited History and Rich Page Operations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PdfDocument,
  PdfPageItem,
  RotationAngle,
  HistorySnapshot,
  ToastNotification,
  SearchFilterState,
} from '../types';
import { PdfService } from '../services/pdfService';
import { getRandomAccentColor } from '../utils/formatters';

export function usePdfWorkspace() {
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [docBuffersMap, setDocBuffersMap] = useState<Map<string, ArrayBuffer>>(new Map());
  
  // Selection
  const [lastSelectedPageIndex, setLastSelectedPageIndex] = useState<number | null>(null);

  // Loading & Processing state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // History for Undo / Redo
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState<SearchFilterState>({
    query: '',
    filterRotation: 'all',
    filterDocId: 'all',
    filterLocked: 'all',
  });

  // Password prompt state
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    file: File | null;
    fileName: string;
    errorMsg?: string;
  }>({
    isOpen: false,
    file: null,
    fileName: '',
  });

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Save current state into History Snapshot
  const pushHistoryState = useCallback((newPages: PdfPageItem[], actionName: string) => {
    setHistoryIndex(currentIndex => {
      setHistory(prev => {
        const sliced = prev.slice(0, currentIndex + 1);
        const snapshot: HistorySnapshot = {
          pages: JSON.parse(JSON.stringify(newPages)),
          timestamp: Date.now(),
          actionName,
        };
        return [...sliced, snapshot];
      });
      return currentIndex + 1;
    });
  }, []);

  // Handle Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevSnapshot = history[historyIndex - 1];
      setPages(JSON.parse(JSON.stringify(prevSnapshot.pages)));
      setHistoryIndex(prev => prev - 1);
      addToast({
        type: 'info',
        title: `Undo: ${history[historyIndex].actionName}`,
      });
    }
  }, [historyIndex, history, addToast]);

  // Handle Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextSnapshot = history[historyIndex + 1];
      setPages(JSON.parse(JSON.stringify(nextSnapshot.pages)));
      setHistoryIndex(prev => prev + 1);
      addToast({
        type: 'info',
        title: `Redo: ${nextSnapshot.actionName}`,
      });
    }
  }, [historyIndex, history, addToast]);

  /**
   * Helper to re-index pageNumber (1-based) across all pages
   */
  const reindexPages = (pList: PdfPageItem[]): PdfPageItem[] => {
    return pList.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));
  };

  /**
   * Process a batch of PDF files simultaneously
   */
  const addPdfFiles = async (
    files: File[],
    passwordsMap?: Record<string, string>
  ): Promise<boolean> => {
    if (!files || files.length === 0) return false;

    setIsLoading(true);
    setLoadingProgress(5);
    setLoadingMessage(`Reading ${files.length} PDF file${files.length > 1 ? 's' : ''}...`);

    let passwordRequiredFile: { file: File; fileName: string } | null = null;
    const fileProgresses = new Array(files.length).fill(0);
    let completedCount = 0;
    let successCount = 0;
    let lastPercent = 5;

    const updateOverallProgress = (index: number, val: number) => {
      fileProgresses[index] = val;
      const sum = fileProgresses.reduce((acc, v) => acc + v, 0);
      const overallPercent = Math.floor((sum / (files.length * 100)) * 90);
      const nextPercent = 5 + overallPercent;
      
      if (nextPercent !== lastPercent) {
        lastPercent = nextPercent;
        setLoadingProgress(nextPercent);
        setLoadingMessage(`Loading ${files.length} file${files.length > 1 ? 's' : ''} (${completedCount}/${files.length} completed, ${nextPercent}%)...`);
      }
    };

    // Helper to run tasks with concurrency limit (extremely fast for bulk uploads)
    const limitConcurrency = async <T>(
      concurrency: number,
      items: File[],
      fn: (item: File, index: number) => Promise<T>
    ): Promise<T[]> => {
      const results: T[] = new Array(items.length);
      let currentIndex = 0;

      async function worker() {
        while (currentIndex < items.length) {
          const index = currentIndex++;
          const item = items[index];
          try {
            results[index] = await fn(item, index);
          } catch (err) {
            results[index] = null as any;
          }
        }
      }

      const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
      await Promise.all(workers);
      return results;
    };

    const results = await limitConcurrency(6, files, async (file, fIdx) => {
      fileProgresses[fIdx] = 5;
      updateOverallProgress(fIdx, 5);

      try {
        const arrayBuffer = await file.arrayBuffer();
        fileProgresses[fIdx] = 15;
        updateOverallProgress(fIdx, 15);

        const docId = `doc_${Date.now()}_${fIdx}_${Math.random().toString(36).substr(2, 6)}`;
        const password = passwordsMap?.[file.name];

        let meta;
        try {
          meta = await PdfService.loadDocument(arrayBuffer, password, docId, (parsePercent) => {
            const pageProgress = 15 + Math.floor(parsePercent * 0.8);
            updateOverallProgress(fIdx, pageProgress);
          });
        } catch (err: any) {
          if (err?.message === 'PASSWORD_REQUIRED') {
            if (!passwordRequiredFile) {
              passwordRequiredFile = { file, fileName: file.name };
            }
          }
          throw err;
        }

        const colorTag = getRandomAccentColor(documents.length + fIdx);

        const newDoc: PdfDocument = {
          id: docId,
          name: file.name,
          size: file.size,
          pageCount: meta.pageCount,
          arrayBuffer,
          originalFile: file,
          isEncrypted: meta.isEncrypted,
          color: colorTag,
          loadedAt: Date.now(),
        };

        const pagesList: PdfPageItem[] = [];
        for (let p = 0; p < meta.pageCount; p++) {
          const dim = meta.pagesDimensions[p] || { width: 595, height: 842, aspectRatio: 0.707 };
          const origRot = meta.pagesOriginalRotation[p] || 0;

          pagesList.push({
            id: `${docId}_p${p}_${Math.random().toString(36).substr(2, 5)}`,
            docId,
            docName: file.name,
            originalPageIndex: p,
            pageNumber: 0,
            rotation: 0,
            originalRotation: origRot,
            dimensions: dim,
            isSelected: false,
            isLocked: false,
            thumbnailStatus: 'idle',
          });
        }

        fileProgresses[fIdx] = 100;
        completedCount++;
        successCount++;
        updateOverallProgress(fIdx, 100);

        return { newDoc, arrayBuffer, pagesList };
      } catch (err: any) {
        console.error(`Error loading PDF "${file.name}":`, err);
        if (files.length <= 10) {
          addToast({
            type: 'error',
            title: `Error Loading ${file.name}`,
            message: err?.message || 'Could not parse PDF file.',
          });
        }
        
        fileProgresses[fIdx] = 100;
        completedCount++;
        updateOverallProgress(fIdx, 100);
        return null;
      }
    });

    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (validResults.length > 0) {
      const loadedDocs = validResults.map(r => r.newDoc);
      const loadedPagesList = validResults.flatMap(r => r.pagesList);
      const loadedBuffersMap = new Map<string, ArrayBuffer>();
      validResults.forEach(r => loadedBuffersMap.set(r.newDoc.id, r.arrayBuffer));

      // Functional state updates to guarantee NO state drops or race conditions!
      setDocBuffersMap(prev => {
        const next = new Map(prev);
        loadedBuffersMap.forEach((buf, id) => next.set(id, buf));
        return next;
      });

      setDocuments(prev => [...prev, ...loadedDocs]);

      setPages(prevPages => {
        const combined = reindexPages([...prevPages, ...loadedPagesList]);
        pushHistoryState(combined, `Added ${loadedDocs.length} file(s)`);
        return combined;
      });

      addToast({
        type: 'success',
        title: files.length > 1 ? 'Files Uploaded' : 'PDF Loaded',
        message: files.length > 1
          ? `Successfully added ${loadedDocs.length} file(s) with ${loadedPagesList.length} total pages`
          : `Loaded "${loadedDocs[0].name}" (${loadedDocs[0].pageCount} pages)`,
      });
    }

    if (passwordRequiredFile) {
      setPasswordModal({
        isOpen: true,
        file: (passwordRequiredFile as any).file,
        fileName: (passwordRequiredFile as any).fileName,
      });
    }

    setIsLoading(false);
    return successCount > 0;
  };

  /**
   * Process a single PDF File (convenience wrapper around addPdfFiles)
   */
  const addPdfFile = async (file: File, password?: string): Promise<boolean> => {
    return addPdfFiles([file], password ? { [file.name]: password } : undefined);
  };

  /**
   * Reorder document sequence in workspace and adjust page order accordingly
   */
  const reorderDocuments = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= documents.length ||
      toIndex >= documents.length
    ) {
      return;
    }

    const updatedDocs = [...documents];
    const [movedDoc] = updatedDocs.splice(fromIndex, 1);
    updatedDocs.splice(toIndex, 0, movedDoc);
    setDocuments(updatedDocs);

    // Group pages by document order
    const pagesByDoc = new Map<string, PdfPageItem[]>();
    updatedDocs.forEach(d => pagesByDoc.set(d.id, []));

    const orphanPages: PdfPageItem[] = [];

    pages.forEach(p => {
      const group = pagesByDoc.get(p.docId);
      if (group) {
        group.push(p);
      } else {
        orphanPages.push(p);
      }
    });

    const reorderedPagesList: PdfPageItem[] = [];
    updatedDocs.forEach(d => {
      const group = pagesByDoc.get(d.id);
      if (group) {
        reorderedPagesList.push(...group);
      }
    });
    reorderedPagesList.push(...orphanPages);

    const reindexed = reindexPages(reorderedPagesList);
    setPages(reindexed);
    pushHistoryState(reindexed, `Reordered documents`);

    addToast({
      type: 'info',
      title: 'Documents Reordered',
      message: `Moved "${movedDoc.name}" to position ${toIndex + 1}`,
    });
  };

  /**
   * Remove a document and all associated pages from workspace
   */
  const removeDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    PdfService.clearCache(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setDocBuffersMap(prev => {
      const next = new Map(prev);
      next.delete(docId);
      return next;
    });

    setPages(prevPages => {
      const updatedPages = reindexPages(prevPages.filter(p => p.docId !== docId));
      pushHistoryState(updatedPages, `Removed ${doc.name}`);
      return updatedPages;
    });

    addToast({
      type: 'info',
      title: 'Document Removed',
      message: `Removed ${doc.name} and its pages.`,
    });
  };

  /**
   * Page Selection Handling (supports Ctrl Click, Shift Click range select)
   */
  const togglePageSelection = (pageId: string, event?: React.MouseEvent) => {
    const pageIdx = pages.findIndex(p => p.id === pageId);
    if (pageIdx === -1) return;

    if (event?.shiftKey && lastSelectedPageIndex !== null) {
      // Range select from lastSelectedPageIndex to pageIdx
      const start = Math.min(lastSelectedPageIndex, pageIdx);
      const end = Math.max(lastSelectedPageIndex, pageIdx);

      const updated = pages.map((p, idx) => {
        if (idx >= start && idx <= end) {
          return { ...p, isSelected: true };
        }
        return p;
      });
      setPages(updated);
    } else if (event?.ctrlKey || event?.metaKey) {
      // Toggle single page keep rest
      const updated = pages.map((p, idx) => {
        if (idx === pageIdx) return { ...p, isSelected: !p.isSelected };
        return p;
      });
      setPages(updated);
      setLastSelectedPageIndex(pageIdx);
    } else {
      // Normal click: toggle target page selection
      const updated = pages.map((p, idx) => {
        if (idx === pageIdx) return { ...p, isSelected: !p.isSelected };
        return p;
      });
      setPages(updated);
      setLastSelectedPageIndex(pageIdx);
    }
  };

  /**
   * Selection Presets
   */
  const selectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: false })));
  }, []);

  const selectOdd = useCallback(() => {
    setPages(prev => prev.map((p, idx) => ({ ...p, isSelected: (idx + 1) % 2 !== 0 })));
  }, []);

  const selectEven = useCallback(() => {
    setPages(prev => prev.map((p, idx) => ({ ...p, isSelected: (idx + 1) % 2 === 0 })));
  }, []);

  const selectRotated = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: p.rotation !== 0 })));
  }, []);

  const selectLocked = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: p.isLocked })));
  }, []);

  const invertSelection = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, isSelected: !p.isSelected })));
  }, []);

  const selectRange = useCallback((startOneBased: number, endOneBased: number) => {
    setPages(prev => prev.map((p, idx) => {
      const pageNum = idx + 1;
      return { ...p, isSelected: pageNum >= startOneBased && pageNum <= endOneBased };
    }));
  }, []);

  /**
   * Rotation Actions
   */
  const rotatePages = (
    targetPageIds: string[],
    angleChange: number
  ) => {
    if (targetPageIds.length === 0) return;

    const updated = pages.map(p => {
      if (targetPageIds.includes(p.id) && !p.isLocked) {
        let baseRot = p.rotation || 0;
        if (baseRot === 360) {
          baseRot = 0;
        }

        let rawRot = baseRot + angleChange;
        let newRot: RotationAngle;

        if (rawRot === 360) {
          newRot = 360;
        } else if (rawRot > 360) {
          const rem = rawRot % 360;
          newRot = (rem === 0 ? 360 : rem) as RotationAngle;
        } else if (rawRot < 0) {
          const rem = ((rawRot % 360) + 360) % 360;
          newRot = (rem === 0 ? 0 : rem) as RotationAngle;
        } else {
          newRot = rawRot as RotationAngle;
        }

        return { ...p, rotation: newRot };
      }
      return p;
    });

    setPages(updated);
    pushHistoryState(updated, `Rotated ${targetPageIds.length} page(s)`);
  };

  const setAbsoluteRotation = (targetPageIds: string[], angle: RotationAngle) => {
    if (targetPageIds.length === 0) return;

    const updated = pages.map(p => {
      if (targetPageIds.includes(p.id) && !p.isLocked) {
        return { ...p, rotation: angle };
      }
      return p;
    });

    setPages(updated);
    pushHistoryState(updated, `Set rotation to ${angle}°`);
  };

  const rotateSelected = (angleChange: number) => {
    const selectedIds = pages.filter(p => p.isSelected && !p.isLocked).map(p => p.id);
    if (selectedIds.length === 0) {
      addToast({ type: 'warning', title: 'No unlocked pages selected' });
      return;
    }
    rotatePages(selectedIds, angleChange);
  };

  const rotateAll = (angleChange: number) => {
    const allUnlockedIds = pages.filter(p => !p.isLocked).map(p => p.id);
    rotatePages(allUnlockedIds, angleChange);
  };

  const rotateOdd = (angleChange: 90 | -90 | 180) => {
    const oddIds = pages.filter((p, idx) => (idx + 1) % 2 !== 0 && !p.isLocked).map(p => p.id);
    rotatePages(oddIds, angleChange);
  };

  const rotateEven = (angleChange: 90 | -90 | 180) => {
    const evenIds = pages.filter((p, idx) => (idx + 1) % 2 === 0 && !p.isLocked).map(p => p.id);
    rotatePages(evenIds, angleChange);
  };

  /**
   * Soft Delete / Toggle Delete state for pages
   */
  const toggleDeletePage = (targetPageId: string) => {
    const updated = pages.map(p => {
      if (p.id === targetPageId) {
        return { ...p, isDeleted: !p.isDeleted };
      }
      return p;
    });
    setPages(updated);
    pushHistoryState(updated, 'Toggled page deletion mark');
  };

  const toggleDeleteSelected = () => {
    const selectedIds = pages.filter(p => p.isSelected).map(p => p.id);
    if (selectedIds.length === 0) return;
    const allSelectedAreDeleted = pages
      .filter(p => p.isSelected)
      .every(p => p.isDeleted);
    const updated = pages.map(p => {
      if (p.isSelected) {
        return { ...p, isDeleted: !allSelectedAreDeleted };
      }
      return p;
    });
    setPages(updated);
    pushHistoryState(updated, 'Toggled selected pages deletion mark');
  };

  /**
   * Split point marker toggle
   */
  const toggleSplitPoint = (targetPageId: string) => {
    const updated = pages.map(p => {
      if (p.id === targetPageId) {
        return { ...p, isSplitPoint: !p.isSplitPoint };
      }
      return p;
    });
    setPages(updated);
    pushHistoryState(updated, 'Toggled split boundary');
  };

  /**
   * Delete Pages
   */
  const deletePages = (targetIds: string[]) => {
    if (targetIds.length === 0) return;

    // Guard against locked pages
    const lockedCount = pages.filter(p => targetIds.includes(p.id) && p.isLocked).length;
    if (lockedCount > 0) {
      addToast({
        type: 'warning',
        title: 'Locked Pages Skipped',
        message: `${lockedCount} locked page(s) were protected from deletion.`,
      });
    }

    const updated = reindexPages(pages.filter(p => !targetIds.includes(p.id) || p.isLocked));
    setPages(updated);
    pushHistoryState(updated, `Deleted ${targetIds.length - lockedCount} page(s)`);

    addToast({
      type: 'info',
      title: 'Pages Deleted',
      message: `Deleted ${targetIds.length - lockedCount} page(s)`,
    });
  };

  const deleteSelected = () => {
    const selectedIds = pages.filter(p => p.isSelected).map(p => p.id);
    if (selectedIds.length === 0) {
      addToast({ type: 'warning', title: 'No pages selected to delete' });
      return;
    }
    deletePages(selectedIds);
  };

  /**
   * Duplicate Pages
   */
  const duplicatePages = (targetIds: string[]) => {
    if (targetIds.length === 0) return;

    const newPagesList: PdfPageItem[] = [];

    for (const p of pages) {
      newPagesList.push(p);
      if (targetIds.includes(p.id)) {
        const dup: PdfPageItem = {
          ...p,
          id: `${p.docId}_p${p.originalPageIndex}_dup_${Math.random().toString(36).substr(2, 5)}`,
          pageNumber: p.pageNumber + 1,
          isSelected: true,
          isLocked: false,
          isDuplicate: true,
        };
        newPagesList.push(dup);
      }
    }

    const reindexed = reindexPages(newPagesList);
    setPages(reindexed);
    pushHistoryState(reindexed, `Duplicated ${targetIds.length} page(s)`);

    addToast({
      type: 'success',
      title: 'Pages Duplicated',
      message: `Created duplicates for ${targetIds.length} page(s)`,
    });
  };

  const duplicateSelected = () => {
    const selectedIds = pages.filter(p => p.isSelected).map(p => p.id);
    if (selectedIds.length === 0) {
      addToast({ type: 'warning', title: 'No pages selected to duplicate' });
      return;
    }
    duplicatePages(selectedIds);
  };

  /**
   * Lock / Unlock Pages
   */
  const toggleLockPages = (targetIds: string[]) => {
    if (targetIds.length === 0) return;

    const updated = pages.map(p => {
      if (targetIds.includes(p.id)) {
        return { ...p, isLocked: !p.isLocked };
      }
      return p;
    });

    setPages(updated);
    pushHistoryState(updated, 'Toggled page locks');
  };

  /**
   * Reorder pages (Move page from source index to destination index)
   */
  const movePage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= pages.length || toIndex >= pages.length) {
      return;
    }

    const updated = [...pages];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    const reindexed = reindexPages(updated);
    setPages(reindexed);
    pushHistoryState(reindexed, `Moved page ${fromIndex + 1} to position ${toIndex + 1}`);
  };

  /**
   * Move selected pages to start, end, or relative offset
   */
  const moveSelectedToPosition = (targetIndex: number) => {
    const selectedPages = pages.filter(p => p.isSelected);
    if (selectedPages.length === 0) return;

    const unselectedPages = pages.filter(p => !p.isSelected);
    const clampedIndex = Math.max(0, Math.min(targetIndex, unselectedPages.length));

    unselectedPages.splice(clampedIndex, 0, ...selectedPages);
    const reindexed = reindexPages(unselectedPages);

    setPages(reindexed);
    pushHistoryState(reindexed, `Moved selected pages to position ${clampedIndex + 1}`);
  };

  /**
   * Clear Workspace
   */
  const clearWorkspace = () => {
    setDocuments([]);
    setPages([]);
    setDocBuffersMap(new Map());
    setHistory([]);
    setHistoryIndex(-1);
    addToast({ type: 'info', title: 'Workspace Cleared' });
  };

  /**
   * Reset workspace page actions to original state
   */
  const resetWorkspace = () => {
    if (documents.length === 0) return;

    // Filter out duplicates, then sort by doc order and original page index
    const docIdsOrder = documents.map(d => d.id);
    const originalPagesOnly = pages.filter(p => !p.isDuplicate);

    originalPagesOnly.sort((a, b) => {
      const idxA = docIdsOrder.indexOf(a.docId);
      const idxB = docIdsOrder.indexOf(b.docId);
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      return a.originalPageIndex - b.originalPageIndex;
    });

    const resetPages = originalPagesOnly.map(p => ({
      ...p,
      rotation: 0 as RotationAngle,
      isSelected: false,
      isLocked: false,
      isDeleted: false,
      isSplitPoint: false,
      splitGroupIndex: undefined,
    }));

    const reindexed = reindexPages(resetPages);
    setPages(reindexed);
    pushHistoryState(reindexed, 'Reset workspace');
    addToast({
      type: 'success',
      title: 'Workspace Reset',
      message: 'Restored all page rotations, splits, and deletions.',
    });
  };

  // Initialize initial empty history snapshot once loaded
  useEffect(() => {
    if (history.length === 0 && pages.length > 0) {
      setHistory([
        {
          pages: JSON.parse(JSON.stringify(pages)),
          timestamp: Date.now(),
          actionName: 'Initial State',
        },
      ]);
      setHistoryIndex(0);
    }
  }, [pages, history.length]);

  return {
    documents,
    pages,
    docBuffersMap,
    isLoading,
    loadingMessage,
    loadingProgress,
    toasts,
    addToast,
    removeToast,
    searchFilter,
    setSearchFilter,
    passwordModal,
    setPasswordModal,

    // Actions
    addPdfFile,
    addPdfFiles,
    removeDocument,
    reorderDocuments,

    // Selection
    togglePageSelection,
    selectAll,
    deselectAll,
    selectOdd,
    selectEven,
    selectRotated,
    selectLocked,
    invertSelection,
    selectRange,

    // Operations
    rotatePages,
    setAbsoluteRotation,
    rotateSelected,
    rotateAll,
    rotateOdd,
    rotateEven,
    deletePages,
    deleteSelected,
    toggleDeletePage,
    toggleDeleteSelected,
    toggleSplitPoint,
    duplicatePages,
    duplicateSelected,
    toggleLockPages,
    movePage,
    moveSelectedToPosition,

    // History
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    historyIndex,
    historyLength: history.length,

    // System
    clearWorkspace,
    resetWorkspace,
  };
}

export type PdfWorkspaceHook = ReturnType<typeof usePdfWorkspace>;
