import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Wallet, Search, Filter, 
  ArrowDownLeft, MoreHorizontal, Landmark, Send, Info,
  ExternalLink, UserCheck, ShieldCheck, IndianRupee, ArrowUpRight,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import { getWithdrawals } from '../../services/AdminService';
import { toast } from '../../mockToast';

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getWithdrawals();
      setRequests(data);
    } catch (error) {
      toast.error("Failed to fetch payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (status) => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    try {
      await api.patch(`/admin/withdrawals/${selectedRequest._id}/status`, { 
        status, 
        admin_note: adminNote,
        transaction_id: transactionId
      });
      toast.success(`Payout marked as ${status}`);
      await fetchData();
      setIsModalOpen(false);
      setSelectedRequest(null);
      setAdminNote('');
      setTransactionId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = [
    { 
      header: 'RECIPIENT', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${row.user_type === 'Executive' ? 'bg-indigo-600' : 'bg-amber-600'} flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-100`}>
             {row.bank_details?.account_holder_name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-black text-slate-900 tracking-tight text-[15px]">{row.bank_details?.account_holder_name || 'User'}</p>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md mt-1 inline-block ${
              row.user_type === 'Executive' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {row.user_type}
            </span>
          </div>
        </div>
      )
    },
    { 
      header: 'AMOUNT', 
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-600 font-black">
            <IndianRupee size={16} />
            <span className="text-xl tracking-tighter">{row.amount}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payout Request</p>
        </div>
      )
    },
    { 
      header: 'BANK ACCOUNT', 
      render: (row) => (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 group hover:border-indigo-200 transition-colors">
          <div className="flex items-center gap-2">
            <Building2 size={12} className="text-slate-400" />
            <p className="text-[13px] font-black text-slate-700">{row.bank_details?.bank_name}</p>
          </div>
          <p className="text-[11px] text-slate-500 font-bold tracking-wider ml-5">
             {row.bank_details?.account_number}
          </p>
          <p className="text-[10px] text-indigo-400 font-black tracking-widest ml-5 uppercase">
            IFSC: {row.bank_details?.ifsc_code}
          </p>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => {
        const status = row.status;
        const config = {
          completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2, label: 'PAID' },
          pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock, label: 'PENDING' },
          rejected: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: XCircle, label: 'REJECTED' }
        };
        const { bg, text, border, icon: Icon, label } = config[status] || config.pending;
        
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${bg} ${text} ${border} w-fit`}>
            <Icon size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{(label || 'PENDING')}</span>
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
          className={`group flex items-center justify-center w-11 h-11 rounded-2xl transition-all ${
            row.status === 'pending' 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl shadow-slate-200' 
              : 'bg-slate-50 text-slate-300 border border-slate-100'
          }`}
        >
          <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-10">
      
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Payout Management</h1>
          <p className="text-slate-500 font-medium text-lg">Approve and process manual bank transfers for the field team.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100">
           <div className="px-4 py-2 bg-indigo-50 rounded-xl">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Pending</p>
             <p className="text-lg font-black text-indigo-600 leading-none mt-1">₹{requests.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0)}</p>
           </div>
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
              className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative Header Gradient */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400" />
              
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                  <Landmark size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Process Settlement</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Bank Transfer</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Amount Highlight */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Payout Amount</p>
                    <p className="text-3xl font-black tracking-tighter flex items-baseline gap-1">
                      <span className="text-lg opacity-50">₹</span>
                      {selectedRequest.amount}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beneficiary</p>
                    <p className="text-sm font-black text-slate-900 truncate">{selectedRequest.bank_details?.account_holder_name}</p>
                  </div>
                </div>

                {/* Important Bank Info Alert */}
                <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-[2rem] space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
                    <Info size={16} />
                    <span>Payout Instructions</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      1. Transfer <span className="text-slate-900 font-black">₹{selectedRequest.amount}</span> via IMPS/NEFT/UPI.
                    </p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      2. Note the Bank Reference / UTR Number.
                    </p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                      3. Input the ID below to mark as paid.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Transaction ID / UTR</label>
                    <input 
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. 312567890XXX"
                      className="w-full bg-slate-50 border border-slate-100 py-5 px-6 rounded-2xl text-[15px] font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Settlement Note</label>
                    <textarea 
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Optional remarks..."
                      rows="2"
                      className="w-full bg-slate-50 border border-slate-100 py-5 px-6 rounded-2xl text-[15px] font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => handleAction('rejected')}
                    disabled={isActionLoading}
                    className="flex-grow py-5 bg-rose-50 text-rose-500 font-black rounded-2xl hover:bg-rose-100 transition-all"
                  >
                    REJECT
                  </button>
                  <button 
                    onClick={() => handleAction('completed')}
                    disabled={isActionLoading || !transactionId}
                    className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-30"
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
