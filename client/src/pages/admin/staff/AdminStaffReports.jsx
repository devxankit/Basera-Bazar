import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';
import FilterBar, { FilterField } from '../../../components/admin/FilterBar';
import EmptyState from '../../../components/common/EmptyState';

const STAFF_TYPES = [
  { value: '', label: 'All Staff' },
  { value: 'field_executive', label: 'Field Executives' },
  { value: 'office_staff', label: 'Office Staff' },
];

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  tl_verified: 'bg-blue-100 text-blue-700',
  admin_verified: 'bg-green-100 text-green-700',
};

export default function AdminStaffReports() {
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today);
  const [staffType, setStaffType] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');

  const { data: rawData, isLoading: loading, error: staffReportsError } = useQuery({
    queryKey: ['admin-staff-reports', date, staffType],
    queryFn: () => {
      const params = new URLSearchParams({ date });
      if (staffType) params.set('staff_type', staffType);
      return api.get(`/admin/staff/reports/daily?${params}`).then((r) => r.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (staffReportsError) toast.error('Failed to load reports.');
  }, [staffReportsError]);

  const reports = rawData?.data || [];

  const verifyMutation = useMutation({
    mutationFn: ({ id, action, remarks }) =>
      api.put(`/admin/staff/reports/daily/${id}/verify`, { action, remarks }).then((r) => r.data),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-reports'] });
      toast.success(action === 'approve' ? 'Report verified.' : 'Report rejected.');
      setExpandedId(null);
      setRemarkInput('');
    },
    onError: () => toast.error('Action failed.'),
  });

  const handleVerify = (id, action) => {
    if (!remarkInput.trim() && action === 'reject') {
      toast.error('Please enter rejection remarks.');
      return;
    }
    verifyMutation.mutate({ id, action, remarks: remarkInput });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ date });
      if (staffType) params.set('staff_type', staffType);
      const response = await api.get(`/admin/staff/reports/daily/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed.'); }
  };

  const activeFilterCount = staffType ? 1 : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Daily Reports</h1>
          <p className="text-sm text-slate-500">Review and verify staff daily work reports</p>
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

      <div className="space-y-2">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

        {!loading && reports.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No reports found"
            message={`No reports found for ${date}.`}
          />
        )}

        {!loading && reports.map((r) => (
          <div key={r._id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.staff_type === 'field_executive' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                  {r.staff_type === 'field_executive' ? 'FE' : 'OS'}
                </span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name}</p>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || ''}`}>
                  {r.status?.replace('_', ' ').toUpperCase()}
                </span>
                {r.status !== 'admin_verified' && (
                  <button
                    onClick={() => { setExpandedId(expandedId === r._id ? null : r._id); setRemarkInput(''); }}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100"
                  >
                    {expandedId === r._id ? 'Close' : 'Review'}
                  </button>
                )}
              </div>
            </div>

            {expandedId === r._id && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {(r.staff_type === 'field_executive' ? [
                    { label: 'Partners Visited', value: r.partners_visited ?? 0 },
                    { label: 'Partners Registered', value: r.partners_registered ?? 0 },
                    { label: 'Subscriptions Sold', value: r.subscriptions_sold ?? 0 },
                    { label: 'Leads Uploaded', value: r.leads_uploaded ?? 0 },
                  ] : [
                    { label: 'Calls Made', value: r.calls_made ?? 0 },
                    { label: 'Follow-ups Done', value: r.follow_ups_done ?? 0 },
                    { label: 'Leads Generated', value: r.leads_generated ?? 0 },
                    { label: 'Data Entries', value: r.data_entries_updated ?? 0 },
                  ]).map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-black text-slate-800">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                {r.notes && <p className="text-xs text-slate-500 mb-3 bg-slate-50 rounded p-2">{r.notes}</p>}
                {r.tl_remarks && <p className="text-xs text-blue-600 mb-3">TL: {r.tl_remarks}</p>}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={remarkInput}
                      onChange={(e) => setRemarkInput(e.target.value.slice(0, 100))}
                      maxLength={100}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-12"
                      placeholder="Admin remarks (required for rejection)..."
                    />
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black ${remarkInput.length >= 90 ? 'text-red-500' : 'text-slate-400'}`}>
                      {remarkInput.length}/100
                    </span>
                  </div>
                  <button
                    onClick={() => handleVerify(r._id, 'approve')}
                    disabled={verifyMutation.isLoading}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-60"
                  >
                    <CheckCircle size={13} /> Verify
                  </button>
                  <button
                    onClick={() => handleVerify(r._id, 'reject')}
                    disabled={verifyMutation.isLoading}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-60"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
