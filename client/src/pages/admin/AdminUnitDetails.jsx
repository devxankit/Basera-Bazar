import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Plus, Trash2, Tag, 
  Hash, Package, Activity, Clock, 
  ChevronRight, Eye, MoreVertical, User,
  Zap, Loader2, Info, ShieldCheck, Target, TrendingUp, CheckCircle2, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminUnitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      try {
        const response = await api.get(`/admin/system/units/${id}`);
        if (response.data.success) {
          setUnit(response.data.data);
        }
      } catch (err) {
        setError("Failed to fetch unit details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnitDetails();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete unit "${unit.name}"?`)) {
      try {
        await api.delete(`/admin/system/units/${id}`);
        navigate('/admin/products/units');
      } catch (err) {
        alert("Failed to delete unit protocol.");
      }
    }
  };

  const toggleStatus = async () => {
    try {
      const response = await api.put(`/admin/system/units/${id}`, { is_active: !unit.is_active });
      if (response.data.success) {
        setUnit({ ...unit, is_active: !unit.is_active });
      }
    } catch (err) {
      alert("Operational failure during status update.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[12px]">Fetching Unit Genome...</p>
    </div>
  );

  if (error || !unit) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || "Unit Registry Error"}</h2>
      <button onClick={() => navigate('/admin/products/units')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Return to Taxonomy</button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/products/units')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="relative w-24 h-24 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl uppercase font-semibold text-3xl tracking-tighter">
                          {unit.abbreviation || 'UN'}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{unit.name}</h2>
                          <span className={cn(
                             "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                             unit.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                             {unit.is_active ? 'Active Profile' : 'Suspended'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Unit Taxonomy</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded border border-orange-100">Key: {unit?._id?.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/products/units/edit/${id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Refine Unit Module
                 </button>
                 <button 
                    onClick={toggleStatus}
                    className={cn(
                      "px-6 py-3 font-semibold text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 active:scale-95",
                      unit.is_active ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                 >
                    <Zap size={14} className={cn(unit.is_active ? "text-rose-400" : "text-emerald-300")} />
                    {unit.is_active ? 'Halt Operations' : 'Commence Operations'}
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
                { label: 'Global References', value: unit.productNameCount || 0, sub: 'Linked Identifiers', icon: Tag, color: 'text-indigo-500' },
                { label: 'Asset Utilization', value: 0, sub: 'Active Store Listings', icon: Package, color: 'text-orange-500' },
                { label: 'Classification', value: unit.unit_type || 'STANDARD', sub: 'Matrix Block', icon: Activity, color: 'text-purple-500' },
                { label: 'Registry Date', value: new Date(unit.createdAt).toLocaleDateString('en-GB'), sub: 'Framework Refresh', icon: Clock, color: 'text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums uppercase">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-8">
             {/* Master Unit Index Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                         <Hash size={16} />
                      </div>
                      <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Index Connections Matrix</h3>
                   </div>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-400 uppercase tracking-widest">v4.0 Protocol</span>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50/50">
                            {['Product Cluster', 'Classification', 'Connectivity', 'Operational Hub'].map(h => (
                               <th key={h} className="px-8 py-5 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {unit.productNames && unit.productNames.length > 0 ? (
                            unit.productNames.map((pn) => (
                               <tr key={pn._id} className="group hover:bg-slate-50/20 transition-all">
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-300 shadow-inner group-hover:bg-white group-hover:border-indigo-100 transition-colors uppercase">Unit</div>
                                        <div className="flex flex-col space-y-1">
                                           <span className="text-[15px] font-semibold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{pn.name}</span>
                                           <span className="text-[11px] font-medium text-slate-300 uppercase tracking-widest uppercase">Ref: #{pn._id?.slice(-6).toUpperCase()}</span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6">
                                     <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest group-hover:bg-white group-hover:border-orange-100 group-hover:text-orange-500 transition-all">
                                        {pn.category_id?.name || 'Classified'}
                                     </span>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest shadow-sm">
                                        <CheckCircle2 size={10} /> Linked
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn">
                                           <Eye size={16} />
                                        </button>
                                        <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-95 group/btn">
                                           <Edit2 size={16} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                            ))
                         ) : (
                            <tr>
                               <td colSpan="4" className="px-8 py-20 text-center">
                                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                     <Hash size={32} className="text-slate-300" />
                                  </div>
                                  <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">No Unit Connectivity Detected</p>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
 
          <div className="md:col-span-4 space-y-8">
             {/* Registry Metadata Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Registry Metadata Base</h3>
               </div>
               <div className="p-8 space-y-8">
                  {[
                    { label: 'System Hash Ref', value: id, icon: Hash },
                    { label: 'Primary Nomenclature', value: unit.name, icon: Tag },
                    { label: 'Taxonomy Code', value: unit.abbreviation.toUpperCase(), icon: Target },
                    { label: 'Induction Log', value: new Date(unit.createdAt).toLocaleString('en-GB'), icon: Clock },
                    { label: 'Last Sync Result', value: new Date(unit.updatedAt).toLocaleTimeString('en-GB'), icon: Activity }
                  ].map((item, i) => (
                    <div key={i} className="group border-b border-slate-50 last:border-0 pb-4 last:pb-0 space-y-2">
                       <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <item.icon size={10} className="text-indigo-500/60" /> {item.label}
                       </p>
                       <p className="text-sm font-semibold text-slate-900 break-all select-all tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.value}</p>
                    </div>
                  ))}
               </div>
             </div>
 
             {/* System Sync Helper */}
             <div className="bg-slate-900 border border-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/40 transition-all duration-700" />
                <div className="flex flex-col gap-6 relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                         <Hash size={20} />
                      </div>
                      <p className="text-[12px] font-semibold uppercase tracking-widest leading-relaxed">
                        Taxonomy Governance <span className="text-indigo-400">Sync Active</span>
                      </p>
                   </div>
                   <p className="text-[12px] font-medium text-white/40 leading-relaxed italic uppercase tracking-wider">
                      Note: Unit conversions are applied globally based strictly on operational taxonomy mappings across all platform nodes.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
