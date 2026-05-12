import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';

const TABS = ['Pending', 'Approved', 'Rejected'];

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

export default function AdminLeaveApproval() {
  const [tab, setTab] = useState('Pending');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionNote, setActionNote] = useState('');

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const statusMap = { Pending: 'pending,tl_approved', Approved: 'admin_approved', Rejected: 'admin_rejected,tl_rejected' };
      const { data } = await api.get(`/admin/staff/leaves?status=${statusMap[tab]}`);
      if (data.success) setLeaves(data.data);
    } catch { toast.error('Failed to load leaves.'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const openApprove = (leave) => {
    setActionNote('');
    setConfirmModal({
      title: 'Approve Leave Request?',
      message: `Approve ${leave.total_days} day(s) of ${leave.leave_type} leave for ${leave.staff_id?.name}?`,
      type: 'success',
      leave,
      action: 'approve',
    });
  };

  const openReject = (leave) => {
    setActionNote('');
    setConfirmModal({
      title: 'Reject Leave Request?',
      message: `Reject leave request from ${leave.staff_id?.name}?`,
      type: 'warning',
      leave,
      action: 'reject',
    });
  };

  const handleAction = async () => {
    if (!confirmModal) return;
    const { leave, action } = confirmModal;
    if (action === 'reject' && !actionNote.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    try {
      await api.put(`/admin/staff/leaves/${leave._id}`, { action, note: actionNote });
      toast.success(action === 'approve' ? 'Leave approved.' : 'Leave rejected.');
      fetchLeaves();
      setConfirmModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const columns = [
    { header: 'Staff', render: (r) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name || '—'}</p>
        <p className="text-xs text-slate-500">{r.staff_type?.replace('_', ' ')}</p>
      </div>
    )},
    { header: 'Type', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEAVE_BADGE[r.leave_type]}`}>
        {r.leave_type?.toUpperCase()}
      </span>
    )},
    { header: 'From', render: (r) => <span className="text-sm text-slate-700">{r.start_date}</span> },
    { header: 'To', render: (r) => <span className="text-sm text-slate-700">{r.end_date}</span> },
    { header: 'Days', render: (r) => <span className="font-bold text-slate-800">{r.total_days}</span> },
    { header: 'TL Status', render: (r) => r.team_leader_id ? (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'tl_approved' ? 'bg-blue-100 text-blue-700' : r.status === 'tl_rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.status.startsWith('tl_') ? r.status.replace('tl_', '').toUpperCase() : 'PENDING'}
      </span>
    ) : <span className="text-xs text-slate-400">N/A</span> },
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-500'}`}>
        {r.status?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Reason', render: (r) => <span className="text-xs text-slate-500 max-w-48 truncate block">{r.reason}</span> },
    ...(tab === 'Pending' ? [{
      header: 'Actions', render: (r) => (r.status === 'pending' || r.status === 'tl_approved') ? (
        <div className="flex items-center gap-1">
          <button onClick={() => openApprove(r)} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold hover:bg-green-100">
            <CheckCircle size={12} /> Approve
          </button>
          <button onClick={() => openReject(r)} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100">
            <XCircle size={12} /> Reject
          </button>
        </div>
      ) : null,
    }] : []),
    ...(tab !== 'Pending' ? [{
      header: 'Note', render: (r) => <span className="text-xs text-slate-500">{r.admin_note || '—'}</span>,
    }] : []),
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-black text-slate-900">Leave Approval</h1>
        <p className="text-sm text-slate-500">Manage staff leave requests — two-level approval</p>
      </div>

      <div className="flex border-b border-slate-200 mb-5 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <AdminTable columns={columns} data={leaves} loading={loading} title="" />

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">{confirmModal.title}</h3>
              <button onClick={() => setConfirmModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={15} className="text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{confirmModal.message}</p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {confirmModal.action === 'reject' ? 'Rejection Reason *' : 'Note (optional)'}
              </label>
              <div className="relative">
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value.slice(0, 200))}
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-12"
                  placeholder={confirmModal.action === 'reject' ? 'Provide reason for rejection...' : 'Optional note...'}
                />
                <span className={`absolute bottom-2 right-2 text-[10px] font-black ${actionNote.length >= 180 ? 'text-red-500' : 'text-slate-400'}`}>
                  {actionNote.length}/200
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAction} className={`flex-1 py-2.5 rounded-lg text-sm font-bold text-white ${confirmModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {confirmModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
