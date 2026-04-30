import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ArrowLeft,
  Search,
  User,
  Calendar,
  ChevronRight,
  Clock,
  Phone,
  Truck,
  Package,
  CheckCircle2,
  Filter,
  ShieldCheck,
  MapPin,
  Loader2,
  Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MandiOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, shipped, delivered
  const [deliveryOTPs, setDeliveryOTPs] = useState({}); // { itemId: otp }

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/seller-orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, itemId, status, method = null, delivery_otp = null) => {
    let confirmMsg = `Mark this order as ${status}?`;
    if (status === 'cancelled') {
      confirmMsg = `Are you sure you want to cancel this order? As per policy, your account will be penalized the token booking fee because the amount will be refunded to the customer.`;
    }
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/orders/lead/${orderId}/${itemId}/status`, { status, method, delivery_otp });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    }
  };

  const handleMarkDeliveredCOD = (orderId, itemId) => {
    const otp = deliveryOTPs[itemId];
    if (!otp || otp.length !== 6) {
      alert("Please enter the 6-digit delivery OTP shared by the customer.");
      return;
    }
    handleUpdateStatus(orderId, itemId, 'delivered', 'cod', otp);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const hasItemsWithStatus = (statusList) => order.items.some(item => statusList.includes(item.status));
    if (filter === 'all') return true;
    if (filter === 'pending') return hasItemsWithStatus(['pending', 'contacted', 'processing']);
    if (filter === 'shipped') return hasItemsWithStatus(['shipped']);
    if (filter === 'delivered') return hasItemsWithStatus(['delivered']);
    return true;
  });

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

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex justify-center">
      {/* Mobile Shell */}
      <div className="w-full max-w-[500px] bg-[#f8fafc] min-h-screen shadow-2xl relative flex flex-col pb-24">
        
        {/* Header */}
        <div className="bg-white px-5 py-3 border-b border-slate-100 sticky top-0 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/partner/home')}
                className="p-1 -ml-1 text-[#001b4e] active:scale-95 transition-all"
              >
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Market Orders</h2>
            </div>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <ShoppingBag size={18} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search orders by ID or item..."
              className="w-full h-10 bg-slate-50 rounded-xl pl-11 pr-4 text-[13px] font-medium border border-transparent focus:border-indigo-200 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Filters - Pill Style with Counts */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
             <FilterBtn active={filter === 'all'} label="All" onClick={() => setFilter('all')} count={orders.length} />
             <FilterBtn active={filter === 'pending'} label="Pending" onClick={() => setFilter('pending')} count={orders.filter(o => o.items.some(i => ['pending', 'contacted', 'processing'].includes(i.status))).length} />
             <FilterBtn active={filter === 'shipped'} label="Shipped" onClick={() => setFilter('shipped')} count={orders.filter(o => o.items.some(i => i.status === 'shipped')).length} />
             <FilterBtn active={filter === 'delivered'} label="Delivered" onClick={() => setFilter('delivered')} count={orders.filter(o => o.items.some(i => i.status === 'delivered')).length} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {loading ? (
             <div className="flex flex-col items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Shipments...</p>
             </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
                 <Box size={48} />
              </div>
              <h3 className="text-[18px] font-bold text-slate-600 mb-2">No {filter === 'all' ? '' : filter} orders</h3>
              <p className="text-slate-400 text-[13px] max-w-[240px] font-medium">
                 New marketplace orders from customers will appear here automatically.
              </p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/partner/marketplace/orders/${order._id}`)}
                className="bg-white p-4.5 rounded-[24px] border border-slate-100 shadow-sm relative group active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Header: Customer Info & Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 border-2 border-white">
                       <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-black text-[#001b4e] leading-tight truncate pr-2 uppercase tracking-tight">
                        {order.user_id?.name || 'Potential Customer'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest opacity-60">
                        <Clock size={10} />
                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Global Status Badge (Simplified) */}
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 ${getStatusStyle(order.items[0]?.status)}`}>
                    {order.items[0]?.status}
                  </div>
                </div>

                {/* Items Section (Matched to Leads style box) */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item, iIdx) => (
                    <div key={iIdx} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100/50">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Order Contains</div>
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                           {item.productId?.thumbnail ? (
                             <img src={item.productId.thumbnail} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-200">
                               <Package size={20} />
                             </div>
                           )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-black text-[#001b4e] line-clamp-1 uppercase tracking-tight">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-slate-500">{item.qty} {item.unit || 'Units'}</span>
                            <span className="text-[12px] font-black text-indigo-600">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions moved to details page */}
                    </div>
                  ))}
                </div>

                {/* Footer: Shipping Info */}
                {/* Footer: View Details Intent */}
                <div className="flex items-center justify-between text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Package size={14} />
                    </div>
                    <span>Manage Fulfillment</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function FilterBtn({ active, label, onClick, count }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl whitespace-nowrap text-[11px] font-black uppercase tracking-tight transition-all flex items-center gap-2 border ${
        active 
          ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-lg shadow-blue-900/10 scale-100' 
          : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 scale-95'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    </button>
  );
}
