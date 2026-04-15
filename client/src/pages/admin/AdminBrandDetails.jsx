import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Plus, Trash2, Tag, 
  Hash, Package, Activity, Clock, 
  ChevronRight, Eye, MoreHorizontal, User,
  Zap, Loader2, Info
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Loading Details...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Info size={40} className="text-rose-500" />
        <p className="text-slate-900 font-black text-lg">{error || 'Brand Not Found'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <button 
             onClick={() => navigate('/admin/products/brands')}
             className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
           >
             <ArrowLeft size={20} />
           </button>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Brand Details</h1>
             <p className="text-slate-500 font-medium text-sm mt-0.5">Management view for product brand identifier.</p>
           </div>
        </div>
        <button 
           onClick={() => navigate(`/admin/products/brands/edit/${id}`)}
           className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-3.5 rounded-xl shadow-lg shadow-amber-100 transition-all active:scale-95 flex items-center gap-2 text-sm uppercase tracking-widest"
        >
           <Edit2 size={16} />
           Edit Brand
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <Tag size={16} className="text-slate-900" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mt-0.5">Brand Information</h3>
                </div>
                <button onClick={() => navigate(`/admin/products/brands/edit/${id}`)} className="text-amber-600 bg-amber-50 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors text-[10px] font-black uppercase tracking-widest border border-amber-100">
                   Edit
                </button>
             </div>
             
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Brand Name</p>
                   <h4 className="text-2xl font-black text-slate-900 tracking-tight">{brand.name}</h4>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      brand.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                   }`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                   </span>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Brand ID</p>
                   <h4 className="text-sm font-bold text-slate-600 tracking-tight">#{String(brand._id).toUpperCase()}</h4>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Created By</p>
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-200">KK</div>
                      <h4 className="text-sm font-bold text-slate-700">kunal kamra</h4>
                   </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Created On</p>
                   <h4 className="text-sm font-bold text-slate-700 tracking-tight">
                      {new Date(brand.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </h4>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Updated</p>
                   <h4 className="text-sm font-bold text-slate-700 tracking-tight">
                      {new Date(brand.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </h4>
                </div>
             </div>
          </div>

          {/* Associated Product Names Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-[14px]">
             <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <Package size={16} className="text-slate-900" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mt-0.5">Associated Product Names</h3>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                   {brand.productNameCount || 0} items
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-50">
                         {['Product Name', 'Category', 'Status', 'Products', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {brand.productNames?.length > 0 ? brand.productNames.map((pn) => (
                         <tr key={pn._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                               <p className="text-sm font-bold text-slate-900">{pn.name}</p>
                               <p className="text-[10px] text-slate-400 font-medium">ID: #{String(pn._id).slice(-6).toUpperCase()}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm text-slate-600 font-medium">{pn.category_id?.name || 'Cement'}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${pn.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {pn.is_active ? 'Active' : 'Offline'}
                               </span>
                            </td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4">
                               <button onClick={() => navigate(`/admin/products/names/view/${pn._id}`)} className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-600 rounded-md hover:bg-amber-50 transition-colors text-[10px] font-black uppercase tracking-widest">
                                  <Eye size={12} /> View
                               </button>
                            </td>
                         </tr>
                      )) : (
                         <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-300 italic font-medium">
                               No associated product names found.
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-8">
           {/* Summary Stats */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <Activity size={16} className="text-slate-900" />
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mt-0.5">Statistics</h3>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[12px] font-medium text-slate-600">Product Names</span>
                       <span className="bg-teal-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded leading-none">{brand.productNameCount || 0}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-teal-500" style={{ width: `${Math.min((brand.productNameCount || 0) * 10, 100)}%` }}></div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <span className="text-[12px] font-medium text-slate-400">Total Products</span>
                    <span className="text-[12px] font-black text-slate-900">0</span>
                 </div>

                 <div className="flex items-center justify-between border-t border-slate-50 pt-4 pb-2">
                    <span className="text-[12px] font-medium text-slate-600">Approved Products</span>
                    <span className="bg-emerald-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded leading-none">0</span>
                 </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex gap-3 text-teal-700">
                 <Info size={16} className="shrink-0" />
                 <p className="text-[12px] font-medium leading-relaxed">
                    Note: This brand is being used by 0 product listing(s) across the platform.
                 </p>
              </div>
           </div>

           {/* Actions */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-6">
                 <Zap size={16} className="text-slate-900 fill-slate-900" />
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mt-0.5">Quick Actions</h3>
              </div>

              <button 
                 onClick={() => navigate(`/admin/products/brands/edit/${id}`)}
                 className="w-full flex items-center justify-center gap-2 p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-md active:scale-95 text-xs font-black uppercase tracking-widest"
              >
                 <Edit2 size={16} /> Edit Brand
              </button>

              <button 
                 onClick={toggleStatus}
                 className="w-full flex items-center justify-center gap-2 p-3.5 bg-slate-500 hover:bg-slate-600 text-white rounded-xl transition-all shadow-md active:scale-95 text-xs font-black uppercase tracking-widest"
              >
                 <Zap size={16} className={brand.is_active ? 'opacity-50' : 'animate-pulse'} />
                 {brand.is_active ? 'Deactivate Brand' : 'Activate Brand'}
              </button>

              <button 
                 onClick={handleDelete}
                 className="w-full flex items-center justify-center gap-2 p-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-md active:scale-95 text-xs font-black uppercase tracking-widest"
              >
                 <Trash2 size={16} /> Delete Brand
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
