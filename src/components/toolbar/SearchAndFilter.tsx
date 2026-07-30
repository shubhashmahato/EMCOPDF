/**
 * Page Search and Filter Bar Component
 */

import React from 'react';
import { Search, X, RotateCw, FileText } from 'lucide-react';
import { PdfDocument, SearchFilterState } from '../../types';

interface SearchAndFilterProps {
  searchFilter: SearchFilterState;
  onUpdateFilter: (filter: Partial<SearchFilterState>) => void;
  documents: PdfDocument[];
  totalPagesCount: number;
  filteredPagesCount: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchFilter,
  onUpdateFilter,
  documents,
  totalPagesCount,
  filteredPagesCount,
}) => {
  if (totalPagesCount === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchFilter.query}
          onChange={e => onUpdateFilter({ query: e.target.value })}
          placeholder="Search page number (e.g. 1, 5, 12)..."
          className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs transition text-xs font-semibold"
        />
        {searchFilter.query && (
          <button
            onClick={() => onUpdateFilter({ query: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-200">
        {/* Document Filter */}
        {documents.length > 1 && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={searchFilter.filterDocId}
              onChange={e => onUpdateFilter({ filterDocId: e.target.value })}
              className="bg-transparent focus:outline-none font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                All Documents ({documents.length})
              </option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Rotation Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <RotateCw className="w-3.5 h-3.5 text-amber-500" />
          <select
            value={searchFilter.filterRotation}
            onChange={e => onUpdateFilter({ filterRotation: e.target.value as any })}
            className="bg-transparent focus:outline-none font-bold text-slate-800 dark:text-white cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">All Rotations</option>
            <option value="0" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">0° (Original)</option>
            <option value="90" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">90° CW</option>
            <option value="180" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">180°</option>
            <option value="270" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">270° CCW</option>
          </select>
        </div>



        {/* Filter Count Badge */}
        {filteredPagesCount !== totalPagesCount && (
          <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
            Showing {filteredPagesCount} of {totalPagesCount} pages
          </span>
        )}
      </div>
    </div>
  );
};
