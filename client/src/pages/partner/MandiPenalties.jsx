import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  Clock, 
  CheckCircle2, 
  IndianRupee,
  History,
  TrendingDown,
  ChevronRight,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function MandiPenalties() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPenaltyData();
  }, []);

  const fetchPenaltyData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mandi/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header Card */}
      <div className="bg-[#001b4e] pt-12 pb-32 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
        <div className="flex items-center justify-between relative z-10 mb-8">
           <h1 className="text-white text-[24px] font-bold">Account Summary</h1>
           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
              <ShieldAlert size={20} />
           </div>
        </div>

        <div className="relative z-10 text-center py-4">
           <p className="text-white/60 text-[14px] font-medium uppercase tracking-widest mb-1">Total Penalty Due</p>
           <h2 className={`text-[48px] font-bold flex items-baseline justify-center gap-2 ${stats?.penalty_due > 0 ? 'text-rose-400' : 'text-white'}`}>
             <span className="opacity-40 text-[24px]">₹</span>
             {stats?.penalty_due || '0'}
           </h2>
           <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${stats?.penalty_due > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-white/80 text-[12px] font-medium">
                {stats?.penalty_due > 0 ? 'Pending Settlement' : 'No Penalties Recorded'}
              </span>
           </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-6">
        {/* Warning Info */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex gap-4">
           <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
              <AlertCircle size={24} />
           </div>
           <div>
              <h3 className="text-[17px] font-bold text-[#001b4e]">About Penalties</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed mt-1">
                A penalty equal to the booking token is charged whenever you cancel an active lead. These dues must be settled with the platform admin.
              </p>
           </div>
        </div>

        {/* Action button (placeholder for paying penalty if needed, or just info) */}
        <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-4">
           <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-indigo-600" />
              <span className="text-[13px] font-black text-indigo-900 uppercase tracking-wide">Performance Tracking</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                 <div className="text-[18px] font-bold text-[#001b4e] truncate">{stats?.total_orders || 0}</div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Lead Count</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                 <div className="text-[18px] font-bold text-[#001b4e] truncate">100%</div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Success Rate</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
