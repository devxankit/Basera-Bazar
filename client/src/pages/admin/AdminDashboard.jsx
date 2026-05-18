import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, Briefcase, ShoppingBag,
  IndianRupee, TrendingUp, Clock, ArrowUpRight,
  ArrowDownRight, Activity, UserCog, Crown,
  CreditCard, ExternalLink, CheckCircle2, XCircle,
  Eye, Loader2, AlertCircle, MessageSquare, Zap, Home,
  Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';
import { Skeleton } from '../../components/common/Skeleton';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const StatCard = ({ title, value, icon: Icon, color, trend, badge, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`bg-white p-7 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group transition-all ${onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : ''}`}
  >
    <div className="flex flex-col gap-3 min-w-0 grow">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 tracking-tight leading-none mb-2 lg:mb-3 uppercase">{title}</p>
        <h3 className="text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight truncate">{value}</h3>
      </div>

      {/* Dynamic Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {trend ? (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            trend.up ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white'
          }`}>
            {trend.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend.value}%
          </span>
        ) : badge ? (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${badge.color}`}>
            {badge.icon && <badge.icon size={10} />}
            {badge.text}
          </span>
        ) : null}
        <span className="text-[10px] font-bold text-slate-400 capitalize tracking-tight whitespace-nowrap">
          {trend ? 'Since last month' : badge?.subtext || ''}
        </span>
      </div>
    </div>

    {/* Big Icon Background */}
    <div className={`w-16 h-16 rounded-full ${color} shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-opacity-30 ml-4`}>
      <Icon size={24} className="opacity-90" />
    </div>
  </motion.div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  trend: PropTypes.shape({ value: PropTypes.string, isUp: PropTypes.bool }),
  badge: PropTypes.shape({ text: PropTypes.string, color: PropTypes.string, icon: PropTypes.elementType, subtext: PropTypes.string }),
  onClick: PropTypes.func,
};

const QuickActionCard = ({ title, desc, icon: Icon, color, path }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => path && navigate(path)}
      className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-6 group transition-all"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} bg-opacity-20 flex items-center justify-center border border-white shadow-sm transition-transform group-hover:rotate-12`}>
        <Icon size={28} />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-2 leading-relaxed max-w-[200px]">{desc}</p>
      </div>
    </motion.button>
  );
};

