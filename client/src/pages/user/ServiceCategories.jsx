import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';

import acImg from '../../assets/professional service/ac maintenance.jpg';
import arcImg from '../../assets/professional service/architect.jpg';
import carpImg from '../../assets/professional service/carpenter.jpg';
import cctvImg from '../../assets/professional service/cctv service.jpg';
import civilImg from '../../assets/professional service/civil engineer.jpg';
import elecImg from '../../assets/professional service/electrician.jpg';
import intImg from '../../assets/professional service/interior designer.jpg';
import liftImg from '../../assets/professional service/lift installation.jpg';
import pmImg from '../../assets/professional service/packers and movers.jpg';
import paintImg from '../../assets/professional service/painter.jpg';
import plumbImg from '../../assets/professional service/plumber.jpg';
import survImg from '../../assets/professional service/surveyor ameen.jpg';
import vastuImg from '../../assets/professional service/vastu consultant.jpg';

const localImages = {
  'ac-maintenance': acImg,
  'cctv-services': cctvImg,
  'architect': arcImg,
  'carpenter': carpImg,
  'civil-engineer': civilImg,
  'electrician': elecImg,
  'interior-designer': intImg,
  'lift-installation': liftImg,
  'packers-and-movers': pmImg,
  'painter': paintImg,
  'plumber': plumbImg,
  'surveyor-ameen': survImg,
  'vastu-consultant': vastuImg
};

const ServiceCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/listings/categories?type=service');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching service categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  return (
    <div className="bg-slate-50 flex flex-col font-sans">
      {/* Premium Subtle Header Section */}
      <div className="bg-white border-b border-slate-100 px-6 pt-5 pb-5 space-y-4 relative z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-primary-900">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400">Service Categories</h1>
            <h2 className="text-xl font-semibold text-primary-900 tracking-tight">Choose Service</h2>
          </div>
          <button className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-primary-900">
            <Search size={22} />
          </button>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="p-5 flex-grow pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary-500" size={32} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Loading Categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No service categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => navigate(`/browse/service?sub=${cat.slug}`)}
                className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-4 group transition-all"
              >
                <div className="w-full h-24 rounded-2xl bg-white flex items-center justify-center p-3 group-hover:scale-110 transition-transform overflow-hidden">
                  {cat.icon || localImages[cat.slug] ? (
                    <img src={cat.icon || localImages[cat.slug]} alt={cat.name} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl" />
                  )}
                </div>
                <h3 className="text-[12px] font-semibold text-primary-900 leading-tight tracking-wide text-center uppercase min-h-[32px] flex items-center justify-center">
                  {cat.name}
                </h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCategories;
