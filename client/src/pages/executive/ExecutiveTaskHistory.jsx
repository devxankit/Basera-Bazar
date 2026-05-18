import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, CheckCircle2, AlertCircle, RefreshCw,
  Calendar, ChevronLeft, ChevronRight, TrendingUp, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ExecutiveBottomNav from '../../components/executive/ExecutiveBottomNav';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

export default function ExecutiveTaskHistory() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: rawData, isLoading: loading, refetch } = useQuery({
    queryKey: ['executiveTaskHistory', page],
    queryFn: () => api.get(`/executive/task-history?page=${page}&limit=15`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    onError: () => toast.error('Failed to load task history'),
  });

  const summary = rawData?.success ? rawData.summary : null;
  const history = rawData?.success ? rawData.data : [];
  const totalPages = rawData?.success ? (rawData.totalPages ?? 1) : 1;

  // Compute bar color
  const barColor = (pct) => {
    if (pct >= 50) return 'from-emerald-500 to-teal-500';
    if (pct >= 25) return 'from-amber-500 to-orange-400';
    return 'from-rose-500 to-red-400';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-28 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-4">
        <button
          onClick={() => navigate('/executive/dashboard')}
          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-slate-900 tracking-tight">Task History</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Daily Onboarding Record</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="px-6 pt-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 pt-6 space-y-5"
        >
          {/* Monthly Summary Card */}
          {summary && (
            <motion.div variants={itemVariants}>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white space-y-4 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-4 -bottom-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-3 relative">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">This Month ({summary.month})</p>
                    <p className="text-xs font-bold text-white mt-0.5">Monthly Average Performance</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative">
                  <div>
                    <p className="text-2xl font-black text-white">{summary.average_completion}%</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Avg Completion</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-400">{summary.days_met}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Days ≥50%</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-300">{summary.total_days}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Days</p>
                  </div>
                </div>

                {/* Month progress bar */}
                <div className="relative space-y-1.5">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, summary.average_completion)}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        summary.average_completion >= 50
                          ? 'from-emerald-400 to-teal-400'
                          : 'from-amber-400 to-orange-400'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>0%</span>
                    <span className={summary.average_completion >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
                      {summary.average_completion >= 50 ? '✓ Threshold Met' : '⚠ Below 50% Threshold'}
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Day-by-day list */}
          <motion.div variants={itemVariants}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Day-by-Day Record</p>
            <div className="space-y-3">
              {history.map((task, i) => (
                <motion.div
                  key={task.date}
                  variants={itemVariants}
                  className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${task.met ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {task.met ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{task.date}</p>
                        {task.description && (
                          <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                      task.met
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-rose-50 text-rose-500 border-rose-100'
                    }`}>
                      {task.met ? '≥50%' : '<50%'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{task.completed} / {task.target_count} onboarded</span>
                      <span className="font-black text-slate-900">{task.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor(task.percentage)} transition-all`}
                        style={{ width: `${Math.min(100, task.percentage)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              {history.length === 0 && (
                <div className="py-16 text-center space-y-3">
                  <Calendar className="mx-auto text-slate-200" size={48} />
                  <div>
                    <p className="font-bold text-slate-500 text-sm">No task history yet</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Your daily records will appear once admin assigns tasks.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={itemVariants} className="flex items-center justify-between py-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-black text-slate-500">
                Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 disabled:opacity-40 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      <ExecutiveBottomNav />
    </div>
  );
}
