import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  tl_approved: 'bg-blue-100 text-blue-700',
  tl_rejected: 'bg-red-100 text-red-700',
  admin_approved: 'bg-green-100 text-green-700',
  admin_rejected: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { leave_type: 'casual', start_date: '', end_date: '', reason: '' };

export default function ExecutiveLeaves() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: rawData, isLoading: loading, error: leavesError } = useQuery({
    queryKey: ['executiveLeaves'],
    queryFn: () => api.get('/executive/leaves').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (leavesError) toast.error('Failed to load leaves.');
  }, [leavesError]);

  const leaves = rawData?.success ? rawData.data : [];

  const submitMutation = useMutation({
    mutationFn: (payload) => api.post('/executive/leaves', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Leave request submitted.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['executiveLeaves'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit.'),
  });

  const submitting = submitMutation.isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date must be on or after start date.');
      return;
    }
    submitMutation.mutate(form);
  };

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    if (e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Leave Requests</h1>
          <p className="text-sm text-slate-500">Apply and track your leave requests</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }} className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700">
          <Plus size={13} /> Apply
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-700">Apply for Leave</h3>
            {calculateDays() > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                {calculateDays()} WORKING DAY(S)
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Leave Type</label>
            <select value={form.leave_type} onChange={(e) => setForm((p) => ({ ...p, leave_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
              <input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Reason *</label>
            <textarea value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} rows={3} required minLength={10} maxLength={500} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" placeholder="Min 10 characters..." />
            <p className={`text-right text-[10px] font-bold mt-1 ${form.reason.length > 490 ? 'text-red-500' : form.reason.length > 400 ? 'text-amber-500' : 'text-slate-400'}`}>
              {form.reason.length}/500
            </p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold">Cancel</button>
          </div>
        </form>
      )}

      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {!loading && leaves.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">No leave requests yet.</div>
      )}

      {leaves.map((leave) => (
        <div key={leave._id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-slate-800">{leave.leave_type?.toUpperCase()} Leave</p>
              <p className="text-xs text-slate-500">{leave.start_date} → {leave.end_date} · {leave.total_days} day(s)</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[leave.status] || 'bg-slate-100 text-slate-500'}`}>
              {leave.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500">{leave.reason}</p>
          {leave.tl_note && <p className="text-xs text-blue-600 mt-1">TL: {leave.tl_note}</p>}
          {leave.admin_note && <p className="text-xs text-indigo-600 mt-1">Admin: {leave.admin_note}</p>}
        </div>
      ))}
    </div>
  );
}
