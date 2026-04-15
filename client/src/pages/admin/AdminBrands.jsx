import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit2, Trash2, 
  Layers, Loader2, Package, Tag, 
  ArrowRight, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminBrands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/system/brands');
      if (response.data.success) {
        setBrands(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        const response = await api.delete(`/admin/system/brands/${id}`);
        if (response.data.success) {
          setBrands(brands.filter(b => b._id !== id));
        }
      } catch (error) {
        alert(error.response?.data?.message || "Delete failed.");
      }
    }
  };

  const filteredData = Array.isArray(brands) ? brands.filter(brand => {
    const name = (brand.name || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return name.includes(search);
  }) : [];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Product Brands</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">
            Manage product brands and manufacturers available on the platform.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/products/brands/add')}
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 text-[14px] w-fit"
        >
          <Plus size={20} strokeWidth={3} />
          Add New Brand
        </button>
      </div>

      {/* Standard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Brands', value: brands.length, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Brands', value: brands.filter(b => b.is_active).length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Restricted', value: brands.filter(b => !b.is_active).length, color: 'text-rose-600 bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.color}`}><Layers size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Standard Table Card */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Brand Registry Index</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredData.length} entries</span>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder-slate-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4">Loading Brands...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center text-slate-300">
                    <Package size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-sm">No brands found</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((brand) => (
                  <tr key={brand._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 text-lg uppercase overflow-hidden">
                          {brand.logo ? (
                            <img src={brand.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            brand.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{brand.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {String(brand._id).slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${brand.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {brand.is_active ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/products/brands/view/${brand._id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/products/brands/edit/${brand._id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(brand._id, brand.name)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Registry Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Managed Brands: {brands.length}
            </p>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</div>
               <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300">
                  <ArrowRight size={14} />
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
