import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Power, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import Skeleton from '../../../components/common/Skeleton';
import StaffKycDocuments from '../../../components/common/StaffKycDocuments';

const TABS = ['Overview', 'Attendance', 'Salary'];

const SPEC_LABELS = { lead_generation: 'Lead Generation', follow_up: 'Follow-up', customer_support: 'Customer Support', data_update: 'Data Update' };

export default function AdminOfficeStaffDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [confirmModal, setConfirmModal] = useState(null);

  const { data: rawData, isLoading: loading, error: officeStaffDetailError } = useQuery({
    queryKey: ['admin-office-staff-detail', id],
    queryFn: () => api.get(`/admin/staff/office-staff/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (officeStaffDetailError) toast.error('Failed to load.');
  }, [officeStaffDetailError]);

  const os = rawData?.data || null;

  const approveMutation = useMutation({
    mutationFn: () => api.put(`/admin/staff/office-staff/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-office-staff-detail', id] });
      toast.success('Approved.');
    },
    onError: () => toast.error('Approval failed.'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.put(`/admin/staff/office-staff/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-office-staff-detail', id] });
      toast.success('Status updated.');
    },
    onError: () => toast.error('Toggle failed.'),
  });

  const handleApprove = () => {
    setConfirmModal({
      title: 'Approve Office Staff?',
      message: 'This will grant them portal access.',
      type: 'success',
      onConfirm: async () => {
        await approveMutation.mutateAsync();
        setConfirmModal(null);
      },
    });
  };

  const handleToggle = () => toggleMutation.mutate();

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
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24" />)}
      </div>
      <div className="max-w-md">
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );

  if (!os) return <div className="p-8 text-center text-red-400">Not found.</div>;

  const salaryCols = [
    { header: 'Month', key: 'month' },
    { header: 'Base', render: (r) => `₹${(r.base_salary || 0).toLocaleString('en-IN')}` },
    { header: 'Incentive', render: (r) => `₹${(r.incentive_amount || 0).toLocaleString('en-IN')}` },
    { header: 'Net Pay', render: (r) => <span className="font-bold">₹{(r.effective_salary || 0).toLocaleString('en-IN')}</span> },
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {r.status?.toUpperCase()}
      </span>
    )},
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/admin/staff/office-staff')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900">{os.name}</h1>
          <p className="text-sm text-slate-500">{os.phone} · {SPEC_LABELS[os.calling_specialization] || os.calling_specialization}</p>
        </div>
        <div className="flex items-center gap-2">
          {os.onboarding_status === 'pending_approval' && (
            <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">
              <CheckCircle size={15} /> Approve
            </button>
          )}
          <button onClick={() => navigate(`/admin/staff/office-staff/edit/${id}`)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            <Pencil size={15} /> Edit
          </button>
          <button onClick={handleToggle} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${os.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <Power size={15} /> {os.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-5 gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === t ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold">{os.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Team Leader</span><span className="font-semibold">{os.team_leader_id?.name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Specialization</span><span className="font-semibold">{SPEC_LABELS[os.calling_specialization]}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fixed Salary</span><span className="font-semibold text-teal-600">₹{(os.fixed_salary || 0).toLocaleString('en-IN')}/month</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`px-2 py-0.5 rounded text-xs font-bold ${os.onboarding_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{os.onboarding_status?.toUpperCase()}</span></div>
            </div>
          </div>
          <StaffKycDocuments kyc={os.kyc} livePhoto={os.profile_image} />
        </div>
      )}

      {tab === 'Salary' && (
        <AdminTable title="Salary History" columns={salaryCols} data={os.salary_history || []} loading={false} />
      )}

      {tab === 'Attendance' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-400">
          <p className="text-sm">View attendance from the Attendance Monitor page.</p>
        </div>
      )}

      {confirmModal && (
        <ConfirmationModal isOpen onClose={() => setConfirmModal(null)} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={confirmModal.onConfirm} />
      )}
    </div>
  );
}
