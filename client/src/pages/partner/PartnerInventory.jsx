import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  Package, 
  Plus, 
  ArrowLeft, 
  Menu,
  ChevronRight,
  Edit,
  Trash2,
  MapPin,
  BedDouble,
  Square,
  AlertCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function PartnerInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
      return;
    }

    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/listings/my');
        if (response.data.success) {
          const normalizedData = (response.data.data || []).map(item => db._normalize(item));
          setItems(normalizedData);
        }
      } catch (err) {
        console.error("Error fetching partner inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [user, navigate]);

  if (!user) return null;
  const partner = user;
  const actualRole = (partner?.active_role || partner?.partner_type || partner?.role || '').toLowerCase();

  const getLabels = () => {
    if (actualRole.includes('agent')) {
      return {
        title: 'My Properties',
        item: 'property',
        plural: 'properties',
        icon: <Building2 size={120} className="text-slate-200" />
      };
    }
    if (actualRole.includes('service')) {
      return {
        title: 'My Services',
        item: 'service',
        plural: 'services',
        icon: <Briefcase size={120} className="text-slate-200" />
      };
    }

    
    return {
      title: 'My Listings',
      item: 'listing',
      plural: 'listings',
      icon: <Package size={120} className="text-slate-200" />
    };
  };

  const labels = getLabels();

  const handleAddAction = () => {
    const role = (partner.partner_type || partner.role || '').toLowerCase();
    if (role.includes('service')) {
      navigate('/partner/add-service');
    } else if (role.includes('agent') || role.includes('property')) {
      navigate('/partner/add-property');
    } else if (role.includes('mandi')) {
      navigate('/partner/add-mandi-product');
    } else {
      alert(`Add ${labels.item} flow coming soon for ${role}s!`);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await api.delete(`/listings/${id}`);
        // Update local state by checking both id and _id
        setItems(prevItems => prevItems.filter(item => {
          const itemId = item.id || item._id;
          return itemId && itemId.toString() !== id.toString();
        }));

        // Log Activity
        const uid = partner?._id || partner?.id;
        if (uid) {
           const logKey = `baserabazar_activity_${uid}`;
           let logs = [];
           try { logs = JSON.parse(localStorage.getItem(logKey)) || []; } catch(e){}
           logs.push({
             type: 'listing',
             title: 'Removed Listing',
             time: 'Just now',
             timestamp: new Date().toISOString()
           });
           localStorage.setItem(logKey, JSON.stringify(logs));
        }
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert("Failed to delete listing. Please try again.");
      }
    }
  };

  const handleEdit = (e, item) => {
    e.stopPropagation();
    const role = (partner.partner_type || partner.role || '').toLowerCase();
    if (item.type === 'property' || role.includes('agent')) {
      navigate(`/partner/add-property?edit=${item.id}`);
    } else if (item.type === 'product' || role.includes('supplier')) {
      navigate(`/partner/add-product?edit=${item.id}`);
    } else if (item.type === 'mandi_product' || role.includes('mandi')) {
      navigate(`/partner/add-mandi-product?edit=${item.id}`);
    } else {
      navigate(`/partner/add-service?edit=${item.id}`);
    }
  };

  const displayedItems = items.filter(item => {
     // First filter by type matches the current view (Property Agent should only see properties, etc.)
     if (actualRole.includes('agent') && item.type !== 'property') return false;
     if (actualRole.includes('service') && item.type !== 'service') return false;
     if (actualRole.includes('supplier') && item.type !== 'product') return false;
     if (actualRole.includes('mandi') && item.type !== 'mandi_product') return false;

     if (filter === 'All') return true;
     if (filter === 'Featured') return item.isFeatured === true;
     if (filter === 'Pending') return item.status === 'pending_approval' || item.status === 'draft' || !item.status;
     if (filter === 'Rejected') return item.status === 'rejected';
     return true;
  });

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">{labels.title}</h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 overflow-x-auto hide-scrollbar border-b border-slate-50 bg-white sticky top-[54px] z-40 flex items-center gap-2">
        {['All', 'Featured', 'Pending', 'Rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg xs:rounded-xl whitespace-nowrap text-[12px] font-bold uppercase tracking-tight transition-all ${
              filter === f 
                ? 'bg-[#001b4e] text-white shadow-md' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-grow p-6 pb-40">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
              <div className="w-12 h-12 border-4 border-[#001b4e] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-medium">Loading your {labels.plural}...</p>
           </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center pt-20">
            <div className="mb-8 opacity-30">
              {labels.icon}
            </div>
            
            <h3 className="text-[22px] font-medium text-slate-600 mb-2">No {labels.plural} yet</h3>
            <p className="text-slate-400 text-[15px] max-w-[240px] leading-relaxed">
              New listings added will appear here as a list.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedItems.map((item) => (
              <motion.div 
                key={item?.id || Math.random()} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(`/partner/service-details/${item._id || item.id}`)}
                className="bg-white rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-row relative group hover:shadow-md transition-all cursor-pointer"
              >
                {/* Left: Compact Image Section */}
                <div className="relative w-24 xs:w-28 sm:w-32 h-auto bg-slate-100 overflow-hidden shrink-0">
                   {item.thumbnail || item.image ? (
                     <img 
                        src={item.thumbnail || item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#001b4e]">
                        {item.type === 'property' ? <Building2 size={20} className="opacity-20" /> : <Package size={20} className="opacity-20" />}
                     </div>
                   )}
                   
                   {/* Status Dot Overlay */}
                   <div className="absolute top-1.5 left-1.5 z-10">
                      <div className={`w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full border-2 border-white shadow-sm ${
                        item.status === 'active' 
                          ? 'bg-green-500' 
                          : item.status === 'rejected' 
                            ? 'bg-red-500' 
                            : 'bg-amber-500'
                      }`} />
                   </div>
                </div>
                {/* Right: Tighter Content Section */}
                <div className="flex-grow p-2.5 xs:p-3 sm:p-4 flex flex-col justify-between min-w-0">
                  <div className="space-y-0.5 xs:space-y-1">
                    <div className="flex items-center justify-between mb-0.5">
                       <span className="text-[7px] xs:text-[8px] mm:text-[9px] font-black text-blue-600 uppercase tracking-[0.1em] truncate max-w-[80px] sm:max-w-[100px]">
                          {item.type === 'property' ? item.property_type || 'Property' : item.category || 'Listing'}
                       </span>
                       <span className="text-[7px] xs:text-[8px] mm:text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-60">
                          #{item?.id?.slice?.(-4).toUpperCase()}
                       </span>
                    </div>
                    
                    <h4 className="text-[12px] xs:text-[14px] mm:text-[15px] font-bold text-[#001b4e] leading-tight line-clamp-1 mb-0.5 pr-4 uppercase tracking-tight">
                       {item.title || item.serviceName || 'Untitled Listing'}
                    </h4>
 
                    <div className="flex items-center gap-1 text-[9px] xs:text-[10px] mm:text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-widest opacity-50">
                       <MapPin size={8} xs:size={9} className="shrink-0 text-blue-500" />
                       <span className="truncate max-w-[120px] sm:max-w-none">{item.display_location || 'No location'}</span>
                    </div>
 
                    {item.type === 'property' && (
                      <div className="flex flex-wrap items-center gap-x-2 xs:gap-x-2.5 gap-y-0.5 text-slate-400">
                         {item.bhk && (
                            <div className="flex items-center gap-1">
                               <BedDouble size={9} className="text-blue-400/40" />
                               <span className="text-[8px] xs:text-[9px] font-bold uppercase tracking-widest leading-none opacity-60">{item.bhk} BHK</span>
                            </div>
                         )}
                         {item.area && (
                            <div className="flex items-center gap-1">
                               <Square size={8} className="text-blue-400/40" />
                               <span className="text-[8px] xs:text-[9px] font-bold uppercase tracking-widest leading-none opacity-60">{item.area} {item.areaUnit}</span>
                            </div>
                         )}
                      </div>
                    )}
                  </div>
 
                  {/* Price & Actions Row */}
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
                    <div className="text-[13px] xs:text-[14px] mm:text-[15px] font-bold text-[#001b4e] leading-none uppercase tracking-tighter">
                       {item.category === 'service' || item.type === 'service' ? (
                          item.years_of_experience ? `${item.years_of_experience} YEARS EXP.` : 'SERVICE DETAILS'
                       ) : (
                          `₹${typeof item.price === 'object' 
                           ? `${Number(item.price.value).toLocaleString()}${(!item.price.unit || item.price.unit === 'Total' || item.price.unit === 'Contact for Price') ? '' : ' ' + item.price.unit}` 
                           : Number(item.price || 0).toLocaleString()}`
                       )}
                    </div>
 
                    <div className="flex items-center gap-1">
                       <button 
                          onClick={(e) => handleEdit(e, item)}
                          className="h-6 w-6 xs:h-7 xs:w-7 mm:h-9 mm:w-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg mm:rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-90 border border-blue-100/30"
                       >
                          <Edit size={10} xs:size={12} />
                       </button>
                       <button 
                          onClick={(e) => handleDelete(e, item.id || item._id)}
                          className="h-6 w-6 xs:h-7 xs:w-7 mm:h-9 mm:w-9 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg mm:rounded-xl hover:bg-rose-500 hover:text-white transition-all transform active:scale-90 border border-rose-100/30"
                       >
                          <Trash2 size={10} xs:size={12} />
                       </button>
                    </div>
                  </div>
                </div>

                {/* Intent Ribbon */}
                {item.listing_intent && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#001b4e] text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-bl-lg tracking-widest shadow-sm">
                      {item.listing_intent}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button - Hidden for Suppliers */}
      {!actualRole.includes('supplier') && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-6 pointer-events-none z-[70]">
          <div className="flex justify-end pointer-events-auto">
            <button 
              onClick={() => {
                if (!partner.is_active) {
                  alert("Your account is disabled. Complete KYC to start listing.");
                  return;
                }
                handleAddAction();
              }}
              disabled={!partner.is_active}
              className={`p-4 xs:p-5 rounded-xl xs:rounded-2xl shadow-2xl flex items-center gap-3 active:scale-90 transition-all font-bold uppercase tracking-widest ${
                !partner.is_active 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#001b4e] text-white'
              }`}
            >
              <Plus size={22} />
              <span className="text-[13px] xs:text-[14px]">Add {labels.item}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuOption({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="text-slate-400 group-hover:text-[#001b4e] transition-colors">{icon}</div>
        <span className="text-[15px] font-medium text-slate-600 group-hover:text-[#001b4e] transition-colors">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}
