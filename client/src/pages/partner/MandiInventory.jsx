import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Package, 
  IndianRupee, 
  Database,
  ArrowRight,
  Loader2,
  ChevronRight,
  TrendingUp,
  Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function MandiInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Using the dedicated listings/my endpoint which returns all partner listings
      const res = await api.get('/listings/my'); 
      // Filter only mandi products from the combined results
      const mandiProducts = res.data.data.filter(item => item.type === 'mandi_product');
      setProducts(mandiProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/mandi/products/${editingProduct._id}`, {
        pricing: {
          price_per_unit: Number(editingProduct.pricing.price_per_unit),
          unit: editingProduct.pricing.unit
        },
        stock_quantity: Number(editingProduct.stock_quantity)
      });
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] pt-12 pb-20 px-6 rounded-b-[40px] relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10 mb-6">
          <h1 className="text-white text-[24px] font-bold">My Inventory</h1>
          <button 
            onClick={() => navigate('/partner/mandi/add-product')}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#001b4e] shadow-lg active:scale-90 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center px-5 py-4">
             <Search size={20} className="text-white/40 mr-3" />
             <input 
               type="text" 
               placeholder="Search materials..." 
               className="bg-transparent border-none outline-none text-white placeholder:text-white/30 text-[15px] w-full font-medium"
             />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#001b4e]" size={40} />
            <span className="text-slate-400 font-medium">Loading materials...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
               <Package size={40} />
            </div>
            <h3 className="text-[18px] font-bold text-[#001b4e] mb-2">No Products Found</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed mb-8">You haven't listed any materials yet. Start selling by adding your first product.</p>
            <button 
              onClick={() => navigate('/partner/mandi/add-product')}
              className="bg-[#001b4e] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-900/10 active:scale-95 transition-all"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          products.map((product) => (
            <motion.div 
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-50 flex gap-4 group active:scale-[0.98] transition-all"
            >
              <div className="w-24 h-24 rounded-[24px] overflow-hidden bg-slate-100 shrink-0">
                <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-[16px] font-bold text-[#001b4e] leading-tight">{product.title}</h3>
                    <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                      product.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {product.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[#001b4e]">
                       <IndianRupee size={12} className="text-slate-300" />
                       <span className="text-[14px] font-bold">{product.pricing.price_per_unit}</span>
                       <span className="text-[11px] text-slate-400">/{product.pricing.unit}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-100 rounded-full" />
                    <div className="flex items-center gap-1 text-slate-400">
                       <Database size={12} className="text-slate-300" />
                       <span className="text-[12px] font-bold text-slate-500">{product.stock_quantity}</span>
                       <span className="text-[11px] text-slate-300">Left</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-slate-50 p-2 rounded-xl text-[#001b4e] hover:bg-slate-100 transition-all"
                      >
                         <Edit3 size={16} />
                      </button>
                      <button className="bg-slate-50 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all">
                         <Trash2 size={16} />
                      </button>
                   </div>
                   <button className="flex items-center gap-1 text-[12px] font-bold text-indigo-600">
                      Stats <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 pb-4">
                <h3 className="text-[20px] font-bold text-[#001b4e] mb-2">Quick Update</h3>
                <p className="text-slate-400 text-[13px]">Update the live pricing and stock for {editingProduct?.title}</p>
                
                <div className="mt-8 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1">Price per {editingProduct?.pricing.unit}</label>
                    <div className="relative">
                       <input 
                         type="number"
                         className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-bold text-[16px] outline-none"
                         value={editingProduct?.pricing.price_per_unit}
                         onChange={(e) => setEditingProduct({...editingProduct, pricing: {...editingProduct.pricing, price_per_unit: e.target.value}})}
                       />
                       <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1">Available Stock</label>
                    <div className="relative">
                       <input 
                         type="number"
                         className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-bold text-[16px] outline-none"
                         value={editingProduct?.stock_quantity}
                         onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: e.target.value})}
                       />
                       <Database size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-slate-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleQuickUpdate}
                  className="flex-[2] py-4 rounded-2xl font-bold bg-[#001b4e] text-white shadow-lg shadow-indigo-900/10 active:scale-95 transition-all"
                >
                  Update Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
