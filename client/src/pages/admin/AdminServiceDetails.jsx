import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, CheckCircle2, ArrowLeft, Edit2, Trash2, 
  User, Phone, Mail, Calendar, Info, AlertCircle,
  Briefcase, Video, Clock, Layout, FileText, Globe, Star,
  TrendingUp, Smartphone, ChevronRight, Hash, Activity, MoreVertical,
  Layers, Package, LayoutGrid, Shield, ShieldCheck, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/listings/detail/${id}`);
        if (res.data.success) {
          setListing(res.data.data);
        }
      } catch (err) {
        setError("Failed to fetch service details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      const res = await api.patch(`/admin/listings/${id}/status`, { status });
      if (res.data.success) {
        setListing(prev => ({ ...prev, status }));
      }
    } catch (err) {
      alert("Status update failure protocol initiated.");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/listings/${id}`);
      if (res.data.success) {
        setDeleteModalOpen(false);
        navigate('/admin/services');
      }
    } catch (err) {
      alert("Operational failure during deletion protocol.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[12px]">Syncing Service Protocol...</p>
    </div>
  );

  if (error || !listing) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Registry Error'}</h2>
      <button onClick={() => navigate('/admin/services')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Return to Directory</button>
    </div>
  );

  const TABS = [
    { id: 'details', label: 'Overview', icon: Layout },
    { id: 'description', label: 'Methodology', icon: FileText },
    { id: 'portfolio', label: 'Creative Assets', icon: Globe },
    { id: 'provider', label: 'Service Provider', icon: User }
  ];

  const statusMap = {
    active: { label: 'Active Service', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    pending_approval: { label: 'Pending Audit', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
    rejected: { label: 'Audit Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
    draft: { label: 'Draft Mode', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
  };

  const status = statusMap[listing.status] || statusMap.draft;

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
                   onClick={() => navigate('/admin/services')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="relative w-24 h-24 rounded-2xl bg-white p-1 overflow-hidden ring-1 ring-slate-100 shadow-xl">
                          <img 
                            src={listing.thumbnail || 'https://via.placeholder.com/100?text=S'} 
                            className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-700" 
                            alt="" 
                          />
                          {listing.status === 'active' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full group-hover:scale-110 transition-transform" />
                          )}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{listing.title}</h2>
                          <span className={cn(
                             "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                             status.classes
                          )}>
                             {status.label}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Service Registry</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded border border-orange-100">{listing.service_type || 'Professional'} Module</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/services/edit/${id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Refine Service
                 </button>
                 <button 
                   onClick={() => setDeleteModalOpen(true)}
                   className="p-3 border border-slate-200 bg-white text-rose-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Cumulative Hits', value: listing.stats?.views || 0, sub: 'Engagement Index', icon: TrendingUp, color: 'text-indigo-500' },
                { label: 'Capture Index', value: listing.stats?.enquiries || 0, sub: 'Market Leads', icon: Activity, color: 'text-orange-500' },
                { label: 'Prof. Tenure', value: `${listing.years_of_experience || 0}Y`, sub: 'Service Credit', icon: Star, color: 'text-purple-500' },
                { label: 'Operational Hub', value: listing.address?.district || 'HUB', sub: listing.address?.state || 'Territory', icon: MapPin, color: 'text-emerald-500' }
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
          <div className="md:col-span-8 space-y-8">
             {/* Navigation Tabs */}
             <div className="flex bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-2 gap-2">
                {TABS.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-widest transition-all active:scale-95",
                        activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm"
                     )}
                   >
                     <tab.icon size={14} className={activeTab === tab.id ? "text-orange-400" : "opacity-60"} />
                     <span className="hidden md:inline">{tab.label}</span>
                   </button>
                ))}
             </div>

             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px]">
                {activeTab === 'details' && (
                  <div className="p-10 space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Market Classification</label>
                           <div className="space-y-3">
                              <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white transition-all">
                                 <span className="text-[12px] font-medium text-slate-500 uppercase">Tier 1 Category</span>
                                 <span className="text-base font-semibold text-slate-900 uppercase tracking-tight">{listing.category_id?.name}</span>
                              </div>
                              <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white transition-all">
                                 <span className="text-[12px] font-medium text-slate-500 uppercase">Tier 2 Protocol</span>
                                 <span className="text-base font-semibold text-slate-900 uppercase tracking-tight">{listing.subcategory_id?.name || 'GENERIC'}</span>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Distribution Radius</label>
                           <div className="relative p-8 bg-slate-900 rounded-3xl text-white overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/30 transition-all duration-700" />
                              <div className="relative z-10 space-y-4">
                                 <div className="flex items-center gap-3 opacity-60">
                                    <Globe size={18} className="text-indigo-400" />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Deployment Reach</span>
                                 </div>
                                 <div className="flex items-baseline gap-2">
                                    <p className="text-5xl font-semibold tabular-nums tracking-tighter">{listing.service_radius_km || 0}</p>
                                    <span className="text-xl font-semibold text-indigo-400">KM</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-slate-50 space-y-6">
                        <label className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] block flex items-center gap-2">
                           <FileText size={16} className="opacity-80" /> Summary Brief Profile
                        </label>
                        <div className="relative group">
                           <div className="absolute -left-6 top-0 bottom-0 w-1 bg-orange-100 group-hover:bg-orange-500 transition-colors rounded-full" />
                           <p className="text-xl font-semibold text-slate-700 leading-relaxed italic px-2 tracking-tight">
                              "{listing.short_description || "No qualitative brief indexed for this service entry."}"
                           </p>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'description' && (
                  <div className="p-12 space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                     <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-6">
                        <FileText size={16} /> Technical Methodology Base
                     </h3>
                     <p className="text-lg font-medium text-slate-600 leading-loose whitespace-pre-wrap px-4 border-l-2 border-slate-100">
                        {listing.full_description || "No detailed methodology documentation synced to the registry node."}
                     </p>
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="p-12 space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                     <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-6">
                        <Globe size={16} /> Asset Visualization Portfolio
                     </h3>
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {(listing.portfolio_images || []).length > 0 ? (
                           listing.portfolio_images.map((img, i) => (
                              <div key={i} className="aspect-square rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white p-2 group cursor-pointer hover:shadow-xl hover:border-indigo-100 transition-all">
                                 <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                    <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                                    <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="col-span-full py-32 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center space-y-4">
                              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm text-slate-300 transform rotate-3">
                                 <Globe size={32} className="-rotate-3" />
                              </div>
                              <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">No Portfolio Assets Detected</p>
                           </div>
                        )}
                     </div>
                  </div>
                )}

                {activeTab === 'provider' && (
                  <div className="p-12 relative overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
                      <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none">
                         <User size={160} />
                      </div>
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 relative z-10">
                          <div className="relative group shrink-0">
                             <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-indigo-500 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                             <div className="relative w-40 h-40 rounded-[28px] bg-white p-2 shadow-xl ring-1 ring-slate-100">
                                <img 
                                  src={listing.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.partner_id?.name || 'In')}&background=6366f1&color=fff&bold=true`} 
                                  className="w-full h-full object-cover rounded-[22px]" 
                                  alt="" 
                                />
                             </div>
                          </div>
                          <div className="space-y-6 flex-grow">
                             <div className="space-y-2">
                                <h3 className="text-4xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{listing.partner_id?.name || 'In-House Service'}</h3>
                                <div className="flex items-center gap-3">
                                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[12px] font-semibold uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12} /> Verified Agency Node</span>
                                   <span className="text-[12px] font-medium text-slate-300 uppercase tracking-widest italic uppercase">Tier 1 Provider</span>
                                </div>
                             </div>
                             <div className="flex flex-wrap gap-4 pt-2">
                                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:bg-white transition-all shadow-sm">
                                   <Phone size={14} className="text-indigo-500" />
                                   <span className="text-base font-semibold text-slate-900 tabular-nums">{listing.partner_id?.phone || '+91 000 000 0000'}</span>
                                </div>
                                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:bg-white transition-all shadow-sm">
                                   <Mail size={14} className="text-orange-500" />
                                   <span className="text-base font-semibold text-slate-900 uppercase">{listing.partner_id?.email || 'admin@baserabazar.sys'}</span>
                                </div>
                             </div>
                             <button onClick={() => navigate(`/admin/users/view/${listing.partner_id?._id}`)} className="px-8 py-5 bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3">
                                <User size={16} /> Audit Provider identity profile
                             </button>
                          </div>
                      </div>
                  </div>
                )}
             </div>
          </div>
 
          <div className="md:col-span-4 space-y-8">
             {/* Administrative Core board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <ShieldCheck size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Control Governance</h3>
               </div>
               <div className="p-8 space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Registry integrity</label>
                        {listing.status !== 'active' ? (
                           <button onClick={() => handleStatusUpdate('active')} className="w-full py-4 bg-orange-600 text-white rounded-2xl text-[12px] font-semibold hover:bg-slate-900 uppercase tracking-[0.2em] transition-all shadow-lg shadow-orange-100 active:scale-95">
                              Activate Hierarchy
                           </button>
                        ) : (
                           <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-600 transition-transform hover:scale-102">
                              <CheckCircle2 size={24} className="shrink-0" />
                              <div>
                                 <p className="text-[12px] font-semibold uppercase tracking-widest leading-none">Active Matrix Node</p>
                                 <p className="text-[11px] font-medium text-emerald-500 mt-1 uppercase tracking-tighter">Verified Protocol</p>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="pt-8 border-t border-slate-50 space-y-4">
                        <label className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Promotion Visibility</label>
                        <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50/50 group hover:bg-white transition-all">
                           <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Featured Rank</span>
                           <button 
                             onClick={() => api.put(`/admin/listings/${id}`, { is_featured: !listing.is_featured }).then(res => res.data.success && setListing(prev => ({ ...prev, is_featured: !prev.is_featured })))}
                             className={cn(
                                "px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-widest border-2 transition-all active:scale-90",
                                listing.is_featured ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100" : "bg-white border-slate-200 text-slate-400 hover:border-orange-500 hover:text-orange-500"
                             )}
                           >
                              {listing.is_featured ? 'Active' : 'Halt'}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             </div>
 
             {/* Platform Footprint mini */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
                <div className="flex items-center gap-4 text-slate-400">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Zap size={18} className="text-orange-500" />
                   </div>
                   <p className="text-[12px] font-semibold uppercase tracking-widest leading-relaxed">
                      Service Governance <span className="text-indigo-600">Active</span> v4.2.0
                   </p>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.2em]">BaseraBazar OS</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Portolio Node?"
        message="Permanently eradicate this professional service registry? This action cannot be reversed."
        type="danger"
        confirmText="Confirm Purge"
      />
    </div>
  );
}
