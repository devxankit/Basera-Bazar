import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, IndianRupee, Home, Camera, 
  CheckCircle2, ArrowLeft, Edit2, Trash2, Shield, 
  User, Phone, Mail, Calendar, Maximize2, 
  Bed, Bath, Warehouse, Briefcase, Star, Info, X, AlertCircle, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';

export default function AdminPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/listings/detail/${id}`);
        if (res.data.success) {
          setListing(res.data.data);
        }
      } catch (err) {
        setError("Failed to fetch property details. Identity may not exist.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (status, reason = '') => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/listings/${id}/status`, { status, status_reason: reason });
      if (res.data.success) {
        setListing(prev => ({ ...prev, status, status_reason: reason }));
        setShowRejectModal(false);
      }
    } catch (err) {
       alert("Status transition failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/listings/${id}`);
      if (res.data.success) {
        setIsModalOpen(false);
        navigate('/admin/properties');
      }
    } catch (err) {
      alert("Deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 border-r-4 border-r-transparent border-b-4 border-indigo-600/20"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Accessing Cloud Inventory...</p>
    </div>
  );

  if (error || !listing) return (
    <div className="bg-white rounded-[40px] p-20 text-center space-y-6 shadow-2xl border border-rose-50 border-t-rose-500 border-t-8 max-w-2xl mx-auto mt-20">
       <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="text-rose-500" size={48} />
       </div>
       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Identity Not Found</h2>
       <p className="text-slate-500 font-medium">The property ID provided does not match any records in our distributed registry.</p>
       <button onClick={() => navigate('/admin/properties')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Back to Inventory</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <ArrowLeft size={24} />
            </button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter truncate max-w-md">{listing.title}</h1>
                  {listing.is_featured && <div className="px-3 py-1 bg-amber-400 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Featured</div>}
               </div>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{listing.property_type}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">&bull;</span>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><MapPin size={12} /> {listing.address?.district}, {listing.address?.state}</p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/admin/properties/edit/${listing._id}`)}
              className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
               <Edit2 size={18} />
               Modify Asset
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-sm active:scale-95 border border-rose-100"
            >
               <Trash2 size={18} />
               Delete Property
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         {/* Media & Details Column */}
         <div className="xl:col-span-2 space-y-10">
            {/* Gallery Card */}
            <div className="bg-white rounded-[44px] overflow-hidden shadow-2xl border border-slate-100">
               <div className="relative aspect-[16/9] bg-slate-100">
                  <AnimatePresence mode="wait">
                     <motion.img 
                        key={activeImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={listing.images[activeImage] || 'https://via.placeholder.com/800x450?text=No+Image'} 
                        className="w-full h-full object-cover" 
                        alt="" 
                     />
                  </AnimatePresence>
                  <div className="absolute top-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-2xl text-white font-black text-[10px] uppercase tracking-widest">
                     Asset {activeImage + 1} of {listing.images.length}
                  </div>
               </div>
               <div className="p-6 bg-slate-50/50 flex gap-4 overflow-x-auto">
                  {listing.images.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveImage(i)}
                      className={`w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${activeImage === i ? 'border-indigo-600 scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                       <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
               </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {[
                  { label: 'Total Area', value: `${listing.details?.area?.value} ${listing.details?.area?.unit}`, icon: Maximize2, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'BHK Status', value: `${listing.details?.bhk || 0} BHK`, icon: Home, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Bathrooms', value: listing.details?.bathrooms || 0, icon: Bath, color: 'text-rose-600 bg-rose-50' },
                  { label: 'Market Price', value: `₹${listing.pricing?.amount?.toLocaleString()}`, icon: IndianRupee, color: 'text-amber-600 bg-amber-50' }
               ].map((m, i) => (
                  <div key={i} className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center text-center gap-3">
                     <div className={`p-4 rounded-2xl ${m.color}`}>
                        <m.icon size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-lg font-black text-slate-900 leading-tight">{m.value}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* Description & Secondary Details */}
            <div className="bg-white rounded-[44px] p-12 shadow-2xl border border-slate-100 space-y-12">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">Market Description</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed font-medium">
                     {listing.description || "The partner has not provided a detailed description for this registry entry."}
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={14} /> Structural Details
                     </h4>
                     <div className="space-y-4">
                        {[
                           { l: 'Carpet Area', v: `${listing.details?.area?.carpet_area || 0} Sqft` },
                           { l: 'Super Built-up', v: `${listing.details?.area?.super_built_up_area || 0} Sqft` },
                           { l: 'Floor Position', v: `${listing.details?.floor_number}/${listing.details?.total_floors}` },
                           { l: 'Washrooms', v: listing.details?.washrooms || 0 }
                        ].map((d, i) => (
                           <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50">
                              <span className="text-sm font-bold text-slate-400">{d.l}</span>
                              <span className="text-sm font-black text-slate-900 uppercase">{d.v}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Star size={14} /> Lifestyle & Operations
                     </h4>
                     <div className="space-y-4">
                        {[
                           { l: 'Furnishing', v: listing.details?.furnishing },
                           { l: 'Parking', v: listing.details?.parking },
                           { l: 'Facing', v: listing.details?.facing },
                           { l: 'Possession', v: listing.details?.possession === 'ready' ? 'Ready to move' : 'Under construction' }
                        ].map((d, i) => (
                           <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50">
                              <span className="text-sm font-bold text-slate-400">{d.l}</span>
                              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{d.v}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Location Visualizer (Map) */}
            {listing.location?.coordinates && listing.location.coordinates.length === 2 && (
               <div className="bg-white rounded-[44px] p-4 shadow-2xl border border-slate-100 overflow-hidden relative" style={{ height: '400px' }}>
                  <iframe 
                     title="Property Location"
                     width="100%" 
                     height="100%" 
                     style={{ border: 0, borderRadius: '32px' }} 
                     loading="lazy" 
                     allowFullScreen 
                     referrerPolicy="no-referrer-when-downgrade" 
                     src={`https://maps.google.com/maps?q=${listing.location.coordinates[1]},${listing.location.coordinates[0]}&z=15&output=embed`}
                  />
               </div>
            )}
         </div>

         {/* Control & Identity Sidebar */}
         <div className="space-y-10">
            {/* Status Card */}
            <div className={`bg-white rounded-[44px] p-10 border-t-[10px] shadow-2xl space-y-8 ${
               listing.status === 'active' ? 'border-t-emerald-500 shadow-emerald-100/30' : 
               listing.status === 'rejected' ? 'border-t-rose-500 shadow-rose-100/30' : 
               'border-t-amber-500 shadow-amber-100/30'
            }`}>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marketplace Status</p>
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${listing.status === 'active' ? 'bg-emerald-500' : listing.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                     <h4 className={`text-2xl font-black uppercase tracking-widest ${listing.status === 'active' ? 'text-emerald-600' : listing.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {listing.status}
                     </h4>
                  </div>
               </div>

               {listing.status === 'rejected' && listing.status_reason && (
                  <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-start gap-4">
                     <Info className="text-rose-500 shrink-0 mt-1" size={20} />
                     <p className="text-sm font-bold text-rose-900/70 leading-relaxed italic">"{listing.status_reason}"</p>
                  </div>
               )}

               <div className="space-y-3 pt-6">
                  {listing.status !== 'active' && (
                     <button 
                       onClick={() => handleStatusUpdate('active')}
                       disabled={actionLoading}
                       className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all overflow-hidden relative group"
                     >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <CheckCircle2 size={24} className="relative z-10" />
                        <span className="relative z-10">Verify & Approve</span>
                     </button>
                  )}
                  {listing.status !== 'rejected' && (
                     <button 
                       onClick={() => setShowRejectModal(true)}
                       disabled={actionLoading}
                       className="w-full flex items-center justify-center gap-3 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[24px] font-black text-lg hover:bg-rose-100 transition-all active:scale-95"
                     >
                        <Trash2 size={24} />
                        Decline Entry
                     </button>
                  )}
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                     <Calendar className="text-slate-400" size={20} />
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</p>
                        <p className="text-sm font-black text-slate-700">{new Date(listing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Partner Info Card */}
            <div className="bg-slate-900 rounded-[44px] p-10 text-white space-y-10 shadow-3xl overflow-hidden relative border border-white/5">
               <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
               
               <div className="space-y-6 relative z-10">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                     <User className="text-indigo-400" size={28} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Listing Originator</p>
                     <h3 className="text-2xl font-black tracking-tight leading-none italic">{listing.partner_id?.name || 'In-House Registry'}</h3>
                  </div>
               </div>

               <div className="space-y-4 relative z-10 border-t border-white/5 pt-8">
                  <div className="flex items-center gap-4 text-white/70">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Phone size={18} />
                     </div>
                     <span className="font-bold tracking-widest text-sm">{listing.partner_id?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-white/70">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Mail size={18} />
                     </div>
                     <span className="font-bold text-sm truncate">{listing.partner_id?.email || 'N/A'}</span>
                  </div>
                  <button 
                     onClick={() => listing.partner_id?._id && navigate(`/admin/users/view/${listing.partner_id._id}`)}
                     className="w-full mt-6 py-4 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                  >
                     Full Partner Profile
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* REJECTION MODAL */}
      <AnimatePresence>
         {showRejectModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[44px] p-12 shadow-3xl overflow-hidden border border-slate-100">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-rose-500" />
                  <div className="space-y-8">
                     <div className="text-center space-y-3">
                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Decline Listing</h4>
                        <p className="text-slate-500 font-medium">Please provide a valid reason for this action. The partner will be notified instantly.</p>
                     </div>
                     
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Reason for Rejection</label>
                        <textarea 
                           className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[32px] focus:bg-white focus:border-rose-500 outline-none font-bold text-slate-700 transition-all"
                           rows={4}
                           placeholder="Ex: Image quality is low, Price is unrealistic, Suspicious location..."
                           value={rejectionReason}
                           onChange={(e) => setRejectionReason(e.target.value)}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowRejectModal(false)} className="py-6 bg-slate-50 text-slate-500 rounded-[28px] font-black text-lg hover:bg-slate-100 transition-all">Cancel</button>
                        <button 
                           onClick={() => handleStatusUpdate('rejected', rejectionReason)}
                           disabled={!rejectionReason || actionLoading} 
                           className="py-6 bg-rose-500 text-white rounded-[28px] font-black text-lg shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all disabled:opacity-50"
                        >
                           Submit Reject
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Listing?"
        message="This will permanently remove the property and all associated media from the marketplace. This cannot be recovered."
        type="danger"
        confirmText="Delete Asset"
      />
    </div>
  );
}
