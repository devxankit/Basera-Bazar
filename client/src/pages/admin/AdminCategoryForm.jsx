import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Tag, Image, Save, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

export default function AdminCategoryForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const parentIdFromUrl = searchParams.get('parent');
  const typeFromUrl = searchParams.get('type') || 'property';

  const [formData, setFormData] = useState({
    name: '', type: typeFromUrl, parent_id: parentIdFromUrl && parentIdFromUrl !== 'null' ? parentIdFromUrl : null,
    icon: '', mandi_icon: '', description: '', is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [availableParents, setAvailableParents] = useState([]);
  const [fetchingParents, setFetchingParents] = useState(false);

  // Fetch Parent Categories for the current type
  const fetchParents = async (type) => {
    setFetchingParents(true);
    try {
      const res = await api.get(`/admin/system/categories?type=${type}&parent_id=null`);
      if (res.data.success) {
        // Exclude current category if editing to prevent circular dependency
        setAvailableParents(res.data.data.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error("Error fetching parents:", err);
    } finally {
      setFetchingParents(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (isEdit) {
          const res = await api.get(`/admin/system/categories/${id}`);
          if (res.data.success) {
            const data = res.data.data;
            setFormData({
              ...data,
              parent_id: data.parent_id?._id || data.parent_id || null
            });
            await fetchParents(data.type);
          }
        } else {
          await fetchParents(typeFromUrl);
        }
      } catch (err) {
        setError("Failed to fetch reference data.");
      } finally {
        setInitLoading(false);
      }
    };
    fetchDetails();
  }, [id, isEdit]);

  // When type changes, re-fetch parents
  useEffect(() => {
    if (!isEdit && !initLoading) {
      fetchParents(formData.type);
      // Reset parent if type changes (except if it's explicitly set from URL initially)
      if (!parentIdFromUrl) setFormData(prev => ({ ...prev, parent_id: null }));
    }
  }, [formData.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = { ...formData };
      if (!payload.parent_id || payload.parent_id === 'null') payload.parent_id = null;

      const res = isEdit 
        ? await api.put(`/admin/system/categories/${id}`, payload)
        : await api.post('/admin/system/categories', payload);

      if (res.data.success) {
        setSuccess(`Category managed successfully!`);
        setTimeout(() => {
           navigate(-1);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Matrix...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 mt-4 animate-in fade-in duration-500">
      {/* Header Board */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Taxonomy</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Modify Entry' : 'Create New Classification'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase tracking-widest">
              Type: {formData.type}
           </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2.5">
               <Tag size={16} className="text-slate-400" />
               <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Identity & Hierarchy</span>
             </div>
             
             <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className={labelClass}>Registry Name <span className="text-rose-500">*</span></label>
                    <input required className={inputClass} placeholder="Ex: Residential Apartments, Plumbing, Brick Supplier..." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>

                  <div>
                    <label className={labelClass}>Market Module</label>
                    <select 
                      className={inputClass} 
                      value={formData.type} 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={isEdit}
                    >
                      <option value="property">Real Estate (Properties)</option>
                      <option value="service">Technical Services</option>
                      <option value="supplier">Bulk Suppliers</option>
                      <option value="product">Inventory Products</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Parent Category</label>
                    <select 
                      className={inputClass} 
                      value={formData.parent_id || ''} 
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                    >
                      <option value="">None (Top Level Category)</option>
                      {availableParents.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    {fetchingParents && <p className="text-[10px] text-indigo-500 font-bold mt-1 animate-pulse">Fetching {formData.type} parents...</p>}
                  </div>
               </div>

               <div>
                 <label className={labelClass}>Public Brief (SEO)</label>
                 <textarea className={`${inputClass} resize-none`} rows={4} placeholder="Detailed description for this classification node..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
               </div>
             </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           {!formData.parent_id && (
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2.5">
                 <Layers size={16} className="text-slate-400" />
                 <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Visual Identity</span>
               </div>
                <div className="p-6 space-y-6">
                   <MediaDropZone 
                     value={formData.icon ? [formData.icon] : []}
                     onChange={(urls) => setFormData({ ...formData, icon: urls[0] || '' })}
                     multiple={false}
                     label="Category Icon (Standard)"
                   />

                   {(formData.type === 'supplier' || formData.type === 'product') && (
                     <div className="pt-4 border-t border-slate-100">
                        <MediaDropZone 
                          value={formData.mandi_icon ? [formData.mandi_icon] : []}
                          onChange={(urls) => setFormData({ ...formData, mandi_icon: urls[0] || '' })}
                          multiple={false}
                          label="Basera Bazar Icon (Premium)"
                        />
                        <p className="mt-2 text-[10px] text-slate-400 italic">
                          Used specifically in the Basera Bazar marketplace section.
                        </p>
                     </div>
                   )}
                </div>
             </div>
           )}

           <div className="bg-slate-900 border border-slate-900 rounded-xl p-6 text-white space-y-6">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node Status</span>
                 <button 
                   type="button"
                   onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                   className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                     formData.is_active ? 'bg-emerald-600' : 'bg-slate-700'
                   }`}
                 >
                    {formData.is_active ? 'Active' : 'Offline'}
                 </button>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                 <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                 >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isEdit ? 'Update Node' : 'Initialize Category'}
                 </button>
                 
                 {error && (
                   <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase tracking-tighter">
                      <AlertCircle size={14} /> {error}
                   </div>
                 )}
                 {success && (
                   <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-tighter">
                      <CheckCircle2 size={14} /> {success}
                   </div>
                 )}
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}
