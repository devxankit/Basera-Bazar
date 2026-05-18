import React, { useState } from 'react';
import {
  Eye, Edit2, Truck, Package, Tag, ToggleLeft, ToggleRight,
  Star, ShoppingBag, List
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';
import { toast } from '../../mockToast';
import { refreshAdminCache } from '../../services/AdminService';
import Skeleton from '../../components/common/Skeleton';
import AdminDynamicCategoryManager from '../../components/common/AdminDynamicCategoryManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSuppliers() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeTab = tab || 'list';
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rawUsers = [], isLoading: loading } = useQuery({
    queryKey: ['adminSuppliers'],
    queryFn: () => api.get('/admin/users').then(r => r.data?.data || []),
    staleTime: 5 * 60 * 1000,
  });
  const suppliers = rawUsers.filter(u =>
    (u.role || '').toLowerCase() === 'supplier' ||
    (u.displayRole || '').toLowerCase() === 'supplier'
  );

  const featureMutation = useMutation({
    mutationFn: (supplier) => api.put(`/admin/users/${supplier._id}`, { is_featured: !supplier.is_featured }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSuppliers'] }); refreshAdminCache(); },
    onError: () => toast.error('Failed to update featured status.'),
  });

  const activeMutation = useMutation({
    mutationFn: (supplier) => api.put(`/admin/users/${supplier._id}`, { is_active: !supplier.is_active }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminSuppliers'] }),
    onError: () => toast.error('Failed to update supplier status.'),
  });

  const toggleFeatured = (supplier) => featureMutation.mutate(supplier);
  const toggleActive = (supplier) => activeMutation.mutate(supplier);

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
          <p className="text-slate-700 font-bold text-sm">{row.district || 'N/A'}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{row.state || '—'}</p>
        </div>
      )
    },
    { 
      header: 'MATERIALS', 
      render: (row) => {
        const cats = row.profile?.supplier_profile?.material_categories || [];
        if (cats.length === 0) {
          return (
            <span className="text-[11px] text-slate-400 font-bold italic">No categories</span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {cats.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-wide"
              >
                <Tag size={9} strokeWidth={3} />
                {cat}
              </span>
            ))}
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
            className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/tooltip relative"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => navigate(`/admin/users/edit/${row._id}`)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm group/tooltip relative"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => toggleActive(row)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 group/tooltip relative ${
              row.is_active
                ? 'bg-amber-50 text-amber-500 border-amber-100'
                : 'bg-emerald-50 text-emerald-500 border-emerald-100'
            }`}
          >
            {row.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {loading && activeTab === 'list' ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === 'categories' ? 'Supplier Categories' : 'Material Suppliers'}
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-lg">
              {activeTab === 'categories' 
                ? 'Manage business classifications and material types for suppliers.' 
                : 'Manage verified vendors and material procurement partners.'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 w-fit rounded-2xl border border-slate-200">
        <button 
          onClick={() => navigate('/admin/suppliers')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <List size={14} />
          All Suppliers
        </button>
        <button 
          onClick={() => navigate('/admin/suppliers/categories')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Tag size={14} />
          Categories
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Suppliers', value: suppliers.length, icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Active Vendors', value: suppliers.filter(s => s.is_active).length, icon: ToggleRight, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Pending Portfolio', value: 0, icon: Package, color: 'text-amber-600 bg-amber-50' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-5">
                  {loading ? (
                    <div className="flex items-center gap-4 w-full">
                      <Skeleton className="h-14 w-14 rounded-2xl" />
                      <div className="space-y-2 grow">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 rounded-2xl ${stat.color}`}>
                        <stat.icon size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h4 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h4>
                      </div>
                    </>
                  )}
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
          </motion.div>
        ) : (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden p-6">
               <AdminDynamicCategoryManager type="supplier" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
