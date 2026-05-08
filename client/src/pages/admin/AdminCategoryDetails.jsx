import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Tag, Layers, Plus, Edit2, Trash2, ArrowLeft, 
  Info, LayoutGrid, Building2, User, AlertCircle, MoreHorizontal,
  ChevronRight, Activity, ShieldCheck, Globe, TrendingUp, CheckCircle2,
  Eye, IndianRupee, MapPin, Store, Clock, Package, Box, Search,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import AdminTable from '../../components/common/AdminTable';
import { toast } from '../../mockToast';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminCategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Subcategories');

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/system/categories/${id}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError("Category entry not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!data) return;
    
    const fetchListings = async () => {
      setListingsLoading(true);
      try {
        let endpoint = '';
        let param = '';
        
        if (data.type === 'property') {
          endpoint = '/admin/listings/property';
          param = data.parent_id ? 'subcategory' : 'category';
        } else if (data.type === 'service') {
          endpoint = '/admin/listings/service';
          param = data.parent_id ? 'subcategory_id' : 'category_id';
        } else if (data.type === 'product') {
          endpoint = '/admin/listings/product';
          param = data.parent_id ? 'subcategory_id' : 'category_id';
        }

        if (endpoint && param) {
          const res = await api.get(`${endpoint}?${param}=${id}`);
          if (res.data.success) {
            setListings(res.data.data);
          }
        }
      } catch (err) {
        console.error("Associated listings fetch failure:", err);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchListings();
  }, [data, id]);

  const handleDelete = async (catId, isSub = false) => {
    if (!window.confirm(`Are you sure you want to permanently delete this category?`)) return;
    try {
      const res = await api.delete(`/admin/system/categories/${catId}`);
      if (res.data.success) {
        toast.success("Category deleted successfully");
        if (isSub) {
           setData(prev => ({ ...prev, subcategories: prev.subcategories.filter(s => s._id !== catId) }));
        } else {
           navigate(-1);
        }
      }
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Category Core...</p>
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Category Not Found'}</h2>
      <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Go Back</button>
    </div>
  );

  // Determine Navigation Base Path
  const getSubcategoryPath = (subId, action = 'view') => {
    const typeMap = {
      property: 'properties',
      service: 'services',
      product: 'products',
      supplier: 'suppliers'
    };
    const basePath = typeMap[data.type] || 'properties';
    return `/admin/${basePath}/subcategories/${action}/${subId}`;
  };

  const getCategoryPath = (catId, action = 'view') => {
    const typeMap = {
      property: 'properties',
      service: 'services',
      product: 'products',
      supplier: 'suppliers'
    };
    const basePath = typeMap[data.type] || 'properties';
    return `/admin/${basePath}/categories/${action}/${catId}`;
  };

  // Define Listing Columns based on Type
  const getListingColumns = () => {
    const common = [
      {
        header: 'TITLE',
        render: (row) => (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
               {row.thumbnail || row.images?.[0] ? (
                 <img src={row.thumbnail || row.images[0]} className="w-full h-full object-cover" alt="" />
               ) : (
                 <Box size={20} className="text-slate-300" />
               )}
            </div>
            <div className="min-w-0">
               <p className="text-sm font-semibold text-slate-900 truncate uppercase tracking-tight">{row.title}</p>
               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">ID: {row._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
        )
      }
    ];

    if (data.type === 'property') {
      return [
        ...common,
        {
          header: 'TYPE',
          render: (row) => <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{row.property_type || 'Asset'}</span>
        },
        {
          header: 'PRICE',
          render: (row) => (
            <div className="flex items-center gap-1 text-slate-900 font-semibold text-sm tracking-tight">
               <IndianRupee size={12} className="text-slate-400" />
               {row.pricing?.amount?.toLocaleString() || 'POA'}
            </div>
          )
        },
        {
          header: 'LOCATION',
          render: (row) => <div className="text-[11px] font-medium text-slate-500 uppercase flex items-center gap-1.5"><MapPin size={10} className="text-rose-400" /> {row.address?.district}, {row.address?.state}</div>
        }
      ];
    }

    if (data.type === 'service') {
      return [
        ...common,
        {
          header: 'PROVIDER',
          render: (row) => (
            <div className="space-y-0.5">
               <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-tight">{row.partner_id?.name || 'Central Partner'}</p>
               <p className="text-[10px] font-medium text-slate-400 tracking-widest">{row.partner_id?.phone || 'Central Node'}</p>
            </div>
          )
        },
        {
          header: 'SCOPE',
          render: (row) => <div className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg uppercase tracking-widest">{row.service_radius_km || 0} KM Radius</div>
        }
      ];
    }

    if (data.type === 'product') {
      return [
        ...common,
        {
          header: 'SUPPLIER',
          render: (row) => <div className="text-[12px] font-semibold text-slate-700 uppercase tracking-tight flex items-center gap-2"><Store size={12} className="text-slate-400" /> {row.partner_id?.name || 'In-House'}</div>
        },
        {
          header: 'UNIT PRICE',
          render: (row) => <div className="text-sm font-semibold text-slate-900 tracking-tight uppercase">₹{row.pricing?.price_per_unit || 0}</div>
        }
      ];
    }

    return common;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate(-1)}
                   className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="relative w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                          {data.parent_id ? <Layers size={32} /> : <Tag size={32} />}
                          <div className={cn(
                             "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                             data.is_active ? "bg-emerald-500" : "bg-rose-500"
                          )} />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{data.name}</h2>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-semibold uppercase tracking-widest">{data.type}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Catalog Entry</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">{data.parent_id ? 'Sub-Category' : 'Main Category'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(getCategoryPath(data._id, 'edit') + (data.parent_id ? `?parent=${data.parent_id._id || data.parent_id}` : ''))}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold text-[12px] uppercase tracking-widest rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                 >
                    <Edit2 size={14} /> Edit Category
                 </button>
                 <button 
                   onClick={() => handleDelete(data._id)}
                   className="p-3 border border-slate-200 bg-white text-rose-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Asset Count', value: listings.length || data.stats?.properties || 0, sub: 'Live Listings', icon: Building2, color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Sub-Categories', value: data.subcategories?.length || 0, sub: 'Child Items', icon: Layers, color: 'bg-orange-50 text-orange-600' },
             { label: 'Engagement', value: '4.2k', sub: 'Visits/mo', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
             { label: 'Sync Status', value: data.is_active ? 'ACTIVE' : 'INACTIVE', sub: 'System Status', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                <div className={cn("p-3 rounded-xl", stat.color)}>
                   <stat.icon size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-xl font-semibold text-slate-900 tracking-tighter uppercase">{stat.value}</p>
                   <p className="text-[10px] font-medium text-slate-400 uppercase">{stat.sub}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Metadata Column */}
          <div className="md:col-span-4 space-y-8">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <Info size={18} className="text-indigo-400" />
                 <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">General Information</h3>
               </div>
               <div className="p-8 space-y-8">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl">
                     <p className="text-base font-semibold text-slate-700 leading-relaxed uppercase italic">
                        "{data.description || 'No specialized description provided for this category.'}"
                     </p>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                           <LayoutGrid size={12} className="text-indigo-500" /> Protocol Slug
                        </label>
                        <p className="text-sm font-bold text-slate-900 uppercase">{data.slug}</p>
                     </div>
                     <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                           <Globe size={12} className="text-indigo-500" /> Global Visibility
                        </label>
                        <p className="text-sm font-bold text-slate-900 uppercase">Always Visible</p>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          {/* Sub-Tree / Listing Column */}
          <div className="md:col-span-8 space-y-8">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex gap-4">
                      {['Subcategories', 'Listings'].map(tab => (
                        <button 
                           key={tab}
                           onClick={() => setActiveTab(tab)}
                           className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2",
                                activeTab === tab ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200"
                           )}
                        >
                           {tab === 'Subcategories' ? <Layers size={14}/> : <Building2 size={14}/>}
                           {tab}
                        </button>
                      ))}
                   </div>
                   
                   {activeTab === 'Subcategories' && !data.parent_id && (
                      <button 
                        onClick={() => navigate(`/admin/properties/categories/add?parent=${data._id}&type=${data.type}`)}
                        className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                      >
                         <Plus size={14} /> New Sub-Category
                      </button>
                   )}
                </div>
                
                <div className="p-8">
                   {activeTab === 'Subcategories' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.map(sub => (
                               <div key={sub._id} className="group p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all">
                                  <div className="flex items-center justify-between">
                                     <div className="space-y-1">
                                        <h5 className="text-base font-bold text-slate-800 uppercase leading-none group-hover:text-indigo-600 transition-colors">{sub.name}</h5>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.slug}</p>
                                     </div>
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                          onClick={() => navigate(getSubcategoryPath(sub._id, 'view'))}
                                          className="p-2 bg-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                          <Eye size={14} />
                                        </button>
                                        <button 
                                          onClick={() => navigate(getSubcategoryPath(sub._id, 'edit'))}
                                          className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(sub._id, true)}
                                          className="p-2 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="col-span-full py-24 text-center">
                               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Layers size={24} className="text-slate-300" />
                               </div>
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Sub-Categories Found</p>
                            </div>
                         )}
                      </div>
                   ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                         {listings.length > 0 ? (
                            <AdminTable 
                               columns={getListingColumns()}
                               data={listings}
                               loading={listingsLoading}
                               hideSearch={true}
                               hideFilter={true}
                            />
                         ) : (
                            <div className="py-24 text-center">
                               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Building2 size={24} className="text-slate-300" />
                               </div>
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No Listings Linked To This Category</p>
                            </div>
                         )}
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
