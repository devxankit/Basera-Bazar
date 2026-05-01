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
  ShieldAlert,
  ArrowLeft
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
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Account Summary</h2>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Penalty Due Card */}
        <div className="bg-[#001b4e] rounded-[24px] p-8 text-center text-white shadow-xl shadow-blue-900/20">
           <div className="text-[12px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Penalty Due</div>
           <div className="text-[48px] font-black tracking-tight flex items-baseline justify-center gap-1">
              <span className="text-[24px] opacity-40">₹</span>
              {stats?.penalty_due || '0'}
           </div>
           <div className={`inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full border border-white/10 ${stats?.penalty_due > 0 ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${stats?.penalty_due > 0 ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {stats?.penalty_due > 0 ? 'Pending Settlement' : 'No Penalties Recorded'}
              </span>
           </div>
        </div>

        {/* Info Section */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-start gap-4">
           <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
           </div>
           <div>
              <h3 className="text-[15px] font-bold text-[#001b4e] uppercase tracking-tight">About Penalties</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed mt-1 font-medium">
                A penalty equal to the booking token is charged whenever you cancel an active lead. These dues must be settled with the platform admin.
              </p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="text-[20px] font-bold text-[#001b4e]">{stats?.total_orders || 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Count</div>
           </div>
           <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="text-[20px] font-bold text-[#001b4e]">100%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Success Rate</div>
           </div>
        </div>
      </div>
    </div>
  );
}
