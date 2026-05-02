import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Phone, 
  ChevronRight, MapPin, Loader2, Box, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MandiOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    const hasItemsWithStatus = (statusList) => order.items.some(item => statusList.includes(item.status));
    if (filter === 'all') return true;
    if (filter === 'pending') return hasItemsWithStatus(['pending', 'contacted', 'processing']);
    if (filter === 'shipped') return hasItemsWithStatus(['shipped']);
    if (filter === 'delivered') return hasItemsWithStatus(['delivered']);
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return { label: 'Pending', className: 'bg-amber-500 text-white' };
      case 'contacted': return { label: 'Accepted', className: 'bg-blue-600 text-white' };
      case 'processing': return { label: 'Processing', className: 'bg-purple-600 text-white' };
      case 'shipped': return { label: 'In Transit', className: 'bg-indigo-600 text-white' };
      case 'delivered': return { label: 'Delivered', className: 'bg-emerald-600 text-white' };
      case 'cancelled': return { label: 'Cancelled', className: 'bg-rose-600 text-white' };
      default: return { label: status, className: 'bg-slate-100 text-slate-400' };
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4 mt-1">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Market Orders</h2>
        </div>

        {/* Compact Search Bar */}
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
            <Search size={16} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Item..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[13px] font-bold uppercase tracking-tight outline-none focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-200 placeholder:font-black"
          />
        </div>
      </div>

      <div className="p-5">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          <FilterTab active={filter === 'all'} label="All" count={orders.length} onClick={() => setFilter('all')} />
          <FilterTab active={filter === 'pending'} label="Pending" count={orders.filter(o => o.items.some(i => ['pending', 'contacted', 'processing'].includes(i.status))).length} onClick={() => setFilter('pending')} />
          <FilterTab active={filter === 'shipped'} label="Shipped" count={orders.filter(o => o.items.some(i => i.status === 'shipped')).length} onClick={() => setFilter('shipped')} />
          <FilterTab active={filter === 'delivered'} label="Delivered" count={orders.filter(o => o.items.some(i => i.status === 'delivered')).length} onClick={() => setFilter('delivered')} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={28} />
            <span className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Syncing Orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
             <Box size={64} className="text-slate-200 mb-6" />
             <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No orders found</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => navigate(`/partner/marketplace/orders/${order._id}`)}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Order Header */}
                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#001b4e] font-black text-[15px] shadow-sm border border-slate-100 shrink-0">
                         {(order.shipping_address?.full_name || order.user_id?.name || 'C')[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-black text-[#001b4e] leading-tight uppercase tracking-tight truncate">
                          {order.shipping_address?.full_name || order.user_id?.name || 'Customer'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-blue-600 text-[10px] font-black tracking-widest">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end shrink-0">
                      <span className="text-slate-300 text-[9px] font-black uppercase tracking-tighter opacity-60">
                         {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                      </span>
                      <ChevronRight size={18} className="text-slate-200 mt-1" />
                   </div>
                </div>

                {/* Items Preview */}
                <div className="p-4 space-y-3">
                   {order.items.map((item, iIdx) => {
                     const status = getStatusBadge(item.status);
                     return (
                       <div key={iIdx} className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                             <img src={item.productId?.thumbnail || item.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                             <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h5 className="text-[13px] font-black text-[#001b4e] uppercase tracking-tight truncate">{item.name}</h5>
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 shadow-sm ${status.className}`}>
                                   {status.label}
                                </div>
                             </div>
                             <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-tight">
                                   {item.qty} {item.unit} <span className="text-slate-100 mx-1">×</span> ₹{item.price}
                                </div>
                                <div className="text-[15px] font-black text-blue-600 tracking-tighter leading-none">₹{(item.price * item.qty).toLocaleString()}</div>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                   
                   {/* Logistics Row */}
                   <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-50">
                      <MapPin size={12} className="text-rose-500 shrink-0" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight truncate opacity-60">
                         Ship to: {order.shipping_address?.city}, {order.shipping_address?.state}
                      </span>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({ active, label, count, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
        active 
          ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-md shadow-blue-900/10' 
          : 'bg-white text-slate-300 border-slate-100 hover:bg-slate-50'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-300'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
