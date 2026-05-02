import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  ArrowLeft, ShoppingBag, Clock, CheckCircle2, 
  Package, Truck, XCircle, Download, ChevronRight,
  ShieldCheck, MapPin, Receipt, Search, Filter, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Skeleton from '../../components/common/Skeleton';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';
import RatingModal from '../../components/user/RatingModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MyOrdersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ratingModal, setRatingModal] = useState({ isOpen: false, order: null, initialData: null });
  const [orderReviews, setOrderReviews] = useState({});

  useEffect(() => {
    if (selectedOrder && !orderReviews[selectedOrder]) {
      const fetchReview = async () => {
        try {
          const res = await api.get(`/orders/${selectedOrder}/review`);
          if (res.data.success && res.data.data.length > 0) {
            const userReview = res.data.data.find(r => r.user_id === user?._id || r.user_id?._id === user?._id);
            if (userReview) {
              setOrderReviews(prev => ({ ...prev, [selectedOrder]: userReview }));
            }
          }
        } catch (err) {
          console.error("Error fetching review for order:", err);
        }
      };
      fetchReview();
    }
  }, [selectedOrder, user?._id, orderReviews]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const handleReviewSubmit = async (reviewData) => {
    try {
      const res = await api.post('/orders/review', reviewData);
      // Refresh orders to update review status
      const ordersRes = await api.get('/orders/my-orders');
      setOrders(ordersRes.data.data || []);
      
      // Update local review state
      if (res.data.success) {
        setOrderReviews(prev => ({ ...prev, [reviewData.order_id]: res.data.data }));
      }
      
      setRatingModal({ isOpen: false, order: null, initialData: null });
    } catch (err) {
      console.error("Review error:", err);
      alert("Failed to save review");
    }
  };

  const handleOpenRating = async (order) => {
    try {
      // Fetch all reviews for this order
      const res = await api.get(`/orders/${order._id}/review`);
      let existingReview = null;
      if (res.data.success && res.data.data.length > 0) {
        // Find the review by current user for the first seller in the order (assuming single seller for now or handling accordingly)
        const sellerId = order.items[0]?.seller_id;
        existingReview = res.data.data.find(r => r.user_id === user?._id || r.user_id?._id === user?._id);
      }
      setRatingModal({ isOpen: true, order, initialData: existingReview });
    } catch (err) {
      console.error("Error opening rating modal:", err);
      setRatingModal({ isOpen: true, order, initialData: null });
    }
  };

  const filters = [
    { id: 'all', label: 'All', icon: ShoppingBag },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    // Check if ANY item in the order matches the status filter
    return order.items.some(item => item.status === activeFilter);
  });

  const handleDownloadInvoice = async (order) => {
    try {
      const invoiceId = `BSR-INV-${new Date().getFullYear()}-${order._id.slice(-6)}`;
      const invoiceContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #001b4e; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #f8fafc; padding-bottom: 20px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 900; color: #001b4e; margin: 0;">Basera<span style="color: #fa8639;">Bazar</span></h1>
              <p style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Marketplace Invoice</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; font-weight: 800; color: #001b4e; margin: 0;">${invoiceId}</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
              <h3 style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">Billed To</h3>
              <p style="font-size: 15px; font-weight: 700; color: #001b4e; margin: 0;">${user.name}</p>
              <p style="font-size: 13px; color: #64748b; margin: 4px 0;">${user.phone}</p>
            </div>
            <div>
              <h3 style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">Delivery Site</h3>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">${order.shipping_address?.full_address}, ${order.shipping_address?.city},<br>${order.shipping_address?.state} - ${order.shipping_address?.pincode}</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-radius: 12px 0 0 12px;">Material Description</th>
                <th style="text-align: center; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding: 12px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; border-radius: 0 12px 12px 0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 700; color: #001b4e; margin: 0;">${item.name}</p>
                  </td>
                  <td style="padding: 16px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 600; color: #64748b; margin: 0;">${item.qty}</p>
                  </td>
                  <td style="padding: 16px; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    <p style="font-size: 14px; font-weight: 700; color: #001b4e; margin: 0;">₹${item.price * item.qty}</p>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="width: 280px; margin-left: auto;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b;">Subtotal</span>
              <span style="font-size: 13px; font-weight: 700; color: #001b4e;">₹${order.total_amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #001b4e;">
              <span style="font-size: 14px; font-weight: 900; color: #001b4e; text-transform: uppercase;">Total Paid (Token)</span>
              <span style="font-size: 18px; font-weight: 900; color: #001b4e;">₹${order.token_payment?.amount}</span>
            </div>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `${invoiceId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(invoiceContent).set(opt).save();
    } catch (err) {
      console.error("Invoice Error:", err);
      alert("Failed to generate invoice");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'processing': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24 rounded-xl shrink-0" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-Inter pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-slate-50 rounded-xl text-[#001b4e] active:scale-95 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[18px] font-black text-[#001b4e]">My Orders</h1>
        </div>
        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
          <ShoppingBag size={20} />
        </div>
      </div>

      {/* Minimal Filter Section */}
      <div className="px-6 py-4 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Showing</span>
            <span className="text-[13px] font-bold text-[#001b4e] capitalize">{filters.find(f => f.id === activeFilter)?.label} Orders</span>
         </div>
         <div className="relative">
            <button 
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                 "flex items-center gap-2 px-5 py-3 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all border shadow-sm",
                 activeFilter !== 'all' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-[#001b4e] border-slate-100"
               )}
            >
               <Filter size={16} strokeWidth={3} />
               Filter
            </button>

            <AnimatePresence>
               {showFilters && (
                  <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl shadow-indigo-900/10 border border-slate-100 p-2 z-[60]"
                  >
                     {filters.map(filter => (
                        <button
                           key={filter.id}
                           onClick={() => {
                              setActiveFilter(filter.id);
                              setShowFilters(false);
                           }}
                           className={cn(
                              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all",
                              activeFilter === filter.id ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                           )}
                        >
                           <filter.icon size={18} />
                           {filter.label}
                        </button>
                     ))}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Orders List */}
      <div className="px-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div 
              layout
              key={order._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6 overflow-hidden relative"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Order ID</span>
                    <span className="text-[11px] font-bold text-slate-500">#{order.order_id || order._id.slice(-8)}</span>
                  </div>
                  <div className="text-[14px] font-black text-[#001b4e]">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadInvoice(order)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Items Summary */}
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-[20px] overflow-hidden shrink-0 border border-slate-100 p-1">
                       <img src={item.productId?.thumbnail || '/placeholder-img.png'} className="w-full h-full object-cover rounded-[15px]" alt="" />
                    </div>
                    <div className="flex-grow min-w-0">
                       <h5 className="text-[15px] font-bold text-[#001b4e] line-clamp-1">{item.name}</h5>
                       <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            getStatusColor(item.status)
                          )}>{item.status}</span>
                          <span className="text-[11px] font-bold text-slate-400">{item.qty} {item.unit || 'units'}</span>
                       </div>
                    </div>
                    <div className="text-[15px] font-black text-[#001b4e]">₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={14} />
                      <span className="text-[12px] font-bold truncate max-w-[180px]">{order.shipping_address?.city}, {order.shipping_address?.state}</span>
                   </div>
                   <button 
                    onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                    className="flex items-center gap-1.5 text-[#fa8639] text-[12px] font-black uppercase tracking-wider"
                   >
                     {selectedOrder === order._id ? 'Hide Details' : 'View Details'}
                     <ChevronRight size={16} className={cn("transition-transform", selectedOrder === order._id && "rotate-90")} />
                   </button>
                </div>

                <AnimatePresence>
                  {selectedOrder === order._id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-4 pt-2"
                    >
                      {/* OTP Section */}
                      {order.items.some(i => i.status !== 'delivered') && (
                        <div className="bg-[#001b4e] rounded-3xl p-6 text-white text-center space-y-3 shadow-lg shadow-indigo-900/10">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Delivery Verification OTP</span>
                          <div className="text-[32px] font-black tracking-[0.3em]">{order.items[0]?.delivery_otp}</div>
                          <p className="text-[10px] opacity-70 font-medium">Share this with the delivery person only after inspecting the materials.</p>
                        </div>
                      )}

                      {/* Rating Section */}
                      <div className="space-y-3">
                        {order.items.some(i => i.isReviewed) ? (
                          <div className="bg-emerald-50 rounded-[28px] p-4 flex items-center justify-between border border-emerald-100/50">
                             <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                   <CheckCircle2 size={14} className="text-emerald-500" />
                                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Rating Submitted</span>
                                </div>
                                {orderReviews[order._id] && (
                                  <div className="flex gap-0.5">
                                     {[1, 2, 3, 4, 5].map(star => (
                                       <Star 
                                         key={star} 
                                         size={14} 
                                         className={star <= orderReviews[order._id].behavior_rating ? "text-orange-500 fill-orange-500" : "text-emerald-200"} 
                                       />
                                     ))}
                                  </div>
                                )}
                             </div>
                             <button 
                               onClick={() => handleOpenRating(order)}
                               className="px-5 py-2.5 bg-white border border-emerald-500 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                             >
                               Edit
                             </button>
                          </div>
                        ) : (
                          order.items.some(i => i.status === 'delivered') && (
                            <button 
                              onClick={() => handleOpenRating(order)}
                              className="w-full bg-emerald-500 text-white py-4 rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Star size={18} fill="currentColor" />
                              Rate Experience
                            </button>
                          )
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-5 space-y-3">
                         <div className="flex justify-between text-[13px]">
                            <span className="font-bold text-slate-400">Total Value:</span>
                            <span className="font-black text-[#001b4e]">₹{order.total_amount}</span>
                         </div>
                         <div className="flex justify-between text-[13px]">
                            <span className="font-bold text-slate-400">Booking Token:</span>
                            <span className="font-black text-emerald-600">₹{order.token_payment?.amount}</span>
                         </div>
                         <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                            <span className="text-[11px] font-black text-[#001b4e] uppercase tracking-wider">Remaining COD:</span>
                            <span className="text-[20px] font-black text-[#001b4e]">₹{order.total_amount - order.token_payment?.amount}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                         <ShieldCheck className="text-amber-600 shrink-0" size={18} />
                         <p className="text-[11px] text-amber-700 font-bold leading-tight">
                            COD amount must be paid directly to the supplier upon successful delivery at your site.
                         </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="py-24 text-center space-y-5">
            <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center mx-auto text-slate-100">
              <ShoppingBag size={48} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-black text-[#001b4e]">No orders found</h3>
              <p className="text-[13px] text-slate-400 font-medium">We couldn't find any orders matching this status.</p>
            </div>
            <button 
              onClick={() => setActiveFilter('all')}
              className="px-8 py-4 bg-[#001b4e] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-900/10"
            >
              View All Orders
            </button>
          </div>
        )}
      </div>

      {ratingModal.isOpen && (
        <RatingModal 
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal({ isOpen: false, order: null, initialData: null })}
          onSubmit={handleReviewSubmit}
          orderId={ratingModal.order?._id}
          partnerId={ratingModal.order?.items[0]?.seller_id}
          items={ratingModal.order?.items.filter(i => i.status === 'delivered')}
          initialData={ratingModal.initialData}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
