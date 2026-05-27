import React, { useState } from 'react';
import {
  ArrowLeft, Search, MessageSquare,
  ChevronRight, Phone, Loader2, Zap, Megaphone, Package, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerInquiries() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('enquiries'); // 'enquiries' | 'broadcasts'
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: enquiriesRaw, isLoading: enquiriesLoading } = useQuery({
    queryKey: ['partnerEnquiries'],
    queryFn: () => api.get('/partners/enquiries').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const { data: broadcastsRaw, isLoading: broadcastsLoading } = useQuery({
    queryKey: ['partnerBroadcasts'],
    queryFn: () => api.get('/leads/partner').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const loading = enquiriesLoading || broadcastsLoading;
  const inquiries = enquiriesRaw?.success ? enquiriesRaw.data : [];
  const broadcasts = broadcastsRaw?.success ? broadcastsRaw.data : [];

  const q = searchQuery.toLowerCase();

  const baseInquiries = inquiries.filter(item => {
    const activeRole = (user?.active_role || user?.partner_type || user?.role || '').toLowerCase();
    const type = (item.enquiry_type || '').toLowerCase();
    const roleMap = { property_agent: 'property', service_provider: 'service', supplier: 'supplier', mandi_seller: 'mandi' };
    const targetType = roleMap[activeRole];
    if (targetType && type !== targetType) return false;
    return true;
  });

  const filteredInquiries = baseInquiries.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (!q) return true;
    return (
      item.user_details?.name?.toLowerCase().includes(q) ||
      item.listing_snapshot?.title?.toLowerCase().includes(q) ||
      item.user_details?.phone?.includes(q)
    );
  });

  const filteredBroadcasts = broadcasts.filter(item => {
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.phone?.includes(q) ||
      item.products?.some(p => p.item_name?.toLowerCase().includes(q)) ||
      item.delivery_location?.district?.toLowerCase().includes(q)
    );
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
        <div className="flex items-center gap-3 mb-4 mt-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-bold text-[#001b4e] uppercase tracking-widest">Market Leads</h2>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, item…"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[13px] font-medium outline-none focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setTab('enquiries')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border ${tab === 'enquiries' ? 'bg-[#001b4e] text-white border-[#001b4e]' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <Zap size={11} /> Enquiries
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${tab === 'enquiries' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{baseInquiries.length}</span>
          </button>
          <button
            onClick={() => setTab('broadcasts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border ${tab === 'broadcasts' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            <Megaphone size={11} /> Broadcasts
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${tab === 'broadcasts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{broadcasts.length}</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Enquiry status filter — only shown on enquiries tab */}
        {tab === 'enquiries' && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5 pb-1">
            <FilterTab active={filter === 'all'} label="All" count={baseInquiries.length} onClick={() => setFilter('all')} />
            <FilterTab active={filter === 'new'} label="New" count={baseInquiries.filter(i => i.status === 'new').length} onClick={() => setFilter('new')} />
            <FilterTab active={filter === 'contacted'} label="Contacted" count={baseInquiries.filter(i => i.status === 'contacted').length} onClick={() => setFilter('contacted')} />
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={28} />
            <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Syncing Leads...</span>
          </div>
        ) : tab === 'enquiries' ? (
          filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <MessageSquare size={64} className="text-slate-200 mb-6" />
              <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No enquiries matching<br />your criteria</h3>
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
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
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
          )
        ) : (
          /* ── BROADCAST LEADS TAB ── */
          filteredBroadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Megaphone size={64} className="text-slate-200 mb-6" />
              <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No broadcast leads<br />in your area yet</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBroadcasts.map((lead, idx) => (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden"
                >
                  {/* Header row */}
                  <div className="px-4 py-3 bg-orange-50/60 border-b border-orange-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-500 font-bold text-[15px] shadow-sm border border-orange-100">
                        {lead.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#001b4e] leading-tight">{lead.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone size={10} className="text-orange-500" />
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest">
                            {lead.limitReached ? lead.phone : lead.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-300 text-[9px] font-bold uppercase">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'N/A'}
                    </span>
                  </div>

                  {/* Products list */}
                  <div className="px-4 py-3 space-y-1.5">
                    {(lead.products || []).slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Package size={11} className="text-orange-400 shrink-0" />
                        <span className="text-[12px] font-semibold text-[#001b4e] truncate">{p.item_name}</span>
                        {p.quantity && (
                          <span className="text-[10px] text-slate-400 ml-auto shrink-0">{p.quantity} {p.unit}</span>
                        )}
                      </div>
                    ))}
                    {(lead.products || []).length > 3 && (
                      <span className="text-[10px] text-slate-400">+{lead.products.length - 3} more items</span>
                    )}
                  </div>

                  {/* Location + contact CTA */}
                  <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-slate-400" />
                      <span className="text-[11px] text-slate-500 font-medium">
                        {lead.delivery_location?.district}, {lead.delivery_location?.state}
                      </span>
                    </div>
                    {!lead.limitReached ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone size={11} /> Call Now
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Upgrade to call</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
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
