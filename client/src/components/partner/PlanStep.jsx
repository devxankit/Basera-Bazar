import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, ArrowLeft, BadgePercent, Gift, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function PlanStep({ selectedRole, selectedPlan, onSelect, onNext, onBack }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [offerActive, setOfferActive] = useState(false);
  const [promotionalBanner, setPromotionalBanner] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, offerRes] = await Promise.all([
        api.get(`/admin/subscriptions/plans?role=${selectedRole}&active_only=true`),
        api.get('/admin/system/offers')
      ]);

      if (plansRes.data.success) {
        // Standardize plans and add the free trial at the top
        const dbPlans = plansRes.data.data;
        
        // Fetch trial config if available, else use defaults
        const trialConfig = offerRes.data.data?.FREE_TRIAL_CONFIG || { duration_days: 30, listings_limit: 1, featured_listings_limit: 0 };
        
        const freeTrial = {
          _id: 'free_trial',
          name: '30-Day Free Trial',
          price: 0,
          duration_days: trialConfig.duration_days,
          tag: 'GET STARTED',
          tagColor: 'bg-green-100 text-green-600',
          features: [
            `${trialConfig.listings_limit} Active Listing`,
            `${trialConfig.featured_listings_limit} Featured Listings`,
            'Standard Support',
            'Platform Access'
          ]
        };

        setPlans([freeTrial, ...dbPlans]);
      }

      if (offerRes.data.success) {
        setOfferActive(offerRes.data.data?.OFFER_1_PLUS_1?.is_active || false);
        const promoBanner = offerRes.data.data?.PROMOTIONAL_BANNER;
        if (promoBanner && promoBanner.is_active) {
            setPromotionalBanner(promoBanner.image_url || null);
        } else {
            setPromotionalBanner(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch plans or offers:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm">Fetching available plans...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-Inter pb-10">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Select Your Plan</h1>
          <p className="text-slate-500 text-sm font-bold mt-0.5">Scale your business with the right subscription</p>
        </div>
      </div>

      {offerActive && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Gift size={24} />
            </div>
            <div>
              <h4 className="font-black text-lg">Special Offer: 1 + 1 Free!</h4>
              <p className="text-white/80 text-xs font-bold leading-relaxed">
                Choose any premium plan and get one additional role category for FREE! (Limited time only)
              </p>
            </div>
          </div>
          <Zap className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12" />
        </motion.div>
      )}

      {promotionalBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-3xl overflow-hidden shadow-xl"
        >
          <img 
            src={promotionalBanner} 
            alt="Special Offer" 
            className="w-full object-cover"
            style={{ maxHeight: '180px' }}
          />
        </motion.div>
      )}

      <div className="space-y-5">
        {plans.map((plan) => (
          <motion.div
            key={plan._id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(plan._id, plan)}
            className={`relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${
              selectedPlan === plan._id 
                ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{plan.name}</h3>
                  {plan.tag && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${plan.tagColor || 'bg-indigo-100 text-indigo-600'}`}>
                      {plan.tag}
                    </span>
                  )}
                </div>
                {plan._id !== 'free_trial' && offerActive && (
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <Gift size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Eligible for 1+1 Offer</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {plan.price === 0 ? 'FREE' : `₹${plan.price}`}
                </div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{plan.duration_days} Days</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="text-green-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 truncate">{feature}</span>
                </div>
              ))}
              {/* If it's a DB plan, we can also show limits */}
              {plan.listings_limit !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Zap size={12} className="text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {plan.listings_limit === -1 ? 'Unlimited' : plan.listings_limit} Listings
                  </span>
                </div>
              )}
            </div>

            {selectedPlan === plan._id && (
              <motion.div 
                layoutId="plan-selected"
                className="absolute -right-2 -top-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 border-4 border-white"
              >
                <CheckCircle2 size={16} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all"
        >
          Back
        </button>
        <button
          disabled={!selectedPlan}
          onClick={onNext}
          className={`flex-[2] py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
            selectedPlan 
              ? 'bg-slate-900 text-white shadow-slate-200' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          {selectedPlan === 'free_trial' ? 'Start Free Trial' : 'Continue to Payment'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
