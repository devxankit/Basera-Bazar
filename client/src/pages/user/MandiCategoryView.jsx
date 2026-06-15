import React from 'react';
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
  Minus,
  User,
  ShieldCheck,
  Truck,
  Award,
  Flag
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useLocationContext } from '../../context/LocationContext';

const splitTitle = (title) => {
  if (!title) return { main: '', sub: '' };
  const words = title.split(' ');
  if (words.length <= 2) {
    return { main: title, sub: '' };
  }
  const main = words.slice(0, 2).join(' ');
  const sub = words.slice(2).join(' ');
  return { main, sub };
};

export default function MandiCategoryView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useCart();
  const { location } = useLocationContext();

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['mandiCategoryView', id, location?.district, location?.state],
    queryFn: () => {
      const district = location?.district || '';
      const state = location?.state || '';
      const params = `?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`;
      return api.get(`/mandi/marketplace/category/${id}${params}`).then(r => r.data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const data = rawData?.data ?? null;
  const firstListing = data?.listings?.[0];
  const { main, sub } = firstListing ? splitTitle(firstListing.title) : { main: '', sub: '' };

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
         {/* No local sellers — showing results from all areas */}
         {data?.nationwide && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-[12px] font-semibold text-amber-700">
               No sellers in your area yet — showing this category from all locations.
            </div>
         )}
         {/* Featured Lowest Price Banner */}
         {firstListing && (
            <div 
               onClick={() => navigate(`/products/${firstListing._id}`)}
               className="relative bg-[#fdfcf7] border border-[#f5efe6] rounded-[32px] p-6 text-slate-800 shadow-sm select-none overflow-visible mb-6 cursor-pointer hover:shadow-md transition-shadow"
            >
               
               {/* Ribbon Badge on top left */}
               <div className="absolute top-4 -left-3 z-10 drop-shadow-md">
                  {/* Red banner body */}
                  <div 
                     className="bg-gradient-to-r from-[#e52e2e] to-[#f44336] text-white text-[11px] font-black uppercase tracking-wider py-1.5 pl-4 pr-6 relative flex items-center gap-1.5 shadow-md"
                     style={{
                        clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)',
                     }}
                  >
                     {/* Stitched dashed border inside */}
                     <div 
                        className="absolute inset-0.5 border border-dashed border-white/30 pointer-events-none rounded" 
                        style={{ clipPath: 'polygon(0 0, 92% 0, 99% 50%, 92% 100%, 0 100%)' }} 
                     />
                     
                     <Star size={11} fill="white" className="stroke-none shrink-0" />
                     <span className="relative z-10 font-outfit tracking-wide">Best Price Today</span>
                  </div>
                  
                  {/* 3D ribbon fold underneath */}
                  <div 
                     className="absolute left-0 top-full w-3 h-1.5 bg-[#9c1c1c]" 
                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} 
                  />
                  
                  {/* Sparkle lines */}
                  <div className="absolute -top-3 -right-3.5 flex gap-0.5 rotate-12 pointer-events-none">
                     <div className="w-0.5 h-2 bg-orange-500 rounded-full transform -rotate-12" />
                     <div className="w-0.5 h-2.5 bg-orange-500 rounded-full -translate-y-0.5" />
                     <div className="w-0.5 h-2 bg-orange-500 rounded-full transform rotate-12" />
                  </div>
               </div>

               {/* Main Grid Content */}
               <div className="grid grid-cols-12 gap-4 mt-4 relative z-0">
                  {/* Left Column (Info) */}
                  <div className="col-span-7 flex flex-col justify-between min-h-[140px]">
                     <div className="space-y-2.5">
                        {/* Product Name */}
                        <h2 className="text-[22px] font-black text-[#001b4e] leading-tight tracking-tight mt-3 font-outfit">
                           {main}
                           {sub && (
                              <span className="block text-[#e52e2e]">
                                 {sub}
                              </span>
                           )}
                        </h2>

                        {/* Seller Info */}
                         <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                  <User size={13} strokeWidth={2.5} />
                               </div>
                               <span className="text-[12px] font-bold text-slate-500 tracking-tight font-outfit">
                                  by {firstListing.partner_id?.profile?.mandi_profile?.business_name || 'Verified Seller'}
                               </span>
                            </div>
                            {(() => {
                               const rating = firstListing.partner_id?.profile?.mandi_profile?.avg_rating || firstListing.partner_id?.profile?.supplier_profile?.avg_rating || 0;
                               return rating > 0 ? (
                                  <div className="flex items-center gap-1 text-emerald-500 shrink-0 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/30">
                                     <Star size={11} fill="currentColor" />
                                     <span className="text-[11px] font-black font-outfit leading-none">{rating.toFixed(1)}</span>
                                  </div>
                               ) : null;
                            })()}
                         </div>
                     </div>

                     {/* Dashed line */}
                     <div className="border-t border-dashed border-[#e6dfd5] w-full my-3.5" />

                     {/* Delivery badge */}
                     <div className="flex items-center justify-between bg-[#fffaf5] border border-[#faecd8] rounded-full px-4 py-2 w-full max-w-[280px]">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-[#f97316] flex items-center justify-center text-white shrink-0">
                              <MapPin size={11} strokeWidth={3} />
                           </div>
                           <span className="text-[12px] font-bold text-[#001b4e] font-outfit">Within your delivery zone</span>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center text-white shrink-0">
                           <CheckCircle2 size={11} strokeWidth={3.5} className="text-white" />
                        </div>
                     </div>
                  </div>

                  {/* Right Column (Price, Image, Button) */}
                  <div className="col-span-5 flex flex-col items-end justify-between min-h-[140px]">
                     {/* Price Info */}
                     <div className="text-right flex flex-col leading-none mb-1">
                        <div className="text-[28px] font-black text-[#001b4e] tracking-tight font-outfit">
                           ₹{firstListing.pricing.price_per_unit}
                        </div>
                        <div className="text-[11px] text-slate-400 font-extrabold uppercase mt-1 font-outfit">
                           /{firstListing.pricing.unit}
                        </div>
                     </div>

                     {/* Product Image with Shadow */}
                     <div className="relative w-full aspect-[4/3] max-h-24 flex items-center justify-center select-none my-1">
                        <img 
                           src={firstListing.thumbnail} 
                           alt={firstListing.title}
                           className="max-w-full max-h-full object-contain relative z-10 transform hover:scale-105 transition-transform duration-300"
                        />
                        {/* Soft shadow under the image to make it float */}
                        <div className="absolute bottom-1 w-[70%] h-2 bg-black/10 blur-sm rounded-full z-0" />
                     </div>

                     {/* Order Now Button */}
                     <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/products/${firstListing._id}`);
                        }}
                        className="w-full max-w-[160px] bg-gradient-to-r from-[#ff5e00] to-[#ff3c00] hover:from-[#ff6f1a] hover:to-[#ff4c1a] text-white font-black text-[12px] tracking-widest py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all duration-200 cursor-pointer uppercase font-outfit"
                     >
                        <ShoppingBag size={14} className="text-white" />
                        Order Now
                     </button>
                  </div>
               </div>

               {/* Bottom Features Strip */}
               <div className="bg-white/80 border border-[#f5efe6] rounded-[20px] py-3 px-4 flex items-center justify-around mt-5 w-full shadow-sm">
                  <div className="flex items-center gap-2">
                     <div className="text-[#15803d]">
                        <ShieldCheck size={18} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col leading-tight font-outfit">
                        <span className="text-[11px] font-bold text-[#001b4e]">Quality</span>
                        <span className="text-[11px] font-bold text-[#001b4e]">Assured</span>
                     </div>
                  </div>

                  <div className="w-[1px] h-6 bg-[#ebdcc7]/60" />

                  <div className="flex items-center gap-2">
                     <div className="text-[#f97316]">
                        <Truck size={18} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col leading-tight font-outfit">
                        <span className="text-[11px] font-bold text-[#001b4e]">Quick</span>
                        <span className="text-[11px] font-bold text-[#001b4e]">Delivery</span>
                     </div>
                  </div>

                  <div className="w-[1px] h-6 bg-[#ebdcc7]/60" />

                  <div className="flex items-center gap-2">
                     <div className="text-[#2563eb]">
                        <Award size={18} strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col leading-tight font-outfit">
                        <span className="text-[11px] font-bold text-[#001b4e]">Best</span>
                        <span className="text-[11px] font-bold text-[#001b4e]">Price</span>
                     </div>
                  </div>
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
                     <div className="w-24 h-24 rounded-3xl bg-slate-100 shrink-0 overflow-hidden p-2 flex items-center justify-center relative">
                        <img src={listing.thumbnail} alt="" className="w-full h-full object-contain" />
                        {listing.is_featured && (
                           <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-br-2xl flex items-center gap-0.5 shadow-sm text-[8px] font-black uppercase tracking-wider font-outfit z-10">
                              <Flag size={8} fill="white" className="shrink-0" />
                              <span>Featured</span>
                           </div>
                        )}
                     </div>
                     <div className="flex-grow py-1 flex flex-col justify-between">
                        <div>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <h4 className="text-[15px] font-bold text-[#001b4e] leading-snug break-words">{listing.title}</h4>
                              </div>
                               {(() => {
                                  const rating = listing.partner_id?.profile?.mandi_profile?.avg_rating || listing.partner_id?.profile?.supplier_profile?.avg_rating || 0;
                                  return rating > 0 ? (
                                     <div className="flex items-center gap-1 text-emerald-500 shrink-0">
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-[11px] font-bold">{rating.toFixed(1)}</span>
                                     </div>
                                  ) : null;
                               })()}
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                              <Building2 size={12} className="text-slate-300" />
                              <span className="text-[11px] font-medium text-slate-400 line-clamp-1">{listing.partner_id?.profile?.mandi_profile?.business_name || 'Seller'}</span>
                           </div>

                           {/* Category, Subcategory, Brand details */}
                           <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {listing.material_name && (
                                 <span className="text-[9px] font-black bg-blue-50/80 text-blue-600 border border-blue-100/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {listing.material_name}
                                 </span>
                              )}
                              {listing.type_name && (
                                 <span className="text-[9px] font-black bg-orange-50/80 text-orange-600 border border-orange-100/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {listing.type_name}
                                 </span>
                              )}
                              {listing.sub_type_name && (
                                 <span className="text-[9px] font-black bg-purple-50/80 text-purple-600 border border-purple-100/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {listing.sub_type_name}
                                 </span>
                              )}
                              {(listing.brand_name || listing.brand) && (
                                 <span className="text-[9px] font-black bg-emerald-50/80 text-emerald-600 border border-emerald-100/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {listing.brand_name || listing.brand}
                                 </span>
                              )}
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
               className="w-full bg-gradient-to-r from-orange-50 to-amber-50/80 border border-orange-100/80 p-5 rounded-[32px] text-slate-800 flex items-center justify-between shadow-2xl shadow-orange-950/10 group active:scale-[0.98] transition-all cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/10 relative text-orange-600">
                      <ShoppingBag size={20} />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">{cartCount}</span>
                   </div>
                   <div className="text-left">
                      <div className="text-[16px] font-black text-[#001b4e] leading-none">₹{cartTotal}</div>
                      <div className="text-[11px] text-slate-400 font-semibold">Estimated Order Value</div>
                   </div>
                </div>
                <div className="flex items-center gap-2 font-black text-[14px] text-orange-600 uppercase tracking-wider">
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
