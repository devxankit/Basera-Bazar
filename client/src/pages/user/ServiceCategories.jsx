import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import acImg from '../../assets/professional service/ac maintenance.jpg';
import arcImg from '../../assets/professional service/architect.jpg';
import carpImg from '../../assets/professional service/carpenter.jpg';
import cctvImg from '../../assets/professional service/cctv service.jpg';
import civilImg from '../../assets/professional service/civil engineer.jpg';
import elecImg from '../../assets/professional service/electrician.jpg';
import intImg from '../../assets/professional service/interior design.jpg';
import liftImg from '../../assets/professional service/lift installation.jpg';
import pmImg from '../../assets/professional service/packers and movers.jpg';
import paintImg from '../../assets/professional service/painter.jpg';
import plumbImg from '../../assets/professional service/plumber.jpg';
import survImg from '../../assets/professional service/surveyor ameen.jpg';
import vastuImg from '../../assets/professional service/vastu consultant.jpg';
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
      {/* Premium Blue Header Section */}
      <div className="bg-[#1e3a8a] text-white px-6 pt-12 pb-10 space-y-6 relative rounded-b-[40px] shadow-2xl shadow-blue-900/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 border border-white/20 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold uppercase tracking-widest text-white/90">Service Categories</h1>
          <button className="p-2 border border-white/20 rounded-xl hover:bg-white/10 transition-all">
            <Search size={22} />
          </button>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-3xl font-semibold tracking-tight leading-none">Choose Your Service</h2>
          <p className="text-blue-100/70 text-sm font-medium uppercase tracking-wider">Find the best service providers in your area</p>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="p-5 -mt-6 grid grid-cols-2 gap-4 pb-24">
        {services.map((svc, idx) => (
          <button
            key={idx}
            onClick={() => navigate(`/browse/service?sub=${svc.title.toLowerCase()}`)}
            className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-4 group active:scale-[0.98] transition-all"
          >
            <div className="w-full h-24 rounded-2xl bg-slate-50 flex items-center justify-center p-3 group-hover:scale-110 transition-transform overflow-hidden">
              <img src={svc.image} alt={svc.title} className="w-full h-full object-contain" />
            </div>
            <h3 className="text-[12px] font-semibold text-primary-900 leading-tight tracking-wide text-center uppercase min-h-[32px] flex items-center justify-center">{svc.title}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceCategories;
