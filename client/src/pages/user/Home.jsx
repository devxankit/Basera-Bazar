import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../../components/common/BannerCarousel';
import { Search, Building2, Wrench, Store, ArrowRight, MapPin, Heart, Plus, Briefcase, Loader2, ShoppingBag, LayoutGrid } from 'lucide-react';
import { useLocationContext } from '../../context/LocationContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../../services/DataEngine';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const { location } = useLocationContext();

  const [properties, setProperties] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const locationParams = {
          lat: location.coords?.[1] || 26.1209,
          lng: location.coords?.[0] || 85.3647,
          district: location.district,
          state: location.state
        };

        const props = await db.getAll('listings', {
          category: 'property',
          is_featured: true,
          limit: 6,
          ...locationParams
        });
        const srvs = await db.getAll('listings', {
          category: 'service',
          is_featured: true,
          limit: 6,
          ...locationParams
        });
        setProperties(props);
        setServices(srvs);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location]); // Refresh when location changes

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
    <div className="space-y-6 bg-slate-50 min-h-screen">
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
            Showing content in <span className="text-[#fa8639] font-extrabold">{location.city || location.district || 'Bihar'}</span>
          </p>
        </button>
      </div>

      {/* Banner Section */}
      <div className="px-5">
        <BannerCarousel />
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
              className="bg-white p-3 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center gap-2 active:scale-95 transition-all text-center group"
            >
              <div className={cn(
                "p-2.5 rounded-xl transition-transform group-hover:scale-110 border",
                cat.bgColor,
                cat.iconColor,
                cat.borderColor
              )}>
                <cat.icon size={22} strokeWidth={2} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[11px] font-semibold text-primary-900 leading-tight tracking-wide">{cat.title}</h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">{cat.count}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Properties Area */}
      {properties.length > 0 && (
        <div className="space-y-4">
          <div className="px-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1f2355] tracking-tight uppercase">Featured Properties</h2>
            <button onClick={() => navigate('/category/property')} className="text-xs font-bold text-slate-400 hover:text-[#124db5] transition-all uppercase tracking-widest">View All</button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            {properties.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/listing/${item.id}`)}
                className="min-w-[260px] max-w-[260px] bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden active:scale-[0.98] transition-all group relative cursor-pointer"
              >
                <div className="h-36 relative">
                  <img src={item.image || item.images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={item.title} />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {item.featured && (
                      <span className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold text-emerald-600 shadow-sm">★</span>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-[#1f2355] text-[15px] truncate">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <MapPin size={12} className="text-emerald-500" />
                    <span className="truncate">{item.location_text || item.address?.district || 'Bihar'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#124db5] text-[17px] font-black">
                      ₹{(item.pricing?.amount || item.price?.value || 0).toLocaleString()}
                    </span>
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                      <LayoutGrid size={10} className="text-[#124db5]" />
                      <span className="text-[9px] font-bold text-[#1f2355]/70">{item.details?.area?.value || 'Area'}</span>
                    </div>
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
            <h2 className="text-lg font-bold text-[#1f2355] tracking-tight uppercase">Featured Services</h2>
            <button onClick={() => navigate('/category/service')} className="text-xs font-bold text-slate-400 hover:text-[#124db5] transition-all uppercase tracking-widest">View All</button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar">
            {services.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/service/${item.id}`)}
                className="min-w-[260px] max-w-[260px] bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="h-32 relative bg-slate-100">
                  <img src={item.image || item.images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={item.title} />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-[#1f2355] text-[15px] truncate">{item.title}</h3>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#f1f3ff] flex items-center justify-center text-[#1f2355] font-black text-[10px] shrink-0">
                      {String(item.businessName || item.title || 'BB').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-bold text-[#1f2355]/70 uppercase truncate">{item.businessName || 'Verified Partner'}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <MapPin size={12} className="text-[#124db5]" />
                      <span className="truncate max-w-[100px]">{item.location || 'Bihar'}</span>
                    </div>
                    <button className="bg-[#1f2355] text-white text-[10px] font-bold px-4 py-2 rounded-xl active:scale-95 transition-all">VIEW</button>
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
      {/* Bottom Mandi Bazar Final Banner */}
      <div className="px-5 pb-8">
        <div 
          onClick={() => navigate('/mandi-bazar')}
          className="relative w-full rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group active:scale-[0.99] transition-all"
        >
          <img 
            src="/mandi_home_banner.png" 
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
            alt="Mandi Bazar Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    </div>
  );
};

export default Home;
