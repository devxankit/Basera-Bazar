import React, { useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

/**
 * OfflineScreen — full-screen, friendly fallback shown when the app boots with
 * no internet AND no previously-saved data to display. Gives the user a clear
 * explanation and a Refresh button instead of a broken page or the browser's
 * native "no internet" error.
 */
export default function OfflineScreen({ onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    if (onRetry) {
      onRetry();
      // Give the retry a moment; if we're still offline the screen stays.
      setTimeout(() => setRetrying(false), 1200);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
        <CloudOff className="w-10 h-10 text-slate-400" />
      </div>

      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        You're offline
      </h2>
      <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
        We can't reach the internet right now. Check your connection and tap
        refresh to load Basera Bazar.
      </p>

      <button
        onClick={handleRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Retrying…' : 'Refresh'}
      </button>
    </div>
  );
}
