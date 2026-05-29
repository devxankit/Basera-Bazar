import React, { useState, useEffect } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'team_leader', label: 'Team Leaders' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

const STATUS_BADGE = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  on_leave: 'bg-blue-100 text-blue-700',
};

export default function AdminAttendanceMonitor() {
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today);
  const [staffType, setStaffType] = useState('');

  const { data: rawData, isLoading: loading, error: attendanceMonitorError } = useQuery({
    queryKey: ['admin-attendance-monitor', date, staffType],
    queryFn: () => {
      const params = new URLSearchParams({ date });
      if (staffType) params.set('staff_type', staffType);
      return api.get(`/admin/staff/attendance?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (attendanceMonitorError) toast.error('Failed to load attendance.');
  }, [attendanceMonitorError]);

  const records = rawData?.data || [];

  const verifyMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/staff/attendance/${id}/verify`, { action: 'approve' }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-monitor'] });
      toast.success('Attendance verified.');
    },
    onError: () => toast.error('Failed to verify.'),
  });

  const handleVerify = (id) => verifyMutation.mutate(id);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ date });
      if (staffType) params.set('staff_type', staffType);
      const response = await api.get(`/admin/staff/attendance/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed.'); }
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const activeFilterCount = staffType ? 1 : 0;

  const columns = [
    { header: 'Staff', render: (r) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name || '—'}</p>
        <p className="text-xs text-slate-500">{r.staff_id?.phone}</p>
      </div>
    )},
    { header: 'Type', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
        r.staff_type === 'team_leader' ? 'bg-indigo-100 text-indigo-700' :
        r.staff_type === 'field_executive' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
      }`}>
        {r.staff_type?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Check In', render: (r) => <span className="text-sm text-slate-700">{formatTime(r.check_in_time)}</span> },
    { header: 'Check Out', render: (r) => <span className="text-sm text-slate-700">{formatTime(r.check_out_time)}</span> },
    { header: 'Hours', render: (r) => <span className="text-sm font-semibold text-slate-700">{r.working_hours ? `${r.working_hours.toFixed(1)}h` : '—'}</span> },
    { header: 'GPS', render: (r) => r.staff_type === 'field_executive' ? (
      r.geo_fence_valid === undefined ? <span className="text-xs text-slate-400">N/A</span> :
      r.geo_fence_valid ? <span className="text-xs text-green-600 font-bold">✓ Valid</span> : <span className="text-xs text-red-500 font-bold">✗ {r.geo_fence_distance_m ? `${Math.round(r.geo_fence_distance_m)}m` : 'Invalid'}</span>
    ) : <span className="text-xs text-slate-400">—</span> },
    { header: 'Selfie', render: (r) => r.check_in_selfie ? (
      <a href={r.check_in_selfie} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors">
        <img src={r.check_in_selfie} alt="Selfie" className="w-full h-full object-cover" />
      </a>
    ) : <span className="text-xs text-slate-400">—</span> },
    { header: 'Status', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-500'}`}>
        {r.status?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Verified', render: (r) => (
      r.verified_by_admin
        ? <span className="text-xs text-green-600 font-bold">✓ Admin</span>
        : r.verified_by_team_leader
          ? <span className="text-xs text-blue-600 font-bold">✓ TL</span>
          : <span className="text-xs text-slate-400">Pending</span>
    )},
    { header: 'Actions', render: (r) => !r.verified_by_admin && r.check_in_time ? (
      <button
        onClick={() => handleVerify(r._id)}
        disabled={verifyMutation.isLoading}
        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold hover:bg-green-100 disabled:opacity-60"
      >
        <CheckCircle size={12} /> Verify
      </button>
    ) : null },
  ];

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const leaveCount = records.filter((r) => r.status === 'on_leave').length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Attendance Monitor</h1>
          <p className="text-sm text-slate-500">Daily attendance overview and verification</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <FilterBar
        open
        activeCount={activeFilterCount}
        onReset={() => setStaffType('')}
      >
        <FilterField label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Present', value: presentCount, color: 'text-green-600' },
          { label: 'Absent', value: absentCount, color: 'text-red-500' },
          { label: 'On Leave', value: leaveCount, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <AdminTable columns={columns} data={records} loading={loading} title={`Attendance — ${date}`} hideSearch hideFilter />
    </div>
  );
}
