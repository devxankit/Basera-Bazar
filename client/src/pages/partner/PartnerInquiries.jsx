import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  ArrowLeft,
  Search,
  MessageSquare,
  User,
  Calendar,
  ChevronRight,
  Clock,
  Phone,
  Mail,
  MoreVertical,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function PartnerInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, new, contacted

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

  const filteredInquiries = inquiries.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'contacted': return 'bg-green-50 text-green-600 border-green-100';
      case 'closed': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      {/* Mobile Shell */}
      <div className="w-full max-w-[500px] bg-[#f8fafc] min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-50 sticky top-0 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/partner/home')}
                className="p-2 -ml-2 text-[#001b4e] active:scale-95 transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-[20px] font-bold text-[#001b4e]">Manage Leads</h2>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Inbox size={20} />
            </div>
          </div>

          {/* Search Bar - Aesthetic Only for now */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or property..."
              className="w-full h-12 bg-slate-50 rounded-2xl pl-11 pr-4 text-[14px] font-medium border border-transparent focus:border-blue-200 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
             <FilterBtn active={filter === 'all'} label="All Leads" onClick={() => setFilter('all')} count={inquiries.length} />
             <FilterBtn active={filter === 'new'} label="New" onClick={() => setFilter('new')} count={inquiries.filter(i => i.status === 'new').length} />
             <FilterBtn active={filter === 'contacted'} label="Contacted" onClick={() => setFilter('contacted')} count={inquiries.filter(i => i.status === 'contacted').length} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Fetching your leads...</p>
             </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 text-slate-200">
                 <MessageSquare size={48} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-600 mb-2">No {filter === 'all' ? '' : filter} leads found</h3>
              <p className="text-slate-400 text-[14px] max-w-[240px]">
                 New inquiries from customers will automatically appear here.
              </p>
            </div>
          ) : (
            filteredInquiries.map((lead) => (
              <motion.div 
                key={lead._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/partner/lead-details/${lead._id}`)}
                className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                       <User size={22} />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-[#001b4e] leading-tight">
                        {lead.user_details?.name || 'Potential Customer'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-medium mt-0.5">
                        <Clock size={12} />
                        {new Date(lead.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(lead.status)}`}>
                    {lead.status}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Interested In</div>
                  <div className="text-[14px] font-bold text-[#001b4e] line-clamp-1">
                    {lead.listing_snapshot?.title || lead.listing_snapshot?.serviceName || 'Property Listing'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] font-bold text-blue-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <MessageSquare size={14} />
                    </div>
                    <span>View Request</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function FilterBtn({ active, label, onClick, count }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-[13px] font-bold transition-all flex items-center gap-2 border ${
        active 
          ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-lg shadow-blue-900/20' 
          : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    </button>
  );
}
