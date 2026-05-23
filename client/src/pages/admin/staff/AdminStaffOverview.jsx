import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users2, UserCheck, Headphones, MapPin, CalendarClock, FileText, UserPlus, Target, IndianRupee, BarChart3, ClipboardCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{loading ? '—' : value}</p>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

const QuickAction = ({ label, icon: Icon, path, color }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all text-left w-full"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </button>
  );
};

export default function AdminStaffOverview() {
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['admin-staff-stats'],
    queryFn: () => api.get('/admin/staff/stats').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const stats = rawData?.data || null;

  const statCards = [
    { label: 'Team Leaders', value: stats?.team_leaders ?? 0, icon: Users2, color: 'bg-indigo-500' },
    { label: 'Field Executives', value: stats?.field_executives ?? 0, icon: MapPin, color: 'bg-orange-500' },
    { label: 'Office Staff', value: stats?.office_staff ?? 0, icon: Headphones, color: 'bg-teal-500' },
    { label: 'Present Today', value: stats?.today_present ?? 0, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Pending Leaves', value: stats?.pending_leaves ?? 0, icon: CalendarClock, color: 'bg-amber-500' },
    { label: 'Reports Today', value: stats?.pending_reports ?? 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Pending Payouts', value: stats?.pending_payouts ?? 0, icon: IndianRupee, color: 'bg-rose-500' },
    { label: 'Pending Attendance', value: stats?.pending_attendance ?? 0, icon: ClipboardCheck, color: 'bg-violet-500' },
  ];

  const quickActions = [
    { label: 'Add Team Leader', icon: UserPlus, path: '/admin/staff/team-leaders/add', color: 'bg-indigo-500' },
    { label: 'Add Office Staff', icon: UserPlus, path: '/admin/staff/office-staff/add', color: 'bg-teal-500' },
    { label: 'Assign Target', icon: Target, path: '/admin/staff/targets', color: 'bg-orange-500' },
    { label: 'Process Salary', icon: IndianRupee, path: '/admin/staff/salary', color: 'bg-green-500' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900">Staff Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of all staff across Team Leaders, Field Executives, and Office Staff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* Navigation cards */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Manage</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: 'Team Leaders', desc: 'Manage State Heads and their commission', path: '/admin/staff/team-leaders', icon: Users2, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Office Staff', desc: 'Manage calling and indoor staff', path: '/admin/staff/office-staff', icon: Headphones, color: 'text-teal-600 bg-teal-50' },
          { label: 'Field Executives', desc: 'Manage field team and tracking', path: '/admin/executives', icon: MapPin, color: 'text-orange-600 bg-orange-50' },
          { label: 'Attendance Monitor', desc: `${stats?.pending_attendance ?? 0} verifications pending`, path: '/admin/staff/attendance', icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Leave Approval', desc: `${stats?.pending_leaves ?? 0} requests pending`, path: '/admin/staff/leaves', icon: CalendarClock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Payout Requests', desc: `${stats?.pending_payouts ?? 0} payouts pending`, path: '/admin/executives/withdrawals', icon: IndianRupee, color: 'text-rose-600 bg-rose-50' },
          { label: 'Performance & Salary', desc: 'View monthly performance and process salary', path: '/admin/staff/performance', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
          { label: 'Leaderboard', desc: 'Top performers this month', path: '/admin/staff/leaderboard', icon: Target, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, desc, path, icon: Icon, color }) => (
          <a
            key={path}
            href={path}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
