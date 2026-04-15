import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, CheckCircle2, ArrowLeft, Edit2, Trash2, 
  User, Phone, Mail, Calendar, Info, AlertCircle,
  Briefcase, Video, Clock, Layout, FileText, Globe, Star,
  TrendingUp, Smartphone, ChevronRight, Hash, Activity, MoreVertical,
  Layers, Package, LayoutGrid, Shield
} from 'lucide-react';
import api from '../../services/api';
import ConfirmationModal from '../../components/common/ConfirmationModal';

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
      alert("Status update failed.");
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
      alert("Deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !listing) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
      <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-lg font-bold text-slate-900">{error || 'Unknown Error'}</h2>
      <button onClick={() => navigate('/admin/services')} className="mt-4 text-xs font-bold text-indigo-600 underline uppercase tracking-widest">Return to directory</button>
    </div>
  );

  const TABS = [
    { id: 'details', label: 'Overview', icon: Layout },
    { id: 'description', label: 'Detailed Description', icon: FileText },
    { id: 'portfolio', label: 'Portfolio Media', icon: Globe },
    { id: 'provider', label: 'Service Provider', icon: User }
  ];

  const statusMap = {
    active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    pending_approval: { label: 'Pending', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
    rejected: { label: 'Rejected', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
    draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
  };

  const status = statusMap[listing.status] || statusMap.draft;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 mt-4">
      
      {/* Structural Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-6">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate('/admin/services')} className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                 <ArrowLeft size={18} className="text-slate-500" />
              </button>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                    <img src={listing.thumbnail || 'https://via.placeholder.com/100?text=S'} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div>
                    <h1 className="text-xl font-bold text-slate-900">{listing.title} <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${status.classes}`}>{status.label}</span></h1>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                       {listing.service_type || 'Professional Service'} • <span className="text-slate-300">PK: {listing._id}</span>
                    </p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/admin/services/edit/${id}`)} className="px-4 py-2 border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                 <Edit2 size={12} /> Edit Service
              </button>
              <button onClick={() => setDeleteModalOpen(true)} className="p-2 border border-rose-100 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-bold text-[10px] uppercase px-4">
                 Delete
              </button>
           </div>
        </div>
        
        {/* Metric Grid */}
        <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-slate-50/30">
           {[
             { label: 'Cumulative Hits', value: listing.stats?.views || 0, sub: 'VIEWS' },
             { label: 'Market Leads', value: listing.stats?.enquiries || 0, sub: 'LEADS' },
             { label: 'Experience', value: `${listing.years_of_experience || 0} Years`, sub: 'PROF_CREDIT' },
             { label: 'Service Hub', value: listing.address?.district || 'REDACTED', sub: listing.address?.state || '' }
           ].map((stat, i) => (
             <div key={i} className="p-5 text-center px-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums uppercase">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{stat.sub}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-6">
           {/* Navigation Tabs */}
           <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-bold uppercase tracking-[0.1em] transition-all border-r border-slate-100 last:border-r-0 ${
                   activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                 }`}
               >
                 <tab.icon size={13} />
                 <span className="hidden md:inline">{tab.label}</span>
               </button>
             ))}
           </div>

           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
              {activeTab === 'details' && (
                <div className="divide-y divide-slate-100">
                   <div className="p-8 grid grid-cols-2 gap-10">
                      <div>
                         <label className="text-[9px] font-bold text-slate-400 uppercase block mb-4">Market Classification</label>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                               <span className="text-xs text-slate-500">Tier 1 Category</span>
                               <span className="text-xs font-bold text-slate-900 uppercase">{listing.category_id?.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                               <span className="text-xs text-slate-500">Tier 2 Subcategory</span>
                               <span className="text-xs font-bold text-slate-900 uppercase">{listing.subcategory_id?.name || 'GENERIC'}</span>
                            </div>
                         </div>
                      </div>
                      <div>
                         <label className="text-[9px] font-bold text-slate-400 uppercase block mb-4">Operational Domain</label>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                               <span className="text-xs text-slate-500">Service Radius</span>
                               <span className="text-xs font-bold text-slate-900">{listing.service_radius_km} KM</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                               <span className="text-xs text-slate-500">Registered Hub</span>
                               <span className="text-xs font-bold text-slate-900 uppercase">{listing.address?.district}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="p-8 bg-slate-50/30">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Service Summary</label>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-4 border-slate-200 pl-6 py-1">
                        "{listing.short_description || "No qualitative brief indexed."}"
                      </p>
                   </div>
                </div>
              )}

              {activeTab === 'description' && (
                <div className="p-10 space-y-10">
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-4">Full Methodology & Scope</label>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {listing.full_description || "No detailed methodology documentation synced."}
                      </p>
                   </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                 <div className="p-8">
                    <div className="grid grid-cols-3 gap-6">
                       {(listing.portfolio_images || []).length > 0 ? (
                          listing.portfolio_images.map((img, i) => (
                             <div key={i} className="aspect-square rounded border border-slate-200 overflow-hidden bg-slate-50 p-1">
                                <img src={img} className="w-full h-full object-cover rounded-sm" alt="" />
                             </div>
                          ))
                       ) : (
                          <div className="col-span-3 py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3">
                             <Globe size={32} className="text-slate-100" />
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Portfolio Media Indexed</p>
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {activeTab === 'provider' && (
                 <div className="p-10 flex items-center gap-10">
                     <div className="w-32 h-32 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                        <img src={listing.partner_id?.profileImage || `https://ui-avatars.com/api/?name=${listing.partner_id?.name}&background=f1f5f9&color=64748b`} className="w-full h-full object-cover" alt="" />
                     </div>
                     <div className="space-y-6">
                        <div>
                           <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{listing.partner_id?.name}</h3>
                           <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mt-1">Verified Supply Partner</p>
                        </div>
                        <div className="flex gap-10">
                           <div className="flex items-center gap-3">
                              <Phone size={14} className="text-slate-300" />
                              <span className="text-xs font-bold text-slate-900 tabular-nums">{listing.partner_id?.phone}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <Mail size={14} className="text-slate-300" />
                              <span className="text-xs font-bold text-slate-900 truncate">{listing.partner_id?.email || 'N/A'}</span>
                           </div>
                        </div>
                        <button onClick={() => navigate(`/admin/users/view/${listing.partner_id?._id}`)} className="text-[10px] font-bold text-slate-900 border border-slate-900 px-4 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">
                           Inspect Provider Identity
                        </button>
                     </div>
                 </div>
              )}
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50">
               <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                 <Shield size={14} className="text-slate-400" /> Administrative Hub
               </h3>
             </div>
             <div className="p-6 space-y-6">
                 <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Integrity Verification</label>
                    {listing.status !== 'active' ? (
                       <button onClick={() => handleStatusUpdate('active')} className="w-full py-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 uppercase tracking-widest transition-all">
                          Activate Repository
                       </button>
                    ) : (
                       <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active System Node</span>
                       </div>
                    )}
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Platform Promotion</label>
                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Featured Asset</span>
                       <button 
                         onClick={() => api.put(`/admin/listings/${id}`, { is_featured: !listing.is_featured }).then(res => res.data.success && setListing(prev => ({ ...prev, is_featured: !prev.is_featured })))}
                         className={`text-[9px] font-bold px-3 py-1 bg-white border rounded transition-all uppercase ${listing.is_featured ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-300 hover:text-slate-900'}`}
                       >
                          {listing.is_featured ? 'ON' : 'OFF'}
                       </button>
                    </div>
                 </div>
             </div>
           </div>

           <div className="bg-slate-900 border border-slate-900 rounded-xl p-5 text-indigo-300">
              <div className="flex items-center gap-4">
                 <Hash size={16} />
                 <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                   Portfolios are governed by multiplier synchronization protocols.
                 </p>
              </div>
           </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Portolio?"
        message="Permanently remove this professional service registry? This action cannot be reversed."
        type="danger"
        confirmText="Confirm Purge"
      />
    </div>
  );
}
