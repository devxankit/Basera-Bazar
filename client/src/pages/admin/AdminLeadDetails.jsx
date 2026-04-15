import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Calendar, Clock, 
  User, ShieldCheck, Trash2, CheckCircle2, 
  ExternalLink, Loader2, Info, MessageSquare,
  Activity, Heart, Star, Copy, Send, Eye
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/leads/${id}`);
      if (res.data.success) {
        setLead(res.data.data);
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
    // Simple toast would be better, but console for now
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Retrieving Lead Dossier...</p>
    </div>
  );

  if (error || !lead) return (
    <div className="p-8 text-center text-rose-500 font-black uppercase tracking-widest bg-rose-50 rounded-3xl border border-rose-100 m-8">
      {error || 'Lead not found'}
      <button onClick={() => navigate('/admin/leads')} className="block mx-auto mt-4 text-slate-500 underline text-[10px]">Back to list</button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-4 animate-in fade-in duration-500">
      <div className="max-w-[1500px] mx-auto px-8 space-y-8">
        
        {/* Breadcrumbs Placeholder */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => navigate('/admin/leads')} className="hover:text-indigo-600 transition-colors">Leads</button>
           <span>/</span>
           <span className="text-slate-900 font-black">Lead Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Dossier Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Lead Information Card */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                        <Mail size={16} />
                     </div>
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Lead Information</h3>
                  </div>
                  <div className="flex gap-2">
                     <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                        lead.is_read ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                     )}>
                        <CheckCircle2 size={12} /> {lead.is_read ? 'Read' : 'Unread'}
                     </span>
                     <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1",
                        lead.contact_status === 'contacted' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-500 text-white shadow-slate-500/20"
                     )}>
                        <Phone size={12} /> {lead.contact_status === 'contacted' ? 'Contacted' : 'Not Contacted'}
                     </span>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left: Contact Info */}
                  <div className="space-y-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Information</p>
                     
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-xl font-black shadow-xl shadow-indigo-100">
                           {lead.user_id?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tight">{lead.user_id?.name || 'Potential Customer'}</h2>
                           <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                              <Calendar size={12} className="text-emerald-500" /> Member since {new Date(lead.user_id?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </p>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mt-1 ml-0.5">Registered Customer</p>
                        </div>
                     </div>

                     <div className="space-y-3 pt-2">
                        <div className="group relative">
                           <input 
                              readOnly 
                              value={lead.user_id?.email || 'No email provided'} 
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 pl-12 text-sm font-bold text-slate-600 outline-none"
                           />
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <button onClick={() => handleCopy(lead.user_id?.email)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                              <Copy size={14} />
                           </button>
                        </div>
                        <div className="group relative">
                           <input 
                              readOnly 
                              value={lead.user_id?.phone || 'No phone provided'} 
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 pl-12 text-sm font-bold text-slate-600 outline-none"
                           />
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <button onClick={() => handleCopy(lead.user_id?.phone)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                              <Copy size={14} />
                           </button>
                        </div>
                     </div>

                     <div className="flex gap-3 pt-2">
                        <button className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95">
                           <Send size={14} /> Send Email
                        </button>
                        <button className="flex-1 bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                           <Phone size={14} /> Call Now
                        </button>
                     </div>
                  </div>

                  {/* Right: Lead Technicals */}
                  <div className="space-y-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Details</p>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lead ID:</span>
                           <span className="text-[11px] font-black text-slate-800 font-mono">BL-{lead._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lead Type:</span>
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                              {lead.enquiry_type} Inquiry
                           </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date Received:</span>
                           <span className="text-[11px] font-black text-slate-800">{new Date(lead.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                           <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-widest">{lead.status}</span>
                              <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-[8px] font-black uppercase tracking-widest">{lead.contact_status}</span>
                           </div>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Inquiries:</span>
                           <span className="text-[11px] font-black text-slate-800">1</span>
                        </div>
                     </div>

                     <button 
                        onClick={toggleContactStatus}
                        className="w-full bg-cyan-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all active:scale-95 mt-4"
                     >
                        <CheckCircle2 size={14} /> Mark as Contacted
                     </button>
                  </div>
               </div>

               {/* Inquiry Message */}
               <div className="mx-8 mb-8 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200/50 flex items-center gap-2">
                     <MessageSquare size={14} className="text-slate-400" />
                     <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Inquiry Message</span>
                  </div>
                  <div className="p-8">
                     <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{lead.content || 'I am interested in your service. Please provide more details and pricing information.'}"
                     </p>
                  </div>
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
               <button 
                  onClick={() => navigate('/admin/leads')}
                  className="px-8 py-3 bg-slate-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-600 transition-all"
               >
                  <ArrowLeft size={16} /> Back to Leads
               </button>
               <button 
                  onClick={handleDelete}
                  className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
               >
                  <Trash2 size={16} /> Delete Lead
               </button>
            </div>

            {/* Customer Activity Stats */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 ml-1">Customer Activity</h3>
               <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                     <p className="text-2xl font-black text-slate-800 tracking-tighter">1</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Inquiries</p>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                     <p className="text-2xl font-black text-emerald-500 tracking-tighter">1</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last 30 Days</p>
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-[32px] border border-slate-100 opacity-60">
                     <p className="text-2xl font-black text-slate-300 tracking-tighter">0</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Favorites</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Service/Property Details Sidebar */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden text-left">
               <div className="bg-emerald-500 px-6 py-4 flex items-center gap-2">
                  <Info size={16} className="text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{lead.enquiry_type} Details</span>
               </div>
               <div className="p-6 space-y-6">
                  <div className="rounded-3xl overflow-hidden h-48 bg-slate-100 border border-slate-100">
                     <img 
                        src={lead.listing_snapshot?.thumbnail || lead.listing_snapshot?.image || lead.listing_snapshot?.images?.[0] || 'https://via.placeholder.com/400x300'} 
                        className="w-full h-full object-cover"
                        alt=""
                     />
                  </div>
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-base font-black text-slate-800 tracking-tight leading-snug">{lead.listing_snapshot?.title || 'Unknown Product'}</h4>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 mt-2 inline-block">
                           {lead.enquiry_type}
                        </span>
                     </div>
                     <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type:</span>
                           <span className="text-[11px] font-bold text-slate-600">{lead.listing_snapshot?.category || 'General'}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                           <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-widest">Approved</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => navigate(getListingUrl())}
                        className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                     >
                        <Eye size={14} /> View {lead.enquiry_type}
                     </button>
                  </div>
               </div>
            </div>

            {/* Subscription Status Branding */}
            <div className="bg-[#10141d] rounded-[40px] border border-white/5 shadow-2xl p-8 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[60px]" />
               <div className="relative flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full animate-pulse" />
                     <Star size={32} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                     <h4 className="text-white font-black text-lg tracking-tight">Admin Access</h4>
                     <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-1">You have unlimited access to all features</p>
                  </div>
                  <div className="w-full p-4 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-3">
                     <Info size={14} className="text-indigo-400 mt-0.5" />
                     <p className="text-[9px] text-slate-400 text-left font-medium leading-relaxed">As an administrator, you can receive unlimited leads and access all premium features.</p>
                  </div>
                  <button onClick={() => navigate('/admin/dashboard')} className="w-full bg-orange-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-500/40 hover:bg-orange-600 transition-all mt-4">
                     <Activity size={14} /> Admin Dashboard
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
