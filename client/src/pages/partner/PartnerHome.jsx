import React, { useState, useEffect } from 'react';
import toast from '../../mockToast';
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
  ShoppingBag,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/baseralogo.png';

export default function PartnerHome() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Payment result is shown on /payment/status before landing here.
  // We read a sessionStorage flag set by PaymentStatusPage to refresh user subscription data.
  useEffect(() => {
    const subSuccess = sessionStorage.getItem('bb_subscription_payment_success');
    if (subSuccess === '1') {
      sessionStorage.removeItem('bb_subscription_payment_success');
      refreshUser();
    } else if (user) {
      // Always refresh once on mount to keep subscription status current
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ['partnerStats'],
    queryFn: () => api.get('/partners/stats').then(r => r.data),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });

  const { data: activitiesRaw, isLoading: activitiesLoading } = useQuery({
    queryKey: ['partnerActivities'],
    queryFn: () => api.get('/partners/activities').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // SUBSCRIPTION_FLAGGED
  // const { data: limitsRaw, isLoading: limitsLoading } = useQuery({
  //   queryKey: ['partnerSubscriptionLimits'],
  //   queryFn: () => api.get('/partners/subscription/limits').then(r => r.data),
  //   staleTime: 5 * 60 * 1000,
  //   enabled: !!user,
  // });

  const { data: notificationsRaw } = useQuery({
    queryKey: ['partnerNotificationsUnread'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 60 * 1000,
    enabled: !!user,
  });
  const unreadCount = notificationsRaw?.success
    ? (notificationsRaw.data || []).filter(n => !n.is_read).length
    : 0;

  // SUBSCRIPTION_FLAGGED
  const loading = statsLoading || activitiesLoading; // originally statsLoading || activitiesLoading || limitsLoading;

  const stats = statsRaw?.success ? statsRaw.data : { total_listings: 0, total_leads: 0, active_orders: 0, earnings: 0 };
  const localLogs = !activitiesRaw?.success
    ? (JSON.parse(localStorage.getItem(`baserabazar_activity_${user?._id || user?.id}`)) || [])
    : [];
  const activities = activitiesRaw?.success ? (activitiesRaw.data || []).slice(0, 5) : localLogs.slice(0, 5);
  // SUBSCRIPTION_FLAGGED
  const subscriptionLimits = null; // originally limitsRaw?.success ? limitsRaw.data : null;

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  // Call refreshUser on mount to sync onboarding_status
  useEffect(() => {
    if (user) refreshUser();
  }, []);

  // Polling for status updates if not approved
  useEffect(() => {
    if (!user || user.onboarding_status === 'approved') return;
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.onboarding_status]);

  if (!user) return null;

  const partner = user;
  const role = (partner?.active_role || partner?.partner_type || partner?.role || 'Partner').toLowerCase();

  const getDashboardConfig = () => {
    if (role.includes('mandi')) {
      return {
        title: 'Mandi Dashboard',
        primaryIcon: <Package className="text-orange-500" />,
        stats: [
          { label: 'Total Products', value: stats.total_listings, icon: <Package size={20} />, color: 'bg-orange-50 text-orange-600', href: '/partner/inventory' },
          { label: 'New Orders', value: stats.active_orders, icon: <Activity size={20} />, color: 'bg-blue-50 text-blue-600', href: '/partner/orders' },
          { label: 'Total Leads', value: stats.total_leads, icon: <Users size={20} />, color: 'bg-emerald-50 text-emerald-600', href: '/partner/leads' },
          // SUBSCRIPTION_FLAGGED: originally href: '/partner/subscription'
          { label: 'Earnings', value: `₹${stats.earnings}`, icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-600', href: '/partner/leads' }
        ]
      };
    }
    return {
      title: 'Partner Dashboard',
      primaryIcon: <LayoutGrid className="text-blue-500" />,
      stats: [
        { label: 'My Listings', value: stats.total_listings, icon: <Building2 size={20} />, color: 'bg-blue-50 text-blue-600', href: '/partner/inventory' },
        { label: 'Total Leads', value: stats.total_leads, icon: <Users size={20} />, color: 'bg-orange-50 text-orange-600', href: '/partner/leads' },
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
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button onClick={() => navigate('/partner/profile')} className="p-1 bg-slate-100 rounded-full">
            <div className="w-8 h-8 bg-[#001b4e] rounded-full flex items-center justify-center text-white text-[12px] font-bold">
              {partner.name?.charAt(0)}
            </div>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {user.onboarding_status === 'rejected' && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 shadow-sm mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="bg-rose-100 p-2 rounded-xl text-rose-600 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-rose-700 font-bold text-[16px] mb-1">Account Action Required</h3>
                <p className="text-rose-600 text-[13px] font-medium leading-relaxed mb-3">
                  Your KYC verification was rejected: {user.kyc?.rejection_reason || 'Please provide clearer documents'}. You must resubmit your documents to list products.
                </p>
                <button 
                  onClick={() => navigate('/partner/onboarding')}
                  className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-rose-200 active:scale-95 transition-all w-full"
                >
                  Resubmit KYC Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Hello, {partner.name?.split(' ')[0]} 👋</h2>
              <p className="text-slate-500 text-[15px] mt-1 font-medium">Here's what's happening with your account.</p>
            </div>
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full flex items-center gap-2 shadow-sm">
              <div className={`w-2 h-2 rounded-full animate-pulse ${user.onboarding_status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{role.split('_')[0]} Mode</span>
            </div>
          </div>

          {/* SUBSCRIPTION_FLAGGED
          {subscriptionLimits && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate('/partner/subscription')}
              className="mt-6 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm shadow-blue-900/5 relative overflow-hidden group active:scale-95 transition-all cursor-pointer"
            >
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <ShieldCheck size={80} />
               </div>
               
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                     <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Zap size={16} fill="currentColor" />
                     </div>
                     <span className="text-[12px] font-black text-[#001b4e] uppercase tracking-widest truncate">{subscriptionLimits.planName || 'Active Plan'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase tracking-widest shrink-0 ml-2">
                     Upgrade <ArrowUpRight size={12} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>Listings</span>
                        <span className={subscriptionLimits.usage.is_listing_limit_reached ? 'text-rose-500' : 'text-slate-900'}>
                           {subscriptionLimits.usage.listings_created}/{subscriptionLimits.usage.listings_limit === -1 ? '∞' : subscriptionLimits.usage.listings_limit}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (subscriptionLimits.usage.listings_created / (subscriptionLimits.usage.listings_limit === -1 ? 100 : subscriptionLimits.usage.listings_limit)) * 100)}%` }}
                          className={`h-full rounded-full ${subscriptionLimits.usage.is_listing_limit_reached ? 'bg-rose-500' : 'bg-blue-600'}`}
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>Leads</span>
                        <span className={subscriptionLimits.usage.is_lead_limit_reached ? 'text-rose-500' : 'text-slate-900'}>
                           {subscriptionLimits.usage.enquiries_received_this_month}/{subscriptionLimits.usage.enquiries_received_limit === -1 ? '∞' : subscriptionLimits.usage.enquiries_received_limit}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (subscriptionLimits.usage.enquiries_received_this_month / (subscriptionLimits.usage.enquiries_received_limit === -1 ? 100 : subscriptionLimits.usage.enquiries_received_limit)) * 100)}%` }}
                          className={`h-full rounded-full ${subscriptionLimits.usage.is_lead_limit_reached ? 'bg-rose-500' : 'bg-orange-500'}`}
                        />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
          */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {config.stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={stat.href ? () => navigate(stat.href) : undefined}
              className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm ${stat.href ? 'cursor-pointer active:scale-95 transition-all hover:border-slate-200 hover:shadow-md' : ''}`}
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
              disabled={user.onboarding_status !== 'approved'}
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
            {role.includes('mandi') && (
              <ActionCard
                title="View Orders"
                icon={<ShoppingBag size={24} />}
                color="bg-slate-600"
                onClick={() => navigate('/partner/orders')}
              />
            )}
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
                <div
                  key={idx}
                  onClick={() => {
                    if (act.type === 'order' && act.id) navigate(`/partner/orders/${act.id}`);
                    else if (act.type === 'listing' && act.id) navigate(`/partner/add-product?edit=${act.id}`);
                    else navigate('/partner/notifications');
                  }}
                  className={`p-4 flex items-center gap-4 cursor-pointer active:bg-slate-50 transition-colors ${idx !== activities.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
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
                  <ArrowUpRight size={16} className="text-blue-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, icon, color, onClick, disabled }) {
  return (
    <button 
      onClick={disabled ? () => toast.error("Verification Required: Please wait for Admin approval to list products.") : onClick}
      className={`${disabled ? 'bg-slate-400 cursor-not-allowed opacity-80' : color} p-5 rounded-2xl text-white flex flex-col items-start gap-4 active:scale-95 transition-all shadow-lg text-left w-full`}
    >
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="text-[15px] font-bold leading-tight pr-4">{title}</div>
    </button>
  );
}
