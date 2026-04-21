import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Eye, ArrowLeft, Layers, CornerDownRight, Hash, Tag, Filter as FilterIcon, X, CheckCircle2 } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminCategoryManagement({ 
  type, 
  title, 
  description, 
  showParent = false,
  endpoint = 'categories' 
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('all');

  // For supplier type: map of category name (lowercase) → count of suppliers
  const [supplierCountMap, setSupplierCountMap] = useState({});

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/system/${endpoint}?type=${type}&include_inactive=true`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/admin/system/${endpoint}/${item._id}`, { is_active: !item.is_active });
      fetchItems();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, endpoint]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this item?')) return;
    try {
      const res = await api.delete(`/admin/system/${endpoint}/${id}`);
      if (res.data.success) {
        fetchItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting item');
    }
  };

  // Pre-process categories for the filter dropdown
  const parentCategories = useMemo(() => {
    return items.filter(i => !i.parent_id);
  }, [items]);

  // Combined Searching and Filtering Logic
  const processedItems = useMemo(() => {
    // 1. Initial filter based on whether we view Categories or Subcategories
    let filtered = showParent 
      ? items.filter(i => i.parent_id) 
      : items.filter(i => !i.parent_id);

    // 2. Application of parent filter (only for subcategories)
    if (showParent && parentFilter !== 'all') {
      filtered = filtered.filter(i => (i.parent_id?._id || i.parent_id) === parentFilter);
    }

    // 3. Application of Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(lowerSearch) || 
        (i.parent_id?.name && i.parent_id.name.toLowerCase().includes(lowerSearch))
      );
    }

    return filtered;
  }, [items, showParent, parentFilter, searchTerm]);

  // Helper to find subcategories for a given parent ID
  const findChildren = (parentId) => {
    return items.filter(item => (item.parent_id?._id || item.parent_id) === parentId);
  };

  const columns = [
    { 
      header: 'CLASSIFICATION NAME', 
      render: (row) => (
        <div className="flex items-center gap-4 text-left">
          <div className="flex -space-x-4">
             <div className="w-10 h-10 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:border-indigo-200 transition-all uppercase overflow-hidden flex-shrink-0 relative z-10 shadow-sm" title="Standard Icon">
               {row.icon ? (
                 <img src={row.icon} className="w-full h-full object-cover" alt="" />
               ) : (
                 row.name[0]
               )}
             </div>
             {row.mandi_icon && (
               <div className="w-10 h-10 border border-emerald-200 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-400 font-bold group-hover:border-emerald-400 transition-all uppercase overflow-hidden flex-shrink-0 relative z-20 shadow-lg translate-x-3 translate-y-1 scale-90" title="Mandi Marketplace Icon">
                  <img src={row.mandi_icon} className="w-full h-full object-cover" alt="Mandi" />
               </div>
             )}
          </div>
          <div className="min-w-0 flex flex-col pl-4">
            <p className="font-bold text-slate-900 text-sm italic tracking-tight truncate">{row.name}</p>
            {row.mandi_icon && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Mandi Ready</span>}
          </div>
        </div>
      )
    },
    ...(showParent ? [{
      header: 'PARENT CATEGORY',
      render: (row) => (
        <div className="flex items-center gap-2">
           <Layers size={14} className="text-slate-300" />
           <span className="font-bold text-slate-900 text-xs uppercase tracking-tight italic">{row.parent_id?.name || 'Top Level'}</span>
        </div>
      )
    }] : [
      {
        header: 'SUB CATEGORIES',
        render: (row) => {
          const children = findChildren(row._id);
          return (
            <div className="flex flex-wrap gap-1">
               {children.map((child, i) => (
                 <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                   {child.name}
                 </span>
               ))}
               {children.length === 0 && <span className="text-slate-300 italic text-[10px]">None Linked</span>}
            </div>
          );
        }
      },
      {
        header: 'STATUS',
        render: (row) => (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
            row.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
            {row.is_active ? 'Active' : 'Offline'}
          </span>
        )
      }
    ]),
    {
      header: (type === 'product' || type === 'supplier') ? 'MANDI SELLERS' : 'TOTAL ENTRIES',
      render: (row) => {
        const count = (type === 'product' || type === 'supplier') ? (row.mandi_count || 0) : (row.count || 0);
        return (
          <div className="flex items-center gap-2 tabular-nums">
            <Hash size={11} className="text-emerald-300" />
            <span className={`font-black ${count > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{count}</span>
            {(type === 'product' || type === 'supplier') && count > 0 && (
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                {count === 1 ? 'seller' : 'sellers'}
              </span>
            )}
          </div>
        );
      }
    },
    ...((type === 'product' || type === 'supplier') ? [{
      header: 'BULK SUPPLIERS',
      render: (row) => {
        const count = row.supplier_count || 0;
        return (
          <div className="flex items-center gap-2 tabular-nums">
            <ShoppingBag size={11} className="text-indigo-300" />
            <span className={`font-black ${count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{count}</span>
            {count > 0 && (
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                {count === 1 ? 'supplier' : 'suppliers'}
              </span>
            )}
          </div>
        );
      }
    }] : []),
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Status Toggle */}
          <button 
            onClick={() => toggleActive(row)}
            className={`p-2 rounded-lg transition-all border ${
              row.is_active ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
            }`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <X size={14} /> : <CheckCircle2 size={14} />}
          </button>

          <button 
            onClick={() => {
              const pluralType = type === 'property' ? 'properties' : `${type}s`;
              navigate(`/admin/${pluralType}/${showParent ? 'subcategories' : 'categories'}/view/${row._id}`);
            }} 
            className="p-2 text-slate-400 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold uppercase text-[10px]"
          >
            <Eye size={14} />
          </button>
          <button 
            onClick={() => {
              const pluralType = type === 'property' ? 'properties' : `${type}s`;
              navigate(`/admin/${pluralType}/categories/edit/${row._id}${showParent ? '?parent=' + (row.parent_id?._id || '') : ''}`);
            }} 
            className="p-2 text-indigo-400 hover:text-white border border-indigo-100 hover:bg-indigo-600 rounded-lg transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="p-2 text-rose-400 hover:text-white border border-rose-100 hover:bg-rose-600 rounded-lg transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  const CustomHeaderActions = (
    showParent && parentCategories.length > 0 && (
      <div className="flex items-center gap-3">
         <div className="relative group">
           <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
           <select 
             value={parentFilter} 
             onChange={(e) => setParentFilter(e.target.value)}
             className="bg-slate-50 border-2 border-slate-100 rounded-2xl py-2.5 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer pr-10"
           >
              <option value="all">ALL PARENTS</option>
              {parentCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
           </select>
         </div>
         {parentFilter !== 'all' && (
           <button onClick={() => setParentFilter('all')} className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all">
             <X size={16} />
           </button>
         )}
      </div>
    )
  );

  return (
    <div className="space-y-6 pb-20 mt-4 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10 flex-shrink-0">
             {showParent ? <CornerDownRight size={24} /> : <Tag size={24} />}
           </div>
           <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{showParent ? 'Sub-Level Taxonomy' : 'Root Taxonomy System'}</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">{title}</h1>
              <p className="text-slate-400 text-xs font-medium mt-1 italic leading-relaxed">{description}</p>
           </div>
        </div>
        <button 
          onClick={() => {
            const pluralType = type === 'property' ? 'properties' : `${type}s`;
            navigate(`/admin/${pluralType}/categories/add?type=${type}${showParent ? '&parent=select' : ''}`);
          }}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold text-[10px] rounded-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest shadow-2xl shadow-slate-900/20 whitespace-nowrap"
        >
          <Plus size={16} />
          Register New {showParent ? 'Sub Category' : 'Category'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Repository Live Index</h3>
           </div>
           <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="uppercase tracking-widest">Count: {processedItems.length} Nodes</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] uppercase tracking-tighter">Sync: OK</span>
           </div>
        </div>
        <AdminTable 
          columns={columns} 
          data={processedItems} 
          loading={loading} 
          title={null}
          onSearch={setSearchTerm}
          searchPlaceholder={`Search within ${showParent ? 'subcategories' : 'categories'}...`}
          actions={CustomHeaderActions}
          hideFilter={true}
        />
      </div>
    </div>
  );
}
