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
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function AddMandiProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(true);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    material_id: '', // category_id
    description: '',
    price: '',
    unit: 'Piece',
    stock: '',
    thumbnail: null
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/admin/categories?type=product');
        setCategories(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingCats(false);
      }
    };
    fetchCategories();
  }, []);

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
    if (!formData.material_id || !formData.price || !formData.stock || !formData.thumbnail) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title || categories.find(c => c._id === formData.material_id)?.name,
        category_id: formData.material_id,
        material_name: categories.find(c => c._id === formData.material_id)?.name,
        description: formData.description,
        pricing: {
          price_per_unit: Number(formData.price),
          unit: formData.unit
        },
        stock_quantity: Number(formData.stock),
        thumbnail: formData.thumbnail
      };
      
      // We'll use the generic listing creation logic or a specialized one
      // Since I created a specialized update, I'll use a specialized POST route
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
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-white z-20">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-xl">
          <ArrowLeft size={20} className="text-[#001b4e]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#001b4e]">List Material</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-6 flex-grow space-y-8 pb-10">
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
            className="w-full h-56 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
          >
            {formData.thumbnail ? (
              <img src={formData.thumbnail} alt="Product" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Camera size={28} className="text-slate-400" />
                </div>
                <div className="text-center px-10">
                  <p className="text-[14px] font-bold text-[#001b4e]">Upload Material Photo</p>
                  <p className="text-[11px] text-slate-400 mt-1">Clear photo of the material (Bricks, Sand, etc.)</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {fetchingCats ? (
                <div className="col-span-2 py-4 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : (
                categories.map(cat => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, material_id: cat._id }))}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                      formData.material_id === cat._id 
                      ? 'border-[#001b4e] bg-indigo-50/30' 
                      : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                       <Box size={16} className="text-slate-500" />
                    </div>
                    <span className={`text-[13px] font-bold ${formData.material_id === cat._id ? 'text-[#001b4e]' : 'text-slate-500'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
             <div className="relative">
                <input 
                  type="text"
                  placeholder="Listing Title (e.g. Red Soil Bricks)"
                  className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-bold text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300"
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
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-bold text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                <div className="relative">
                   <select 
                    className="w-full bg-slate-50 border-none rounded-2xl py-5 px-6 text-[#001b4e] font-bold text-[15px] focus:ring-2 ring-indigo-500/20 transition-all appearance-none"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                   >
                     <option value="Piece">Per Piece</option>
                     <option value="Cubic Feet">Per Cu. Ft.</option>
                     <option value="Metric Ton">Per Ton</option>
                     <option value="Trolly">Per Trolly</option>
                     <option value="Truck">Per Truck</option>
                   </select>
                </div>
             </div>

             <div className="relative">
                <input 
                  type="number"
                  placeholder="Stock Quantity *"
                  className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-12 pr-6 text-[#001b4e] font-bold text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                />
                <Database size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase">
                  Available
                </div>
             </div>

             <textarea 
               placeholder="Brief Description (Optional)"
               rows="3"
               className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[#001b4e] font-medium text-[15px] focus:ring-2 ring-indigo-500/20 transition-all placeholder:text-slate-300 resize-none"
               value={formData.description}
               onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
             />
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100/50">
           <AlertCircle size={20} className="text-amber-500 shrink-0" />
           <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
             Listing accuracy is critical. Incorrect prices or out-of-stock items that lead to cancellations may affect your seller rating and settlement timeframe.
           </p>
        </div>
      </form>

      {/* Action Button */}
      <div className="p-6 bg-white border-t border-slate-50 sticky bottom-0">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-16 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/10 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Confirm Listing'}
          {!loading && <CheckCircle2 size={20} />}
        </button>
      </div>
    </div>
  );
}
