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
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function MandiCheckout() {
   const navigate = useNavigate();
   const { cart, cartTotal: total, clearCart } = useCart();
   const [loading, setLoading] = useState(false);
   const [step, setStep] = useState(1); // 1: Address, 2: Review & Pay, 3: Success
   const [config, setConfig] = useState({ token_amount: 500 });
   const [orderData, setOrderData] = useState(null);
   const [deliveryOtp, setDeliveryOtp] = useState('');

   React.useEffect(() => {
      const fetchConfig = async () => {
         try {
            const res = await api.get('/admin/mandi/settings'); 
            if (res.data.success) setConfig(res.data.data);
         } catch (err) { console.error("Error fetching config", err); }
      };
      fetchConfig();
   }, []);

   const [address, setAddress] = useState({
      receiver_name: '',
      receiver_phone: '',
      street: '',
      city: '',
      state: 'Bihar',
      pincode: '',
      landmark: ''
   });

   const getUniqueSellersCount = () => {
      const sellerIds = Object.values(cart).map(c => c.item.owner?.id || c.item.partner_id || c.item.seller_id);
      return new Set(sellerIds.filter(Boolean)).size;
   };

   const tokenAmount = config.token_amount * getUniqueSellersCount();
   const remainingAmount = total - tokenAmount;

   const handleCreateOrder = async () => {
      try {
         setLoading(true);

         const orderItems = Object.values(cart).map(c => ({
            productId: c.item._id || c.item.id,
            seller_id: c.item.seller_id?._id || c.item.seller_id || c.item.partner_id || c.item.owner?.id,
            title: c.item.title,
            price: c.item.pricing?.price_per_unit || c.item.price?.value,
            qty: c.qty,
            unit: c.item.pricing?.unit || 'Unit',
            type_name: c.selectedType || c.item.type_name || null,
            sub_type_name: c.selectedSubType || c.item.sub_type_name || null,
            brand_name: c.selectedBrand || c.item.brand_name || null
         }));

         // Generate random 6-digit OTP for delivery verification
         const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
         setDeliveryOtp(generatedOtp);

         const res = await api.post('/orders/checkout', {
            items: orderItems,
            shipping_address: {
               full_name: address.receiver_name,
               phone: address.receiver_phone,
               full_address: address.street,
               city: address.city,
               state: address.state,
               pincode: address.pincode
            },
            payment_method: 'online',
            total_amount: total,
            token_amount: tokenAmount,
            remaining_amount: remainingAmount,
            delivery_otp: generatedOtp 
         });

         if (res.data.success) {
            setOrderData(res.data.data);
            clearCart();
            setStep(3);
         }
      } catch (err) {
         const errorMsg = err.response?.data?.message || "Order failed";
         const errorDetail = err.response?.data?.error_detail ? JSON.stringify(err.response.data.error_detail) : "";
         alert(`${errorMsg} ${errorDetail}`);
      } finally {
         setLoading(false);
      }
   };

   if (!Object.keys(cart).length && step !== 3) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
         <ShoppingBag size={64} className="text-slate-200 mb-4" />
         <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
         <button onClick={() => navigate('/mandi-bazar')} className="mt-4 text-indigo-600 font-bold">Go to Marketplace</button>
      </div>
   );

   return (
      <div className="min-h-screen bg-slate-50 font-Inter pb-20">
         {/* Header */}
         <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-50">
            <button 
               onClick={() => step === 3 ? navigate('/mandi-bazar') : navigate(-1)} 
               className="p-2 bg-slate-50 rounded-xl"
            >
               <ArrowLeft size={20} className="text-[#001b4e]" />
            </button>
            <h1 className="text-[17px] font-bold text-[#001b4e]">
               {step === 3 ? 'Order Confirmed' : 'Complete Your Order'}
            </h1>
         </div>

         <div className="p-6 space-y-8 text-slate-900">
            {/* Step Indicator */}
            {step < 3 && (
               <div className="flex items-center gap-3">
                  <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-[#001b4e]' : 'bg-slate-200'}`} />
                  <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-[#001b4e]' : 'bg-slate-200'}`} />
               </div>
            )}

            {step === 1 ? (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex items-center gap-3 mb-2 px-1">
                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#001b4e]">
                        <MapPin size={22} />
                     </div>
                     <h3 className="text-[18px] font-bold text-[#001b4e]">Delivery Details</h3>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-1 gap-4">
                        <input
                           type="text" placeholder="Receiver's Full Name *"
                           className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                           value={address.receiver_name}
                           onChange={(e) => setAddress({ ...address, receiver_name: e.target.value })}
                        />
                        <input
                           type="tel" placeholder="Receiver's Phone Number *"
                           className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                           value={address.receiver_phone}
                           maxLength={10}
                           onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 10) setAddress({ ...address, receiver_phone: val });
                           }}
                        />
                     </div>
                     <div className="relative">
                        <textarea
                           placeholder="Complete Street Address / Site Location *"
                           className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                           rows="3"
                           value={address.street}
                           onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        />
                     </div>
                     <input
                        type="text" placeholder="Landmark (Optional)"
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                        value={address.landmark}
                        onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                     />
                     <div className="grid grid-cols-2 gap-4">
                        <input
                           type="text" placeholder="City *"
                           className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                           value={address.city}
                           onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        />
                        <input
                           type="text" placeholder="Pincode *"
                           className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[15px] font-medium placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
                           value={address.pincode}
                           onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        />
                     </div>
                  </div>

                  <button
                     onClick={() => {
                        if (!address.receiver_name || !address.receiver_phone || !address.street || !address.city || !address.pincode) {
                           alert("Please fill all required fields marked with *");
                        } else if (address.receiver_phone.length !== 10) {
                           alert("Please enter a valid 10-digit phone number");
                        }
                        else setStep(2);
                     }}
                     className="w-full h-16 bg-[#001b4e] text-white rounded-3xl font-bold text-[16px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     Review Order <ChevronRight size={20} />
                  </button>

               </motion.div>
            ) : step === 2 ? (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  {/* Order Summary */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 space-y-6">
                     <h3 className="text-[18px] font-bold text-[#001b4e] border-b border-slate-50 pb-4">Order Summary</h3>
                     <div className="space-y-4">
                        {Object.values(cart).map((c, i) => (
                           <div key={i} className="flex justify-between items-start text-[14px]">
                              <div>
                                <div className="text-slate-800 font-bold">{c.item.title} <span className="text-slate-400 font-medium">x {c.qty}</span></div>
                                {(c.selectedType || c.selectedSubType || c.selectedBrand) && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {c.selectedType && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{c.selectedType}</span>}
                                    {c.selectedSubType && <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">{c.selectedSubType}</span>}
                                    {c.selectedBrand && <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{c.selectedBrand}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="font-bold text-[#001b4e]">₹{ (c.item.pricing?.price_per_unit || c.item.price?.value) * c.qty}</div>
                           </div>
                        ))}
                     </div>
                     <div className="pt-6 border-t border-slate-50 space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Goods Total</span>
                           <span className="text-[18px] font-bold text-slate-800">₹{total}</span>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-2xl">
                              <div className="flex-1">
                                 <span className="text-[#001b4e] font-black uppercase tracking-widest text-[10px] block">Marketplace Booking Token</span>
                                 <span className="text-[10px] text-indigo-500 font-bold italic">{getUniqueSellersCount()} Sellers × ₹{config.token_amount}</span>
                              </div>
                              <span className="text-[24px] font-black text-[#001b4e]">₹{tokenAmount}</span>
                           </div>
                           
                           <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <div className="flex-1">
                                 <span className="text-emerald-700 font-black uppercase tracking-widest text-[10px] block">Pay on Delivery (COD)</span>
                                 <span className="text-[10px] text-emerald-600 font-bold italic">Payable to sellers at site</span>
                              </div>
                              <span className="text-[24px] font-black text-emerald-700">₹{remainingAmount}</span>
                           </div>
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
                        The booking token is <strong>completely non-refundable</strong> unless the supplier cancels your order. The remaining balance (₹{remainingAmount}) will be paid directly to the supplier via <strong>Cash on Delivery (COD)</strong> once they deliver the materials.
                     </p>
                  </div>

                  <div className="space-y-3">
                     <button
                        onClick={handleCreateOrder}
                        disabled={loading}
                        className="w-full h-16 bg-[#001b4e] text-white rounded-3xl font-bold text-[16px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        {loading ? <Loader2 className="animate-spin" /> : <>Pay Token ₹{tokenAmount} & Confirm <CheckCircle2 size={20} /></>}
                     </button>
                     <button onClick={() => setStep(1)} className="w-full py-4 text-slate-400 font-bold text-[13px] uppercase tracking-widest">Edit Delivery Details</button>
                  </div>
               </motion.div>
            ) : (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-10">
                  <div className="flex flex-col items-center justify-center pt-4">
                     <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-lg shadow-emerald-100">
                        <CheckCircle2 size={40} strokeWidth={3} />
                     </div>
                     <h2 className="text-[24px] font-black text-[#001b4e] tracking-tight text-center">Order Placed Successfully!</h2>
                     <p className="text-slate-500 text-[14px] font-medium mt-2 text-center max-w-[280px]">
                        Your booking has been confirmed. Sellers will contact you shortly.
                     </p>
                  </div>

                  {/* Delivery Verification OTP */}
                  <div className="bg-[#001b4e] rounded-[32px] p-8 text-white text-center space-y-4 shadow-xl shadow-indigo-900/20">
                     <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Secure Delivery Verification OTP</span>
                     <div className="text-[48px] font-black tracking-[0.3em] font-Inter">{deliveryOtp}</div>
                     <p className="text-[12px] opacity-70 font-medium px-4">
                        Share this OTP with the delivery person <span className="underline">only after</span> you have successfully received all materials.
                     </p>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
                     <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#001b4e]">
                           <ShoppingBag size={20} />
                        </div>
                        <h3 className="text-[16px] font-bold text-[#001b4e]">Booking Summary</h3>
                     </div>

                     <div className="space-y-4">
                        {orderData?.order?.items?.map((item, i) => (
                           <div key={i} className="flex justify-between items-center text-[14px]">
                              <div className="text-slate-800 font-bold">{item.name} <span className="text-slate-400 font-medium">x {item.qty}</span></div>
                              <div className="font-bold text-[#001b4e]">₹{item.price * item.qty}</div>
                           </div>
                        ))}
                     </div>

                     <div className="pt-6 border-t border-slate-50 space-y-3">
                        <div className="flex justify-between items-center text-[13px]">
                           <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Goods Value</span>
                           <span className="font-bold text-slate-800">₹{orderData?.order?.total_amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                           <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Token Amount Paid</span>
                           <span className="font-bold text-emerald-600">₹{orderData?.order?.token_payment?.amount}</span>
                        </div>
                        <div className="flex justify-between items-center p-5 bg-emerald-50 rounded-2xl mt-2">
                           <span className="text-emerald-700 font-black uppercase tracking-widest text-[11px]">Pay on Delivery (COD)</span>
                           <span className="text-[22px] font-black text-emerald-700">₹{orderData?.order?.total_amount - orderData?.order?.token_payment?.amount}</span>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={() => navigate('/mandi-bazar')}
                     className="w-full h-16 bg-[#001b4e] text-white rounded-3xl font-bold text-[16px] shadow-lg shadow-indigo-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     Return to Marketplace <ArrowLeft size={20} />
                  </button>
               </motion.div>
            )}
         </div>
      </div>
   );
}
