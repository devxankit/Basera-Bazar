import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Eye, MoreVertical, Package, Truck, Store } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/admin/listings/product');
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Fallback demo data
        setProducts([
          { 
            _id: 'prd1', 
            material_name: 'Premium Cement (OPC)', 
            category_id: { name: 'Cement' },
            unit: 'bag',
            min_order_quantity: 50,
            onboarding_status: 'approved',
            partner_id: { name: 'ABC Suppliers', phone: '9898989898' },
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const columns = [
    { 
      header: 'MATERIAL / PRODUCT', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
            <Package size={24} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 tracking-tight truncate">{row.material_name}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-0.5">
              {row.category_id?.name || 'Building Material'}
            </p>
          </div>
        </div>
      )
    },
    { 
      header: 'SUPPLIER', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">{row.partner_id?.name || 'In-House'}</p>
          <p className="text-[11px] font-medium text-slate-400">{row.partner_id?.phone || 'Central'}</p>
        </div>
      )
    },
    { 
      header: 'MOQ / UNIT', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900">{row.min_order_quantity || 1}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.unit || 'units'}</span>
        </div>
      )
    },
    { 
      header: 'TYPE', 
      render: (row) => (
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
          Supplier
        </span>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.onboarding_status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`}></div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${row.onboarding_status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {row.onboarding_status || 'Draft'}
          </span>
        </div>
      )
    },
    { 
      header: 'OPTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all">
            <Eye size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all">
            <MoreVertical size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Material Inventory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage construction material suppliers and bulk orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Truck size={20} className="text-indigo-600" />
            Manage Logistics
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2.5 active:scale-95">
            <Plus size={20} />
            Add Supplier
          </button>
        </div>
      </div>

      <AdminTable 
        columns={columns} 
        data={products} 
        loading={loading} 
        searchPlaceholder="Search material or supplier..."
      />
    </div>
  );
}
