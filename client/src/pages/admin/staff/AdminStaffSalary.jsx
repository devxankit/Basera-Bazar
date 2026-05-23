import React, { useState, useEffect } from 'react';
import { IndianRupee, Play, Download, CheckCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';
import { useScrollLock } from '../../../hooks/useScrollLock';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'team_leader', label: 'Team Leaders' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

export default function AdminStaffSalary() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [staffType, setStaffType] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [payNotes, setPayNotes] = useState('');
  const [pendingPayId, setPendingPayId] = useState(null);

  useScrollLock(!!confirmModal);

  const { data: rawData, isLoading: loading, error: staffSalaryError } = useQuery({
    queryKey: ['admin-staff-salary', month, staffType],
    queryFn: () => {
      const params = new URLSearchParams({ month });
      if (staffType) params.set('staff_type', staffType);
      return api.get(`/admin/staff/salary?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (staffSalaryError) toast.error('Failed to load salary records.');
  }, [staffSalaryError]);

  const records = rawData?.data || [];

  const processMutation = useMutation({
    mutationFn: () => api.post('/admin/staff/salary/process-monthly', { month }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-salary'] });
      toast.success('Monthly salary processed successfully.');
      setConfirmModal(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Processing failed.');
      setConfirmModal(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, notes }) => api.put(`/admin/staff/salary/${id}/pay`, { notes }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-salary'] });
      toast.success('Marked as paid.');
      setConfirmModal(null);
    },
    onError: () => {
      toast.error('Failed to mark as paid.');
      setConfirmModal(null);
    },
  });

  const handleProcessMonthly = () => {
    setConfirmModal({
      title: 'Process Monthly Salary?',
      message: `This will generate salary records for all active staff for ${month}. Ensure performance has been finalized before proceeding.`,
      type: 'warning',
      action: 'process',
    });
  };

  const handleMarkPaid = (id) => {
    setPendingPayId(id);
    setPayNotes('');
    setConfirmModal({
      title: 'Mark Salary as Paid?',
      message: 'Confirm that this salary has been disbursed to the staff member.',
      type: 'success',
      action: 'pay',
    });
  };

  const handleConfirm = () => {
    if (confirmModal.action === 'process') {
      processMutation.mutate();
    } else if (confirmModal.action === 'pay') {
      markPaidMutation.mutate({ id: pendingPayId, notes: payNotes });
    }
  };

  const handleDownloadSlip = async (id) => {
    try {
      const response = await api.get(`/admin/staff/salary/${id}/slip`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary_slip_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download slip.'); }
  };

  const totalPayroll = records.reduce((s, r) => s + (r.base_salary || 0), 0);
  const totalIncentives = records.reduce((s, r) => s + (r.incentive_amount || 0), 0);
  const totalCommission = records.reduce((s, r) => s + (r.team_commission_amount || 0), 0);
  const totalPayout = records.reduce((s, r) => s + (r.effective_salary || 0), 0);

  const processing = processMutation.isLoading || markPaidMutation.isLoading;
  const activeFilterCount = staffType ? 1 : 0;

  const columns = [
    { header: 'Staff', render: (r) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name || r.executive_id?.name || '—'}</p>
        <p className="text-xs text-slate-500">{r.staff_type?.replace('_', ' ')}</p>
      </div>
    )},
    { header: 'Month', key: 'month' },
    { header: 'Base', render: (r) => `₹${(r.base_salary || 0).toLocaleString('en-IN')}` },
    { header: 'Incentive', render: (r) => `₹${(r.incentive_amount || 0).toLocaleString('en-IN')}` },
    { header: 'Commission', render: (r) => `₹${(r.team_commission_amount || 0).toLocaleString('en-IN')}` },
    { header: 'Deduction', render: (r) => r.deduction_applied ? (
      <span className="text-red-600 text-sm">-₹{(r.deduction_amount || 0).toLocaleString('en-IN')}</span>
    ) : '—' },
    { header: 'Net Pay', render: (r) => (
      <span className="font-black text-slate-900">₹{(r.effective_salary || 0).toLocaleString('en-IN')}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.status?.toUpperCase()}
      </span>
    )},
    { header: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        {r.status === 'pending' && (
          <button onClick={() => handleMarkPaid(r._id)} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold hover:bg-green-100">
            <CheckCircle size={12} /> Pay
          </button>
        )}
        <button onClick={() => handleDownloadSlip(r._id)} className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded text-xs font-bold hover:bg-slate-100">
          <Download size={12} /> Slip
        </button>
      </div>
    )},
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Salary & Incentives</h1>
          <p className="text-sm text-slate-500">Manage monthly payroll for all staff</p>
        </div>
        <button
          onClick={handleProcessMonthly}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-[#001b4e] text-white rounded-lg text-sm font-semibold hover:bg-[#001337] transition-colors disabled:opacity-60"
        >
          <Play size={15} /> {processMutation.isLoading ? 'Processing...' : 'Process Monthly Salary'}
        </button>
      </div>

      <FilterBar
        open
        activeCount={activeFilterCount}
        onReset={() => setStaffType('')}
      >
        <FilterField label="Month">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </FilterField>
        <FilterField label="Staff Type">
          <select
            value={staffType}
            onChange={(e) => setStaffType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white"
          >
            {STAFF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Payroll', value: `₹${totalPayroll.toLocaleString('en-IN')}`, color: 'text-slate-900' },
          { label: 'Total Incentives', value: `₹${totalIncentives.toLocaleString('en-IN')}`, color: 'text-indigo-600' },
          { label: 'Total Commission', value: `₹${totalCommission.toLocaleString('en-IN')}`, color: 'text-teal-600' },
          { label: 'Total Payout', value: `₹${totalPayout.toLocaleString('en-IN')}`, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee size={14} className="text-slate-400" />
              <p className="text-xs text-slate-500 font-semibold">{label}</p>
            </div>
            <p className={`text-xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <AdminTable columns={columns} data={records} loading={loading} title="" hideSearch hideFilter />

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">{confirmModal.title}</h3>
              <button onClick={() => setConfirmModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={15} className="text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{confirmModal.message}</p>
            {confirmModal.action === 'pay' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">Payment Notes (optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="e.g. Transferred via NEFT..."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={processing} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#001b4e] hover:bg-[#001337] disabled:opacity-60">
                Confirm
              </button>
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
