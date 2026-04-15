import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, Edit2, Trash2, 
  Hash, Layers, Loader2, Package, Tag, 
  ArrowRight, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminProductUnits() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/system/units');
      if (response.data.success) {
        setUnits(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete unit "${name}"?`)) {
      try {
        const response = await api.delete(`/admin/system/units/${id}`);
        if (response.data.success) {
          setUnits(units.filter(u => u._id !== id));
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete unit");
      }
    }
  };

  const filteredData = Array.isArray(units) ? units.filter(unit => {
    const name = (unit.name || '').toLowerCase();
    const abbr = (unit.abbreviation || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return name.includes(search) || abbr.includes(search);
  }) : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <Tag size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Root Taxonomy System</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Product Units</h1>
            <p className="text-slate-500 font-medium text-sm mt-0.5">Manage measurement units like Kilograms, Pieces, Square Feet.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/admin/products/units/add')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 text-sm"
        >
          <Plus size={20} strokeWidth={3} />
          REGISTER NEW UNIT
        </button>
      </div>

      {/* Repository Index Bar */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Repository Live Index</span>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Count:</span>
                <span className="text-sm font-black text-slate-900">{units.length} Nodes</span>
             </div>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sync:</span>
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">OK</span>
             </div>
          </div>
        </div>

        {/* Search Area */}
        <div className="p-8">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="SEARCH WITHIN UNITS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-slate-900 font-black text-sm tracking-widest transition-all appearance-none uppercase placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Entries</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-slate-300 mx-auto" size={40} />
                    <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mt-4">Loading repository data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                    No units found in the repository.
                  </td>
                </tr>
              ) : (
                filteredData.map((unit) => (
                  <tr key={unit?._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-white group-hover:border-slate-200 transition-all">
                          {unit?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-[15px] tracking-tight">{unit?.name || 'Untitled Unit'}</p>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{unit?.abbreviation || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                        {unit?.unit_type || 'NONE LINKED'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        unit?.is_active 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${unit?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {unit?.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <Hash size={14} className="text-slate-300" />
                         <span className="text-sm font-black text-slate-900 tabular-nums">0</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/products/units/view/${unit?._id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <Eye size={14} /> VIEW
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/products/units/edit/${unit?._id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <Edit2 size={14} /> EDIT
                        </button>
                        <button 
                          onClick={() => handleDelete(unit?._id, unit?.name)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-600 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <Trash2 size={14} /> PURGE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination/Footer Info */}
        {!loading && filteredData.length > 0 && (
          <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Showing {filteredData.length} of {units.length} total repository nodes
            </p>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
