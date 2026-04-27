import React, { useState, useEffect } from 'react';
import {
   ShoppingCart, Search, MapPin, ArrowRight, ChevronDown,
   Package, ShieldCheck, Truck, Plus, IndianRupee,
   BadgePercent, HelpCircle, ShoppingBag, ClipboardList, Menu, Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useLocationContext } from '../../context/LocationContext';

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
   const { location } = useLocationContext();

   const [categories, setCategories] = useState([]);
   const [supplierCategories, setSupplierCategories] = useState([]);
   const [loadingCategories, setLoadingCategories] = useState(true);

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

   const quickCategories = [
      ...supplierCategories.slice(0, 4).map(cat => ({
         id: cat._id,
         name: cat.name,
         image: getCategoryImage(cat)
      })),
      { id: 'all', name: 'View All', image: null, isViewAll: true },
   ];

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

   const quickActions = [
      { icon: Upload, label: 'Upload Requirement', sub: 'Get Best Quote', color: 'text-purple-500', bg: 'bg-purple-50' },
      { icon: Truck, label: 'Track Order', sub: 'Track your order', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { icon: ShoppingBag, label: 'My Orders', sub: 'View your orders', color: 'text-orange-500', bg: 'bg-orange-50' },
      { icon: HelpCircle, label: 'Help Center', sub: 'Get Support', color: 'text-blue-500', bg: 'bg-blue-50' },
   ];

   const locationDisplay = location?.formattedAddress || location?.city || 'Muzaffarpur, Bihar';

   return (
      <div className="bg-white pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

         {/* ── HEADER ── */}
         <div className="bg-white sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-50 shadow-sm">
            <div className="flex items-center gap-2.5">
               <Menu size={20} className="text-[#1f2355]" />
               <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-0.5">
                     <span className="font-black text-[#f59e0b]" style={{ fontSize: 'clamp(15px, 5vw, 19px)' }}>बसेरा</span>
                     <span className="font-black text-[#1f2355] uppercase ml-0.5" style={{ fontSize: 'clamp(15px, 5vw, 19px)' }}>BAZAR</span>
                  </div>
                  <p className="font-semibold text-slate-400 tracking-tight" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>Building better, together</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#1f2355]">
                  <Search size={16} />
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
         <div className="px-4 py-1.5 flex justify-end">
            <button className="flex items-center gap-1 text-slate-600 font-semibold" style={{ fontSize: 'clamp(10px, 3vw, 12px)' }}>
               <MapPin size={12} className="text-orange-500" />
               <span>{locationDisplay}</span>
               <ChevronDown size={11} className="text-slate-400" />
            </button>
         </div>

         {/* ── HERO BANNER ── */}
         <div className="px-4 mt-1">
            <div className="relative rounded-[18px] overflow-hidden bg-[#0d1b3e] shadow-lg"
               style={{ height: 'clamp(175px, 50vw, 220px)' }}
            >
               <div className="absolute inset-0 bg-gradient-to-r from-[#081229] via-[#081229]/85 to-transparent z-10" />
               <img
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop"
                  alt="Construction Excavator"
                  className="absolute right-0 top-0 h-full w-[62%] object-cover"
               />

               <div className="absolute inset-0 z-20 p-4 flex flex-col justify-center">
                  <p className="text-white font-semibold mb-1 opacity-90" style={{ fontSize: 'clamp(10px, 3vw, 13px)' }}>खदान मंडी से सीधे</p>
                  <h1 className="text-[#f59e0b] font-black leading-tight mb-3" style={{ fontSize: 'clamp(20px, 6.5vw, 28px)' }}>
                     आपके घर तक!
                  </h1>

                  <div className="flex gap-3 mb-3">
                     {[
                        { icon: Package, label: 'FRESH\nMATERIAL' },
                        { icon: Truck, label: 'FAST\nDELIVERY' },
                        { icon: IndianRupee, label: 'LOWEST\nPRICE' },
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                           <div className="rounded-full bg-[#f59e0b] flex items-center justify-center text-white shadow-md"
                              style={{ width: 'clamp(26px, 7.5vw, 34px)', height: 'clamp(26px, 7.5vw, 34px)' }}
                           >
                              <item.icon size={13} strokeWidth={2.5} />
                           </div>
                           <span className="text-white font-black uppercase text-center leading-tight whitespace-pre-line opacity-90" style={{ fontSize: '6.5px' }}>{item.label}</span>
                        </div>
                     ))}
                  </div>

                  <button
                     onClick={() => navigate('/browse/mandi')}
                     className="bg-white text-[#1f2355] rounded-full font-black uppercase flex items-center gap-1.5 w-fit active:scale-95 transition-all shadow-md"
                     style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', padding: 'clamp(6px, 1.8vw, 9px) clamp(12px, 3.5vw, 18px)' }}
                  >
                     SHOP NOW <ArrowRight size={11} strokeWidth={3} />
                  </button>
               </div>

               {/* Slide dots */}
               <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-30">
                  <div className="h-1.5 w-4 rounded-full bg-orange-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
               </div>
            </div>
         </div>

         {/* ── QUICK CATEGORY CARDS ── */}
         <div className="mt-4 px-4">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
               {loadingCategories ? (
                  [...Array(4)].map((_, i) => (
                     <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse" style={{ width: 'clamp(68px, 20vw, 85px)', padding: 'clamp(8px, 2.5vw, 12px)' }}>
                        <div className="w-full rounded-xl bg-slate-100 aspect-square" />
                        <div className="w-10 h-2 bg-slate-100 rounded mt-2" />
                     </div>
                  ))
               ) : quickCategories.map((cat) => (
                  <div
                     key={cat.id}
                     onClick={() => navigate(cat.isViewAll ? '/categories' : `/browse/mandi?cat=${cat.id}`)}
                     className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-shrink-0 flex flex-col items-center active:scale-95 transition-all cursor-pointer"
                     style={{ width: 'clamp(68px, 20vw, 85px)', padding: 'clamp(8px, 2.5vw, 12px)' }}
                  >
                     <div className="w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center" style={{ aspectRatio: '1' }}>
                        {cat.isViewAll ? (
                           <div className="grid grid-cols-2 gap-0.5 p-2">
                              {[...Array(4)].map((_, i) => (
                                 <div key={i} className="w-2.5 h-2.5 bg-[#1f2355]/20 rounded-sm" />
                              ))}
                           </div>
                        ) : (
                           <img 
                              src={cat.image} 
                              alt={cat.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.src = '/default-product-category-image.png'; }}
                           />
                        )}
                     </div>
                     <div className="text-center mt-1.5">
                        <p className="font-bold text-[#1f2355] leading-none" style={{ fontSize: 'clamp(8.5px, 2.5vw, 10.5px)' }}>{cat.name}</p>
                        <p className="font-black text-[#f59e0b] uppercase tracking-wider mt-0.5" style={{ fontSize: 'clamp(6px, 1.8vw, 8px)' }}>
                           {cat.isViewAll ? 'CATEGORIES' : 'CHECK PRICE'}
                        </p>
                        <div className="bg-[#1f2355] rounded-full flex items-center justify-center text-white mx-auto mt-1.5 shadow"
                           style={{ width: 'clamp(16px, 4.5vw, 20px)', height: 'clamp(16px, 4.5vw, 20px)' }}
                        >
                           <ArrowRight size={9} strokeWidth={3} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* ── TRUST BADGE STRIP ── */}
         <div className="mt-4 bg-[#1f2355] py-3.5 px-2 grid grid-cols-4 gap-1">
            {trustBadges.map((item, i) => (
               <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-[#f59e0b]">
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
               <button 
                  onClick={() => navigate('/categories')}
                  className="font-black text-orange-500 flex items-center gap-1" style={{ fontSize: 'clamp(9px, 2.8vw, 11px)' }}
               >
                  VIEW ALL <ArrowRight size={12} strokeWidth={3} />
               </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
               {loadingCategories ? (
                  [...Array(6)].map((_, i) => (
                     <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse" style={{ width: 'clamp(58px, 17vw, 75px)' }}>
                        <div className="w-full rounded-xl bg-slate-100" style={{ height: 'clamp(48px, 14vw, 62px)' }} />
                        <div className="w-10 h-2 bg-slate-100 rounded" />
                     </div>
                  ))
               ) : shopCategories.map((cat) => (
                  <div
                     key={cat.id}
                     onClick={() => navigate(`/browse/mandi?cat=${cat.id}`)}
                     className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                     style={{ width: 'clamp(58px, 17vw, 75px)' }}
                  >
                     <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm"
                        style={{ height: 'clamp(48px, 14vw, 62px)' }}
                     >
                        <img 
                           src={cat.image} 
                           alt={cat.name} 
                           className="w-full h-full object-cover" 
                           onError={(e) => { e.target.src = '/default-product-category-image.png'; }}
                        />
                     </div>
                     <span className="font-semibold text-slate-600 text-center leading-tight" style={{ fontSize: 'clamp(8px, 2.5vw, 10px)' }}>{cat.name}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* ── BULK ORDER BANNER ── */}
         <div className="mt-5 px-4">
            <div className="relative bg-[#fdf0e8] rounded-[18px] overflow-hidden shadow-sm">
               <div className="py-4 pl-4" style={{ maxWidth: '58%' }}>
                  <p className="text-orange-600 font-black uppercase tracking-widest" style={{ fontSize: 'clamp(8px, 2.5vw, 11px)' }}>Best Deals on</p>
                  <h2 className="text-[#1f2355] font-black leading-tight mt-0.5" style={{ fontSize: 'clamp(20px, 6.5vw, 28px)' }}>Bulk Orders</h2>
                  <p className="text-slate-500 font-medium mt-1 leading-snug" style={{ fontSize: 'clamp(8px, 2.5vw, 11px)' }}>Get extra discounts on<br />bulk purchases.</p>
                  <button
                     onClick={() => navigate('/browse/mandi')}
                     className="mt-3 bg-orange-500 text-white rounded-xl font-black uppercase flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                     style={{ fontSize: 'clamp(8px, 2.5vw, 11px)', padding: 'clamp(7px, 2vw, 10px) clamp(12px, 3.5vw, 18px)' }}
                  >
                     ORDER NOW <ArrowRight size={11} strokeWidth={3} />
                  </button>
               </div>

               {/* Product images */}
               <div className="absolute right-0 top-0 bottom-0" style={{ width: '48%' }}>
                  <img
                     src={MATERIAL_IMAGES.brick}
                     alt="Bricks"
                     className="absolute bottom-0 right-3 object-contain drop-shadow-lg"
                     style={{ width: 'clamp(80px, 23vw, 110px)', height: 'clamp(80px, 23vw, 110px)' }}
                     onError={(e) => { e.target.src = '/default-product-category-image.png'; }}
                  />
                  <img
                     src={MATERIAL_IMAGES.cement}
                     alt="Cement"
                     className="absolute top-3 right-8 object-contain drop-shadow-md"
                     style={{ width: 'clamp(55px, 16vw, 75px)', height: 'clamp(55px, 16vw, 75px)' }}
                     onError={(e) => { e.target.src = '/default-product-category-image.png'; }}
                  />
               </div>

               {/* Discount Badge */}
               <div className="absolute right-2 bottom-2 bg-[#1f2355] rounded-full flex flex-col items-center justify-center text-white shadow-xl rotate-6 z-10"
                  style={{ width: 'clamp(52px, 14vw, 64px)', height: 'clamp(52px, 14vw, 64px)' }}
               >
                  <p className="font-black uppercase opacity-70" style={{ fontSize: 'clamp(5.5px, 1.6vw, 7px)' }}>UP TO</p>
                  <p className="font-black leading-none" style={{ fontSize: 'clamp(13px, 4vw, 17px)' }}>20%</p>
                  <p className="font-black uppercase opacity-70" style={{ fontSize: 'clamp(5.5px, 1.6vw, 7px)' }}>OFF</p>
               </div>
            </div>
         </div>

         {/* ── QUICK ACTIONS ── */}
         <div className="mt-5 px-4 grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
               <div key={i} className="bg-white border border-slate-100 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-center"
                  style={{ padding: 'clamp(8px, 2.5vw, 12px) clamp(4px, 1.5vw, 8px)' }}
               >
                  <div className={cn('rounded-xl flex items-center justify-center', action.bg, action.color)}
                     style={{ width: 'clamp(32px, 9vw, 40px)', height: 'clamp(32px, 9vw, 40px)' }}
                  >
                     <action.icon size={16} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-[#1f2355] leading-tight" style={{ fontSize: 'clamp(7px, 2vw, 9px)' }}>{action.label}</p>
                  <p className="font-medium text-slate-400 leading-tight" style={{ fontSize: 'clamp(6px, 1.8vw, 8px)' }}>{action.sub}</p>
               </div>
            ))}
         </div>

         {/* ── TOP SELLING PRODUCTS ── */}
         <div className="mt-5 pb-4">
            <div className="px-4 flex items-center justify-between mb-3">
               <h2 className="font-black text-[#1f2355]" style={{ fontSize: 'clamp(14px, 4.5vw, 18px)' }}>Top Selling Products</h2>
               <button className="font-black text-orange-500 flex items-center gap-1" style={{ fontSize: 'clamp(9px, 2.8vw, 11px)' }}>
                  VIEW ALL <ArrowRight size={12} strokeWidth={3} />
               </button>
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
                        <p className="font-bold text-[#1f2355] line-clamp-1" style={{ fontSize: 'clamp(10px, 3vw, 12px)' }}>{product.title}</p>
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

      </div>
   );
}
