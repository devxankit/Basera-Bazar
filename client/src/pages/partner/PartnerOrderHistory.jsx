import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  MapPin,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function PartnerOrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); 

  const [timeFilter, setTimeFilter] = useState('all'); 
  const [showFilter, setShowFilter] = useState(false);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasItemsWithStatus = (statusList) => order.items.some(item => statusList.includes(item.status));
    let matchesStatus = true;
    if (activeTab === 'delivered') matchesStatus = hasItemsWithStatus(['delivered']);
    else if (activeTab === 'cancelled') matchesStatus = hasItemsWithStatus(['cancelled']);
    else if (activeTab === 'active') matchesStatus = hasItemsWithStatus(['pending', 'contacted', 'processing', 'shipped']);

    let matchesTime = true;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    if (timeFilter === 'today') {
       matchesTime = orderDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'week') {
       const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
       matchesTime = orderDate >= weekAgo;
    } else if (timeFilter === 'month') {
       const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
       matchesTime = orderDate >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesTime;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'value') return b.total_amount - a.total_amount;
    return 0;
  });

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-3 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Order History</h2>
        </div>

        {/* Search */}
        <div className="flex gap-2">
           <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium outline-none"
              />
           </div>
           <button 
             onClick={() => setShowFilter(true)}
             className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
               activeTab !== 'all' || timeFilter !== 'all' ? 'bg-amber-400 border-amber-400 text-[#001b4e]' : 'bg-white border-slate-100 text-[#001b4e]'
             }`}
           >
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating Records...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
             <ShoppingBag size={64} className="text-slate-200 mb-6" />
             <h3 className="text-[18px] font-bold text-slate-400 uppercase tracking-tight">No Records</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => (
              <div 
                key={order._id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-3"
              >
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                   <div>
                      <div className="text-[13px] font-black text-[#001b4e] uppercase tracking-tight leading-none">{order.user_id?.name || 'Customer'}</div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{new Date(order.createdAt).toLocaleDateString()} • #{order._id.slice(-6).toUpperCase()}</div>
                   </div>
                   <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                     order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                     order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                   }`}>
                      {order.status}
                   </div>
                </div>
                <div className="p-4 space-y-2.5">
                   {order.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex gap-3 items-center">
                         <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                            <img src={item.productId?.thumbnail || item.thumbnail} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-grow min-w-0">
                            <div className="text-[12px] font-bold text-[#001b4e] truncate uppercase tracking-tight">{item.name}</div>
                            <div className="text-[10px] font-bold text-slate-400">{item.qty} {item.unit} <span className="text-slate-200 mx-1">×</span> ₹{item.price}</div>
                         </div>
                         <div className="text-[13px] font-black text-blue-600 tracking-tighter">₹{item.price * item.qty}</div>
                      </div>
                   ))}
                   <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Transaction</div>
                      <div className="text-[15px] font-black text-[#001b4e] tracking-tighter">₹{order.total_amount.toLocaleString()}</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[24px] p-8 shadow-2xl">
                <h3 className="text-[#001b4e] text-[18px] font-bold uppercase tracking-tight mb-6">Filter Records</h3>
                
                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">By Status</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['all', 'active', 'delivered', 'cancelled'].map(s => (
                           <button 
                             key={s} 
                             onClick={() => setActiveTab(s)}
                             className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                               activeTab === s ? 'bg-[#001b4e] text-white border-[#001b4e]' : 'bg-slate-50 text-slate-400 border-slate-100'
                             }`}
                           >
                              {s}
                           </button>
                         ))}
                      </div>
                   </div>
                   
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">By Time</label>
                      <div className="grid grid-cols-2 gap-2">
                         {[
                           { id: 'all', label: 'All Time' },
                           { id: 'today', label: 'Today' },
                           { id: 'week', label: 'This Week' },
                           { id: 'month', label: 'This Month' }
                         ].map(t => (
                           <button 
                             key={t.id} 
                             onClick={() => setTimeFilter(t.id)}
                             className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                               timeFilter === t.id ? 'bg-amber-400 text-[#001b4e] border-amber-400' : 'bg-slate-50 text-slate-400 border-slate-100'
                             }`}
                           >
                              {t.label}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <button onClick={() => setShowFilter(false)} className="w-full bg-[#001b4e] text-white py-4 rounded-xl font-bold uppercase tracking-widest mt-8 shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Apply Filters</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
