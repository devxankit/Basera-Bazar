import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tag, Layers, Plus, Edit2, Trash2, ArrowLeft, 
  Search, Filter, Info, ChevronRight, LayoutGrid,
  Building2, Briefcase, Package, User, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function AdminCategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Subcategories');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/system/categories/${id}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError("Taxonomy entry not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async (catId, isSub = false) => {
    if (!window.confirm(`Are you sure you want to deactivate this ${isSub ? 'subcategory' : 'category'}? It will be hidden from the marketplace.`)) return;
    try {
      const res = await api.delete(`/admin/system/categories/${catId}`);
      if (res.data.success) {
        if (isSub) {
           setData(prev => ({ ...prev, subcategories: prev.subcategories.filter(s => s._id !== catId) }));
        } else {
           navigate(-1);
        }
      }
    } catch (err) {
      alert("Deactivation failed.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 border-r-2 border-r-transparent"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Retrieving Taxonomy Structure...</p>
    </div>
  );

  if (error || !data) return (
    <div className="bg-white rounded-[40px] p-20 text-center space-y-6 shadow-2xl border border-rose-50 border-t-rose-500 border-t-8 max-w-2xl mx-auto mt-20">
       <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto"><AlertCircle className="text-rose-500" size={48} /></div>
       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Taxonomy Not Found</h2>
       <p className="text-slate-500">This category ID does not exist in our marketplace registry.</p>
       <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Return</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Dynamic Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
               <ArrowLeft size={24} />
            </button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{data.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    data.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {data.is_active ? 'Active Tier' : 'Inactive'}
                  </span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                 Marketplace / {data.type} / <span className="text-indigo-600 underline decoration-indigo-200">{data.name}</span>
               </p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(data.parent_id ? `/admin/properties/categories/edit/${data._id}?parent=${data.parent_id._id}` : `/admin/properties/categories/edit/${data._id}`)}
              className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
            >
               <Edit2 size={18} />
               Modify
            </button>
            <button 
              onClick={() => handleDelete(data._id)}
              className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-sm border border-rose-100"
            >
               <Trash2 size={18} />
               Deactivate
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
         {/* Stats Sidebar */}
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-8 shadow-3xl overflow-hidden relative border border-white/5">
               <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-[80px]" />
               
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Module Usage</p>
                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { l: 'Property Listings', v: data.stats?.properties || 0, icon: Building2 },
                        { l: 'Child Categories', v: data.subcategories?.length || 0, icon: Layers },
                        { l: 'Active Leads', v: 0, icon: User }
                     ].map((s, i) => (
                        <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <s.icon size={16} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.l}</span>
                           </div>
                           <span className="text-lg font-black">{s.v}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl space-y-6">
               <div className="flex items-center gap-3">
                  <Info className="text-indigo-600" size={18} />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Market SEO Note</h4>
               </div>
               <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                 "{data.description || 'No public specialized description has been defined for this taxonomy cluster yet.'}"
               </p>
            </div>
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[44px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
               <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div className="flex bg-white/50 p-1 rounded-2xl border border-slate-100">
                     {['Subcategories', 'Active Listings'].map(tab => (
                        <button 
                           key={tab}
                           onClick={() => setActiveTab(tab)}
                           className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                              activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
                           }`}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
                  {activeTab === 'Subcategories' && (
                     <button 
                       onClick={() => navigate(`/admin/properties/categories/add?parent=${data._id}&type=${data.type}`)}
                       className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                     >
                        <Plus size={16} />
                        Add Subcategory
                     </button>
                  )}
               </div>

               <div className="p-10">
                  {activeTab === 'Subcategories' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.subcategories && data.subcategories.length > 0 ? (
                           data.subcategories.map(sub => (
                              <div key={sub._id} className="group flex items-center justify-between p-6 rounded-[32px] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                       <Layers size={20} />
                                    </div>
                                    <div>
                                       <h5 className="font-black text-slate-800 text-sm">{sub.name}</h5>
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{sub.slug}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => navigate(`/admin/properties/categories/edit/${sub._id}`)}
                                      className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
                                    >
                                       <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(sub._id, true)}
                                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="col-span-2 py-20 text-center space-y-4">
                              <LayoutGrid className="mx-auto text-slate-200" size={48} />
                              <p className="text-slate-400 font-bold text-sm">No child categories registered under this tier yet.</p>
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="py-20 text-center space-y-4">
                        <Building2 className="mx-auto text-slate-200" size={48} />
                        <p className="text-slate-400 font-bold text-sm">Active listing cross-referencing coming soon...</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
