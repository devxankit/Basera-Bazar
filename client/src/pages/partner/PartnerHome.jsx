import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Star,
  Users,
  Mail,
  PlusCircle,
  MessageSquare,
  ChevronRight,
  History,
  TrendingUp,
  AlertCircle,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/baseralogo.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;
  const partner = user;
  const actualRole = (partner?.partner_type || partner?.role || '').toLowerCase();

  const getRoleLabel = () => {
    if (actualRole.includes('agent')) return 'Agent';
    if (actualRole.includes('service')) return 'Service Provider';
    if (actualRole.includes('supplier')) return 'Supplier';
    if (actualRole.includes('mandi')) return 'Mandi Seller';
    return partner.partner_type || partner.role || 'Partner';
  };

  const getCategoryTheme = () => {
    if (actualRole.includes('agent')) return 'Properties';
    if (actualRole.includes('service')) return 'Services';
    if (actualRole.includes('supplier')) return 'Products';
    if (actualRole.includes('mandi')) return 'Mandi Marketplace';
    return 'Items';
  };

  const overviewStats = [
    { label: 'Total', value: '0', icon: <Building2 size={24} />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Active', value: '0', icon: <CheckCircle2 size={24} />, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Pending', value: '0', icon: <Clock size={24} />, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Featured', value: '0', icon: <Star size={24} />, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Total Leads', value: '0', icon: <Users size={24} />, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { label: 'Unread', value: '0', icon: <Mail size={24} />, color: 'text-red-500', bgColor: 'bg-red-50' },
  ];

  const getAddActionLabel = () => {
    if (actualRole.includes('agent')) return 'Property';
    if (actualRole.includes('service')) return 'Service';
    return 'Product';
  };

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = () => {
      const logs = localStorage.getItem(`baserabazar_activity_${partner._id || partner.id}`);
      if (logs) {
        try {
          const parsed = JSON.parse(logs);
          setRecentActivities(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
        } catch (e) {
          setRecentActivities([]);
        }
      }
    };
    fetchActivities();

    // Listen for custom events if we dispatch them
    window.addEventListener('baserabazar_activity_updated', fetchActivities);
    return () => window.removeEventListener('baserabazar_activity_updated', fetchActivities);
  }, [partner]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'listing': return <Package className="text-blue-500" size={18} />;
      case 'profile': return <Users className="text-purple-500" size={18} />;
      case 'subscription': return <AlertCircle className="text-orange-500" size={18} />;
      case 'inquiry': return <MessageSquare className="text-green-500" size={18} />;
      default: return <History className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] pt-12 pb-24 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-white/60 text-[14px]">Good Afternoon</div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-[22px] font-medium">{partner.name}</h1>
                <span className="bg-white/10 px-3 py-1 rounded-full text-white/80 text-[11px] font-medium uppercase tracking-wider backdrop-blur-sm border border-white/10">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-20 space-y-8">
        {/* Subscription Card */}
        <motion.div
          onClick={() => navigate('/partner/subscription')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner">
              <CheckCircle2 size={30} fill="currentColor" className="text-white" />
              <CheckCircle2 size={32} className="absolute opacity-100" />
            </div>
            <div>
              <h3 className="text-[19px] font-medium text-[#001b4e]">{partner.plan === 'free' ? 'Free Trail' : 'Pre-launching offer'}</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[13px] font-medium">
                  <Clock size={14} className="text-green-500" />
                  29 days left
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-1.5 text-slate-400 text-[13px] font-medium">
                  <PlusCircle size={14} className="text-blue-500" />
                  1 available
                </div>
              </div>
            </div>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-[#001b4e] group-hover:translate-x-1 transition-all" size={24} />
        </motion.div>

        {/* Overview Section */}
        {actualRole.includes('mandi') ? (
          <MandiOverview stats={overviewStats} partner={partner} />
        ) : (
          <div className="space-y-5">
            <h2 className="text-[20px] font-medium text-[#001b4e] px-1">{getCategoryTheme()} Overview</h2>
            <div className="grid grid-cols-3 gap-5">
              {overviewStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex flex-col items-center text-center group active:scale-95 transition-all"
                >
                  <div className={`w-12 h-12 ${stat.bgColor} ${stat.color} rounded-full flex items-center justify-center mb-3 shadow-inner`}>
                    {stat.icon}
                  </div>
                  <div className="text-[20px] font-medium text-[#001b4e] mb-0.5">{stat.value}</div>
                  <div className="text-[12px] font-medium text-slate-400 uppercase tracking-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-5">
          <h2 className="text-[20px] font-medium text-[#001b4e] px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => {
                if (actualRole.includes('agent')) navigate('/partner/add-property');
                else if (actualRole.includes('supplier')) navigate('/partner/add-product');
                else if (actualRole.includes('mandi')) navigate('/partner/mandi/add-product');
                else navigate('/partner/add-service');
              }}
              className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-start text-left group active:scale-95 transition-all w-full"
            >
              <div className="w-12 h-12 bg-indigo-50 text-[#001b4e] rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <PlusCircle size={24} />
              </div>
              <h4 className="text-[17px] font-medium text-[#001b4e] mb-1">Add {getAddActionLabel()}</h4>
              <p className="text-[13px] font-normal text-slate-400 leading-snug">Create new listing</p>
            </button>
            <button
              onClick={() => navigate('/partner/leads')}
              className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-start text-left group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <Mail size={24} />
              </div>
              <h4 className="text-[17px] font-medium text-[#001b4e] mb-1">Inquiries</h4>
              <p className="text-[13px] font-normal text-slate-400 leading-snug">View messages</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-5 pb-10">
          <h2 className="text-[20px] font-medium text-[#001b4e] px-1 flex items-center gap-2">
            <History size={20} className="text-[#001b4e]" />
            Recent Activity
          </h2>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 space-y-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div key={idx} className={`flex items-start gap-4 ${idx !== recentActivities.length - 1 ? 'border-b border-slate-50 pb-5' : ''}`}>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="text-[14px] font-medium text-[#001b4e] leading-snug">{activity.title}</div>
                    <div className="text-[12px] font-normal text-slate-400 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-10 text-slate-300">
                <History size={48} className="mb-4 opacity-10" />
                <span className="text-[15px] font-bold">No recent activity</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function MandiOverview({ partner }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/mandi/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const mandiStats = [
    { label: 'Active Products', value: stats?.active_products || '0', icon: <Package size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-50', path: '/partner/mandi/inventory' },
    { label: 'Total Orders', value: stats?.total_orders || '0', icon: <TrendingUp size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-50', path: '/partner/mandi/orders' },
    { label: 'Penalty Due', value: `₹${stats?.penalty_due || 0}`, icon: <AlertCircle size={20} />, color: 'text-rose-600', bgColor: 'bg-rose-50', path: '/partner/mandi/penalties' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-[#001b4e] p-6 rounded-[32px] text-white shadow-xl shadow-indigo-900/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Mandi Seller Account</p>
              <h2 className="text-[28px] font-bold">Penalty Score: ₹{stats?.penalty_due || 0}</h2>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <AlertCircle className={stats?.penalty_due > 0 ? "text-rose-400" : "text-green-400"} size={24} />
            </div>
          </div>
          <p className="text-white/40 text-[11px] leading-tight">
            Penalties are applied if you cancel an active lead. High penalty scores may lead to account suspension.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mandiStats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center text-center active:scale-95 transition-all"
          >
            <div className={`w-10 h-10 ${stat.bgColor} ${stat.color} rounded-full flex items-center justify-center mb-2`}>
              {stat.icon}
            </div>
            <div className="text-[16px] font-bold text-[#001b4e]">{stat.value}</div>
            <div className="text-[10px] font-medium text-slate-400 uppercase leading-tight">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Mandi Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-[#001b4e] px-1">Marketplace Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => navigate('/partner/mandi/add-product')} className="bg-[#001b4e] p-5 rounded-3xl text-white flex flex-col items-center gap-2 shadow-lg shadow-indigo-900/10 active:scale-95 transition-all">
            <PlusCircle size={24} />
            <span className="text-[14px] font-bold">List Material</span>
          </button>
          <button onClick={() => navigate('/partner/mandi/inventory')} className="bg-white p-5 rounded-3xl border border-slate-100 text-[#001b4e] flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all">
            <Package size={24} />
            <span className="text-[14px] font-bold">Manage Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
