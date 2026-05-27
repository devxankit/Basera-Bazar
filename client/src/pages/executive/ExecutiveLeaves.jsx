import React, { useState, useEffect } from 'react';
import { Plus, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_CONFIG = {
  pending:        { label: 'Pending',        badge: 'bg-amber-100 text-amber-700',  icon: Clock },
  tl_approved:   { label: 'TL Approved',     badge: 'bg-blue-100 text-blue-700',   icon: Clock },
  tl_rejected:   { label: 'TL Rejected',     badge: 'bg-red-100 text-red-700',     icon: XCircle },
  admin_approved:{ label: 'Approved',        badge: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  admin_rejected:{ label: 'Rejected',        badge: 'bg-red-100 text-red-700',     icon: XCircle },
};

const LEAVE_TYPE_COLOR = {
  casual: 'bg-blue-50 text-blue-700 border-blue-100',
  sick:   'bg-red-50 text-red-700 border-red-100',
  earned: 'bg-green-50 text-green-700 border-green-100',
};

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

const EMPTY_FORM = { leave_type: 'casual', start_date: '', end_date: '', reason: '' };

export default function ExecutiveLeaves() {
  const today = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('All');
  const queryClient = useQueryClient();

  // staleTime: 0 ensures the staff always sees the latest status from admin
  const { data: rawData, isLoading: loading, error: leavesError } = useQuery({
    queryKey: ['executiveLeaves'],
    queryFn: () => api.get('/executive/leaves').then(r => r.data),
    staleTime: 0,
  });

  useEffect(() => {
    if (leavesError) toast.error('Failed to load leaves.');
  }, [leavesError]);

  const allLeaves = rawData?.success ? rawData.data : [];

  // Filter leaves based on tab
  const leaves = allLeaves.filter(leave => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return leave.status === 'pending' || leave.status === 'tl_approved';
    if (activeTab === 'Approved') return leave.status === 'admin_approved';
    if (activeTab === 'Rejected') return leave.status === 'admin_rejected' || leave.status === 'tl_rejected';
    return true;
  });

  // Tab counts
  const counts = {
    All: allLeaves.length,
    Pending: allLeaves.filter(l => l.status === 'pending' || l.status === 'tl_approved').length,
    Approved: allLeaves.filter(l => l.status === 'admin_approved').length,
    Rejected: allLeaves.filter(l => l.status === 'admin_rejected' || l.status === 'tl_rejected').length,
  };

  const submitMutation = useMutation({
    mutationFn: (payload) => api.post('/executive/leaves', payload).then(r => r.data),
    onSuccess: (responseData) => {
      toast.success('Leave request submitted.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setActiveTab('Pending');
      // Optimistically prepend the new leave so it's visible immediately
      // without waiting for the server cache to clear.
      queryClient.setQueryData(['executiveLeaves'], (old) => {
        const existing = old?.data ?? [];
        const newLeave = responseData?.data;
        if (!newLeave) return old;
        return { ...old, success: true, data: [newLeave, ...existing] };
      });
      queryClient.invalidateQueries({ queryKey: ['executiveLeaves'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit.'),
  });

  const submitting = submitMutation.isPending ?? submitMutation.isLoading;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Leave Requests</h1>
          <p className="text-sm text-slate-500">Apply and track your leave requests</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
          className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700"
        >
          <Plus size={13} /> Apply
        </button>
      </div>

      {/* Apply Form */}
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
              <input type="date" value={form.start_date} min={today} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value, end_date: p.end_date < e.target.value ? e.target.value : p.end_date }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
              <input type="date" value={form.end_date} min={form.start_date || today} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${activeTab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t}
            {counts[t] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === t ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {/* Empty State */}
      {!loading && leaves.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <CalendarDays size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm text-slate-400 font-medium">
            {activeTab === 'All' ? 'No leave requests yet.' : `No ${activeTab.toLowerCase()} requests.`}
          </p>
        </div>
      )}

      {/* Leave Cards */}
      {leaves.map((leave) => {
        const cfg = STATUS_CONFIG[leave.status] || { label: leave.status, badge: 'bg-slate-100 text-slate-500' };
        const StatusIcon = cfg.icon || Clock;
        const isApproved = leave.status === 'admin_approved';
        const isRejected = leave.status === 'admin_rejected' || leave.status === 'tl_rejected';
        return (
          <div
            key={leave._id}
            className={`bg-white border rounded-lg p-4 ${isApproved ? 'border-green-200' : isRejected ? 'border-red-200' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${LEAVE_TYPE_COLOR[leave.leave_type] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                  {leave.leave_type?.toUpperCase()}
                </span>
                <p className="text-xs text-slate-500">{leave.total_days} day(s)</p>
              </div>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${cfg.badge}`}>
                <StatusIcon size={10} />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-0.5">
              {leave.start_date} → {leave.end_date}
            </p>
            <p className="text-xs text-slate-500 mb-2">{leave.reason}</p>

            {/* Notes from TL / Admin */}
            {leave.tl_note && (
              <div className="mt-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
                <span className="font-black uppercase tracking-wide text-[9px]">Team Leader</span>
                <p>{leave.tl_note}</p>
              </div>
            )}
            {leave.admin_note && (
              <div className={`mt-2 px-2 py-1.5 rounded text-xs border ${isApproved ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                <span className="font-black uppercase tracking-wide text-[9px]">Admin</span>
                <p>{leave.admin_note}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
