import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Landmark, ShieldCheck,
  AlertCircle, Loader2, ArrowRight,
  Wallet, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useExecutive } from '../../context/ExecutiveContext';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

export default function ExecutivePayout() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useExecutive();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const balance = data?.profile?.wallet_balance || 0;
    if (Number(withdrawAmount) > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/executive/withdraw', { amount: Number(withdrawAmount) });
      toast.success("Payout request submitted successfully!");
      refetch();
      setTimeout(() => navigate('/executive/wallet'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Payout request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    );
  }

  const profile = data?.profile;
  const balance = profile?.wallet_balance || 0;

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative overflow-x-hidden font-outfit">
      
      {/* Header */}
      <div className="sticky top-0 z-40 ultra-glass px-6 pt-10 pb-6 border-b border-white/40 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/executive/wallet')}
            className="p-3 bg-white/50 backdrop-blur-md rounded-2xl text-slate-900 border border-white hover:bg-white transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-0.5">
            <span className="text-[9px] font-medium text-[#fa8639] uppercase tracking-[0.25em]">Financial Hub</span>
            <h1 className="text-2xl font-medium text-[#181d5f] tracking-tight leading-none">Payout Engine</h1>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-12 space-y-8 grow"
      >
        
        {/* Balance Status Card */}
        <motion.div variants={itemVariants} className="relative">
          <div className="bg-[#081229] rounded-[2.5rem] p-8 overflow-hidden shadow-2xl relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#fa8639]/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
             <div className="relative space-y-1 text-center">
                <div className="flex items-center justify-center gap-2 opacity-50 mb-2">
                   <Wallet size={12} className="text-white" />
                   <span className="text-[10px] font-medium text-white uppercase tracking-[0.2em]">Available for transfer</span>
                </div>
                <h2 className="text-4xl font-medium text-white tracking-tighter">₹{balance.toLocaleString()}</h2>
             </div>
          </div>
        </motion.div>

        {/* Bank Account Overview */}
        <motion.div variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
               <Landmark size={18} className="text-[#fa8639]" />
               <h3 className="text-[10px] font-medium text-slate-900 uppercase tracking-[0.2em]">Destination Account</h3>
             </div>
             <button 
               onClick={() => navigate('/executive/profile')}
               className="text-[9px] font-medium text-[#fa8639] uppercase tracking-[0.1em] border-b border-[#fa8639]/30"
             >
               Edit Info
             </button>
           </div>

           <div className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Building2 size={22} strokeWidth={1.5} />
                 </div>
                 <div>
                    <h4 className="text-[13px] font-medium text-slate-900 uppercase tracking-tight leading-none">
                       {profile?.bank_details?.bank_name || 'Missing Bank Info'}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                       {profile?.bank_details?.account_number ? `XXXX XXXX ${profile.bank_details.account_number.slice(-4)}` : 'Bank details required'}
                    </p>
                 </div>
              </div>

              {!profile?.bank_details?.account_number && (
                 <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-amber-700 leading-relaxed uppercase tracking-tight">
                       Payouts are disabled until bank details are linked. Please update in profile.
                    </p>
                 </div>
              )}
           </div>
        </motion.div>

        {/* Payout Form */}
        <motion.div variants={itemVariants} className="space-y-6 pt-2">
           <div className="space-y-4">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-2 block">Transfer Amount (INR)</label>
              <div className="relative group">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-medium text-slate-300 transition-colors group-focus-within:text-[#181d5f]">₹</span>
                <input 
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/60 backdrop-blur-sm border-2 border-white py-7 pl-16 pr-8 rounded-[2.5rem] text-3xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-8 focus:ring-indigo-600/5 focus:border-[#181d5f]/20 transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 px-2 overflow-x-auto no-scrollbar pb-2">
                 {[500, 1000, 2000, 5000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setWithdrawAmount(amt.toString())}
                      className="whitespace-nowrap px-4 py-2 bg-white/40 border border-white/80 rounded-full text-[10px] font-medium text-slate-600 hover:bg-white transition-all uppercase tracking-widest"
                    >
                       ₹{amt}
                    </button>
                 ))}
                 <button 
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="whitespace-nowrap px-4 py-2 bg-[#fa8639]/10 border border-[#fa8639]/20 rounded-full text-[10px] font-bold text-[#fa8639] hover:bg-[#fa8639]/20 transition-all uppercase tracking-widest"
                 >
                    MAX
                 </button>
              </div>
           </div>

           <div className="pt-4">
              <button 
                onClick={handleWithdraw}
                disabled={isSubmitting || !withdrawAmount || Number(withdrawAmount) > balance || !profile?.bank_details?.account_number}
                className="w-full py-5 bg-[#181d5f] text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-200/50 flex items-center justify-center gap-4 group active:scale-[0.98] transition-all disabled:opacity-30"
              >
                {isSubmitting ? (
                   <Loader2 size={20} className="animate-spin" />
                ) : (
                   <>
                      <span className="text-xs tracking-[0.2em] uppercase">INITIATE BANK SETTLEMENT</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </button>
              <p className="text-center mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                 <ShieldCheck size={12} className="text-emerald-500" /> Secure Encryption • Instant Processing
              </p>
           </div>
        </motion.div>

        {/* Security Warning */}
        <motion.div 
           variants={itemVariants}
           className="p-6 bg-slate-900 rounded-[2.5rem] text-white/80"
        >
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                 <Clock size={18} className="text-[#fa8639]" />
              </div>
              <div>
                 <h5 className="text-[11px] font-bold text-white uppercase tracking-widest">Processing Time</h5>
                 <p className="text-[10px] leading-relaxed mt-1 opacity-60">Most transfers are completed within 30 minutes, though it can take up to 24 hours depending on bank verification cycles.</p>
              </div>
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

const Building2 = ({ size, strokeWidth, className }) => (
   <svg 
     xmlns="http://www.w3.org/2000/svg" 
     width={size} 
     height={size} 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="currentColor" 
     strokeWidth={strokeWidth} 
     strokeLinecap="round" 
     strokeLinejoin="round" 
     className={className}
   >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
   </svg>
);
