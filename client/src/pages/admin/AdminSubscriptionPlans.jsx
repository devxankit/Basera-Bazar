import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Edit2, Trash2, Eye, ShieldCheck, Zap, ToggleLeft, Layers, Users, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminSubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscriptions/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const toggleStatus = async (plan) => {
    try {
      const res = await api.put(`/admin/subscriptions/plans/${plan._id}`, {
        is_active: !plan.is_active
      });
      if (res.data.success) {
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this plan?')) return;
    try {
      const res = await api.delete(`/admin/subscriptions/plans/${id}`);
      if (res.data.success) {
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting plan');
    }
  };

  const columns = [
    {
      header: 'PLAN NAME',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-black text-slate-900 text-sm tracking-tight">{row.name}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {row._id.toString().slice(-6).toUpperCase()}</p>
        </div>
      )
    },
    {
      header: 'PRICE (₹)',
      render: (row) => (
        <span className="font-black text-slate-900 text-sm italic">
          ₹{row.price.toLocaleString()}
        </span>
      )
    },
    {
      header: 'DURATION',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700 text-xs italic">{row.duration_days} Days</p>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{Math.round(row.duration_days/30)} Month(s)</p>
        </div>
      )
    },
    {
      header: 'USER ROLE',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.applicable_to || []).map((role, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              {role.replace('_', ' ')}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'LISTINGS',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Max:</span>
            {row.listings_limit === -1 ? (
              <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5 uppercase tracking-tighter">
                <InfinityIcon size={10} /> Unlimited
              </span>
            ) : (
              <span className="font-black text-slate-900 text-xs italic">{row.listings_limit}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Featured:</span>
             {row.featured_listings_limit === -1 ? (
              <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm shadow-emerald-200">Unlimited</span>
            ) : (
              <span className="font-black text-indigo-600 text-xs italic">{row.featured_listings_limit}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'LEADS',
      render: (row) => (
        row.leads_limit === -1 ? (
          <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 uppercase tracking-tighter shadow-sm shadow-emerald-200">
             <InfinityIcon size={12} /> Unlimited
          </span>
        ) : (
          <span className="font-black text-slate-900 text-sm italic">{row.leads_limit}</span>
        )
      )
    },
    {
      header: 'STATUS',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.1em] border ${
          row.is_active 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-500 border-rose-100'
        }`}>
          {row.is_active ? 'Active' : 'Offline'}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/subscriptions/plans/edit/${row._id}`)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => toggleStatus(row)}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all shadow-sm ${
              row.is_active 
                ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50' 
                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <ToggleLeft size={16} />
          </button>
          <button 
            onClick={() => deletePlan(row._id)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-rose-200 text-rose-400 hover:text-white hover:bg-rose-500 transition-all shadow-sm"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-20 mt-4 animate-in fade-in duration-700">
      {/* Upper Dashboard Metrics */}
      <div className="grid grid-cols-12 gap-6">
         {/* Title Block */}
         <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
               <Layers size={28} />
            </div>
            <div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Subscription Plans Management</h1>
               <p className="text-slate-400 text-sm font-medium mt-1.5 italic">Manage all subscription plans for Agents, Suppliers, and Service Providers</p>
            </div>
         </div>

         {/* Stats Block */}
         <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Active Plans</p>
               <h2 className="text-4xl font-black text-slate-900 mt-2 italic tabular-nums">{plans.length}</h2>
            </div>
            <button 
              onClick={() => navigate('/admin/subscriptions/plans/add')}
              className="flex items-center gap-2 px-6 py-3.5 bg-[#fa641e] text-white font-black text-[11px] rounded-xl hover:bg-[#e45b1b] transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-orange-200 border-2 border-orange-500/20"
            >
              <Plus size={18} /> Add Plan
            </button>
         </div>
      </div>

      {/* Main Table Repository */}
      <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden">
         <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
            <ShieldCheck size={18} className="text-slate-900" />
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Subscription Registry System v2.0</span>
         </div>
         <AdminTable 
            columns={columns} 
            data={plans} 
            loading={loading}
            pagination={true}
            hideFilter={true}
            searchPlaceholder="Search plans by name, role or feature..."
         />
      </div>
    </div>
  );
}
