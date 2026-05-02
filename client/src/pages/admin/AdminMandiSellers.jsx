import React, { useState, useEffect } from 'react';
import { 
  Eye, Edit2, Store, Package, ToggleLeft, ToggleRight,
  TrendingDown, Plus, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import { getAdminUsers, refreshAdminCache } from '../../services/AdminService';

export default function AdminMandiSellers() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const data = await getAdminUsers();
        // Filter to only show approved mandi sellers
        const allSellers = data.filter(u => 
          ((u.partner_type || '').toLowerCase() === 'mandi_seller' ||
           (u.roles && u.roles.includes('mandi_seller'))) &&
          u.onboarding_status === 'approved'
        );
        setSellers(allSellers);
      } catch (error) {
        console.error("Failed to fetch mandi sellers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const toggleActive = async (seller) => {
    try {
      await api.put(`/admin/users/${seller._id}`, { is_active: !seller.is_active });
      setSellers(prev =>
        prev.map(s => s._id === seller._id ? { ...s, is_active: !s.is_active } : s)
      );
    } catch (err) {
      alert('Failed to update seller status.');
    }
  };

  const filteredData = sellers.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const bizName = user.profile?.mandi_profile?.business_name || '';
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        bizName.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm) ||
        user._id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const columns = [
    { 
      header: 'SELLER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm overflow-hidden">
             <img src={row.profileImage || `https://ui-avatars.com/api/?name=${row.name}&background=e0e7ff&color=4338ca`} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-black text-slate-900 tracking-tight text-[15px]">{row.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ID: {String(row._id).slice(-8).toUpperCase()}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'CONTACT INFO', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-slate-700 font-bold text-sm">{row.email || 'No Email'}</p>
          <p className="text-[12px] text-slate-400 font-black tracking-widest">{row.phone}</p>
        </div>
      )
    },
    { 
      header: 'BUSINESS NAME', 
      render: (row) => (
        <p className="text-slate-700 font-black text-sm uppercase tracking-tight">
          {row.profile?.mandi_profile?.business_name || 'N/A'}
        </p>
      )
    },
    { 
      header: 'VERIFICATION', 
      render: (row) => (
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
          row.onboarding_status === 'approved' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : row.onboarding_status === 'rejected'
            ? 'bg-rose-50 text-rose-600 border-rose-100'
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {row.onboarding_status === 'approved' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {row.onboarding_status === 'approved' ? 'Verified' : row.onboarding_status === 'rejected' ? 'Not Approved' : 'Pending'}
        </div>
      )
    },
    { 
      header: 'PENALTY DUE', 
      render: (row) => {
        const penalty = row.profile?.mandi_profile?.penalty_due || 0;
        return (
          <div className={`flex items-center gap-1.5 font-bold tabular-nums ${penalty > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            <TrendingDown size={14} className={penalty > 0 ? 'opacity-100' : 'opacity-30'} />
            <span className="text-[14px]">₹{penalty}</span>
          </div>
        );
      }
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className={`px-3 py-1.5 rounded-xl border inline-flex items-center gap-2 ${
          row.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            row.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'
          }`} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {row.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/users/view/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group relative"
          >
            <Eye size={18} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              View Profile
            </span>
          </button>
          <button 
            onClick={() => navigate(`/admin/users/edit/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => toggleActive(row)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 group relative ${
              row.is_active
                ? 'bg-amber-50 text-amber-500 border-amber-100'
                : 'bg-emerald-50 text-emerald-500 border-emerald-100'
            }`}
          >
            {row.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {row.is_active ? 'Deactivate' : 'Activate'}
            </span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mandi Sellers</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Manage verified mandi bazaar vendors and their penalty records.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/users/add?role=Mandi%20Seller')}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm uppercase tracking-wider"
        >
          <Plus size={18} strokeWidth={3} /> Add New Seller
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Sellers', value: sellers.length, icon: Store, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Sellers', value: sellers.filter(s => s.is_active).length, icon: ToggleRight, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Flagged Penalties', value: sellers.filter(s => (s.profile?.mandi_profile?.penalty_due || 0) > 0).length, icon: TrendingDown, color: 'text-rose-600 bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <AdminTable 
        columns={columns} 
        data={filteredData} 
        loading={loading} 
        onSearch={setSearchTerm}
        hideFilter={true}
        searchPlaceholder="Find seller by name, business or phone..."
      />
    </div>
  );
}
