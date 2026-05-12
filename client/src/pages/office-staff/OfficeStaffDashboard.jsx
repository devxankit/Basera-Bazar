import React, { useEffect, useState } from 'react';
import { Phone, Target, FileText, IndianRupee, Clock, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from '../../mockToast';

export default function OfficeStaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetch = () => {
    setLoading(true);
    api.get('/office-staff/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/office-staff/attendance/check-in');
      toast.success('Checked in successfully.');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed.'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/office-staff/attendance/check-out');
      toast.success('Checked out successfully.');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Check-out failed.'); }
    finally { setCheckingIn(false); }
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  const attendance = stats?.today_attendance;
  const isCheckedIn = attendance?.check_in_time && !attendance?.check_out_time;
  const isCheckedOut = attendance?.check_in_time && attendance?.check_out_time;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {stats?.name || 'Office Staff'}</p>
      </div>

      {/* Attendance card */}
      <div className={`rounded-lg p-5 border ${isCheckedIn ? 'bg-green-50 border-green-200' : isCheckedOut ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Today's Attendance</p>
            <p className={`text-sm font-bold mt-0.5 ${isCheckedIn ? 'text-green-600' : isCheckedOut ? 'text-slate-600' : 'text-amber-600'}`}>
              {isCheckedIn ? 'Currently In Office' : isCheckedOut ? 'Checked Out' : 'Not Checked In'}
            </p>
          </div>
          <Clock size={20} className={isCheckedIn ? 'text-green-500' : 'text-slate-400'} />
        </div>
        {attendance?.check_in_time && (
          <p className="text-xs text-slate-500 mb-3">
            In: {new Date(attendance.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {attendance.check_out_time && ` · Out: ${new Date(attendance.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            {attendance.working_hours && ` · ${attendance.working_hours.toFixed(1)}h`}
          </p>
        )}
        {!isCheckedOut && (
          <button
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={checkingIn}
            className={`w-full py-3 rounded-lg text-sm font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
              isCheckedIn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isCheckedIn ? <><LogOut size={16} /> Check Out</> : <><LogIn size={16} /> Check In</>}
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Today's Target", value: stats?.today_target ?? '—', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/office-staff/targets' },
          { label: 'Calls Made Today', value: stats?.today_calls ?? 0, icon: Phone, color: 'text-teal-600', bg: 'bg-teal-50', path: '/office-staff/reports/submit' },
          { label: 'Leads This Month', value: stats?.month_leads ?? 0, icon: FileText, color: 'text-green-600', bg: 'bg-green-50', path: '/office-staff/reports' },
          { label: 'Incentive Earned', value: `₹${(stats?.month_incentive ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50', path: '/office-staff/salary' },
        ].map(({ label, value, icon: Icon, color, bg, path }) => (
          <button key={label} onClick={() => navigate(path)} className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-semibold">{label}</p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/office-staff/reports/submit')} className="py-3 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700">
          Submit Daily Report
        </button>
        <button onClick={() => navigate('/office-staff/leaves')} className="py-3 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50">
          Apply Leave
        </button>
      </div>
    </div>
  );
}
