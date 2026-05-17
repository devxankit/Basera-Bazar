import React from 'react';

/**
 * Reusable pagination controls.
 * Props:
 *   currentPage   - current active page (1-based)
 *   totalPages    - total number of pages
 *   totalItems    - total record count (for "Showing X - Y of Z" label)
 *   pageSize      - items per page
 *   onPageChange  - (page: number) => void
 */
export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
        Showing {startIndex + 1} – {endIndex} of {totalItems} Records
      </p>
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-7 text-[10px] font-black rounded-md transition-all ${
                currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
