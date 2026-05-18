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

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-slate-100 text-slate-600',
  incomplete: 'bg-slate-100 text-slate-500',
};

export default function AdminTeamLeaders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [page, setPage] = useState(1);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['admin-team-leaders', page, search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      return api.get(`/admin/staff/team-leaders?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
    onError: () => toast.error('Failed to load Team Leaders'),
  });

  const teamLeaders = rawData?.data || [];
  const totalPages = rawData?.totalPages || 1;
  const totalItems = rawData?.total || teamLeaders.length;

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/staff/team-leaders/${id}/toggle`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-team-leaders'] }),
  });

  const handleToggle = (id, currentActive) => {
    setConfirmModal({
      title: currentActive ? 'Deactivate Team Leader?' : 'Activate Team Leader?',
      message: currentActive
        ? 'This will prevent them from logging in.'
        : 'This will allow them to log in again.',
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
    { header: 'State', render: (row) => <span className="text-sm text-slate-700">{row.state}{row.district ? ` · ${row.district}` : ''}</span> },
    { header: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[row.onboarding_status] || 'bg-slate-100 text-slate-500'}`}>
        {row.onboarding_status?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Salary', render: (row) => (
      <div className="text-sm">
        <p className="font-semibold text-slate-800">₹{(row.fixed_salary || 0).toLocaleString('en-IN')}</p>
        <p className="text-xs text-slate-500">{row.commission_rate}% commission</p>
      </div>
    )},
    { header: 'Team', render: (row) => (
      <span className="text-sm font-semibold text-slate-700">{row.team_size ?? 0} members</span>
    )},
    { header: 'Active', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/admin/staff/team-leaders/view/${row._id}`)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
          <Eye size={15} />
        </button>
        <button onClick={() => navigate(`/admin/staff/team-leaders/edit/${row._id}`)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded">
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
          <h1 className="text-xl font-black text-slate-900">Team Leaders</h1>
          <p className="text-sm text-slate-500">Manage State Heads and their team structure</p>
        </div>
        <button
          onClick={() => navigate('/admin/staff/team-leaders/add')}
          className="flex items-center gap-2 px-4 py-2 bg-[#001b4e] text-white rounded-lg text-sm font-semibold hover:bg-[#001337] transition-colors"
        >
          <Plus size={16} /> Add Team Leader
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
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-64"
          />
        </FilterField>
        <FilterField label="Status">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </FilterField>
      </FilterBar>

      <AdminTable
        columns={columns}
        data={teamLeaders}
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
        <ConfirmationModal
          isOpen
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
