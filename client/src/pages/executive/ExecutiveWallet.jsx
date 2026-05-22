import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ArrowUpRight, History,
  ArrowDownLeft, Building2, ChevronRight, ArrowRight,
  IndianRupee, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useExecutive } from '../../context/ExecutiveContext';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

export default function ExecutiveWallet() {
  const navigate = useNavigate();
  const { data, loading: dashLoading, refetch } = useExecutive();

  const { data: txRaw, isLoading: txLoading, refetch: refetchTx, error: txError } = useQuery({
    queryKey: ['executiveTransactions'],
    queryFn: () => api.get('/executive/transactions').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (txError) toast.error('Failed to load transaction history');
  }, [txError]);

  const transactions = txRaw?.success ? txRaw.data : [];

  const handleRefresh = () => { refetch(); refetchTx(); };

  const loading = dashLoading || txLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden pb-32 font-outfit">
        <div className="px-6 py-10 border-b border-slate-50 flex gap-4 items-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="w-20 h-3 bg-slate-50 rounded-lg animate-pulse" />
            <div className="w-32 h-6 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="px-6 pt-8 space-y-8">
          <div className="h-56 bg-slate-900/5 rounded-[2.5rem] animate-pulse p-8 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="w-24 h-3 bg-slate-200/50 rounded-full" />
                <div className="w-40 h-10 bg-slate-200/30 rounded-xl" />
              </div>
              <div className="w-14 h-14 bg-slate-200/40 rounded-2xl" />
            </div>
            <div className="flex gap-4">
              <div className="flex-2 h-14 bg-slate-200/40 rounded-2xl" />
              <div className="flex-1 h-14 bg-slate-200/40 rounded-2xl" />
            </div>
          </div>
          <div className="h-28 bg-slate-50 rounded-[2.5rem] animate-pulse flex items-center px-6 gap-5">
            <div className="w-14 h-14 bg-slate-100 rounded-3xl" />
            <div className="flex-1 space-y-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full" />
              <div className="w-40 h-4 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="space-y-4 pt-4">
            <div className="w-32 h-4 bg-slate-100 rounded-md mb-6" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-50 rounded-4xl animate-pulse px-5 flex items-center gap-5">
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

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-medium text-slate-900">Capital Vault</h1>
        </div>
        <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-6 space-y-6 grow relative z-10"
      >
        {/* Balance Card */}
        <motion.div variants={itemVariants} className="relative overflow-hidden p-6 rounded-2xl bg-slate-900 text-white shadow-xl">
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Available Balance</p>
                <h2 className="text-3xl font-medium tracking-tight">₹{profile?.wallet_balance?.toLocaleString() || 0}</h2>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <IndianRupee size={22} className="text-[#fa8639]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/executive/payout')}
                className="flex-2 py-4 bg-[#fa8639] text-white font-medium rounded-xl shadow-lg hover:bg-orange-500 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xs uppercase tracking-wider">Request Payout</span>
                <ArrowRight size={14} />
              </button>
              <div className="flex-1 px-4 py-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-[8px] text-white/40 uppercase mb-1">Lifetime</p>
                <p className="text-sm font-medium">₹{profile?.total_earnings?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Settlement Account */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => navigate('/executive/profile')}
            className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all group"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Building2 size={20} />
            </div>
            <div className="grow text-left">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Payout Account</p>
              <h3 className="text-sm font-medium text-slate-900 leading-tight">
                {profile?.bank_details?.bank_name || 'Link Bank Account'}
              </h3>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </motion.div>

        {/* Activity Log */}
        <div className="space-y-4">
          <motion.div variants={itemVariants} className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Recent Activity</h3>
            <div className="h-px grow bg-slate-100 ml-4" />
          </motion.div>
          <div className="space-y-2.5">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <motion.div
                  variants={itemVariants}
                  key={tx._id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.direction === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                  }`}>
                    {tx.is_withdrawal
                      ? <ArrowUpRight size={18} />
                      : (tx.direction === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)}
                  </div>
                  <div className="grow">
                    <h4 className="text-[13px] font-medium text-slate-900 leading-tight">
                      {tx.type === 'executive_commission' ? 'Earning: Partner'
                        : tx.type === 'executive_withdrawal' ? 'Payout Request'
                        : tx.type.replace('_', ' ')}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' • '}
                      {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <div className={`w-1 h-1 rounded-full ${
                        tx.status === 'success' ? 'bg-emerald-500'
                          : tx.status === 'pending' ? 'bg-amber-500 animate-pulse'
                          : 'bg-rose-500'
                      }`} />
                      <span className={`text-[9px] font-medium uppercase tracking-wider ${
                        tx.status === 'success' ? 'text-emerald-500'
                          : tx.status === 'pending' ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <History size={32} className="mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[10px] font-medium uppercase tracking-widest">No transaction log</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
