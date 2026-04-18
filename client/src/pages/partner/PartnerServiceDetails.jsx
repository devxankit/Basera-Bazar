import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Trash2, MapPin, 
  Briefcase, Calendar, Info, LayoutGrid,
  ChevronRight, AlertTriangle, Home, Building2, BedDouble, Bath, Square, Navigation, Car, Bike, Users, IndianRupee, Tag, Package, Camera
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
        <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-[#001b4e] active:scale-95 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-[17px] font-bold text-[#001b4e] leading-tight line-clamp-1">
                {service.title || service.serviceName}
              </h2>
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] opacity-60">
                {getLabel()} Overview
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-40 space-y-6 scrollbar-hide">
          {/* Main Visual Component */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-blue-900/10 border-4 border-white">
              {service.thumbnail || service.image ? (
                <img 
                  src={service.thumbnail || service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-[#001b4e]">
                  {isProperty ? <Building2 size={64} className="opacity-10 mb-2" /> : <Package size={64} className="opacity-10 mb-2" />}
                  <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">No Image Available</span>
                </div>
              )}
            </div>
            
            {/* Status Floating Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <div className={`px-6 py-2 rounded-2xl shadow-xl border-2 border-white text-[11px] font-black uppercase tracking-widest ${
                service.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : service.status === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-amber-500 text-white'
              }`}>
                 {service.status ? service.status.replace('_', ' ') : 'Pending Approval'}
              </div>
            </div>
          </div>

          {/* Quick Infographics */}
          <div className="grid grid-cols-2 gap-4 mt-8">
             <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                   <Tag size={24} />
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Price</div>
                <h4 className="text-[18px] font-black text-[#001b4e]">
                   ₹{typeof service.price === 'object' ? service.price.value.toLocaleString() : Number(service.price).toLocaleString()}
                </h4>
             </div>
             
             <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
                   <LayoutGrid size={24} />
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Category</div>
                <h4 className="text-[16px] font-bold text-[#001b4e] truncate w-full">
                   {(service.serviceType || service.propertyType || service.category || 'N/A').split(' ')[0]}
                </h4>
             </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-[#001b4e]">Location</h3>
            </div>
            <p className="text-[15px] font-bold text-[#001b4e] mb-1">{service.district}, {service.state}</p>
            <p className="text-[14px] text-slate-500 leading-relaxed font-medium italic">
              {service.completeAddress || service.businessAddress || 'No specific address provided'}
            </p>
          </div>

          {/* Specs / Details Section */}
          {isProperty ? (
            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <LayoutGrid size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#001b4e]">Specifications</h3>
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
                 <h4 className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Amenities</h4>
                 <div className="flex flex-wrap gap-2">
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold ${service.bikeParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-300'}`}>
                      <Bike size={14} /> Bike Parking
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold ${service.carParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-300'}`}>
                      <Car size={14} /> Car Parking
                    </div>
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
                 <h4 className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Description</h4>
                 <p className="text-[14px] text-[#001b4e] leading-relaxed font-medium">
                   {service.description || 'No description provided.'}
                 </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Info size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#001b4e]">About</h3>
              </div>
              <p className="text-[14px] text-[#001b4e] leading-relaxed font-medium">
                {service.description || service.shortDescription || 'No description provided.'}
              </p>
            </div>
          )}

          {/* Gallery Section */}
          {(service.images?.length > 0 || service.portfolio?.length > 0) && (
            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#001b4e]">Gallery</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(service.images || service.portfolio || []).map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
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
              className="flex-1 h-16 bg-[#001b4e] text-white rounded-[24px] shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <div className="p-2 bg-white/10 rounded-xl">
                 <Edit3 size={20} />
              </div>
              <span className="font-bold text-[16px]">Edit Details</span>
            </button>
            
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center shadow-lg active:scale-95 transition-all border border-red-100"
            >
              <Trash2 size={24} />
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
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-[24px] font-black text-[#001b4e] leading-tight mb-2">Delete this?</h3>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-8 font-medium">
                This action is permanent. Are you sure?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-[16px] active:scale-95 transition-all"
                >
                  Yes, Delete Permanently
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-[#001b4e] rounded-2xl font-bold text-[16px] active:scale-95 transition-all"
                >
                  No, Keep it
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
    <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center">
      <div className="text-slate-400 mb-2">{icon}</div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-[15px] font-black text-[#001b4e] truncate">{value || '-'}</div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{label}</div>
        <div className="text-[14px] font-bold text-[#001b4e]">{value}</div>
      </div>
    </div>
  );
}
