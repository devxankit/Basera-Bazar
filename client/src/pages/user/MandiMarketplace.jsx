import React, { useState, useEffect } from 'react';
import {
   ShoppingBag,
   Search,
   MapPin,
   TrendingUp,
   Box,
   Star,
   ArrowRight,
   ChevronRight,
   IndianRupee,
   Loader2,
   Building2,
   Package,
   ShieldCheck,
   Truck,
   Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Supplier Assets
import aggregateImg from '../../assets/suppliers/aggregate supplier.jpg';
import brickImg from '../../assets/suppliers/brick supplier.jpg';
import cementImg from '../../assets/suppliers/cement supplier.jpg';
import materialsImg from '../../assets/suppliers/cnstruction materials supplier.jpg';
import sandImg from '../../assets/suppliers/sand supplier.jpg';
import tmtImg from '../../assets/suppliers/tmt supplier.jpg';

export default function MandiMarketplace() {
   const navigate = useNavigate();
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchMarketHome = async () => {
         try {
            const res = await api.get('/listings/categories?type=supplier');
            if (res.data.success) {
               setCategories(res.data.data);
            }
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchMarketHome();
   }, []);

   const getCatImage = (cat) => {
      const name = cat.name?.toLowerCase() || '';
      if (name.includes('aggregate')) return aggregateImg;
      if (name.includes('brick')) return brickImg;
      if (name.includes('cement')) return cementImg;
      if (name.includes('material')) return materialsImg;
      if (name.includes('sand') || name.includes('बालू') || name.includes('रेत')) return sandImg;
      if (name.includes('tmt') || name.includes('steel') || name.includes('saria')) return tmtImg;
      
      // Secondary: Try database icon if it exists and looks valid (not a broken local path like missing uploads)
      if (cat.icon && typeof cat.icon === 'string' && cat.icon.length > 5) return cat.icon;
      
      // Final safe fallback
      return '/default-product-category-image.png';
   };

   return (
      <div className="min-h-screen bg-slate-50 font-sans pb-32">
         {/* Hero Section (Matched Exact Mockup) */}
         <div className="relative w-full bg-white overflow-hidden pb-6">
            {/* Poster Image */}
            <div className="relative w-full aspect-[4/3] sm:aspect-video">
               <img 
                  src="/mandi_poster_hero.jpg" 
                  className="w-full h-full object-cover" 
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                  alt="Mandi Hero" 
                  onError={(e) => { e.target.style.display = 'none'; }}
               />
               <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-sm">
                  <span className="text-[20px] font-black text-[#d97706]">मंडी</span>
                  <span className="text-[20px] font-black text-[#1e293b]">BAZAR</span>
               </div>
            </div>

            {/* Bullets & Slogan */}
            <div className="px-5 mt-2 flex items-center gap-5">
               <div className="flex flex-col gap-2 border-r-2 border-[#d97706]/20 pr-5 shrink-0">
                  {['Fresh Material', 'Fast Delivery', 'Lowest Price'].map((bullet, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                        <span className="text-[12px] font-extrabold text-[#d97706] uppercase tracking-tighter">{bullet}</span>
                     </div>
                  ))}
               </div>
               <div className="flex-grow">
                  <h1 className="text-[20px] sm:text-[24px] font-black text-[#1e293b] leading-[1.2] text-left">
                     खदान मंडी से सीधे<br />आपके घर तक
                  </h1>
               </div>
            </div>

            {/* 4 Dark Cards Grid (3 DB Categories + 1 More Button) */}
            <div className="px-5 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
               {loading ? (
                  Array(4).fill(0).map((_, i) => (
                     <div key={i} className="bg-[#2A3F54] rounded-[16px] p-3 h-48 animate-pulse" />
                  ))
               ) : (
                  <>
                     {categories.slice(0, 3).map((cat, i) => (
                        <div 
                           key={cat._id || i}
                           onClick={() => navigate(`/mandi-bazar/category/${cat._id}`)}
                           className="bg-[#2A3F54] rounded-[16px] p-3 flex flex-col items-center gap-3 cursor-pointer shadow-xl active:scale-95 transition-transform"
                        >
                           <div className="w-full aspect-square bg-[#fbf9f6] rounded-[12px] flex flex-col items-center justify-center p-2 relative overflow-hidden">
                              <img 
                                 src={getCatImage(cat)} 
                                 className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" 
                                 alt={cat.name} 
                                 onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-category-image.png'; }}
                              />
                           </div>
                           <div className="text-center w-full flex flex-col items-center justify-between gap-1 py-1 flex-grow">
                              <h3 className="text-white font-semibold text-[13px] leading-tight truncate w-full capitalize">{cat.name}</h3>
                              <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">
                                 {cat.listing_count ? `${cat.listing_count} Supplier${cat.listing_count > 1 ? 's' : ''}` : 'Check Price'}
                              </p>
                              <button className="mt-auto border border-white/40 text-white rounded-[24px] py-1 px-3 text-[10px] font-extrabold tracking-wide hover:bg-white hover:text-[#2A3F54] transition-colors whitespace-nowrap">
                                 SHOP NOW
                              </button>
                           </div>
                        </div>
                     ))}

                     {/* 4th Card -> More Button */}
                     <div 
                        onClick={() => document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' })}
                        className="bg-[#2A3F54] rounded-[16px] p-3 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-xl active:scale-95 transition-transform"
                     >
                        <div className="w-full aspect-square bg-white/5 rounded-[12px] flex flex-col items-center justify-center relative overflow-hidden group">
                           <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus size={24} className="text-white" />
                           </div>
                        </div>
                        <div className="text-center w-full flex flex-col items-center gap-1 py-1">
                           <span className="text-white font-extrabold tracking-widest uppercase text-[12px] mt-2 block">View All</span>
                           <span className="text-white/50 text-[10px] font-bold tracking-wider">CATEGORIES</span>
                        </div>
                     </div>
                  </>
               )}
            </div>
         </div>

         {/* Main Content Area */}
         <div id="main-content" className="px-6 mt-8 space-y-6">
            {/* List Section Header */}
            <div className="flex items-end justify-between mb-4">
               <h2 className="text-[22px] font-black text-[#0c2461] tracking-tight leading-none">Material Categories</h2>
               <span className="text-[10px] font-black text-[#6366f1] uppercase tracking-[2px] italic">Lowest Price Market</span>
            </div>

            <div className="grid grid-cols-4 gap-x-2 gap-y-5">
               {loading ? (
                  Array(8).fill(0).map((_, i) => (
                     <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-full aspect-square bg-slate-100 rounded-[20px] animate-pulse" />
                        <div className="w-3/4 h-3 bg-slate-100 rounded-md animate-pulse" />
                     </div>
                  ))
               ) : categories.length > 0 ? (
                  categories.map((cat, idx) => (
                     <motion.div
                        key={cat._id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(`/mandi-bazar/category/${cat._id}`)}
                        className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform"
                     >
                        <div className="w-full aspect-square bg-[#f0f4f4] rounded-[20px] p-2 flex items-center justify-center shadow-sm border border-slate-50 transition-shadow overflow-hidden">
                           <img 
                              src={getCatImage(cat)} 
                              className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
                              alt={cat.name} 
                              onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-category-image.png'; }}
                           />
                        </div>
                        <h3 className="text-[11px] font-bold text-slate-800 leading-[1.1] text-center px-1 capitalize line-clamp-2">
                           {cat.name}
                        </h3>
                     </motion.div>
                  ))
               ) : (
                  <div className="col-span-4 py-20 text-center text-slate-400 font-bold">
                     No categories found.
                  </div>
               )}
            </div>

            {/* Why Trust Mandi Bazar */}
            <div className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" />
               <h3 className="text-[20px] font-bold mb-4 relative z-10">Direct From Mandi</h3>
               <div className="space-y-4 relative z-10">
                  {[
                     { icon: <ShieldCheck size={18} />, title: "Quality Guaranteed", desc: "Materials inspected before dispatch" },
                     { icon: <Truck size={18} />, title: "Live Tracking", desc: "Real-time updates on site delivery" },
                     { icon: <IndianRupee size={18} />, title: "Cash on Delivery", desc: "Pay after unloading materials" }
                  ].map((item, i) => (
                     <div key={i} className="flex gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                           {item.icon}
                        </div>
                        <div>
                           <h4 className="text-[14px] font-bold">{item.title}</h4>
                           <p className="text-[11px] text-white/50">{item.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}
