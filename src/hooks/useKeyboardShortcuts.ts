/**
 * Keyboard Shortcuts Hook for PDF Page Editor Pro
 */

import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDeleteSelected?: () => void;
  onRotateSelectedCW?: () => void;
  onRotateSelectedCCW?: () => void;
  onDuplicateSelected?: () => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  onEscape?: () => void;
  isViewerOpen?: boolean;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys if focus is inside input/textarea/select
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) {
        if (e.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Escape') {
        if (handlers.onEscape) handlers.onEscape();
        return;
      }

      // Ctrl + A -> Select All
      if (cmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handlers.onSelectAll?.();
        return;
      }

      // Ctrl + Z -> Undo
      if (cmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handlers.onUndo?.();
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z -> Redo
      if (
        (cmdOrCtrl && (e.key === 'y' || e.key === 'Y')) ||
        (cmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Delete / Backspace -> Delete Selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && !handlers.isViewerOpen) {
        e.preventDefault();
        handlers.onDeleteSelected?.();
        return;
      }

      // R -> Rotate CW, Shift + R -> Rotate CCW
      if ((e.key === 'r' || e.key === 'R') && !cmdOrCtrl) {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onRotateSelectedCCW?.();
        } else {
          handlers.onRotateSelectedCW?.();
        }
        return;
      }

      // Ctrl + D -> Duplicate Selected
      if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handlers.onDuplicateSelected?.();
        return;
      }

      // Ctrl + S -> Save / Export
      if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handlers.onOpenExport?.();
        return;
      }

      // Ctrl + O -> Open / Import
      if (cmdOrCtrl && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handlers.onOpenImport?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
