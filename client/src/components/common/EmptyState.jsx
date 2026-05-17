import React from 'react';

/**
 * Empty / no-results display.
 * Props:
 *   icon    - a Lucide icon component (optional)
 *   title   - primary heading text
 *   message - secondary description text (optional)
 *   action  - optional ReactNode for a CTA button
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={24} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1">{title}</h3>
      {message && (
        <p className="text-xs text-slate-400 max-w-xs">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
