import React, { useEffect, useState } from 'react';
import { Users, ClipboardCheck, Calendar, FileText, IndianRupee, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from '../../mockToast';

export default function TeamLeaderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/team-leader/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  const statCards = [
    { label: 'Field Executives', value: stats?.fe_count ?? 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', path: '/team-leader/team/executives' },
    { label: 'Office Staff', value: stats?.os_count ?? 0, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', path: '/team-leader/team/office-staff' },
    { label: 'Today Present', value: stats?.today_present ?? 0, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', path: '/team-leader/attendance' },
    { label: 'Pending Leaves', value: stats?.pending_leaves ?? 0, icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50', path: '/team-leader/leaves' },
    { label: 'Unverified Reports', value: stats?.pending_reports ?? 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/team-leader/reports' },
    { label: 'Active Targets', value: stats?.performance?.target_value ?? 0, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', path: '/team-leader/targets' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {stats?.name || 'Team Leader'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:shadow-sm transition-shadow"
          >
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-semibold">{label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">This Month — Salary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Fixed Salary</span>
            <span className="font-bold text-slate-900">₹{(stats?.salary?.base_salary || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Team Commission</span>
            <span className="font-bold text-green-600">₹{(stats?.salary?.team_commission_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-100 pt-2 mt-2">
            <span className="font-bold text-slate-700">Estimated Net Pay</span>
            <span className="font-black text-indigo-600">₹{(stats?.salary?.effective_salary || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {(stats?.performance?.achievement_rate !== undefined) && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">My Performance This Month</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${stats.performance.achievement_rate >= 0.7 ? 'bg-green-500' : stats.performance.achievement_rate >= 0.5 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.round((stats.performance.achievement_rate || 0) * 100), 100)}%` }}
              />
            </div>
            <span className="font-black text-slate-800 text-sm">{Math.round((stats.performance.achievement_rate || 0) * 100)}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">vs. assigned target</p>
        </div>
      )}
    </div>
  );
}
