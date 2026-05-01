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
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-3 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Milestones</h2>
        </div>
      </div>

      {!milestone ? (
        <div className="p-8 text-center flex flex-col items-center justify-center py-20 opacity-40">
          <Trophy size={64} className="text-slate-200 mb-6" />
          <h3 className="text-[#001b4e] font-bold text-[18px] uppercase tracking-tight">Coming Soon</h3>
          <p className="text-slate-400 text-[14px] mt-2 max-w-[240px]">We're setting up exciting rewards for you. Complete more orders to stay ahead!</p>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Banner */}
          {milestone?.banner_url && (
            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={milestone.banner_url} alt="" className="w-full h-auto" />
            </div>
          )}

          {/* Progress Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div>
                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Successful Orders</div>
                   <div className="text-[20px] font-black text-[#001b4e] tracking-tighter">{stats.successful_orders} <span className="text-[12px] opacity-20">/ {milestone.target_orders}</span></div>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100/50">
                   <Trophy size={20} />
                </div>
             </div>

             <div className="h-2 bg-slate-50 rounded-full overflow-hidden mb-5 border border-slate-100">
                <div 
                   className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                   style={{ width: `${progress}%` }}
                />
             </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                   <Gift className="text-blue-600 shrink-0" size={16} />
                </div>
                <div>
                   <div className="text-[13px] font-black text-[#001b4e] uppercase tracking-tight">{milestone.prize_name}</div>
                   <p className="text-slate-400 text-[11px] mt-1 font-bold leading-tight">{milestone.prize_description}</p>
                </div>
             </div>

             {isEligible && !claimed && (
               <button 
                 onClick={() => setShowRewardForm(true)}
                 className="w-full mt-5 bg-[#001b4e] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 Claim Reward
                 <ChevronRight size={18} />
               </button>
             )}

             {claimed && (
               <div className="mt-5 bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                 <CheckCircle2 size={16} /> Reward Claimed
               </div>
             )}
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showRewardForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[24px] p-8 shadow-2xl overflow-y-auto max-h-[80vh]">
              <h3 className="text-[#001b4e] text-[18px] font-bold uppercase tracking-tight mb-2">Claim Reward</h3>
              <p className="text-slate-400 text-[12px] font-medium mb-6">Please provide your shipping details for the {milestone?.prize_name}.</p>
              
              <form onSubmit={handleClaim} className="space-y-4 text-left">
                <InputField label="Name" value={address.full_name} onChange={v => setAddress({...address, full_name: v})} />
                <InputField label="Phone" value={address.phone} onChange={v => setAddress({...address, phone: v})} />
                <InputField label="Address" value={address.full_address} onChange={v => setAddress({...address, full_address: v})} isArea />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="City" value={address.city} onChange={v => setAddress({...address, city: v})} />
                  <InputField label="Pincode" value={address.pincode} onChange={v => setAddress({...address, pincode: v})} />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-[#001b4e] text-white py-4 rounded-xl font-bold uppercase tracking-widest mt-4">
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button type="button" onClick={() => setShowRewardForm(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-xl font-bold uppercase tracking-widest">Cancel</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, value, onChange, isArea = false }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">{label}</label>
      {isArea ? (
        <textarea 
          required 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[13px] font-bold text-[#001b4e] outline-none h-24 focus:bg-white focus:border-blue-500/20 transition-all"
        />
      ) : (
        <input 
          required 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[13px] font-bold text-[#001b4e] outline-none focus:bg-white focus:border-blue-500/20 transition-all"
        />
      )}
    </div>
  );
}
