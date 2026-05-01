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
  AlertCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function MandiInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyProducts();
  }, []);

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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    if (filter === 'Active') return item.status === 'active';
    if (filter === 'Pending') return item.status === 'pending_approval' || !item.status;
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
          <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Mandi Inventory</h2>
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
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6">
          {['All', 'Active', 'Pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all border ${
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
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id || item._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex h-[100px]"
              >
                {/* Thumbnail */}
                <div className="w-[100px] h-full bg-slate-50 shrink-0 relative border-r border-slate-50">
                   {item.thumbnail || item.image ? (
                     <img src={item.thumbnail || item.image} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Package size={24} />
                     </div>
                   )}
                   <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white shadow-sm ${item.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                      {item.status || 'PENDING'}
                   </div>
                </div>

                {/* Info */}
                <div className="flex-grow p-3 min-w-0 flex flex-col justify-between">
                   <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate">{item.brand || 'UNBRANDED'}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">#{item.id?.slice(-4).toUpperCase()}</span>
                      </div>
                      <h4 className="text-[13px] font-black text-[#001b4e] uppercase tracking-tight truncate leading-tight mb-1">{item.title}</h4>
                      <div className="flex items-baseline gap-1.5">
                         <span className="text-[15px] font-black text-[#001b4e] tracking-tighter">
                            ₹{typeof item.price === 'object' 
                               ? Number(item.price.value || 0).toLocaleString() 
                               : Number(item.price || 0).toLocaleString()}
                         </span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            / {typeof item.price === 'object' ? (item.price.unit || item.unit || 'unit') : (item.unit || 'unit')}
                         </span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 mt-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Stock: <span className={item.stock > 10 ? 'text-blue-600' : 'text-rose-600'}>{item.stock || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => navigate(`/partner/add-product?edit=${item.id || item._id}`)}
                           className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 rounded border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                         >
                            <Edit size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest pt-0.5">Edit</span>
                         </button>
                         <button 
                           onClick={(e) => handleDelete(e, item.id || item._id)}
                           className="p-1 bg-rose-50 text-rose-500 rounded border border-rose-100 active:scale-90 transition-all"
                         >
                            <Trash2 size={10} />
                         </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => navigate('/partner/add-product')}
        className="fixed bottom-32 right-6 w-14 h-14 bg-[#001b4e] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-900/30 active:scale-90 transition-all z-[60]"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
