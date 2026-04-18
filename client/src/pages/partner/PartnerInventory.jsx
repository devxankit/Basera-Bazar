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
  Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerInventory() {
  const navigate = useNavigate();
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
          setItems(response.data.data);
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

  const getLabels = () => {
    switch (partner.role) {
      case 'agent':
        return {
          title: 'My Properties',
          item: 'property',
          plural: 'properties',
          icon: <Building2 size={120} className="text-slate-200" />
        };
      case 'service':
        return {
          title: 'My Services',
          item: 'service',
          plural: 'services',
          icon: <Briefcase size={120} className="text-slate-200" />
        };
      case 'supplier':
        return {
          title: 'My Products',
          item: 'product',
          plural: 'products',
          icon: <Package size={120} className="text-slate-200" />
        };
      default:
        return {
          title: 'My Inventory',
          item: 'item',
          plural: 'items',
          icon: <Package size={120} className="text-slate-200" />
        };
    }
  };

  const labels = getLabels();

  const handleAddAction = () => {
    if (partner.role === 'service') {
      navigate('/partner/add-service');
    } else if (partner.role === 'agent') {
      navigate('/partner/add-property');
    } else if (partner.role === 'supplier') {
      navigate('/partner/add-product');
    } else {
      alert(`Add ${labels.item} flow coming soon for ${partner.role}s!`);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this listing?")) {
      const saved = localStorage.getItem('baserabazar_partner_services');
      if (saved) {
        let allItems = JSON.parse(saved);
        allItems = allItems.filter(item => item.id.toString() !== id.toString());
        localStorage.setItem('baserabazar_partner_services', JSON.stringify(allItems));
        
        // Update local state
        setItems(prevItems => prevItems.filter(item => item.id.toString() !== id.toString()));
      }
    }
  };

  const handleEdit = (e, item) => {
    e.stopPropagation();
    if (item.type === 'property' || partner.role === 'agent') {
      navigate(`/partner/add-property?edit=${item.id}`);
    } else if (item.type === 'product' || partner.role === 'supplier') {
      navigate(`/partner/add-product?edit=${item.id}`);
    } else {
      // Assuming existing fallback for services
      navigate(`/partner/add-service?edit=${item.id}`);
    }
  };

  const displayedItems = items.filter(item => {
     if (filter === 'All') return true;
     if (filter === 'Featured') return item.isFeatured === true;
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
        {['All', 'Featured'].map(f => (
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
          <div className="space-y-5">
            {displayedItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative group"
              >
                {/* Massive Image Header */}
                <div 
                  className="relative h-48 w-full bg-slate-100 cursor-pointer overflow-hidden" 
                  onClick={() => navigate(`/partner/service-details/${item.id}`)}
                >
                   {item.thumbnail || item.image ? (
                     <img src={item.thumbnail || item.image} alt={item.serviceName || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : item.type === 'property' ? (
                     <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#001b4e]">
                        <Building2 size={40} className="opacity-30" />
                     </div>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#001b4e]">
                        <Package size={40} className="opacity-30" />
                     </div>
                   )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col gap-4">
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => navigate(`/partner/service-details/${item.id}`)}
                  >
                    <div className="pr-4 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[18px] font-bold text-[#001b4e] leading-snug line-clamp-1">{item.serviceName || item.title}</h4>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-[#001b4e] transition-colors shrink-0" />
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[12px] font-medium text-slate-500 uppercase tracking-tight">{item.category}</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">{item.serviceType}</span>
                      </div>
                      
                      {item.price && (
                         <div className="text-[16px] font-extrabold text-[#001b4e]">
                            {typeof item.price === 'object' 
                              ? `₹${item.price.value}${item.price.unit || ''}` 
                              : `₹${Number(item.price).toLocaleString()}`}
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-end gap-2">
                      <button 
                         onClick={(e) => handleEdit(e, item)}
                         className="flex-grow flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-xl text-[13px] font-bold hover:bg-blue-100 active:scale-95 transition-all"
                      >
                         <Edit size={16} /> Edit
                      </button>
                      <button 
                         onClick={(e) => handleDelete(e, item.id)}
                         className="flex items-center justify-center bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 active:scale-95 transition-all w-[44px]"
                      >
                         <Trash2 size={18} />
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-36 right-6 z-[70]">
        <button 
          onClick={handleAddAction}
          className="bg-[#001b4e] text-white p-5 rounded-2xl shadow-2xl flex items-center gap-3 active:scale-90 transition-all font-medium"
        >
          <Plus size={24} />
          <span className="text-[15px]">Add {labels.item.charAt(0).toUpperCase() + labels.item.slice(1)}</span>
        </button>
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
