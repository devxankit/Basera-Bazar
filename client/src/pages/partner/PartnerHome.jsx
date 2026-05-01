import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  Package, 
  Users, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  Bell, 
  LayoutGrid,
  Activity,
  ArrowUpRight,
  Clock,
  Zap,
  Star,
  Settings,
  UserCircle,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/baseralogo.png';

export default function PartnerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_listings: 0,
    total_leads: 0,
    active_orders: 0,
    earnings: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, activityRes] = await Promise.all([
          api.get('/partners/stats'),
          api.get('/partners/activities')
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (activityRes.data.success) setActivities(activityRes.data.data.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        // Fallback to local activities if API fails
        const localLogs = JSON.parse(localStorage.getItem(`baserabazar_activity_${user?._id || user?.id}`)) || [];
        setActivities(localLogs.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  if (!user) return null;

  const partner = user;
  const role = (partner?.active_role || partner?.partner_type || partner?.role || 'Partner').toLowerCase();

  const getDashboardConfig = () => {
    if (role.includes('mandi')) {
      return {
        title: 'Mandi Dashboard',
        primaryIcon: <Package className="text-orange-500" />,
        stats: [
          { label: 'Total Products', value: stats.total_listings, icon: <Package size={20} />, color: 'bg-orange-50 text-orange-600' },
          { label: 'New Orders', value: stats.active_orders, icon: <Activity size={20} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Leads', value: stats.total_leads, icon: <Users size={20} />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Earnings', value: `₹${stats.earnings}`, icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-600' }
        ]
      };
    }
    return {
      title: 'Partner Dashboard',
      primaryIcon: <LayoutGrid className="text-blue-500" />,
      stats: [
        { label: 'My Listings', value: stats.total_listings, icon: <Building2 size={20} />, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Leads', value: stats.total_leads, icon: <Users size={20} />, color: 'bg-orange-50 text-orange-600' },
        { label: 'Active Tasks', value: 0, icon: <Zap size={20} />, color: 'bg-amber-50 text-amber-600' },
        { label: 'Performance', value: '100%', icon: <Star size={20} />, color: 'bg-emerald-50 text-emerald-600' }
      ]
    };
  };

  const config = getDashboardConfig();

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Top Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Basera Bazar" className="h-8 w-auto" />
          <div className="w-[1px] h-4 bg-slate-200" />
          <h1 className="text-[#001b4e] font-bold text-[16px] uppercase tracking-wider">{config.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/partner/notifications')} className="relative p-2 bg-slate-50 rounded-xl text-slate-500 active:scale-95 transition-all">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
          </button>
          <button onClick={() => navigate('/partner/profile')} className="p-1 bg-slate-100 rounded-full">
            <div className="w-8 h-8 bg-[#001b4e] rounded-full flex items-center justify-center text-white text-[12px] font-bold">
              {partner.name?.charAt(0)}
            </div>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Hello, {partner.name?.split(' ')[0]} 👋</h2>
            <p className="text-slate-500 text-[15px] mt-1 font-medium">Here's what's happening with your account.</p>
          </div>
          <div className="px-3 py-1 bg-white border border-slate-200 rounded-full flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{role.split('_')[0]} Mode</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {config.stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <div className="text-[24px] font-bold text-[#001b4e] leading-none mb-1">{stat.value}</div>
              <div className="text-slate-400 text-[12px] font-bold uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[#001b4e] font-bold text-[16px] uppercase tracking-tight">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ActionCard 
              title="Add New Listing" 
              icon={<Plus size={24} />} 
              color="bg-[#001b4e]" 
              onClick={() => navigate('/partner/add-product')}
            />
            <ActionCard 
              title="View Inventory" 
              icon={<Package size={24} />} 
              color="bg-orange-500" 
              onClick={() => navigate('/partner/inventory')}
            />
            <ActionCard 
              title="Sales & Leads" 
              icon={<TrendingUp size={24} />} 
              color="bg-indigo-600" 
              onClick={() => navigate('/partner/leads')}
            />
            <ActionCard 
              title="View Orders" 
              icon={<ShoppingBag size={24} />} 
              color="bg-slate-600" 
              onClick={() => navigate('/partner/orders')}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[#001b4e] font-bold text-[16px] uppercase tracking-tight">Recent Activity</h3>
            <button onClick={() => navigate('/partner/notifications')} className="text-blue-600 text-[12px] font-bold uppercase tracking-wider hover:underline">View All</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-[14px]">No recent activity found.</p>
              </div>
            ) : (
              activities.map((act, idx) => (
                <div key={idx} className={`p-4 flex items-center gap-4 ${idx !== activities.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    act.type === 'listing' ? 'bg-blue-50 text-blue-600' : 
                    act.type === 'order' ? 'bg-orange-50 text-orange-600' : 
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {act.type === 'listing' ? <Package size={20} /> : <Activity size={20} />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-[14px] font-bold text-[#001b4e] truncate leading-tight">{act.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-medium">{act.time}</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{act.type}</span>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, icon, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`${color} p-5 rounded-2xl text-white flex flex-col items-start gap-4 active:scale-95 transition-all shadow-lg text-left w-full`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="text-[15px] font-bold leading-tight pr-4">{title}</div>
    </button>
  );
}
