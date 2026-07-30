/**
 * Helper utility functions for formatting and parsing.
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const formatBytes = formatFileSize;

export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) return [];
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesSet.add(i - 1); // 0-based
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pagesSet.add(pageNum - 1); // 0-based
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

export function generateRangeString(indices: number[]): string {
  if (!indices.length) return '';
  const sorted = [...indices].sort((a, b) => a - b).map(i => i + 1); // 1-based
  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

export function getPageFormatLabel(widthPt: number, heightPt: number): string {
  const w = Math.round(widthPt);
  const h = Math.round(heightPt);
  const min = Math.min(w, h);
  const max = Math.max(w, h);

  // A4: 595 x 842 pt
  if (Math.abs(min - 595) < 15 && Math.abs(max - 842) < 15) return 'A4';
  // Letter: 612 x 792 pt
  if (Math.abs(min - 612) < 15 && Math.abs(max - 792) < 15) return 'Letter';
  // Legal: 612 x 1008 pt
  if (Math.abs(min - 612) < 15 && Math.abs(max - 1008) < 15) return 'Legal';
  // A3: 842 x 1191 pt
  if (Math.abs(min - 842) < 15 && Math.abs(max - 1191) < 15) return 'A3';
  // A5: 420 x 595 pt
  if (Math.abs(min - 420) < 15 && Math.abs(max - 595) < 15) return 'A5';

  return `${w} × ${h} pt`;
}

export const DOCUMENT_ACCENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function getRandomAccentColor(index: number): string {
  return DOCUMENT_ACCENT_COLORS[index % DOCUMENT_ACCENT_COLORS.length];
}
