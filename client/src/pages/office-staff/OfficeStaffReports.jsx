import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  tl_verified: 'bg-blue-100 text-blue-700',
  admin_verified: 'bg-green-100 text-green-700',
};

export default function OfficeStaffReports() {
  const navigate = useNavigate();

  const { data: rawData, isLoading: loading, error } = useQuery({
    queryKey: ['office-staff-reports'],
    queryFn: () => api.get('/office-staff/reports/history').then(r => r.data),
    staleTime: 0, // always refetch when navigating back to this page
  });

  useEffect(() => {
    if (error) toast.error('Failed to load reports.');
  }, [error]);

  const reports = rawData?.success ? rawData.data : [];

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Daily Reports</h1>
          <p className="text-sm text-slate-500">Your submitted work reports</p>
        </div>
        <button onClick={() => navigate('/office-staff/reports/submit')} className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700">
          <Plus size={13} /> Submit Today
        </button>
      </div>

      {reports.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
          No reports yet. Submit your first daily report!
        </div>
      )}

      {reports.map((r) => (
        <div key={r._id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">{r.date}</p>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-500'}`}>
              {r.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calls', value: r.calls_made ?? 0 },
              { label: 'Follow-ups', value: r.follow_ups_done ?? 0 },
              { label: 'Leads', value: r.leads_generated ?? 0 },
              { label: 'Data', value: r.data_entries_updated ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded p-2 text-center">
                <p className="text-base font-black text-slate-800">{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          {r.notes && <p className="text-xs text-slate-500 truncate">{r.notes}</p>}
          {r.tl_remarks && <p className="text-xs text-blue-600">TL: {r.tl_remarks}</p>}
          {r.admin_remarks && <p className="text-xs text-indigo-600">Admin: {r.admin_remarks}</p>}
        </div>
      ))}
    </div>
  );
}
