import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, ChevronRight, PackageOpen, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, addToCart, removeFromCart, deleteFromCart, cartTotal, cartCount } = useCart();

  const cartItems = Object.values(cart);

  const { data: configRaw } = useQuery({
    queryKey: ['mandiSettings'],
    queryFn: () => api.get('/admin/mandi/settings').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const config = configRaw?.success ? configRaw.data : { token_amount: 500 };

  const getUniqueSellersCount = () => {
    const sellerIds = cartItems.map(c => c.item.owner?.id || c.item.partner_id || c.item.seller_id);
    return new Set(sellerIds.filter(Boolean)).size || 1;
  };

  const getCalculatedTokenAmount = () => {
    if (!config.categories) return config.token_amount * getUniqueSellersCount();

    let totalToken = 0;
    cartItems.forEach(c => {
       const itemPrice = c.item.pricing?.price_per_unit || c.item.price?.value || 0;
       const itemTotal = itemPrice * c.qty;
       
       // Find category percentage
       const categoryId = c.item.category_id?._id || c.item.category_id;
       const catConfig = config.categories.find(cat => cat.id === categoryId);
       const percentage = catConfig ? Number(catConfig.percentage) : (config.commission_rate || 0);
       
       totalToken += (itemTotal * (percentage / 100));
    });

    // Business logic: Ensure at least the fallback token amount if calculation is 0
    if (totalToken <= 0) return config.token_amount * getUniqueSellersCount();
    return Math.round(totalToken);
  };

  const tokenAmount = getCalculatedTokenAmount();

  const [checkingPrice, setCheckingPrice] = useState(false);
  const [priceMismatch, setPriceMismatch] = useState(false);
  const [latestTokenAmount, setLatestTokenAmount] = useState(0);

  const handleCheckout = async () => {
    if (checkingPrice) return;
    setCheckingPrice(true);
    try {
      const res = await api.get('/admin/mandi/settings');
      const latestConfig = res.data?.success ? res.data.data : null;
      
      if (latestConfig) {
        let calculatedLatestToken = 0;
        const sellersCount = getUniqueSellersCount();

        if (!latestConfig.categories) {
          calculatedLatestToken = latestConfig.token_amount * sellersCount;
        } else {
          cartItems.forEach(c => {
            const itemPrice = c.item.pricing?.price_per_unit || c.item.price?.value || 0;
            const itemTotal = itemPrice * c.qty;
            
            const categoryId = c.item.category_id?._id || c.item.category_id;
            const catConfig = latestConfig.categories.find(cat => cat.id === categoryId);
            const percentage = catConfig ? Number(catConfig.percentage) : (latestConfig.commission_rate || 0);
            
            calculatedLatestToken += (itemTotal * (percentage / 100));
          });

          if (calculatedLatestToken <= 0) {
            calculatedLatestToken = latestConfig.token_amount * sellersCount;
          } else {
            calculatedLatestToken = Math.round(calculatedLatestToken);
          }
        }

        if (calculatedLatestToken !== tokenAmount) {
          setLatestTokenAmount(calculatedLatestToken);
          setPriceMismatch(true);
          return;
        }
      }
      
      navigate('/mandi-bazar/checkout');
    } catch (err) {
      console.error("Error checking latest settings:", err);
      navigate('/mandi-bazar/checkout');
    } finally {
      setCheckingPrice(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-5 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-[#0c2461]" />
          </button>
          <h1 className="text-[18px] font-black text-[#0c2461] tracking-tight">Your Cart</h1>
        </div>
        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
          <ShoppingCart size={16} className="text-emerald-600" />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <PackageOpen size={48} className="text-slate-300" />
            </div>
            <h2 className="text-[20px] font-black text-slate-800 mb-2">Cart is empty</h2>
            <p className="text-slate-500 text-[13px] font-medium max-w-[240px]">Looks like you haven't added anything to your cart yet.</p>
            <button 
              onClick={() => navigate('/mandi-bazar')}
              className="mt-8 bg-[#0c2461] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#0c2461]/20 active:scale-95 transition-transform"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-[15px] font-bold text-slate-800">Cart Items ({cartCount})</h2>
            </div>
            
            <AnimatePresence>
              {cartItems.map((c) => {
                const cartKey = c.item._cartKey || c.item._id;
                return (
                <motion.div 
                  key={cartKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                      <img 
                        src={c.item.thumbnail || c.item.image || (c.item.images && c.item.images[0]) || '/default-product-image.png'} 
                        alt={c.item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-image.png'; }}
                      />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-800 leading-tight line-clamp-2">{c.item.title}</h3>
                        {/* Attribute badges */}
                        {(c.selectedType || c.selectedSubType || c.selectedBrand) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.selectedType && (
                              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">{c.selectedType}</span>
                            )}
                            {c.selectedSubType && (
                              <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">{c.selectedSubType}</span>
                            )}
                            {c.selectedBrand && (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wide">{c.selectedBrand}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteFromCart(cartKey)}
                        className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 font-semibold mb-1">
                          {c.item.pricing?.unit || c.item.unit_of_measure?.name || 'Unit'}
                        </span>
                        <span className="text-[16px] font-black text-[#0c2461]">₹{c.item.pricing?.price_per_unit || c.item.price?.value}</span>
                      </div>
                      
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button 
                          onClick={() => removeFromCart(cartKey)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 active:bg-slate-200 rounded-md transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-slate-800">{c.qty}</span>
                        <button 
                          onClick={() => addToCart(c.item)}
                          className="w-7 h-7 flex items-center justify-center text-[#0c2461] bg-indigo-50 active:bg-indigo-100 rounded-md transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-6 space-y-4">
              <h3 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3">Bill Details</h3>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500 font-medium">Item Total</span>
                  <span className="font-bold text-slate-700">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">Booking Token</span>
                    <span className="text-[10px] text-indigo-500 font-bold italic">Pay now to confirm</span>
                  </div>
                  <span className="font-bold text-indigo-600">₹{tokenAmount}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">Remaining (COD)</span>
                    <span className="text-[10px] text-emerald-600 font-bold italic">Pay on delivery</span>
                  </div>
                  <span className="font-bold text-emerald-600">₹{cartTotal - tokenAmount}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-2 flex justify-between items-center">
                <span className="text-[14px] font-black text-[#0c2461]">To Pay Now</span>
                <span className="text-[24px] font-black text-[#0c2461]">₹{tokenAmount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 p-4 pb-safe flex items-center justify-between z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">To Pay Now</span>
            <span className="text-[22px] font-black text-[#0c2461] leading-none mt-1">₹{tokenAmount}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={checkingPrice}
            className="h-[52px] bg-[#0c2461] hover:bg-[#1e293b] text-white px-8 rounded-full font-bold text-[15px] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {checkingPrice ? <Loader2 size={18} className="animate-spin text-white" /> : <>Checkout <ChevronRight size={18} /></>}
          </button>
        </div>
      )}

      {/* Price Mismatch Modal */}
      <AnimatePresence>
        {priceMismatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['mandiSettings'] });
                setPriceMismatch(false);
              }}
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-6 max-w-sm w-full relative z-10 shadow-2xl text-center space-y-5 border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                 </svg>
              </div>
              <div className="space-y-2">
                 <h3 className="text-[18px] font-black text-slate-800 leading-tight">Payable Amount Changed</h3>
                 <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                    The booking token has changed from <strong className="text-slate-800">₹{tokenAmount}</strong> to <strong className="text-indigo-600">₹{latestTokenAmount}</strong> due to updated economics configuration.
                 </p>
              </div>
              <button
                 onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['mandiSettings'] });
                    setPriceMismatch(false);
                 }}
                 className="w-full py-4 bg-[#0c2461] hover:bg-[#1e293b] text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
              >
                 Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
