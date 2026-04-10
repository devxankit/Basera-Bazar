import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/DataEngine';
import { ArrowLeft, Search, MapPin, ChevronRight, Store } from 'lucide-react';
import aggregateImg from '../../assets/suppliers/aggregate supplier.jpg';
import brickImg from '../../assets/suppliers/brick supplier.jpg';
import cementImg from '../../assets/suppliers/cement supplier.jpg';
import materialsImg from '../../assets/suppliers/cnstruction materials supplier.jpg';
import sandImg from '../../assets/suppliers/sand supplier.jpg';
import tmtImg from '../../assets/suppliers/tmt supplier.jpg';
import { useLocationContext } from '../../context/LocationContext';

const categories = [
  { id: 'aggregate', label: 'Aggregate Supplier', image: aggregateImg },
  { id: 'bricks', label: 'Bricks Suppliers', image: brickImg },
  { id: 'cement', label: 'Cement Supplier', image: cementImg },
  { id: 'materials', label: 'Construction Materials Supplier', image: materialsImg },
  { id: 'sand', label: 'Sand Supplier', image: sandImg },
  { id: 'tmt', label: 'TMT Supplier', image: tmtImg }
];

const SupplierCategories = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const { currentLocation } = useLocationContext();

  useEffect(() => {
    const fetchCounts = async () => {
      let listings = await db.getAll('listings');
      
      // Filter by location first
      if (currentLocation && currentLocation !== 'All Locations') {
        const selectedCity = currentLocation.split(',')[0].trim();
        listings = listings.filter(item => 
          item.location?.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      const c = {};
      categories.forEach((cat, i) => {
        c[cat.id] = {
          suppliers: listings.filter(l => l.category === 'supplier' && l.details?.propertyType?.toLowerCase() === cat.id).length,
          products: i === 0 ? 1 : 0 // Mock product counts
        };
      });
      setCounts(c);
    };
    fetchCounts();
  }, [currentLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div 
        className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 text-primary-900 hover:bg-slate-50 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-semibold text-primary-900 tracking-tight uppercase">Supplier Categories</h1>
        </div>
        <button className="p-2 text-slate-400">
          <Search size={22} />
        </button>
      </div>

      {/* Location Bar (Ref #1 style) */}
      <div 
        className="px-5 pt-4"
      >
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex items-center gap-3">
          <MapPin size={18} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700/80 uppercase tracking-widest">Suppliers in {currentLocation.split(',')[0]}</span>
        </div>
      </div>

      {/* List */}
      <div 
        className="p-5 space-y-4 pb-32"
      >
        {categories.map((cat, idx) => (
          <div key={cat.id} className="space-y-2">
            <button
              onClick={() => navigate(`/browse/supplier?sub=${cat.id}`)}
              className="w-full bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                </div>
                <div className="text-left space-y-2">
                  <h3 className="text-[14px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.label}</h3>
                  <div className="flex gap-2">
                    <span className="bg-indigo-50 text-indigo-600 text-[9px] font-semibold px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest leading-none">
                      {counts[cat.id]?.suppliers || 0} supplier
                    </span>
                    <span className="bg-orange-50 text-orange-600 text-[9px] font-semibold px-2.5 py-1 rounded-full border border-orange-100 uppercase tracking-widest leading-none">
                      0 products
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-primary-500 transition-colors">
                <ChevronRight size={24} />
              </div>
            </button>
            {idx === 2 && (
              <div className="py-2 text-center">
                <p className="text-[10px] font-semibold text-slate-300 italic uppercase tracking-tighter">No suppliers available in this category yet</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating View All Button (Ref #1) */}
      <div 
        className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-5"
      >
        <button 
          onClick={() => navigate('/browse/supplier')}
          className="bg-[#3f51b5] text-white px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgb(63,81,181,0.4)] flex items-center gap-3 active:scale-95 transition-all group"
        >
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Store size={18} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest">View All Suppliers</span>
        </button>
      </div>
    </div>
  );
};

export default SupplierCategories;
