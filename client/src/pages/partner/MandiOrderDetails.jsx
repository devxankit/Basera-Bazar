import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Package,
  User,
  Clock,
  ExternalLink,
  MapPin,
  Truck,
  ShieldCheck,
  Info,
  Loader2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MandiOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deliveryOTP, setDeliveryOTP] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      alert("Failed to load order details.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (itemId, status, method = null, otp = null) => {
    let confirmMsg = `Mark this order as ${status}?`;
    if (status === 'cancelled') {
      confirmMsg = `Are you sure you want to cancel this order? As per policy, your account will be penalized the token booking fee because the amount will be refunded to the customer.`;
    }
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdating(true);
      const res = await api.patch(`/orders/lead/${id}/${itemId}/status`, { 
        status, 
        method, 
        delivery_otp: otp 
      });
      if (res.data.success) {
        fetchOrderDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
       <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing Shipment Details...</p>
    </div>
  );

  // For this page, we assume the seller is only looking at their item in the order
  // (In a real marketplace, one order might have multiple sellers)
  // We'll find the items belonging to the current partner (handled by backend filtering usually, but we'll be safe)
  const item = order.items[0]; // Simplified for now as per user's current flow

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'contacted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'processing': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'contacted', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusStep(item?.status || 'pending');

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center pb-24">
      {/* Mobile Shell */}
      <div className="w-full max-w-[500px] bg-[#f8fafc] min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 -ml-1 text-[#001b4e] active:scale-95 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-[17px] font-black text-[#001b4e] uppercase tracking-tight leading-none">Order Details</h2>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 opacity-60">
                 ID: #{order._id.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(item?.status)}`}>
            {item?.status}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Customer Profile Card */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-[24px] font-black border-4 border-white shadow-xl mb-3">
                   {order.user_id?.name?.[0] || 'U'}
                </div>
                <h3 className="text-[20px] font-black text-[#001b4e] mb-1 uppercase tracking-tight leading-tight">{order.user_id?.name || 'Customer'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-6 opacity-60">
                   <Calendar size={12} className="text-indigo-500" /> Ordered {new Date(order.createdAt).toLocaleDateString()}
                </p>

                 <div className="grid grid-cols-2 gap-3 w-full">
                   <a href={`tel:${order.user_id?.phone}`} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all">
                      <Phone size={18} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#001b4e]">Call Customer</span>
                   </a>
                   <a href={`https://wa.me/${order.user_id?.phone}`} target="_blank" className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all">
                      <MessageSquare size={18} className="text-emerald-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#001b4e]">WhatsApp</span>
                   </a>
                </div>
             </div>
          </div>

          {/* Fulfillment Timeline */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 opacity-60">Shipment Progress</h4>
             <div className="px-2">
                <div className="flex justify-between relative">
                  <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-100 -z-0" />
                  <div 
                    className="absolute top-4 left-0 h-[2px] bg-indigo-500 -z-0 transition-all duration-700" 
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  />
                  
                  {['Received', 'Contacted', 'Processing', 'Shipped', 'Delivered'].map((label, sIdx) => {
                    const isActive = sIdx <= currentStep;
                    const isCurrent = sIdx === currentStep;
                    return (
                      <div key={label} className="flex flex-col items-center gap-3 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isCurrent ? 'bg-indigo-600 border-indigo-200 text-white scale-110 shadow-lg shadow-indigo-600/20' :
                          isActive ? 'bg-indigo-500 border-indigo-100 text-white' :
                          'bg-white border-slate-100 text-slate-300'
                        }`}>
                          {isActive ? <CheckCircle2 size={14} /> : <div className="w-1 h-1 bg-slate-200 rounded-full" />}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${
                          isActive ? 'text-indigo-600' : 'text-slate-300'
                        }`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                   <Package size={18} />
                </div>
                <h3 className="text-[15px] font-black text-[#001b4e] uppercase tracking-tight opacity-70">Manifest</h3>
             </div>
             
             <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white border border-slate-100 shadow-sm">
                   {item?.productId?.thumbnail ? (
                      <img src={item.productId.thumbnail} className="w-full h-full object-cover" alt="" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                         <Package size={24} />
                      </div>
                   )}
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                   <h4 className="text-[16px] font-black text-[#001b4e] line-clamp-1 leading-tight uppercase tracking-tight mb-2">
                     {item?.name}
                   </h4>
                   <div className="flex items-center gap-3">
                     <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                       {item?.qty} {item?.unit || 'Units'}
                     </span>
                     <span className="text-[16px] font-black text-indigo-600">
                        ₹{(item?.price * item?.qty).toLocaleString()}
                     </span>
                   </div>
                </div>
             </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-[15px] font-black text-[#001b4e] uppercase tracking-tight opacity-70">Destination</h3>
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shipping_address?.street}, ${order.shipping_address?.city}, ${order.shipping_address?.state} ${order.shipping_address?.pincode}`)}`}
                  target="_blank"
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"
                >
                  <ExternalLink size={12} /> Open Maps
                </a>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[13px] text-slate-600 leading-relaxed font-bold">
                   {order.shipping_address?.street}<br/>
                   {order.shipping_address?.city}, {order.shipping_address?.state}<br/>
                   PIN: {order.shipping_address?.pincode}
                </p>
                {order.shipping_address?.phone && (
                  <p className="mt-3 text-[11px] font-black text-indigo-500 uppercase tracking-widest">
                    Contact: {order.shipping_address.phone}
                  </p>
                )}
             </div>
          </div>
        </div>

        {/* Action Buttons Floating at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent z-50 flex justify-center">
          <div className="w-full max-w-[460px]">
            {item?.status === 'pending' && (
              <button
                onClick={() => updateStatus(item._id, 'contacted')}
                disabled={updating}
                className="w-full h-14 bg-[#001b4e] text-white rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 font-black text-[14px] uppercase tracking-widest active:scale-95 transition-all"
              >
                {updating ? <Loader2 className="animate-spin" size={20} /> : <Phone size={18} />}
                Mark as Contacted
              </button>
            )}

            {item?.status === 'contacted' && (
              <button
                onClick={() => updateStatus(item._id, 'processing')}
                disabled={updating}
                className="w-full h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 font-black text-[14px] uppercase tracking-widest active:scale-95 transition-all"
              >
                {updating ? <Loader2 className="animate-spin" size={20} /> : <Package size={18} />}
                Start Processing
              </button>
            )}

            {item?.status === 'processing' && (
              <button
                onClick={() => updateStatus(item._id, 'shipped')}
                disabled={updating}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 font-black text-[14px] uppercase tracking-widest active:scale-95 transition-all"
              >
                {updating ? <Loader2 className="animate-spin" size={20} /> : <Truck size={18} />}
                Confirm Shipment
              </button>
            )}

            {item?.status === 'shipped' && (
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="DELIVERY OTP"
                  maxLength={6}
                  value={deliveryOTP}
                  onChange={(e) => setDeliveryOTP(e.target.value)}
                  className="flex-1 h-14 bg-white border-2 border-indigo-100 rounded-2xl text-center text-[16px] font-black tracking-[4px] outline-none shadow-inner"
                />
                <button
                  onClick={() => updateStatus(item._id, 'delivered', 'cod', deliveryOTP)}
                  disabled={updating}
                  className="px-6 h-14 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 font-black text-[14px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={18} />}
                  Complete
                </button>
              </div>
            )}

            {item?.status === 'delivered' && (
              <div className="w-full h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest">
                <ShieldCheck size={20} />
                Order Fully Fulfilled
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
