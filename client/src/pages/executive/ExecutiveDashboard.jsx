import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Wallet, Users, ChevronRight, Copy, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Send, TrendingUp, 
  UserCheck, CreditCard, Sparkles, Share2, ArrowUpRight,
  ShieldCheck, PartyPopper, Lock, Zap, ArrowRight, Star,
  Target, IndianRupee, FileText, Calendar, Phone, Mail,
  MapPin, Building2, User, ShieldAlert, CreditCard as BankIcon,
  CalendarCheck, CalendarX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useExecutive } from '../../context/ExecutiveContext';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

// Status badge config
const STATUS_CONFIG = {
  approved:          { label: 'Verified',       color: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  verified:          { label: 'Verified',       color: 'bg-emerald-50 border-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  pending:           { label: 'Under Review',   color: 'bg-amber-50 border-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  pending_approval:  { label: 'Under Review',   color: 'bg-amber-50 border-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  rejected:          { label: 'Rejected',       color: 'bg-rose-50 border-rose-100 text-rose-700',       dot: 'bg-rose-500' },
  incomplete:        { label: 'Action Required', color: 'bg-blue-50 border-blue-100 text-blue-700',       dot: 'bg-blue-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data, loading, refetch } = useExecutive();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const code = data?.profile?.referral_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden pb-24 font-outfit">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-36 h-5 bg-slate-100 rounded-lg animate-pulse" />
            <div className="w-20 h-3 bg-slate-50 rounded-lg animate-pulse" />
          </div>
          <div className="w-9 h-9 bg-slate-50 rounded-xl animate-pulse" />
        </div>
        <div className="px-6 pt-6 space-y-5">
          <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl animate-pulse" />
          <div className="h-28 bg-slate-50 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
            <div className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
          </div>
        </div>
        <p className="absolute bottom-10 inset-x-0 text-center text-[10px] font-black text-slate-200 uppercase tracking-[0.4em] animate-pulse">Syncing…</p>
      </div>
    );
  }

  const profile        = data?.profile;
  const stats          = data?.stats;
  const dailyTask      = data?.daily_task;
  const salary         = data?.salary;
  const onboardingStatus = profile?.onboarding_status;
  const isVerified     = onboardingStatus === 'approved' || onboardingStatus === 'verified';
  const isRejected     = onboardingStatus === 'rejected';

  const showVerifiedBanner = (() => {
    if (!isVerified || !profile?.approved_at) return false;
    const approvedAt = new Date(profile.approved_at);
    return (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60) < 24;
  })();

  const handleLockedClick = (featureName) => {
    toast.error(`"${featureName}" is locked until your account is verified by admin.`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-28 font-outfit">

      {/* Header */}
      <div className="sticky top-0 z-40 px-5 py-4 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Executive Panel</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Field Operations Console</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { refetch(); toast.success('Refreshing…'); }}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { logout(true); navigate('/executive/login'); }}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-5 pt-5 space-y-4"
      >

        {/* ── Profile Hero Card ── */}
        <motion.div variants={itemVariants}>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white overflow-hidden">
            {/* decorative blobs */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden backdrop-blur-sm">
                {(profile?.kyc?.live_photo || profile?.image) ? (
                  <img src={profile?.kyc?.live_photo || profile?.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[17px] font-bold text-white leading-tight">
                      {profile?.name || 'No Name Set'}
                    </h2>
                    <p className="text-[11px] text-white/60 font-medium mt-0.5">Field Executive</p>
                  </div>
                  <StatusBadge status={onboardingStatus} />
                </div>

                {/* Contact row */}
                <div className="mt-3 space-y-1.5">
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-[12px] text-white/70">
                      <Phone size={12} className="shrink-0" />
                      <span>+91 {profile.phone}</span>
                    </div>
                  )}
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-[12px] text-white/70">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {(profile?.district || profile?.state) && (
                    <div className="flex items-center gap-2 text-[12px] text-white/70">
                      <MapPin size={12} className="shrink-0" />
                      <span>{[profile.district, profile.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Profile link */}
            <button
              onClick={() => navigate('/executive/profile')}
              className="relative z-10 mt-4 w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white text-[11px] font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-white/20 transition-colors active:scale-[0.98]"
            >
              View Full Profile <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* ── KYC / Bank Details Row ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* KYC Status */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isVerified ? 'bg-emerald-50 text-emerald-600' :
                isRejected ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'
              }`}>
                {isVerified ? <ShieldCheck size={16} /> : isRejected ? <ShieldAlert size={16} /> : <Clock size={16} />}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
            </div>
            <StatusBadge status={onboardingStatus} />
            {isRejected && profile?.kyc?.rejection_reason && (
              <p className="text-[10px] text-rose-500 font-medium leading-relaxed">{profile.kyc.rejection_reason}</p>
            )}
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank</p>
            </div>
            {profile?.bank_details?.account_number ? (
              <div>
                <p className="text-[11px] font-bold text-slate-900">{profile.bank_details.bank_name || 'Bank Account'}</p>
                <p className="text-[10px] text-slate-400 font-medium">XXXX {profile.bank_details.account_number?.slice(-4)}</p>
                <p className="text-[9px] text-slate-300 font-medium">{profile.bank_details.ifsc_code}</p>
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 font-medium">No bank linked</p>
            )}
          </div>
        </motion.div>

        {/* ── Verification Alert (for unverified) ── */}
        <AnimatePresence>
          {!isVerified && (
            <motion.div 
              variants={itemVariants}
              className={`p-4 rounded-2xl border flex gap-3 ${
                isRejected ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${isRejected ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {isRejected ? <AlertCircle size={18} /> : <Clock size={18} />}
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-slate-900">
                  {isRejected ? 'Application Rejected' : 'Verification In Progress'}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  {isRejected
                    ? (profile?.kyc?.rejection_reason || 'Your documents were not accepted. Please contact support.')
                    : 'Admin is reviewing your KYC documents. Features below will unlock once verified. Usually 24–48 hrs.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Verified Banner ── */}
        <AnimatePresence>
          {showVerifiedBanner && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-100"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-50 text-emerald-600">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Account Verified 🎉</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">All features are now active. Start onboarding partners!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Salary Widget ── */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <IndianRupee size={140} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Effective Salary</span>
            <button
              onClick={() => {
                if (!isVerified) { handleLockedClick('Salary Ledger'); return; }
                navigate('/executive/salary');
              }}
              className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-0.5 px-2.5 py-1 rounded-lg border backdrop-blur-sm transition-colors ${
                isVerified 
                  ? 'text-indigo-400 hover:text-indigo-300 bg-white/5 border-white/10'
                  : 'text-slate-500 bg-white/5 border-white/10 cursor-default'
              }`}
            >
              {isVerified ? <>Ledger <ChevronRight size={12} /></> : <><Lock size={11} /> Locked</>}
            </button>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black tracking-tight block">₹{isVerified ? (salary?.effective || 0) : '—'}</span>
            <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
              {isVerified ? 'Disbursed monthly based on performance' : 'Unlocks after verification'}
            </span>
          </div>
          {isVerified && salary?.last_month?.deduction_applied && (
            <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-rose-400 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Last month avg &lt;50%: -₹{salary.last_month.deduction_amount} penalty</span>
            </div>
          )}
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { if (isVerified) navigate('/executive/partners'); else handleLockedClick('My Network'); }}
            className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left transition-all active:scale-[0.98] ${isVerified ? 'hover:border-slate-200' : 'opacity-60 cursor-default'}`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Network</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{isVerified ? (stats?.totalSellers || 0) : '—'}</p>
            <p className="text-[9px] text-slate-300 uppercase font-medium mt-0.5">Total Partners</p>
          </button>
          <button
            onClick={() => { if (isVerified) navigate('/executive/partners'); else handleLockedClick('Active Partners'); }}
            className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left transition-all active:scale-[0.98] ${isVerified ? 'hover:border-slate-200' : 'opacity-60 cursor-default'}`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{isVerified ? (stats?.paidSellers || 0) : '—'}</p>
            <p className="text-[9px] text-slate-300 uppercase font-medium mt-0.5">Paid Sellers</p>
          </button>
        </motion.div>

        {/* ── Daily Task Progress ── */}
        {isVerified && (
          <motion.div
            variants={itemVariants}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Target size={16} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Today's Target</h3>
                  {dailyTask?.exists && <p className="text-[9px] font-bold text-slate-400">{dailyTask.date}</p>}
                </div>
              </div>
              {dailyTask?.exists && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                  dailyTask.percentage >= 50
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {dailyTask.percentage}%
                </span>
              )}
            </div>
            {dailyTask?.exists ? (
              <>
                <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, dailyTask.percentage)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      dailyTask.percentage >= 50
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {dailyTask.completed} / {dailyTask.target_count} sellers completed
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium">No target assigned for today.</p>
            )}
          </motion.div>
        )}

        {/* ── Referral Hub ── */}
        <motion.div variants={itemVariants} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isVerified ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>
                <Share2 size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-[14px]">Referral Hub</h3>
            </div>
            {!isVerified && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">LOCKED</span>}
          </div>
          {isVerified ? (
            <>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Earn <span className="text-[#fa8639] font-bold">₹{data?.settings?.referral_commission || 100}</span> for every activated partner you onboard.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-slate-200 py-3 rounded-xl text-center font-bold tracking-widest text-[16px] text-slate-900">
                  {profile?.referral_code}
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="px-5 bg-slate-900 text-white rounded-xl active:scale-95 transition-all"
                >
                  {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <Lock size={16} className="text-slate-300 shrink-0" />
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Your referral code will appear here once your account is verified by the admin.
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Wallet */}
          <button 
            onClick={() => {
              if (!isVerified) { handleLockedClick('Wallet'); return; }
              navigate('/executive/wallet');
            }}
            className={`bg-white p-4 rounded-2xl border flex flex-col items-start gap-3 transition-all active:scale-95 ${
              isVerified ? 'border-slate-100 hover:border-slate-200' : 'border-slate-100 opacity-60 cursor-default'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVerified ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              {isVerified ? <Wallet size={20} /> : <Lock size={18} />}
            </div>
            <div className="text-left">
              <h4 className="text-[13px] font-bold text-slate-900">My Wallet</h4>
              <p className="text-[9px] text-slate-400 uppercase font-medium">{isVerified ? 'Earnings & Payouts' : 'Verification Required'}</p>
            </div>
          </button>

          {/* Targets */}
          <button 
            onClick={() => {
              if (!isVerified) { handleLockedClick('Targets'); return; }
              navigate('/executive/targets');
            }}
            className={`bg-white p-4 rounded-2xl border flex flex-col items-start gap-3 transition-all active:scale-95 ${
              isVerified ? 'border-slate-100 hover:border-slate-200' : 'border-slate-100 opacity-60 cursor-default'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {isVerified ? <Target size={20} /> : <Lock size={18} />}
            </div>
            <div className="text-left">
              <h4 className="text-[13px] font-bold text-slate-900">Targets</h4>
              <p className="text-[9px] text-slate-400 uppercase font-medium">{isVerified ? 'Goals & Incentives' : 'Verification Required'}</p>
            </div>
          </button>
        </motion.div>

        {/* ── Partner List ── */}
        <motion.div variants={itemVariants}>
          <button 
            onClick={() => {
              if (!isVerified) { handleLockedClick('Partner List'); return; }
              navigate('/executive/partners');
            }}
            className={`w-full bg-white p-5 rounded-2xl border flex items-center justify-between group transition-all ${
              isVerified ? 'border-slate-100 active:scale-[0.98] hover:border-slate-200' : 'border-slate-100 opacity-60 cursor-default'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isVerified ? 'bg-orange-50' : 'bg-slate-100'}`}>
                {isVerified ? <Users size={20} className="text-[#fa8639]" /> : <Lock size={18} className="text-slate-400" />}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-[14px]">Partner List</h4>
                <p className="text-[9px] font-medium text-slate-400 uppercase">{isVerified ? 'View & Manage Sellers' : 'Verification Required'}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-600" />
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}
