import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Camera, 
  Box, 
  IndianRupee, 
  Database,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Tag,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function AddMandiProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(true);
  const [fetchingSubcats, setFetchingSubcats] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    material_id: '', // category_id
    subcategory_id: '',
    brand: '',
    description: '',
    price: '',
    unit: 'Piece',
    stock: '',
    thumbnail: null
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/listings/categories?type=product');
        setCategories(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when material type changes
  useEffect(() => {
    if (formData.material_id) {
      fetchSubcategories(formData.material_id);
      // Reset subcategory when material type changes
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    } else {
      setSubcategories([]);
    }
  }, [formData.material_id]);

  const fetchSubcategories = async (parentId) => {
    try {
      setFetchingSubcats(true);
      const res = await api.get(`/listings/categories?type=product&parent_id=${parentId}`);
      setSubcategories(res.data.data);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    } finally {
      setFetchingSubcats(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await db.uploadFile(file);
      setFormData(prev => ({ ...prev, thumbnail: res.url }));
    } catch (err) {
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isReady = formData.material_id && 
                    formData.price && 
                    formData.stock && 
                    formData.thumbnail;

    if (!isReady) {
      alert("Please select a material type, enter price/stock, and upload an image.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title || categories.find(c => (c._id || c.id) === formData.material_id)?.name,
        category_id: formData.material_id,
        subcategory_id: formData.subcategory_id || undefined,
        brand: formData.brand,
        material_name: categories.find(c => (c._id || c.id) === formData.material_id)?.name,
        description: formData.description,
        pricing: {
          price_per_unit: Number(formData.price),
          unit: formData.unit
        },
        stock_quantity: Number(formData.stock),
        thumbnail: formData.thumbnail
      };
      
      await api.post('/listings/mandi', payload);
      
      alert("Product listed successfully! It will be active after admin approval.");
      navigate('/partner/mandi/inventory');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative flex flex-col font-sans">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-xl active:scale-95 transition-all">
          <ArrowLeft size={20} className="text-[#001b4e]" />
        </button>
        <h1 className="text-[17px] font-black text-[#001b4e] uppercase tracking-tight">List Material</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-6 flex-grow space-y-8 pb-10 pt-6">
        {/* Image Upload */}
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*"
          />
          <div 
            onClick={() => fileInputRef.current.click()}
            className="w-full h-56 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden group cursor-pointer active:scale-[0.98] transition-all relative"
          >
            {formData.thumbnail ? (
              <>
                <img src={formData.thumbnail} alt="Product" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={32} className="text-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Camera size={28} className="text-slate-400" />
                </div>
                <div className="text-center px-10">
                  <p className="text-[14px] font-black text-[#001b4e] uppercase tracking-tight">Upload Material Photo</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">High quality image helps sell faster</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Category Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] px-1">Material Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {fetchingCats ? (
                <div className="col-span-2 py-4 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : (
                categories.map(cat => (
                  <button
                    key={cat._id || cat.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, material_id: cat._id || cat.id }))}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all active:scale-[0.97] ${
                      formData.material_id === (cat._id || cat.id)
                      ? 'border-[#001b4e] bg-indigo-50/30 ring-4 ring-indigo-500/5' 
                      : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      formData.material_id === (cat._id || cat.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                       <Box size={16} />
                    </div>
                    <span className={`text-[13px] font-black uppercase tracking-tight ${formData.material_id === (cat._id || cat.id) ? 'text-[#001b4e]' : 'text-slate-400'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sub Category - Dynamic */}
          <AnimatePresence>
            {formData.material_id && subcategories.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] px-1 flex items-center gap-2">
                  <Layers size={12} className="text-indigo-500" /> Select Variety / Grade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subcategories.map(sub => (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, subcategory_id: sub._id }))}
                      className={`px-4 py-3 rounded-xl border-2 text-[12px] font-black uppercase tracking-tight transition-all active:scale-[0.97] ${
                        formData.subcategory_id === sub._id
                        ? 'border-[#001b4e] bg-[#001b4e] text-white' 
                        : 'border-slate-100 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
             {/* Brand Input */}
             <div className="relative">
                <input 
                  type="text"
                  placeholder="Brand (e.g. ACC, UltraTech, Jindal)"
                  className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-black text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:text-[11px]"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>

             <div className="relative">
                <input 
                  type="text"
                  placeholder="Listing Title (e.g. Red Soil Bricks)"
                  className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-black text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:text-[11px]"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
                <Box size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input 
                    type="number"
                    placeholder="Price *"
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-black text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:text-[11px]"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                <div className="relative">
                   <select 
                    className="w-full h-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-[#001b4e] font-black text-[14px] focus:ring-2 ring-indigo-500/20 transition-all appearance-none uppercase tracking-tight"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                   >
                     <option value="Piece">Per Piece</option>
                     <option value="Cubic Feet">Per Cu. Ft.</option>
                     <option value="Metric Ton">Per Ton</option>
                     <option value="Trolly">Per Trolly</option>
                     <option value="Truck">Per Truck</option>
                   </select>
                   <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                </div>
             </div>

             <div className="relative">
                <input 
                  type="number"
                  placeholder="Stock Quantity *"
                  className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-black text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:text-[11px]"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                />
                <Database size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                  Units
                </div>
             </div>

             <textarea 
               placeholder="Brief Description (Optional)"
               rows="3"
               className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[#001b4e] font-bold text-[14px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:text-[11px] resize-none"
               value={formData.description}
               onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
             />
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-amber-50 rounded-2xl p-5 flex gap-4 border border-amber-100/50">
           <AlertCircle size={24} className="text-amber-500 shrink-0" />
           <p className="text-[11px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight opacity-80">
             Listing accuracy is critical. Incorrect prices or out-of-stock items lead to cancellations which affect your seller rating and settlement timeframe.
           </p>
        </div>
      </form>

      {/* Action Button */}
      <div className="p-6 bg-white border-t border-slate-50 sticky bottom-0 z-30">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-16 bg-[#001b4e] text-white rounded-2xl font-black text-[16px] flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              Confirm Listing
              <CheckCircle2 size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
