import React, { useState } from 'react';
import {
  Users, Search, Filter, Phone, Building2, Calendar,
  Zap, Globe, X, MapPin, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, ArrowRight, Tag, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
};

function daysUntilExpiry(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ endsAt, status }) {
  if (status === 'expired') return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
      <AlertTriangle size={10} /> Expired
    </span>
  );
  const days = daysUntilExpiry(endsAt);
  if (days === null) return null;
  if (days <= 7) return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
      <AlertTriangle size={10} /> {days}d left
    </span>
  );
  if (days <= 30) return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
      <Clock size={10} /> {days}d left
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
      <CheckCircle2 size={10} /> {days}d left
    </span>
  );
}

function PartnerDetailModal({ partnerId, onClose }) {
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['executivePartnerDetail', partnerId],
    queryFn: () => api.get(`/executive/my-partners/${partnerId}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!partnerId,
    onError: () => toast.error('Failed to load partner details'),
  });

  const partner = rawData?.success ? rawData.data : null;

  const roleLabel = (role) => ({
    service_provider: 'Service Provider',
    property_agent: 'Property Agent',
    supplier: 'Supplier',
    mandi_seller: 'Mandi Seller'
  }[role] || role);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-white rounded-t-[2.5rem] max-h-[90vh] overflow-y-auto pb-10"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-5 w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
          <X size={18} />
        </button>

        {loading ? (
          <div className="px-6 py-10 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : partner ? (
          <div className="px-6 pt-2 pb-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#081229] rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-[#fa8639]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-slate-900 truncate">{partner.business_name || partner.name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{partner.name}</p>
                <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-[0.15em] border ${
                  partner.onboarding_status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  partner.onboarding_status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                  'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  {partner.onboarding_status === 'pending_approval' ? 'In Review' : partner.onboarding_status}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                <p className="text-base font-semibold text-slate-900">{partner.phone}</p>
              </div>
              <a
                href={`tel:${partner.phone}`}
                className="flex items-center gap-2 bg-[#fa8639] text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-200"
              >
                <Phone size={16} /> Call Now
              </a>
            </div>

            {/* Roles */}
            {partner.roles?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Partner Type</p>
                <div className="flex flex-wrap gap-2">
                  {partner.roles.map(role => (
                    <span key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181d5f]/5 text-[#181d5f] rounded-xl text-[11px] font-medium border border-[#181d5f]/10">
                      <Tag size={10} /> {roleLabel(role)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Address */}
            {(partner.address || partner.city || partner.state) && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={10} /> Address
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {[partner.address, partner.city, partner.state, partner.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Subscription */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Subscription</p>
              {partner.subscription ? (
                <div className="bg-gradient-to-br from-[#181d5f] to-[#0f1340] rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-[#fa8639]" fill="#fa8639" />
                      <span className="font-semibold text-base">{partner.subscription.plan_snapshot?.name || 'Paid Plan'}</span>
                    </div>
                    <ExpiryBadge endsAt={partner.subscription.ends_at} status={partner.subscription.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Started</p>
                      <p className="text-[12px] font-medium text-white/80">
                        {partner.subscription.starts_at ? new Date(partner.subscription.starts_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Expires</p>
                      <p className="text-[12px] font-medium text-white/80">
                        {partner.subscription.ends_at ? new Date(partner.subscription.ends_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-[12px] font-medium text-white/80">₹{partner.subscription.plan_snapshot?.price ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[12px] font-medium text-white/80 capitalize">{partner.subscription.status}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                    <Globe size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">No Active Subscription</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Contact partner to subscribe</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subscription History */}
            {partner.subscriptionHistory?.length > 1 && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Subscription History</p>
                <div className="space-y-2">
                  {partner.subscriptionHistory.slice(0, 5).map((sub, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl">
                      <span className="text-[12px] font-medium text-slate-700">{sub.plan_snapshot?.name || 'Plan'}</span>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">
                          {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </p>
                        <span className={`text-[9px] font-medium uppercase ${sub.status === 'active' ? 'text-emerald-500' : sub.status === 'expired' ? 'text-rose-400' : 'text-slate-400'}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onboarded Date */}
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={12} />
              <p className="text-[11px]">
                Onboarded on {new Date(partner.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-slate-400">Partner not found.</div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ExecutivePartners() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  const { data: rawData, isLoading: loading, refetch: fetchPartners } = useQuery({
    queryKey: ['executiveMyPartners'],
    queryFn: () => api.get('/executive/my-partners').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    onError: () => toast.error('Failed to load partners list'),
  });

  const partners = rawData?.success ? rawData.data : [];

  const filteredPartners = partners.filter(p => {
    const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.business_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.phone?.includes(searchQuery));
    if (filter === 'approved') return matchesSearch && p.onboarding_status === 'approved';
    if (filter === 'pending') return matchesSearch && (p.onboarding_status === 'pending_approval' || p.onboarding_status === 'pending');
    if (filter === 'expiring') {
      const days = p.subscription ? daysUntilExpiry(p.subscription.ends_at) : null;
      return matchesSearch && days !== null && days <= 30 && days > 0;
    }
    if (filter === 'no_sub') return matchesSearch && !p.active_subscription_id;
    return matchesSearch;
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'approved', label: 'Approved' },
    { id: 'pending', label: 'Pending' },
    { id: 'expiring', label: '⏰ Expiring Soon' },
    { id: 'no_sub', label: 'No Subscription' },
  ];

  return (
    <div className="min-h-screen mesh-gradient flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 ultra-glass px-6 pt-8 pb-5 border-b border-white/40 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-[#081229] rounded-2xl flex items-center justify-center shadow-lg">
            <Users size={22} className="text-[#fa8639]" strokeWidth={2.5} />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] font-medium text-[#fa8639] uppercase tracking-[0.25em]">Management</span>
            <h1 className="text-2xl font-medium text-[#181d5f] tracking-tight leading-none">My Network</h1>
          </div>
          <button onClick={fetchPartners} className="w-9 h-9 bg-white/60 border border-white/80 rounded-xl flex items-center justify-center text-slate-400">
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#fa8639] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="relative w-full bg-white/60 border border-white/80 py-4 pl-12 pr-4 rounded-[1.5rem] text-[14px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-8 focus:ring-[#fa8639]/5 focus:border-[#fa8639]/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${showFilters ? 'bg-slate-900 text-white shadow-xl' : 'bg-white/60 border border-white/80 text-slate-500'}`}
          >
            <Filter size={18} />
            {filter !== 'all' && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#fa8639] rounded-full text-[8px] text-white font-bold flex items-center justify-center">1</span>}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide px-1">
                {filters.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-2.5 rounded-2xl text-[10px] font-medium uppercase tracking-[0.1em] transition-all whitespace-nowrap border ${
                      filter === f.id
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 border-slate-900'
                        : 'bg-white/60 text-slate-400 border-white/80 hover:bg-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats row */}
      {!loading && partners.length > 0 && (
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: partners.length, color: 'text-[#181d5f]' },
            { label: 'Subscribed', value: partners.filter(p => p.active_subscription_id).length, color: 'text-[#fa8639]' },
            { label: 'Expiring', value: partners.filter(p => { const d = p.subscription ? daysUntilExpiry(p.subscription.ends_at) : null; return d !== null && d <= 30 && d > 0; }).length, color: 'text-amber-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/50 border border-white/80 rounded-2xl p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-6 pt-5 space-y-4 flex-grow relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-white/40 rounded-[2.5rem] border border-white/80 animate-pulse" />
            ))}
          </div>
        ) : filteredPartners.length > 0 ? (
          filteredPartners.map(partner => {
            const days = partner.subscription ? daysUntilExpiry(partner.subscription.ends_at) : null;
            return (
              <motion.div
                variants={itemVariants}
                key={partner._id}
                onClick={() => setSelectedPartnerId(partner._id)}
                className="bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:bg-white transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity ${
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
                      <h3 className="text-base font-semibold text-slate-900 leading-tight">{partner.business_name || partner.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone size={10} className="text-slate-300" />
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest">{partner.phone}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 mt-1 transition-colors" />
                </div>

                <div className="mt-5 pt-4 border-t border-white/40 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${partner.active_subscription_id ? 'bg-[#fa8639] text-white' : 'bg-slate-100 text-slate-300'}`}>
                      {partner.active_subscription_id ? <Zap size={16} fill="currentColor" /> : <Globe size={16} />}
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.2em]">Membership</p>
                      <p className={`text-[11px] font-semibold uppercase ${partner.active_subscription_id ? 'text-[#fa8639]' : 'text-slate-400'}`}>
                        {partner.subscription?.plan_snapshot?.name || (partner.active_subscription_id ? 'Paid' : 'Trial')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {partner.subscription && (
                      <ExpiryBadge endsAt={partner.subscription.ends_at} status={partner.subscription.status} />
                    )}
                    {!partner.subscription && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(partner.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center px-10">
            <div className="w-24 h-24 bg-white/40 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-slate-200 border border-white mb-8">
              <Users size={48} strokeWidth={1} />
            </div>
            <h4 className="text-xl font-medium text-slate-900 tracking-tight uppercase">No Partners Found</h4>
            <p className="text-[13px] text-slate-400 leading-relaxed mt-2">
              {filter !== 'all' ? 'No partners match this filter.' : 'Start onboarding partners with your referral code.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPartnerId && (
          <PartnerDetailModal
            partnerId={selectedPartnerId}
            onClose={() => setSelectedPartnerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
