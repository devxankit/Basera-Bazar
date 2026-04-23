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
    if (actualRole.includes('supplier')) {
      return {
        title: 'My Products',
        item: 'product',
        plural: 'products',
        icon: <Package size={120} className="text-slate-200" />
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
    } else if (role.includes('supplier')) {
      navigate('/partner/add-product');
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
        // Update local state
        setItems(prevItems => prevItems.filter(item => item.id.toString() !== id.toString()));

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
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-medium text-[#001b4e]">{labels.title}</h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-3 overflow-x-auto hide-scrollbar border-b border-slate-50 bg-white sticky top-[60px] z-40 flex items-center gap-2">
        {['All', 'Featured', 'Pending', 'Rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-full whitespace-nowrap text-[13px] font-bold transition-all ${
              filter === f 
                ? 'bg-[#001b4e] text-white shadow-md shadow-blue-900/10' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
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
                className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-row relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
              >
                {/* Left: Compact Image Section */}
                <div className="relative w-24 xs:w-28 sm:w-36 h-auto bg-slate-100 overflow-hidden shrink-0">
                   {item.thumbnail || item.image ? (
                     <img 
                        src={item.thumbnail || item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#001b4e]">
                        {item.type === 'property' ? <Building2 size={24} className="opacity-20" /> : <Package size={24} className="opacity-20" />}
                     </div>
                   )}
                   
                   {/* Status Dot Overlay */}
                   <div className="absolute top-2 left-2 z-10">
                      <div className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full border-2 border-white shadow-sm ${
                        item.status === 'active' 
                          ? 'bg-green-500' 
                          : item.status === 'rejected' 
                            ? 'bg-red-500' 
                            : 'bg-amber-500'
                      }`} />
                   </div>
                </div>
                {/* Right: Tighter Content Section */}
                <div className="flex-grow p-3 xs:p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div className="space-y-0.5 xs:space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                       <span className="text-[8px] xs:text-[9px] mm:text-[10px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[80px] sm:max-w-[100px]">
                          {item.type === 'property' ? item.property_type || 'Property' : item.category || 'Listing'}
                       </span>
                       <span className="text-[8px] xs:text-[9px] mm:text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          #{item?.id?.slice?.(-4).toUpperCase()}
                       </span>
                    </div>
                    
                    <h4 className="text-[13px] xs:text-[15px] mm:text-[17px] font-black text-[#001b4e] leading-tight line-clamp-2 mb-0.5 sm:mb-1 pr-4">
                       {item.title || item.serviceName || 'Untitled Listing'}
                    </h4>
 
                    <div className="flex items-center gap-1 text-[10px] xs:text-[11px] mm:text-[12px] text-slate-400 mb-1 xs:mb-1.5 sm:mb-2 font-medium">
                       <MapPin size={9} xs:size={10} className="shrink-0 text-blue-500" />
                       <span className="truncate max-w-[120px] sm:max-w-none">{item.display_location || 'No location'}</span>
                    </div>
 
                    {/* Compact Property Specs */}
                    {item.type === 'property' && (
                      <div className="flex flex-wrap items-center gap-x-2.5 xs:gap-x-3 gap-y-0.5 text-slate-500">
                         {item.bhk && (
                            <div className="flex items-center gap-1">
                               <BedDouble size={11} xs:size={12} className="text-blue-400/60" />
                               <span className="text-[9px] xs:text-[10px] mm:text-[11px] font-black uppercase tracking-tight">{item.bhk} BHK</span>
                            </div>
                         )}
                         {item.area && (
                            <div className="flex items-center gap-1">
                               <Square size={10} xs:size={11} className="text-blue-400/60" />
                               <span className="text-[9px] xs:text-[10px] mm:text-[11px] font-black uppercase tracking-tight">{item.area} {item.areaUnit}</span>
                            </div>
                         )}
                      </div>
                    )}
                  </div>
 
                  {/* Price & Actions Row */}
                  <div className="flex items-center justify-between mt-1 xs:mt-1.5 sm:mt-auto pt-2 xs:pt-3 border-t border-slate-50">
                    <div className="text-[13px] xs:text-[15px] mm:text-[18px] font-black text-[#001b4e]">
                       ₹{typeof item.price === 'object' 
                         ? `${Number(item.price.value).toLocaleString()}${(!item.price.unit || item.price.unit === 'Total') ? '' : ' ' + item.price.unit}` 
                         : Number(item.price || 0).toLocaleString()}
                    </div>
 
                    <div className="flex items-center gap-1 xs:gap-1.5">
                       <button 
                          onClick={(e) => handleEdit(e, item)}
                          className="h-7 w-7 xs:h-8 xs:w-8 mm:h-10 mm:w-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg mm:rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-90 border border-blue-100/50"
                       >
                          <Edit size={12} xs:size={14} />
                       </button>
                       <button 
                          onClick={(e) => handleDelete(e, item.id)}
                          className="h-7 w-7 xs:h-8 xs:w-8 mm:h-10 mm:w-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg mm:rounded-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-90 border border-rose-100/50"
                       >
                          <Trash2 size={12} xs:size={14} />
                       </button>
                    </div>
                  </div>
                </div>v>

                {/* Intent Ribbon */}
                {item.listing_intent && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#001b4e] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-tighter shadow-sm">
                      {item.listing_intent}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
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
            className={`p-5 rounded-2xl shadow-2xl flex items-center gap-3 active:scale-90 transition-all font-medium ${
              !partner.is_active 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-[#001b4e] text-white'
            }`}
          >
            <Plus size={24} />
            <span className="text-[15px]">Add {labels.item.charAt(0).toUpperCase() + labels.item.slice(1)}</span>
          </button>
        </div>
      </div>
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
