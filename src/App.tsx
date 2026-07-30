/**
 * PDF Page Editor Pro - Main Application Entry Component
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { usePdfWorkspace } from './hooks/usePdfWorkspace';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AppSettings, ContextMenuState, PdfPageItem } from './types';

// UI & Components
import { MainToolbar } from './components/toolbar/MainToolbar';
import { BatchActionBar } from './components/toolbar/BatchActionBar';
import { SearchAndFilter } from './components/toolbar/SearchAndFilter';
import { DocumentSidebar } from './components/sidebar/DocumentSidebar';
import { ThumbnailGrid } from './components/thumbnail/ThumbnailGrid';
import { Dropzone } from './components/ui/Dropzone';
import { ContextMenu } from './components/ui/ContextMenu';
import { ToastContainer } from './components/common/Toast';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { Footer } from './components/common/Footer';

// Modals
import { FullPageViewer } from './components/viewer/FullPageViewer';
import { SplitModal } from './components/dialogs/SplitModal';
import { MergeModal } from './components/dialogs/MergeModal';
import { ExportModal } from './components/dialogs/ExportModal';
import { SettingsModal } from './components/dialogs/SettingsModal';
import { ShortcutsModal } from './components/dialogs/ShortcutsModal';
import { PasswordModal } from './components/dialogs/PasswordModal';
import { AboutModal } from './components/dialogs/AboutModal';

export default function App() {
  const { theme, setTheme } = useTheme();
  const workspace = usePdfWorkspace();

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    thumbnailSize: 'md',
    renderQuality: 'balanced',
    viewMode: 'grid',
    autoSaveHistory: true,
    language: 'en',
    compressionLevel: 'low',
    showPageDimensions: true,
    showDocTags: true,
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Modals & Panels State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Full Page Viewer State
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    currentPageId: string | null;
  }>({
    isOpen: false,
    currentPageId: null,
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetPageId: undefined,
    targetPageIds: [],
  });

  // Hidden file input ref for triggering upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map document colors for page tags
  const docColorsMap = useMemo(() => {
    const map = new Map<string, string>();
    workspace.documents.forEach(doc => {
      map.set(doc.id, doc.color);
    });
    return map;
  }, [workspace.documents]);

  // Parse page range search input (e.g. "1-3, 5, 6, 8-11")
  const parsedPageRangesSet = useMemo(() => {
    const q = workspace.searchFilter.query.trim();
    if (!q) return null;

    // Only parse as page ranges if it contains numbers, commas, dashes or whitespace
    if (!/^[0-9\s,\-]+$/.test(q)) {
      return null;
    }

    const pageNumbers = new Set<number>();
    const parts = q.split(',');

    for (const part of parts) {
      const subPart = part.trim();
      if (!subPart) continue;

      if (subPart.includes('-')) {
        const rangeParts = subPart.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0].trim(), 10);
          const end = parseInt(rangeParts[1].trim(), 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);
            for (let i = min; i <= max; i++) {
              pageNumbers.add(i);
            }
          }
        }
      } else {
        const num = parseInt(subPart, 10);
        if (!isNaN(num)) {
          pageNumbers.add(num);
        }
      }
    }

    return pageNumbers.size > 0 ? pageNumbers : null;
  }, [workspace.searchFilter.query]);

  // Search & Filter Pages
  const filteredPages = useMemo(() => {
    const { query, filterRotation, filterDocId, filterLocked } = workspace.searchFilter;

    return workspace.pages.filter(page => {
      // Query filter (Search page number e.g. "5", doc name, or ranges)
      if (query.trim()) {
        if (parsedPageRangesSet) {
          if (!parsedPageRangesSet.has(page.pageNumber)) return false;
        } else {
          const q = query.trim().toLowerCase();
          const matchesPageNum = page.pageNumber.toString() === q || `page ${page.pageNumber}`.includes(q);
          const matchesDocName = page.docName.toLowerCase().includes(q);
          if (!matchesPageNum && !matchesDocName) return false;
        }
      }

      // Rotation filter
      if (filterRotation !== 'all') {
        if (page.rotation.toString() !== filterRotation) return false;
      }

      // Document filter
      if (filterDocId !== 'all') {
        if (page.docId !== filterDocId) return false;
      }

      // Locked filter
      if (filterLocked === 'locked' && !page.isLocked) return false;
      if (filterLocked === 'unlocked' && page.isLocked) return false;

      return true;
    });
  }, [workspace.pages, workspace.searchFilter, parsedPageRangesSet]);

  const selectedPages = useMemo(() => {
    return workspace.pages.filter(p => p.isSelected);
  }, [workspace.pages]);

  const selectedPagesCount = selectedPages.length;
  const totalSize = useMemo(() => {
    return workspace.documents.reduce((acc, doc) => acc + doc.size, 0);
  }, [workspace.documents]);

  // Context Menu Trigger
  const handleContextMenu = useCallback((e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const targetPage = workspace.pages.find(p => p.id === pageId);
    if (!targetPage) return;

    // If target page is already part of selection, apply action to all selected pages!
    const isTargetSelected = targetPage.isSelected;
    const targetIds = isTargetSelected && selectedPagesCount > 1
      ? selectedPages.map(p => p.id)
      : [pageId];

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetPageId: pageId,
      targetPageIds: targetIds,
    });
  }, [workspace.pages, selectedPages, selectedPagesCount]);

  // File Picker Handler
  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      workspace.addPdfFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onSelectAll: workspace.selectAll,
    onDeselectAll: workspace.deselectAll,
    onUndo: workspace.undo,
    onRedo: workspace.redo,
    onDeleteSelected: workspace.toggleDeleteSelected,
    onRotateSelectedCW: () => workspace.rotateSelected(90),
    onRotateSelectedCCW: () => workspace.rotateSelected(-90),
    onDuplicateSelected: workspace.duplicateSelected,
    onOpenExport: () => setExportModalOpen(true),
    onOpenImport: handleOpenFilePicker,
    onEscape: () => {
      setViewerState({ isOpen: false, currentPageId: null });
      setContextMenu(prev => ({ ...prev, isOpen: false }));
      setSplitModalOpen(false);
      setMergeModalOpen(false);
      setExportModalOpen(false);
      setSettingsModalOpen(false);
      setShortcutsModalOpen(false);
    },
    isViewerOpen: viewerState.isOpen,
  });

  const currentPageForViewer = useMemo(() => {
    return workspace.pages.find(p => p.id === viewerState.currentPageId);
  }, [workspace.pages, viewerState.currentPageId]);

  const targetPageForContextMenu = useMemo(() => {
    return workspace.pages.find(p => p.id === contextMenu.targetPageId);
  }, [workspace.pages, contextMenu.targetPageId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 select-none pb-12">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Top Toolbar */}
      <MainToolbar
        settings={settings}
        onUpdateSettings={updateSettings}
        pages={workspace.pages}
        selectedPagesCount={selectedPagesCount}
        canUndo={workspace.canUndo}
        canRedo={workspace.canRedo}
        onUndo={workspace.undo}
        onRedo={workspace.redo}
        onResetWorkspace={workspace.resetWorkspace}
        onSelectAll={workspace.selectAll}
        onDeselectAll={workspace.deselectAll}
        onSelectOdd={workspace.selectOdd}
        onSelectEven={workspace.selectEven}
        onSelectRotated={workspace.selectRotated}
        onInvertSelection={workspace.invertSelection}
        onOpenFilePicker={handleOpenFilePicker}
        onOpenSplitModal={() => setSplitModalOpen(true)}
        onOpenMergeModal={() => setMergeModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
        onOpenAboutModal={() => setAboutModalOpen(true)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
      />

      {/* Search and Filter Controls (Sticky at top, never disappears) */}
      {workspace.pages.length > 0 && (
        <div className={`sticky top-[57px] z-30 w-full bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-1 shadow-xs transition-all duration-300 ${
          sidebarOpen ? 'md:pl-[288px]' : ''
        }`}>
          <SearchAndFilter
            searchFilter={workspace.searchFilter}
            onUpdateFilter={f => workspace.setSearchFilter(prev => ({ ...prev, ...f }))}
            documents={workspace.documents}
            totalPagesCount={workspace.pages.length}
            filteredPagesCount={filteredPages.length}
          />
        </div>
      )}

      {/* Document Drawer Sidebar */}
      <DocumentSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        documents={workspace.documents}
        onRemoveDocument={workspace.removeDocument}
        onOpenFilePicker={handleOpenFilePicker}
        onReorderDocument={workspace.reorderDocuments}
      />

      {/* Backdrop overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-[2px] md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Content Workspace Area */}
      <main className={`flex-1 w-full pt-4 px-2 transition-all duration-300 ${
        sidebarOpen ? 'md:pl-[288px]' : ''
      }`}>
        {workspace.pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
            <Dropzone onFilesSelected={workspace.addPdfFiles} />
          </div>
        ) : (
          <ThumbnailGrid
            pages={workspace.pages}
            filteredPages={filteredPages}
            docBuffersMap={workspace.docBuffersMap}
            docColorsMap={docColorsMap}
            settings={settings}
            searchFilter={workspace.searchFilter}
            onMovePage={workspace.movePage}
            onToggleSelect={workspace.togglePageSelection}
            onRotateCW={pageId => workspace.rotatePages([pageId], 90)}
            onRotateCCW={pageId => workspace.rotatePages([pageId], -90)}
            onToggleDelete={pageId => workspace.toggleDeletePage(pageId)}
            onToggleSplit={pageId => workspace.toggleSplitPoint(pageId)}
            onPreview={pageId => setViewerState({ isOpen: true, currentPageId: pageId })}
            onContextMenu={handleContextMenu}
          />
        )}
      </main>

      {/* Batch Floating Action Bar */}
      <BatchActionBar
        selectedCount={selectedPagesCount}
        totalCount={workspace.pages.length}
        onRotateCW={() => workspace.rotateSelected(90)}
        onRotateCCW={() => workspace.rotateSelected(-90)}
        onRotate180={() => workspace.rotateSelected(180)}
        onDuplicate={workspace.duplicateSelected}
        onDelete={workspace.toggleDeleteSelected}
        onToggleLock={() => {
          const selectedIds = selectedPages.map(p => p.id);
          workspace.toggleLockPages(selectedIds);
        }}
        onMoveToStart={() => workspace.moveSelectedToPosition(0)}
        onMoveToEnd={() => workspace.moveSelectedToPosition(workspace.pages.length)}
        onDeselectAll={workspace.deselectAll}
        onClearWorkspace={workspace.clearWorkspace}
      />

      {/* Full Page Interactive Viewer */}
      <FullPageViewer
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, currentPageId: null })}
        currentPage={currentPageForViewer}
        pages={workspace.pages}
        docBuffersMap={workspace.docBuffersMap}
        onNavigatePage={pageId => setViewerState(prev => ({ ...prev, currentPageId: pageId }))}
        onRotateCW={pageId => workspace.rotatePages([pageId], 90)}
        onRotateCCW={pageId => workspace.rotatePages([pageId], -90)}
        onDuplicate={pageId => workspace.duplicatePages([pageId])}
        onDelete={pageId => workspace.deletePages([pageId])}
        onToggleLock={pageId => workspace.toggleLockPages([pageId])}
        onToggleSelect={workspace.togglePageSelection}
      />

      {/* Right Click Context Menu */}
      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        page={targetPageForContextMenu}
        onPreview={pageId => setViewerState({ isOpen: true, currentPageId: pageId })}
        onRotateCW={ids => workspace.rotatePages(ids, 90)}
        onRotateCCW={ids => workspace.rotatePages(ids, -90)}
        onRotate180={ids => workspace.rotatePages(ids, 180)}
        onDuplicate={ids => workspace.duplicatePages(ids)}
        onDelete={ids => workspace.deletePages(ids)}
        onToggleLock={ids => workspace.toggleLockPages(ids)}
        onMoveToStart={() => workspace.moveSelectedToPosition(0)}
        onMoveToEnd={() => workspace.moveSelectedToPosition(workspace.pages.length)}
        onToggleSelect={workspace.togglePageSelection}
      />

      {/* Dialog Modals */}
      <SplitModal
        isOpen={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        pages={workspace.pages}
        docBuffersMap={workspace.docBuffersMap}
        onAddToast={workspace.addToast}
      />

      <MergeModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        documents={workspace.documents}
        pages={workspace.pages}
        docBuffersMap={workspace.docBuffersMap}
        onAddToast={workspace.addToast}
        onReorderDocuments={workspace.reorderDocuments}
        onRemoveDocument={workspace.removeDocument}
        onAddPdfFiles={workspace.addPdfFiles}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        pages={workspace.pages}
        docBuffersMap={workspace.docBuffersMap}
        onAddToast={workspace.addToast}
        onClearWorkspace={workspace.clearWorkspace}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        theme={theme}
        onSetTheme={setTheme}
        onReturnToHome={() => {
          setSettingsModalOpen(false);
          if (workspace.pages.length > 0) {
            workspace.clearWorkspace();
          }
        }}
        hasPages={workspace.pages.length > 0}
        onOpenAbout={() => {
          setSettingsModalOpen(false);
          setAboutModalOpen(true);
        }}
        onOpenShortcuts={() => {
          setSettingsModalOpen(false);
          setShortcutsModalOpen(true);
        }}
        onResetWorkspace={workspace.pages.length > 0 ? workspace.resetWorkspace : undefined}
      />

      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onReturnToHome={() => {
          setAboutModalOpen(false);
          if (workspace.pages.length > 0) {
            workspace.clearWorkspace();
          }
        }}
        hasPages={workspace.pages.length > 0}
      />

      <PasswordModal
        isOpen={workspace.passwordModal.isOpen}
        fileName={workspace.passwordModal.fileName}
        errorMsg={workspace.passwordModal.errorMsg}
        onSubmit={pwd => {
          if (workspace.passwordModal.file) {
            workspace.addPdfFile(workspace.passwordModal.file, pwd);
            workspace.setPasswordModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onCancel={() => {
          workspace.setPasswordModal({ isOpen: false, file: null, fileName: '' });
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={workspace.toasts} onRemove={workspace.removeToast} />

      {/* Global Processing Loading Overlay */}
      <LoadingOverlay
        isOpen={workspace.isLoading}
        message={workspace.loadingMessage}
        progress={workspace.loadingProgress}
      />

      {/* Bottom Footer Status Bar */}
      <Footer
        totalPages={workspace.pages.length}
        selectedPages={selectedPagesCount}
        totalSize={totalSize}
        documentsCount={workspace.documents.length}
        onOpenAboutModal={() => setAboutModalOpen(true)}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
