import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
   ArrowLeft, Edit2, MapPin, Calendar, Smartphone, 
   Info, Layout, Maximize2, Home, Key, Shield,
   ImageIcon, MoreHorizontal, User, IndianRupee, Sparkles, Building2,
   CheckCircle2, AlertCircle, Trash2, Hash, Box, Wallet, ShieldCheck, Zap, TrendingUp, Star, Globe, FileText, ChevronRight, XCircle, Loader2,
   PauseCircle, PlayCircle, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

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
   const [showOptions, setShowOptions] = useState(false);
   const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false, type: 'danger' });

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

   const openConfirm = (title, message, action, type = 'danger') => {
      setConfirmModal({ isOpen: true, title, message, action, loading: false, type });
   };

   const executeConfirm = async () => {
      setConfirmModal(m => ({ ...m, loading: true }));
      try {
         await confirmModal.action();
      } finally {
         setConfirmModal(m => ({ ...m, isOpen: false, loading: false }));
      }
   };

   const handleToggleActive = () => {
      const newStatus = listing.status === 'active' ? 'draft' : 'active';
      const action = newStatus === 'active' ? 'activate' : 'deactivate';
      openConfirm(
         `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Listing`,
         `Are you sure you want to ${action} this property listing?`,
         async () => {
            const res = await api.patch(`/admin/listings/${listing._id}/status`, { status: newStatus });
            if (res.data.success) {
               setListing({ ...listing, status: newStatus });
               toast.success(`Property ${action}d successfully`);
               setShowOptions(false);
            }
         },
         newStatus === 'active' ? 'info' : 'warning'
      );
   };

   const handleDeleteProperty = () => {
      openConfirm(
         'Delete Property',
         'Are you sure you want to permanently delete this property? This action cannot be undone.',
         async () => {
            const res = await api.delete(`/admin/listings/${listing._id}`);
            if (res.data.success) {
               toast.success("Property deleted successfully");
               navigate('/admin/properties');
            }
         }
      );
   };

   const handleApprove = () => {
      openConfirm(
         'Approve Property',
         'Are you sure you want to approve this property listing? It will become visible to users.',
         async () => {
            const res = await api.patch(`/admin/listings/${id}/status`, { status: 'active' });
            if (res.data.success) {
               setListing(prev => ({ ...prev, status: 'active' }));
               toast.success("Property approved successfully");
            }
         },
         'success'
      );
   };

   const handleReject = async () => {
      if (!rejectReason.trim()) return toast.error("Please provide a reason for rejection.");
      
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
            toast.success("Property rejected with feedback");
         }
      } catch (err) {
         toast.error("Failed to reject property.");
      } finally {
         setIsSubmitting(false);
      }
   };

   if (loading) return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
         <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-slate-400 font-semibold uppercase tracking-widest text-[12px]">Loading Property Details...</p>
      </div>
   );

   if (error || !listing) return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl m-8 shadow-sm">
         <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
         <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || "Property Not Found"}</h2>
         <button onClick={() => navigate('/admin/properties')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Back to Directory</button>
      </div>
   );

   const statusMap = {
      active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      pending_approval: { label: 'Pending Approval', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
      rejected: { label: 'Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
      draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
   };

   const status = statusMap[listing.status] || statusMap.draft;

   const displayImages = [listing.thumbnail, ...(listing.images || [])].filter(img => img && typeof img === 'string');
   const uniqueImages = [...new Set(displayImages)];

   return (
      <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
         <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
            onConfirm={executeConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            type={confirmModal.type}
            loading={confirmModal.loading}
         />
         <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
               <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                     <button 
                       onClick={() => navigate('/admin/properties')}
                       className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group shrink-0"
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
                           <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold uppercase tracking-widest border border-slate-200"><Building2 size={12}/> {listing.category_id?.name || 'Asset'}</span>
                           <ChevronRight size={10} className="text-slate-300" />
                           <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">For {listing.listing_intent || 'Sell'}</span>
                           <ChevronRight size={10} className="text-slate-300" />
                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">ID: {listing?._id?.slice(-8).toUpperCase()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     {listing.status === 'pending_approval' && (
                        <>
                           <button 
                              onClick={handleApprove}
                              className="px-6 py-3 bg-emerald-600 text-white font-semibold text-[12px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                           >
                              <CheckCircle2 size={14} /> Approve
                           </button>
                           <button 
                              onClick={() => setIsRejecting(true)}
                              className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 font-semibold text-[12px] uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-2"
                           >
                              <XCircle size={14} /> Reject
                           </button>
                        </>
                     )}

                     <button 
                        onClick={() => navigate(`/admin/properties/edit/${listing._id}`)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold text-[12px] uppercase tracking-widest rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95"
                     >
                        <Edit2 size={14} /> Edit Listing
                     </button>

                     <div className="relative">
                        <button 
                          onClick={() => setShowOptions(!showOptions)}
                          className={cn(
                            "p-3 border rounded-xl transition-all active:scale-95",
                            showOptions ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-white text-slate-400 hover:border-indigo-600 hover:text-indigo-600"
                          )}
                        >
                           <MoreHorizontal size={20} />
                        </button>

                        {showOptions && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                               <button 
                                 onClick={handleToggleActive}
                                 className="w-full flex items-center gap-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                               >
                                  <div className={cn(
                                     "w-10 h-10 rounded-lg flex items-center justify-center",
                                     listing.status === 'active' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                                  )}>
                                     {listing.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                                  </div>
                                  <span className="font-semibold text-sm text-left">{listing.status === 'active' ? 'Deactivate Listing' : 'Activate Listing'}</span>
                               </button>

                               <div className="h-px bg-slate-100 my-2 mx-4" />

                               <button 
                                 onClick={handleDeleteProperty}
                                 className="w-full flex items-center gap-4 p-4 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400">
                                     <Trash2 size={18} />
                                  </div>
                                  <span className="font-semibold text-sm text-left">Delete Property</span>
                               </button>
                            </div>
                          </>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {[
                 { label: 'Price', value: `₹${listing.pricing?.amount?.toLocaleString() || 0}`, sub: listing.pricing?.negotiable ? 'Negotiable' : 'Fixed', icon: Wallet, color: 'bg-indigo-50 text-indigo-600' },
                 { label: 'Area', value: `${listing.details?.area?.value || 0} ${listing.details?.area?.unit || 'SQFT'}`, sub: `${listing.details?.bhk || 0} BHK / Units`, icon: Maximize2, color: 'bg-orange-50 text-orange-600' },
                 { label: 'Type', value: listing.property_type || 'N/A', sub: listing.details?.furnishing || 'Standard', icon: Building2, color: 'bg-purple-50 text-purple-600' },
                 { label: 'Listed On', value: new Date(listing.createdAt).toLocaleDateString('en-GB'), sub: 'Database Entry', icon: Calendar, color: 'bg-emerald-50 text-emerald-600' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", stat.color)}>
                       <stat.icon size={20} />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                       <p className="text-xl font-semibold text-slate-900 tracking-tighter uppercase">{stat.value}</p>
                       <p className="text-[10px] font-medium text-slate-400 uppercase">{stat.sub}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
               {/* LEFT COLUMN: Gallery & Description */}
               <div className="xl:col-span-8 space-y-8">
                  {/* Gallery */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-3">
                     <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-inner group">
                        <AnimatePresence mode="wait">
                           <motion.img 
                              key={activeImage}
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              src={uniqueImages[activeImage] || 'https://via.placeholder.com/800x450?text=No+Media'} 
                              className="w-full h-full object-cover" 
                              alt="" 
                           />
                        </AnimatePresence>
                        
                        <div className="absolute top-4 left-4 flex gap-2 z-20">
                           {listing.is_featured && (
                              <div className="px-3 py-1.5 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg border border-white/10 flex items-center gap-2">
                                 <Sparkles size={12} className="text-amber-400" fill="currentColor" /> Featured Listing
                              </div>
                           )}
                           <div className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold uppercase tracking-widest rounded-lg flex items-center gap-2">
                              <ImageIcon size={12} /> {uniqueImages.length} Photos
                           </div>
                        </div>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-black/20 backdrop-blur-md rounded-full z-20">
                           {uniqueImages.map((_, i) => (
                              <button 
                                 key={i}
                                 onClick={() => setActiveImage(i)}
                                 className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    activeImage === i ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"
                                 )}
                              />
                           ))}
                        </div>
                     </div>
                     
                     {/* Thumbnails */}
                     <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide px-1">
                        {uniqueImages.map((img, i) => (
                           <button 
                              key={i}
                              onClick={() => setActiveImage(i)}
                              className={cn(
                                 "w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                                 activeImage === i ? "border-indigo-600" : "border-transparent opacity-60 hover:opacity-100"
                              )}
                           >
                              <img src={img} className="w-full h-full object-cover" alt="" />
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  {/* Property Description */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                           <FileText size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Property Description</h3>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-base font-semibold text-slate-700 leading-relaxed uppercase">
                           {listing.description || 'No detailed description provided for this property.'}
                        </p>
                     </div>
                  </div>

                  {/* Amenities / Features if available */}
                  {listing.amenities && listing.amenities.length > 0 && (
                     <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                              <Star size={20} />
                           </div>
                           <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Amenities & Features</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {listing.amenities.map((amenity, i) => (
                              <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                 <CheckCircle2 size={14} className="text-emerald-500" />
                                 <span className="text-xs font-bold text-slate-600 uppercase truncate">{amenity}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* RIGHT COLUMN: Owner & Location */}
               <div className="xl:col-span-4 space-y-8">
                  {/* Listing Owner / Partner */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-24 bg-slate-900 relative">
                       <div className="absolute inset-0 bg-linear-to-r from-indigo-900/40 to-purple-900/40" />
                    </div>
                    <div className="px-8 pb-8 pt-0 relative">
                       <div className="flex justify-between items-end mb-6 -mt-12">
                          <div className="relative w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border border-slate-100">
                             <img 
                               src={listing.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.partner_id?.name || 'In')}&background=6366f1&color=fff&bold=true`} 
                               className="w-full h-full object-cover rounded-xl" 
                               alt="" 
                             />
                          </div>
                          <div className="mb-2">
                             <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck size={12} /> Verified Seller
                             </span>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div>
                             <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight truncate">{listing.partner_id?.name || 'In-House Representative'}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Listed By Partner</p>
                          </div>
                          
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Smartphone size={12} className="text-indigo-500" /> Phone
                                </span>
                                <span className="text-sm font-bold text-slate-900 tabular-nums">{listing.partner_id?.phone || 'N/A'}</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Mail size={12} className="text-indigo-500" /> Email
                                </span>
                                <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{listing.partner_id?.email || 'N/A'}</span>
                             </div>
                          </div>
   
                          <button 
                            onClick={() => navigate(`/admin/users/view/${listing.partner_id?._id}`)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[11px] font-bold hover:bg-indigo-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                          >
                             <User size={14} /> View Partner Profile
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-orange-50 rounded-xl text-orange-500">
                          <MapPin size={20} />
                       </div>
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Location Metadata</h3>
                    </div>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">District</label>
                             <span className="text-sm font-bold text-slate-800 uppercase">{listing.address?.district || 'N/A'}</span>
                          </div>
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">State</label>
                             <span className="text-sm font-bold text-slate-800 uppercase">{listing.address?.state || 'N/A'}</span>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Full Address</label>
                          <p className="text-sm font-semibold text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 uppercase italic">
                             {listing.address?.full_address || 'Detailed physical address not provided.'}
                          </p>
                       </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center gap-3 mb-4">
                        <AlertCircle size={20} className="text-rose-500" />
                        <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest">Danger Zone</h3>
                     </div>
                     <p className="text-[11px] font-medium text-rose-400 uppercase tracking-widest leading-relaxed mb-6">
                        Deleting this property will permanently remove it from the marketplace and all associated records.
                     </p>
                     <button 
                        onClick={handleDeleteProperty}
                        className="w-full py-3 bg-white border-2 border-rose-500 text-rose-500 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                     >
                        Delete Property Asset
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Rejection Modal */}
         {isRejecting && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 text-left">
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
               >
                  <div className="p-8 pb-4">
                     <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Reject Property</h2>
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 leading-relaxed opacity-60">
                        Please specify why this listing is being rejected. This will be sent to the partner.
                     </p>
                     
                     <div className="mt-6">
                        <textarea
                           value={rejectReason}
                           onChange={(e) => setRejectReason(e.target.value)}
                           placeholder="e.g. Blurry images, invalid price, location mismatch..."
                           className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm transition-all resize-none shadow-inner"
                        />
                     </div>
                  </div>
                  
                  <div className="p-8 pt-2 flex gap-3">
                     <button 
                        onClick={() => { setIsRejecting(false); setRejectReason(''); }}
                        className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                        disabled={isSubmitting}
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleReject}
                        className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                        disabled={isSubmitting}
                     >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Rejection'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </div>
   );
}
