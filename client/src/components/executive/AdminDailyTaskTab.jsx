import React, { useState, useEffect } from 'react';
import { Calendar, Target, FileText, PlusCircle, CheckCircle2, AlertCircle, RefreshCw, Users } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';
import Skeleton from '../common/Skeleton';

export default function AdminDailyTaskTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayTask, setTodayTask] = useState(null);
  
  // Default to today in YYYY-MM-DD local time
  const getTodayStr = () => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: getTodayStr(),
    target_count: 10,
    description: 'Daily onboarding target for all active field executives.'
  });

  const fetchTodayProgress = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/executives/tasks/today');
      if (res.data.success && res.data.data) {
        setTodayTask(res.data.data);
      } else {
        setTodayTask(null);
      }
    } catch (err) {
      // If 404 or no task set for today
      setTodayTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayProgress();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || formData.target_count <= 0) {
      toast.error('Please enter a valid date and target count greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/admin/executives/tasks', {
        date: formData.date,
        target_count: Number(formData.target_count),
        description: formData.description
      });
      if (res.data.success) {
        toast.success('Daily task assigned successfully to all executives!');
        if (formData.date === getTodayStr()) {
          await fetchTodayProgress();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign daily task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Set Task Form Card */}
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="text-indigo-600" />
            Assign Daily Onboarding Target
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Set a global target for all field executives. Executives must maintain an average completion rate of ≥50% each month.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Task Date</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Target Count (Sellers)</label>
            <div className="relative flex items-center">
              <Target className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="number"
                min="1"
                value={formData.target_count}
                onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Task Instructions / Description</label>
            <div className="relative flex items-center">
              <FileText className="absolute left-4 text-slate-400" size={18} />
              <input 
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                placeholder="e.g. Onboard verified sellers today"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="animate-spin" size={18} /> : <PlusCircle size={18} />}
              {submitting ? 'Assigning Task...' : 'Assign Global Target'}
            </button>
          </div>
        </form>
      </div>

      {/* Today's Global Progress Overview */}
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-600" />
              Today's Task Status & Force Progress
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Live monitoring of daily task fulfillment across your executive team.</p>
          </div>
          <button 
            onClick={fetchTodayProgress} 
            className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl transition-all"
            title="Refresh Live Status"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : todayTask ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex flex-col justify-between">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Active Target</span>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">{todayTask.target_count}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1.5">Sellers</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-1">{todayTask.description}</p>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 flex flex-col justify-between">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Global Onboarded Today</span>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">
                    {todayTask.progress?.reduce((sum, item) => sum + item.completed, 0) || 0}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1.5">Total</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-2">Sum of all team members</p>
              </div>

              <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 flex flex-col justify-between">
                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Team Performance</span>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-900">
                    {todayTask.progress?.filter(p => p.percentage >= 50).length || 0}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1.5">/ {todayTask.progress?.length || 0}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-2">Executives meeting ≥50% threshold</p>
              </div>
            </div>

            {/* Force list progress */}
            <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>Executive</span>
                <span>Referral Code</span>
                <span>Today's Onboarded</span>
                <span>Threshold Status</span>
              </div>
              <div className="divide-y divide-slate-100">
                {todayTask.progress?.map((item) => (
                  <div key={item.executive_id} className="px-6 py-4 grid grid-cols-4 items-center bg-white">
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit border border-indigo-100 tracking-wider">
                      {item.referral_code || 'N/A'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-sm">{item.completed}</span>
                      <span className="text-xs font-bold text-slate-400">({item.percentage}%)</span>
                    </div>
                    <div>
                      {item.percentage >= 50 ? (
                        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-100">
                          <CheckCircle2 size={14} /> Met (≥50%)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg w-fit border border-rose-100">
                          <AlertCircle size={14} /> At Risk (&lt;50%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!todayTask.progress || todayTask.progress.length === 0) && (
                  <div className="p-8 text-center text-slate-400 font-bold text-sm bg-white">
                    No active field executives found.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
            <AlertCircle className="text-slate-300" size={32} />
            <div>
              <p className="font-bold text-slate-700">No daily target assigned for today yet.</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Assign a target using the form above to activate live executive progress tracking.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
