import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, History, CheckCircle2, 
  Calendar, Clock, ShieldCheck, 
  Package, Star, Users, ChevronRight,
  TrendingUp, Activity, X, Info, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PLAN_THEMES = {
  free: {
    name: 'Free Trail',
    mainColor: 'bg-[#4CAF50]',
    accentColor: 'text-green-500',
    lightBg: 'bg-green-50',
    shadow: 'shadow-green-900/10'
  },
  pro: {
    name: 'Pro Partner',
    mainColor: 'bg-[#6366f1]',
    accentColor: 'text-indigo-500',
    lightBg: 'bg-indigo-50',
    shadow: 'shadow-indigo-900/10'
  }
};

const COMPARISON_DATA = [
  { feature: 'Search Listings', free: '1 Active', pro: 'Unlimited' },
  { feature: 'Featured Labels', free: 'None', pro: '5 Listings' },
  { feature: 'Verified Badge', free: <X size={16} className="text-red-400" />, pro: <CheckCircle2 size={16} className="text-green-500" /> },
  { feature: 'Customer Support', free: 'Standard', pro: 'Priority 24/7' },
  { feature: 'Leads analytics', free: <X size={16} className="text-red-400" />, pro: <CheckCircle2 size={16} className="text-green-500" /> },
];

const HISTORY_DATA = [
  { id: 1, name: 'Free Trail', date: '08 Apr 2026', status: 'Active', price: '₹0' },
  { id: 2, name: 'Free Trail', date: '08 Mar 2026', status: 'Expired', price: '₹0' },
];

