import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Trash2, MapPin, 
  Briefcase, Calendar, Info, LayoutGrid,
  ChevronRight, AlertTriangle, Home, Building2, BedDouble, Bath, Square, Navigation, Car, Bike, Users, IndianRupee, Tag, Package, Camera, Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/DataEngine';
import api from '../../services/api';

export default function PartnerServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        if (res.data.success) {
          const normalized = db._normalize(res.data.data);
          setService(normalized);
        }
      } catch (err) {
        console.error("Error fetching listing details:", err);
        alert("Failed to load details: " + (err.response?.data?.message || err.message));
      }
    };
    fetchListing();
  }, [id]);

  if (!user) return null;

  const isProperty = service?.property_type || service?.listing_intent || service?.type === 'property';
  const isProduct = service?.brand_id || service?.material_name || service?.type === 'product';
  const isService = !isProperty && !isProduct;

  const getLabel = () => {
    if (isProperty) return 'Property';
    if (isProduct) return 'Product';
    return 'Service';
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/listings/${service._id || service.id}`);
      navigate(-1);
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert("Failed to delete listing.");
    }
  };

  if (!service) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-slate-500 font-medium">Loading your {getLabel().toLowerCase()}...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      {/* Mobile Shell for Desktop */}
      <div className="w-full max-w-[500px] bg-[#f8fafc] min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden">
        
        {/* Immersive Mobile Header */}
        <div className="bg-white px-5 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 -ml-1 text-[#001b4e] active:scale-95 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-[16px] xs:text-[17px] font-bold text-[#001b4e] leading-tight line-clamp-1 uppercase tracking-tight">
                {service.title || service.serviceName}
              </h2>
              <div className="text-[9px] xs:text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-60 leading-none">
                {getLabel()} Overview
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-40 space-y-6 scrollbar-hide">
          {/* Main Visual Component */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl xs:rounded-[32px] overflow-hidden bg-white shadow-xl shadow-blue-900/10 border-2 xs:border-4 border-white">
              {service.thumbnail || service.image ? (
                <img 
                  src={service.thumbnail || service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-[#001b4e]">
                  {isProperty ? <Building2 size={48} className="opacity-10 mb-1" /> : <Package size={48} className="opacity-10 mb-1" />}
                  <span className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">No Image</span>
                </div>
              )}
            </div>
            
            {/* Status Floating Badge */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2">
              <div className={`px-4 py-1.5 rounded-lg xs:rounded-xl shadow-lg border-2 border-white text-[9px] xs:text-[10px] font-medium uppercase tracking-widest ${
                service.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : service.status === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-amber-500 text-white'
              }`}>
                 {service.status ? service.status.replace('_', ' ') : 'Pending'}
              </div>
            </div>
          </div>

          {/* Quick Infographics */}
          <div className="grid grid-cols-2 gap-3 mt-6">
             {isProperty ? (
               <div className="bg-white p-4 rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 xs:w-11 xs:h-11 bg-blue-50 text-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center mb-2">
                     <Tag size={18} />
                  </div>
                  <div className="text-[9px] xs:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Price</div>
                  <h4 className="text-[16px] xs:text-[17px] font-bold text-[#001b4e] leading-none uppercase tracking-tighter">
                     ₹{service.pricing?.amount ? service.pricing.amount.toLocaleString() : (typeof service.price === 'object' ? service.price?.value?.toLocaleString() : Number(service.price || 0).toLocaleString())}
                  </h4>
               </div>
             ) : (
               <div className="bg-white p-4 rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 xs:w-11 xs:h-11 bg-blue-50 text-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center mb-2">
                     <Briefcase size={18} />
                  </div>
                  <div className="text-[9px] xs:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Experience</div>
                  <h4 className="text-[16px] xs:text-[17px] font-bold text-[#001b4e] leading-none uppercase tracking-tighter">
                     {service.years_of_experience || service.details?.experience || 'N/A'}
                  </h4>
               </div>
             )}
             
             <div className="bg-white p-4 rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-10 h-10 xs:w-11 xs:h-11 bg-purple-50 text-purple-600 rounded-lg xs:rounded-xl flex items-center justify-center mb-2">
                   <LayoutGrid size={18} />
                </div>
                <div className="text-[9px] xs:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Type</div>
                <h4 className="text-[14px] xs:text-[15px] font-bold text-[#001b4e] truncate w-full leading-none uppercase tracking-tight">
                   {(service.details?.serviceType || service.service_type || service.property_type || service.category_id?.name || service.category || 'N/A')}
                </h4>
             </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 xs:gap-3 mb-3 xs:mb-4">
              <div className="w-9 h-9 xs:w-10 xs:h-10 bg-orange-50 text-orange-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight opacity-70">Location</h3>
            </div>
            <p className="text-[13px] xs:text-[14px] font-bold text-[#001b4e] mb-1 leading-tight uppercase tracking-tight">{(service.address?.district || service.district) ? `${service.address?.district || service.district}, ${service.address?.state || service.state}` : 'Location Not Specified'}</p>
            <p className="text-[12px] xs:text-[13px] text-slate-400 leading-snug font-medium opacity-50 uppercase tracking-wide">
              {service.address?.full_address || service.completeAddress || service.businessAddress || 'No address provided'}
            </p>
          </div>

          {/* Specs / Details Section */}
          {isProperty ? (
            <div className="bg-white rounded-xl xs:rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                  <LayoutGrid size={18} />
                </div>
                <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight opacity-70">Specifications</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <DetailItem icon={<Square size={16} />} label="Built-up Area" value={service.details?.area?.value ? `${service.details.area.value} ${service.details.area.unit || 'sq.ft.'}` : '-'} />
                <DetailItem icon={<Square size={16} />} label="Carpet Area" value={service.details?.area?.carpet_area ? `${service.details.area.carpet_area} ${service.details.area.unit || 'sqft'}` : '-'} />
                <DetailItem icon={<BedDouble size={16} />} label="Bedrooms" value={service.details?.bhk ? `${service.details.bhk} BHK` : '-'} />
                <DetailItem icon={<Bath size={16} />} label="Bathrooms" value={service.details?.bathrooms || '-'} />
                <DetailItem icon={<Building2 size={16} />} label="Floor" value={service.details?.floor_number ? `${service.details.floor_number} of ${service.details.total_floors}` : '-'} />
                <DetailItem icon={<Home size={16} />} label="Furnishing" value={service.details?.furnishing || '-'} />
                <DetailItem icon={<Navigation size={16} />} label="Facing" value={service.details?.facing || '-'} />
                <DetailItem icon={<Users size={16} />} label="Status" value={service.details?.possession || '-'} />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                 <h4 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest opacity-60">Amenities</h4>
                 <div className="flex flex-wrap gap-2">
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[11px] xs:text-[12px] font-bold ${service.bikeParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-300'}`}>
                      <Bike size={14} /> Bike Parking
                    </div>
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[11px] xs:text-[12px] font-bold ${service.carParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-300'}`}>
                      <Car size={14} /> Car Parking
                    </div>
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
                 <h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest opacity-60">Description</h4>
                 <p className="text-[13px] xs:text-[14px] text-[#001b4e] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
                   {service.description || 'No description provided.'}
                 </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl xs:rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                  <Info size={18} />
                </div>
                <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight opacity-70">About</h3>
              </div>
              <p className="text-[13px] xs:text-[14px] text-[#001b4e] leading-relaxed font-bold opacity-80 uppercase tracking-tight">
                {service.full_description || service.details?.description || service.short_description || service.description || service.shortDescription || 'No description provided.'}
              </p>
            </div>
          )}

          {/* Gallery Section */}
          {(service.images?.length > 0 || service.portfolio?.length > 0) && (
            <div className="bg-white rounded-xl xs:rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                  <Camera size={18} />
                </div>
                <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight opacity-70">Gallery</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(service.portfolio_images || service.images || service.portfolio || []).map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl xs:rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Stats Section */}
          <div className="bg-white rounded-xl xs:rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                <Tag size={18} />
              </div>
              <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight opacity-70">Performance</h3>
              {service.is_featured && (
                <span className="ml-auto bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> Featured
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
              <StatCard label="Views" value={service.stats?.views || 0} />
              <StatCard label="Enquiries" value={service.stats?.enquiries || 0} />
              <StatCard label="Calls" value={service.stats?.calls || 0} />
              <StatCard label="WhatsApp" value={service.stats?.whatsapp_clicks || 0} />
            </div>
          </div>
        </div>

        {/* Floating Bottom Actions */}
        <div className="sticky bottom-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent backdrop-blur-md z-50">
          <div className="flex gap-4">
            <button 
              onClick={() => {
                if (isProperty) navigate(`/partner/add-property?edit=${service._id || service.id}`);
                else if (isProduct) navigate(`/partner/add-product?edit=${service._id || service.id}`);
                else navigate(`/partner/add-service?edit=${service._id || service.id}`);
              }}
              className="flex-1 h-14 bg-[#001b4e] text-white rounded-xl xs:rounded-2xl shadow-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all uppercase tracking-widest text-[14px] font-bold"
            >
              <Edit3 size={18} />
              Edit Details
            </button>
            
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl xs:rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all border border-rose-100/30"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

      </div> {/* End Mobile Shell */}

      {/* Delete Confirmation Overlay (Global Position) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-t-3xl xs:rounded-3xl p-8 shadow-2xl border border-slate-100"
            >
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-[22px] font-bold text-[#001b4e] leading-tight mb-2 uppercase tracking-tight">Delete this?</h3>
              <p className="text-slate-500 text-[13px] xs:text-[14px] leading-relaxed mb-8 font-medium uppercase tracking-widest opacity-50">
                This action is permanent. Are you sure?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[15px] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl font-bold text-[15px] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Keep Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
      <div className="text-slate-400 mb-2">{icon}</div>
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">{label}</div>
      <div className="text-[14px] font-medium text-[#001b4e] truncate uppercase tracking-tight">{value || '-'}</div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 xs:gap-3">
      <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <div className="min-w-0">
        <div className="text-[9px] xs:text-[10px] font-medium text-slate-300 uppercase tracking-widest leading-none mb-1 opacity-60">{label}</div>
        <div className="text-[12px] xs:text-[13px] mm:text-[14px] font-medium text-[#001b4e] leading-tight truncate uppercase tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
      <div className="text-[16px] font-black text-[#001b4e] leading-none mb-1">{value}</div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">{label}</div>
    </div>
  );
}
