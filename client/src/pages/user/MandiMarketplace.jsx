import React, { useState, useEffect } from 'react';
import {
   ShoppingCart,
   Search,
   MapPin,
   ArrowRight,
   ChevronRight,
   Loader2,
   Building2,
   Package,
   ShieldCheck,
   Truck,
   Plus,
   IndianRupee,
   HardHat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

export default function MandiMarketplace() {
   const navigate = useNavigate();
   const { cartCount } = useCart();
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [failedImages, setFailedImages] = useState({});

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
      <div className="min-h-screen bg-slate-50 font-sans">
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
               <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-sm">
                  <span className="text-[20px] font-black text-[#d97706]">बसेरा</span>
                  <span className="text-[20px] font-black text-[#1e293b]">BAZAR</span>
               </div>
               
               <div 
                  onClick={() => navigate('/cart')}
                  className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
               >
                  <ShoppingCart size={18} className="text-[#1e293b]" />
                  {cartCount > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] text-white font-black flex items-center justify-center shadow-sm">
                        {cartCount}
                     </span>
                  )}
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
         </div>

         {/* Non-Interactive Marketplace Footer */}
         <div className="w-full bg-white border-t border-slate-100 pt-10 xs:pt-16 pb-4 md:pb-8 mt-8 z-10 relative">
            <div className="max-w-[1400px] mx-auto px-2 xs:px-6 md:px-12 flex flex-col items-center">
               
               {/* CTA Text Section */}
               <div className="w-full max-w-2xl text-center mb-10 xs:mb-14 space-y-3 px-4">
                  <h2 className="text-[20px] xs:text-[24px] md:text-[32px] font-black text-[#0c2461] leading-tight tracking-tight">
                     Get Materials Delivered <span className="text-[#d97706] italic">Fast & Direct</span>
                  </h2>
                  <p className="text-[12px] xs:text-[14px] md:text-[16px] font-medium text-slate-500 leading-relaxed max-w-lg mx-auto">
                     Skip the hassle. Order construction materials directly from verified sellers at the lowest mandi prices, delivered straight to your site.
                  </p>
               </div>

               <div className="w-full grid grid-cols-4 gap-2 xs:gap-4 md:gap-16">
                  {[
                     {
                        img: "/3d_truck_delivery_icon_1776770486387.png",
                        title: "Fast Delivery",
                        fallback: <Truck size={24} className="text-orange-500" />
                     },
                     {
                        img: "/3d_shield_verified_icon_1776770571779.png",
                        title: "Verified Sellers",
                        fallback: <ShieldCheck size={24} className="text-blue-500" />
                     },
                     {
                        img: "/3d_rupee_coin_icon_1776770743699.png",
                        title: "Best Prices",
                        fallback: <IndianRupee size={24} className="text-emerald-500" />
                     },
                     {
                        img: "/3d_hardhat_quality_icon_1776770864435.png",
                        title: "Quality Assured",
                        fallback: <HardHat size={24} className="text-amber-500" />
                     }
                  ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center text-center gap-2 xs:gap-3 md:gap-4">
                        <div className="w-[4.2rem] h-[4.2rem] xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 flex items-center justify-center rounded-[16px] xs:rounded-[24px] md:rounded-[36px] bg-slate-50/50 border border-slate-100 overflow-hidden">
                           {!failedImages[item.title] ? (
                              <img
                                 src={item.img}
                                 alt={item.title}
                                 className="w-[95%] h-[95%] object-contain mix-blend-multiply"
                                 onError={() => setFailedImages(prev => ({ ...prev, [item.title]: true }))}
                              />
                           ) : (
                              <div className="opacity-50">{item.fallback}</div>
                           )}
                        </div>
                        <div className="flex flex-col min-h-[32px] xs:min-h-[40px] md:min-h-[48px] justify-center mt-1">
                           <span className="text-[8px] xs:text-[11px] sm:text-[13px] md:text-[15px] font-black text-slate-700 uppercase tracking-tighter leading-[1.1]">
                              {item.title.split(' ').map((word, index) => (
                                 <React.Fragment key={index}>
                                    {word}
                                    {index === 0 && <br />}
                                 </React.Fragment>
                              ))}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-10 md:mt-16 w-full flex justify-center pt-8 border-t border-slate-50">
                  <span className="text-slate-400 font-bold text-[9px] xs:text-[11px] tracking-widest uppercase text-center">
                     © {new Date().getFullYear()} Basera Bazar Marketplace
                  </span>
               </div>
            </div>
         </div>
      </div>
   );
}
