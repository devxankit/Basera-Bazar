import React, { useState, useEffect } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import AdminTable from '../../../components/common/AdminTable';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';
import EmptyState from '../../../components/common/EmptyState';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'team_leader', label: 'Team Leaders' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

export default function AdminAttendanceReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [staffType, setStaffType] = useState('');

  const { data: rawData, isLoading: loading, error: attendanceReportError } = useQuery({
    queryKey: ['admin-attendance-report', month, staffType],
    queryFn: () => {
      const params = new URLSearchParams({ month });
      if (staffType) params.set('staff_type', staffType);
      return api.get(`/admin/staff/attendance/summary?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (attendanceReportError) toast.error('Failed to load attendance summary.');
  }, [attendanceReportError]);

  const summary = rawData?.data || [];

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ month });
      if (staffType) params.set('staff_type', staffType);
      const response = await api.get(`/admin/staff/attendance/report?${params}&format=csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed.'); }
  };

  const activeFilterCount = staffType ? 1 : 0;

  const columns = [
    { header: 'Staff', render: (r) => (
      <div>
        <p className="font-bold text-slate-800 text-sm">{r.name}</p>
        <p className="text-xs text-slate-500">{r.phone}</p>
      </div>
    )},
    { header: 'Role', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
        r.staff_type === 'team_leader' ? 'bg-indigo-100 text-indigo-700' :
        r.staff_type === 'field_executive' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
      }`}>
        {r.staff_type?.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { header: 'Present', render: (r) => <span className="font-bold text-green-600">{r.present_days ?? 0}</span> },
    { header: 'Absent', render: (r) => <span className="font-bold text-red-500">{r.absent_days ?? 0}</span> },
    { header: 'Half Day', render: (r) => <span className="font-bold text-amber-500">{r.half_days ?? 0}</span> },
    { header: 'Leave', render: (r) => <span className="font-bold text-blue-500">{r.leave_days ?? 0}</span> },
    { header: 'Attendance %', render: (r) => {
      const total = (r.present_days ?? 0) + (r.absent_days ?? 0) + (r.half_days ?? 0) + (r.leave_days ?? 0);
      const rate = total > 0 ? Math.round(((r.present_days ?? 0) / total) * 100) : 0;
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700">{rate}%</span>
        </div>
      );
    }},
    { header: 'Avg Hours', render: (r) => <span className="text-sm text-slate-700">{r.avg_hours ? `${r.avg_hours.toFixed(1)}h` : '—'}</span> },
  ];

  const totalPresent = summary.reduce((s, r) => s + (r.present_days ?? 0), 0);
  const totalAbsent = summary.reduce((s, r) => s + (r.absent_days ?? 0), 0);
  const avgRate = summary.length > 0
    ? Math.round(summary.reduce((s, r) => {
        const total = (r.present_days ?? 0) + (r.absent_days ?? 0) + (r.half_days ?? 0) + (r.leave_days ?? 0);
        return s + (total > 0 ? (r.present_days ?? 0) / total : 0);
      }, 0) / summary.length * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Attendance Report</h1>
          <p className="text-sm text-slate-500">Monthly attendance summary per staff member</p>
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

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Present Days', value: totalPresent, color: 'text-green-600' },
          { label: 'Total Absent Days', value: totalAbsent, color: 'text-red-500' },
          { label: 'Avg Attendance Rate', value: `${avgRate}%`, color: avgRate >= 80 ? 'text-green-600' : avgRate >= 60 ? 'text-amber-500' : 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {summary.length === 0 && !loading && (
        <EmptyState
          icon={BarChart3}
          title="No attendance data"
          message={`No attendance data for ${month}.`}
        />
      )}

      {(summary.length > 0 || loading) && (
        <AdminTable columns={columns} data={summary} loading={loading} title={`Monthly Summary — ${month}`} hideSearch hideFilter />
      )}
    </div>
  );
}
