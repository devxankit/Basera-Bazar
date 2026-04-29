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
  const [activeTab, setActiveTab] = useState('all'); // all, delivered, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, value

  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/seller-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    // 1. Search Filter
    const matchesSearch = 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.user_id?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status Filter
    const hasItemsWithStatus = (statusList) => order.items.some(item => statusList.includes(item.status));
    let matchesStatus = true;
    if (activeTab === 'delivered') matchesStatus = hasItemsWithStatus(['delivered']);
    else if (activeTab === 'cancelled') matchesStatus = hasItemsWithStatus(['cancelled']);
    else if (activeTab === 'active') matchesStatus = hasItemsWithStatus(['pending', 'contacted', 'processing', 'shipped']);

    // 3. Time Filter
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
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-[#001b4e] pt-12 pb-24 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex items-center gap-4 relative z-10 mb-8">
           <button 
             onClick={() => navigate(-1)}
             className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white active:scale-95 transition-all"
           >
             <ArrowLeft size={20} />
           </button>
           <h1 className="text-white text-[24px] font-black uppercase tracking-tight">Order History</h1>
        </div>

        {/* Search & Filter Trigger */}
        <div className="relative z-10 flex gap-3">
           <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                placeholder="Search Order ID or Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 text-sm outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
           </div>
           <button 
             onClick={() => setShowFilter(true)}
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
               activeTab !== 'all' || timeFilter !== 'all' ? 'bg-amber-400 text-[#001b4e] shadow-xl shadow-amber-400/20' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'
             }`}
           >
              <Filter size={20} />
           </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6 -mt-10 relative z-20 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#001b4e]" size={40} />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[40px] p-16 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShoppingBag size={32} className="text-slate-200" />
            </div>
            <h3 className="text-[#001b4e] font-black text-[18px] uppercase tracking-tight">No Records Found</h3>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredOrders.length} Results</span>
               <select 
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="text-[10px] font-black text-[#001b4e] uppercase tracking-widest bg-transparent outline-none cursor-pointer"
               >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="value">Highest Value</option>
               </select>
            </div>
            
            {filteredOrders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</div>
                      <div className="text-[14px] font-black text-[#001b4e] uppercase">{order.user_id?.name || 'Customer'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Ref</div>
                      <div className="text-[14px] font-black text-[#001b4e] uppercase">{order.order_id || order._id.slice(-8)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                          {item.product_id?.thumbnail ? (
                             <img src={item.product_id.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <Package size={20} className="text-slate-200" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-[13px] font-bold text-[#001b4e] truncate uppercase leading-tight">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[11px] font-medium text-slate-400">{item.qty} {item.unit || 'Units'}</span>
                             <div className="w-1 h-1 bg-slate-200 rounded-full" />
                             <span className="text-[11px] font-black text-[#001b4e]">₹{item.price}</span>
                          </div>
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-widest ${
                           item.status === 'delivered' ? 'text-emerald-500' : 
                           item.status === 'cancelled' ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                           {item.status}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                           <Calendar size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Sale</div>
                        <div className="text-[16px] font-black text-[#001b4e]">₹{order.total_amount}</div>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    
    <FilterModal 
      isOpen={showFilter}
      onClose={() => setShowFilter(false)}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      timeFilter={timeFilter}
      setTimeFilter={setTimeFilter}
    />
    </div>
  );
}

function FilterModal({ isOpen, onClose, activeTab, setActiveTab, timeFilter, setTimeFilter }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center">
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-[#001b4e]/40 backdrop-blur-sm"
           />
           <motion.div 
             initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-12 relative z-10 shadow-2xl"
           >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight">Refine Records</h3>
                 <button onClick={onClose} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500">Reset</button>
              </div>

              {/* Status Section */}
              <div className="space-y-4 mb-10">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Status</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {['all', 'active', 'delivered', 'cancelled'].map(status => (
                      <button 
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                          activeTab === status ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-lg shadow-blue-900/20' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                         {status}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Time Section */}
              <div className="space-y-4 mb-10">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-amber-500 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Period</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'all', label: 'All Time' },
                      { id: 'today', label: 'Today Only' },
                      { id: 'week', label: 'Past 7 Days' },
                      { id: 'month', label: 'Past 30 Days' }
                    ].map(period => (
                      <button 
                        key={period.id}
                        onClick={() => setTimeFilter(period.id)}
                        className={`py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                          timeFilter === period.id ? 'bg-amber-400 text-[#001b4e] border-amber-400 shadow-lg shadow-amber-400/20' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}
                      >
                         {period.label}
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-[#001b4e] text-white py-5 rounded-3xl font-black text-[14px] uppercase tracking-[2px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
              >
                 Apply Filters
              </button>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
