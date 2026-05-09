import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Wallet, Users, ChevronRight, Copy, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Send, TrendingUp, 
  UserCheck, CreditCard, Sparkles, Share2, ArrowUpRight,
  ShieldCheck, PartyPopper, Lock, Zap, ArrowRight, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 }
  }
};

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/executive/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCopyCode = () => {
    const code = data?.profile?.referral_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden pb-24 font-outfit">
        {/* Header Skeleton */}
        <div className="px-6 py-6 border-b border-slate-50 flex justify-between items-center">
           <div className="space-y-2">
              <div className="w-32 h-6 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-20 h-3 bg-slate-50 rounded-lg animate-pulse" />
           </div>
           <div className="w-10 h-10 bg-slate-50 rounded-xl animate-pulse" />
        </div>

        <div className="px-6 pt-6 space-y-6">
          {/* Profile Skeleton */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-24 h-3 bg-slate-50 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Balance Card Skeleton */}
          <div className="h-44 bg-slate-900/5 rounded-2xl animate-pulse flex flex-col justify-between p-6">
             <div className="space-y-2">
                <div className="w-24 h-3 bg-slate-200/50 rounded-full" />
                <div className="w-40 h-10 bg-slate-200/30 rounded-xl" />
             </div>
             <div className="flex gap-3">
                <div className="flex-1 h-12 bg-slate-200/40 rounded-xl" />
                <div className="flex-1 h-12 bg-slate-200/40 rounded-xl" />
             </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
            <div className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
          </div>

          {/* Hub Skeleton */}
          <div className="h-48 bg-slate-50 rounded-2xl animate-pulse" />
          
          {/* Nav Skeleton */}
          <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
        </div>

        <p className="absolute bottom-10 inset-x-0 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] animate-pulse">Syncing encrypted data...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const stats = data?.stats;
  const onboardingStatus = profile?.onboarding_status;
  const isVerified = onboardingStatus === 'approved' || onboardingStatus === 'verified';

  // Show banner for 24 hours after approval
  const showVerifiedBanner = (() => {
    if (!isVerified || !profile?.approved_at) return false;
    const approvedAt = new Date(profile.approved_at);
    const hoursSinceApproval = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceApproval < 24;
  })();

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-24 font-outfit">
      {/* Subtle Header */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-slate-900">Executive Panel</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Operational Console</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setLoading(true);
                fetchDashboard();
                toast.success('Syncing details...');
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => { logout(); navigate('/executive/login'); }}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-6 space-y-6 relative z-10"
      >
        {/* Simple Profile Section */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-medium text-lg">
            {profile?.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-medium text-slate-900">{profile?.name}</h2>
            <p className="text-slate-500 text-xs font-normal">{profile?.phone}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
            <Star size={10} className="text-[#fa8639] fill-[#fa8639]" />
            <span className="text-[10px] font-medium text-[#fa8639]">LVL 1</span>
          </div>
        </motion.div>

        {/* Verification Alert */}
        <AnimatePresence>
          {!isVerified && (
            <motion.div 
              variants={itemVariants}
              className={`p-4 rounded-2xl border ${
                onboardingStatus === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
              } flex gap-4`}
            >
              <div className={`p-2 rounded-lg ${onboardingStatus === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {onboardingStatus === 'rejected' ? <AlertCircle size={20} /> : <Clock size={20} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-slate-900">
                  {onboardingStatus === 'rejected' ? 'Action Required' : 'Review in Progress'}
                </h3>
                <p className="text-xs font-normal text-slate-600 leading-normal">
                  {onboardingStatus === 'rejected' 
                    ? profile?.kyc?.rejection_reason || 'Document verification failed.'
                    : 'We are reviewing your documents. Some features are restricted.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎉 Success Banner */}
        <AnimatePresence>
          {showVerifiedBanner && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-100 shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 animate-pulse" />
                  <div className="relative p-4 bg-white rounded-2xl shadow-sm border border-emerald-50 text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Verified</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[200px]">
                    Congratulations! Your field profile is now fully active for all operations.
                  </p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-100/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-100/20 rounded-full blur-3xl" />
            </motion.div>
          )}
        </AnimatePresence>



        {/* Simplified Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-medium text-slate-400 uppercase">Network</p>
            <p className="text-2xl font-medium text-slate-900 mt-1">{stats?.totalSellers || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-medium text-slate-400 uppercase">Active</p>
            <p className="text-2xl font-medium text-slate-900 mt-1">{stats?.paidSellers || 0}</p>
          </div>
        </motion.div>

        {/* Simple Referral Hub */}
        <motion.div variants={itemVariants} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <Share2 size={18} />
              </div>
              <h3 className="font-medium text-slate-900">Referral Hub</h3>
            </div>
            {!isVerified && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">LOCKED</span>}
          </div>
          
          <p className="text-xs text-slate-500 mb-6 leading-normal">
            Earn <span className="text-[#fa8639] font-bold">₹{data?.settings?.referral_commission || 100}</span> for every activated partner.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-slate-200 py-3 rounded-xl text-center font-medium tracking-widest text-lg">
              {isVerified ? profile?.referral_code : '——'}
            </div>
            <button 
              onClick={isVerified ? handleCopyCode : undefined}
              disabled={!isVerified}
              className="px-5 bg-slate-900 text-white rounded-xl active:scale-95 transition-all"
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Navigation Link */}
        <motion.div variants={itemVariants}>
          <button 
            onClick={() => navigate('/executive/partners')}
            className="w-full bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-[#fa8639]" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-slate-900">Partner List</h4>
                <p className="text-[10px] font-normal text-slate-400 uppercase">View & Manage Sellers</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-600" />
          </button>
        </motion.div>

      </motion.div>


    </div>
  );
}
