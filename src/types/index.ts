/**
 * PDF Page Editor Pro - Shared Type Definitions
 */

export type RotationAngle = 0 | 90 | 180 | 270 | 360;

export interface PageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  formatName?: string; // e.g. A4, Letter, Custom
}

export interface PdfDocument {
  id: string;
  name: string;
  size: number; // in bytes
  pageCount: number;
  arrayBuffer: ArrayBuffer;
  originalFile?: File;
  isEncrypted: boolean;
  color: string; // Theme accent color tag for document
  loadedAt: number;
}

export interface PdfPageItem {
  id: string; // Unique page identifier (e.g. docId_p0_uuid)
  docId: string; // ID of source document
  docName: string; // Original filename
  originalPageIndex: number; // 0-based index in source PDF
  pageNumber: number; // Current 1-based position in grid
  rotation: RotationAngle; // Cumulative additional rotation applied (0, 90, 180, 270)
  originalRotation: RotationAngle; // Rotation from PDF metadata
  dimensions: PageDimensions;
  isSelected: boolean;
  isLocked: boolean;
  isDeleted?: boolean;
  isSplitPoint?: boolean;
  splitGroupIndex?: number; // Group index if split boundaries are active
  thumbnailDataUrl?: string;
  thumbnailStatus: 'idle' | 'loading' | 'rendered' | 'error';
  isDuplicate?: boolean;
}

export type SelectionMode = 'none' | 'all' | 'odd' | 'even' | 'rotated' | 'locked' | 'custom';

export type SplitMode = 'by_split_points' | 'selected' | 'every_page' | 'every_n_pages' | 'custom_range' | 'bookmarks' | 'blank_pages';

export interface SplitRange {
  groupIndex: number;
  label: string;
  pageIndices: number[]; // indices in current workspace pages array
}

export interface PageNumberSettings {
  enabled: boolean;
  pattern: string;
  fontFamily: 'Sans' | 'Serif' | 'Monospace';
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  color: string;
  opacity: number;
  position: 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
  angle: number;
  offsetX: number;
  offsetY: number;
  startPage: number;
  startNumber: number;
  lastPageEnabled: boolean;
  lastPageValue: number;
  totalCountEnabled: boolean;
  totalCountValue: number;
}

export interface ExportOptions {
  filename: string;
  mode: 'single_pdf' | 'split_zip' | 'individual_pdfs';
  targetPages: 'all' | 'selected' | 'range';
  pageRangeInput?: string;
  compressionQuality: 'none' | 'low' | 'medium' | 'high';
  preserveMetadata: boolean;
  includePageNumbers: boolean;
  pageNumberSettings?: PageNumberSettings;
  watermarkText?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  thumbnailSize: 'sm' | 'md' | 'lg' | 'xl';
  renderQuality: 'fast' | 'balanced' | 'high'; // scale 0.6, 1.0, 1.5
  viewMode: 'grid' | 'list';
  autoSaveHistory: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  showPageDimensions: boolean;
  showDocTags: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetPageId?: string;
  targetPageIds: string[];
}

export interface HistorySnapshot {
  pages: PdfPageItem[];
  timestamp: number;
  actionName: string;
}

export interface SearchFilterState {
  query: string;
  filterRotation: 'all' | '0' | '90' | '180' | '270';
  filterDocId: string | 'all';
  filterLocked: 'all' | 'locked' | 'unlocked';
}
