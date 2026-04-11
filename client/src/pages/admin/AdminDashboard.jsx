import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, Briefcase, ShoppingBag, 
  IndianRupee, TrendingUp, Clock, ArrowUpRight, 
  ArrowDownRight, Activity, UserCog, Crown, 
  CreditCard, ExternalLink, CheckCircle2, XCircle, 
  Eye, Loader2, AlertCircle, MessageSquare, Zap, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-200 transition-all"
  >
    <div className="flex flex-col gap-3 min-w-0 flex-grow">
      <div>
        <p className="text-[11px] font-bold text-slate-400 tracking-tight leading-none mb-2 lg:mb-3 uppercase">{title}</p>
        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
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
    <div className={`w-16 h-16 rounded-full ${color} flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-opacity-30 ml-4`}>
      <Icon size={24} className="opacity-90" />
    </div>
  </motion.div>
);

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
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <p className="text-[13px] font-medium text-slate-400 mt-2 leading-relaxed max-w-[200px]">{desc}</p>
      </div>
    </motion.button>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingChart, setIsFetchingChart] = useState(false);
  const [error, setError] = useState(null);
  const [chartRange, setChartRange] = useState('Weekly');

  const fetchDashboardData = async (range = chartRange, silent = false) => {
    if (silent) setIsFetchingChart(true);
    else setLoading(true);
    
    setError(null);
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get(`/admin/dashboard/stats?range=${range.toLowerCase()}`),
        api.get('/admin/dashboard/activities?limit=8')
      ]);
      if (statsRes.data.success) setData(statsRes.data.data);
      else setError('Failed to fetch platform metrics.');
      if (activitiesRes.data.success) setActivities(activitiesRes.data.data || []);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError('Connection to infrastructure interrupted.');
    } finally {
      setLoading(false);
      setIsFetchingChart(false);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusUpdate = async (id, status) => {
    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/listings/${id}/status`, { status });
      if (res.data.success) {
        // Success feedback and update local state
        setData(prev => ({
          ...prev,
          pending: {
            ...prev.pending,
            properties: prev.pending.properties.filter(p => p._id !== id)
          }
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Status update failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="text-rose-500" size={48} />
        <h2 className="text-xl font-black text-slate-900 tracking-tight">System Desync</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] max-w-[250px] text-center">
          {error || 'Unable to establish secure tunnel to statistics engine.'}
        </p>
        <button onClick={fetchDashboardData} className="mt-6 px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200">
          Initialize Retry
        </button>
      </div>
    );
  }

  const statCardsData = [
    { 
      title: 'Total Users', 
      value: data.users || '0', 
      icon: Users, 
      color: 'bg-slate-100 text-slate-900', 
      trend: { value: '57.1', up: false } 
    },
    { 
      title: 'Properties Listed', 
      value: data.properties || '0', 
      icon: Building2, 
      color: 'bg-emerald-100 text-emerald-600', 
      badge: { text: '0%', color: 'bg-slate-500 text-white', subtext: 'Since last month' } 
    },
    { 
      title: 'Products Listed', 
      value: data.products || '0', 
      icon: ShoppingBag, 
      color: 'bg-cyan-100 text-cyan-600', 
      badge: { text: 'Active', color: 'bg-slate-500 text-white', icon: Activity, subtext: 'Total count' } 
    },
    { 
      title: 'Services Listed', 
      value: data.services || '0', 
      icon: Briefcase, 
      color: 'bg-slate-100 text-slate-900', 
      badge: { text: 'Active', color: 'bg-slate-500 text-white', icon: Activity, subtext: 'Total count' } 
    },
    { 
      title: 'Total Revenue', 
      value: `₹${(data.revenue || 0).toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'bg-orange-100 text-orange-600', 
      trend: { value: '100', up: false } 
    },
    { 
      title: 'Pending Requests', 
      value: data.pending?.properties?.length || '0', 
      icon: Clock, 
      color: 'bg-rose-100 text-rose-600', 
      trend: { value: '100', up: true } 
    },
    { 
      title: 'Recent Activities', 
      value: '7', 
      icon: Activity, 
      color: 'bg-slate-100 text-slate-400', 
      badge: { text: 'Latest', color: 'bg-cyan-400 text-white', icon: MessageSquare, subtext: 'System activities' } 
    },
    { 
      title: 'User Roles', 
      value: '6', 
      icon: UserCog, 
      color: 'bg-slate-100 text-slate-900', 
      badge: { text: 'Active', color: 'bg-cyan-400 text-white', icon: Activity, subtext: 'Role types' } 
    },
  ];

  const quickActions = [
    { title: 'Manage Users', desc: 'Add, edit, or remove user accounts', icon: UserCog, color: 'bg-slate-100 text-slate-900', path: '/admin/users' },
    { title: 'Manage Properties', desc: 'Review and approve property listings', icon: Building2, color: 'bg-emerald-50 text-emerald-600', path: '/admin/properties' },
    { title: 'Subscription Plans', desc: 'Manage subscription packages', icon: Crown, color: 'bg-orange-50 text-orange-500', path: '/admin/subscriptions/plans' },
    { title: 'User Subscriptions', desc: 'Monitor active subscriptions', icon: CreditCard, color: 'bg-cyan-50 text-cyan-500', path: '/admin/subscriptions' },
  ];  const registrationData = data.analytics?.chartData || [];
  
  const roleColors = {
    'Admin': '#3b82f6',
    'Agent': '#10b981',
    'Customer': '#f59e0b',
    'Service Provider': '#06b6d4',
    'SuperAdmin': '#94a3b8',
    'Supplier': '#6366f1'
  };

  const distributionData = data.analytics?.distribution?.map(item => ({
    name: item.name,
    value: item.value,
    color: roleColors[item.name] || '#cbd5e1'
  })) || [];

  const handleRangeChange = (range) => {
    setChartRange(range);
    fetchDashboardData(range, true); // Silent update for the chart
  };
   
  // Map entity_type → icon for the activity table
  const ACTIVITY_ICON_MAP = {
    user: Users, partner: Users, property: Building2,
    service: Briefcase, supplier: ShoppingBag, product: ShoppingBag,
    category: MessageSquare, subcategory: MessageSquare,
    banner: Activity, subscription: CreditCard, system: Activity
  };
  const recentActivities = activities.map(act => ({
    ...act,
    icon: ACTIVITY_ICON_MAP[act.entity_type] || Activity
  }));

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 font-Inter">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight">SuperAdmin Dashboard</h1>
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mt-1">
          <span className="cursor-pointer hover:text-indigo-600">Home</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCardsData.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions Section */}
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

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle Loading Overlay for Chart */}
          <AnimatePresence>
            {isFetchingChart && (
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
              <span className="text-3xl font-black text-slate-900 tracking-tight">{data.users || '0'}</span>
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
                          {new Date(act.createdAt).toLocaleDateString()}
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
                       {new Date(act.createdAt).toLocaleString()}
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

      {/* Pending Approvals Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
            {data.pending?.properties?.length > 0 ? (
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
                          {new Date(prop.createdAt).toLocaleDateString()}
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
                               disabled={isProcessing}
                               className="p-2 rounded-full border border-emerald-100 text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                             >
                               <CheckCircle2 size={15} />
                             </button>
                             <button 
                               onClick={() => handleStatusUpdate(prop._id, 'rejected')}
                               disabled={isProcessing}
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

        {/* Pending Product/Service Approvals */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingBag className="text-slate-900" size={20} />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Pending Product/Service Approvals</h2>
            </div>
            <div className="relative group/btn">
              <button 
                onClick={() => navigate('/admin/dashboard/pending/others')}
                className="px-5 py-2.5 rounded-lg border border-orange-200 text-orange-500 text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                View All <ArrowDownRight size={14} />
              </button>
            </div>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center py-20 px-10 text-center">
             {data.pending?.others?.length > 0 ? (
                <table className="w-full text-left">
                  {/* ... similar table structure if data exists ... */}
                </table>
             ) : (
               <div className="flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                   <Activity size={32} className="text-slate-300" />
                 </div>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No pending product or service approvals.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
