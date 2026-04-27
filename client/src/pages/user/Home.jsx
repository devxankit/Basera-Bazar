import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, Wrench, ArrowRight,
  ClipboardList, HelpCircle, ShieldCheck, BadgePercent, Truck, ShoppingBag, Package, Store
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'property',
      title: 'PROPERTIES',
      count: '1.2K+ Listings',
      icon: Building2,
      badgeColor: 'bg-blue-600',
      image: '/properties.jpg',
      path: '/browse/property',
    },
    {
      id: 'service',
      title: 'SERVICES',
      count: '800+ Listings',
      icon: Wrench,
      badgeColor: 'bg-orange-500',
      image: '/service.jpg',
      path: '/browse/service',
    },
    {
      id: 'supplier',
      title: 'SUPPLIERS',
      count: 'Verified Sellers',
      icon: Store,
      badgeColor: 'bg-emerald-500',
      image: '/supplier.jpg',
      path: '/browse/supplier',
    },
    {
      id: 'mandi',
      title: 'BASERA BAZAR',
      count: 'Direct Order',
      icon: ShoppingBag,
      badgeColor: 'bg-purple-600',
      image: '/mandi.jpg',
      path: '/mandi-bazar',
    },
  ];

  const quickActions = [
    { icon: Building2, label: 'Post Property', sub: 'Sell or Rent', path: '/partner/add-property', iconBg: 'bg-blue-50', iconColor: 'text-[#124db5]' },
    { icon: ClipboardList, label: 'Post Requirement', sub: 'Get Best Quotes', path: '/categories', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { icon: Package, label: 'Track Order', sub: 'Live Tracking', path: '/leads', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { icon: HelpCircle, label: 'Help Center', sub: 'We are here', path: '/partner/help', iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
  ];

  return (
    <div className="bg-white pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── SEARCH BAR ── */}
      <div className="px-4 pt-2 pb-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md flex items-center overflow-hidden">
          <div className="flex items-center gap-2 flex-grow px-3 py-0">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties, services..."
              className="w-full py-3.5 text-[12px] font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => navigate(`/browse/all?q=${searchQuery}`)}
            className="bg-[#1f2355] text-white px-4 py-3 font-black text-[12px] rounded-xl mr-1.5 my-1 active:scale-95 transition-all shadow-md whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── ONE STOP SOLUTION BANNER ── */}
      <div className="px-4 mb-4">
        <div
          onClick={() => navigate('/mandi-bazar')}
          className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
          style={{ height: 'clamp(160px, 45vw, 200px)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop"
            alt="Construction"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b3e]/95 via-[#0d1b3e]/80 to-[#0d1b3e]/20" />

          <div className="absolute inset-0 p-4 flex flex-col justify-center">
            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mb-1">One Stop Solution for</p>
            <h2 className="text-white font-black leading-tight mb-3" style={{ fontSize: 'clamp(16px, 5vw, 22px)' }}>
              Property &amp; <br />
              <span className="text-orange-400">Building Materials</span>
            </h2>

            <div className="flex items-center gap-3 mb-3">
              {[
                { icon: ShieldCheck, label: 'Best\nQuality' },
                { icon: BadgePercent, label: 'Lowest\nPrice' },
                { icon: Truck, label: 'Fast\nDelivery' },
                { icon: HelpCircle, label: '24x7\nSupport' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white">
                    <item.icon size={12} strokeWidth={2.5} />
                  </div>
                  <span className="text-white font-bold text-center leading-tight whitespace-pre-line opacity-80" style={{ fontSize: '6px' }}>{item.label}</span>
                </div>
              ))}
            </div>

            <button className="w-fit bg-orange-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-md">
              Explore Now <ArrowRight size={11} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ROW ── */}
      <div className="px-4 mb-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-slate-100">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1 py-3 px-1 active:bg-slate-50 transition-colors min-h-[72px] justify-center"
              >
                <div className={cn('rounded-xl flex items-center justify-center', action.iconBg, action.iconColor)}
                  style={{ width: 'clamp(30px, 8vw, 38px)', height: 'clamp(30px, 8vw, 38px)' }}
                >
                  <action.icon size={16} strokeWidth={2} />
                </div>
                <p className="font-black text-[#1f2355] text-center leading-tight mt-0.5" style={{ fontSize: 'clamp(7px, 2.2vw, 9px)' }}>{action.label}</p>
                <p className="font-medium text-slate-400 text-center leading-tight" style={{ fontSize: 'clamp(6px, 1.8vw, 8px)' }}>{action.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── BROWSE CATEGORIES ── */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-[#1f2355] uppercase tracking-tight" style={{ fontSize: 'clamp(13px, 4vw, 16px)' }}>Browse Categories</h2>
          <button
            onClick={() => navigate('/categories')}
            className="font-black text-orange-500 flex items-center gap-1"
            style={{ fontSize: 'clamp(10px, 3vw, 12px)' }}
          >
            View All <ArrowRight size={12} strokeWidth={3} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all relative flex flex-col overflow-hidden group hover:shadow-md hover:-translate-y-1 duration-300"
              style={{ minHeight: '180px' }}
            >
              {/* Icon Top Left */}
              <div className={cn('absolute top-3 left-3 rounded-xl flex items-center justify-center text-white shadow-sm z-10 transition-all group-hover:scale-110 duration-300', cat.badgeColor)}
                style={{ width: 'clamp(32px, 10vw, 38px)', height: 'clamp(32px, 10vw, 38px)' }}
              >
                <cat.icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              </div>

              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center p-3 pt-12 transition-transform duration-500 group-hover:scale-105">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-contain max-h-[95px] lg:max-h-[125px] drop-shadow-md"
                />
              </div>

              {/* Bottom Info Container - Using Flex to prevent overlap */}
              <div className="px-3.5 pb-4 pt-1 flex items-end justify-between gap-2 mt-auto">
                <div className="flex-1 min-w-0">
                  <p className="text-[#1f2355] font-black uppercase leading-[1.1] tracking-tight text-[11px] sm:text-[12px] group-hover:text-orange-500 transition-colors duration-300">
                    {cat.title}
                  </p>
                  <p className="text-slate-400 font-bold leading-none mt-1 text-[9px] sm:text-[10px]">{cat.count}</p>
                </div>
                
                <div className="bg-[#1f2355] rounded-full flex items-center justify-center text-white shadow-md shrink-0 transition-all duration-300 group-hover:bg-orange-500 group-hover:translate-x-1"
                  style={{ width: '28px', height: '28px' }}
                >
                  <ArrowRight size={14} strokeWidth={3} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BULK ORDER BANNER ── */}
      <div className="px-4 mb-4">
        <div
          onClick={() => navigate('/mandi-bazar')}
          className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all flex"
          style={{ minHeight: 'clamp(95px, 28vw, 125px)' }}
        >
          {/* Left: dark navy text */}
          <div className="bg-[#1f2355] px-3 py-4 flex flex-col justify-center shrink-0" style={{ width: '42%' }}>
            <h3 className="text-white font-black leading-tight" style={{ fontSize: 'clamp(13px, 4vw, 17px)' }}>Bulk Order?</h3>
            <p className="text-white/60 font-semibold mt-1 leading-snug" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>Get extra discount on building materials</p>
          </div>

          {/* Center: product image */}
          <div className="flex-1 bg-[#1f2355] relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop"
              alt="Cement"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain drop-shadow-xl"
              style={{ height: 'clamp(80px, 25vw, 110px)' }}
            />
          </div>

          {/* Right: orange CTA */}
          <div className="bg-orange-500 flex flex-col items-center justify-center px-2 py-3 shrink-0" style={{ width: '33%' }}>
            <div className="rounded-full border-2 border-white/30 flex items-center justify-center mb-1.5"
              style={{ width: 'clamp(26px, 7vw, 34px)', height: 'clamp(26px, 7vw, 34px)' }}
            >
              <BadgePercent size={13} className="text-white" />
            </div>
            <p className="text-white font-bold text-center leading-tight" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>Save More with</p>
            <p className="text-white font-black text-center leading-tight mt-0.5" style={{ fontSize: 'clamp(8px, 2.5vw, 11px)' }}>Basera Bazar</p>
            <button className="mt-2 bg-white text-orange-500 rounded-lg font-black flex items-center gap-0.5 shadow active:scale-95 transition-all whitespace-nowrap px-2 py-1"
              style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}
            >
              Order Now <ArrowRight size={8} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
