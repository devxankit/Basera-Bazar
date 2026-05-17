import React from 'react';
import { X } from 'lucide-react';

/**
 * Generic collapsible filter bar.
 * Props:
 *   open       - boolean, whether the filter bar is expanded
 *   onReset    - () => void — called when Reset is clicked
 *   children   - the filter inputs (selects, date pickers, etc.)
 *   activeCount - number of active filters (shown as a badge when collapsed)
 */
export default function FilterBar({ open, onReset, children, activeCount = 0 }) {
  if (!open) return null;

  return (
    <div className="mx-6 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-start gap-3 flex-wrap">
        {children}
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all mt-auto"
          >
            <X size={12} />
            Reset ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * A single filter field inside FilterBar.
 * Props: label, children (an <input> or <select>)
 */
export function FilterField({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
