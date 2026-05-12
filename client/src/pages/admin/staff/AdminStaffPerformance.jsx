import React, { useEffect, useState, useCallback } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'team_leader', label: 'Team Leaders' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

export default function AdminStaffPerformance() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [staffType, setStaffType] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (staffType) params.set('staff_type', staffType);
      const { data } = await api.get(`/admin/staff/performance?${params}`);
      if (data.success) setRecords(data.data);
    } catch { toast.error('Failed to load performance data.'); }
    finally { setLoading(false); }
  }, [month, staffType]);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

  const handleFinalize = () => {
    setConfirmModal({
      title: 'Finalize Performance?',
      message: `This will lock performance records for ${month}, apply the 70% rule, and calculate salary deductions. This action cannot be undone.`,
      type: 'warning',
    });
  };

  const handleConfirm = async () => {
    setFinalizing(true);
    try {
      await api.post('/admin/staff/performance/finalize', { month });
      toast.success('Performance finalized successfully.');
      fetchPerformance();
    } catch (err) { toast.error(err.response?.data?.message || 'Finalization failed.'); }
    finally { setFinalizing(false); setConfirmModal(null); }
  };

  const deficientStaff = records.filter((r) => r.consecutive_deficient_months >= 2);
  const isFinalized = records.length > 0 && records.every((r) => r.status === 'finalized');

  const rateColor = (rate) => {
    if (rate >= 0.7) return 'text-green-600';
    if (rate >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const rateBarColor = (rate) => {
    if (rate >= 0.7) return 'bg-green-500';
    if (rate >= 0.5) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const columns = [
    { header: 'Staff', render: (r) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name || '—'}</p>
        <p className="text-xs text-slate-500">{r.staff_type?.replace('_', ' ')}</p>
      </div>
    )},
    { header: 'Target', render: (r) => <span className="text-sm text-slate-700">{r.target_value ?? '—'}</span> },
    { header: 'Achieved', render: (r) => <span className="font-bold text-slate-800">{r.achieved_value ?? 0}</span> },
    { header: 'Rate', render: (r) => {
      const rate = r.achievement_rate ?? 0;
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${rateBarColor(rate)}`} style={{ width: `${Math.min(rate * 100, 100)}%` }} />
          </div>
          <span className={`text-xs font-black ${rateColor(rate)}`}>{Math.round(rate * 100)}%</span>
        </div>
      );
    }},
    { header: 'Incentive', render: (r) => <span className="text-sm text-green-700 font-semibold">₹{(r.incentive_earned || 0).toLocaleString('en-IN')}</span> },
    { header: 'Deficient Risk', render: (r) => r.consecutive_deficient_months >= 2 ? (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
        <AlertTriangle size={12} /> {r.consecutive_deficient_months} months
      </span>
    ) : r.consecutive_deficient_months === 1 ? (
      <span className="text-xs text-amber-600 font-bold">1 month</span>
    ) : <span className="text-xs text-slate-400">—</span> },
    { header: 'Salary Cut', render: (r) => r.salary_cut_applied ? (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Applied</span>
    ) : <span className="text-xs text-slate-400">—</span> },
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.status?.toUpperCase()}
      </span>
    )},
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Performance Reports</h1>
          <p className="text-sm text-slate-500">Monthly achievement tracking and salary deduction enforcement</p>
        </div>
        <button
          onClick={handleFinalize}
          disabled={finalizing || isFinalized}
          className="flex items-center gap-2 px-4 py-2 bg-[#001b4e] text-white rounded-lg text-sm font-semibold hover:bg-[#001337] disabled:opacity-60"
        >
          <Lock size={15} /> {isFinalized ? 'Finalized' : finalizing ? 'Finalizing...' : 'Finalize Performance'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <select
          value={staffType}
          onChange={(e) => setStaffType(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white"
        >
          {STAFF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {deficientStaff.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-red-700">Salary Deduction Alert</p>
            <p className="text-xs text-red-600 mt-0.5">
              {deficientStaff.length} staff member(s) have 2+ consecutive deficient months and will have a 10% salary deduction applied next month:&nbsp;
              {deficientStaff.map((r) => r.staff_id?.name).join(', ')}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'On Target (≥70%)', value: records.filter((r) => (r.achievement_rate ?? 0) >= 0.7).length, color: 'text-green-600' },
          { label: 'At Risk (50–69%)', value: records.filter((r) => (r.achievement_rate ?? 0) >= 0.5 && (r.achievement_rate ?? 0) < 0.7).length, color: 'text-amber-500' },
          { label: 'Deficient (<50%)', value: records.filter((r) => (r.achievement_rate ?? 0) < 0.5).length, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <AdminTable columns={columns} data={records} loading={loading} title="" />

      {confirmModal && (
        <ConfirmationModal isOpen onClose={() => setConfirmModal(null)} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={handleConfirm} />
      )}
    </div>
  );
}
