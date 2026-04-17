import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';

import houseImg from '../../assets/properties categories/house.jpg';
import hostelImg from '../../assets/properties categories/hostel.jpg';
import officeImg from '../../assets/properties categories/office.jpg';
import plotImg from '../../assets/properties categories/plot.jpeg';
import warehouseImg from '../../assets/properties categories/warehouse.jpg';

const localImages = {
  'apartment': houseImg,
  'hostel': hostelImg,
  'office': officeImg,
  'plot': plotImg,
  'warehouse': warehouseImg,
};

const PropertyCategories = () => {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/listings/categories?type=property');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching properties categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 text-primary-900 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-semibold text-primary-900 tracking-tight uppercase">Property Categories</h1>
      </div>

      {/* List */}
      <div className="p-5 space-y-4 flex-grow pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading Categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No property categories found</p>
          </div>
        ) : (
          categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => navigate(`/browse/property?sub=${cat.slug}`)}
              className="w-full bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 group-hover:scale-110 transition-transform overflow-hidden">
                  {cat.icon || localImages[cat.slug] ? (
                    <img src={cat.icon || localImages[cat.slug]} alt={cat.name} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl" />
                  )}
                </div>
                <div className="text-left space-y-1">
                  <h3 className="text-[14px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.name}</h3>
                  <span className="inline-block bg-primary-50 text-primary-600 text-[10px] font-semibold px-3 py-1 rounded-full border border-primary-100 uppercase tracking-widest leading-none">
                    {cat.listing_count || 0} properties
                  </span>
                </div>
              </div>
              <div className="text-slate-300 group-hover:text-primary-500 transition-colors">
                <ChevronRight size={24} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertyCategories;
