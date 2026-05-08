import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, TrendingUp, ArrowUpRight, History, 
  ArrowDownLeft, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Building2, CreditCard, ChevronRight, Zap, ArrowRight,
  TrendingDown, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
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

export default function ExecutiveWallet() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, transRes] = await Promise.all([
        api.get('/executive/dashboard'),
        api.get('/executive/transactions')
      ]);
      if (dashRes.data.success) setData(dashRes.data.data);
      if (transRes.data.success) setTransactions(transRes.data.data);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden pb-32 font-outfit">
        {/* Header Skeleton */}
        <div className="px-6 py-10 border-b border-slate-50 flex gap-4 items-center">
           <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
           <div className="space-y-2">
              <div className="w-20 h-3 bg-slate-50 rounded-lg animate-pulse" />
              <div className="w-32 h-6 bg-slate-100 rounded-lg animate-pulse" />
           </div>
        </div>

        <div className="px-6 pt-8 space-y-8">
          {/* Card Skeleton */}
          <div className="h-56 bg-slate-900/5 rounded-[2.5rem] animate-pulse p-8 flex flex-col justify-between">
             <div className="flex justify-between">
                <div className="space-y-2">
                   <div className="w-24 h-3 bg-slate-200/50 rounded-full" />
                   <div className="w-40 h-10 bg-slate-200/30 rounded-xl" />
                </div>
                <div className="w-14 h-14 bg-slate-200/40 rounded-2xl" />
             </div>
             <div className="flex gap-4">
                <div className="flex-[2] h-14 bg-slate-200/40 rounded-2xl" />
                <div className="flex-1 h-14 bg-slate-200/40 rounded-2xl" />
             </div>
          </div>

          {/* Account Skeleton */}
          <div className="h-28 bg-slate-50 rounded-[2.5rem] animate-pulse flex items-center px-6 gap-5">
             <div className="w-14 h-14 bg-slate-100 rounded-[1.5rem]" />
             <div className="flex-1 space-y-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full" />
                <div className="w-40 h-4 bg-slate-100 rounded-md" />
             </div>
          </div>

          {/* List Skeleton */}
          <div className="space-y-4 pt-4">
             <div className="w-32 h-4 bg-slate-100 rounded-md mb-6" />
             {[1, 2, 3].map(i => (
               <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse px-5 flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                     <div className="w-32 h-4 bg-slate-100 rounded-md" />
                     <div className="w-24 h-2 bg-slate-100 rounded-full" />
                  </div>
                  <div className="w-16 h-8 bg-slate-100 rounded-xl" />
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-32">
      
      {/* Premium Header */}
      <div className="sticky top-0 z-40 ultra-glass px-6 pt-10 pb-6 border-b border-white/40 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#081229] rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet size={22} className="text-[#fa8639]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-[#fa8639] uppercase tracking-[0.25em]">Financial Hub</span>
            <h1 className="text-2xl font-medium text-[#181d5f] tracking-tight leading-none">Capital Vault</h1>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 space-y-8 flex-grow relative z-10"
      >
        
        {/* Master Balance Card — Redesigned */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#181d5f] via-[#252b75] to-[#081229] rounded-[2.5rem] shadow-2xl shadow-slate-200 group-hover:scale-[1.01] transition-transform duration-500" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay rounded-[2.5rem]" />
          
          <div className="relative p-8 space-y-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 opacity-50">
                  <DollarSign size={12} className="text-white" />
                  <span className="text-[10px] font-medium text-white uppercase tracking-[0.2em]">Liquid Assets</span>
                </div>
                <h2 className="text-4xl font-medium text-white tracking-tighter">₹{profile?.wallet_balance?.toLocaleString() || 0}</h2>
              </div>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-inner">
                <CreditCard size={24} strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="flex-[2] py-4.5 bg-[#fa8639] text-white font-medium rounded-2xl shadow-xl hover:bg-orange-500 active:scale-[0.97] transition-all flex items-center justify-center gap-3 group"
              >
                <span className="text-[11px] tracking-[0.1em]">REQUEST PAYOUT</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex-1 px-5 py-4.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-center">
                <span className="text-[8px] font-medium text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Lifetime</span>
                <span className="text-[15px] font-medium text-white tracking-tight">₹{profile?.total_earnings?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank Account Info — Ultra Glass */}
        <motion.div variants={itemVariants}>
          <button 
            onClick={() => navigate('/executive/profile')}
            className="w-full bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-sm flex items-center gap-5 hover:bg-white transition-all duration-500 group"
          >
            <div className="w-14 h-14 bg-orange-50 text-[#fa8639] rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Building2 size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-grow text-left">
              <span className="text-[9px] font-medium text-[#fa8639] uppercase tracking-[0.2em]">Settlement Account</span>
              <h3 className="text-base font-medium text-slate-900 leading-tight mt-0.5">
                {profile?.bank_details?.bank_name || 'Missing Bank Info'}
              </h3>
              <p className="text-[11px] font-normal text-slate-400 mt-0.5">
                {profile?.bank_details?.account_number ? `XXXX XXXX ${profile.bank_details.account_number.slice(-4)}` : 'Link bank to enable payouts'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <ChevronRight size={18} />
            </div>
          </button>
        </motion.div>

        {/* Transaction History — Premium List */}
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History size={18} className="text-[#fa8639]" />
              <h3 className="text-xs font-medium text-slate-900 uppercase tracking-[0.2em]">Activity Log</h3>
            </div>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.15em]">Real-time update</span>
          </motion.div>

          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => (
                <motion.div
                  variants={itemVariants}
                  key={tx._id}
                  className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] border border-white/80 shadow-sm flex items-center gap-5 hover:bg-white transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                    tx.direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {tx.direction === 'credit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-[13px] font-medium text-slate-900 tracking-tight leading-tight uppercase">
                      {tx.type === 'executive_commission' ? 'Network Commission' : 
                       tx.type === 'executive_withdrawal' ? 'Vault Payout' : tx.type.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-medium tracking-tighter ${
                      tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === 'success' ? 'bg-emerald-500' : 
                        tx.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                      <span className={`text-[8px] font-medium uppercase tracking-widest ${
                        tx.status === 'success' ? 'text-emerald-500' : 
                        tx.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center">
                  <History size={40} strokeWidth={1} />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em]">Zero Log Entries</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Withdrawal Bottom Sheet — Matching Dashboard Style */}
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
                <h2 className="text-3xl font-medium text-[#181d5f] tracking-tighter">Payout Engine</h2>
                <p className="text-[10px] font-medium text-[#fa8639] uppercase tracking-[0.3em]">Instant Bank Settlement</p>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-[2.5rem] text-center border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-2">Maximum Transfer</p>
                  <p className="text-4xl font-medium text-slate-900 tracking-tighter">₹{profile?.wallet_balance?.toLocaleString() || 0}</p>
                </div>

                <div className="space-y-4 px-2">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-2">Transfer Amount (INR)</label>
                  <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-medium text-slate-300 transition-colors group-focus-within:text-indigo-600">₹</span>
                    <input 
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50/50 border-2 border-slate-100 py-7 pl-16 pr-8 rounded-3xl text-3xl font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowWithdrawModal(false)} className="flex-grow py-5 bg-slate-100 text-slate-500 font-medium rounded-[2rem] hover:bg-slate-200 active:scale-[0.98] transition-all text-xs tracking-widest">CANCEL</button>
                  <button 
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) > profile.wallet_balance}
                    className="flex-[2] py-5 bg-[#181d5f] text-white font-medium rounded-[2rem] shadow-xl shadow-slate-100 active:scale-[0.98] transition-all disabled:opacity-30 text-xs tracking-widest"
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
