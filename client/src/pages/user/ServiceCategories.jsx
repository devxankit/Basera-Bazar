import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ServiceCategories = () => {
  const navigate = useNavigate();

  const services = [
    { title: 'AC maintenance', image: acImg },
    { title: 'CCTV Services', image: cctvImg },
    { title: 'Architect', image: arcImg },
    { title: 'Carpenter', image: carpImg },
    { title: 'Civil Engineer', image: civilImg },
    { title: 'Electrician', image: elecImg },
    { title: 'Interior Designer', image: intImg },
    { title: 'Lift Installation', image: liftImg },
    { title: 'packers and movers', image: pmImg },
    { title: 'Painter', image: paintImg },
    { title: 'Plumber', image: plumbImg },
    { title: 'Surveyor Ameen', image: survImg },
    { title: 'Vastu Consultant', image: vastuImg }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Subtle Header Section */}
      <div
        className="bg-white border-b border-slate-100 px-6 pt-5 pb-5 space-y-4 relative z-50 shadow-sm"
      >
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
      <div
        className="p-5 grid grid-cols-2 gap-4 pb-24"
      >
        {services.map((svc, idx) => (
          <button
            key={idx}
            onClick={() => navigate(`/browse/service?sub=${svc.title.toLowerCase()}`)}
            className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-4 group transition-all"
          >
            <div className="w-full h-24 rounded-2xl bg-white flex items-center justify-center p-3 group-hover:scale-110 transition-transform overflow-hidden">
              <img src={svc.image} alt={svc.title} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
            </div>
            <h3 className="text-[12px] font-semibold text-primary-900 leading-tight tracking-wide text-center uppercase min-h-[32px] flex items-center justify-center">{svc.title}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceCategories;
