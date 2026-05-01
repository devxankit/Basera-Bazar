import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Phone, MessageSquare, 
  Calendar, CheckCircle2, AlertTriangle,
  Package, ExternalLink, MapPin, 
  Truck, ShieldCheck, Loader2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function MandiOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deliveryOTP, setDeliveryOTP] = useState('');
  const [modal, setModal] = useState({ show: false, type: 'confirm', title: '', message: '', onConfirm: null });
  const [sendingOTP, setSendingOTP] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const sendOTP = async (itemId) => {
    try {
      setSendingOTP(true);
      const res = await api.post(`/orders/lead/${id}/${itemId}/send-otp`);
      if (res.data.success) {
        setModal({
          show: true,
          type: 'success',
          title: 'OTP Transmitted',
          message: 'The delivery verification code has been dispatched to the customer via SMS.'
        });
      }
    } catch (err) {
      setModal({
        show: true,
        type: 'error',
        title: 'Transmission Failed',
        message: err.response?.data?.message || "Communication failure. Check network and try again."
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (itemId, status, method, otp) => {
    try {
      setUpdating(true);
      const res = await api.patch(`/orders/lead/${id}/${itemId}/status`, { 
        status, 
        method, 
        delivery_otp: otp 
      });
      if (res.data.success) {
        setModal({ show: false });
        fetchOrderDetails();
      }
    } catch (err) {
      setModal({
        show: true,
        type: 'error',
        title: 'Sync Failed',
        message: err.response?.data?.message || "Database update failed. Please retry."
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = (itemId, status, method = null, otp = null) => {
    let title = `Update Status?`;
    let message = `Are you sure you want to mark this order as ${status}?`;
    let confirmText = "Confirm Action";
    
    if (status === 'accepted') {
      title = "Accept Mandi Order?";
      message = "This confirms to the client that you are preparing the items for fulfillment.";
    } else if (status === 'shipped') {
      title = "Confirm Shipment?";
      message = "Marking this as shipped indicates the items are en route with logistics.";
    } else if (status === 'delivered') {
      title = "Finalize Delivery?";
      message = "Verification OTP is required to complete this high-value transaction.";
    } else if (status === 'cancelled') {
      title = "Cancel Order?";
      message = "Operational impact: This will be logged as a seller-initiated cancellation.";
      confirmText = "Yes, Cancel Order";
    }

    setModal({
      show: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      onConfirm: () => handleUpdate(itemId, status, method, otp)
    });
  };

  const sellerItem = order?.items?.find(i => {
    const sellerId = i.seller_id?._id || i.seller_id;
    const currentUserId = user?._id || user?.id;
    return sellerId?.toString() === currentUserId?.toString();
  }) || order?.items?.[0];

  const item = sellerItem;

  if (loading || !order) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
       <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
       <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Syncing Data...</p>
    </div>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500 text-white border-transparent shadow-amber-500/10';
      case 'accepted': 
      case 'contacted': return 'bg-blue-600 text-white border-transparent shadow-blue-500/10';
      case 'processing': return 'bg-purple-600 text-white border-transparent shadow-purple-500/10';
      case 'shipped': return 'bg-indigo-600 text-white border-transparent shadow-indigo-500/10';
      case 'delivered': return 'bg-emerald-600 text-white border-transparent shadow-emerald-500/10';
      case 'cancelled': return 'bg-rose-600 text-white border-transparent shadow-rose-500/10';
      default: return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-40">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest leading-none">Order Management</h2>
            <div className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5 opacity-60">
               ID: {order._id.slice(-10).toUpperCase()}
            </div>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(item?.status)}`}>
          {item?.status === 'contacted' ? 'accepted' : (item?.status || 'UNKNOWN')}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Customer Intelligence Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Package size={64} />
           </div>
           
           <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-[#001b4e] text-white rounded-xl flex items-center justify-center text-[22px] font-black shadow-xl shadow-blue-900/20 border border-white/10">
                    {order.user_id?.name?.[0] || 'U'}
                 </div>
                 <div>
                    <h3 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight leading-tight">{order.user_id?.name || 'Customer'}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                       <div className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-black uppercase tracking-widest border border-slate-100">Marketplace Order</div>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 opacity-60">Created On</div>
                 <div className="text-[12px] font-black text-[#001b4e] uppercase tracking-tighter">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 relative z-10">
              <ContactAction icon={<Phone size={14} />} label="Call Now" href={`tel:${order.user_id?.phone}`} color="bg-blue-50 text-blue-600 border-blue-100/50" />
              <ContactAction icon={<MessageSquare size={14} />} label="WhatsApp" href={`https://wa.me/${order.user_id?.phone}`} color="bg-emerald-50 text-emerald-600 border-emerald-100/50" />
           </div>
        </div>

        {/* Logistics Context */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <MapPin size={16} className="text-rose-500" />
                 <h3 className="text-[10px] font-black text-[#001b4e] uppercase tracking-widest">Delivery Point</h3>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.shipping_address?.street}, ${order.shipping_address?.city}`)}`}
                target="_blank"
                className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-widest flex items-center gap-1"
              >
                <ExternalLink size={10} /> GPS View
              </a>
           </div>
           
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="space-y-3">
                 <div className="flex items-start gap-3">
                    <div className="text-[9px] font-black text-slate-300 uppercase w-14 pt-0.5 opacity-60">Street</div>
                    <span className="text-[13px] font-bold text-slate-600 uppercase tracking-tight">{order.shipping_address?.street}</span>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="text-[9px] font-black text-slate-300 uppercase w-14 pt-0.5 opacity-60">District</div>
                    <span className="text-[13px] font-bold text-slate-600 uppercase tracking-tight">{order.shipping_address?.city}, {order.shipping_address?.state}</span>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="text-[9px] font-black text-slate-300 uppercase w-14 pt-0.5 opacity-60">Pincode</div>
                    <span className="text-[13px] font-black text-blue-600 tracking-widest">{order.shipping_address?.pincode}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Financial Manifest */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="bg-slate-50/50 px-4 py-2.5 border-b border-slate-50 flex items-center gap-2">
              <Package size={14} className="text-blue-500" />
              <h3 className="text-[10px] font-black text-[#001b4e] uppercase tracking-widest">Billing Manifest</h3>
           </div>
           
           <div className="divide-y divide-slate-50">
              {order.items.map((orderItem, idx) => (
                <div key={idx} className="p-4 flex gap-4 items-center bg-white">
                   <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                      <img src={orderItem.productId?.thumbnail || orderItem.thumbnail} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between">
                         <h4 className="text-[14px] font-black text-[#001b4e] uppercase tracking-tight truncate pr-2 leading-tight">{orderItem.name}</h4>
                         <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest shrink-0 ${getStatusStyle(orderItem.status)}`}>
                            {orderItem.status}
                         </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <div className="text-[11px] font-black text-slate-400 uppercase tracking-tight">
                            {orderItem.qty} {orderItem.unit} <span className="text-slate-200 mx-1">×</span> ₹{orderItem.price}
                         </div>
                         <div className="text-[15px] font-black text-blue-600 tracking-tighter">₹{(orderItem.price * orderItem.qty).toLocaleString()}</div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="bg-[#001b4e] px-5 py-4 flex items-center justify-between shadow-inner">
              <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">Transaction Total</span>
              <span className="text-[20px] font-black text-white tracking-tighter">₹{order.total_amount?.toLocaleString()}</span>
           </div>
        </div>
      </div>

      {/* Persistent Logic Control */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-50 pointer-events-none">
          <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_-8px_32px_rgba(0,27,78,0.1)] rounded-[24px] p-4 flex flex-col gap-4 pointer-events-auto">
              {item?.status === 'pending' && (
                <button
                  onClick={() => updateStatus(item._id, 'accepted')}
                  disabled={updating}
                  className="w-full h-12 bg-[#001b4e] text-white rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={18} />}
                  Accept Fulfillment
                </button>
              )}

              {(item?.status === 'accepted' || item?.status === 'contacted') && (
                <button
                  onClick={() => updateStatus(item._id, 'processing')}
                  disabled={updating}
                  className="w-full h-12 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <Package size={18} />}
                  Prepare Package
                </button>
              )}

              {item?.status === 'processing' && (
                <button
                  onClick={() => updateStatus(item._id, 'shipped')}
                  disabled={updating}
                  className="w-full h-12 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <Truck size={18} />}
                  Dispatch Shipment
                </button>
              )}

              {item?.status === 'shipped' && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => sendOTP(item._id)}
                      disabled={sendingOTP || updating}
                      className="flex-1 h-10 border border-blue-100 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                    >
                      {sendingOTP ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                      Verify
                    </button>
                    <div className="flex-[2] text-[9px] font-black text-slate-300 uppercase tracking-widest px-2 text-center opacity-60">
                      Deliver via OTP Auth
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="AUTH CODE"
                      maxLength={6}
                      value={deliveryOTP}
                      onChange={(e) => setDeliveryOTP(e.target.value)}
                      className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center text-[15px] font-black tracking-[0.4em] outline-none focus:border-emerald-500/30 transition-all placeholder:text-[10px] placeholder:tracking-widest"
                    />
                    <button
                      onClick={() => updateStatus(item._id, 'delivered', 'cod', deliveryOTP)}
                      disabled={updating}
                      className="px-6 h-12 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                      {updating ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={18} />}
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {item?.status === 'delivered' && (
                <div className="w-full h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-inner">
                  <ShieldCheck size={20} />
                  Fulfillment Securely Verified
                </div>
              )}
          </div>
      </div>

      {/* Global State Modals */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal({ ...modal, show: false })} className="absolute inset-0 bg-[#001b4e]/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="relative w-full max-w-[320px] bg-white rounded-2xl p-8 shadow-2xl text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm ${
                  modal.type === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 
                  modal.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {modal.type === 'error' ? <AlertTriangle size={32} /> : 
                   modal.type === 'success' ? <ShieldCheck size={32} /> :
                   <CheckCircle2 size={32} />}
                </div>
                <h3 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight mb-2 leading-tight">
                  {modal.title}
                </h3>
                <p className="text-[13px] font-bold text-slate-400 leading-relaxed mb-8 uppercase tracking-tight opacity-60">
                  {modal.message}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={modal.onConfirm || (() => setModal({ ...modal, show: false }))}
                    disabled={updating}
                    className={`h-12 w-full rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center ${
                      modal.type === 'error' ? 'bg-rose-500 text-white shadow-rose-200' :
                      modal.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-200' :
                      'bg-[#001b4e] text-white shadow-blue-200'
                    }`}
                  >
                    {updating ? <Loader2 className="animate-spin" /> : (modal.confirmText || 'Close Overlay')}
                  </button>
                  {modal.type === 'confirm' && (
                    <button onClick={() => setModal({ ...modal, show: false })} disabled={updating} className="h-12 w-full text-slate-300 font-black text-[11px] uppercase tracking-widest active:bg-slate-50 rounded-xl transition-all">Cancel Request</button>
                  )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactAction({ icon, label, href, color }) {
  return (
    <a href={href} className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-sm ${color}`}>
      {icon} {label}
    </a>
  );
}
