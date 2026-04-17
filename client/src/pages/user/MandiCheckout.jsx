import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2,
  ChevronRight,
  Navigation,
  Building2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function MandiCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, total } = location.state || { cart: {}, total: 0 };
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Address, 2: Review & Pay
  const [config, setConfig] = useState({ token_amount: 500 });

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/admin/mandi/settings'); // Assuming accessible or add public route
        if (res.data.success) setConfig(res.data.data);
      } catch (err) { console.error("Error fetching config", err); }
    };
    fetchConfig();
  }, []);
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      
      const orderItems = Object.values(cart).map(c => ({
        productId: c.item._id,
        seller_id: c.item.seller_id._id,
        title: c.item.title,
        price: c.item.pricing.price_per_unit,
        quantity: c.qty
      }));

      const res = await api.post('/orders/checkout', {
        items: orderItems,
        shipping_address: address,
        payment_method: 'online'
      });

      if (res.data.success) {
         // Razorpay intent would be res.data.data.razorpay_order_id
         alert(`Booking Success! You paid ₹${res.data.data.payment_amount} as a non-refundable token. A supplier will contact you shortly to coordinate delivery.`);
         navigate('/profile?tab=orders');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (!Object.keys(cart).length) return <div className="p-10 text-center">Cart is empty</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-Inter pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-slate-50 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-xl">
          <ArrowLeft size={20} className="text-[#001b4e]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#001b4e]">Complete Your Order</h1>
      </div>

      <div className="p-6 space-y-8 text-slate-900">
         {/* Simple Step Indicator */}
         <div className="flex items-center gap-3">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-[#001b4e]' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-[#001b4e]' : 'bg-slate-200'}`} />
         </div>

         {step === 1 ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
               <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#001b4e]">
                     <MapPin size={22} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#001b4e]">Delivery Site Address</h3>
               </div>

               <div className="space-y-4">
                  <div className="relative">
                     <textarea 
                        placeholder="Street Address / Site Location *"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                        rows="3"
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <input 
                        type="text" placeholder="City *"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                     />
                     <input 
                        type="text" placeholder="Pincode *"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                        value={address.pincode}
                        onChange={(e) => setAddress({...address, pincode: e.target.value})}
                     />
                  </div>
                  <input 
                     type="text" placeholder="State *"
                     className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                     value={address.state}
                     onChange={(e) => setAddress({...address, state: e.target.value})}
                  />
               </div>

               <button 
                  onClick={() => {
                     if (!address.street || !address.city || !address.pincode) alert("Please fill required fields");
                     else setStep(2);
                  }}
                  className="w-full h-16 bg-[#001b4e] text-white rounded-3xl font-bold text-[16px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                  Review Order <ChevronRight size={20} />
               </button>
            </motion.div>
         ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
               {/* Order Summary */}
               <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 space-y-6">
                  <h3 className="text-[18px] font-bold text-[#001b4e] border-b border-slate-50 pb-4">Order Summary</h3>
                  <div className="space-y-4">
                     {Object.values(cart).map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-[14px]">
                           <div className="text-slate-800 font-bold">{c.item.title} <span className="text-slate-400 font-medium">x {c.qty}</span></div>
                           <div className="font-bold text-[#001b4e]">₹{c.item.pricing.price_per_unit * c.qty}</div>
                        </div>
                     ))}
                  </div>
                  <div className="pt-6 border-t border-slate-50 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Goods Total (Pay to Sellers via COD)</span>
                        <span className="text-[18px] font-bold text-slate-500">₹{total}</span>
                     </div>
                     <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl">
                        <div>
                           <span className="text-[#001b4e] font-black uppercase tracking-widest text-[10px] block">Marketplace Booking Token</span>
                           <span className="text-[10px] text-indigo-500 font-bold italic">{new Set(Object.values(cart).map(c => c.item.seller_id._id)).size} Sellers × ₹{config.token_amount}</span>
                        </div>
                        <span className="text-[24px] font-black text-[#001b4e]">₹{config.token_amount * new Set(Object.values(cart).map(c => c.item.seller_id._id)).size}</span>
                     </div>
                  </div>
               </div>

               {/* Trust Badges */}
               <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-4">
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="text-amber-600" size={20} />
                     <span className="text-[13px] font-bold text-amber-900 uppercase tracking-wide">Refund Policy</span>
                  </div>
                  <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                     The booking token is <strong>completely non-refundable</strong> unless the supplier cancels your order. The remaining balance (Goods Total) will be paid directly to the supplier via <strong>Cash on Delivery (COD)</strong> once they deliver the materials.
                  </p>
               </div>

               <div className="space-y-3">
                   <button 
                      onClick={handleCreateOrder}
                      disabled={loading}
                      className="w-full h-16 bg-[#001b4e] text-white rounded-3xl font-bold text-[16px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <>Pay Token & Confirm Booking <CheckCircle2 size={20} /></>}
                   </button>
                  <button onClick={() => setStep(1)} className="w-full py-4 text-slate-400 font-bold text-[13px] uppercase tracking-widest">Edit Delivery Details</button>
               </div>
            </motion.div>
         )}
      </div>
    </div>
  );
}
