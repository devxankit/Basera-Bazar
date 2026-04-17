import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, PauseCircle, PlayCircle, Loader2, ArrowLeft, 
  Image as ImageIcon, Layout, Activity, Clock, FileText,
  ChevronRight, MoreVertical, Calendar, Globe, Target, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminBannerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBanner = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/system/banners/${id}`);
      if (res.data.success) {
        setBanner(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load banner details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this banner?')) {
      try {
        await api.delete(`/admin/system/banners/${id}`);
        navigate('/admin/banners');
      } catch (err) {
        alert('Error deleting banner');
      }
    }
  };

  const toggleStatus = async () => {
    try {
      await api.put(`/admin/system/banners/${id}`, { is_active: !banner.is_active });
      fetchBanner();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[12px]">Retrieving Creative Assets...</p>
    </div>
  );

  if (error || !banner) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'Banner Registry Error'}</h2>
      <button onClick={() => navigate('/admin/banners')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Return to Gallery</button>
    </div>
  );

  const daysActive = ((new Date() - new Date(banner.createdAt)) / (1000 * 60 * 60 * 24)).toFixed(0);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/banners')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Creative Hub</span>
                       <ChevronRight size={10} className="text-slate-300" />
                       <span className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded border border-orange-100">Asset {banner?._id?.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{banner?.title || 'Untitled Creative'}</h2>
                       <span className={cn(
                          "px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-widest border",
                          banner.is_active !== false ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                       )}>
                          {banner.is_active !== false ? 'Live Globally' : 'Offline'}
                       </span>
                    </div>
                    <p className="text-base font-medium text-slate-400 mt-1 italic">Enterprise Promotion Framework v2.1 • ID: {banner._id}</p>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/banners/edit/${banner._id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit size={14} /> Update Creative
                 </button>
                 <button 
                    onClick={toggleStatus}
                    className={cn(
                      "px-6 py-3 font-semibold text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 active:scale-95",
                      banner.is_active !== false ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                 >
                    {banner.is_active !== false ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    {banner.is_active !== false ? 'Deactivate' : 'Activate Live'}
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="p-3 border border-slate-200 bg-white text-rose-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm active:scale-95"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Priority Index', value: banner.priority || 50, sub: 'Placement Weight', icon: Target, color: 'text-indigo-500' },
                { label: 'Activation Delta', value: `${daysActive}D`, sub: 'Cumulative Uptime', icon: Activity, color: 'text-orange-500' },
                { label: 'Asset Type', value: 'Static High-Res', sub: 'Optimized Image', icon: ImageIcon, color: 'text-purple-500' },
                { label: 'Last Sync', value: new Date(banner.updatedAt).toLocaleDateString('en-GB'), sub: 'Framework Refresh', icon: Clock, color: 'text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-8">
             {/* Master Preview Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                         <ImageIcon size={16} />
                      </div>
                      <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] mt-0.5">Creative Master Preview</h3>
                   </div>
                   <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-400 uppercase tracking-widest">v4.0 Protocol</span>
                </div>
                <div className="p-10">
                   <div className="relative group rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner min-h-[400px] flex items-center justify-center">
                      {banner.image_url ? (
                        <img 
                          src={banner.image_url} 
                          className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-[1.02]" 
                          alt="" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-4 opacity-20">
                           <ImageIcon size={80} />
                           <p className="text-base font-semibold uppercase tracking-widest">No Media Payload</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                   </div>
                   
                   <div className="mt-12 space-y-8">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-4 ml-1">Narrative Profile</label>
                        <div className="relative group">
                           <div className="absolute -left-6 top-0 bottom-0 w-1 bg-indigo-50 group-hover:bg-indigo-500 transition-colors rounded-full" />
                           <p className="text-xl font-semibold text-slate-700 leading-relaxed italic px-2 tracking-tight">
                             "{banner.description || 'No detailed qualitative assessment provided for this promotion.'}"
                           </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                        <div className="space-y-6">
                           <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Distribution Vector</label>
                           <div className="relative p-8 bg-slate-900 rounded-3xl text-white overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/30 transition-all duration-700" />
                              <div className="relative z-10 space-y-4">
                                 <div className="flex items-center gap-3 opacity-60">
                                    <Globe size={18} className="text-orange-400" />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Deployment Reach</span>
                                 </div>
                                 <div>
                                    <p className="text-4xl font-semibold tabular-nums tracking-tighter uppercase">Global Hub</p>
                                    <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em] mt-2">Active on primary platform nodes</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Market Dynamics</label>
                           <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                              {[
                                 { label: 'Priority Weight', char: banner.priority || 50, status: true, icon: Target },
                                 { label: 'Interaction Link', char: banner.link ? 'Active Hook' : 'None', status: !!banner.link, icon: Activity },
                                 { label: 'Created Registry', char: new Date(banner.createdAt).toLocaleDateString('en-GB'), status: true, icon: Calendar }
                              ].map((item, i) => (
                                 <div key={i} className="p-4 flex items-center justify-between hover:bg-white transition-all">
                                    <div className="flex items-center gap-3">
                                       <item.icon size={14} className={cn("opacity-40", item.status ? "text-indigo-500" : "text-slate-400")} />
                                       <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">{item.label}</span>
                                    </div>
                                    <span className={cn(
                                       "text-[11px] font-semibold uppercase tracking-tighter",
                                       item.status ? "text-slate-900" : "text-slate-300"
                                    )}>{item.char}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
 
          <div className="md:col-span-4 space-y-8">
             {/* Scheduling Board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <Clock size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Scheduling Protocol</h3>
               </div>
               <div className="p-8 space-y-8">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                        <Calendar size={24} />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Time Horizon</p>
                        <p className="text-base font-semibold text-slate-900 tracking-tight">
                           {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : 'Immediate'} 
                           <span className="text-slate-300 mx-2">→</span> 
                           {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Indefinite'}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="group space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Activity size={10} className="text-indigo-500" /> Current Uptime
                        </label>
                        <p className="text-xl font-semibold text-slate-900 tabular-nums">{daysActive} <span className="text-[11px] text-slate-400 uppercase font-medium">Days in rotation</span></p>
                     </div>
                  </div>
   
                  <Link 
                    to={`/admin/banners/edit/${banner._id}`}
                    className="flex items-center justify-center w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-[12px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                     Recalibrate Timeline
                  </Link>
               </div>
             </div>
 
             {/* Creative Specs Mini */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
                <div className="flex items-center gap-4 text-slate-400">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Layout size={18} className="text-indigo-500 opacity-60" />
                   </div>
                   <p className="text-[12px] font-semibold uppercase tracking-widest leading-relaxed">
                      Creative Governance <span className="text-indigo-600">Active</span> v4.2.0
                   </p>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.2em]">Creative OS</span>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-200" />
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-100" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
