import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
   ArrowLeft, Edit2, MapPin, Calendar, Smartphone, 
   Info, Layout, Maximize2, Home, Key, Shield,
   ImageIcon, MoreHorizontal, User,
   CheckCircle2, AlertCircle, Trash2, Hash, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function AdminPropertyDetails() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [listing, setListing] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [activeImage, setActiveImage] = useState(0);

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

   if (loading) return (
      <div className="flex items-center justify-center min-h-[50vh]">
         <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
   );

   if (error || !listing) return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
         <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
         <h2 className="text-lg font-bold text-slate-900">{error || 'Unknown Error'}</h2>
         <button onClick={() => navigate('/admin/properties')} className="mt-4 text-xs font-bold text-indigo-600 underline uppercase tracking-widest">Return to directory</button>
      </div>
   );

   const statusMap = {
      active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      pending_approval: { label: 'Pending Approval', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
      rejected: { label: 'Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
      draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20 mt-4">
         
         {/* Structural Header */}
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-6">
               <div className="flex items-center gap-6">
                  <button onClick={() => navigate('/admin/properties')} className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                     <ArrowLeft size={18} className="text-slate-500" />
                  </button>
                  <div className="flex items-center gap-4">
                     <div>
                        <h1 className="text-xl font-bold text-slate-900">{listing.title} <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${statusMap[listing.status]?.classes || statusMap.draft.classes}`}>{statusMap[listing.status]?.label || 'Draft'}</span></h1>
                        <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                           {listing.category_id?.name || 'Property'} • For {listing.listing_intent || 'N/A'} • <span className="text-slate-300">PK: {listing._id}</span>
                        </p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/admin/properties/edit/${listing._id}`)} className="px-4 py-2 border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                     <Edit2 size={12} /> Update Listing
                  </button>
                  <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                     <MoreHorizontal size={18} className="text-slate-400" />
                  </button>
               </div>
            </div>
            
            <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-slate-50/30">
               {[
                 { label: 'Market Value', value: `₹${listing.pricing?.amount?.toLocaleString() || 0}`, sub: listing.pricing?.negotiable ? 'AGR_NEG' : 'FIXED_VAL' },
                 { label: 'Surface Area', value: `${listing.details?.area?.value || 0} ${listing.details?.area?.unit || 'SQFT'}`, sub: `${listing.details?.bhk || 0} BHK CONFIG` },
                 { label: 'Asset Class', value: listing.property_type || 'N/A', sub: listing.details?.furnishing || 'NOT_SPECIFIED' },
                 { label: 'Registry Date', value: new Date(listing.createdAt).toLocaleDateString(), sub: 'SYSTEM_SYNCED' }
               ].map((stat, i) => (
                 <div key={i} className="p-5 text-center px-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.sub}</p>
                 </div>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 lg:col-span-8 space-y-6">
               
               {/* Gallery Board */}
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6">
                     <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-50 border border-slate-200">
                        <AnimatePresence mode="wait">
                           <motion.img 
                              key={activeImage}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              src={listing.images?.[activeImage] || 'https://via.placeholder.com/800x450?text=No+Asset+Media'} 
                              className="w-full h-full object-contain" 
                              alt="" 
                           />
                        </AnimatePresence>
                        {listing.is_featured && (
                           <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded border border-slate-800">
                              PRO_FEATURED
                           </div>
                        )}
                     </div>
                     <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2">
                        {(listing.images || []).map((img, i) => (
                           <button 
                              key={i} 
                              onClick={() => setActiveImage(i)}
                              className={`w-14 h-14 rounded border-2 transition-all p-0.5 shrink-0 ${activeImage === i ? 'border-slate-900' : 'border-slate-100 opacity-50'}`}
                           >
                              <img src={img} className="w-full h-full object-cover rounded-sm" alt="" />
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="p-8 border-t border-slate-200 space-y-4">
                     <label className="text-[9px] font-bold text-slate-400 uppercase block">Qualitative Assessment</label>
                     <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-2 border-slate-100 pl-6 py-1">
                        "{listing.description || 'No detailed qualitative data provided.'}"
                     </p>
                  </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
               {/* Partnership Board */}
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                   <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                     <User size={14} className="text-slate-400" /> Ownership Registry
                   </h3>
                 </div>
                 <div className="p-6">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                          <img src={listing.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${listing.partner_id?.name}&background=f1f5f9&color=64748b`} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-900">{listing.partner_id?.name || 'In-House Rep'}</h4>
                          <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Verified Partner</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                       <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</label>
                          <p className="text-xs font-bold text-slate-900 tabular-nums">{listing.partner_id?.phone}</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/admin/users/view/${listing.partner_id?._id}`)}
                      className="w-full py-3 border border-slate-900 text-slate-900 rounded-lg text-[10px] font-bold hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest text-center"
                    >
                       Inspect Profile Registry
                    </button>
                 </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                   <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                     <MapPin size={14} className="text-slate-400" /> Geographic Grid
                   </h3>
                 </div>
                 <div className="p-6 space-y-6">
                    <div>
                       <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">State & District</label>
                       <p className="text-xs font-bold text-slate-900 uppercase">{listing.address?.district}, {listing.address?.state}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Full Address Node</label>
                       <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase whitespace-pre-wrap">{listing.address?.full_address || 'Detailed address not provided.'}</p>
                    </div>
                 </div>
               </div>

               <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                     <button className="w-10 h-10 border border-rose-200 bg-white text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                        <Trash2 size={18} />
                     </button>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Asset can be red-tagged or redacted from marketplace index.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
