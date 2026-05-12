import React, { useEffect, useState, useCallback } from 'react';
import { LogIn, LogOut, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const STATUS_COLOR = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  on_leave: 'bg-blue-100 text-blue-700',
};

const DAY_COLOR = {
  present: 'bg-green-400',
  absent: 'bg-red-400',
  half_day: 'bg-amber-300',
  on_leave: 'bg-blue-400',
};

export default function OfficeStaffAttendance() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [history, setHistory] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/office-staff/attendance/today').catch(() => ({ data: { data: null } })),
        api.get(`/office-staff/attendance/history?month=${month}`),
      ]);
      if (todayRes.data.success) setToday(todayRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch { toast.error('Failed to load attendance.'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/office-staff/attendance/check-in');
      toast.success('Checked in.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed.'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/office-staff/attendance/check-out');
      toast.success('Checked out.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed.'); }
    finally { setCheckingIn(false); }
  };

  const isIn = today?.check_in_time && !today?.check_out_time;
  const isOut = today?.check_in_time && today?.check_out_time;
  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const presentDays = history.filter((r) => r.status === 'present').length;
  const absentDays = history.filter((r) => r.status === 'absent').length;
  const leaveDays = history.filter((r) => r.status === 'on_leave').length;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-black text-slate-900">Attendance</h1>

      {/* Check-in/out card */}
      <div className={`rounded-lg p-5 border ${isIn ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Today</p>
            <p className={`text-base font-black mt-0.5 ${isIn ? 'text-green-700' : isOut ? 'text-slate-700' : 'text-amber-600'}`}>
              {isIn ? 'In Office' : isOut ? 'Done for Today' : 'Not Yet Checked In'}
            </p>
          </div>
          <Clock size={20} className={isIn ? 'text-green-500' : 'text-slate-400'} />
        </div>
        {today?.check_in_time && (
          <div className="flex gap-6 text-sm mb-4">
            <div>
              <p className="text-xs text-slate-500">Check In</p>
              <p className="font-bold text-slate-800">{formatTime(today.check_in_time)}</p>
            </div>
            {today.check_out_time && (
              <div>
                <p className="text-xs text-slate-500">Check Out</p>
                <p className="font-bold text-slate-800">{formatTime(today.check_out_time)}</p>
              </div>
            )}
            {today.working_hours && (
              <div>
                <p className="text-xs text-slate-500">Hours</p>
                <p className="font-bold text-slate-800">{today.working_hours.toFixed(1)}h</p>
              </div>
            )}
          </div>
        )}
        {!isOut && (
          <button
            onClick={isIn ? handleCheckOut : handleCheckIn}
            disabled={checkingIn}
            className={`w-full py-3 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60 ${
              isIn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isIn ? <><LogOut size={16} /> Check Out</> : <><LogIn size={16} /> Check In</>}
          </button>
        )}
      </div>

      {/* Month summary */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Present', value: presentDays, color: 'text-green-600' },
            { label: 'Absent', value: absentDays, color: 'text-red-500' },
            { label: 'Leave', value: leaveDays, color: 'text-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Calendar dots */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Monthly View</p>
          <div className="flex flex-wrap gap-1.5">
            {history.map((r) => (
              <div key={r._id} title={`${r.date}: ${r.status}`} className={`w-6 h-6 rounded ${DAY_COLOR[r.status] || 'bg-slate-200'} flex items-center justify-center`}>
                <span className="text-[9px] font-bold text-white">{new Date(r.date).getDate()}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            {[['bg-green-400', 'Present'], ['bg-red-400', 'Absent'], ['bg-amber-300', 'Half Day'], ['bg-blue-400', 'Leave']].map(([col, lbl]) => (
              <span key={lbl} className="flex items-center gap-1"><span className={`w-3 h-3 rounded-sm ${col}`} />{lbl}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
