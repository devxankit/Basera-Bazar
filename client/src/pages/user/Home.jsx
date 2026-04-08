import React from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../../components/common/BannerCarousel';
import { Search, Building2, Wrench, Store, ArrowRight, MapPin, Heart, Plus, Briefcase } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import propFeatured1 from '../../assets/images/prop_featured_1.png';
import srvAcFix from '../../assets/images/srv_ac_fix.png';
import srvSecurityCam from '../../assets/images/srv_security_cam.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const { currentLocation } = useLocationContext();
  const selectedCity = currentLocation?.split(',')[0].trim() || 'Muzaffarpur';

  const categories = [
    { 
      id: 'property', 
      title: 'PROPERTIES', 
      count: '1.2k+ listings', 
      icon: Building2, 
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      path: '/category/property'
    },
    { 
      id: 'service', 
      title: 'SERVICES', 
      count: '800+ listings', 
      icon: Wrench, 
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
      borderColor: 'border-orange-100',
      path: '/category/service'
    },
    { 
      id: 'supplier', 
      title: 'SUPPLIERS', 
      count: '450+ listings', 
      icon: Store, 
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-100',
      path: '/category/supplier'
    }
  ];

  return (
    <div className="space-y-6 pb-20 bg-slate-50 min-h-screen">


      {/* Banner Section */}
      <div className="px-5">
        <BannerCarousel />
      </div>

      {/* Vertical Selection Section (Ref #3) */}
      <div className="px-5 space-y-4">
        <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">
          Browse Categories
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-3 active:scale-95 transition-all text-center group"
            >
              <div className={cn(
                "p-3 rounded-2xl transition-transform group-hover:scale-110 border",
                cat.bgColor,
                cat.iconColor,
                cat.borderColor
              )}>
                <cat.icon size={26} strokeWidth={2} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[10px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.title}</h3>
                <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter">{cat.count}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Properties (New Section) */}
      <div className="space-y-4">
        <div className="px-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">Featured Properties</h2>
          <button onClick={() => navigate('/browse/property')} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-all uppercase tracking-widest">View All</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
          {[
            { id: 'l1', price: '52.00 L', area: '2,040 sqft', img: propFeatured1, city: 'Muzaffarpur' },
            { id: 'prop_villa_1', price: '1.20 Cr', area: '3,200 sqft', img: propFeatured1, city: 'Danapur' }
          ].filter(item => selectedCity === 'All Locations' || (item.city && item.city.includes(selectedCity))).map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/listing/${item.id}`)}
              className="min-w-[280px] bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden active:scale-[0.98] transition-all group relative cursor-pointer"
            >
              <div className="h-44 relative">
                <img src={item.img} className="w-full h-full object-cover shadow-inner opacity-90 group-hover:opacity-100 transition-opacity" alt="Property" />
                <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm text-slate-300">
                  <Heart size={16} fill="currentColor" className="opacity-20" />
                </button>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-semibold text-[#1f2355] text-[17px] tracking-tight">{item.city === 'Muzaffarpur' ? 'Residential Plot' : 'Modern Eco Villa'}</h3>
                <p className="text-[14px] font-medium text-[#4a5578] flex items-center gap-1.5"><MapPin size={14} className="text-[#159f42]" />{item.city}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[#124db5] text-lg font-semibold tracking-tight">{item.price}</span>
                  <span className="text-[12px] font-semibold text-[#64719b] bg-[#f4f6fc] px-4 py-1.5 rounded-xl border border-[#eef2fc]">{item.area}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Services (Horizontal Scroll) */}
      <div className="space-y-4">
        <div className="px-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">Featured Services</h2>
          <button onClick={() => navigate('/browse/service')} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-all uppercase tracking-widest">View All</button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
          {[
            { id: 'l3', title: 'CCTV & Computers Service', img: srvSecurityCam, city: 'Muzaffarpur' },
            { id: 'srv_plumb_1', title: 'Shanawaz AC Services', img: srvAcFix, city: 'Patna' }
          ].filter(item => selectedCity === 'All Locations' || (item.city && item.city.includes(selectedCity))).map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/service/${item.id}`)}
              className="min-w-[280px] bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="h-40 relative">
                <img src={item.img} className="w-full h-full object-cover shadow-inner opacity-90 group-hover:opacity-100 transition-opacity" alt="Service" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest text-emerald-600 border border-emerald-100 shadow-sm">
                  Active
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-primary-900 text-sm tracking-tight">{item.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <MapPin size={12} className="text-emerald-500" />{item.city}
                  </div>
                  <button className="bg-emerald-50 text-emerald-600 text-[11px] font-semibold px-5 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">BOOK</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
