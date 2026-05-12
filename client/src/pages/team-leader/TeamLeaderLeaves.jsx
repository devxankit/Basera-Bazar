import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const TABS = ['Team Leaves', 'My Leaves'];

const LEAVE_BADGE = {
  sick: 'bg-red-100 text-red-700',
  casual: 'bg-blue-100 text-blue-700',
  earned: 'bg-green-100 text-green-700',
};

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  tl_approved: 'bg-blue-100 text-blue-700',
  tl_rejected: 'bg-red-100 text-red-700',
  admin_approved: 'bg-green-100 text-green-700',
  admin_rejected: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { leave_type: 'casual', start_date: '', end_date: '', reason: '' };

export default function TeamLeaderLeaves() {
  const [tab, setTab] = useState('Team Leaves');
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [noteInputs, setNoteInputs] = useState({});

  const fetchTeamLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/team-leader/leaves/team');
      if (data.success) setTeamLeaves(data.data);
    } catch { toast.error('Failed to load team leaves.'); }
    finally { setLoading(false); }
  }, []);

  const fetchMyLeaves = useCallback(async () => {
    try {
      const { data } = await api.get('/team-leader/leaves/my');
      if (data.success) setMyLeaves(data.data);
    } catch { toast.error('Failed to load your leaves.'); }
  }, []);

  useEffect(() => {
    fetchTeamLeaves();
    fetchMyLeaves();
  }, [fetchTeamLeaves, fetchMyLeaves]);

  const handleTeamAction = async (id, action) => {
    const note = noteInputs[id] || '';
    if (action === 'reject' && !note.trim()) {
      toast.error('Please enter a rejection note.');
      return;
    }
    try {
      await api.put(`/team-leader/leaves/${id}`, { action, note });
      toast.success(action === 'approve' ? 'Leave approved.' : 'Leave rejected.');
      fetchTeamLeaves();
    } catch { toast.error('Action failed.'); }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date must be on or after start date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/team-leader/leaves', form);
      toast.success('Leave request submitted.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchMyLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit.'); }
    finally { setSubmitting(false); }
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
        <h1 className="text-xl font-black text-slate-900">Leave Management</h1>
        {tab === 'My Leaves' && (
          <button onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
            <Plus size={13} /> Apply
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{t}</button>
        ))}
      </div>

      {showForm && tab === 'My Leaves' && (
        <form onSubmit={handleSubmitLeave} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-slate-700">Apply for Leave</h3>
            {calculateDays() > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                {calculateDays()} WORKING DAY(S)
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Leave Type</label>
            <select value={form.leave_type} onChange={(e) => setForm((p) => ({ ...p, leave_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
              <input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Reason *</label>
            <textarea value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} rows={3} required minLength={10} maxLength={500} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Explain your reason (min 10 chars)..." />
            <p className={`text-right text-[10px] font-bold mt-1 ${form.reason.length > 490 ? 'text-red-500' : form.reason.length > 400 ? 'text-amber-500' : 'text-slate-400'}`}>
              {form.reason.length}/500
            </p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold">Cancel</button>
          </div>
        </form>
      )}

      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {tab === 'Team Leaves' && !loading && teamLeaves.map((leave) => (
        <div key={leave._id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-800">{leave.staff_id?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{leave.staff_type?.replace('_', ' ')}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEAVE_BADGE[leave.leave_type]}`}>{leave.leave_type?.toUpperCase()}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[leave.status]}`}>{leave.status?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <p className="text-xs text-slate-600">{leave.start_date} → {leave.end_date} · {leave.total_days} day(s)</p>
          <p className="text-xs text-slate-500">{leave.reason}</p>
          {leave.status === 'pending' && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Note (required for rejection)..."
                value={noteInputs[leave._id] || ''}
                onChange={(e) => setNoteInputs((p) => ({ ...p, [leave._id]: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex gap-2">
                <button onClick={() => handleTeamAction(leave._id, 'approve')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
                  <CheckCircle size={12} /> Approve
                </button>
                <button onClick={() => handleTeamAction(leave._id, 'reject')} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                  <XCircle size={12} /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {tab === 'My Leaves' && !loading && myLeaves.map((leave) => (
        <div key={leave._id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-slate-800">{leave.leave_type?.toUpperCase()} Leave</p>
              <p className="text-xs text-slate-500">{leave.start_date} → {leave.end_date} · {leave.total_days} day(s)</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[leave.status]}`}>
              {leave.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500">{leave.reason}</p>
          {leave.admin_note && <p className="text-xs text-indigo-600 mt-1">Admin: {leave.admin_note}</p>}
        </div>
      ))}

      {!loading && tab === 'Team Leaves' && teamLeaves.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">No pending team leave requests.</div>
      )}
      {!loading && tab === 'My Leaves' && myLeaves.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">You have no leave requests.</div>
      )}
    </div>
  );
}
