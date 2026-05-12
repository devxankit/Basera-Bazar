import React, { useState, useEffect } from 'react';
import { Calendar, Target, CheckCircle2, AlertCircle, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';
import Skeleton from '../common/Skeleton';

export default function AdminTaskHistoryTab() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  const fetchHistory = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/executives/tasks?page=${pageNum}&limit=15`);
      if (res.data.success) {
        setHistory(res.data.data);
        setPage(res.data.page);
        setTotalPages(res.data.totalPages);
        setTotalTasks(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load daily task history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Global Task Assignment Ledger
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Historical audit log of daily assigned partner onboarding targets.
          </p>
        </div>
        <button 
          onClick={() => fetchHistory(page)} 
          className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl transition-all"
          title="Refresh Ledger"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-4 text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>Date Assigned</span>
            <span>Target Count</span>
            <span>Instructions</span>
            <span className="text-right">Global Audit Created</span>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map((task) => (
              <div key={task._id} className="px-6 py-4 grid grid-cols-4 items-center hover:bg-slate-50/50 transition-colors">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" />
                  {task.date}
                </span>
                <span className="font-black text-slate-900 text-sm">
                  {task.target_count} <span className="text-xs font-bold text-slate-400">Sellers</span>
                </span>
                <span className="text-xs font-bold text-slate-600 line-clamp-1">
                  {task.description || 'Standard Onboarding Target'}
                </span>
                <span className="text-xs font-bold text-slate-400 text-right">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-bold text-sm">
                No past daily tasks assigned in the system yet.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Showing page <span className="text-slate-700 font-black">{page}</span> of <span className="text-slate-700 font-black">{totalPages}</span> ({totalTasks} total tasks)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
