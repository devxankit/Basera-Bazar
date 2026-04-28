import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Eye, Edit2, Trash2, MapPin, Search, Filter, Layers, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';

export default function AdminServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [category, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serviceRes, catRes] = await Promise.all([
        api.get(`/admin/listings/service?status=${status === 'all' ? '' : status}&category_id=${category === 'all' ? '' : category}`),
        api.get('/admin/system/categories?type=service')
      ]);

      if (serviceRes.data.success) setServices(serviceRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/listings/${deleteId}`);
      if (res.data.success) {
        setServices(prev => prev.filter(s => s._id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      alert("Failed to delete service.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { 
      header: 'SERVICE', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
             <img src={row.thumbnail || 'https://via.placeholder.com/48?text=S'} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 tracking-tight truncate">{row.title}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-0.5">
              {row.category_id?.name || 'General Service'}
            </p>
          </div>
        </div>
      )
    },
    { 
      header: 'PROVIDER', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">{row.partner_id?.name || 'Central Partner'}</p>
          <p className="text-[11px] font-medium text-slate-400">{row.partner_id?.phone || 'No Phone'}</p>
        </div>
      )
    },
    { 
      header: 'METRICS', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <MapPin size={12} className="text-rose-400" />
            <span className="text-[10px]">{row.service_radius_km || 0}km</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <Clock size={12} className="text-amber-400" />
            <span className="text-[10px]">{row.years_of_experience || 0}y</span>
          </div>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
          row.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
          row.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-600' :
          'bg-amber-50 border-amber-100 text-amber-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            row.status === 'active' ? 'bg-emerald-500' : 
            row.status === 'rejected' ? 'bg-rose-500' : 
            'bg-amber-500 animate-pulse'
          }`} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {row.status}
          </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate(`/admin/services/view/${row._id}`)}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group relative"
          >
            <Eye size={18} className="transition-transform group-hover:scale-110" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">View</span>
          </button>

          {/* Status Toggle */}
          {row.status === 'pending_approval' ? (
            <button 
              onClick={async () => {
                try {
                  await api.patch(`/admin/listings/${row._id}/status`, { status: 'active' });
                  fetchData();
                } catch (err) { alert("Failed to approve."); }
              }}
              className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all group relative"
            >
              <CheckCircle2 size={18} className="transition-transform group-hover:scale-110" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Approve</span>
            </button>
          ) : (
            <button 
              onClick={async () => {
                try {
                  const nextStatus = row.status === 'active' ? 'inactive' : 'active';
                  await api.patch(`/admin/listings/${row._id}/status`, { status: nextStatus });
                  fetchData();
                } catch (err) { alert("Failed to toggle status."); }
              }}
              className={`p-2.5 rounded-xl transition-all group relative ${row.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
            >
              {row.status === 'active' ? <XCircle size={18} className="transition-transform group-hover:scale-110" /> : <CheckCircle2 size={18} className="transition-transform group-hover:scale-110" />}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {row.status === 'active' ? 'Deactivate' : 'Activate'}
              </span>
            </button>
          )}

          <button 
            onClick={() => navigate(`/admin/services/edit/${row._id}`)}
            className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all group relative"
          >
            <Edit2 size={18} className="transition-transform group-hover:scale-110" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
          </button>
          <button 
            onClick={() => setDeleteId(row._id)}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group relative"
          >
            <Trash2 size={18} className="transition-transform group-hover:scale-110" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px) font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
               <Briefcase size={20} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Management</p>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Service Catalog</h1>
           <p className="text-slate-500 font-medium max-w-lg mt-1">Manage, moderate and verify professional services listed across the marketplace network.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/services/add')}
          className="bg-slate-900 hover:bg-indigo-600 text-white font-black px-8 py-4 rounded-[24px] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 group uppercase tracking-widest text-xs"
        >
          <Plus size={20} className="transition-transform group-hover:rotate-90" />
          Register New Service
        </button>
      </div>

      {/* Unified Filter Bar */}
      <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8">
         <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <Filter size={18} className="text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Advanced Filters</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Registry</label>
               <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search title, ID or partner..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold transition-all text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service category</label>
               <div className="relative">
                  <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <select 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold appearance-none cursor-pointer transition-all text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moderate status</label>
               <div className="relative">
                  <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <select 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-bold appearance-none cursor-pointer transition-all text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">Every Status</option>
                    <option value="active">Active</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
               </div>
            </div>

            <div className="flex items-end">
               <button 
                  onClick={() => { setSearch(''); setCategory('all'); setStatus('all'); }}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
               >
                  <XCircle size={14} /> Clear All Configurations
               </button>
            </div>
         </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={services.filter(s => 
          s?.title?.toLowerCase()?.includes(search.toLowerCase()) || 
          s?.partner_id?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
          s?._id?.includes(search)
        )} 
        loading={loading} 
        searchPlaceholder="Filter result by keywords..."
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Permanently Delete Service?"
        message="This will remove the service listing from the marketplace and partner portal. Data recovery is not possible."
        type="danger"
      />
    </div>
  );
}
