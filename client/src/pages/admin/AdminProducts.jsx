import React, { useState, useEffect } from 'react';
import { Package, Eye, Edit2, Trash2, Tag, Loader2, Store, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/admin/listings/product');
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the product "${title}"?`)) {
      setDeleting(true);
      try {
        await api.delete(`/admin/listings/${id}`);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch (error) {
        alert("Failed to delete product. Please try again.");
      } finally {
        setDeleting(false);
      }
    }
  };

  const columns = [
    { 
      header: 'MATERIAL / PRODUCT', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
            <Package size={24} />
          </div>
          <div className="min-w-0 max-w-[200px]">
            <p className="font-black text-slate-900 tracking-tight truncate">{row.title}</p>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{row.description || 'No description provided'}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'CATEGORY', 
      render: (row) => (
        <div className="space-y-2 max-w-[250px]">
           <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-widest border border-amber-100 whitespace-normal text-left">
                 {row.category_id?.name || 'Uncategorized'}
              </span>
              {row.subcategory_id && (
                 <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-slate-200 whitespace-normal text-left">
                    {row.subcategory_id.name}
                 </span>
              )}
           </div>
           {row.brand_id && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                 <Tag size={10} className="shrink-0" /> Brand: {row.brand_id.name}
              </div>
           )}
        </div>
      )
    },
    { 
      header: 'SUPPLIER', 
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 flex items-center gap-1.5"><Store size={14} className="text-slate-400"/> {row.partner_id?.name || 'In-House'}</p>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-5">{row.partner_id?.phone || 'N/A'}</p>
        </div>
      )
    },
    { 
      header: 'PRICE', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900">₹{row.pricing?.price_per_unit || 0}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
             Per {row.pricing?.unit_id?.abbreviation || 'Unit'} (MOQ: {row.pricing?.min_order_qty || 1})
          </span>
        </div>
      )
    },
    { 
      header: 'STATUS', 
      render: (row) => {
        const getStatusStyles = (status) => {
           switch(status) {
              case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
              case 'draft': return 'bg-amber-50 text-amber-600 border-amber-100';
              case 'out_of_stock': return 'bg-rose-50 text-rose-600 border-rose-100';
              default: return 'bg-slate-50 text-slate-500 border-slate-200';
           }
        };
        return (
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(row.status)}`}>
            {row.status || 'Draft'}
          </span>
        );
      }
    },
    { 
      header: 'CREATED AT', 
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-500">
           <Clock size={12} className="text-slate-400" />
           <span className="text-[11px] font-bold tracking-tight">
             {new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
           </span>
        </div>
      )
    },
    { 
      header: 'ACTIONS', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/products/view/${row._id}`)}
            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => navigate(`/admin/products/edit/${row._id}`)}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm"
            title="Edit Product"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row._id, row.title)}
            disabled={deleting}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm disabled:opacity-50"
            title="Delete Product"
          >
             {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Material Inventory</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Manage construction material suppliers and bulk orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-2">
         <AdminTable 
           columns={columns} 
           data={products} 
           loading={loading} 
           searchPlaceholder="Search material by title or description..."
         />
      </div>
    </div>
  );
}
