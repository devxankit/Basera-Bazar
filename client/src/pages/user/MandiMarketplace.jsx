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
  Truck
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
      {/* Hero Section */}
      <div className="bg-[#001b4e] pt-8 pb-32 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                 <ShieldCheck size={14} className="text-emerald-400" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Verified Sellers Only</span>
              </div>
           </div>
           
           <div>
              <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight">
                Mandi <span className="text-indigo-400 italic">Bazar</span>
              </h1>
              <p className="text-white/60 text-[14px] font-medium leading-relaxed max-w-[80%] mt-2">
                Order construction materials at market prices with direct site delivery.
              </p>
           </div>
           
           <div className="bg-white rounded-3xl p-1 shadow-xl shadow-indigo-900/20 flex items-center">
              <div className="flex-grow flex items-center px-4">
                 <Search size={20} className="text-slate-300 mr-2" />
                 <input 
                   type="text" 
                   placeholder="Search bricks, sand, stone..." 
                   className="bg-transparent border-none outline-none text-[#001b4e] placeholder:text-slate-300 text-[15px] py-4 w-full font-medium"
                 />
              </div>
              <button className="bg-[#001b4e] text-white p-3 rounded-2xl">
                 <Search size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-16 relative z-20 space-y-8">
         {/* Categories Grid */}
         <div className="space-y-4">
            <h2 className="text-[20px] font-bold text-[#001b4e] flex items-center justify-between">
               Material Categories
               <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider">Lowest Price Market</span>
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#001b4e]" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                 {categories.map((cat, idx) => (
                    <motion.div 
                      key={cat._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => navigate(`/mandi-bazar/category/${cat._id}`)}
                      className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-5 active:scale-[0.98] transition-all group overflow-hidden relative"
                    >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                       <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden relative z-10">
                          <img src={cat.icon || `https://images.unsplash.com/photo-1590480394626-82098d3f86e2?w=500&q=80`} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="flex-grow relative z-10 py-1">
                          <h3 className="text-[18px] font-bold text-[#001b4e]">{cat.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1.5 text-emerald-600 font-bold">
                             <TrendingUp size={14} />
                             <span className="text-[13px]">Starts from</span>
                             <span className="text-[15px]">₹{cat.best_price}</span>
                             <span className="text-[10px] text-slate-400 font-medium">/{cat.unit}</span>
                          </div>
                          <div className="mt-3 flex items-center text-[12px] font-bold text-indigo-600">
                             Browse Materials <ChevronRight size={14} />
                          </div>
                       </div>
                    </motion.div>
                 ))}
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
