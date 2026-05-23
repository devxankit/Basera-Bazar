import React, { useState, useEffect } from 'react';
import { Plus, Target, X, Eye, Trash2, Power } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { useScrollLock } from '../../../hooks/useScrollLock';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

const TYPE_LABELS = {
  partner_onboarding: 'Partner Onboarding',
  calling: 'Calling',
  lead_generation: 'Lead Generation',
  sales: 'Sales',
  subscription: 'Subscription',
  custom: 'Custom',
};

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

const ASSIGN_LABELS = {
  all: 'All Staff',
  team_leader: 'Team Leaders',
  field_executive: 'Field Executives',
  office_staff: 'Office Staff',
};

const TYPE_COLORS = {
  partner_onboarding: 'bg-orange-100 text-orange-700',
  calling: 'bg-teal-100 text-teal-700',
  lead_generation: 'bg-blue-100 text-blue-700',
  sales: 'bg-green-100 text-green-700',
  subscription: 'bg-purple-100 text-purple-700',
  custom: 'bg-slate-100 text-slate-700',
};

const EMPTY_FORM = {
  target_type: 'partner_onboarding',
  target_period: 'monthly',
  target_value: '',
  start_date: '',
  end_date: '',
  description: '',
  incentive_type: 'fixed',
  incentive_rate: '',
  assign_to_type: 'all',
  assign_to_ids: [],
};

