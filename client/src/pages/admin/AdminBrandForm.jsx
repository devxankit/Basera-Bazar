import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Loader2, Info, Zap, 
  CheckCircle2, Image as ImageIcon, X, Plus
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-black text-slate-700 mb-2 ml-1";

export default function AdminBrandForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    is_active: true
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchBrand = async () => {
        try {
          const response = await api.get(`/admin/system/brands/${id}`);
          if (response.data.success) {
            setFormData({
               name: response.data.data.name || '',
               logo: response.data.data.logo || '',
               is_active: response.data.data.is_active ?? true
            });
          }
        } catch (err) {
          setError("Failed to load brand data");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBrand();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await api.put(`/admin/system/brands/${id}`, formData);
      } else {
        await api.post('/admin/system/brands', formData);
      }
      navigate('/admin/products/brands');
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Back Button */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Edit Brand' : 'Create Brand'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</span>
             <div className="w-1 h-1 rounded-full bg-slate-300"></div>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{isEdit ? 'Mutation' : 'Initialization'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Card */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
             <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                   <Plus size={16} strokeWidth={3} />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Brand Information</h3>
             </div>

             <div className="space-y-6">
                <div>
                  <label className={labelClass}>Brand Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter brand name (e.g., Samsung, Nike, Sony)"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-2 ml-1">Type a unique brand name. This will be used across the platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className={labelClass}>Status <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <select 
                          required
                          value={formData.is_active}
                          onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <X className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-slate-400" size={16} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-2 ml-1">Active brands will be available for product listings.</p>
                   </div>

                   <div>
                      <label className={labelClass}>Logo URL (Optional)</label>
                      <div className="relative group">
                         <input 
                           type="text"
                           placeholder="https://example.com/logo.png"
                           value={formData.logo}
                           onChange={(e) => setFormData({...formData, logo: e.target.value})}
                           className={`${inputClass} pr-10`}
                         />
                         <ImageIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-2 ml-1">Providing a logo improves marketplace aesthetics.</p>
                   </div>
                </div>

                {formData.logo && (
                   <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Preview</span>
                      <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center p-3 border border-slate-100 overflow-hidden">
                         <img src={formData.logo} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                   </div>
                )}
             </div>

             {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                   <Info size={18} />
                   {error}
                </div>
             )}

             <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isEdit ? 'Update Brand' : 'Create Brand'}
                </button>
             </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                   <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Brand Guidelines</h3>
             </div>
             <div className="space-y-5">
                {[
                  { title: 'Brand Name', desc: 'Use the official brand name with proper capitalization (e.g., "Samsung" not "samsung").' },
                  { title: 'Uniqueness', desc: 'Each brand name must be unique. Duplicate brand names are not allowed.' },
                  { title: 'Status', desc: 'Set to Active to make this brand available for product listings. Inactive brands won\'t appear in product forms.' }
                ].map((item, i) => (
                   <div key={i}>
                      <div className="flex items-center gap-2 text-sm font-black text-slate-800 mb-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                         {item.title}
                      </div>
                      <p className="text-[12px] font-medium text-slate-500 leading-relaxed ml-3.5">{item.desc}</p>
                   </div>
                ))}
             </div>
           </div>

           <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
              <div className="relative">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                       <Zap size={16} className="fill-white" />
                    </div>
                    <h4 className="font-black text-[12px] text-slate-900 uppercase tracking-widest">Pro Tip</h4>
                 </div>
                 <p className="text-[12px] font-bold leading-relaxed text-indigo-700">
                    Once created, brands can be assigned to multiple product names through the Product Names management section.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
