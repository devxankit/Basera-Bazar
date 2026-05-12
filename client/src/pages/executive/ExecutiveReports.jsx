import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-500',
  submitted: 'bg-amber-100 text-amber-700',
  tl_verified: 'bg-blue-100 text-blue-700',
  admin_verified: 'bg-green-100 text-green-700',
};

export default function ExecutiveReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/executive/reports/history')
      .then(({ data }) => { if (data.success) setReports(data.data); })
      .catch(() => toast.error('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Daily Reports</h1>
          <p className="text-sm text-slate-500">Your field work reports</p>
        </div>
        <button onClick={() => navigate('/executive/reports/submit')} className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700">
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
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || ''}`}>
              {r.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Visited', value: r.partners_visited ?? 0 },
              { label: 'Registered', value: r.partners_registered ?? 0 },
              { label: 'Subs', value: r.subscriptions_sold ?? 0 },
              { label: 'Leads', value: r.leads_uploaded ?? 0 },
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
