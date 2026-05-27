import React, { useState } from 'react';
import {
  ArrowLeft, Phone, Mail, MessageSquare,
  Calendar, Trash2, CheckCircle2, AlertTriangle,
  Package, User, ExternalLink, Tag, Loader2,
  ShieldCheck, Zap
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../../services/DataEngine';
import api from '../../services/api';
import { useScrollLock } from '../../hooks/useScrollLock';

export default function PartnerLeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useScrollLock(showDeleteConfirm);
  const [updating, setUpdating] = useState(false);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['partnerLeadDetails', id],
    queryFn: () => api.get(`/partners/enquiries/${id}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const lead = rawData?.success ? rawData.data : null;

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await api.patch(`/partners/enquiries/${id}/status`, { status: newStatus });
      if (res.data.success) {
        queryClient.setQueryData(['partnerLeadDetails', id], (old) => {
          if (!old) return old;
          return { ...old, data: res.data.data };
        });
      }
    } catch (err) {
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/partners/enquiries/${id}`);
      navigate('/partner/inquiries');
    } catch (err) {
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
       <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
       <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Syncing Details...</p>
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
       <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
       <h3 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest mb-2">Lead Not Found</h3>
       <p className="text-slate-400 text-[12px] font-bold uppercase tracking-tight opacity-70 leading-relaxed mb-8 max-w-xs">This lead no longer exists or may have been deleted.</p>
       <button onClick={() => navigate('/partner/inquiries')} className="px-6 py-3 bg-[#001b4e] text-white rounded-xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">Back to Leads</button>
    </div>
  );

  const listing = lead.listing_snapshot ? db._normalize(lead.listing_snapshot) : null;

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest leading-none">Lead Details</h2>
            <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5 opacity-60">
               ID: {lead._id.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-rose-500 bg-rose-50 rounded-xl active:scale-95 transition-all border border-rose-100/50"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Customer Identity Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <User size={64} />
           </div>
           
           <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-[#001b4e] text-white rounded-xl flex items-center justify-center text-[22px] font-black shadow-xl shadow-blue-900/20 border border-white/10">
                    {lead.user_details?.name?.[0] || 'C'}
                 </div>
                 <div>
                    <h3 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight leading-tight">{lead.user_details?.name || 'Customer'}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                       <div className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest border border-blue-100/50">Verified User</div>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm ${
                   lead.status === 'contacted' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                 }`}>
                   {lead.status}
                 </div>
                 <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 opacity-60">{new Date(lead.createdAt).toLocaleDateString()}</div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 relative z-10">
              {lead.limitReached ? (
                <div className="col-span-2 bg-rose-50 border border-rose-100 rounded-xl p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-rose-500 mb-1">
                    <ShieldCheck size={18} />
                    <span className="text-[12px] font-black uppercase tracking-widest">Access Restricted</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-bold uppercase leading-relaxed tracking-tight px-2">
                    You've reached your monthly lead limit. Upgrade to Pro to view customer contact details.
                  </p>
                  <button 
                    onClick={() => navigate('/partner/subscription')}
                    className="w-full bg-rose-600 text-white py-3 rounded-lg font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-900/10 active:scale-95 transition-all"
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <>
                  <ContactAction 
                    icon={<Phone size={14} />} 
                    label="Call Now" 
                    href={`tel:${lead.user_details?.phone}`} 
                    color="bg-blue-50 text-blue-600 border-blue-100/50" 
                  />
                  <ContactAction 
                    icon={<MessageSquare size={14} />} 
                    label="WhatsApp" 
                    href={`https://wa.me/${lead.user_details?.phone}`} 
                    color="bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                  />
                </>
              )}
           </div>
        </div>

        {/* Customer Message */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="bg-slate-50/50 px-4 py-2.5 border-b border-slate-50 flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-[#001b4e] uppercase tracking-widest">Inquiry Content</h3>
           </div>
           <div className="p-5">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 italic text-[14px] font-bold text-slate-500 leading-relaxed shadow-inner">
                 "{lead.content || 'Customer is interested and waiting for your response.'}"
              </div>
              <div className="flex items-center gap-2 mt-4 text-slate-300">
                 <Calendar size={12} />
                 <span className="text-[9px] font-black uppercase tracking-[0.1em]">Logged At {new Date(lead.createdAt).toLocaleString()}</span>
              </div>
        </div>
        </div>

        {/* Product/Service Reference */}
        {listing && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="bg-slate-50/50 px-4 py-2.5 border-b border-slate-50 flex items-center gap-2">
                <Tag size={14} className="text-amber-500" />
                <h3 className="text-[10px] font-black text-[#001b4e] uppercase tracking-widest">Reference Object</h3>
             </div>
             <div className="p-4 flex gap-4 items-center bg-white">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                   {listing.image ? <img src={listing.image} className="w-full h-full object-cover" alt="" /> : <Package size={24} className="m-auto text-slate-200" />}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                   <h4 className="text-[15px] font-black text-[#001b4e] uppercase tracking-tight truncate leading-tight mb-1">{listing.title || listing.serviceName || 'Market Item'}</h4>
                   <div className="flex items-center gap-2">
                      <div className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-black uppercase tracking-widest border border-slate-100">
                         {listing.category || 'listing'}
                      </div>
                      <div className="text-[10px] font-black text-blue-600 tracking-tighter opacity-60">#{listing.id?.slice(-6).toUpperCase()}</div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Floating Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-50 pointer-events-none">
          <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_-8px_32px_rgba(0,27,78,0.1)] rounded-[24px] p-4 flex gap-3 pointer-events-auto">
              {lead.limitReached ? (
                <button 
                  onClick={() => navigate('/partner/subscription')}
                  className="flex-[3] h-12 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-900/20 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                >
                   <Zap size={16} fill="currentColor" />
                   Upgrade for Leads
                </button>
              ) : (
                <a 
                  href={`tel:${lead.user_details?.phone}`}
                  className="flex-[3] h-12 bg-[#001b4e] text-white rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                >
                   <Phone size={16} />
                   Initiate Call
                </a>
              )}
              <button 
                onClick={() => updateStatus(lead.status === 'contacted' ? 'new' : 'contacted')}
                disabled={updating}
                className={`flex-1 h-12 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all border ${
                   lead.status === 'contacted' 
                   ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/10' 
                   : 'bg-white text-slate-300 border-slate-100'
                }`}
              >
                 {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={20} />}
              </button>
          </div>
      </div>

      {/* Delete Confirmer */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight mb-2">Delete Lead?</h3>
              <p className="text-slate-400 text-[13px] font-bold uppercase tracking-tight opacity-60 leading-relaxed mb-8">This action will permanently remove this customer inquiry from your record.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleDelete} className="w-full py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all">Confirm Removal</button>
                 <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-widest">Keep Lead</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactAction({ icon, label, href, color }) {
  return (
    <a 
      href={href} 
      className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all ${color}`}
    >
      {icon} {label}
    </a>
  );
}
