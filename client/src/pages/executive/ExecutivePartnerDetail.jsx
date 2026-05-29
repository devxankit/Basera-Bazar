import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Phone, MapPin, Tag, Globe,
  Calendar, Zap, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from '../../mockToast';

function daysUntilExpiry(endsAt) {
  if (!endsAt) return null;
  return Math.ceil((new Date(endsAt) - new Date()) / (1000 * 60 * 60 * 24));
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

const roleLabel = (role) => ({
  service_provider: 'Service Provider',
  property_agent: 'Property Agent',
  supplier: 'Supplier',
  mandi_seller: 'Mandi Seller'
}[role] || role);

export default function ExecutivePartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: rawData, isLoading: loading, error } = useQuery({
    queryKey: ['executivePartnerDetail', id],
    queryFn: () => api.get(`/executive/my-partners/${id}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  useEffect(() => {
    if (error) toast.error('Failed to load partner details');
  }, [error]);

  const partner = rawData?.success ? rawData.data : null;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto pb-10 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-5 py-4 flex items-center gap-4 border-b border-slate-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900">Partner Details</h1>
      </div>

      {loading ? (
        <div className="px-5 pt-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : partner ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pt-6 space-y-5"
        >
          {/* Header card */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#081229] rounded-2xl flex items-center justify-center shrink-0">
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
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Partner not found.
        </div>
      )}
    </div>
  );
}
