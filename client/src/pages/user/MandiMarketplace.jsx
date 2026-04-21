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
      // Primary: Use database icon URL
      if (cat.icon && typeof cat.icon === 'string' && cat.icon.length > 5) {
         return cat.icon;
      }
      
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
            <div className="px-3 md:px-5 mt-6 grid grid-cols-4 gap-2 md:gap-4">
               {loading ? (
                  Array(4).fill(0).map((_, i) => (
                     <div key={i} className="bg-[#2A3F54] rounded-[12px] p-2 h-36 animate-pulse" />
                  ))
               ) : (
                  <>
                     {categories.slice(0, 3).map((cat, i) => (
                        <div 
                           key={cat._id || i}
                           onClick={() => navigate(`/mandi-bazar/category/${cat._id}`)}
                           className="bg-white rounded-[16px] p-2 flex flex-col items-center gap-2 cursor-pointer shadow-xl active:scale-95 transition-transform border border-slate-100"
                        >
                        <div className="w-full aspect-square flex flex-col items-center justify-center p-1 relative overflow-hidden">
                              <img 
                                 src={getCatImage(cat)} 
                                 className="w-full h-full object-contain mix-blend-multiply" 
                                 alt={cat.name} 
                                 onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-category-image.png'; }}
                              />
                           </div>
                           <div className="text-center w-full flex flex-col items-center justify-between gap-[2px] py-0.5 flex-grow">
                              <h3 className="text-[#0c2461] font-semibold text-[10px] md:text-[13px] leading-tight truncate w-full capitalize">{cat.name?.split(' ')[0]}</h3>
                              <p className="text-slate-500 text-[7px] md:text-[10px] font-bold tracking-widest uppercase whitespace-nowrap mb-1">
                                 {cat.listing_count ? `${cat.listing_count} Supplier${cat.listing_count > 1 ? 's' : ''}` : 'Check Price'}
                              </p>
                              <button className="mt-auto bg-[#0c2461] border border-transparent text-white rounded-[24px] py-0.5 px-2 md:py-1 md:px-3 text-[8px] md:text-[10px] font-extrabold tracking-wide hover:bg-[#1e293b] transition-colors whitespace-nowrap shadow-sm">
                                 SHOP NOW
                              </button>
                           </div>
                        </div>
                     ))}

                     {/* 4th Card -> More Button */}
                     <div 
                        onClick={() => document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' })}
                        className="bg-white rounded-[16px] p-2 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 transition-transform border border-slate-100"
                     >
                        <div className="w-full aspect-square flex flex-col items-center justify-center relative overflow-hidden group p-1.5">
                           <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100">
                              <Plus size={18} className="text-[#0c2461]" />
                           </div>
                        </div>
                        <div className="text-center w-full flex flex-col items-center gap-1 py-0.5 justify-center flex-grow">
                           <span className="text-[#0c2461] font-extrabold tracking-widest uppercase text-[10px] md:text-[12px] block whitespace-nowrap">View All</span>
                           <span className="text-slate-400 text-[7px] md:text-[10px] font-bold tracking-wider">CATEGORIES</span>
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
                        <div className="w-full aspect-square flex items-center justify-center transition-shadow overflow-hidden p-2 rounded-full bg-white shadow-sm">
                           <img 
                              src={getCatImage(cat)} 
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
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
            {/* Light Glassmorphism Trust Section: Direct From Mandi */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white/70 backdrop-blur-3xl rounded-[32px] xs:rounded-[40px] p-5 xs:p-9 relative overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] border border-white/60 mx-1 xs:mx-0"
            >
               {/* Decorative soft light glows */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-[80px]" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/40 rounded-full -ml-16 -mb-16 blur-[60px]" />
               
               <h3 className="text-[22px] xs:text-[28px] font-black mb-8 xs:mb-10 relative z-10 tracking-tight leading-tight text-[#0c2461]">
                  Direct From Mandi
               </h3>
               
               <div className="space-y-6 xs:space-y-8 relative z-10">
                  {[
                     { icon: <ShieldCheck size={22} />, title: "Quality Guaranteed", desc: "Inspection before dispatch" },
                     { icon: <Truck size={22} />, title: "Live Tracking", desc: "Real-time updates on site" },
                     { icon: <IndianRupee size={22} />, title: "Cash on Delivery", desc: "Pay after unloading" }
                  ].map((item, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4 xs:gap-6 group"
                     >
                        <div className="w-11 h-11 xs:w-16 xs:h-16 bg-white rounded-[16px] xs:rounded-[24px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(12,36,97,0.06)] border border-slate-100 group-hover:scale-105 transition-all duration-300">
                           <div className="text-[#0c2461]/90 scale-90 xs:scale-100">{item.icon}</div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <h4 className="text-[15px] xs:text-[19px] font-extrabold text-[#0c2461] tracking-tight xs:tracking-wide">{item.title}</h4>
                           <p className="text-[11px] xs:text-[14px] text-slate-500 font-bold leading-tight line-clamp-1 xs:line-clamp-none">{item.desc}</p>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </motion.div>
         </div>
      </div>
   );
}
