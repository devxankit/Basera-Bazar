import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, MessageSquare, 
  ChevronRight, Phone, Loader2, Zap, Filter, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerInquiries() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/partners/enquiries');
      if (res.data.success) {
        setInquiries(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const baseInquiries = inquiries.filter(item => {
    const activeRole = (user?.active_role || user?.partner_type || user?.role || '').toLowerCase();
    const type = (item.enquiry_type || '').toLowerCase();
    
    const roleMap = {
      'property_agent': 'property',
      'service_provider': 'service',
      'supplier': 'supplier',
      'mandi_seller': 'mandi'
    };

    const targetType = roleMap[activeRole];
    if (targetType && type !== targetType) return false;
    return true;
  });

  const filteredInquiries = baseInquiries.filter(item => {
    const matchesSearch = item.user_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.listing_snapshot?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return { label: 'New Lead', className: 'bg-emerald-500 text-white' };
      case 'contacted': return { label: 'Contacted', className: 'bg-blue-600 text-white' };
      case 'closed': return { label: 'Closed', className: 'bg-slate-300 text-white' };
      default: return { label: status, className: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 mt-1">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/partner/home')}
               className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
             >
               <ArrowLeft size={20} />
             </button>
             <h2 className="text-[16px] font-bold text-[#001b4e] uppercase tracking-widest">Market Leads</h2>
          </div>
          <button className="p-1.5 text-slate-300">
             <MoreVertical size={20} />
          </button>
        </div>

        {/* Search Bar - Professional & Compact */}
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by customer name..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[13px] font-bold uppercase tracking-tight outline-none focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-200 placeholder:font-bold"
          />
        </div>
      </div>

      <div className="p-5">
        {/* Filter Tabs - High Density */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          <FilterTab active={filter === 'all'} label="All" count={baseInquiries.length} onClick={() => setFilter('all')} />
          <FilterTab active={filter === 'new'} label="New" count={baseInquiries.filter(i => i.status === 'new').length} onClick={() => setFilter('new')} />
          <FilterTab active={filter === 'contacted'} label="Contacted" count={baseInquiries.filter(i => i.status === 'contacted').length} onClick={() => setFilter('contacted')} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={28} />
            <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Syncing Leads...</span>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
             <MessageSquare size={64} className="text-slate-200 mb-6" />
             <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No inquiries matching<br/>your criteria</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((lead, idx) => {
              const status = getStatusBadge(lead.status);
              return (
                <motion.div 
                  key={lead._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/partner/lead-details/${lead._id}`)}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
                >
                  {/* Lead Top Info */}
                  <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#001b4e] font-bold text-[15px] shadow-sm border border-slate-100">
                           {lead.user_details?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-[#001b4e] leading-tight uppercase tracking-tight">
                            {lead.user_details?.name || 'Customer'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                             <Phone size={10} className="text-blue-500" />
                             <span className="text-slate-400 text-[10px] font-bold tracking-widest">{lead.user_details?.phone || 'NO PHONE'}</span>
                          </div>
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest shadow-sm ${status.className}`}>
                           {status.label}
                        </div>
                        <span className="text-slate-300 text-[9px] font-bold uppercase mt-2 tracking-tighter opacity-60">
                           {new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </span>
                     </div>
                  </div>

                  {/* Lead Item Reference */}
                  <div className="px-4 py-3 flex items-center justify-between bg-white">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50">
                           <Zap size={14} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                           <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-0.5 opacity-60">Interest Subject</div>
                           <h5 className="text-[12px] font-bold text-[#001b4e] uppercase tracking-tight truncate">
                              {lead.listing_snapshot?.title || lead.listing_snapshot?.serviceName || 'Market Inquiry'}
                           </h5>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-200 shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({ active, label, count, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
        active 
          ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-md shadow-blue-900/10' 
          : 'bg-white text-slate-300 border-slate-100 hover:bg-slate-50'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-300'}`}>
        {count}
      </span>
    </button>
  );
}
