import React, { useState, useEffect } from 'react';
import {
   ShoppingCart, Search, MapPin, ArrowRight, ChevronDown,
   Package, ShieldCheck, Truck, Plus, IndianRupee,
   BadgePercent, HelpCircle, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useLocationContext } from '../../context/LocationContext';
import LocationPicker from '../../components/common/LocationPicker';
import Skeleton from '../../components/common/Skeleton';

const cn = (...inputs) => inputs.filter(Boolean).join(' ');

const MATERIAL_IMAGES = {
   aggregate: 'https://images.unsplash.com/photo-1574360523441-2166f49c8dfb?auto=format&fit=crop&q=80&w=300',
   sand: 'https://images.unsplash.com/photo-1574621100236-d25b64cfd647?auto=format&fit=crop&q=80&w=300',
   brick: 'https://images.unsplash.com/photo-1590069230005-db393739175c?auto=format&fit=crop&q=80&w=300',
   cement: 'https://images.unsplash.com/photo-1518709368027-e455497fba30?auto=format&fit=crop&q=80&w=300',
   steel: 'https://images.unsplash.com/photo-1621905252507-b35242f9a0c7?auto=format&fit=crop&q=80&w=300',
   tiles: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=300',
   saria: 'https://images.unsplash.com/photo-1621905252507-b35242f9a0c7?auto=format&fit=crop&q=80&w=300',
   plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca1f965?auto=format&fit=crop&q=80&w=300',
   hardware: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=300'
};

const getCategoryImage = (cat) => {
   if (cat.mandi_icon && cat.mandi_icon.startsWith('http')) return cat.mandi_icon;
   if (cat.icon && cat.icon.startsWith('http')) return cat.icon;

   const slug = cat.slug?.toLowerCase() || '';
   if (slug.includes('brick')) return MATERIAL_IMAGES.brick;
   if (slug.includes('cement')) return MATERIAL_IMAGES.cement;
   if (slug.includes('sand')) return MATERIAL_IMAGES.sand;
   if (slug.includes('saria') || slug.includes('steel')) return MATERIAL_IMAGES.saria;
   if (slug.includes('aggregate')) return MATERIAL_IMAGES.aggregate;
   if (slug.includes('tile')) return MATERIAL_IMAGES.tiles;
   if (slug.includes('plumb')) return MATERIAL_IMAGES.plumbing;
   if (slug.includes('hard')) return MATERIAL_IMAGES.hardware;

   return '/default-product-category-image.png'; // Global fallback
};