export default function PartnerSubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  if (!user) return null;
  const partner = user;

  const currentTheme = PLAN_THEMES[partner.plan] || PLAN_THEMES.free;

  const planInfo = {
    name: currentTheme.name,
    startDate: '8/4/2026',
    endDate: '8/5/2026',
    daysLeft: 29,
    status: 'Active',
    limits: {
      listings: partner.plan === 'pro' ? '∞' : 1,
      featured: partner.plan === 'pro' ? 5 : 'None',
      leads: partner.plan === 'pro' ? 'Unlimited' : 50
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-40">
      {/* Header */}
      <div className="bg-white px-5 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Subscription</h2>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
        >
          <History size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Dynamic Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${currentTheme.mainColor} rounded-2xl xs:rounded-[24px] p-6 xs:p-7 text-white shadow-xl ${currentTheme.shadow} relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl opacity-50" />
          
          <div className="flex items-center gap-3 xs:gap-5 relative z-10">
            <div className="w-14 h-14 xs:w-16 xs:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shrink-0">
              <CheckCircle2 size={32} xs:size={36} fill="white" style={{ color: currentTheme.name === 'Pro Partner' ? '#6366f1' : '#4CAF50' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[20px] xs:text-[22px] font-bold uppercase tracking-tighter leading-none">Active</h3>
                {partner.plan === 'pro' && <Star size={14} fill="currentColor" className="text-yellow-400" />}
              </div>
              <p className="text-white/80 font-medium mt-1.5 text-[11px] xs:text-[12px] tracking-wide uppercase truncate leading-none opacity-80">
                {partner.plan === 'free' ? 'Free Trial Plan' : 'Pre-launching Offer'}
              </p>
            </div>
          </div>

          <div className="mt-6 xs:mt-8 grid grid-cols-2 gap-3 xs:gap-4">
            <div className="p-4 bg-white/10 rounded-xl xs:rounded-2xl backdrop-blur-md border border-white/10 text-center">
              <Calendar size={16} className="mx-auto mb-1 text-white/50" />
              <div className="text-[20px] xs:text-[22px] font-bold leading-none">{planInfo.daysLeft}</div>
              <div className="text-[8px] xs:text-[9px] font-medium text-white/40 uppercase tracking-widest mt-1.5 leading-none">Days left</div>
            </div>
            <div className="p-4 bg-white/10 rounded-xl xs:rounded-2xl backdrop-blur-md border border-white/10 text-center">
              <Clock size={16} className="mx-auto mb-1 text-white/50" />
              <div className="text-[13px] xs:text-[14px] font-bold leading-none mt-1">{planInfo.endDate}</div>
              <div className="text-[8px] xs:text-[9px] font-medium text-white/40 uppercase tracking-widest mt-1.5 leading-none opacity-60">Expires</div>
            </div>
          </div>
        </motion.div>

        {/* Plan Details Card */}
        <div className="bg-white rounded-2xl xs:rounded-[24px] p-6 xs:p-7 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-all duration-700" />
          <h4 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] mb-5 relative z-10 flex items-center gap-2 uppercase tracking-tight leading-none opacity-70">
             <Activity size={18} className="text-blue-500" />
             Plan Details
          </h4>
          
          <div className="space-y-4 relative z-10">
            <DetailItem icon={<Package size={18} />} label="Tier" value={planInfo.name} />
            <DetailItem icon={<TrendingUp size={18} />} label="Since" value="April 2026" />
            <DetailItem icon={<ShieldCheck size={18} />} label="Status" value="Verified" />
          </div>
        </div>

        {/* Feature Limits */}
        <div className="bg-white rounded-2xl xs:rounded-[24px] p-6 xs:p-7 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 xs:mb-7">
            <h4 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight leading-none opacity-70">Quota</h4>
            <div className={`px-2.5 py-1 ${currentTheme.lightBg} ${currentTheme.accentColor} rounded-lg text-[8px] font-medium uppercase tracking-widest leading-none`}>
              RESET MONTHLY
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 xs:gap-5">
            <LimitBox 
              icon={<Package size={20} xs:size={22} />} 
              count={planInfo.limits.listings} 
              label="Items" 
              color={partner.plan === 'pro' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}
            />
            <LimitBox 
              icon={<Star size={20} xs:size={22} />} 
              count={planInfo.limits.featured} 
              label="Ads" 
              color={partner.plan === 'pro' ? 'bg-yellow-50 text-yellow-500' : 'bg-slate-50 text-slate-300'}
            />
            <LimitBox 
              icon={<Users size={20} xs:size={22} />} 
              count={planInfo.limits.leads} 
              label="Leads" 
              color={partner.plan === 'pro' ? 'bg-green-50 text-green-500' : 'bg-green-50 text-green-600'}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[60] max-w-lg mx-auto pb-8">
        {partner.plan === 'free' ? (
          <button 
            onClick={() => setShowComparison(true)}
            className="w-full bg-[#001b4e] text-white py-4.5 rounded-xl xs:rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all uppercase tracking-tight"
          >
            <TrendingUp size={18} />
            Upgrade to Pro
          </button>
        ) : (
          <button 
            onClick={() => setShowComparison(true)}
            className="w-full bg-[#6366f1] text-white py-4.5 rounded-xl xs:rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 shadow-2xl shadow-indigo-900/20 active:scale-[0.98] transition-all uppercase tracking-tight"
          >
            <CheckCircle2 size={18} />
            Best Plan Active
          </button>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-[#001b4e]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl xs:rounded-t-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full" />
              <div className="flex items-center justify-between mb-8 mt-2">
                <h3 className="text-[22px] font-bold text-[#001b4e]">Subscripton History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto no-scrollbar">
                {HISTORY_DATA.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[28px] flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <div className="text-[#001b4e] font-bold text-[15px]">{item.name}</div>
                        <div className="text-slate-400 text-[12px] font-normal">{item.date} • {item.price}</div>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === 'Active' ? 'bg-green-500 text-white' : 'bg-slate-300 text-white'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComparison(false)}
              className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl xs:rounded-[24px] p-5 xs:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-[22px] font-bold text-[#001b4e]">Plan Comparison</h3>
                   <p className="text-slate-400 text-[13px] font-medium">Unlock your business potential</p>
                </div>
                <button onClick={() => setShowComparison(false)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1 bg-slate-50/50 rounded-3xl p-1 border border-slate-100">
                <div className="grid grid-cols-[1.5fr_1fr_1fr] p-3 xs:p-4 bg-slate-100/50 rounded-2xl text-[9px] xs:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  <div className="text-left text-[#001b4e]">Features</div>
                  <div className="text-green-600">Free</div>
                  <div className="text-indigo-600">Pro</div>
                </div>
                {COMPARISON_DATA.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1.5fr_1fr_1fr] p-3 xs:p-4 border-b border-slate-50 last:border-0 items-center">
                    <div className="text-left text-[11px] xs:text-[13px] font-medium text-[#001b4e] leading-tight pr-2">{item.feature}</div>
                    <div className="flex justify-center text-[10px] xs:text-[12px] font-medium text-slate-400 text-center">{item.free}</div>
                    <div className="flex justify-center text-[10px] xs:text-[12px] font-medium text-indigo-600 text-center">{item.pro}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-3">
                {partner.plan === 'free' ? (
                   <button 
                    onClick={() => setShowComparison(false)}
                    className="w-full bg-[#6366f1] text-white py-4.5 rounded-[22px] font-bold text-[15px] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     Upgrade Now <Zap size={18} fill="white" />
                   </button>
                ) : (
                  <div className="bg-indigo-50 p-5 rounded-3xl flex items-center gap-4 border border-indigo-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                      <Star size={24} fill="currentColor" />
                    </div>
                    <p className="text-indigo-900 text-[13px] font-bold leading-snug">
                       Great news! You're already enjoying the Pro Partner benefits.
                    </p>
                  </div>
                )}
                <button 
                  onClick={() => setShowComparison(false)}
                  className="w-full bg-slate-50 text-slate-500 py-4 rounded-[22px] font-bold text-[15px] active:scale-95 transition-all"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 xs:w-9 xs:h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 opacity-70">
          {icon}
        </div>
        <span className="text-[12px] xs:text-[13px] font-medium text-slate-400 uppercase tracking-tight leading-none opacity-60">{label}</span>
      </div>
      <span className="text-[#001b4e] font-medium text-[13px] xs:text-[14px] tracking-tight leading-none uppercase">{value}</span>
    </div>
  );
}

function LimitBox({ icon, count, label, color }) {
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className={`w-11 h-11 xs:w-12 xs:h-12 ${color} rounded-xl xs:rounded-2xl flex items-center justify-center mb-2 shadow-inner ring-1 ring-white/50 transition-all`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="flex items-center gap-0.5 min-w-0">
        <div className={`text-[18px] xs:text-[20px] font-bold leading-none truncate ${color.split(' ')[1]}`}>{count}</div>
      </div>
      <div className="text-[8px] font-medium text-slate-300 mt-1 uppercase tracking-widest leading-none text-center opacity-60">{label}</div>
    </div>
  );
}
