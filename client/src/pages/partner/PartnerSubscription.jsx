import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, History, CheckCircle2, 
  Calendar, Clock, ShieldCheck, 
  Package, Star, Users, ChevronRight,
  TrendingUp, Activity, X, Info, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-medium text-[#001b4e]">My Subscription</h2>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-2 text-[#001b4e] hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
        >
          <History size={24} strokeWidth={2.2} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Dynamic Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${currentTheme.mainColor} rounded-[40px] p-8 text-white shadow-2xl ${currentTheme.shadow} relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20">
              <CheckCircle2 size={44} fill="white" className={`${currentTheme.accentColor.replace('text-', 'text-[#')}`} style={{ color: currentTheme.name === 'Pro Partner' ? '#6366f1' : '#4CAF50' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[30px] font-bold uppercase tracking-tighter leading-none">Active</h3>
                {partner.plan === 'pro' && <Star size={18} fill="currentColor" className="text-yellow-400" />}
              </div>
              <p className="text-white/80 font-bold mt-2 text-[15px] tracking-wide uppercase">{planInfo.name}</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="p-6 bg-white/10 rounded-[28px] backdrop-blur-md border border-white/10 text-center">
              <Calendar size={20} className="mx-auto mb-2 text-white/50" />
              <div className="text-[28px] font-bold leading-none">{planInfo.daysLeft}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Days left</div>
            </div>
            <div className="p-6 bg-white/10 rounded-[28px] backdrop-blur-md border border-white/10 text-center">
              <Clock size={20} className="mx-auto mb-2 text-white/50" />
              <div className="text-[18px] font-bold leading-none mt-1.5">{planInfo.endDate}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">{partner.plan === 'pro' ? 'Renews On' : 'Expires On'}</div>
            </div>
          </div>
        </motion.div>

        {/* Plan Details Card */}
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-all duration-700" />
          <h4 className="text-[19px] font-bold text-[#001b4e] mb-8 relative z-10 flex items-center gap-2">
             <Activity size={20} className="text-blue-500" />
             Plan Details
          </h4>
          
          <div className="space-y-6 relative z-10">
            <DetailItem icon={<Package size={20} />} label="Tier" value={planInfo.name} />
            <DetailItem icon={<TrendingUp size={20} />} label="Member Since" value="April 2026" />
            <DetailItem icon={<ShieldCheck size={20} />} label="Account Status" value="Verified" />
          </div>
        </div>

        {/* Feature Limits */}
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[19px] font-bold text-[#001b4e]">Your Quota</h4>
            <div className={`px-4 py-1.5 ${currentTheme.lightBg} ${currentTheme.accentColor} rounded-full text-[10px] font-bold uppercase tracking-widest`}>
              RESET MONTHLY
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <LimitBox 
              icon={<Package size={22} />} 
              count={planInfo.limits.listings} 
              label="Listings" 
              color={partner.plan === 'pro' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}
            />
            <LimitBox 
              icon={<Star size={22} />} 
              count={planInfo.limits.featured} 
              label="Featured" 
              color={partner.plan === 'pro' ? 'bg-yellow-50 text-yellow-500' : 'bg-slate-50 text-slate-300'}
            />
            <LimitBox 
              icon={<Users size={22} />} 
              count={planInfo.limits.leads} 
              label="Hot Leads" 
              color={partner.plan === 'pro' ? 'bg-green-50 text-green-500' : 'bg-green-50 text-green-600'}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[60] max-w-lg mx-auto pb-10">
        {partner.plan === 'free' ? (
          <button 
            onClick={() => setShowComparison(true)}
            className="w-full bg-[#001b4e] text-white py-5 rounded-[24px] font-bold text-[16px] flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/30 active:scale-[0.98] transition-all"
          >
            <TrendingUp size={20} />
            Upgrade to Pro Partner
          </button>
        ) : (
          <button 
            onClick={() => setShowComparison(true)}
            className="w-full bg-[#6366f1] text-white py-5 rounded-[24px] font-bold text-[16px] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-900/40 active:scale-[0.98] transition-all"
          >
            <CheckCircle2 size={20} />
            Already on Best Plan
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
              className="relative w-full max-w-lg bg-white rounded-t-[40px] p-8 shadow-2xl overflow-hidden"
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
                        <div className="text-slate-400 text-[12px] font-medium">{item.date} • {item.price}</div>
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
              className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
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

              <div className="space-y-1">
                <div className="grid grid-cols-3 p-4 bg-slate-50 rounded-t-3xl text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  <div className="text-left text-[#001b4e]">Features</div>
                  <div className="text-green-600">Free</div>
                  <div className="text-indigo-600">Pro</div>
                </div>
                {COMPARISON_DATA.map((item, idx) => (
                  <div key={idx} className={`grid grid-cols-3 p-4 border-b border-slate-50 last:border-0 items-center ${idx === COMPARISON_DATA.length - 1 ? 'rounded-b-3xl' : ''}`}>
                    <div className="text-left text-[14px] font-bold text-[#001b4e] leading-tight">{item.feature}</div>
                    <div className="flex justify-center text-[13px] font-medium text-slate-400">{item.free}</div>
                    <div className="flex justify-center text-[13px] font-bold text-[#001b4e]">{item.pro}</div>
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
    <div className="flex items-center justify-between py-1 px-1">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <span className="text-[15px] font-bold text-slate-400/80">{label}</span>
      </div>
      <span className="text-[#001b4e] font-bold text-[15px] tracking-tight">{value}</span>
    </div>
  );
}

function LimitBox({ icon, count, label, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 ${color} rounded-[24px] flex items-center justify-center mb-4 shadow-inner ring-1 ring-white transition-all`}>
        {icon}
      </div>
      <div className="flex items-center gap-1">
        <div className={`text-[26px] font-bold leading-none ${color.split(' ')[1]}`}>{count}</div>
      </div>
      <div className="text-[10px] font-bold text-slate-300 mt-2 tracking-widest uppercase">{label}</div>
    </div>
  );
}
