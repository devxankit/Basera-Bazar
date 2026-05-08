import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, ChevronRight, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Phone, Building2, Calendar,
  ArrowRight, ShieldCheck, Zap, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
};

export default function ExecutivePartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, approved, pending, rejected

  const fetchPartners = async () => {
    try {
      const res = await api.get('/executive/my-partners');
      if (res.data.success) {
        setPartners(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load partners list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter(p => {
    const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                         (p.business_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.phone?.includes(searchQuery));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'approved') return matchesSearch && p.onboarding_status === 'approved';
    if (filter === 'pending') return matchesSearch && (p.onboarding_status === 'pending_approval' || p.onboarding_status === 'pending');
    if (filter === 'rejected') return matchesSearch && p.onboarding_status === 'rejected';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-32">
      
      {/* Premium Search & Header Section */}
      <div className="sticky top-0 z-40 ultra-glass px-6 pt-10 pb-8 border-b border-white/40 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#081229] rounded-2xl flex items-center justify-center shadow-lg">
            <Users size={22} className="text-[#fa8639]" strokeWidth={2.5} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-[#fa8639] uppercase tracking-[0.25em]">Management</span>
            <h1 className="text-2xl font-medium text-[#181d5f] tracking-tight leading-none">My Network</h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#fa8639]/5 rounded-[1.5rem] blur-xl group-focus-within:bg-[#fa8639]/10 transition-all pointer-events-none" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#fa8639] transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search sellers by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full bg-white/60 border border-white/80 py-5 pl-16 pr-8 rounded-[1.5rem] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-8 focus:ring-[#fa8639]/5 focus:border-[#fa8639]/20 transition-all"
            />
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide px-1">
            {['all', 'approved', 'pending', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-medium uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${
                  filter === f 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 border-slate-900' 
                    : 'bg-white/60 text-slate-400 border-white/80 hover:bg-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 space-y-6 flex-grow relative z-10"
      >
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-white/40 rounded-[2.5rem] border border-white/80 animate-pulse flex flex-col justify-between p-6">
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2 py-1">
                      <div className="w-32 h-4 bg-slate-100 rounded-md" />
                      <div className="w-24 h-3 bg-slate-50 rounded-md" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-slate-100 rounded-full" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/20">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="space-y-1">
                      <div className="w-16 h-2 bg-slate-100 rounded-full" />
                      <div className="w-24 h-3 bg-slate-50 rounded-full" />
                    </div>
                  </div>
                  <div className="w-20 h-4 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPartners.length > 0 ? (
          filteredPartners.map((partner, idx) => (
            <motion.div
              variants={itemVariants}
              key={partner._id}
              className="bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-500"
            >
              {/* Background gradient hint */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 opacity-10 transition-opacity group-hover:opacity-20 ${
                partner.onboarding_status === 'approved' ? 'bg-emerald-500' : 
                partner.onboarding_status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    partner.onboarding_status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                    partner.onboarding_status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Building2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 tracking-tight leading-tight">{partner.business_name || partner.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Phone size={10} className="text-slate-300" />
                      <p className="text-[11px] font-normal text-slate-400 uppercase tracking-widest">{partner.phone}</p>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-[0.15em] border ${
                  partner.onboarding_status === 'approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 
                  partner.onboarding_status === 'rejected' ? 'bg-rose-50/50 border-rose-100 text-rose-600' : 'bg-amber-50/50 border-amber-100 text-amber-600'
                }`}>
                  {partner.onboarding_status === 'pending_approval' ? 'In Review' : partner.onboarding_status}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/40 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${partner.active_subscription_id ? 'bg-[#fa8639] text-white' : 'bg-slate-100 text-slate-300'}`}>
                    {partner.active_subscription_id ? <Zap size={18} fill="currentColor" /> : <Globe size={18} />}
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.2em] leading-none">Membership</p>
                    <p className={`text-[12px] font-medium uppercase tracking-tight ${partner.active_subscription_id ? 'text-[#fa8639]' : 'text-slate-400'}`}>
                      {partner.active_subscription_id ? 'Paid Merchant' : 'Trial Period'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right space-y-0.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar size={10} className="text-slate-300" />
                    <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.2em]">Registered</p>
                  </div>
                  <p className="text-[12px] font-medium text-slate-500">
                    {new Date(partner.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center px-10">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-white/40 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-slate-200 border border-white">
                <Users size={48} strokeWidth={1} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#181d5f] rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Search size={20} />
              </div>
            </div>
            <h4 className="text-xl font-medium text-slate-900 tracking-tight uppercase">Isolation Detected</h4>
            <p className="text-[13px] font-normal text-slate-400 leading-relaxed mt-2 uppercase tracking-wide">Your network index is currently empty. Start onboarding to synchronize records.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
