import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Search, Building2, Wrench, ArrowRight, ChevronRight,
  ShieldCheck, BadgePercent, Truck, Store,
  CheckCircle2, Headphones, ShoppingBag, HelpCircle, IndianRupee
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../../services/DataEngine';
import { Star, MapPin as Pin, Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredSuppliers, setFeaturedSuppliers] = useState([]);
  const [featuredMandi, setFeaturedMandi] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [props, servs, supps, mandi] = await Promise.all([
          db.getAll('listings', { category: 'property', limit: 6 }),
          db.getAll('listings', { category: 'service', limit: 6 }),
          db.getAll('partners', { active_role: 'supplier', is_featured: 'true', limit: 6 }),
          db.getAll('listings', { category: 'mandi', limit: 6 })
        ]);
        setFeaturedProperties(props);
        setFeaturedServices(servs);
        setFeaturedSuppliers(supps);
        setFeaturedMandi(mandi);
      } catch (err) {
        console.error("Error fetching homepage data:", err);
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
      count: '1.2K+ Listings',
      icon: Building2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      image: '/properties.jpg',
      path: '/category/property',
    },
    {
      id: 'service',
      title: 'SERVICES',
      count: '800+ Listings',
      icon: Wrench,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50',
      image: '/service.jpg',
      path: '/category/service',
    },
    {
      id: 'supplier',
      title: 'SUPPLIERS',
      count: 'Verified Sellers',
      icon: Store,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      image: '/supplier.jpg',
      path: '/category/supplier',
    },
    {
      id: 'mandi',
      title: 'BASERA BAZAR',
      count: 'Direct Order',
      icon: ShoppingBag,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      image: '/mandi.jpg',
      path: '/mandi-bazar',
    },
  ];

  return (
    <div className="bg-white pb-4" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 xs:px-5 pb-4 xs:pb-6 -mt-4 xs:-mt-5 relative z-30">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex items-center overflow-hidden p-1 xs:p-1.5 transition-all focus-within:ring-2 focus-within:ring-[#181d5f]/10">
          <div className="flex-grow flex items-center px-2 xs:px-3.5">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/browse/all?q=${searchQuery}`)}
              placeholder="Search products..."
              className="w-full bg-transparent outline-none pl-2 xs:pl-3 py-2.5 xs:py-3 font-medium text-slate-700 placeholder:text-slate-400"
              style={{ fontSize: 'clamp(12px, 3.5vw, 14px)' }}
            />
          </div>
          <button
            onClick={() => navigate(`/browse/all?q=${searchQuery}`)}
            className="bg-[#181d5f] text-white px-4 xs:px-7 py-2.5 xs:py-3 font-black rounded-xl active:scale-95 transition-all shadow-lg whitespace-nowrap"
            style={{ fontSize: 'clamp(11px, 3vw, 13px)' }}
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 space-y-8 animate-in fade-in duration-500">
          {/* Skeleton Categories */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-[170px] w-full rounded-[20px]" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Skeleton Hero */}
          <div className="mt-4">
            <Skeleton className="h-[200px] w-full rounded-[32px]" />
          </div>

          {/* Skeleton Featured Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="min-w-[200px] h-[220px] rounded-[24px]" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── BROWSE CATEGORIES ── */}
          <div className="px-4 mb-6 xs:mb-8">
            <div className="flex items-center justify-between mb-3 xs:mb-4">
              <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Browse Categories</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_25px_rgb(0,0,0,0.04)] cursor-pointer active:scale-[0.98] transition-all relative flex flex-col overflow-hidden group h-[170px]"
                >
                  <div className={cn('absolute top-2 left-2 w-7 h-7 xs:w-9 xs:h-9 rounded-full flex items-center justify-center shadow-sm z-10', cat.iconBg, cat.iconColor)}>
                    <cat.icon size={12} className="scale-[1.1] xs:scale-[1.3]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 flex items-center justify-center p-1 pt-7 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="max-w-[95%] max-h-[95%] object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="px-3 pb-4 pt-1 flex items-center justify-between gap-1 mt-auto">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#181d5f] font-black uppercase tracking-tighter leading-[1.1] text-[13px]">
                        {cat.title}
                      </p>
                      <p className="text-slate-400 font-bold text-[10px] hidden xs:block">{cat.count}</p>
                    </div>
                    <div className="bg-[#181d5f] w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md group-hover:bg-orange-500 transition-colors shrink-0">
                      <ArrowRight size={10} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN BANNER ── */}
          <div className="px-4 mb-8">
            <div 
              onClick={() => navigate('/mandi-bazar')}
              className="relative rounded-[32px] overflow-hidden bg-[#081229] shadow-2xl group cursor-pointer active:scale-[0.98] transition-all"
              style={{ height: 'clamp(200px, 55vw, 260px)' }}
            >
              {/* Image Container - Full Width with Narrow Fade */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/basera-home-banner.jpeg"
                  alt="Basera Bazar Hero"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Narrower Horizontal Fade Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#081229] via-[#081229] to-transparent w-[60%] z-10" />
              </div>

              {/* Content Container - Positioned Left */}
              <div className="absolute inset-0 z-20 p-5 sm:p-8 flex flex-col justify-center max-w-[65%] sm:max-w-[55%]">
                <p className="text-white font-bold mb-1 uppercase tracking-widest opacity-80" style={{ fontSize: 'clamp(8px, 2vw, 10px)' }}>
                  One Stop Solution for
                </p>
                <h1 className="text-white font-black leading-[1.1] mb-5" style={{ fontSize: 'clamp(18px, 6vw, 28px)' }}>
                  Property & <br />
                  <span className="text-orange-500">Building Materials</span>
                </h1>

                <div className="grid grid-cols-2 gap-x-3 gap-y-3 mb-5 w-fit">
                  {[
                    { icon: ShieldCheck, label: 'BEST QUALITY\nPRODUCTS' },
                    { icon: IndianRupee, label: 'LOWEST\nPRICE' },
                    { icon: Truck, label: 'FAST\nDELIVERY' },
                    { icon: Headphones, label: '24X7\nSUPPORT' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/5">
                        <item.icon size={12} strokeWidth={2.5} />
                      </div>
                      <span className="text-white font-black uppercase leading-tight tracking-wider" style={{ fontSize: 'clamp(6.5px, 1.5vw, 8.5px)' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-fit bg-[#fa8639] text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                  style={{
                    padding: 'clamp(8px, 2.5vw, 11px) clamp(18px, 4.5vw, 30px)',
                    fontSize: 'clamp(11px, 3.2vw, 13px)'
                  }}
                >
                  Explore Now
                  <ChevronRight strokeWidth={4} size={14} />
                </button>
              </div>
            </div>
          </div>

          <style>
            {`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}
          </style>

          {/* ── SCROLLING ANNOUNCEMENT ── */}
          <div className="mb-8 overflow-hidden bg-white py-3 shadow-sm border-y border-slate-100">
            <div className="flex whitespace-nowrap">
              <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <span className="text-[#081229] font-black uppercase tracking-wider mx-10" style={{ fontSize: 'clamp(10px, 3.2vw, 12.5px)' }}>
                      घर खरीदना हो या घर बनवाना, सब कुछ मिलेगा यही पर
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  </div>
                ))}
              </div>
              <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <span className="text-[#081229] font-black uppercase tracking-wider mx-10" style={{ fontSize: 'clamp(10px, 3.2vw, 12.5px)' }}>
                      घर खरीदना हो या घर बनवाना, सब कुछ मिलेगा यही पर
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FEATURED PROPERTIES ── */}
      <div className="mb-8">
        <div className="px-4 flex items-center justify-between mb-4">
          <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Featured Properties</h2>
          <button onClick={() => navigate('/category/property')} className="text-orange-500 font-black text-[11px] uppercase tracking-widest">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
          {featuredProperties.length > 0 ? featuredProperties.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/products/${item.id}`)}
              className="min-w-[200px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden active:scale-95 transition-all"
            >
              <div className="h-[120px] relative">
                <img src={item.image || '/basera-home-hero.jpeg'} className="w-full h-full object-cover" alt={item.title} />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md rounded-full w-7 h-7 flex items-center justify-center text-slate-400">
                  <Heart size={14} />
                </div>
                <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  {item.serviceType || 'Property'}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-black text-[#181d5f] text-[13px] truncate uppercase">{item.title}</h3>
                <div className="flex items-center gap-1 text-slate-400 mt-1">
                  <Pin size={10} />
                  <span className="text-[10px] font-bold truncate">{item.display_location}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[#181d5f] font-black text-[13px]">₹{item.price?.value || 'Price on request'}</span>
                  {item.price?.unit && <span className="text-slate-400 text-[9px] font-bold uppercase">{item.price.unit}</span>}
                </div>
              </div>
            </div>
          )) : (
            [1,2,3].map(i => (
              <div key={i} className="min-w-[200px] h-[200px] bg-slate-50 rounded-2xl animate-pulse" />
            ))
          )}
        </div>
      </div>

      {/* ── TOP RATED SERVICES ── */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-5">
          <div className="flex flex-col leading-none">
            <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Top Rated Services</h2>
            <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-wider">Expert Help at your doorstep</p>
          </div>
          <button onClick={() => navigate('/category/service')} className="text-orange-500 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
          {featuredServices.length > 0 ? featuredServices.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/service/${item.id}`)}
              className="min-w-[150px] bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_20px_rgb(0,0,0,0.03)] p-1.5 active:scale-95 transition-all"
            >
              <div className="h-[120px] rounded-[20px] overflow-hidden relative group">
                <img src={item.image || '/basera-home-hero.jpeg'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-2.5">
                <h3 className="font-black text-[#181d5f] text-[12px] uppercase leading-tight line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center gap-0.5 text-orange-500">
                    <Star size={8} fill="currentColor" />
                    <span className="text-[10px] font-black">4.9</span>
                  </div>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span className="text-slate-400 text-[9px] font-bold uppercase truncate">{item.serviceType || 'Expert'}</span>
                </div>
              </div>
            </div>
          )) : (
            [1,2,3].map(i => (
              <div key={i} className="min-w-[150px] h-[180px] bg-slate-50 rounded-[24px] animate-pulse" />
            ))
          )}
        </div>
      </div>
      
      {/* ── TOP MATERIALS (MANDI) ── */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-5">
          <div className="flex flex-col leading-none">
            <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Mandi Best Sellers</h2>
            <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-wider">Top items from Basera Bazar</p>
          </div>
          <button onClick={() => navigate('/mandi-bazar')} className="text-orange-500 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
          {featuredMandi.length > 0 ? featuredMandi.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/products/${item._id || item.id}`)}
              className="min-w-[180px] bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3 active:scale-[0.98] transition-all group relative"
            >
              <div className="h-[130px] rounded-[24px] overflow-hidden relative mb-3.5 bg-slate-50">
                <img src={item.image || item.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                {item.price?.value < 1000 && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Value</div>
                )}
              </div>
              <div className="px-1 pb-1">
                <h3 className="font-bold text-[#181d5f] text-[13px] uppercase leading-tight line-clamp-2 min-h-[32px]">{item.title}</h3>
                <div className="mt-3.5 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[#181d5f] font-black text-[15px] leading-none">₹{item.price?.value}</span>
                    <span className="text-slate-400 text-[9px] font-bold uppercase mt-1">/ {item.price?.unit || 'Unit'}</span>
                  </div>
                  
                  {cart[item._id || item.id] ? (
                    <div className="flex items-center bg-indigo-50 rounded-xl border border-indigo-100 overflow-hidden h-8">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromCart(item._id || item.id); }}
                        className="w-7 h-full flex items-center justify-center text-[#181d5f] hover:bg-indigo-100 active:scale-90 transition-all"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="w-5 text-center text-[11px] font-black text-[#181d5f]">{cart[item._id || item.id].qty}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="w-7 h-full flex items-center justify-center text-[#181d5f] hover:bg-indigo-100 active:scale-90 transition-all"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-9 h-9 bg-[#181d5f] hover:bg-[#252b75] rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            [1,2,3].map(i => (
              <div key={i} className="min-w-[170px] h-[200px] bg-slate-50 rounded-[24px] animate-pulse" />
            ))
          )}
        </div>
      </div>

      {/* ── VERIFIED SUPPLIERS ── */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-5">
          <div className="flex flex-col leading-none">
            <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Featured Suppliers</h2>
            <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-wider">Top Industry Partners</p>
          </div>
          <button onClick={() => navigate('/category/supplier')} className="text-orange-500 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
          {featuredSuppliers.length > 0 ? featuredSuppliers.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/products/${item._id || item.id}`)}
              className="min-w-[240px] bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_25px_rgb(0,0,0,0.04)] p-4 active:scale-95 transition-all flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                  <img src={item.image} className="max-w-full max-h-full object-contain" alt={item.title} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[#181d5f] font-black text-[14px] truncate uppercase leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={10} className="text-emerald-500" strokeWidth={3} />
                    <span className="text-emerald-500 text-[9px] font-bold uppercase tracking-tight">Verified Partner</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {['Premium Materials', 'On-Time Delivery'].map((tag, i) => (
                  <span key={i} className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase px-2 py-1 rounded-md border border-slate-100">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-1 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400">
                  <Pin size={10} />
                  <span className="text-[10px] font-bold truncate max-w-[140px]">{item.display_location}</span>
                </div>
                <div className="w-8 h-8 bg-[#181d5f] rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
                  <ArrowRight size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          )) : (
            [1,2].map(i => (
              <div key={i} className="min-w-[240px] h-[160px] bg-slate-50 rounded-[28px] animate-pulse" />
            ))
          )}
        </div>
      </div>


    </div>
  );
};

export default Home;