export default function AdminTargetManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmModal, setConfirmModal] = useState(null);
  const [progressTarget, setProgressTarget] = useState(null);

  useScrollLock(showForm || !!confirmModal || !!progressTarget);

  const { data: rawData, isLoading: loading, error: targetsError } = useQuery({
    queryKey: ['admin-targets'],
    queryFn: () => api.get('/admin/staff/targets').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (targetsError) toast.error('Failed to load targets');
  }, [targetsError]);

  const targets = rawData?.data || [];

  const { data: progressRaw, isLoading: progressLoading, error: targetProgressError } = useQuery({
    queryKey: ['admin-target-progress', progressTarget?._id],
    queryFn: () =>
      api.get(`/admin/staff/targets/${progressTarget._id}/progress`).then((r) => r.data),
    enabled: Boolean(progressTarget),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (targetProgressError) toast.error('Failed to load progress.');
  }, [targetProgressError]);

  const progressData = progressRaw?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/staff/targets', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-targets'] });
      toast.success('Target assigned successfully.');
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign target.'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/staff/targets/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-targets'] });
      setConfirmModal(null);
    },
    onError: () => { toast.error('Operation failed.'); setConfirmModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/staff/targets/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-targets'] });
      toast.success('Target deleted.');
      setConfirmModal(null);
    },
    onError: () => { toast.error('Delete failed.'); setConfirmModal(null); },
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error('End date must be on or after start date.');
      return;
    }
    createMutation.mutate({
      ...form,
      target_value: Number(form.target_value),
      incentive_rate: Number(form.incentive_rate),
    });
  };

  const handleToggleStatus = (target) => {
    setConfirmModal({
      title: target.is_active ? 'Deactivate Target?' : 'Activate Target?',
      message: target.is_active
        ? 'This will stop tracking achievement against this target.'
        : 'This will resume tracking achievement against this target.',
      type: target.is_active ? 'warning' : 'info',
      onConfirm: () => {
        toast.success(`Target ${target.is_active ? 'deactivated' : 'activated'}.`);
        toggleMutation.mutate(target._id);
      },
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      title: 'Delete Target?',
      message: 'This action is permanent and cannot be undone.',
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const saving = createMutation.isLoading;

  const columns = [
    { header: 'Type', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${TYPE_COLORS[r.target_type] || 'bg-slate-100 text-slate-600'}`}>
        {TYPE_LABELS[r.target_type]}
      </span>
    )},
    { header: 'Period', render: (r) => <span className="text-sm text-slate-700">{PERIOD_LABELS[r.target_period]}</span> },
    { header: 'Value', render: (r) => <span className="font-bold text-slate-800 text-sm">{r.target_value}</span> },
    { header: 'Assign To', render: (r) => <span className="text-sm text-slate-600">{ASSIGN_LABELS[r.assign_to_type]}</span> },
    { header: 'Incentive', render: (r) => (
      <span className="text-sm text-green-700 font-semibold">
        {r.incentive_type === 'percentage' ? `${r.incentive_rate}%` : `₹${r.incentive_rate}/unit`}
      </span>
    )},
    { header: 'Date Range', render: (r) => (
      <span className="text-xs text-slate-500">{r.start_date} → {r.end_date}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setProgressTarget(r)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View Progress">
          <Eye size={15} />
        </button>
        <button
          onClick={() => handleToggleStatus(r)}
          className={`p-1.5 rounded transition-colors ${r.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
          title={r.is_active ? 'Deactivate' : 'Activate'}
        >
          <Power size={15} />
        </button>
        <button
          onClick={() => handleDelete(r._id)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    )},
  ];

  const progressCols = [
    { header: 'Staff', render: (r) => <span className="font-semibold text-sm">{r.name}</span> },
    { header: 'Role', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
        r.staff_type === 'team_leader' ? 'bg-indigo-100 text-indigo-700' :
        r.staff_type === 'field_executive' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
      }`}>
        {r.staff_type?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Achieved', render: (r) => <span className="font-bold text-slate-800">{r.achieved_value ?? 0}</span> },
    { header: 'Target', render: () => <span className="text-slate-600">{progressTarget?.target_value}</span> },
    { header: 'Rate', render: (r) => {
      const rate = progressTarget?.target_value ? Math.round(((r.achieved_value ?? 0) / progressTarget.target_value) * 100) : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-16">
            <div className={`h-1.5 rounded-full ${rate >= 70 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>
          <span className="text-xs font-bold text-slate-700">{rate}%</span>
        </div>
      );
    }},
    { header: 'Incentive', render: (r) => <span className="text-sm text-green-700 font-semibold">₹{(r.incentive_earned ?? 0).toLocaleString('en-IN')}</span> },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Target Management</h1>
          <p className="text-sm text-slate-500">Assign performance targets and incentives to staff</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#001b4e] text-white rounded-lg text-sm font-semibold hover:bg-[#001337] transition-colors"
        >
          <Plus size={16} /> Assign Target
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-indigo-600" />
                <h2 className="text-base font-black text-slate-900">Assign New Target</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Target Type *</label>
                  <select value={form.target_type} onChange={(e) => set('target_type', e.target.value)} className={inputCls} required>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Period *</label>
                  <select value={form.target_period} onChange={(e) => set('target_period', e.target.value)} className={inputCls} required>
                    {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Target Value *</label>
                  <input type="number" value={form.target_value} onChange={(e) => set('target_value', e.target.value)} min={1} required className={inputCls} placeholder="e.g. 50" />
                </div>
                <div>
                  <label className={labelCls}>Assign To *</label>
                  <select value={form.assign_to_type} onChange={(e) => set('assign_to_type', e.target.value)} className={inputCls} required>
                    {Object.entries(ASSIGN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" value={form.end_date} min={form.start_date} onChange={(e) => set('end_date', e.target.value)} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Incentive Type *</label>
                  <select value={form.incentive_type} onChange={(e) => set('incentive_type', e.target.value)} className={inputCls}>
                    <option value="fixed">Fixed (₹ per unit)</option>
                    <option value="percentage">Percentage (% of business)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Incentive Rate *</label>
                  <div className="relative">
                    {form.incentive_type === 'fixed' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>}
                    <input type="number" value={form.incentive_rate} onChange={(e) => set('incentive_rate', e.target.value)} min={0} step={0.5} required className={`${inputCls} ${form.incentive_type === 'fixed' ? 'pl-6' : ''}`} placeholder={form.incentive_type === 'fixed' ? '50' : '5'} />
                    {form.incentive_type === 'percentage' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Optional description..." maxLength={500} />
                  <p className="text-right text-[10px] font-bold text-slate-400 mt-1">{form.description.length}/500</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#001b4e] text-white rounded-lg text-sm font-bold hover:bg-[#001337] disabled:opacity-60">
                  {saving ? 'Assigning...' : 'Assign Target'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {progressTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-black text-slate-900">Target Progress</h2>
                <p className="text-sm text-slate-500">{TYPE_LABELS[progressTarget.target_type]} · {PERIOD_LABELS[progressTarget.target_period]} · Value: {progressTarget.target_value}</p>
              </div>
              <button onClick={() => setProgressTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <AdminTable columns={progressCols} data={progressData} loading={progressLoading} title="" hideSearch hideFilter />
            </div>
          </div>
        </div>
      )}

      <AdminTable columns={columns} data={targets} loading={loading} title="" hideSearch hideFilter />

      {confirmModal && (
        <ConfirmationModal isOpen onClose={() => setConfirmModal(null)} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={confirmModal.onConfirm} />
      )}
    </div>
  );
}
