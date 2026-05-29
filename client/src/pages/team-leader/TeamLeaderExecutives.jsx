import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

// Map the real attendance status to a label + colour. Anything that isn't a
// recorded status (or no record) is treated as Absent — but half_day / on_leave
// are shown correctly instead of being mislabelled "Absent" (bug #347).
const ATT_STATUS = {
  present:  { label: 'Present',  cls: 'bg-green-100 text-green-700' },
  half_day: { label: 'Half Day', cls: 'bg-amber-100 text-amber-700' },
  on_leave: { label: 'On Leave', cls: 'bg-blue-100 text-blue-700' },
  absent:   { label: 'Absent',   cls: 'bg-slate-100 text-slate-500' },
};
const attStatus = (rec) => ATT_STATUS[rec?.status] || ATT_STATUS.absent;

export default function TeamLeaderExecutives() {
  const { data: rawData, isLoading: loading, error: executivesError } = useQuery({
    queryKey: ['teamLeaderExecutives'],
    queryFn: () => api.get('/team-leader/team/executives').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (executivesError) toast.error('Failed to load executives.');
  }, [executivesError]);

  const executives = rawData?.success ? rawData.data : [];

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Field Executives</h1>
        <p className="text-sm text-slate-500">{executives.length} executive(s) under your team</p>
      </div>

      {executives.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
          No field executives assigned yet.
        </div>
      )}

      {executives.map((fe) => (
        <div key={fe._id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-slate-800">{fe.name}</p>
              <p className="text-xs text-slate-500">{fe.phone}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${fe.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {fe.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${attStatus(fe.today_attendance).cls}`}>
                {attStatus(fe.today_attendance).label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">This month:</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-orange-400"
                  style={{ width: `${Math.min(Math.round((fe.monthly_achievement ?? 0) * 100), 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{Math.round((fe.monthly_achievement ?? 0) * 100)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
