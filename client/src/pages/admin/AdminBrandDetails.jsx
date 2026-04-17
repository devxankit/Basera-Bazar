import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Plus, Trash2, Tag, 
  Hash, Package, Activity, Clock, 
  ChevronRight, Eye, MoreVertical, User,
  Zap, Loader2, Info, ShieldCheck, Target, TrendingUp, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminBrandDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBrandDetails = async () => {
    try {
      const response = await api.get(`/admin/system/brands/${id}`);
      if (response.data.success) {
        setBrand(response.data.data);
      }
    } catch (err) {
      setError("Failed to fetch brand details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandDetails();
  }, [id]);

  const toggleStatus = async () => {
    try {
      const response = await api.put(`/admin/system/brands/${id}`, { is_active: !brand.is_active });
      if (response.data.success) {
        setBrand({ ...brand, is_active: !brand.is_active });
      }
    } catch (err) {
      alert("Failed to update brand status.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this brand permanently? This will remove all platform associations.")) {
      try {
        await api.delete(`/admin/system/brands/${id}`);
        navigate('/admin/products/brands');
      } catch (err) {
        alert("Deletion failed.");
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-xs">Syncing Brand Metadata...</p>
    </div>
  );

  if (error || !brand) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">{error || 'Brand Registry Error'}</h2>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Return to Directory</button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/products/brands')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="relative w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl uppercase font-semibold text-2xl tracking-tighter">
                          {brand.name?.slice(0, 2) || 'BR'}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{brand.name}</h2>
                          <span className={cn(
                             "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                             brand.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                             {brand.is_active ? 'Active Core' : 'Offline'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Brand Protocol</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-medium text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded border border-orange-100">ID: {brand?._id?.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/products/brands/edit/${id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Refine Matrix
                 </button>
                 <button 
                    onClick={toggleStatus}
                    className={cn(
                      "px-6 py-3 font-semibold text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 active:scale-95",
                      brand.is_active ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                 >
                    <Zap size={14} className={cn(brand.is_active ? "text-rose-400" : "text-emerald-300")} />
                    {brand.is_active ? 'Halt Process' : 'Inject Energy'}
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="p-3 border border-slate-200 bg-white text-rose-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Domain Links', value: brand.productNameCount || 0, sub: 'Linked Identifiers', icon: Hash, color: 'text-indigo-500' },
                { label: 'Asset Clusters', value: 0, sub: 'Active Listings', icon: Package, color: 'text-orange-500' },
                { label: 'Market Delta', value: '8.2%', sub: 'Growth Index', icon: TrendingUp, color: 'text-purple-500' },
                { label: 'Last Registry', value: new Date(brand.updatedAt).toLocaleDateString('en-GB'), sub: 'System Refresh', icon: Clock, color: 'text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-8">
             {/* Master Domain Index Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                         <Package size={16} />
                      </div>
                      <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Associated Domain Index</h3>
                   </div>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-400 uppercase tracking-widest">Protocol v4.0</span>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50/50">
                            {['Cluster Asset', 'Taxonomy Node', 'State Status', 'Operational Hub'].map(h => (
                               <th key={h} className="px-8 py-5 text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {brand.productNames?.length > 0 ? brand.productNames.map((pn) => (
                            <tr key={pn._id} className="group hover:bg-slate-50/20 transition-all">
                               <td className="px-8 py-6">
                                  <div className="flex flex-col gap-0.5">
                                     <span className="text-base font-semibold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{pn.name}</span>
                                     <span className="text-[11px] font-medium text-slate-300 uppercase tracking-widest">ID: #{pn._id?.slice(-6).toUpperCase()}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest group-hover:bg-white group-hover:border-indigo-100 group-hover:text-indigo-500 transition-all">
                                     {pn.category_id?.name || 'Unmapped'}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                     <div className={cn("w-1.5 h-1.5 rounded-full", pn.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                                     <span className={cn(
                                        "text-[11px] font-semibold uppercase tracking-widest",
                                        pn.is_active ? "text-emerald-600" : "text-slate-400"
                                     )}>{pn.is_active ? 'Online' : 'Hibernating'}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <button onClick={() => navigate(`/admin/products/names/view/${pn._id}`)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn">
                                     <Eye size={16} />
                                  </button>
                               </td>
                            </tr>
                         )) : (
                            <tr>
                               <td colSpan="4" className="px-8 py-20 text-center">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                     <Package size={24} className="text-slate-300" />
                                  </div>
                                  <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">No Domain Association Logs Detected</p>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
 
          <div className="md:col-span-4 space-y-8">
             {/* Configuration Status Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Operational Governance</h3>
               </div>
               <div className="p-8 space-y-8">
                  <div className="flex flex-col gap-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                           <Target size={10} className="text-indigo-500" /> Origin Strategy
                        </label>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                           <p className="text-sm font-semibold text-slate-900 uppercase">System Operator Presence</p>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                           <Activity size={10} className="text-indigo-500" /> Network Sync
                        </label>
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600">
                           <CheckCircle2 size={16} />
                           <p className="text-[11px] font-semibold uppercase tracking-widest">Propagation Optimal</p>
                        </div>
                     </div>
                  </div>
   
                  <button 
                    onClick={() => navigate(`/admin/products/brands/edit/${id}`)}
                    className="flex items-center justify-center w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-[12px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                     Recalibrate Node
                  </button>
               </div>
             </div>
 
             {/* System Footer Mini */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
                <div className="flex items-center gap-4 text-slate-400">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Zap size={18} className="text-orange-500 opacity-60" />
                   </div>
                   <p className="text-[12px] font-semibold uppercase tracking-widest leading-relaxed">
                      Brand Governance <span className="text-indigo-600">Active</span> v4.2.0
                   </p>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.2em]">BaseraBazar OS</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
