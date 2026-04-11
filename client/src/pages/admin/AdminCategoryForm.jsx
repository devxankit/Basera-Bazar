import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FolderPlus, Tag, Image, Info, Save, X, 
  Loader2, CheckCircle2, AlertCircle, LayoutGrid, 
  ArrowLeft, Layers, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

export default function AdminCategoryForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  // Detect if adding a subcategory
  const parentIdFromUrl = searchParams.get('parent');
  const typeFromUrl = searchParams.get('type') || 'property';

  const [formData, setFormData] = useState({
    name: '',
    type: typeFromUrl,
    parent_id: parentIdFromUrl || null,
    icon: '',
    description: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [parentName, setParentName] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (isEdit) {
          const res = await api.get(`/admin/system/categories/${id}`);
          if (res.data.success) {
            setFormData(res.data.data);
            if (res.data.data.parent_id) setParentName(res.data.data.parent_id.name);
          }
        } else if (parentIdFromUrl) {
          const res = await api.get(`/admin/system/categories/${parentIdFromUrl}`);
          if (res.data.success) {
            setParentName(res.data.data.name);
            setFormData(prev => ({ ...prev, type: res.data.data.type }));
          }
        }
      } catch (err) {
        setError("Failed to fetch reference data.");
      } finally {
        setInitLoading(false);
      }
    };
    fetchDetails();
  }, [id, isEdit, parentIdFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = isEdit 
        ? await api.put(`/admin/system/categories/${id}`, formData)
        : await api.post('/admin/system/categories', formData);

      if (res.data.success) {
        setSuccess(`Category Managed Successfully! Redirecting...`);
        setTimeout(() => {
           if (parentIdFromUrl) navigate(`/admin/properties/categories/view/${parentIdFromUrl}`);
           else navigate(-1);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 border-r-2 border-r-transparent"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Taxonomy...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      <div className="flex items-center gap-6 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
         <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {parentIdFromUrl ? 'Add Subcategory' : isEdit ? 'Modify Category' : 'New Marketplace Category'}
            </h1>
            {parentName && <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Under: {parentName}</p>}
         </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
               <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                   <Tag size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Identity Details</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Standardized Taxonomy Labels</p>
                 </div>
               </div>
               
               <div className="p-10 space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
                     <div className="relative group">
                        <Type className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                           required 
                           className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                           placeholder="Ex: Residential Apartments, Plumbing, Brick Supply..."
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                     </div>
                  </div>

                  {!parentIdFromUrl && !isEdit && (
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Module Type</label>
                       <select 
                          className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-black text-slate-700 transition-all cursor-pointer"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                       >
                          <option value="property">Real Estate (Property)</option>
                          <option value="service">Technical Services</option>
                          <option value="material">Construction Materials</option>
                          <option value="supplier">Bulk Suppliers</option>
                       </select>
                    </div>
                  )}

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Public Description (SEO)</label>
                     <textarea 
                        className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[32px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                        rows={4}
                        placeholder="Provide details about what items belong in this category..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     />
                  </div>

                  <div className="space-y-3">
                     <MediaDropZone 
                        value={formData.icon ? [formData.icon] : []}
                        onChange={(urls) => setFormData({ ...formData, icon: urls[0] || '' })}
                        multiple={false}
                        label="Category Visual Identity"
                        description="Upload a representative icon or cover image"
                        accentColor="orange"
                     />
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-white rounded-[44px] p-10 border border-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.07)] sticky top-10 overflow-hidden relative group">
               {/* Subtle top accent */}
               <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-rose-400" />
               
               <div className="space-y-6 relative z-10">
                  <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100/50 transition-transform group-hover:scale-110">
                     <Layers size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic">Taxonomy Control</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">System Classification</p>
                  </div>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed tracking-tight border-l-4 border-orange-100 pl-4 py-1">
                    Categories help users navigate the marketplace. This entry will be used for indexing listings across the platform.
                  </p>
               </div>

               <div className="space-y-4 pt-10 relative z-10">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 py-7 bg-indigo-600 text-white rounded-[28px] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} />}
                    {isEdit ? 'Update Category' : 'Push to System'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    className="w-full py-6 text-slate-400 rounded-[28px] font-black text-lg hover:text-rose-500 transition-all"
                  >
                    Cancel Changes
                  </button>
               </div>

               <AnimatePresence>
                 {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[28px] flex items-start gap-3">
                   <AlertCircle className="text-rose-500 shrink-0 mt-1" size={18} />
                   <p className="text-rose-200 font-bold text-xs leading-tight">{error}</p>
                 </motion.div>}

                 {success && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] flex items-start gap-3">
                   <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                   <p className="text-emerald-200 font-bold text-xs leading-tight">{success}</p>
                 </motion.div>}
               </AnimatePresence>
            </div>
         </div>
      </form>
    </div>
  );
}
