import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, History, CheckCircle2, 
  Calendar, Clock, ShieldCheck, 
  Package, Star, Users, ChevronRight,
  TrendingUp, Activity, X, Info, Zap, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerSubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/partners/subscriptions/plans');
        if (res.data.success) {
          setPlans(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (!user) return null;
  const partner = user;

  // Find the free plan from fetched plans to use as fallback
  const dbFreePlan = plans.find(p => p.price === 0 || p.name?.toLowerCase().includes('free'));
  const currentPlanName = partner.active_subscription_id?.plan_snapshot?.name || dbFreePlan?.name || 'Free Trail';
  const isActivePro = !!partner.active_subscription_id && partner.active_subscription_id.plan_snapshot?.price > 0;

  const getPlanTheme = (planName) => {
    if (planName?.toLowerCase().includes('pro') || planName?.toLowerCase().includes('gold') || planName?.toLowerCase().includes('premium')) {
      return {
        mainColor: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
        accentColor: 'text-indigo-500',
        lightBg: 'bg-indigo-50',
        shadow: 'shadow-indigo-900/20'
      };
    }
    return {
      mainColor: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      accentColor: 'text-emerald-500',
      lightBg: 'bg-emerald-50',
      shadow: 'shadow-emerald-900/20'
    };
  };

  const currentTheme = getPlanTheme(currentPlanName);

  const planInfo = {
    name: currentPlanName,
    startDate: partner.active_subscription_id?.starts_at ? new Date(partner.active_subscription_id.starts_at).toLocaleDateString() : 'Today',
    endDate: partner.active_subscription_id?.ends_at ? new Date(partner.active_subscription_id.ends_at).toLocaleDateString() : 'N/A',
    daysLeft: partner.active_subscription_id?.ends_at ? Math.ceil((new Date(partner.active_subscription_id.ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : 29,
    status: 'Active',
    limits: {
      listings: partner.active_subscription_id?.plan_snapshot?.listings_limit === -1 ? '∞' : (partner.active_subscription_id?.plan_snapshot?.listings_limit || 1),
      featured: partner.active_subscription_id?.plan_snapshot?.featured_listings_limit === -1 ? '∞' : (partner.active_subscription_id?.plan_snapshot?.featured_listings_limit || 'None'),
      leads: partner.active_subscription_id?.plan_snapshot?.leads_limit === -1 ? 'Unlimited' : (partner.active_subscription_id?.plan_snapshot?.leads_limit || 50)
    }
  };

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setShowSubscribeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#001b4e] mb-4" size={32} />
        <p className="text-slate-500 font-medium">Loading Subscription Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32">
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
              <CheckCircle2 size={32} xs:size={36} fill="white" className={currentTheme.accentColor.replace('text-', 'text-')} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[20px] xs:text-[22px] font-bold uppercase tracking-tighter leading-none">Active Plan</h3>
                {isActivePro && <Star size={14} fill="currentColor" className="text-yellow-400" />}
              </div>
              <p className="text-white font-bold mt-1.5 text-[14px] xs:text-[16px] tracking-wide uppercase truncate leading-none">
                {planInfo.name}
              </p>
            </div>
          </div>

          <div className="mt-6 xs:mt-8 grid grid-cols-2 gap-3 xs:gap-4 relative z-10">
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

        {/* Feature Limits */}
        <div className="bg-white rounded-2xl xs:rounded-[24px] p-6 xs:p-7 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 xs:mb-7">
            <h4 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight leading-none opacity-70">Your Quota</h4>
            <div className={`px-2.5 py-1 ${currentTheme.lightBg} ${currentTheme.accentColor} rounded-lg text-[8px] font-medium uppercase tracking-widest leading-none`}>
              RESET MONTHLY
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 xs:gap-5">
            <LimitBox 
              icon={<Package size={20} xs:size={22} />} 
              count={planInfo.limits.listings} 
              label="Items" 
              color={isActivePro ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}
            />
            <LimitBox 
              icon={<Star size={20} xs:size={22} />} 
              count={planInfo.limits.featured} 
              label="Ads" 
              color={isActivePro ? 'bg-yellow-50 text-yellow-500' : 'bg-slate-50 text-slate-300'}
            />
            <LimitBox 
              icon={<Users size={20} xs:size={22} />} 
              count={planInfo.limits.leads} 
              label="Leads" 
              color={isActivePro ? 'bg-emerald-50 text-emerald-500' : 'bg-emerald-50 text-emerald-600'}
            />
          </div>
        </div>

        {/* Available Plans Section */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-[#001b4e] rounded-full" />
            <h3 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight">Available Plans</h3>
          </div>

          <div className="space-y-4">
            {plans.map((plan, idx) => {
              const isCurrent = plan.name === currentPlanName;
              return (
                <div 
                  key={plan._id || idx} 
                  className={`bg-white rounded-[24px] p-6 border-2 transition-all shadow-sm ${isCurrent ? 'border-emerald-500 shadow-emerald-500/10' : 'border-slate-100 hover:border-[#001b4e]/30'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[18px] font-bold text-[#001b4e] uppercase leading-tight">{plan.name}</h4>
                      <p className="text-slate-400 text-[12px] font-medium uppercase tracking-widest mt-1">
                        {plan.duration_days} Days Validity
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Current
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-[20px] font-black text-[#001b4e]">₹{plan.price}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {plan.listings_limit === -1 ? 'Unlimited' : plan.listings_limit} Listings
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {plan.featured_listings_limit === -1 ? 'Unlimited' : plan.featured_listings_limit} Featured Ads
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {plan.leads_limit === -1 ? 'Unlimited' : plan.leads_limit} Leads
                    </div>
                  </div>

                  {!isCurrent && (
                    <button 
                      onClick={() => handleSubscribe(plan)}
                      className="w-full bg-[#001b4e] text-white py-3.5 rounded-xl font-bold text-[14px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                      Subscribe Now <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Comparison Section */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h3 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight">Compare Plans</h3>
          </div>
          
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Features</th>
                    {plans.map(p => (
                      <th key={p._id} className="p-4 text-[12px] font-black text-[#001b4e] uppercase tracking-tighter text-center border-l border-slate-100 w-1/3">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-[13px] font-medium text-[#001b4e]">Price</td>
                    {plans.map(p => (
                      <td key={p._id} className="p-4 text-[13px] font-bold text-slate-600 text-center border-l border-slate-50">
                        {p.price === 0 ? 'Free' : `₹${p.price}`}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-[13px] font-medium text-[#001b4e]">Listings Limit</td>
                    {plans.map(p => (
                      <td key={p._id} className="p-4 text-[13px] font-bold text-slate-600 text-center border-l border-slate-50">
                        {p.listings_limit === -1 ? 'Unlimited' : p.listings_limit}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-[13px] font-medium text-[#001b4e]">Featured Ads</td>
                    {plans.map(p => (
                      <td key={p._id} className="p-4 text-[13px] font-bold text-slate-600 text-center border-l border-slate-50">
                        {p.featured_listings_limit === -1 ? 'Unlimited' : (p.featured_listings_limit === 0 ? <X size={16} className="text-red-400 mx-auto" /> : p.featured_listings_limit)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-[13px] font-medium text-[#001b4e]">Leads Access</td>
                    {plans.map(p => (
                      <td key={p._id} className="p-4 text-[13px] font-bold text-slate-600 text-center border-l border-slate-50">
                        {p.leads_limit === -1 ? 'Unlimited' : p.leads_limit}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Subscribe Confirmation Modal */}
      <AnimatePresence>
        {showSubscribeModal && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
              
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
                <Star size={28} fill="currentColor" />
              </div>
              <h3 className="text-[#001b4e] text-[20px] font-bold mb-2 uppercase tracking-tight relative z-10">
                Subscribe to {selectedPlan.name}
              </h3>
              <p className="text-slate-500 text-[13px] mb-8 leading-relaxed font-medium relative z-10">
                Payment integration is coming soon! For now, please contact our support team to upgrade your plan.
              </p>
              
              <div className="flex flex-col gap-3 relative z-10">
                <button 
                  onClick={() => setShowSubscribeModal(false)}
                  className="w-full bg-[#6366f1] text-white py-4 rounded-xl font-bold text-[14px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal (Keeping Existing UI structure but mocked data for now) */}
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
              className="relative w-full max-w-lg bg-white rounded-t-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full" />
              <div className="flex items-center justify-between mb-8 mt-2">
                <h3 className="text-[22px] font-bold text-[#001b4e] uppercase tracking-tight">Subscription History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto no-scrollbar">
                <div className="text-center text-slate-400 py-8 font-medium">
                  No previous subscription history found.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
