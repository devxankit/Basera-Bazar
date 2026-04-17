import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Calendar, Clock, 
  User, ShieldCheck, Trash2, CheckCircle2, 
  ExternalLink, Loader2, Info, MessageSquare,
  Activity, Heart, Star, Copy, Send, Eye, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AdminLeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [metrics, setMetrics] = useState({ totalInquiries: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/leads/${id}`);
      if (res.data.success) {
        setLead(res.data.data);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Lead not found or connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard');
  };

  const toggleContactStatus = async () => {
    try {
      const newStatus = lead.contact_status === 'contacted' ? 'not_contacted' : 'contacted';
      await api.put(`/admin/leads/${id}/status`, { contact_status: newStatus });
      fetchLead();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this lead?')) {
      try {
        await api.delete(`/admin/leads/${id}`);
        navigate('/admin/leads');
      } catch (err) {
        alert('Error deleting lead');
      }
    }
  };

  const getListingUrl = () => {
    switch (lead.enquiry_type?.toLowerCase()) {
      case 'property': return `/admin/properties/view/${lead.listing_id}`;
      case 'service': return `/admin/services/view/${lead.listing_id}`;
      case 'mandi': return `/admin/products/view/${lead.listing_id}`;
      case 'supplier': return `/admin/products/view/${lead.listing_id}`;
      default: return `/admin/leads`;
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-orange-500" size={48} />
      <p className="text-slate-400 font-semibold uppercase tracking-widest text-sm animate-pulse">Retrieving Lead Dossier...</p>
    </div>
  );

  if (error || !lead) return (
    <div className="p-8 text-center text-rose-500 font-semibold uppercase tracking-widest text-sm bg-rose-50 rounded-3xl border border-rose-100 m-8">
      {error || 'Lead not found'}
      <button onClick={() => navigate('/admin/leads')} className="block mx-auto mt-4 text-slate-500 underline text-[11px]">Back to list</button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/50 via-purple-50/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/leads')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Marketplace Intelligence</span>
                       <ChevronRight size={10} className="text-slate-300" />
                       <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">Lead BL-{lead._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">Inquiry Analysis</h2>
                    <p className="text-base font-medium text-slate-400">Deep diagnostic of inbound marketplace engagement</p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={toggleContactStatus}
                    className={cn(
                       "px-6 py-3 font-semibold text-[12px] uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-sm active:scale-95",
                       lead.contact_status === 'contacted' 
                         ? "bg-slate-100 text-slate-500 border border-slate-200"
                         : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200"
                    )}
                 >
                    <CheckCircle2 size={14} /> {lead.contact_status === 'contacted' ? 'Update Routine' : 'Acknowledge Lead'}
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="p-3 border border-rose-100 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
                 >
                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Dossier Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Lead Information Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                        <Mail size={16} />
                     </div>
                     <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Dossier Overview</h3>
                  </div>
                  <div className="flex gap-2">
                     <span className={cn(
                        "px-3 py-1 rounded-lg text-[12px] font-semibold uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
                        lead.is_read ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                     )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", lead.is_read ? "bg-emerald-500" : "bg-amber-500")} />
                        {lead.is_read ? 'Archived' : 'Active Engagement'}
                     </span>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left: Contact Info */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold shadow-xl shadow-indigo-100 border-4 border-white">
                           {(lead.user_details?.name || lead.user_id?.name || 'U').charAt(0)}
                        </div>
                        <div className="space-y-2">
                           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{lead.user_details?.name || lead.user_id?.name || 'Potential Customer'}</h2>
                           <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Identity Verified</span>
                              <span className="text-[11px] font-medium text-slate-400">• Joined {lead.user_id?.createdAt ? new Date(lead.user_id.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Recent'}</span>
                           </div>
                        </div>
                     </div>
 
                     <div className="space-y-4">
                        <div className="group relative">
                           <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2 ml-1">Communication Channel</p>
                           <div className="relative">
                              <input 
                                 readOnly 
                                 value={lead.user_details?.email || lead.user_id?.email || 'No email provided'} 
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-base font-semibold text-slate-700 outline-none hover:bg-white hover:border-indigo-100 transition-all"
                              />
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                              <button onClick={() => handleCopy(lead.user_details?.email || lead.user_id?.email)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                                 <Copy size={16} />
                              </button>
                           </div>
                        </div>
                        <div className="group relative">
                           <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Line</p>
                           <div className="relative">
                              <input 
                                 readOnly 
                                 value={lead.user_details?.phone || lead.user_id?.phone || 'No phone provided'} 
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 text-base font-semibold text-slate-700 outline-none hover:bg-white hover:border-indigo-100 transition-all"
                              />
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                              <button onClick={() => handleCopy(lead.user_details?.phone || lead.user_id?.phone)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                                 <Copy size={16} />
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button 
                           onClick={() => {
                              const email = lead.user_details?.email || lead.user_id?.email;
                              if (email) window.open(`mailto:${email}`, '_self');
                              else alert('No email address available for this lead.');
                           }}
                           className="flex-1 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-semibold text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group"
                        >
                           <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> SMTP Route
                        </button>
                        <button 
                           onClick={() => {
                              const phone = lead.user_details?.phone || lead.user_id?.phone;
                              if (phone) window.open(`tel:${phone}`, '_self');
                              else alert('No phone number available for this lead.');
                           }}
                           className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 py-4 rounded-2xl font-semibold text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                           <Phone size={14} /> Direct VoIP
                        </button>
                     </div>
                  </div>

                  {/* Right: Lead Technicals */}
                  <div className="space-y-6">
                     <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 px-3 py-1.5 rounded inline-block">Engagement Metrix</p>
                     
                     <div className="space-y-1">
                        <div className="flex items-center justify-between py-4 border-b border-slate-50">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Registry ID</span>
                           <span className="text-base font-semibold text-slate-900 tracking-tight">BL-{lead._id.slice(-6).toUpperCase()}</span>
                        </div>
                         <div className="flex items-center justify-between py-4 border-b border-slate-50">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Inquiry Vector</span>
                            <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[11px] font-semibold uppercase tracking-widest shadow-sm">
                               {lead.enquiry_type} Channel
                            </span>
                         </div>
                         <div className="flex items-center justify-between py-4 border-b border-slate-50">
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Inquiry Type</span>
                            <span className="text-base font-semibold text-slate-900 tracking-tight uppercase">
                               {lead.inquiry_type || 'General Inquiry'}
                            </span>
                         </div>
                        <div className="flex items-center justify-between py-4 border-b border-slate-50">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Time Ingested</span>
                           <span className="text-base font-semibold text-slate-900 tracking-tight italic">{new Date(lead.createdAt).toLocaleDateString('en-GB')} • {new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-slate-50">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Engagement Frame</span>
                           <div className="flex gap-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-semibold uppercase tracking-widest">{lead.status}</span>
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-semibold uppercase tracking-widest">{lead.contact_status}</span>
                           </div>
                        </div>
                        <div className="flex items-center justify-between py-4">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Network Authority</span>
                           <span className="text-base font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl shadow-sm tracking-tight">{metrics.totalInquiries} Total Submissions</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Inquiry Message */}
               <div className="mx-8 mb-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 overflow-hidden">
                  <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-3">
                     <MessageSquare size={16} className="text-indigo-500 opacity-60" />
                     <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Customer Transcription</span>
                  </div>
                  <div className="p-10">
                     <div className="relative">
                        <div className="absolute -left-4 -top-4 text-4xl text-indigo-100 font-serif leading-none italic">“</div>
                        <p className="text-xl font-semibold text-slate-700 leading-relaxed italic relative z-10 px-2 tracking-tight">
                           {lead.content || 'I am interested in your service. Please provide more details and pricing information.'}
                        </p>
                        <div className="absolute -right-4 -bottom-4 text-4xl text-indigo-100 font-serif leading-none italic rotate-180">“</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pb-4">
               <button 
                  onClick={() => navigate('/admin/leads')}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-semibold text-[12px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
               >
                  <ArrowLeft size={16} /> Registry Dashboard
               </button>
            </div>

            {/* Customer Activity Stats */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10">
               <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                     <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Reliability Analysis</h3>
                     <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Historical submission velocity</p>
                  </div>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-indigo-100">
                     Verified History
                  </span>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all duration-500">
                     <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                           <Activity size={32} />
                        </div>
                        <div className="space-y-1.5">
                           <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Global Submissions</p>
                           <p className="text-base font-semibold text-slate-600 tracking-tight italic">Consolidated activity across marketplace channels</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-6xl font-semibold text-slate-900 tracking-tighter tabular-nums">{metrics.totalInquiries}</p>
                        <p className="text-[12px] font-semibold text-emerald-500 uppercase tracking-widest mt-2">Authenticated Events</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Listing Details Sidebar */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-6 flex items-center gap-3">
                  <Info size={18} className="text-white opacity-80" />
                  <span className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Asset Reference</span>
               </div>
               <div className="p-8 space-y-6">
                  <div className="group relative rounded-2xl overflow-hidden h-64 bg-slate-100 border border-slate-100 shadow-inner">
                     <img 
                        src={lead.listing_snapshot?.thumbnail || lead.listing_snapshot?.image || lead.listing_snapshot?.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80'} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                        alt=""
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{lead.listing_snapshot?.title || 'Unknown Asset'}</h4>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-semibold uppercase tracking-widest border border-emerald-100">
                           {lead.enquiry_type} Registry
                        </span>
                     </div>
                     
                     <div className="space-y-1">
                        <div className="flex items-center justify-between py-4 border-b border-slate-50">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Classification</span>
                           <span className="text-base font-semibold text-slate-700 tracking-tight">{lead.listing_snapshot?.category || 'General Tier'}</span>
                        </div>
                        <div className="flex items-center justify-between py-4">
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Authority</span>
                           <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">
                              <ShieldCheck size={12} />
                              <span className="text-[11px] font-semibold uppercase tracking-widest">Verified</span>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={() => navigate(getListingUrl())}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-600 transition-all active:scale-95 group"
                     >
                        <Eye size={16} className="group-hover:scale-110 transition-transform" /> Access Payload
                     </button>
                  </div>
               </div>
            </div>

            {/* Admin Privilege Branding */}
            <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-3xl border border-white/5 shadow-2xl p-8 space-y-8 relative overflow-hidden group">
               <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
               <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700" />
               
               <div className="relative flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-full flex items-center justify-center relative shadow-lg shadow-orange-500/20 border-2 border-white/20">
                       <Star size={36} className="text-white fill-white drop-shadow-md" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <h4 className="text-white font-semibold text-xl tracking-wide uppercase">Core Authority</h4>
                     <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase opacity-80">Unlimited Superuser Status</p>
                  </div>

                  <div className="w-full p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-4 transition-all hover:bg-white/[0.08]">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-white/10">
                        <ShieldCheck size={18} className="text-indigo-400" />
                     </div>
                     <p className="text-[11px] text-slate-300 text-left font-medium leading-relaxed tracking-tight group-hover:text-white transition-colors">
                        Authorized personal override detected. Access to encrypted lead vectors and marketplace diagnostic channels is currently fully active.
                     </p>
                  </div>

                  <button 
                    onClick={() => navigate('/admin/dashboard')} 
                    className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 rounded-2xl font-semibold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/40 hover:shadow-orange-600/50 hover:-translate-y-0.5 transition-all active:scale-95"
                  >
                     <Activity size={16} /> Console Home
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLeadDetails;
