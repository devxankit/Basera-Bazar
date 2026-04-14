import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Eye, Ban, ShieldCheck, Layers, Filter, CheckCircle2, Clock, Calendar, Users, Briefcase, Mail, Phone, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminAllSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0 });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscriptions');
      if (res.data.success) {
        setSubscriptions(res.data.data);
        setStats({ total: res.data.count });
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const columns = [
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
             {row.partner_id?.name ? row.partner_id.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UJ'}
          </div>
          <div className="space-y-0.5">
             <p className="font-black text-slate-800 tracking-tight text-[13px]">{row.partner_id?.name || 'Ujjawal'}</p>
             <p className="text-[10px] font-bold text-slate-400">{row.partner_id?.email || 'user@example.com'}</p>
             <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tighter border border-slate-200 mt-0.5">
                {(row.partner_id?.role || 'Partner').replace('_', ' ')}
             </span>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-black text-slate-900 text-[13px] tracking-tight">{row.plan_snapshot?.name || 'N/A'}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: BSP-{row._id.toString().slice(-4).toUpperCase()}</p>
        </div>
      )
    },
    {
      header: 'Duration',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700 text-[12px] italic">{row.plan_snapshot?.duration_days} Days</p>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{Math.round(row.plan_snapshot?.duration_days/30)} Month(s)</p>
        </div>
      )
    },
    {
      header: 'Amount',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-black text-slate-900 text-[13px] italic">₹{row.plan_snapshot?.price?.toLocaleString() || 0}</p>
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter italic">inc. GST: ₹{Math.round((row.plan_snapshot?.price || 0) * 0.18)}</p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const isActive = row.status === 'active' && new Date(row.ends_at) > new Date();
        return (
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.1em] ${
            isActive 
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100' 
              : 'bg-slate-400 text-white'
          }`}>
            {isActive ? 'Active' : 'Expired'}
          </span>
        );
      }
    },
    {
      header: 'Start Date',
      render: (row) => (
        <p className="text-[11px] font-black text-slate-600 tracking-tight italic">{formatDate(row.starts_at)}</p>
      )
    },
    {
      header: 'End Date',
      render: (row) => (
        <p className="text-[11px] font-black text-slate-600 tracking-tight italic">{formatDate(row.ends_at)}</p>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-orange-200 text-orange-500 hover:bg-orange-50 active:scale-90 transition-all shadow-sm"
          >
            <Eye size={14} />
          </button>
          <Link 
            to={`/admin/subscriptions/add-manual/${row.partner_id?._id}`}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-orange-400 text-orange-400 hover:bg-orange-50 active:scale-90 transition-all shadow-sm"
          >
            <Plus size={16} strokeWidth={3} />
          </Link>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-rose-200 text-rose-400 hover:bg-rose-50 active:scale-90 transition-all shadow-sm"
          >
            <Ban size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20 mt-4 animate-in fade-in duration-700">
      {/* Platform Breadcrumb */}
      <div className="px-8 py-4 flex items-center gap-2 text-sm font-bold text-slate-400">
         <h1 className="text-[17px] font-black text-slate-900 tracking-tight">User Subscriptions</h1>
         <span className="text-slate-300">/</span>
         <Link to="/admin/dashboard" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Home</Link>
      </div>

      <div className="max-w-[1500px] mx-auto px-8 space-y-8 mt-2">
        {/* Metric Header Block */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
           <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                 <Users size={28} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase tracking-tighter">User Subscriptions Management</h2>
                 <p className="text-slate-400 text-sm font-medium mt-1.5 italic">Manage all user subscriptions across the platform</p>
              </div>
           </div>

           <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Subscriptions</p>
                 <h3 className="text-4xl font-black text-slate-900 mt-2 italic tabular-nums">{stats.total}</h3>
              </div>
              <button 
                 onClick={() => navigate('/admin/subscriptions/plans')}
                 className="flex items-center gap-2 px-6 py-3.5 bg-[#fa641e] text-white font-black text-[11px] rounded-xl hover:bg-[#e45b1b] transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-orange-100 border border-orange-500/20"
              >
                 <Layers size={18} /> Manage Plans
              </button>
           </div>
        </div>

        {/* Filter Block Mockup */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
           <div className="px-8 py-4 flex items-center justify-between cursor-pointer border-b border-slate-50">
              <div className="flex items-center gap-3">
                 <Filter size={16} className="text-slate-400" />
                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Filter Subscriptions</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>

        {/* Main Records Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden">
           <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
              <ShieldCheck size={18} className="text-slate-900" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Subscriptions List</span>
           </div>
           
           <AdminTable 
              columns={columns} 
              data={subscriptions} 
              loading={loading}
              pagination={true}
              hideFilter={true}
              searchPlaceholder="Search by user name, email, plan name..."
           />
        </div>
      </div>
      
      {/* Registry Footer Branding */}
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