export default function MandiMarketplace() {
   const navigate = useNavigate();
   const { cartCount } = useCart();
   const { location, setLocation } = useLocationContext();

   const [categories, setCategories] = useState([]);
   const [supplierCategories, setSupplierCategories] = useState([]);
   const [loadingCategories, setLoadingCategories] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoadingCategories(true);
            // Fetch specialized marketplace home data (for deals)
            // and supplier categories for the shop section
            const [mandiRes, supplierRes] = await Promise.all([
               api.get('/mandi/marketplace/home'),
               api.get('/listings/categories?type=supplier')
            ]);

            if (mandiRes.data.success) {
               setCategories(mandiRes.data.data.map(item => ({
                  _id: item.category_id,
                  name: item.category,
                  slug: item.slug,
                  icon: item.icon,
                  mandi_icon: item.mandi_icon,
                  deal: item.deal
               })));
            }

            if (supplierRes.data.success) {
               setSupplierCategories(supplierRes.data.data);
            }
         } catch (error) {
            console.error("Error fetching Mandi marketplace data:", error);
         } finally {
            setLoadingCategories(false);
         }
      };
      fetchData();
   }, []);


   const shopCategories = supplierCategories.map(cat => ({
      id: cat._id,
      name: cat.name,
      image: getCategoryImage(cat)
   }));

   const topProducts = categories
      .filter(c => c.deal)
      .map(c => ({
         id: c.deal._id,
         title: c.deal.title,
         price: c.deal.pricing.price_per_unit,
         unit: c.deal.pricing.unit,
         image: c.deal.thumbnail || getCategoryImage(c),
         label: 'BEST DEAL',
         labelColor: 'bg-red-500'
      }))
      .slice(0, 4);

   const trustBadges = [
      { icon: ShieldCheck, title: '100% Quality', sub: 'Guaranteed' },
      { icon: Truck, title: 'Fast Delivery', sub: 'On Time' },
      { icon: BadgePercent, title: 'Lowest Price', sub: 'Everyday' },
      { icon: HelpCircle, title: '24x7 Support', sub: 'We are here' },
   ];


   const locationDisplay = location?.formattedAddress || location?.city || 'Muzaffarpur, Bihar';

   const handleSearch = (e) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
         navigate(`/browse/mandi?search=${encodeURIComponent(searchQuery.trim())}`);
      }
   };

   const handleLocationSelect = (loc) => {
      if (loc.isGPS) {
         setLocation(prev => ({
            ...prev,
            city: loc.name || (loc.isGPS ? 'Current Location' : prev.city),
            state: loc.state || prev.state,
            district: loc.district || prev.district,
            coords: loc.coordinates,
            formattedAddress: loc.name ? `${loc.name}, ${loc.state}` : 'Current GPS Location'
         }));
      } else {
         setLocation({
            city: loc.name,
            district: loc.district,
            state: loc.state,
            coords: null,
            formattedAddress: `${loc.name}, ${loc.state}`
         });
      }
      setIsLocationModalOpen(false);
   };

   if (loadingCategories) return (
      <div className="bg-white min-h-screen pb-10">
         {/* Skeleton Header */}
         <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-50">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <div className="flex gap-2">
               <Skeleton className="w-8 h-8 rounded-full" />
               <Skeleton className="w-8 h-8 rounded-full" />
            </div>
         </div>
         {/* Skeleton Location & Search */}
         <div className="px-4 py-3 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-[20px]" />
         </div>
         {/* Skeleton Hero */}
         <div className="px-4 mt-2">
            <Skeleton className="h-[180px] w-full rounded-[18px]" />
         </div>
         {/* Skeleton Trust Badges */}
         <div className="mt-6 px-4 flex justify-between">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-16 h-12 rounded-lg" />)}
         </div>
         {/* Skeleton Categories */}
         <div className="px-4 mt-8">
            <Skeleton className="h-6 w-40 mb-4 rounded-lg" />
            <div className="grid grid-cols-4 gap-4">
               {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="space-y-2">
                     <Skeleton className="aspect-square w-full rounded-2xl" />
                     <Skeleton className="h-3 w-3/4 mx-auto rounded" />
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   return (
      <div className="bg-white pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

         {/* ── HEADER ── */}
         <div className="bg-white sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-50 shadow-sm">
            <div className="flex items-center gap-2.5">
               <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-0.5">
                     <span className="font-black text-orange-500" style={{ fontSize: 'clamp(15px, 5vw, 19px)' }}>बसेरा</span>
                     <span className="font-black text-[#1f2355] uppercase ml-0.5" style={{ fontSize: 'clamp(15px, 5vw, 19px)' }}>BAZAR</span>
                  </div>
                  <p className="font-semibold text-orange-500 tracking-tight" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>Building better, together</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button
                  onClick={() => navigate('/notifications')}
                  className="relative w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#1f2355] active:scale-95 transition-all"
               >
                  <Bell size={16} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
               </button>
               <button className="relative w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#1f2355]" onClick={() => navigate('/cart')}>
                  <ShoppingCart size={16} />
                  {cartCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[8px] text-white font-black flex items-center justify-center border border-white shadow-sm">
                        {cartCount}
                     </span>
                  )}
               </button>
            </div>
         </div>

         {/* ── LOCATION BAR ── */}
         <div className="px-4 py-2 flex items-center">
            <button
               onClick={() => setIsLocationModalOpen(true)}
               className="flex items-center gap-2 text-slate-600 font-bold w-full bg-slate-50/50 py-2 px-3 rounded-xl border border-slate-50 active:scale-[0.98] transition-all"
               style={{ fontSize: 'clamp(11px, 3.2vw, 13px)' }}
            >
               <MapPin size={14} className="text-orange-500 shrink-0" />
               <span className="truncate flex-1 text-left">{locationDisplay}</span>
               <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>
         </div>

         {/* ── SEARCH BAR ── */}
         <div className="px-4 mb-2 mt-1">
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400 group-focus-within:text-[#1f2355] transition-colors" />
               </div>
               <input
                  type="text"
                  placeholder="Search building materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full bg-slate-100/50 border border-slate-100 rounded-[20px] py-3.5 pl-12 pr-4 text-[13px] font-bold text-[#1f2355] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1f2355]/5 focus:bg-white transition-all shadow-sm"
               />
            </div>
         </div>

         <div className="px-4 mt-2">
            <div className="relative rounded-[24px] overflow-hidden bg-[#081229] shadow-xl group cursor-pointer active:scale-[0.98] transition-all"
               style={{ height: 'clamp(200px, 60vw, 260px)' }}
               onClick={() => navigate('/browse/mandi')}
            >
               {/* Image Container - Full Width with Narrow Fade */}
               <div className="absolute inset-0 z-0">
                  <img
                     src="/basera-mandi-hero.jpeg"
                     alt="Mandi Marketplace"
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Narrower Horizontal Fade Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#081229] via-[#081229] to-transparent w-[60%] z-10" />
               </div>

               <div className="absolute inset-0 z-20 p-4 sm:p-6 flex flex-col justify-center max-w-[70%] sm:max-w-[55%]">
                  <p className="text-orange-500 font-bold mb-0.5 uppercase tracking-widest opacity-90" style={{ fontSize: 'clamp(7.5px, 2vw, 9px)' }}>खदान मंडी से सीधे</p>
                  <h1 className="text-orange-500 font-black leading-tight mb-3" style={{ fontSize: 'clamp(16px, 5.5vw, 22px)' }}>
                     आपके घर तक!
                  </h1>

                  <div className="flex gap-2.5 mb-4">
                     {[
                        { icon: Package, label: 'FRESH\nMATERIAL' },
                        { icon: Truck, label: 'FAST\nDELIVERY' },
                        { icon: IndianRupee, label: 'LOWEST\nPRICE' },
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                           <div className="rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg border border-white/10"
                              style={{ width: 'clamp(26px, 7vw, 32px)', height: 'clamp(26px, 7vw, 32px)' }}
                           >
                              <item.icon size={13} strokeWidth={2.5} />
                           </div>
                           <span className="text-orange-500 font-black uppercase text-center leading-tight tracking-wider" style={{ fontSize: '6px' }}>{item.label}</span>
                        </div>
                     ))}
                  </div>

                  <button
                     className="bg-white text-[#1f2355] rounded-lg font-black uppercase flex items-center gap-1.5 w-fit active:scale-95 transition-all shadow-lg"
                     style={{ fontSize: 'clamp(7.5px, 2.2vw, 9px)', padding: 'clamp(6px, 1.8vw, 8px) clamp(12px, 3vw, 18px)' }}
                  >
                     SHOP NOW <ArrowRight size={11} strokeWidth={3} />
                  </button>
               </div>
            </div>
         </div>


         {/* ── TRUST BADGE STRIP ── */}
         <div className="mt-4 bg-[#1f2355] py-3.5 px-2 grid grid-cols-4 gap-1">
            {trustBadges.map((item, i) => (
               <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-orange-500">
                     <item.icon size={15} strokeWidth={2.5} />
                  </div>
                  <p className="font-black text-white text-center leading-tight px-1" style={{ fontSize: 'clamp(7.5px, 2.2vw, 9.5px)' }}>{item.title}</p>
                  <p className="font-medium text-slate-400 text-center leading-none" style={{ fontSize: 'clamp(6px, 1.8vw, 7.5px)' }}>{item.sub}</p>
               </div>
            ))}
         </div>

         {/* ── SHOP BY CATEGORY ── */}
         <div className="mt-5 px-4">
            <div className="flex items-center justify-between mb-3">
               <h2 className="font-black text-[#1f2355]" style={{ fontSize: 'clamp(14px, 4.5vw, 18px)' }}>Shop by Category</h2>
            </div>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 pb-2">
               {loadingCategories ? (
                  [...Array(8)].map((_, i) => (
                     <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                        <div className="w-full aspect-square rounded-2xl bg-slate-100" />
                        <div className="w-10 h-2 bg-slate-100 rounded" />
                     </div>
                  ))
               ) : (
                  shopCategories.map((cat) => (
                     <div
                        key={cat.id}
                        onClick={() => navigate(`/browse/mandi?cat=${cat.id}`)}
                        className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all group"
                     >
                        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-orange-500/5 border border-orange-500/10 flex items-center justify-center p-1.5 group-hover:shadow-md transition-shadow">
                           <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-contain mix-blend-multiply"
                              onError={(e) => { e.target.src = '/default-product-category-image.png'; }}
                           />
                        </div>
                        <span className="font-bold text-[#1f2355] text-center leading-tight px-0.5" style={{ fontSize: '11px' }}>{cat.name}</span>
                     </div>
                  )))}
            </div>
         </div>

         {/* ── BULK ORDER BANNER ── */}
         <div className="mt-5 px-4">
            <div
               onClick={() => navigate('/browse/mandi')}
               className="relative overflow-hidden bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
            >
               <img
                  src="/mandi-bottom-banner.jpeg"
                  alt="Bulk Orders"
                  className="w-full h-auto object-contain"
               />
            </div>
         </div>


         {/* ── TOP SELLING PRODUCTS ── */}
         <div className="mt-5 pb-4">
            <div className="px-4 flex items-center justify-between mb-3">
               <h2 className="font-black text-[#1f2355]" style={{ fontSize: 'clamp(14px, 4.5vw, 18px)' }}>Top Selling Products</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
               {topProducts.map((product) => (
                  <div
                     key={product.id}
                     className="flex-shrink-0 bg-white border border-slate-100 rounded-[18px] overflow-hidden shadow-md group active:scale-95 transition-all relative"
                     style={{ width: 'clamp(125px, 37vw, 155px)' }}
                  >
                     <span className={cn('absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-white z-10 uppercase font-black', product.labelColor)}
                        style={{ fontSize: 'clamp(6.5px, 2vw, 8px)' }}
                     >
                        {product.label}
                     </span>
                     <div className="w-full bg-slate-50" style={{ height: 'clamp(90px, 26vw, 115px)' }}>
                        <img
                           src={product.image}
                           alt={product.title}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                     </div>
                     <div className="p-2.5">
                        <p className="font-bold text-[#1f2355] line-clamp-1" style={{ fontSize: 'clamp(12px, 3.8vw, 15px)' }}>{product.title}</p>
                        <div className="flex items-center justify-between mt-1.5">
                           <div>
                              <span className="font-black text-[#1f2355]" style={{ fontSize: 'clamp(12px, 3.5vw, 15px)' }}>₹{product.price}</span>
                              <span className="font-semibold text-slate-400 ml-0.5" style={{ fontSize: 'clamp(8px, 2.5vw, 9px)' }}>/ {product.unit}</span>
                           </div>
                           <button className="bg-[#1f2355] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all"
                              style={{ width: 'clamp(24px, 6.5vw, 28px)', height: 'clamp(24px, 6.5vw, 28px)' }}
                           >
                              <Plus size={12} strokeWidth={3} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* ── LOCATION MODAL ── */}
         <div className={`fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-300 ${isLocationModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLocationModalOpen(false)} />
            <div className={`relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl transition-transform duration-500 transform ${isLocationModalOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '75vh' }}>
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 opacity-50" />
               <LocationPicker
                  onClose={() => setIsLocationModalOpen(false)}
                  onSelect={handleLocationSelect}
                  initialLocation={location}
               />
            </div>
         </div>
      </div>
   );
}
