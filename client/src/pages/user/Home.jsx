import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Search, Building2, Wrench, ArrowRight, ChevronRight,
  ShieldCheck, BadgePercent, Truck, Store,
  CheckCircle2, Headphones, ShoppingBag
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Simulated loading for boneyard demonstration
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
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
      <Skeleton name="home-search" loading={loading}>
        <div className="px-4 xs:px-5 pb-4 xs:pb-6 -mt-6 xs:-mt-8 relative z-30">
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
      </Skeleton>

      {/* ── BROWSE CATEGORIES ── */}
      <div className="px-4 mb-6 xs:mb-8">
        <div className="flex items-center justify-between mb-3 xs:mb-4">
          <h2 className="font-black text-[#181d5f] uppercase tracking-tight" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>Browse Categories</h2>
        </div>

        <Skeleton name="home-categories" loading={loading}>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(cat.path)}
                className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_25px_rgb(0,0,0,0.04)] cursor-pointer active:scale-[0.98] transition-all relative flex flex-col overflow-hidden group h-[170px]"
              >
                {/* Icon Top Left Circle */}
                <div className={cn('absolute top-2 left-2 w-7 h-7 xs:w-9 xs:h-9 rounded-full flex items-center justify-center shadow-sm z-10', cat.iconBg, cat.iconColor)}>
                  <cat.icon size={12} className="scale-[1.1] xs:scale-[1.3]" strokeWidth={2.5} />
                </div>

                {/* Main Image Container */}
                <div className="flex-1 flex items-center justify-center p-1 pt-7 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="max-w-[95%] max-h-[95%] object-contain transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Bottom Info */}
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
        </Skeleton>
      </div>

      {/* ── MAIN BANNER (One Stop Solution) ── */}
      <Skeleton name="home-banner" loading={loading}>
        <div className="px-4 mb-6 xs:mb-8">
          <div
            onClick={() => navigate('/mandi-bazar')}
            className="relative rounded-[24px] xs:rounded-[32px] overflow-hidden cursor-pointer active:scale-[0.99] transition-all shadow-2xl"
            style={{ height: 'clamp(180px, 50vw, 220px)' }}
          >
            {/* Background Image Container with Split */}
            <div className="absolute inset-0 flex">
              {/* Left Navy Block */}
              <div className="bg-[#0d1b3e] w-[55%] h-full relative z-10" />
              {/* Right Image Block with Blend */}
              <div className="relative flex-1 h-full">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0d1b3e] via-[#0d1b3e]/30 to-transparent w-[40%]" />
                <img
                  src="/basera-home-banner.jpeg"
                  alt="Construction"
                  className="w-full h-full object-cover object-left"
                />
              </div>
            </div>

            <div className="absolute inset-0 p-4 xs:p-6 flex flex-col justify-center z-20">
               <div className="max-w-[52%] xs:max-w-[200px]">
                <p className="text-white/80 font-medium mb-0.5" style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }}>One Stop Solution for</p>
                <h2 className="text-white font-black leading-[1.05] mb-2 xs:mb-4" style={{ fontSize: 'clamp(16px, 5.5vw, 22px)' }}>
                  Property & <br />
                  <span className="text-orange-500">Building Materials</span>
                </h2>

                <div className="flex items-center gap-0 mb-3 xs:mb-5">
                  {[
                    { icon: ShieldCheck, label: 'Quality\nProducts' },
                    { icon: BadgePercent, label: 'Lowest\nPrice' },
                    { icon: Truck, label: 'Fast\nDelivery' },
                    { icon: Headphones, label: '24x7\nSupport' },
                  ].map((item, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <item.icon className="text-white" strokeWidth={1.5} style={{ width: 'clamp(12px, 3.5vw, 18px)', height: 'clamp(12px, 3.5vw, 18px)' }} />
                        <span className="text-white font-bold text-center leading-tight whitespace-pre-line opacity-90 uppercase tracking-tighter" style={{ fontSize: 'clamp(5.5px, 2vw, 7.5px)' }}>{item.label}</span>
                      </div>
                      {i < 3 && <div className="h-6 xs:h-8 w-[1px] bg-white/10 mx-0.5 xs:mx-1.5 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  className="w-fit bg-orange-500 text-white rounded-[12px] xs:rounded-[14px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                  style={{
                    padding: 'clamp(6px, 2.5vw, 12px) clamp(16px, 5vw, 32px)',
                    fontSize: 'clamp(11px, 3.5vw, 14px)'
                  }}
                >
                  Explore Now
                  <ChevronRight strokeWidth={3} style={{ width: 'clamp(14px, 4vw, 16px)', height: 'clamp(14px, 4vw, 16px)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Skeleton>

      {/* ── BULK ORDER BANNER ── */}
      <div className="px-4 mb-10 xs:mb-12">
        <div className="bg-[#f8fafc] rounded-[24px] xs:rounded-[32px] overflow-hidden flex items-center border border-slate-100 shadow-sm relative min-h-[100px] xs:min-h-[120px]">
          {/* Left Text */}
          <div className="flex-1 p-4 xs:p-6 z-10">
            <h3 className="text-[#181d5f] font-black leading-tight" style={{ fontSize: 'clamp(16px, 5vw, 20px)' }}>Bulk Order?</h3>
            <p className="text-slate-500 font-bold mt-1 tracking-tight" style={{ fontSize: 'clamp(9px, 2.8vw, 11px)' }}>Get extra discount on <br />building materials</p>
          </div>

          <div className="absolute inset-0 z-0">
            <img
              src="/basera-home-banner.jpeg"
              alt="Cement"
              className="h-full w-full object-cover opacity-5"
            />
          </div>

          {/* Right Action Block */}
          <div className="bg-[#181d5f] rounded-l-[30px] xs:rounded-l-[40px] p-4 xs:p-6 flex flex-col items-center justify-center min-w-[120px] xs:min-w-[150px] h-full shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-10 relative">
            <div className="text-white/60 font-bold uppercase mb-0.5 xs:mb-1" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>Save More with</div>
            <div className="text-white font-black leading-tight mb-2 xs:mb-3" style={{ fontSize: 'clamp(12px, 4vw, 16px)' }}>Basera Bazar</div>

            <button className="bg-orange-500 text-white px-3 xs:px-5 py-1.5 xs:py-2 rounded-xl font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all" style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }}>
              Order Now <ArrowRight size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
