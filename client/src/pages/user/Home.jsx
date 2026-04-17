import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../../components/common/BannerCarousel';
import { Search, Building2, Wrench, Store, ArrowRight, MapPin, Heart, Plus, Briefcase, Loader2, ShoppingBag } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../../services/DataEngine';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const { currentLocation } = useLocationContext();

  const [properties, setProperties] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const props = await db.getAll('listings', { category: 'property', limit: 6 });
        const srvs = await db.getAll('listings', { category: 'service', limit: 6 });
        setProperties(props);
        setServices(srvs);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      count: 'Enquiry System', 
      icon: Store, 
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-100',
      path: '/category/supplier'
    },
    { 
      id: 'mandi', 
      title: 'MANDI BAZAR', 
      count: 'Direct Order', 
      icon: ShoppingBag, 
      bgColor: 'bg-indigo-50',
      iconColor: 'text-[#1f2355]',
      borderColor: 'border-indigo-100',
      path: '/mandi-bazar'
    }
  ];

  return (
    <div className="space-y-6 pb-20 bg-slate-50 min-h-screen">
      {/* Ultra-Slim Location Info Bar */}
      <div className="pt-2 px-3 xs:px-6"> 
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-location-selector'))}
          className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl py-2.5 px-3 flex items-center gap-2 active:scale-[0.98] transition-all"
        >
          <div className="bg-[#1f2355] p-1.5 rounded-lg shadow-sm flex-shrink-0">
            <Building2 size={14} className="text-white" />
          </div>
          <p className="text-[clamp(12px,3.5vw,16px)] font-semibold text-[#181d5f] whitespace-nowrap min-w-0">
            Showing content in <span className="text-[#fa8639] font-extrabold">{currentLocation}</span>
          </p>
        </button>
      </div>

      {/* Banner Section */}
      <div className="px-5">
        <BannerCarousel />
      </div>

      {/* Flagship Mandi Bazar Banner */}
      <div className="px-5">
        <div 
          onClick={() => navigate('/mandi-bazar')}
          className="bg-gradient-to-br from-[#1f2355] to-[#2a307d] rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fa8639]/10 rounded-full -ml-16 -mb-16 blur-xl" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 w-fit rounded-full border border-white/10 backdrop-blur-sm">
              <ShoppingBag size={12} className="text-[#fa8639]" />
              <span className="text-[10px] font-black uppercase tracking-widest">New: Direct Ordering</span>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-[24px] font-black leading-tight italic">Mandi <span className="text-[#fa8639]">Bazar</span></h2>
              <p className="text-[13px] text-white/60 font-medium max-w-[70%]">Get building materials delivered directly to your site at best market prices.</p>
            </div>
            
            <button className="flex items-center gap-2 text-[12px] font-bold text-[#fa8639] group-hover:translate-x-1 transition-transform">
              ORDER NOW <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Selection Section (Ref #3) */}
      <div className="px-5 space-y-4">
        <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">
          Browse Categories
        </h2>
        <div className="grid grid-cols-2 gap-3">
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

      {/* Featured Properties Area */}
      {properties.length > 0 && (
        <div className="space-y-4">
          <div className="px-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">Featured Properties</h2>
            <button onClick={() => navigate('/browse/property')} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-all uppercase tracking-widest">View All</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            {properties.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/listing/${item.id}`)}
                className="min-w-[280px] bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden active:scale-[0.98] transition-all group relative cursor-pointer"
              >
                <div className="h-44 relative">
                  <img src={item.image || item.images?.[0]} className="w-full h-full object-cover shadow-inner opacity-90 group-hover:opacity-100 transition-opacity" alt={item.title} />
                  <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-sm text-slate-300">
                    <Heart size={16} fill="currentColor" className="opacity-20" />
                  </button>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-semibold text-[#1f2355] text-[17px] tracking-tight line-clamp-1">{item.title}</h3>
                  <p className="text-[14px] font-medium text-[#4a5578] flex items-center gap-1.5 line-clamp-1">
                    <MapPin size={14} className="text-[#159f42]" />
                    {item.location_text || item.address?.district || item.district || 'Bihar'}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[#124db5] text-lg font-semibold tracking-tight">
                      ₹{item.pricing?.amount?.toLocaleString() || item.price?.value?.toLocaleString() || '0'}
                    </span>
                    <span className="text-[12px] font-semibold text-[#64719b] bg-[#f4f6fc] px-4 py-1.5 rounded-xl border border-[#eef2fc]">
                      {item.details?.area?.value ? `${item.details.area.value} ${item.details.area.unit}` : 'Property'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Services Area */}
      {services.length > 0 && (
        <div className="space-y-4">
          <div className="px-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900 tracking-tight uppercase">Featured Services</h2>
            <button onClick={() => navigate('/browse/service')} className="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-all uppercase tracking-widest">View All</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            {services.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/service/${item.id}`)}
                className="min-w-[280px] bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="h-40 relative">
                  <img src={item.image || item.images?.[0]} className="w-full h-full object-cover shadow-inner opacity-90 group-hover:opacity-100 transition-opacity" alt={item.title} />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest text-emerald-600 border border-emerald-100 shadow-sm">
                    {item.status || 'Active'}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-primary-900 text-sm tracking-tight line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                      <MapPin size={12} className="text-emerald-500" />
                      {item.location_text || item.address?.district || item.district || 'Bihar'}
                    </div>
                    <button className="bg-emerald-50 text-emerald-600 text-[11px] font-semibold px-5 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">BOOK</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Fetching verified listings...</p>
        </div>
      )}

      {!loading && properties.length === 0 && services.length === 0 && (
        <div className="px-10 py-20 text-center space-y-4">
          <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-200/40 inline-block border border-slate-50">
            <Search size={48} className="text-slate-200 mx-auto" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary-900">No Listings Yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[200px] mx-auto">We're onboarding new verified partners in your area. check back soon!</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
