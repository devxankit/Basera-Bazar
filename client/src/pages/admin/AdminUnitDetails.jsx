import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Plus, Trash2, Tag, 
  Hash, Package, Activity, Clock, 
  ChevronRight, Eye, MoreHorizontal, User,
  Zap, Loader2, Info
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

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
    if (window.confirm(`Are you sure you want to delete unit "${unit.name}"?`)) {
      try {
        await api.delete(`/admin/system/units/${id}`);
        navigate('/admin/products/units');
      } catch (err) {
        alert("Failed to delete unit");
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
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-slate-200" size={60} />
        <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] mt-8">Fetching Unit Genome...</p>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="p-10 text-center text-rose-500 font-bold">{error || "Unit not found"}</div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/products/units')}
            className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Taxonomy</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{unit.name} Overview</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Unit Details</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate(`/admin/products/units/edit/${id}`)}
             className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-amber-100 transition-all active:scale-95 flex items-center gap-3 text-sm"
           >
             <Edit2 size={18} strokeWidth={3} />
             MODIFY UNIT
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column: Information Card */}
         <div className="lg:col-span-8 space-y-10">
            {/* Unit Info Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
               <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Activity size={18} className="text-slate-900" />
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Information</h3>
                  </div>
                  <button onClick={() => navigate(`/admin/products/units/edit/${id}`)} className="text-amber-600 bg-amber-50 p-2 rounded-xl hover:bg-amber-100 transition-colors">
                     <Edit2 size={16} />
                  </button>
               </div>
               
               <div className="p-10 flex flex-col md:flex-row gap-12 items-center">
                  <div className="w-40 h-40 rounded-[2rem] bg-slate-50 flex items-center justify-center relative group shrink-0 select-none border border-slate-100">
                     <div className="text-6xl font-black text-slate-200 uppercase group-hover:scale-110 transition-transform duration-500">
                        {unit?.abbreviation?.slice(0, 2) || unit?.name?.slice(0, 2) || 'UN'}
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-12 flex-grow">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Name</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{unit?.name}</h4>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Abbreviation</p>
                        <h4 className="text-xl font-black text-rose-500 tracking-tight">{unit?.abbreviation}</h4>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</p>
                        <h4 className="text-sm font-black text-slate-700 tracking-tight">{unit?.name} ({unit?.abbreviation})</h4>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Type</p>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                           <Activity size={10} strokeWidth={3} />
                           {unit?.unit_type || 'Other'}
                        </span>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                           unit?.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${unit?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                           {unit?.is_active ? 'Active' : 'Offline'}
                        </span>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Created On</p>
                        <h4 className="text-sm font-black text-slate-700 tracking-tight">
                           {unit?.createdAt ? new Date(unit.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </h4>
                     </div>
                  </div>
               </div>
            </div>

            {/* Usage Stats Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
                  <Activity size={18} className="text-slate-900" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Usage Statistics</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-10 flex items-center justify-between border-r border-slate-50 bg-slate-50/20 group hover:bg-white transition-colors">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Names Using This Unit</p>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tight tabular-nums group-hover:scale-105 transition-transform duration-300">
                           {unit.productNameCount || 0}
                        </h4>
                     </div>
                     <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <Tag size={24} />
                     </div>
                  </div>
                  <div className="p-10 flex items-center justify-between group hover:bg-slate-50/30 transition-colors">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Product Listings</p>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tight tabular-nums group-hover:scale-105 transition-transform duration-300">0</h4>
                     </div>
                     <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                        <Package size={24} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Related Items List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Tag size={18} className="text-slate-900" />
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Product Names Using This Unit ({unit.productNameCount || 0})
                     </h3>
                  </div>
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                     View All
                  </button>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50/50">
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Product Info</th>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Category</th>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-center">Status</th>
                           <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {unit.productNames && unit.productNames.length > 0 ? (
                           unit.productNames.map((pn) => (
                              <tr key={pn._id} className="group hover:bg-slate-50/30 transition-colors">
                                 <td className="px-8 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300">IMG</div>
                                       <p className="text-sm font-black text-slate-700">{pn.name}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{pn.category_id?.name || 'N/A'}</span>
                                 </td>
                                 <td className="px-8 py-4 text-center">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
                                 </td>
                                 <td className="px-8 py-4">
                                    <div className="flex items-center justify-end gap-2 outline-none">
                                       <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm">
                                          <Eye size={12} />
                                       </button>
                                       <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 transition-all active:scale-95 shadow-sm">
                                          <Edit2 size={12} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-8 py-10 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                 No linked product names found.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Column: Actions & Metadata */}
         <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-6">
                  <MoreHorizontal size={18} className="text-slate-900" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Quick Actions</h3>
               </div>
               
               <button 
                  onClick={() => navigate(`/admin/products/units/edit/${id}`)}
                  className="w-full flex items-center justify-between p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition-all shadow-lg shadow-amber-100 active:scale-[0.98]"
               >
                  <span className="text-xs font-black uppercase tracking-widest">Edit Unit Node</span>
                  <Edit2 size={16} strokeWidth={3} />
               </button>

               <button className="w-full flex items-center justify-between p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]">
                  <span className="text-xs font-black uppercase tracking-widest">Add Product Name</span>
                  <Tag size={16} strokeWidth={3} />
               </button>

               <button 
                  onClick={toggleStatus}
                  className={`w-full flex items-center justify-between p-4 ${unit.is_active ? 'bg-slate-600 hover:bg-slate-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-2xl transition-all shadow-lg active:scale-[0.98] shadow-slate-100`}
               >
                  <span className="text-xs font-black uppercase tracking-widest">{unit.is_active ? 'Deactivate Unit' : 'Activate Unit'}</span>
                  <Zap size={16} strokeWidth={3} />
               </button>

               <button 
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-lg shadow-rose-100 active:scale-[0.98]"
               >
                  <span className="text-xs font-black uppercase tracking-widest">Delete Unit From DB</span>
                  <Trash2 size={16} strokeWidth={3} />
               </button>
            </div>

            {/* Detailed Info Sidebar */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <Info size={16} className="text-slate-900" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-justify">System Metadata</h3>
               </div>
               
               <div className="space-y-6">
                  {[
                    { label: 'System Reference ID', value: id, icon: User },
                    { label: 'Canonical Name', value: unit.name, icon: Tag },
                    { label: 'Taxonomy Code', value: unit.abbreviation.toUpperCase(), icon: Hash },
                    { label: 'Classification', value: unit.unit_type || 'NONE', icon: Activity },
                    { label: 'Created At', value: new Date(unit.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), icon: Clock },
                    { label: 'Last Updated', value: new Date(unit.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="group border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2">
                          <item.icon size={10} className="text-indigo-400" /> {item.label}
                       </p>
                       <p className="text-[12px] font-black text-slate-800 break-all select-all tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.value}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Navigation Helpers */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/admin/products/units')}
                  className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest group"
                >
                   <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                   Back to Unit Registry
                </button>
                <button className="w-full flex items-center justify-between px-6 py-4 border border-indigo-100 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all font-black text-[10px] uppercase tracking-widest">
                   <Activity size={14} />
                   View Unit Performance
                </button>
                <button className="w-full flex items-center justify-between px-6 py-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest">
                   <Tag size={14} />
                   View Linked Entities
                </button>
            </div>
         </div>
      </div>
    </div>
  );
}
