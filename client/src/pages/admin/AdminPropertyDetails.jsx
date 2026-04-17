import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
   ArrowLeft, Edit2, MapPin, Calendar, Smartphone, 
   Info, Layout, Maximize2, Home, Key, Shield,
   ImageIcon, MoreHorizontal, User, IndianRupee, Sparkles, Building2,
   CheckCircle2, AlertCircle, Trash2, Hash, Box, Wallet, ShieldCheck, Zap, TrendingUp, Star, Globe, FileText, ChevronRight, XCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminPropertyDetails() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [listing, setListing] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [activeImage, setActiveImage] = useState(0);
   
   // Rejection Modal State
   const [isRejecting, setIsRejecting] = useState(false);
   const [rejectReason, setRejectReason] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      const fetchPropertyDetails = async () => {
         try {
            const response = await api.get(`/admin/listings/detail/${id}`);
            if (response.data.success) {
               setListing(response.data.data);
            }
         } catch (err) {
            setError("Property record not found in database.");
         } finally {
            setLoading(false);
         }
      };
      fetchPropertyDetails();
   }, [id]);

   const handleApprove = async () => {
      try {
         const res = await api.patch(`/admin/listings/${id}/status`, { status: 'active' });
         if (res.data.success) {
            setListing(prev => ({ ...prev, status: 'active' }));
         }
      } catch (err) {
         alert("Failed to approve property.");
      }
   };

   const handleReject = async () => {
      if (!rejectReason.trim()) return alert("Please provide a reason for rejection.");
      
      setIsSubmitting(true);
      try {
         const res = await api.patch(`/admin/listings/${id}/status`, { 
            status: 'rejected',
            status_reason: rejectReason 
         });
         if (res.data.success) {
            setListing(prev => ({ ...prev, status: 'rejected', status_reason: rejectReason }));
            setIsRejecting(false);
            setRejectReason('');
         }
      } catch (err) {
         alert("Failed to reject property.");
      } finally {
         setIsSubmitting(false);
      }
   };

   if (loading) return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
         <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[12px]">Syncing Property Genome...</p>
      </div>
   );

   if (error || !listing) return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
         <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
         <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || "Registry Error"}</h2>
         <button onClick={() => navigate('/admin/properties')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-sm font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Return to Directory</button>
      </div>
   );

   const statusMap = {
      active: { label: 'Active Asset', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      pending_approval: { label: 'Pending Audit', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
      rejected: { label: 'Audit Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
      draft: { label: 'Draft Mode', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
   };

   const status = statusMap[listing.status] || statusMap.draft;

   return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
         <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
            
            {/* Action Header Block */}
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
               {/* Immersive Background element */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
               
               <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
                  <div className="flex items-start gap-6">
                     <button 
                       onClick={() => navigate('/admin/properties')}
                       className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 group shrink-0"
                     >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                     </button>
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{listing.title}</h2>
                           <span className={cn(
                              "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                              status.classes
                           )}>
                              {status.label}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-semibold uppercase tracking-widest border border-slate-100"><Building2 size={12}/> {listing.category_id?.name || 'Asset'}</span>
                           <ChevronRight size={10} className="text-slate-300" />
                           <span className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">For {listing.listing_intent || 'Sell'}</span>
                           <ChevronRight size={10} className="text-slate-300" />
                           <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">ID: {listing?._id?.slice(-8).toUpperCase()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     {listing.status === 'pending_approval' && (
                        <>
                           <button 
                              onClick={handleApprove}
                              className="px-6 py-3 bg-emerald-600 text-white font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 flex items-center gap-2"
                           >
                              <CheckCircle2 size={14} /> Approve Property
                           </button>
                           <button 
                              onClick={() => setIsRejecting(true)}
                              className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-2"
                           >
                              <XCircle size={14} /> Reject
                           </button>
                        </>
                     )}

                     <button 
                        onClick={() => navigate(`/admin/properties/edit/${listing._id}`)}
                        className={cn(
                           "px-6 py-3 font-semibold text-[12px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2",
                           listing.status === 'pending_approval' 
                              ? "bg-slate-50 text-slate-500 hover:bg-slate-100" 
                              : "bg-slate-900 text-white hover:bg-orange-600 shadow-xl shadow-slate-200"
                        )}
                     >
                        <Edit2 size={14} /> Refine Listing
                     </button>
                     <button className="p-3 border border-slate-200 bg-white text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm active:scale-95">
                        <MoreHorizontal size={20} />
                     </button>
                  </div>
               </div>

               {/* Segmented Metric Pipeline */}
               <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
                  {[
                    { 
                      label: 'Assessed Valuation', 
                      value: `₹${listing.pricing?.amount?.toLocaleString() || 0}`, 
                      sub: listing.pricing?.negotiable ? 'Negotiable Protocol' : 'Fixed Assessment',
                      icon: Wallet,
                      color: 'text-indigo-500'
                    },
                    { 
                      label: 'Spatial Mass', 
                      value: `${listing.details?.area?.value || 0} ${listing.details?.area?.unit || 'SQFT'}`, 
                      sub: `${listing.details?.bhk || 0} Unit Config`,
                      icon: Maximize2,
                      color: 'text-orange-500'
                    },
                    { 
                      label: 'Asset Classification', 
                      value: listing.property_type || 'N/A', 
                      sub: listing.details?.furnishing || 'Unspecified',
                      icon: Building2,
                      color: 'text-purple-500'
                    },
                    { 
                      label: 'Registry Audit', 
                      value: new Date(listing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), 
                      sub: 'System Synchronized',
                      icon: Calendar,
                      color: 'text-emerald-500'
                    }
                  ].map((stat, i) => (
                    <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                       <div className="flex items-center gap-3 mb-3">
                          <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                             <stat.icon size={12} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums uppercase">{stat.value}</span>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
               {/* LEFT COLUMN: Gallery & Assessment */}
               <div className="xl:col-span-8 space-y-8">
                  
                  {/* Immersive Gallery */}
                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2">
                     <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-inner group">
                        <AnimatePresence mode="wait">
                           <motion.img 
                              key={activeImage}
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              src={listing.images?.[activeImage] || 'https://via.placeholder.com/800x450?text=No+Asset+Media'} 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                              alt="" 
                           />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="absolute top-6 left-6 flex gap-3 z-20">
                           {listing.is_featured && (
                              <div className="px-4 py-2 bg-slate-900/40 backdrop-blur-xl text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-xl border border-white/10 flex items-center gap-2">
                                 <Sparkles size={12} className="text-orange-400" fill="currentColor" /> Premium Showcase
                              </div>
                           )}
                           <div className="px-4 py-2 bg-indigo-600 text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-xl shadow-lg flex items-center gap-2">
                              <ImageIcon size={12} /> {listing.images?.length || 0} Assets
                           </div>
                        </div>

                        {/* Immersive Controls */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/10 z-20 animate-in fade-in slide-in-from-bottom-4 delay-300">
                           {listing.images?.map((_, i) => (
                              <button 
                                 key={i}
                                 onClick={() => setActiveImage(i)}
                                 className={cn(
                                    "w-3 h-3 rounded-full transition-all duration-500",
                                    activeImage === i ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"
                                 )}
                              />
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  {/* Deep Qualitative Data board */}
                  <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-10 opacity-5 text-slate-900 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Info size={160} />
                     </div>
                     <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 shadow-inner">
                              <FileText size={20} />
                           </div>
                           <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em]">Qualitative Asset Assessment</h3>
                        </div>
                        <div className="relative">
                           <div className="absolute -left-6 top-1 bottom-1 w-1 bg-orange-100 group-hover:bg-orange-500 transition-colors rounded-full" />
                           <p className="text-xl font-semibold text-slate-700 leading-relaxed italic tracking-tight">
                              "{listing.description || 'No detailed qualitative data provided for this asset registry encounter. Operational parameters suggested for manual audit.'}"
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* RIGHT COLUMN: Metadata & Partner */}
               <div className="xl:col-span-4 space-y-8">
                  
                  {/* Master Governance board */}
                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group">
                    <div className="h-32 bg-slate-900 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-purple-900/20 to-orange-900/50" />
                       <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-transparent to-orange-500" />
                    </div>
                    <div className="px-10 pb-10 pt-0 relative">
                       <div className="flex justify-between items-end mb-8 -mt-16">
                          <div className="relative group/p">
                             <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-[32px] blur opacity-20 group-hover/p:opacity-40 transition-opacity" />
                             <div className="relative w-32 h-32 rounded-[28px] bg-white p-2 shadow-2xl ring-1 ring-slate-100">
                                <img 
                                  src={listing.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.partner_id?.name || 'In')}&background=6366f1&color=fff&bold=true`} 
                                  className="w-full h-full object-cover rounded-[22px]" 
                                  alt="" 
                                />
                             </div>
                          </div>
                          <div className="mb-4">
                             <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shadow-sm transition-transform hover:scale-105">
                                <ShieldCheck size={18} />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Verify Node</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div>
                             <h4 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{listing.partner_id?.name || 'In-House Representative'}</h4>
                             <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-2 ml-1">Asset Ownership Profile</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center space-y-2 group hover:bg-white transition-all shadow-sm">
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Smartphone size={10} className="text-indigo-500" /> Direct Protocol
                                </label>
                                <p className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tighter group-hover:text-indigo-600 transition-colors">{listing.partner_id?.phone || '+91 000 000 0000'}</p>
                             </div>
                          </div>
   
                          <button 
                            onClick={() => navigate(`/admin/users/view/${listing.partner_id?._id}`)}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[12px] font-semibold hover:bg-orange-600 transition-all uppercase tracking-[0.2em] text-center shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                          >
                             <User size={16} /> Audit Profile Registry
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Geographic Intelligence board */}
                  <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 group">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-orange-50 rounded-xl text-orange-500 shadow-inner">
                          <MapPin size={20} />
                       </div>
                       <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-[0.2em]">Geographic Deployment Hub</h3>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Deployment State & District</label>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white transition-all">
                             <Globe size={16} className="text-indigo-400" />
                             <span className="text-base font-semibold text-slate-800 uppercase tracking-widest">{listing.address?.district}, {listing.address?.state}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Physical Identity Node</label>
                          <p className="text-base font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[24px] border border-slate-100 uppercase tracking-tighter whitespace-pre-wrap group-hover:bg-white transition-all italic">
                             {listing.address?.full_address || 'Detailed physical address node not populated at registry index.'}
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* System Footprint Zone */}
                  <div className="bg-white border border-rose-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-rose-100 transition-all duration-700" />
                     <div className="flex flex-col gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                              <Trash2 size={24} />
                           </div>
                           <h3 className="text-lg font-semibold text-rose-600 uppercase tracking-tight">Redact Market Asset</h3>
                        </div>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed ml-2 border-l-2 border-rose-100 pl-4 uppercase">
                           Warning: This protocol permanently eradicates this asset node from the global marketplace index. Operational status cannot be reverted after purge.
                        </p>
                        <button className="w-full py-4 bg-white border-2 border-rose-500 text-rose-500 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-rose-100">
                           Execute Purge Protocol
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Rejection Modal */}
         {isRejecting && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 text-left">
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-white"
               >
                  <div className="p-10 pb-6">
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Rejection</h2>
                     <p className="text-slate-500 font-bold text-sm mt-3 leading-relaxed">
                        Please provide a detailed qualitative reason for rejecting this asset profile. 
                        The partner will receive this feedback via primary protocol.
                     </p>
                     
                     <div className="mt-8">
                        <textarea
                           value={rejectReason}
                           onChange={(e) => setRejectReason(e.target.value)}
                           placeholder="e.g. Asset media fails quality check, inconsistent valuation protocol..."
                           className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-50 rounded-[32px] outline-none focus:border-rose-500 font-bold text-sm transition-all resize-none shadow-inner"
                        />
                     </div>
                  </div>
                  
                  <div className="p-10 pt-4 flex gap-4">
                     <button 
                        onClick={() => { setIsRejecting(false); setRejectReason(''); }}
                        className="flex-1 py-5 bg-slate-50 text-slate-400 font-black rounded-[24px] hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px]"
                        disabled={isSubmitting}
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleReject}
                        className="flex-[2] py-5 bg-rose-500 text-white font-black rounded-[24px] hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                        disabled={isSubmitting}
                     >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Execute Rejection'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </div>
   );
}
