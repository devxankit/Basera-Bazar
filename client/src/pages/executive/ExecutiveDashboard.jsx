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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

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

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(withdrawAmount) > data.profile.wallet_balance) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawing(true);
    try {
      await api.post('/executive/withdraw', { amount: Number(withdrawAmount) });
      toast.success("Withdrawal request submitted!");
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setWithdrawing(false);
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
          <button 
            onClick={() => { logout(); navigate('/executive/login'); }}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
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
              className="p-5 rounded-2xl bg-slate-900 text-white"
            >
              <div className="flex gap-4">
                <div className="p-3 bg-[#fa8639] rounded-xl">
                  <PartyPopper size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Verified Executive</h3>
                  <p className="text-xs text-slate-400 mt-1">Your account is fully active. You can now start onboarding partners.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simple Balance Card */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#181d5f] to-[#252b75] p-6 rounded-2xl text-white shadow-lg">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Available Balance</p>
              <h3 className="text-3xl font-medium">₹{profile?.wallet_balance?.toLocaleString() || 0}</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-[#fa8639] py-3 rounded-xl font-medium text-sm"
            >
              Withdraw
            </button>
            <div className="flex-1 bg-white/10 p-3 rounded-xl flex flex-col justify-center">
              <p className="text-[8px] text-white/60 uppercase">Lifetime</p>
              <p className="text-sm font-medium">₹{profile?.total_earnings?.toLocaleString() || 0}</p>
            </div>
          </div>
        </motion.div>

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

      {/* Withdrawal Bottom Sheet — Redesigned for Premium feel */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:px-0 sm:pb-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[3.5rem] p-10 pb-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#181d5f] to-[#fa8639]" />
              
              <div className="text-center space-y-2 mb-10">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
                <h2 className="text-3xl font-black text-[#181d5f] tracking-tighter font-outfit">Payout Engine</h2>
                <p className="text-[10px] font-black text-[#fa8639] uppercase tracking-[0.3em] font-outfit">Secure Bank Transfer</p>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] text-center border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-outfit">Available for Payout</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter font-outfit">₹{profile?.wallet_balance?.toLocaleString() || 0}</p>
                </div>

                <div className="space-y-4 px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 font-outfit">Specify Amount</label>
                  <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 transition-colors group-focus-within:text-indigo-600">₹</span>
                    <input 
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50/50 border-2 border-slate-100 py-7 pl-16 pr-8 rounded-3xl text-3xl font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-outfit"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowWithdrawModal(false)} className="flex-grow py-5 bg-slate-100 text-slate-500 font-black rounded-[2rem] hover:bg-slate-200 active:scale-[0.98] transition-all font-outfit text-xs tracking-widest">CANCEL</button>
                  <button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) > profile.wallet_balance}
                    className="flex-[2] py-5 bg-[#181d5f] text-white font-black rounded-[2rem] shadow-xl shadow-slate-100 active:scale-[0.98] transition-all disabled:opacity-30 font-outfit text-xs tracking-widest"
                  >
                    {withdrawing ? 'PROCESSING...' : 'CONFIRM PAYOUT'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