QuickActionCard.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  path: PropTypes.string,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chartRange, setChartRange] = useState('Weekly');
  const [isFetchingChart, setIsFetchingChart] = useState(false);

  const { data: rawDashboard, isLoading: loading, error: dashboardError, refetch } = useQuery({
    queryKey: ['adminDashboard', chartRange],
    queryFn: async () => {
      const { getDashboardData, getActivities } = await import('../../services/AdminService');
      const [statsData, activitiesData] = await Promise.all([
        getDashboardData(chartRange.toLowerCase()),
        getActivities(8)
      ]);
      return { statsData, activitiesData };
    },
    staleTime: 5 * 60 * 1000,
  });

  const data = rawDashboard?.statsData || null;
  const activities = rawDashboard?.activitiesData || [];
  const error = dashboardError ? 'Connection to infrastructure interrupted.' : null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/listings/${id}/status`, { status }).then(r => r.data),
    onSuccess: async (_, { id }) => {
      const { refreshAdminCache } = await import('../../services/AdminService');
      refreshAdminCache();
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: () => {
      toast.error("Status update failed.");
    },
  });

  const handleStatusUpdate = (id, status) => {
    statusMutation.mutate({ id, status });
  };

  const handleRangeChange = (range) => {
    setChartRange(range);
  };

  if (error || (!data && !loading)) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">System Desync</h2>
        <p className="text-slate-400 font-semibold uppercase tracking-[0.15em] text-[10px] max-w-[250px] text-center">
          {error || 'Unable to establish secure tunnel to statistics engine.'}
        </p>
        <button onClick={() => refetch()} className="mt-6 px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200">
          Initialize Retry
        </button>
      </div>
    );
  }

  const statsData = [
    {
      title: 'TOTAL USERS',
      value: (data?.users || 0).toLocaleString(),
      icon: Users,
      color: 'bg-slate-100 text-slate-400',
      trend: { value: '57.1%', isUp: false, label: 'Since Last Month' },
      path: '/admin/users'
    },
    {
      title: 'PROPERTIES LISTED',
      value: (data?.properties || 0).toLocaleString(),
      icon: Building2,
      color: 'bg-emerald-100 text-emerald-600',
      trend: { value: '0%', isUp: true, label: 'Since Last Month' },
      path: '/admin/properties'
    },
    {
      title: 'SERVICES LISTED',
      value: (data?.services || 0).toLocaleString(),
      icon: Briefcase,
      color: 'bg-slate-100 text-slate-900',
      badge: { text: 'ACTIVE', color: 'bg-slate-500 text-white', icon: Activity, subtext: 'Total Count' },
      path: '/admin/services'
    },
    {
      title: 'PRODUCTS LISTED',
      value: (data?.products || 0).toLocaleString(),
      icon: ShoppingBag,
      color: 'bg-rose-100 text-rose-600',
      badge: { text: 'MANDI', color: 'bg-rose-500 text-white', icon: ShoppingBag, subtext: 'Live Products' },
      path: '/admin/mandi-bazar/products'
    },
    {
      title: 'TOTAL REVENUE',
      value: `₹${(data?.revenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-orange-100 text-orange-600',
      trend: { value: '100%', isUp: false, label: 'Since Last Month' },
      path: '/admin/reports/payments'
    },
    {
      title: 'Pending Requests',
      value: (data?.pending?.properties?.length || 0),
      icon: Clock,
      color: 'bg-rose-100 text-rose-600',
      badge: { text: 'Attention', color: 'bg-rose-500 text-white', icon: AlertCircle, subtext: 'Require Review' },
      path: '/admin/dashboard/pending/properties'
    },
    {
      title: 'Pending Payouts',
      value: (data?.pending?.withdrawals || 0),
      icon: Landmark,
      color: 'bg-indigo-100 text-indigo-600',
      badge: { text: 'Settlement', color: 'bg-indigo-500 text-white', icon: Landmark, subtext: 'Awaiting Bank' },
      path: '/admin/executives/withdrawals'
    },
    {
      title: 'Recent Activities',
      value: (activities.length || 0).toLocaleString(),
      icon: Activity,
      color: 'bg-slate-100 text-slate-400',
      badge: { text: 'Latest', color: 'bg-cyan-400 text-white', icon: MessageSquare, subtext: 'System activities' },
      path: '/admin/dashboard/activities'
    },
    {
      title: 'User Roles',
      value: '6',
      icon: UserCog,
      color: 'bg-slate-100 text-slate-900',
      badge: { text: 'Active', color: 'bg-cyan-400 text-white', icon: Activity, subtext: 'Role types' },
      path: '/admin/users'
    },
  ];

  const quickActions = [
    { title: 'Manage Users', desc: 'Add, edit, or remove user accounts', icon: UserCog, color: 'bg-slate-100 text-slate-900', path: '/admin/users' },
    { title: 'Manage Suppliers', desc: 'Review and verify supplier profiles', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600', path: '/admin/suppliers' },
    { title: 'Mandi Bazar', desc: 'Manage mandi sellers and products', icon: ShoppingBag, color: 'bg-rose-50 text-rose-600', path: '/admin/mandi-bazar/sellers' },
    { title: 'Properties', desc: 'Review and approve property listings', icon: Building2, color: 'bg-emerald-50 text-emerald-600', path: '/admin/properties' },
    { title: 'Subscription Plans', desc: 'Manage subscription packages', icon: Crown, color: 'bg-orange-50 text-orange-500', path: '/admin/subscriptions/plans' },
    { title: 'User Subscriptions', desc: 'Monitor active subscriptions', icon: CreditCard, color: 'bg-cyan-50 text-cyan-500', path: '/admin/subscriptions' },
  ];

  const registrationData = data?.analytics?.chartData || [];

  const roleColors = {
    'Admin': '#3b82f6',
    'Agent': '#10b981',
    'Customer': '#f59e0b',
    'Service Provider': '#06b6d4',
    'SuperAdmin': '#94a3b8',
    'Supplier': '#6366f1'
  };

  const distributionData = data?.analytics?.distribution?.map(item => ({
    name: item.name,
    value: item.value,
    color: roleColors[item.name] || '#cbd5e1'
  })) || [];

  // Map entity_type → icon for the activity table
  const ACTIVITY_ICON_MAP = {
    user: Users, partner: Users, property: Building2,
    service: Briefcase,
    enquiry: MessageSquare,
    category: MessageSquare, subcategory: MessageSquare,
    banner: Activity, subscription: CreditCard, system: Activity,
    withdrawal: Landmark
  };
  const recentActivities = activities.map(act => ({
    ...act,
    icon: ACTIVITY_ICON_MAP[act.entity_type] || Activity
  }));

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 font-Inter">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">SuperAdmin Dashboard</h1>
        <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm mt-1">
          <span className="cursor-pointer hover:text-indigo-600">Home</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <Skeleton name="admin-stats-grid" loading={loading}>
        <ErrorBoundary fallback={
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-medium">
            Stats unavailable — please refresh.
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat) => (
              <StatCard key={stat.title} {...stat} onClick={() => stat.path && navigate(stat.path)} />
            ))}
          </div>
        </ErrorBoundary>
      </Skeleton>

      {/* Quick Actions Section */}
      <Skeleton name="admin-quick-actions" loading={loading}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-slate-900 fill-slate-900" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, i) => (
              <QuickActionCard key={i} {...action} />
            ))}
          </div>
        </div>
      </Skeleton>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle Loading Overlay for Chart */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center"
              >
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Total User Growth</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {['Weekly', 'Monthly', 'Yearly'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleRangeChange(range)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                    chartRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 flex flex-col items-center justify-center space-y-6">
          <div className="w-full text-left flex items-center gap-4">
             <div className="p-3 bg-slate-50 rounded-2xl">
               <Users size={24} className="text-slate-900" />
             </div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight">User Distribution</h2>
          </div>

          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{data?.users || '0'}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Active</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-auto">
            {distributionData.length > 0 ? distributionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-slate-600 tracking-tight">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value || 0}</span>
              </div>
            )) : (
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <Skeleton name="admin-recent-activities" loading={loading}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className="text-orange-500" size={20} />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Activities</h2>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard/activities')}
              className="px-5 py-2.5 rounded-lg border border-orange-200 text-orange-500 text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                  <th className="px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                  <th className="px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <Activity size={32} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activities yet — start adding data</p>
                    </td>
                  </tr>
                ) : (
                recentActivities.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <act.icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700 tracking-tight">{act.description || act.activity}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <span className="px-3 py-1 rounded-md bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest">
                        {act.entity_type || act.type}
                      </span>
                    </td>
                    <td className="px-10 py-5">
                      <span className="text-[12px] font-bold text-slate-500">
                         {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        act.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'
                      }`}>
                        {act.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Skeleton>

      {/* Pending Approvals Section */}
      <Skeleton name="admin-pending-approvals" loading={loading}>
        <div className="grid grid-cols-1 gap-8">
          {/* Pending Property Approvals */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Home className="text-slate-900" size={20} />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Property Approvals</h2>
              </div>
                <button
                  onClick={() => navigate('/admin/dashboard/pending/properties')}
                  className="px-5 py-2.5 rounded-lg border border-orange-200 text-orange-500 text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors"
                >
                  View All
                </button>
            </div>
            <div className="p-0">
              {data?.pending?.properties?.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Property</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Submitted</th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.pending.properties.map((prop, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                {prop.images?.[0] ? <img src={prop.images[0]} className="w-full h-full object-cover" /> : <Building2 size={18} className="text-slate-300" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-700 tracking-tight truncate">{prop.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{prop.property_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[11px] font-bold text-slate-500 truncate">{prop.partner_id?.name || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                               <button
                                 onClick={() => navigate(`/admin/properties/view/${prop._id}`)}
                                 className="p-2 rounded-full border border-orange-100 text-orange-500 hover:bg-orange-50 transition-colors"
                               >
                                 <Eye size={15} />
                               </button>
                               <button
                                 onClick={() => handleStatusUpdate(prop._id, 'active')}
                                 disabled={statusMutation.isPending}
                                 className="p-2 rounded-full border border-emerald-100 text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                               >
                                 <CheckCircle2 size={15} />
                               </button>
                               <button
                                 onClick={() => handleStatusUpdate(prop._id, 'rejected')}
                                 disabled={statusMutation.isPending}
                                 className="p-2 rounded-full border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                               >
                                 <XCircle size={15} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <CheckCircle2 size={48} className="text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No pending properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Skeleton>
    </div>
  );
}
