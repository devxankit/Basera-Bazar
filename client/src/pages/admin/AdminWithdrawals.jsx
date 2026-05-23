import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Wallet, Search, Filter,
  ArrowDownLeft, MoreHorizontal, Landmark, Send, Info,
  ExternalLink, UserCheck, ShieldCheck, IndianRupee, ArrowUpRight,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import { toast } from '../../mockToast';

import Skeleton from '../../components/common/Skeleton';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useScrollLock(isModalOpen);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: () => api.get('/admin/withdrawals').then(r => r.data?.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/admin/withdrawals/${id}/status`, {
        status,
        admin_note: adminNote,
        transaction_id: transactionId,
      }).then(r => r.data),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      toast.success(`Payout marked as ${status}`);
      setIsModalOpen(false);
      setSelectedRequest(null);
      setAdminNote('');
      setTransactionId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const isActionLoading = actionMutation.isPending;

  const handleAction = (status) => {
    if (!selectedRequest) return;
    actionMutation.mutate({ id: selectedRequest._id, status });
  };

  const columns = [
    { 
      header: 'RECIPIENT', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${row.user_type === 'Executive' ? 'bg-indigo-600' : 'bg-amber-600'} flex items-center justify-center text-white font-black text-sm shadow-sm`}>
             {row.bank_details?.account_holder_name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-900 tracking-tight text-[14px]">{row.bank_details?.account_holder_name || 'User'}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.user_type}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'AMOUNT', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-900 font-black">
          <IndianRupee size={14} className="text-emerald-500" />
          <span className="text-base tracking-tight">{row.amount.toLocaleString()}</span>
        </div>
      )
    },
    { 
      header: 'BANK ACCOUNT', 
      render: (row) => (
        <div className="flex flex-col">
          <p className="text-[13px] font-bold text-slate-700 leading-none">{row.bank_details?.bank_name}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase">
            AC: {row.bank_details?.account_number} • {row.bank_details?.ifsc_code}
          </p>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => {
        const status = row.status;
        const config = {
          completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2, label: 'SETTLED' },
          pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock, label: 'PENDING' },
          rejected: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: XCircle, label: 'REJECTED' }
        };
        const { bg, text, border, icon: Icon, label } = config[status] || config.pending;
        
        return (
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${bg} ${text} ${border} w-fit`}>
            <Icon size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
          </div>
        );
      }
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <button 
          onClick={() => {
            setSelectedRequest(row);
            setIsModalOpen(true);
          }}
          disabled={row.status !== 'pending'}
          className={`p-2 rounded-xl transition-all ${
            row.status === 'pending' 
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm' 
              : 'bg-slate-50 text-slate-300'
          }`}
          title="Process Payout"
        >
          <ArrowUpRight size={18} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Payout Management</h1>
          <p className="text-slate-500 font-medium text-lg">Approve and process manual bank transfers for the field team.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           {loading ? (
             <Skeleton className="h-12 w-32 rounded-xl" />
           ) : (
             <div className="px-5 py-2 bg-indigo-50 rounded-xl">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Total Pending</p>
               <p className="text-xl font-black text-indigo-600 mt-1">₹{requests.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0).toLocaleString()}</p>
             </div>
           )}
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={requests} 
        loading={loading} 
        onSearch={setSearchTerm}
        searchPlaceholder="Search by account holder..."
      />

      {/* Process Payout Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isActionLoading && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Process Settlement</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manual Bank Transfer</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Request ID</p>
                  <p className="text-xs font-bold text-slate-900 tabular-nums">#{selectedRequest._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payout Amount</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-400">₹</span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">{selectedRequest.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beneficiary</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedRequest.bank_details?.account_holder_name}</p>
                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5 uppercase tracking-tighter">{selectedRequest.bank_details?.bank_name}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Transaction ID / UTR</label>
                    <div className="relative">
                       <Send size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input 
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 312567890XXX"
                        className="w-full bg-slate-50 border border-slate-100 py-5 pl-12 pr-6 rounded-2xl text-[15px] font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleAction('rejected')}
                    disabled={isActionLoading}
                    className="flex-1 py-4.5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all text-xs tracking-widest"
                  >
                    REJECT
                  </button>
                  <button 
                    onClick={() => handleAction('completed')}
                    disabled={isActionLoading || !transactionId}
                    className="flex-[2] py-4.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-30 text-xs tracking-widest"
                  >
                    {isActionLoading ? 'PROCESSING...' : 'MARK AS SETTLED'}
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
