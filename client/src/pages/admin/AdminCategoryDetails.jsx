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
        setError("Taxonomy entry not found.");
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
        console.error("Registry sync failure for associated assets:", err);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchListings();
  }, [data, id]);

  const handleDelete = async (catId, isSub = false) => {
    if (!window.confirm(`Are you sure you want to permanently delete this taxonomy node?`)) return;
    try {
      const res = await api.delete(`/admin/system/categories/${catId}`);
      if (res.data.success) {
        if (isSub) {
           setData(prev => ({ ...prev, subcategories: prev.subcategories.filter(s => s._id !== catId) }));
        } else {
           navigate(-1);
        }
      }
    } catch (err) {
      alert("Operational failure during deletion protocol.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Taxonomy Core...</p>
    </div>
  );

  if (error || !data) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Taxonomy Registry Error'}</h2>
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
          render: (row) => <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{row.property_type || 'Asset'}</span>
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
          render: (row) => <div className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg uppercase tracking-widest">{row.service_radius_km || 0} KM Radius</div>
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
          render: (row) => <div className="text-sm font-semibold text-slate-900 tracking-tight">₹{row.pricing?.price_per_unit || 0}</div>
        }
      ];
    }

    return common;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate(-1)}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="relative w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
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
                          <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest">{data.type} Module</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Taxonomy Protocol</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 uppercase">{data.parent_id ? 'Sub-Level Node' : 'Root Taxonomy'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(getCategoryPath(data._id, 'edit') + (data.parent_id ? `?parent=${data.parent_id._id || data.parent_id}` : ''))}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Refine Tier
                 </button>
                 <button 
                   onClick={() => handleDelete(data._id)}
                   className="p-3 border border-slate-200 bg-white text-rose-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Asset Count', value: listings.length || data.stats?.properties || 0, sub: 'Active Listings', icon: Building2, color: 'text-indigo-500' },
                { label: 'Sub-Tree Delta', value: data.subcategories?.length || 0, sub: 'Child Protocols', icon: Layers, color: 'text-orange-500' },
                { label: 'Engagement Hit', value: '4.2k', sub: 'Monthly Traffic', icon: TrendingUp, color: 'text-purple-500' },
                { label: 'Sync Status', value: data.is_active ? 'ACTIVE' : 'HALTED', sub: 'System Propagated', icon: CheckCircle2, color: 'text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums uppercase">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 space-y-8">
             {/* Taxonomy Brief board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Taxonomy Governance</h3>
               </div>
               <div className="p-8 space-y-8">
                  <div className="relative p-6 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white">
                     <div className="absolute -left-1 top-4 bottom-4 w-1 bg-indigo-100 group-hover:bg-indigo-500 transition-colors rounded-full" />
                     <p className="text-base font-semibold text-slate-700 leading-relaxed italic tracking-tight uppercase">
                        "{data.description || 'No specialized qualitative description provided for this catalog node.'}"
                     </p>
                  </div>

                  <div className="space-y-4">
                     <div className="group space-y-2 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <LayoutGrid size={10} className="text-indigo-500" /> Protocol Slug
                        </label>
                        <p className="text-base font-semibold text-slate-900 uppercase">{data.slug}</p>
                     </div>
                     <div className="group space-y-2 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Globe size={10} className="text-indigo-500" /> Visibility Matrix
                        </label>
                        <p className="text-base font-semibold text-slate-900 uppercase">Live Everywhere</p>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          <div className="md:col-span-8 space-y-8">
             {/* Dynamic Sub-Tree board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px]">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex gap-4">
                      {['Subcategories', 'Listings'].map(tab => (
                        <button 
                           key={tab}
                           onClick={() => setActiveTab(tab)}
                           className={cn(
                               "px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2",
                               activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm"
                           )}
                        >
                           {tab === 'Subcategories' ? <Layers size={14}/> : <Building2 size={14}/>}
                           {tab}
                        </button>
                      ))}
                   </div>
                   
                   {/* Condition: Only Root Categories can have Child Nodes */}
                   {activeTab === 'Subcategories' && !data.parent_id && (
                      <button 
                        onClick={() => navigate(`/admin/properties/categories/add?parent=${data._id}&type=${data.type}`)}
                        className="px-5 py-3 bg-orange-600 text-white rounded-xl text-[11px] font-semibold uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-orange-100 active:scale-95"
                      >
                         <Plus size={14} /> Add Child Node
                      </button>
                   )}
                </div>
                
                <div className="p-8">
                   {activeTab === 'Subcategories' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                         {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.map(sub => (
                               <div key={sub._id} className="group p-5 border border-slate-100 rounded-2xl bg-slate-50/30 shadow-sm hover:shadow-xl hover:bg-white hover:border-indigo-100 transition-all relative overflow-hidden">
                                  <div className="flex items-center justify-between relative z-10">
                                     <div className="space-y-1">
                                        <h5 className="text-lg font-semibold text-slate-900 tracking-tight uppercase leading-none group-hover:text-indigo-600 transition-colors">{sub.name}</h5>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{sub.slug}</p>
                                     </div>
                                     <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button 
                                          onClick={() => navigate(getSubcategoryPath(sub._id, 'view'))}
                                          className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                                          title="View Analytics"
                                        >
                                          <Eye size={16} />
                                        </button>
                                        <button 
                                          onClick={() => navigate(getSubcategoryPath(sub._id, 'edit'))}
                                          className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-90"
                                          title="Modify Protocol"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(sub._id, true)}
                                          className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                          title="Purge Node"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))
                         ) : (
                            <div className="col-span-full py-24 text-center">
                               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                  <Layers size={32} className="text-slate-300" />
                               </div>
                               <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No Sub-Taxonomy Nodes Detected</p>
                            </div>
                         )}
                      </div>
                   ) : (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                         {listings.length > 0 ? (
                           <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <AdminTable 
                                columns={getListingColumns()}
                                data={listings}
                                loading={listingsLoading}
                                hideSearch={true}
                                hideFilter={true}
                              />
                           </div>
                         ) : (
                           <div className="py-24 text-center">
                              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                 <Building2 size={32} className="text-indigo-300" />
                              </div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No Assets Propagation Logs Found</p>
                              <p className="text-[12px] font-medium text-slate-400 mt-2 max-w-sm mx-auto italic uppercase leading-relaxed">System sync indicates zero live assets mapped to this catalog protocol.</p>
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
