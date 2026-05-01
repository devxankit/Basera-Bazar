import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Tag, Box, Info, Sparkles, 
  Camera, IndianRupee, Database, Shield, 
  Loader2, Check, ChevronRight, X 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function AddMandiProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    unit: 'Bag',
    material_id: '',
    grade_id: '',
    stock: '',
    description: '',
    thumbnail: null,
    images: []
  });

  useEffect(() => {
    fetchCategories();
    if (editId) fetchProductData();
  }, []);

  const fetchCategories = async () => {
    try {
      setFetchingCats(true);
      const res = await api.get('/listings/categories?type=mandi_product');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setFetchingCats(false);
    }
  };

  const fetchProductData = async () => {
    try {
      const res = await api.get(`/listings/${editId}`);
      if (res.data.success) {
        const item = res.data.data;
        setFormData({
          title: item.title || '',
          brand: item.brand || '',
          price: item.price || '',
          unit: item.unit || 'Bag',
          material_id: item.material_id || '',
          grade_id: item.grade_id || '',
          stock: item.stock || '',
          description: item.description || '',
          thumbnail: item.thumbnail || item.image || null,
          images: item.images || []
        });
      }
    } catch (err) {
      console.error("Error fetching product data:", err);
    }
  };

  useEffect(() => {
    if (formData.material_id) {
      const fetchSubcats = async () => {
        try {
          const res = await api.get(`/listings/categories?type=mandi_product&parent_id=${formData.material_id}`);
          if (res.data.success) {
            setSubcategories(res.data.data);
          }
        } catch (err) {
          console.error("Error fetching subcategories:", err);
        }
      };
      fetchSubcats();
    }
  }, [formData.material_id]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await db.uploadFile(file);
      if (res?.url) {
        setFormData(prev => ({ ...prev, thumbnail: res.url }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.material_id) {
      alert("Please fill in required fields.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        type: 'mandi_product',
        category: 'mandi_product'
      };

      if (editId) {
        await api.put(`/listings/${editId}`, payload);
      } else {
        await api.post('/listings', payload);
      }

      navigate('/partner/inventory');
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-[#001b4e] px-5 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-[20px] font-medium">{editId ? 'Edit Product' : 'Add Mandi Product'}</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Image Upload */}
        <div 
          onClick={() => fileInputRef.current.click()}
          className="bg-white rounded-2xl border-2 border-dashed border-slate-200 h-48 flex flex-col items-center justify-center overflow-hidden relative active:scale-[0.98] transition-all"
        >
          {formData.thumbnail ? (
            <img src={formData.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
               <Camera size={40} className="mb-2" />
               <span className="text-[13px] font-bold uppercase tracking-widest">Upload Product Photo</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-[#001b4e] font-bold text-[14px] uppercase tracking-wider mb-2">Product Details</h3>
           <InputField 
             icon={<Box size={18} />} 
             label="Product Title *" 
             placeholder="Ex: Red Clay Bricks" 
             value={formData.title}
             onChange={v => setFormData({...formData, title: v})}
           />
           <InputField 
             icon={<Tag size={18} />} 
             label="Brand Name" 
             placeholder="Ex: UltraTech, ACC" 
             value={formData.brand}
             onChange={v => setFormData({...formData, brand: v})}
           />
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-[#001b4e] font-bold text-[14px] uppercase tracking-wider mb-2">Classification</h3>
           
           <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Material Type *</label>
              <div className="grid grid-cols-2 gap-3">
                 {categories.map(cat => (
                   <button 
                     key={cat._id}
                     onClick={() => setFormData({...formData, material_id: cat._id, grade_id: ''})}
                     className={`p-4 rounded-xl border-2 text-[13px] font-bold transition-all ${
                       formData.material_id === cat._id ? 'border-[#001b4e] bg-blue-50 text-[#001b4e]' : 'border-slate-50 bg-slate-50 text-slate-400'
                     }`}
                   >
                     {cat.name}
                   </button>
                 ))}
              </div>
           </div>

           {subcategories.length > 0 && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Grade / Variant</label>
                <div className="grid grid-cols-2 gap-3">
                   {subcategories.map(sub => (
                     <button 
                       key={sub._id}
                       onClick={() => setFormData({...formData, grade_id: sub._id})}
                       className={`p-4 rounded-xl border-2 text-[13px] font-bold transition-all ${
                         formData.grade_id === sub._id ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 bg-slate-50 text-slate-400'
                       }`}
                     >
                       {sub.name}
                     </button>
                   ))}
                </div>
             </motion.div>
           )}
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-[#001b4e] font-bold text-[14px] uppercase tracking-wider mb-2">Pricing & Inventory</h3>
           <div className="grid grid-cols-2 gap-4">
              <InputField 
                icon={<IndianRupee size={18} />} 
                label="Price *" 
                placeholder="0.00" 
                type="number"
                value={formData.price}
                onChange={v => setFormData({...formData, price: v})}
              />
              <div>
                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Unit</label>
                 <select 
                   value={formData.unit}
                   onChange={e => setFormData({...formData, unit: e.target.value})}
                   className="w-full bg-slate-50 border border-slate-50 rounded-xl py-4 px-4 text-[14px] font-bold text-[#001b4e] outline-none"
                 >
                    <option value="Bag">Per Bag</option>
                    <option value="Trolley">Per Trolley</option>
                    <option value="Cubic Feet">Per CFT</option>
                    <option value="Piece">Per Piece</option>
                    <option value="Ton">Per Ton</option>
                 </select>
              </div>
           </div>
           <InputField 
             icon={<Database size={18} />} 
             label="Available Stock" 
             placeholder="Quantity in units" 
             type="number"
             value={formData.stock}
             onChange={v => setFormData({...formData, stock: v})}
           />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-[#001b4e] font-bold text-[14px] uppercase tracking-wider mb-2">Product Description</h3>
           <textarea 
             className="w-full bg-slate-50 border border-slate-50 rounded-xl p-4 text-[14px] font-medium text-[#001b4e] min-h-[120px] outline-none focus:bg-white focus:border-blue-500/20 transition-all"
             placeholder="Tell customers more about your material..."
             value={formData.description}
             onChange={e => setFormData({...formData, description: e.target.value})}
           />
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#001b4e] text-white py-5 rounded-xl font-bold text-[16px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="animate-spin" /> : (
            <>
              {editId ? 'Update Product' : 'Publish Product'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function InputField({ icon, label, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="w-full">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">{label}</label>
      <div className="relative">
         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
         </div>
         <input 
           type={type}
           placeholder={placeholder}
           value={value}
           onChange={e => onChange(e.target.value)}
           className="w-full bg-slate-50 border border-slate-50 rounded-xl py-4 pl-12 pr-4 text-[14px] font-bold text-[#001b4e] outline-none focus:bg-white focus:border-blue-500/20 transition-all"
         />
      </div>
    </div>
  );
}
