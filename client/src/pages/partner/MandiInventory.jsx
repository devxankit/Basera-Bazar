import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  ArrowLeft, 
  Search,
  ChevronRight,
  Edit,
  Trash2,
  MapPin,
  Box,
  LayoutGrid,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Filter,
  Loader2,
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
  Info
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { db } from '../../services/DataEngine';
import PartnerCategoryManager from '../../components/partner/PartnerCategoryManager';

export default function MandiInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    fetchMyProducts();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/partners/profile');
      if (res.data.success) {
        const partner = res.data.data;
        const sub = partner.active_subscription_id;
        setSubscriptionInfo({
          isPro: !!sub && sub.plan_snapshot?.price > 0,
          planName: sub?.plan_snapshot?.name || 'Free Trail',
          limit: sub?.plan_snapshot?.listings_limit || 1
        });
      }
    } catch (err) {
      console.error("Error fetching sub info:", err);
    }
  };

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings/my');
      if (res.data.success) {
        // Filter only mandi products
        const normalized = (res.data.data || [])
          .map(item => db._normalize(item))
          .filter(item => item.type === 'mandi_product');
        setItems(normalized);
      }
    } catch (err) {
      console.error("Error fetching mandi inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this product from your inventory?")) {
      try {
        await api.delete(`/listings/${id}`);
        setItems(prev => prev.filter(item => (item.id || item._id) !== id));
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete product.");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const res = await api.patch(`/mandi/products/${id}`, { status: newStatus });
      if (res.data.success) {
        setItems(prev => prev.map(item => 
          (item.id || item._id) === id ? { ...item, status: newStatus } : item
        ));
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Failed to update product status.");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    if (filter === 'Active') return item.status === 'active';
    if (filter === 'Inactive') return item.status === 'inactive' || item.status === 'pending_approval';
    return true;
  });

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-3 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-[18px] font-semibold text-[#001b4e] uppercase tracking-tight">Mandi Inventory</h2>
          <div className="flex-grow" />
          <button 
            onClick={() => setShowTypeManager(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-blue-600 rounded-lg border border-slate-100 hover:bg-blue-50 transition-all active:scale-95"
          >
            <LayoutGrid size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Manage Types</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001b4e] transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title or brand..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-[14px] outline-none focus:bg-white focus:border-blue-500/30 transition-all font-medium"
          />
        </div>
      </div>

      <div className="p-5">
        {/* Pro Upgrade Banner */}
        {subscriptionInfo && !subscriptionInfo.isPro && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-[#001b4e] rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-blue-900/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={64} fill="white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500/20 p-1.5 rounded-lg border border-white/10">
                  <TrendingUp size={16} className="text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Upgrade Required</span>
              </div>
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-1">List Unlimited Products</h3>
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-tight leading-relaxed mb-4 max-w-[80%]">
                Your current {subscriptionInfo.planName} allows only {subscriptionInfo.limit} active listing. Upgrade to Pro for full access.
              </p>
              <button 
                onClick={() => navigate('/partner/subscription')}
                className="bg-white text-[#001b4e] px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg"
              >
                Go Pro Now <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6">
          {['All', 'Active', 'Inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold uppercase tracking-widest transition-all border ${
                filter === f 
                  ? 'bg-[#001b4e] text-white border-[#001b4e] shadow-md' 
                  : 'bg-white text-slate-400 border-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating Stock...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
             <Package size={64} className="text-slate-200 mb-6" />
             <h3 className="text-[18px] font-bold text-slate-400 uppercase tracking-tight">Inventory Empty</h3>
             <button 
               onClick={() => navigate('/partner/add-product')}
               className="mt-4 text-blue-600 font-bold uppercase text-[12px] tracking-widest hover:underline"
             >
               Add First Product
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
               <motion.div 
                key={item.id || item._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[160px] transition-all ${item.status === 'inactive' ? 'opacity-70 bg-slate-50/50' : ''}`}
              >
                <div className="flex h-[110px]">
                  {/* Thumbnail */}
                  <div className="w-[110px] h-full bg-slate-50 shrink-0 relative border-r border-slate-100/50">
                     {item.thumbnail || item.image ? (
                       <img src={item.thumbnail || item.image} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package size={32} />
                       </div>
                     )}
                     <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest text-white shadow-sm ${item.status === 'active' ? 'bg-[#00c853]' : 'bg-slate-400'}`}>
                        {item.status === 'active' ? 'Live' : 'Hidden'}
                     </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow p-4 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate">{item.brand || 'UNBRANDED'}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleStatus(item.id || item._id, item.status); }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all active:scale-95 ${
                            item.status === 'active' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <Activity size={10} className={item.status === 'active' ? 'animate-pulse' : ''} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">
                            {item.status === 'active' ? 'Deactivate' : 'Activate'}
                          </span>
                        </button>
                        {item.status === 'inactive' && !subscriptionInfo?.isPro && (
                          <div className="group relative">
                             <Info size={14} className="text-rose-500" />
                             <div className="absolute bottom-full right-0 mb-2 w-48 bg-white p-3 rounded-xl shadow-2xl border border-slate-100 hidden group-hover:block z-[70]">
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-normal">
                                 This product was deactivated because it exceeds your current plan's limit. Upgrade to Pro to activate it.
                               </p>
                             </div>
                          </div>
                        )}
                      </div>
                      <h4 className="text-[15px] font-bold text-[#001b4e] uppercase tracking-tight truncate leading-tight mb-1.5">{item.title}</h4>
                      <div className="flex items-baseline gap-1.5 mt-auto">
                         <span className="text-[18px] font-bold text-[#001b4e] tracking-tighter">
                            ₹{typeof item.price === 'object' 
                               ? Number(item.price.value || 0).toLocaleString() 
                               : Number(item.price || 0).toLocaleString()}
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            / {typeof item.price === 'object' ? (item.price.unit || item.unit || 'unit') : (item.unit || 'unit')}
                         </span>
                      </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Box size={12} className="text-slate-300" />
                         Stock: <span className={item.stock > 10 ? 'text-blue-600' : 'text-rose-600'}>{item.stock || 0}</span>
                      </div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">#{item.id?.slice(-4).toUpperCase() || 'NEW'}</div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate(`/partner/add-product?edit=${item.id || item._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                      >
                         <Edit size={12} />
                         <span className="text-[9px] font-bold uppercase tracking-widest pt-0.5">Edit Product</span>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, item.id || item._id)}
                        className="p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 active:scale-90 transition-all shadow-sm"
                      >
                         <Trash2 size={12} />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-24 z-[60] left-1/2 -translate-x-1/2 w-full max-w-md px-5 flex justify-end">
        <button 
          onClick={() => navigate('/partner/add-product')}
          className="bg-[#001b4e] text-white rounded-2xl flex items-center gap-2 px-5 py-4 shadow-2xl shadow-blue-900/40 active:scale-90 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span className="text-[12px] font-bold uppercase tracking-widest">Add Product</span>
        </button>
      </div>

      {/* Type Manager Modal */}
      <AnimatePresence>
        {showTypeManager && (
          <PartnerCategoryManager onClose={() => setShowTypeManager(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
