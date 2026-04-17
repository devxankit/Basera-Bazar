import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, Trash2, MapPin, 
  Briefcase, Calendar, Info, LayoutGrid,
  ChevronRight, AlertTriangle, Home, Building2, BedDouble, Bath, Square, Navigation, Car, Bike, Users, IndianRupee, Tag, Package
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function PartnerServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // If no user is logged in, we shouldn't even be here
  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  if (!user) return null;
  const partner = user;

  useEffect(() => {
    const services = JSON.parse(localStorage.getItem('baserabazar_partner_services') || '[]');
    const found = services.find(s => s.id.toString() === id);
    if (found) {
      setService(found);
    } else {
      navigate('/partner/services');
    }
  }, [id, navigate]);

  const isProperty = service?.type === 'property';
  const isProduct = service?.type === 'product';
  const isService = service?.type === 'service' || (!isProperty && !isProduct);

  const getLabel = () => {
    if (isProperty) return 'Property';
    if (isProduct) return 'Product';
    return 'Service';
  };

  const handleDelete = () => {
    const services = JSON.parse(localStorage.getItem('baserabazar_partner_services') || '[]');
    const filtered = services.filter(s => s.id.toString() !== id);
    localStorage.setItem('baserabazar_partner_services', JSON.stringify(filtered));
    navigate('/partner/services');
  };

  if (!service) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 text-[#001b4e]">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-medium text-[#001b4e]">{getLabel()} Details</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (isProperty) navigate(`/partner/add-property?edit=${service.id}`);
              else if (isProduct) navigate(`/partner/add-product?edit=${service.id}`);
              else navigate(`/partner/add-service?edit=${service.id}`);
            }}
            className="p-2 text-blue-600 bg-blue-50 rounded-xl"
          >
            <Edit3 size={20} />
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-600 bg-red-50 rounded-xl"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Main Image & Status */}
        <div className="relative rounded-[32px] overflow-hidden aspect-video bg-slate-200 shadow-lg">
          {service.thumbnail ? (
            <img src={service.thumbnail} alt={service.serviceName || service.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <LayoutGrid size={48} />
            </div>
          )}
        </div>

        {/* Title & Category */}
        <div className="space-y-2">
          <h1 className="text-[24px] font-medium text-[#001b4e] leading-tight capitalize">
            {service.serviceName || service.title}
          </h1>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-[13px] font-medium uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
              {service.category}
            </span>
            {service.subCategory && (
              <>
                <ChevronRight size={14} />
                <span className="text-[13px] font-medium text-slate-400 capitalize">{service.subCategory}</span>
              </>
            )}
          </div>
        </div>

         {/* Quick Info Grid */}
         {isProduct ? (
           <div className="grid grid-cols-2 gap-4">
             <InfoCard 
               icon={<IndianRupee size={18} className="text-emerald-500" />} 
               label="Price" 
               value={service.priceOnRequest ? 'On Request' : `₹${service.price}/${service.unit}`} 
             />
             <InfoCard 
               icon={<Tag size={18} className="text-blue-500" />} 
               label="Brand" 
               value={service.brand || 'Not Specified'} 
             />
             <InfoCard 
               icon={<Package size={18} className="text-orange-500" />} 
               label="Min Order" 
               value={service.minOrder ? `${service.minOrder} units` : 'No Minimum'} 
             />
             <InfoCard 
               icon={<Briefcase size={18} className="text-purple-500" />} 
               label="Type" 
               value="Supplier" 
             />
           </div>
         ) : !isProperty ? (
           <div className="grid grid-cols-2 gap-4">
             <InfoCard 
               icon={<Briefcase size={18} className="text-blue-500" />} 
               label="Type" 
               value={service.serviceType} 
             />
             <InfoCard 
               icon={<Calendar size={18} className="text-purple-500" />} 
               label="Experience" 
               value={service.experience || 'Not specified'} 
             />
           </div>
         ) : (
           <div className="grid grid-cols-3 gap-3">
             <InfoCard icon={<Tag size={16} className="text-blue-500" />} label="Status" value={service.serviceType} />
             <InfoCard icon={<Home size={16} className="text-emerald-500" />} label="Type" value={service.propertyType || '-'} />
             <InfoCard icon={<IndianRupee size={16} className="text-orange-500" />} label="Price" value={service.price ? `₹${Number(service.price).toLocaleString()}` : '-'} />
           </div>
         )}

        {/* Location Section */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h3 className="text-[16px] font-medium text-[#001b4e]">Location Details</h3>
          </div>
          <p className="text-[15px] font-medium text-[#001b4e] mb-1">{service.district}, {service.state}</p>
          <p className="text-[14px] text-slate-500 leading-relaxed font-normal italic">
            {service.completeAddress || service.businessAddress || 'No specific address provided'}
          </p>
          {service.latitude && service.longitude && (
             <div className="mt-4 pt-4 border-t border-slate-100">
               <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-[#001b4e] font-bold text-[14px] rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
               >
                  <MapPin size={16} className="text-orange-500" /> View on Google Maps
               </a>
             </div>
          )}
        </div>

        {/* Details Section */}
        {isProperty ? (
          <div className="bg-white rounded-[28px] p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <LayoutGrid size={20} />
              </div>
              <h3 className="text-[16px] font-medium text-[#001b4e]">Property Specs</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <DetailItem icon={<Square size={16} />} label="Built-up Area" value={service.builtUpArea ? `${service.builtUpArea} ${service.unit}` : '-'} />
              <DetailItem icon={<Square size={16} />} label="Carpet Area" value={service.carpetArea ? `${service.carpetArea} ${service.unit}` : '-'} />
              <DetailItem icon={<BedDouble size={16} />} label="Bedrooms" value={service.bedrooms || '-'} />
              <DetailItem icon={<Bath size={16} />} label="Bathrooms" value={service.bathrooms || '-'} />
              <DetailItem icon={<Building2 size={16} />} label="Floor" value={service.floorNumber ? `${service.floorNumber} of ${service.totalFloors}` : '-'} />
              <DetailItem icon={<Building2 size={16} />} label="Construction" value={service.constructionStatus || '-'} />
              <DetailItem icon={<Home size={16} />} label="Furnishing" value={service.furnishing || '-'} />
              <DetailItem icon={<Navigation size={16} />} label="Facing" value={service.facing || '-'} />
              <DetailItem icon={<Users size={16} />} label="Listed By" value={service.listedBy || '-'} />
              <DetailItem icon={<Users size={16} />} label="Bachelors" value={service.bachelorsAllowed ? 'Allowed' : 'Not Allowed'} />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
               <h4 className="text-[13px] font-bold text-[#001b4e] mb-3 uppercase tracking-wider">Parking & Amenities</h4>
               <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[13px] font-medium ${service.bikeParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                    <Bike size={16} /> Bike
                  </div>
                  <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[13px] font-medium ${service.carParking ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                    <Car size={16} /> Car
                  </div>
               </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
               <h4 className="text-[13px] font-bold text-[#001b4e] mb-3 uppercase tracking-wider">Description</h4>
               <p className="text-[14px] text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                 {service.description || 'No description provided.'}
               </p>
            </div>
          </div>
        ) : isProduct ? (
          <div className="bg-white rounded-[28px] p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <LayoutGrid size={20} />
              </div>
              <h3 className="text-[16px] font-medium text-[#001b4e]">Product Details</h3>
            </div>
            
            {/* Description Sub-section */}
            <div className="mb-8">
               <h4 className="text-[12px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Description</h4>
               <p className="text-[14px] text-[#001b4e] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                 {service.description || 'No description provided.'}
               </p>
            </div>

            {/* Specifications Sub-section */}
            {(service.specifications || []).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-[12px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Technical Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  {service.specifications.map((spec, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{spec.key}</span>
                      <span className="text-[14px] font-medium text-[#001b4e] truncate">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[28px] p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <h3 className="text-[16px] font-medium text-[#001b4e]">Description</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[14px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Short Summary</p>
                <p className="text-[15px] text-[#001b4e] leading-relaxed font-normal">
                  {service.shortDescription || 'No short description provided.'}
                </p>
              </div>
              {service.detailedDescription && (
                <div>
                  <p className="text-[14px] text-slate-500 font-medium mb-1 uppercase tracking-wider">Full Details</p>
                  <p className="text-[15px] text-[#001b4e] leading-relaxed font-normal p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {service.detailedDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery / Portfolio Section */}
        {((isProperty && (service.images || []).length > 0) || (isProduct && (service.images || []).length > 0) || (!isProperty && !isProduct && service.portfolio?.length > 0)) && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                <LayoutGrid size={20} />
              </div>
              <h3 className="text-[16px] font-medium text-[#001b4e]">{(isProperty || isProduct) ? 'Gallery' : 'Portfolio'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {((isProperty || isProduct) ? (service.images || []) : (service.portfolio || [])).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-[20px] font-medium text-[#001b4e] mb-2">Delete {getLabel()}?</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed mb-8 font-normal">
                  Are you sure you want to delete this {getLabel().toLowerCase()}? This action cannot be undone.
                </p>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-4.5 rounded-[20px] font-medium text-[16px] text-slate-500 bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 bg-red-500 text-white py-4.5 rounded-[20px] font-medium text-[16px] shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                  >
                    Delete
                  </button>
                </div>
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
    <div className="bg-white rounded-[24px] p-4 border border-slate-100 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[14px] font-bold text-[#001b4e] truncate capitalize">{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
          {icon}
       </div>
       <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-tight">{label}</p>
          <p className="text-[14px] font-semibold text-[#001b4e] truncate">{value}</p>
       </div>
    </div>
  );
}
