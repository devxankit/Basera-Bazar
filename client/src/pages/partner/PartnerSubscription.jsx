import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, History, CheckCircle2, 
  Calendar, Clock, Star, 
  Package, Users, ChevronRight,
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

  const dbFreePlan = plans.find(p => p.price === 0 || p.name?.toLowerCase().includes('free'));
  const currentPlanName = partner.active_subscription_id?.plan_snapshot?.name || dbFreePlan?.name || 'Free Trial';
  const isActivePro = !!partner.active_subscription_id && partner.active_subscription_id.plan_snapshot?.price > 0;

  const getPlanTheme = (planName) => {
    if (planName?.toLowerCase().includes('pro') || planName?.toLowerCase().includes('gold') || planName?.toLowerCase().includes('premium')) {
      return {
        mainColor: 'bg-[#001b4e]',
        accentColor: 'text-blue-500',
        lightBg: 'bg-blue-50',
        shadow: 'shadow-blue-900/20'
      };
    }
    return {
      mainColor: 'bg-[#001b4e]',
      accentColor: 'text-emerald-500',
      lightBg: 'bg-emerald-50',
      shadow: 'shadow-slate-900/10'
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
      featured: partner.active_subscription_id?.plan_snapshot?.featured_listings_limit === -1 ? '∞' : (partner.active_subscription_id?.plan_snapshot?.featured_listings_limit || '0'),
      leads: partner.active_subscription_id?.plan_snapshot?.leads_limit === -1 ? '∞' : (partner.active_subscription_id?.plan_snapshot?.leads_limit || 5)
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
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Subscription</h2>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
        >
          <History size={20} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Active Plan Card - High Density */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${currentTheme.mainColor} rounded-xl p-6 text-white shadow-xl ${currentTheme.shadow} relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Star size={80} fill="white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Current Active Plan</div>
                  <h3 className="text-[24px] font-black uppercase tracking-tight leading-none">{planInfo.name}</h3>
               </div>
               <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Zap size={24} className="text-blue-400" fill="currentColor" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Remaining</div>
                <div className="flex items-baseline gap-1">
                   <span className="text-[22px] font-black leading-none">{planInfo.daysLeft}</span>
                   <span className="text-[12px] font-bold text-white/60 uppercase">Days</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Expiry Date</div>
                <div className="text-[15px] font-black tracking-tight">{planInfo.endDate}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Limits Grid */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-[11px] font-black text-[#001b4e] uppercase tracking-widest">Usage Quota</h4>
            <div className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-black uppercase tracking-widest">Monthly Reset</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <LimitBox 
              icon={<Package size={18} />} 
              count={planInfo.limits.listings} 
              label="Listings" 
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <LimitBox 
              icon={<Star size={18} />} 
              count={planInfo.limits.featured} 
              label="Featured" 
              color="text-amber-500"
              bg="bg-amber-50"
            />
            <LimitBox 
              icon={<Users size={18} />} 
              count={planInfo.limits.leads} 
              label="Leads" 
              color="text-emerald-500"
              bg="bg-emerald-50"
            />
          </div>
        </div>

        {/* Available Plans - Professional Cards */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <TrendingUp size={14} className="text-blue-600" />
              <h3 className="text-[12px] font-black text-[#001b4e] uppercase tracking-widest">Upgrade Options</h3>
           </div>

           {plans.map((plan, idx) => {
             const isCurrent = plan.name === currentPlanName;
             return (
               <div 
                 key={plan._id || idx} 
                 className={`bg-white rounded-xl p-5 border transition-all ${isCurrent ? 'border-emerald-500/30 bg-emerald-50/10 shadow-sm' : 'border-slate-100 hover:border-blue-200 shadow-sm'}`}
               >
                 <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                       <h4 className="text-[16px] font-black text-[#001b4e] uppercase tracking-tight truncate leading-tight">{plan.name}</h4>
                       <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mt-1.5">{plan.duration_days} Days Access</p>
                    </div>
                    {isCurrent ? (
                       <div className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Current</div>
                    ) : (
                       <div className="text-right">
                          <div className="text-[20px] font-black text-[#001b4e] tracking-tighter leading-none">₹{plan.price}</div>
                          <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">One Time</div>
                       </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-y-2 mb-5">
                    <FeatureItem label={`${plan.listings_limit === -1 ? 'Unlimited' : plan.listings_limit} Listings`} />
                    <FeatureItem label={`${plan.leads_limit === -1 ? 'Unlimited' : plan.leads_limit} Leads`} />
                    <FeatureItem label={`${plan.featured_listings_limit === -1 ? 'Unlimited' : plan.featured_listings_limit} Featured Ads`} />
                    <FeatureItem label="Premium Support" />
                 </div>

                 {!isCurrent && (
                   <button 
                     onClick={() => handleSubscribe(plan)}
                     className="w-full h-11 bg-[#001b4e] text-white rounded-lg font-black text-[12px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                   >
                     Subscribe Plan <ChevronRight size={14} />
                   </button>
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showSubscribeModal && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star size={32} fill="currentColor" />
              </div>
              <h3 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight mb-2">Join {selectedPlan.name}</h3>
              <p className="text-slate-400 text-[13px] font-bold uppercase tracking-tight opacity-60 leading-relaxed mb-8">Contact our business team to activate your premium seller access.</p>
              <button onClick={() => setShowSubscribeModal(false)} className="w-full py-4 bg-[#001b4e] text-white rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all">Understood</button>
            </motion.div>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} className="absolute inset-0 bg-[#001b4e]/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white rounded-t-3xl p-8 shadow-2xl">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight">Payment History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-50 rounded-full text-slate-300">
                  <X size={20} />
                </button>
              </div>
              <div className="py-20 text-center opacity-30">
                 <History size={64} className="mx-auto mb-4 text-slate-200" />
                 <p className="text-[12px] font-black uppercase tracking-widest">No transaction history</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LimitBox({ icon, count, label, color, bg }) {
  return (
    <div className="text-center">
       <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mx-auto mb-2 border border-white shadow-sm`}>
          {icon}
       </div>
       <div className={`text-[18px] font-black tracking-tighter ${color}`}>{count}</div>
       <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

function FeatureItem({ label }) {
  return (
    <div className="flex items-center gap-2">
       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">{label}</span>
    </div>
  );
}
