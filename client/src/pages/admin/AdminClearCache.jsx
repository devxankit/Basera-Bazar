import React, { useState } from 'react';
import { Trash2, ShieldAlert, CheckCircle2, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function AdminClearCache() {
  const [clearing, setClearing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    setSuccess(false);
    try {
      const res = await api.post('/admin/maintenance/clear-cache');
      if (res.data.success) {
        setTimeout(() => {
          setClearing(false);
          setSuccess(true);
        }, 1500); // Artificial delay for premium feel
      }
    } catch (err) {
      alert('Error clearing cache');
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Maintenance</h1>
        <p className="text-slate-500 font-medium mt-1">Perform critical system operations and data synchronization.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100/50 flex-shrink-0">
              <RefreshCw size={32} className={clearing ? 'animate-spin' : ''} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Clear Global Cache</h2>
              <p className="text-slate-500 font-medium mt-1 leading-relaxed max-w-xl">
                This will invalidate all cached API responses, image thumbnails, and temporary session data. 
                Use this after making significant category or property changes to ensure all users see the latest data.
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'API Cache', status: 'Normal', size: '1.2 GB' },
              { label: 'Asset Thumbnails', status: 'Growing', size: '4.8 GB' },
              { label: 'Session State', status: 'Optimal', size: '124 MB' },
              { label: 'CORS Headers', status: 'Updated', size: '12 KB' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                <div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{stat.size}</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">{stat.status}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
            <ShieldAlert className="text-amber-600 flex-shrink-0" size={24} />
            <div className="text-sm">
              <p className="font-black text-amber-900 uppercase tracking-tight">Warning: High Impact Operation</p>
              <p className="text-amber-700 font-medium mt-1">Clearing the cache may cause a temporary slowdown in app performance for some users while the cache is rebuilt.</p>
            </div>
          </div>

          <button 
            onClick={handleClear}
            disabled={clearing}
            className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] ${
              success 
                ? 'bg-emerald-600 text-white shadow-emerald-100' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
            }`}
          >
            {clearing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Flushing System Buffers...
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={24} />
                Cache Cleared Successfully
              </>
            ) : (
              <>
                <Trash2 size={24} />
                Confirm Global Cache Clear
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center py-10">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-lg shadow-emerald-100">
            <Sparkles size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900">System Harmonized</h3>
          <p className="text-slate-500 font-medium mt-1">All cache layers have been successfully purged.</p>
        </div>
      )}
    </div>
  );
}
