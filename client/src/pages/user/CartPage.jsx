import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, ChevronRight, PackageOpen } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, deleteFromCart, cartTotal, cartCount } = useCart();

  const cartItems = Object.values(cart);

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
              {cartItems.map((c) => (
                <motion.div 
                  key={c.item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                     <img 
                       src={c.item.media?.[0] || '/default-product-image.png'} 
                       alt={c.item.title} 
                       className="w-full h-full object-cover"
                       onError={(e) => { e.target.onerror = null; e.target.src = '/default-product-image.png'; }}
                     />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[14px] font-bold text-slate-800 leading-tight line-clamp-2">{c.item.title}</h3>
                      <button 
                        onClick={() => deleteFromCart(c.item._id)}
                        className="p-1.5 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 font-semibold mb-1">{c.item.unit_of_measure?.name || 'Unit'}</span>
                        <span className="text-[16px] font-black text-[#0c2461]">₹{c.item.pricing?.price_per_unit}</span>
                      </div>
                      
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <button 
                          onClick={() => removeFromCart(c.item._id)}
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
              ))}
            </AnimatePresence>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-6 space-y-4">
              <h3 className="text-[15px] font-bold text-slate-800 border-b border-slate-100 pb-3">Bill Details</h3>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500 font-medium">Item Total</span>
                  <span className="font-bold text-slate-700">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500 font-medium">Delivery Charges</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">As applicable</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-2 flex justify-between items-center">
                <span className="text-[14px] font-black text-[#0c2461]">To Pay</span>
                <span className="text-[20px] font-black text-[#0c2461]">₹{cartTotal}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 p-4 pb-safe flex items-center justify-between z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
            <span className="text-[22px] font-black text-[#0c2461] leading-none mt-1">₹{cartTotal}</span>
          </div>
          <button 
            onClick={() => navigate('/mandi-checkout')}
            className="h-[52px] bg-[#0c2461] hover:bg-[#1e293b] text-white px-8 rounded-full font-bold text-[15px] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Checkout <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
