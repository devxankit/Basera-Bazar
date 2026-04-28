import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, ChevronRight, Store, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';

const SupplierCategories = () => {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/listings/categories?type=supplier');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching supplier categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
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

      {/* Location Bar */}
      <div className="px-5 pt-4">
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex items-center gap-3">
          <MapPin size={18} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700/80 uppercase tracking-widest">
            Suppliers in {location?.city || location?.district || 'Bihar'}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="p-5 space-y-4 pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading Categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No supplier categories found</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat._id} className="space-y-2">
              <button
                onClick={() => navigate(`/browse/supplier?sub=${cat.slug}`)}
                className="w-full bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 group-hover:scale-110 transition-transform overflow-hidden">
                    <img
                      src={cat.icon && cat.icon.length > 5 ? cat.icon : '/default-product-category-image.png'}
                      alt={cat.name}
                      className="w-full h-full object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-category-image.png'; }}
                    />
                  </div>
                  <div className="text-left space-y-2">
                    <h3 className="text-[14px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.name}</h3>
                    <div className="flex gap-2">
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] font-semibold px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest leading-none">
                        {cat.listing_count || 0} supplier(s)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-primary-500 transition-colors">
                  <ChevronRight size={24} />
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Floating View All Button */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-5">
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
