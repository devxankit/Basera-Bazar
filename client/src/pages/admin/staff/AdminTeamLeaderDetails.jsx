import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Power, BarChart3, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import AdminTable from '../../../components/common/AdminTable';
import Skeleton from '../../../components/common/Skeleton';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TAB_LIST = ['Overview', 'Team', 'Performance', 'Salary'];

export default function AdminTeamLeaderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [confirmModal, setConfirmModal] = useState(null);

  const { data: rawData, isLoading: loading, error: teamLeaderDetailError } = useQuery({
    queryKey: ['admin-team-leader-detail', id],
    queryFn: () => api.get(`/admin/staff/team-leaders/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (teamLeaderDetailError) toast.error('Failed to load.');
  }, [teamLeaderDetailError]);

  const tl = rawData?.data || null;

  const approveMutation = useMutation({
    mutationFn: () => api.put(`/admin/staff/team-leaders/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-leader-detail', id] });
      toast.success('Team Leader approved.');
    },
    onError: () => toast.error('Approval failed.'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/admin/staff/team-leaders/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-leader-detail', id] });
      toast.success('Status updated.');
    },
    onError: () => toast.error('Toggle failed.'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (recordId) => api.put(`/admin/staff/salary/${recordId}/pay`, { notes: '' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-leader-detail', id] });
      toast.success('Marked as paid.');
    },
    onError: () => toast.error('Failed to mark as paid.'),
  });

  const handleApprove = () => {
    setConfirmModal({
      title: 'Approve Team Leader?',
      message: 'This will grant them portal access.',
      type: 'success',
      onConfirm: async () => {
        await approveMutation.mutateAsync();
        setConfirmModal(null);
      },
    });
  };

  const handleToggle = () => toggleMutation.mutate();

  const markPaid = (recordId) => markPaidMutation.mutate(recordId);

  if (loading) return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-24" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );

  if (!tl) return <div className="p-8 text-center text-red-400">Team Leader not found.</div>;

  const salaryHistoryCols = [
    { header: 'Month', key: 'month' },
    { header: 'Base', render: (r) => `₹${(r.base_salary || 0).toLocaleString('en-IN')}` },
    { header: 'Commission', render: (r) => `₹${(r.team_commission_amount || 0).toLocaleString('en-IN')}` },
    { header: 'Deduction', render: (r) => r.deduction_applied ? <span className="text-red-600">-₹{(r.deduction_amount || 0).toLocaleString('en-IN')}</span> : '—' },
    { header: 'Net Pay', render: (r) => <span className="font-bold">₹{(r.effective_salary || 0).toLocaleString('en-IN')}</span> },
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.status?.toUpperCase()}
      </span>
    )},
    { header: 'Actions', render: (r) => r.status === 'pending' ? (
      <button onClick={() => markPaid(r._id)} className="px-3 py-1 bg-[#001b4e] text-white rounded text-xs font-bold hover:bg-[#001337]">
        Mark Paid
      </button>
    ) : <span className="text-xs text-slate-400">{r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-IN') : ''}</span> },
  ];

  const teamMemberCols = [
    { header: 'Name', render: (r) => <span className="font-semibold text-sm">{r.name}</span> },
    { header: 'Phone', key: 'phone' },
    { header: 'Role', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.calling_specialization ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
        {r.calling_specialization ? 'Office Staff' : 'Field Exec'}
      </span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/admin/staff/team-leaders')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900">{tl.name}</h1>
          <p className="text-sm text-slate-500">{tl.phone} · {tl.state}{tl.district ? `, ${tl.district}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {tl.onboarding_status === 'pending_approval' && (
            <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">
              <CheckCircle size={15} /> Approve
            </button>
          )}
          <button onClick={() => navigate(`/admin/staff/team-leaders/edit/${id}`)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            <Pencil size={15} /> Edit
          </button>
          <button onClick={handleToggle} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${tl.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            <Power size={15} /> {tl.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5 gap-1">
        {TAB_LIST.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Salary Structure</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-slate-600">Fixed Salary</span><span className="font-bold text-slate-900">₹{(tl.fixed_salary || 0).toLocaleString('en-IN')}/month</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-600">Commission Rate</span><span className="font-bold text-slate-900">{tl.commission_rate}% of team business</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-600">Total Commission Earned</span><span className="font-bold text-green-600">₹{(tl.total_commission_earned || 0).toLocaleString('en-IN')}</span></div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Team Size</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-slate-600">Field Executives</span><span className="font-bold text-orange-600">{tl.fe_count ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-600">Office Staff</span><span className="font-bold text-teal-600">{tl.os_count ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-600">Total</span><span className="font-bold text-slate-900">{(tl.fe_count ?? 0) + (tl.os_count ?? 0)}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Team' && (
        <div>
          <AdminTable
            title="Team Members"
            columns={teamMemberCols}
            data={[...(tl.executives || []), ...(tl.office_staff || [])]}
            loading={false}
          />
        </div>
      )}

      {tab === 'Salary' && (
        <AdminTable
          title="Salary History"
          columns={salaryHistoryCols}
          data={tl.salary_history || []}
          loading={false}
        />
      )}

      {tab === 'Performance' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {tl.performance ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Performance — {tl.performance.month}</h3>
                  <p className="text-sm text-slate-500">Target vs Achievement for current cycle</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  tl.performance.status === 'finalized' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {tl.performance.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target</p>
                  <p className="text-2xl font-black text-slate-900">₹{(tl.performance.target_value || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Achieved</p>
                  <p className="text-2xl font-black text-indigo-600">₹{(tl.performance.achieved_value || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Achievement Rate</p>
                  <p className="text-2xl font-black text-emerald-600">{Math.round(tl.performance.achievement_rate * 100)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                  <span>Progress</span>
                  <span>{Math.round(tl.performance.achievement_rate * 100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={cn(
                      "h-full transition-all duration-1000",
                      tl.performance.achievement_rate >= 0.7 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(100, tl.performance.achievement_rate * 100)}%` }}
                  />
                </div>
                {tl.performance.achievement_rate < 0.7 && (
                  <p className="text-[11px] font-bold text-amber-600 uppercase flex items-center gap-1">
                    ⚠️ Performance is currently below 70% threshold
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm text-slate-400">No performance records found for this period.</p>
              <p className="text-[11px] text-slate-400 uppercase font-bold mt-1">Monthly metrics are calculated during the salary cycle</p>
            </div>
          )}
        </div>
      )}

      {confirmModal && (
        <ConfirmationModal
          isOpen onClose={() => setConfirmModal(null)}
          title={confirmModal.title} message={confirmModal.message}
          type={confirmModal.type} onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}
