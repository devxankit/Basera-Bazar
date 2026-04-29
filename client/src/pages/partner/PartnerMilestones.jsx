import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Package, 
  Gift,
  Loader2,
  Info,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function PartnerMilestones() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [claimed, setClaimed] = useState(false);
  
  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    full_address: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    fetchMilestone();
  }, []);

  const fetchMilestone = async () => {
    try {
      setLoading(true);
      const res = await api.get('/milestones/current');
      setMilestoneData(res.data.data);
    } catch (err) {
      console.error("Error fetching milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/milestones/claim', {
        milestoneId: milestoneData.milestone._id,
        shipping_address: address
      });
      setClaimed(true);
      setShowRewardForm(false);
      alert("Reward claim submitted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to claim reward.");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = milestoneData?.stats || { successful_orders: 0 };
  const milestone = milestoneData?.milestone;
  const progress = (milestone?.target_orders > 0) ? Math.min((stats.successful_orders / milestone.target_orders) * 100, 100) : 0;
  const isEligible = milestone && stats.successful_orders >= milestone.target_orders;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#001b4e]" size={40} />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Trophy size={48} className="text-slate-200 mb-4" />
        <h3 className="text-[#001b4e] font-bold text-[18px] mb-2">Milestones Coming Soon</h3>
        <p className="text-slate-500 text-[14px] mb-6">We're setting up exciting rewards for you. Complete more orders to stay ahead!</p>
        <button onClick={() => navigate('/partner/profile')} className="bg-[#001b4e] text-white px-8 py-3 rounded-xl font-bold text-[14px]">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-[#001b4e] pt-12 pb-24 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex items-center gap-4 relative z-10 mb-8">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white text-[20px] font-bold uppercase tracking-tight">Milestones</h1>
        </div>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-amber-400/30 mb-4 rotate-3">
            <Trophy size={40} />
          </div>
          <h2 className="text-white text-[24px] font-bold mb-1">Rewards Program</h2>
          <p className="text-white/60 text-[13px] font-medium uppercase tracking-widest">Earn physical prizes for your success</p>
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-6">
        {/* Banner Section (Admin Configurable) */}
        {milestone?.banner_url && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-[32px] overflow-hidden shadow-xl shadow-blue-900/10 border-4 border-white"
          >
            <img src={milestone.banner_url} alt="Milestone Reward" className="w-full h-auto block" />
          </motion.div>
        )}

        {/* Progress Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Progress</div>
              <div className="text-[20px] font-bold text-[#001b4e]">{stats.successful_orders} <span className="text-[14px] text-slate-300 font-medium">/ {milestone?.target_orders || '??'} Orders</span></div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-[14px]">
              {Math.min(100, Math.round(progress))}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 bg-[#001b4e] rounded-lg flex items-center justify-center text-white shrink-0">
              <Gift size={16} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#001b4e] mb-0.5">Next Reward: {milestone?.prize_name || 'Physical Prize'}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{milestone?.prize_description || 'Keep delivering successful orders to unlock this exclusive reward!'}</p>
              {milestone?.valid_until && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                   <Calendar size={10} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Ends: {new Date(milestone.valid_until).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {isEligible && !claimed && (
            <button
              onClick={() => setShowRewardForm(true)}
              className="w-full mt-6 bg-amber-400 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Claim Your Prize Now
              <ChevronRight size={18} />
            </button>
          )}

          {claimed && (
            <div className="mt-6 bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-[14px]">
              <CheckCircle2 size={18} />
              Reward Claimed! Check status in profile.
            </div>
          )}
        </div>

        {/* Milestone Info */}
        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[32px] flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-[#001b4e] mb-1">About Milestones</h4>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Successful orders are marked once the customer provides a 6-digit delivery OTP. This ensures fair tracking for all partners.
            </p>
          </div>
        </div>
      </div>

      {/* Reward Fulfillment Modal */}
      <AnimatePresence>
        {showRewardForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden" />
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} />
                </div>
                <h3 className="text-[#001b4e] text-[22px] font-bold mb-2">Delivery Address</h3>
                <p className="text-slate-500 text-[14px]">Where should we send your {milestone?.prize_name}?</p>
              </div>

              <form onSubmit={handleClaim} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Full Name" value={address.full_name} onChange={(val) => setAddress({...address, full_name: val})} />
                  <InputField label="Phone Number" value={address.phone} onChange={(val) => setAddress({...address, phone: val})} />
                  <InputField label="Full Address" value={address.full_address} onChange={(val) => setAddress({...address, full_address: val})} isTextArea={true} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="City" value={address.city} onChange={(val) => setAddress({...address, city: val})} />
                    <InputField label="Pincode" value={address.pincode} onChange={(val) => setAddress({...address, pincode: val})} />
                  </div>
                  <InputField label="State" value={address.state} onChange={(val) => setAddress({...address, state: val})} />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#001b4e] text-white py-4.5 rounded-2xl font-bold text-[15px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowRewardForm(false)}
                    className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-[14px] active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, value, onChange, isTextArea = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {isTextArea ? (
        <textarea 
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] text-[#001b4e] font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
        />
      ) : (
        <input 
          required
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[14px] text-[#001b4e] font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      )}
    </div>
  );
}
