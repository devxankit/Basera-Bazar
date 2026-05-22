import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_BADGE = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  on_leave: 'bg-blue-100 text-blue-700',
};

export default function TeamLeaderAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [verifying, setVerifying] = useState(null);
  const queryClient = useQueryClient();

  const { data: rawData, isLoading: loading, error: attendanceError } = useQuery({
    queryKey: ['teamLeaderAttendance', date],
    queryFn: () => api.get(`/team-leader/attendance?date=${date}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (attendanceError) toast.error('Failed to load attendance.');
  }, [attendanceError]);

  const records = rawData?.success ? rawData.data : [];

  const handleVerify = async (id) => {
    setVerifying(id);
    try {
      await api.put(`/team-leader/attendance/${id}/verify`);
      toast.success('Attendance verified.');
      queryClient.invalidateQueries({ queryKey: ['teamLeaderAttendance', date] });
    } catch { toast.error('Failed to verify.'); }
    finally { setVerifying(null); }
  };

  const handleVerifyAll = async () => {
    const pending = records.filter((r) => !r.verified_by_team_leader && r.check_in_time);
    for (const r of pending) {
      await api.put(`/team-leader/attendance/${r._id}/verify`);
    }
    toast.success('All verified.');
    queryClient.invalidateQueries({ queryKey: ['teamLeaderAttendance', date] });
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const pendingCount = records.filter((r) => !r.verified_by_team_leader && r.check_in_time).length;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Team Attendance</h1>
          <p className="text-sm text-slate-500">Verify your team's daily attendance</p>
        </div>
        {pendingCount > 0 && (
          <button onClick={handleVerifyAll} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
            Verify All ({pendingCount})
          </button>
        )}
      </div>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      />

      {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

      {!loading && records.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
          No attendance records for {date}.
        </div>
      )}

      {records.map((r) => (
        <div key={r._id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-slate-800">{r.staff_id?.name || '—'}</p>
              <p className="text-xs text-slate-500 capitalize">{r.staff_type?.replace('_', ' ')}</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                {r.status?.replace('_', ' ').toUpperCase()}
              </span>
              {r.verified_by_team_leader
                ? <span className="text-xs text-indigo-600 font-bold">✓</span>
                : r.check_in_time && (
                  <button
                    onClick={() => handleVerify(r._id)}
                    disabled={verifying === r._id}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100 disabled:opacity-60"
                  >
                    <CheckCircle size={12} /> {verifying === r._id ? '...' : 'Verify'}
                  </button>
                )
              }
            </div>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>In: <strong className="text-slate-700">{formatTime(r.check_in_time)}</strong></span>
            <span>Out: <strong className="text-slate-700">{formatTime(r.check_out_time)}</strong></span>
            {r.working_hours && <span>Hours: <strong className="text-slate-700">{r.working_hours.toFixed(1)}h</strong></span>}
            {r.staff_type === 'field_executive' && r.geo_fence_valid !== undefined && (
              <span>GPS: <strong className={r.geo_fence_valid ? 'text-green-600' : 'text-red-500'}>{r.geo_fence_valid ? '✓' : '✗'}</strong></span>
            )}
          </div>
          {r.check_in_selfie && (
            <a href={r.check_in_selfie} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 underline mt-1 block">View selfie</a>
          )}
        </div>
      ))}
    </div>
  );
}
