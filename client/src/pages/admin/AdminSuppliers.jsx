import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Eye, Edit2, Search, Filter, Truck, Package 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get('/admin/users');
        if (response.data.success) {
          // Filter to only show suppliers
          const allSuppliers = response.data.data.filter(u => 
            (u.role || '').toLowerCase() === 'supplier' || 
            (u.displayRole || '').toLowerCase() === 'supplier'
          );
          setSuppliers(allSuppliers);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const filteredData = suppliers.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm) ||
        user._id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const columns = [
    { 
      header: 'SUPPLIER', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm overflow-hidden">
             <img src={row.profileImage || `https://ui-avatars.com/api/?name=${row.name}&background=fef3c7&color=d97706`} alt="" className="w-full h-full object-cover" />
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
      header: 'LOCATION', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-slate-700 font-bold text-sm">{row.partner_profile?.district || 'Central Hub'}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{row.partner_profile?.state || 'Verified'}</p>
        </div>
      )
    },
    { 
      header: 'PORTFOLIO', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {row.partner_profile?.supplier_profile?.material_categories?.length || 0} Categories
          </span>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${row.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${row.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
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
              Review Profile
            </span>
          </button>
          <button 
            onClick={() => navigate(`/admin/users/edit/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
          >
            <Edit2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Material Suppliers</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Manage verified vendors and material procurement partners.</p>
        </div>
        
        <button 
          onClick={() => navigate('/admin/users/add')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95 text-[15px] w-fit"
        >
          <UserPlus size={22} strokeWidth={2.5} />
          Register Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Suppliers', value: suppliers.length, icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Vendors', value: suppliers.filter(s => s.is_active).length, icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending Portfolio', value: 0, icon: Package, color: 'text-amber-600 bg-amber-50' }
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
        searchPlaceholder="Find supplier by name or phone..."
      />
    </div>
  );
}
