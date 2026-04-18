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
import brickImg from '../../assets/suppliers/brick supplier.jpg';
import sandImg from '../../assets/suppliers/sand supplier.jpg';
import tmtImg from '../../assets/suppliers/tmt supplier.jpg';

export default function MandiMarketplace() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketHome = async () => {
      try {
        const res = await api.get('/mandi/marketplace/home');
        setCategories(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketHome();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Hero Section (Balanced & Premium) */}
      <div className="bg-[#0c2461] pt-10 pb-32 px-6 rounded-b-[40px] relative overflow-hidden shadow-2xl">
        {/* Compact Hero Image (Pinned right) */}
        <div className="absolute top-6 right-2 w-36 h-36 md:w-52 md:h-52 z-0 pointer-events-none">
           <img 
            src="/mandi_hero.png" 
            alt="Mandi Hero" 
            className="w-full h-full object-contain" 
           />
        </div>

        <div className="relative z-10 space-y-5 max-w-[360px]">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-fit">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verified Sellers Only</span>
           </div>
           
           <div className="space-y-1">
              <h1 className="text-[34px] font-black leading-tight tracking-tight drop-shadow-lg flex flex-col">
                <span className="text-[#f97316]">Mandi</span> 
                <span className="text-[#38bdf8] italic">Bazar</span>
              </h1>
              <p className="text-white/60 text-[13px] font-medium leading-normal pr-8">
                Premium construction materials at your doorstep.
              </p>
           </div>
           
           {/* Clean Search Bar */}
           <div className="bg-white rounded-[40px] p-1.5 shadow-xl flex items-center mt-6 ring-2 ring-white/5 relative z-20">
              <div className="flex-grow flex items-center px-4">
                 <Search size={18} className="text-slate-300 mr-2" />
                 <input 
                   type="text" 
                   placeholder="Search materials..." 
                   className="bg-transparent border-none outline-none text-[#001b4e] placeholder:text-slate-300 text-[15px] py-2.5 w-full font-extrabold"
                 />
              </div>
              <button className="bg-[#0c2461] text-white p-3 rounded-full shadow-lg active:scale-95 transition-all">
                 <Search size={20} strokeWidth={3} />
              </button>
           </div>
        </div>
      </div>

      {/* Category Selection Bubbles (Floating Overlap) */}
      <div className="px-6 -mt-28 relative z-30">
         <div className="relative flex justify-between items-center py-4 px-px">
            {/* Connection Paths */}
            <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-20">
               <svg width="100%" height="60" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 50C100 20 150 80 200 50C250 20 300 80 350 50" stroke="#0c2461" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
               </svg>
            </div>

            {[
              { name: 'Bricks', img: brickImg, path: '/mandi-bazar/category/bricks_id' },
              { name: 'Sand', img: sandImg, path: '/mandi-bazar/category/sand_id' },
              { name: 'TMT', img: tmtImg, path: '/mandi-bazar/category/steel_id' }
            ].map((cat, i) => (
              <div 
                key={i} 
                onClick={() => navigate(cat.path)}
                className="flex flex-col items-center gap-2 active:scale-90 transition-transform cursor-pointer"
              >
                 <div className="w-[68px] h-[68px] rounded-full bg-white p-[2px] border border-blue-100 flex items-center justify-center shadow-xl relative group">
                    <div className="w-full h-full rounded-full overflow-hidden border border-slate-100 relative z-10 p-0 bg-slate-50">
                       <img src={cat.img} className="w-full h-full object-cover brightness-105" alt={cat.name} />
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{cat.name}</span>
              </div>
            ))}

            {/* See More Bubble */}
            <div 
              onClick={() => document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 active:scale-90 transition-transform cursor-pointer"
            >
               <div className="w-[68px] h-[68px] rounded-full bg-white p-[2px] border border-blue-100 flex items-center justify-center shadow-xl relative group">
                  <div className="w-full h-full rounded-full flex flex-col items-center justify-center border border-slate-100 relative z-10 bg-slate-50">
                     <Plus size={22} className="text-[#0c2461]" />
                  </div>
               </div>
               <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">More</span>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div id="main-content" className="px-6 mt-8 space-y-6">
         {/* List Section Header */}
         <div className="flex items-end justify-between mb-4">
            <h2 className="text-[22px] font-black text-[#0c2461] tracking-tight leading-none">Material Categories</h2>
            <span className="text-[10px] font-black text-[#6366f1] uppercase tracking-[2px] italic">Lowest Price Market</span>
         </div>
         
         <div className="space-y-4">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="font-bold text-[14px]">Loading categories...</span>
               </div>
            ) : categories.length > 0 ? (
               categories.map((cat, idx) => (
                  <motion.div 
                    key={cat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => navigate(`/mandi-bazar/category/${cat._id}`)}
                    className="bg-white p-5 rounded-[28px] shadow-[0_10px_35px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-5 active:scale-[0.98] transition-all group overflow-hidden relative"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                     <div className="w-20 h-20 bg-slate-50 rounded-[22px] flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden relative z-10 transition-transform group-hover:scale-105">
                        <img 
                          src={cat.image || cat.icon || cat.img || `https://images.unsplash.com/photo-1590480394626-82098d3f86e2?w=500&q=80`} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                     </div>
                     <div className="flex-grow relative z-10">
                        <h3 className="text-[18px] font-black text-[#0c2461] leading-tight">{cat.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <TrendingUp size={14} className="text-emerald-500" />
                           <span className="text-[12px] font-bold text-slate-400">Starts from</span>
                           <span className="text-[16px] font-black text-emerald-600">₹{cat.best_price || cat.price || '---'}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase">/{cat.unit || 'unit'}</span>
                        </div>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#0c2461] border border-slate-100 shrink-0 group-hover:bg-[#0c2461] group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                     </div>
                  </motion.div>
               ))
            ) : (
               <div className="py-20 text-center text-slate-400 font-bold">
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
