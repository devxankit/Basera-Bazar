import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Power } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import AdminTable from '../../../components/common/AdminTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';
import Pagination from '../../../components/admin/Pagination';
import { toast } from '../../../mockToast';

const SPEC_LABELS = {
  lead_generation: 'Lead Generation',
  follow_up: 'Follow-up',
  customer_support: 'Customer Support',
  data_update: 'Data Update',
};

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-slate-100 text-slate-600',
  incomplete: 'bg-slate-100 text-slate-500',
};

export default function AdminOfficeStaff() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState(null);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['admin-office-staff', page, search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/admin/staff/office-staff?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
    onError: () => toast.error('Failed to load Office Staff'),
  });

  const officeStaff = rawData?.data || [];
  const totalPages = rawData?.totalPages || 1;
  const totalItems = rawData?.total || officeStaff.length;

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/staff/office-staff/${id}/toggle`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-office-staff'] }),
  });

  const handleToggle = (id, currentActive) => {
    setConfirmModal({
      title: currentActive ? 'Deactivate Office Staff?' : 'Activate Office Staff?',
      message: currentActive ? 'They will lose portal access.' : 'This will restore their access.',
      type: currentActive ? 'warning' : 'success',
      onConfirm: async () => {
        try {
          await toggleMutation.mutateAsync(id);
          toast.success(currentActive ? 'Deactivated.' : 'Activated.');
        } catch {
          toast.error('Action failed.');
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0);

  const columns = [
    { header: 'Name', render: (row) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{row.name}</p>
        <p className="text-xs text-slate-500">{row.phone}</p>
      </div>
    )},
    { header: 'Team Leader', render: (row) => (
      <span className="text-sm text-slate-600">{row.team_leader_id?.name || '—'}</span>
    )},
    { header: 'Specialization', render: (row) => (
      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs font-semibold">
        {SPEC_LABELS[row.calling_specialization] || row.calling_specialization}
      </span>
    )},
    { header: 'Salary', render: (row) => <span className="font-semibold text-sm">₹{(row.fixed_salary || 0).toLocaleString('en-IN')}</span> },
    { header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[row.onboarding_status] || 'bg-slate-100 text-slate-500'}`}>
        {row.onboarding_status?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Active', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/admin/staff/office-staff/view/${row._id}`)} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded">
          <Eye size={15} />
        </button>
        <button onClick={() => navigate(`/admin/staff/office-staff/edit/${row._id}`)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded">
          <Pencil size={15} />
        </button>
        <button onClick={() => handleToggle(row._id, row.is_active)} className={`p-1.5 rounded ${row.is_active ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
          <Power size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Office Staff</h1>
          <p className="text-sm text-slate-500">Indoor / Calling staff managed by Team Leaders</p>
        </div>
        <button
          onClick={() => navigate('/admin/staff/office-staff/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#001b4e] text-white rounded-lg text-sm font-semibold hover:bg-[#001337] transition-colors"
        >
          <Plus size={16} /> Add Office Staff
        </button>
      </div>

      <FilterBar
        open
        activeCount={activeFilterCount}
        onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
      >
        <FilterField label="Search">
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white w-64"
          />
        </FilterField>
        <FilterField label="Status">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </FilterField>
      </FilterBar>

      <AdminTable
        columns={columns}
        data={officeStaff}
        loading={loading}
        title=""
        pagination={false}
        hideSearch
        hideFilter
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={20}
        onPageChange={setPage}
      />

      {confirmModal && (
        <ConfirmationModal isOpen title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(null)} />
      )}
    </div>
  );
}
