import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  tl_verified: 'bg-green-100 text-green-700',
  admin_verified: 'bg-blue-100 text-blue-700',
};

export default function TeamLeaderReports() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [staffType, setStaffType] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (staffType) params.set('staff_type', staffType);
      const { data } = await api.get(`/team-leader/reports/daily?${params}`);
      if (data.success) setReports(data.data);
    } catch { toast.error('Failed to load reports.'); }
    finally { setLoading(false); }
  }, [date, staffType]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleVerify = async (id, action) => {
    if (action === 'reject' && !remarkInput.trim()) {
      toast.error('Please enter rejection remarks.');
      return;
    }
    try {
      await api.put(`/team-leader/reports/daily/${id}/verify`, { action, remarks: remarkInput });
      toast.success(action === 'approve' ? 'Report verified.' : 'Report rejected.');
      setExpandedId(null);
      setRemarkInput('');
      fetchReports();
    } catch { toast.error('Action failed.'); }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">Daily Reports</h1>
        <p className="text-sm text-slate-500">Verify team member daily work reports</p>
      </div>

      <div className="flex gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <select
          value={staffType}
          onChange={(e) => setStaffType(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white"
        >
          <option value="">All</option>
          <option value="field_executive">Field Exec</option>
          <option value="office_staff">Office Staff</option>
        </select>
      </div>

      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {!loading && reports.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">No reports for {date}.</div>
      )}

      {reports.map((r) => (
        <div key={r._id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">{r.staff_id?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{r.staff_type?.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || ''}`}>
                {r.status?.replace('_', ' ').toUpperCase()}
              </span>
              {r.status === 'submitted' && (
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
              <div className="mt-3 grid grid-cols-2 gap-3 mb-3">
                {r.staff_type === 'field_executive' ? [
                  { label: 'Visited', value: r.partners_visited ?? 0 },
                  { label: 'Registered', value: r.partners_registered ?? 0 },
                  { label: 'Subscriptions', value: r.subscriptions_sold ?? 0 },
                  { label: 'Leads', value: r.leads_uploaded ?? 0 },
                ] : [
                  { label: 'Calls', value: r.calls_made ?? 0 },
                  { label: 'Follow-ups', value: r.follow_ups_done ?? 0 },
                  { label: 'Leads', value: r.leads_generated ?? 0 },
                  { label: 'Data Entries', value: r.data_entries_updated ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-slate-800">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              {r.notes && <p className="text-xs text-slate-500 mb-2 bg-slate-50 rounded p-2">{r.notes}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Remarks (required for rejection)..."
                />
                <button onClick={() => handleVerify(r._id, 'approve')} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
                  <CheckCircle size={12} /> OK
                </button>
                <button onClick={() => handleVerify(r._id, 'reject')} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                  <XCircle size={12} /> Rej
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
