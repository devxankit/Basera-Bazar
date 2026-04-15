import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, RefreshCw, GripVertical, PauseCircle, PlayCircle, Layout, ChevronRight, Settings2, ToggleLeft, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system/banners');
      if (res.data.success) {
        setBanners(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await api.delete(`/admin/system/banners/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting banner');
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/system/banners/${id}`, { is_active: !currentStatus });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const columns = [
    {
      header: '#',
      render: (row, idx) => (
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300 cursor-grab active:cursor-grabbing" />
          <span className="text-[11px] font-bold text-slate-400 tabular-nums">{banners.length - idx}</span>
        </div>
      )
    },
    {
      header: 'Preview',
      render: (row) => (
        <div className="w-20 h-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center relative group">
           {row.image_url ? (
             <img src={row.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
           ) : (
             <Layout size={16} className="text-slate-300" />
           )}
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Eye size={12} className="text-white shadow-sm" />
           </div>
        </div>
      )
    },
    {
      header: 'Title & Description',
      render: (row) => (
        <div className="space-y-0.5 max-w-xs transition-all group-hover:translate-x-1">
          <p className="font-bold text-slate-800 tracking-tight text-[13px] truncate">{row.title || 'Untitled Banner'}</p>
          <p className="text-[10px] font-medium text-slate-400 line-clamp-1 italic">{row.description || 'No description provided for this banner'}</p>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (row) => (
        <div className="flex items-center gap-1.5">
           <span className="bg-[#5d6778] text-white px-2 py-0.5 rounded text-[10px] font-medium tabular-nums shadow-sm">
             {row.priority || 50}
           </span>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.1em] ${
          row.is_active !== false 
            ? 'bg-[#4ade80] text-white shadow-sm shadow-emerald-100' 
            : 'bg-rose-500 text-white shadow-sm shadow-rose-100'
        }`}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Schedule',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] italic opacity-80 uppercase tracking-tighter">
           {row.start_date ? 'Custom' : 'Always'}
        </div>
      )
    },
    {
      header: 'Created',
      render: (row) => (
        <p className="text-[11px] font-medium text-slate-400 tabular-nums uppercase tracking-tighter italic">
          {new Date(row.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/banners/view/${row._id}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-orange-100 text-orange-500 hover:bg-orange-50 active:scale-95 transition-all shadow-xs"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button 
            onClick={() => navigate(`/admin/banners/edit/${row._id}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-orange-100 text-[#fa641e] hover:bg-orange-50 active:scale-95 transition-all shadow-xs"
            title="Edit Banner"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => toggleStatus(row._id, row.is_active !== false)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 shadow-xs ${
              row.is_active !== false 
                ? 'border-slate-100 text-slate-400 hover:bg-slate-50' 
                : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'
            }`}
            title={row.is_active !== false ? "Deactivate Banner" : "Activate Banner"}
          >
            {row.is_active !== false ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
          </button>
          <button 
            onClick={() => handleDelete(row._id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-rose-100 text-rose-400 hover:bg-rose-100 transition-all active:scale-95 shadow-xs"
            title="Delete Banner"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20 mt-4 animate-in fade-in duration-700">
      {/* Platform Breadcrumb Header */}
      <div className="px-8 py-4 flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-tight">
         <span className="text-slate-800 font-bold">Banner Management</span>
         <span className="text-slate-300">/</span>
         <Link to="/admin/dashboard" className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors lowercase">Home</Link>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 space-y-8 mt-2">
        {/* Metric Header Block */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
           <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-slate-100/50">
                 <Layout size={28} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase tracking-tighter">Banner Management</h2>
                 <p className="text-slate-400 text-sm font-medium mt-1.5 italic">Manage homepage carousel banners</p>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="flex gap-8">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Banners</p>
                    <h3 className="text-4xl font-black text-slate-900 mt-2 italic tabular-nums">{banners.length}</h3>
                 </div>
                 <div className="border-l border-slate-100 pl-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active</p>
                    <h3 className="text-4xl font-black text-[#4ade80] mt-2 italic tabular-nums">{banners.filter(b => b.is_active !== false).length}</h3>
                 </div>
              </div>
              
              <button 
                onClick={() => navigate('/admin/banners/add')}
                className="flex items-center gap-2 px-6 py-4 bg-[#fa641e] text-white font-black text-[12px] rounded-xl hover:bg-[#e45b1b] transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-orange-100 border border-orange-500/20"
              >
                <Plus size={20} /> Add Banner
              </button>
           </div>
        </div>

        {/* Toolbar Integration */}
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between shadow-xs">
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 font-bold text-[11px] rounded-lg hover:bg-slate-50 transition-all uppercase tracking-tight">
                <ArrowRightLeft size={14} className="rotate-90" /> Reorder Banners
              </button>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowInactive(!showInactive)}>
                 <button 
                  className={`relative w-9 h-5 rounded-full transition-all flex items-center px-1 ${showInactive ? 'bg-indigo-500' : 'bg-slate-200'}`}
                 >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all transform ${showInactive ? 'translate-x-4' : 'translate-x-0'}`} />
                 </button>
                 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-800 transition-colors">Show Inactive Banners</span>
              </div>
           </div>
        </div>

        {/* Banner Repository Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden">
           <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
              <Layout size={18} className="text-slate-900" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Banner List <span className="opacity-40 italic font-medium lowercase tracking-normal">(Drag and drop to reorder)</span></span>
           </div>
           
           <AdminTable 
              columns={columns} 
              data={showInactive ? banners : banners.filter(b => b.is_active !== false)} 
              loading={loading}
              pagination={true}
              hideFilter={true}
              searchPlaceholder="Search banners by title or description..."
           />
        </div>
      </div>
      
      {/* Marketplace Footer Branding */}
      <div className="mt-12 px-8 flex items-center justify-between border-t border-slate-200 pt-8 opacity-60 max-w-[1500px] mx-auto">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 BaseraBazar - Real Estate & Construction Marketplace</p>
         <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
         </div>
      </div>
    </div>
  );
}
