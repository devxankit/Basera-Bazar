import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ChevronRight,
  ArrowRight,
  IndianRupee,
  Database,
  Building2,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Plus,
  Minus
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

export default function MandiCategoryView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useCart();

  useEffect(() => {
    const fetchCategoryListings = async () => {
      try {
        const res = await api.get(`/mandi/marketplace/category/${id}`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryListings();
  }, [id]);

  const updateCart = (product, delta) => {
    // Cart logic is now handled by context
    // We just map the updateCart calls to addToCart or removeFromCart
    if (delta > 0) {
      addToCart(product);
    } else {
      removeFromCart(product._id);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <Loader2 size={40} className="animate-spin text-[#001b4e]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-6 py-6 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-xl">
             <ArrowLeft size={20} className="text-[#001b4e]" />
           </button>
           <div>
              <h1 className="text-[17px] font-bold text-[#001b4e]">{data?.category?.name || 'Browse Materials'}</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{data?.listings?.length || 0} Options Available</p>
           </div>
        </div>
        <button className="p-2 bg-slate-50 rounded-xl relative">
           <Filter size={18} className="text-[#001b4e]" />
        </button>
      </div>

      <div className="p-6 space-y-6">
         {/* Featured Lowest Price Banner */}
         {data?.listings?.[0] && (
            <div className="bg-gradient-to-br from-indigo-900 to-[#001b4e] rounded-[32px] p-6 text-white shadow-xl shadow-indigo-900/10">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2 inline-block">Best Value Today</span>
                     <h2 className="text-[20px] font-bold italic line-clamp-1">{data.listings[0].title}</h2>
                     <p className="text-white/60 text-[12px] mt-1">by {data.listings[0].seller_id?.mandi_profile?.business_name || 'Verified Seller'}</p>
                  </div>
                  <div className="text-right">
                     <div className="text-[22px] font-bold">₹{data.listings[0].pricing.price_per_unit}</div>
                     <div className="text-[11px] text-white/40 font-medium">/{data.listings[0].pricing.unit}</div>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-[12px] font-bold text-indigo-200">
                  <MapPin size={14} />
                  Within your delivery zone
               </div>
            </div>
         )}

         {/* All Listings */}
         <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#001b4e] px-1 uppercase tracking-wider">All Available Sellers</h3>
            <div className="space-y-4">
               {data?.listings?.map((listing) => (
                  <motion.div 
                    key={listing._id}
                    className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-50 flex gap-4 overflow-hidden relative"
                  >
                     <div className="w-24 h-24 rounded-3xl bg-slate-100 shrink-0 overflow-hidden">
                        <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-grow py-1 flex flex-col justify-between">
                        <div>
                           <div className="flex items-center justify-between">
                              <h4 className="text-[15px] font-bold text-[#001b4e] line-clamp-1">{listing.title}</h4>
                              <div className="flex items-center gap-1 text-emerald-500">
                                 <Star size={12} fill="currentColor" />
                                 <span className="text-[11px] font-bold">4.8</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                              <Building2 size={12} className="text-slate-300" />
                              <span className="text-[11px] font-medium text-slate-400 line-clamp-1">{listing.seller_id?.mandi_profile?.business_name || 'Seller'}</span>
                           </div>
                        </div>

                        <div className="flex items-end justify-between">
                           <div>
                              <div className="text-[18px] font-bold text-[#001b4e]">₹{listing.pricing.price_per_unit}</div>
                              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{listing.stock_quantity} {listing.pricing.unit} Left</div>
                           </div>
                           
                           <div className="flex items-center gap-1">
                              {cart[listing._id] ? (
                                <div className="flex items-center bg-slate-50 rounded-2xl p-1 gap-3 px-4 border border-slate-100">
                                   <button onClick={() => updateCart(listing, -1)} className="text-[#001b4e]"><Minus size={16} /></button>
                                   <span className="text-[14px] font-black text-[#001b4e]">{cart[listing._id].qty}</span>
                                   <button onClick={() => updateCart(listing, 1)} className="text-[#001b4e]"><Plus size={16} /></button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => updateCart(listing, 1)}
                                  className="w-10 h-10 bg-[#001b4e] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/10 active:scale-90 transition-all"
                                >
                                   <Plus size={20} />
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </div>

      {/* Cart Navigation Card */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-0 right-0 z-50 px-6 max-w-md mx-auto"
          >
             <button 
               onClick={() => navigate('/cart')}
               className="w-full bg-[#001b4e] p-5 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-indigo-900/30 group active:scale-[0.98] transition-all"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 relative">
                      <ShoppingBag size={20} />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">{cartCount}</span>
                   </div>
                   <div className="text-left">
                      <div className="text-[16px] font-bold leading-none">₹{cartTotal}</div>
                      <div className="text-[11px] text-white/40 font-medium">Estimated Order Value</div>
                   </div>
                </div>
                <div className="flex items-center gap-2 font-bold text-[14px] uppercase tracking-wider">
                   Checkout
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
