import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, PauseCircle, PlayCircle, Loader2, ArrowLeft, Image as ImageIcon, Layout, Activity, Clock, FileText } from 'lucide-react';
import api from '../../services/api';

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
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving Banner Data...</p>
    </div>
  );

  if (error || !banner) return (
    <div className="p-8 text-center text-rose-500 font-bold uppercase tracking-widest">
      {error || 'Banner not found'}
    </div>
  );

  const daysActive = ((new Date() - new Date(banner.createdAt)) / (1000 * 60 * 60 * 24)).toFixed(0);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-4 animate-in fade-in duration-500">
      <div className="max-w-[1500px] mx-auto px-8">
         {/* Action Bar Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/admin/banners')} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                  <ArrowLeft size={18} />
               </button>
               <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Banner Details</h1>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1 italic">ID: <span className="font-mono">{banner._id}</span></p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => navigate(`/admin/banners/edit/${banner._id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold text-[11px] rounded-lg hover:bg-amber-600 transition-all uppercase tracking-widest shadow-xl shadow-amber-500/20"
               >
                  <Edit size={14} /> Edit Banner
               </button>
               <button 
                  onClick={toggleStatus}
                  className={`flex items-center gap-2 px-5 py-2.5 text-white font-bold text-[11px] rounded-lg transition-all uppercase tracking-widest shadow-xl ${
                    banner.is_active !== false ? 'bg-slate-500 hover:bg-slate-600 shadow-slate-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  }`}
               >
                  {banner.is_active !== false ? <PauseCircle size={14} /> : <PlayCircle size={14} />} 
                  {banner.is_active !== false ? 'Deactivate' : 'Activate'}
               </button>
               <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold text-[11px] rounded-lg hover:bg-rose-600 transition-all uppercase tracking-widest shadow-xl shadow-rose-500/20"
               >
                  <Trash2 size={14} /> Delete
               </button>
            </div>
         </div>

         {/* Hero Image Section */}
         <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
            <div className="rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center min-h-[250px] md:min-h-[400px] relative">
               {banner.image_url ? (
                  <img src={banner.image_url} className="w-full h-full object-contain mx-auto max-h-[500px]" alt={banner.title} />
               ) : (
                  <div className="flex flex-col items-center gap-4 opacity-50">
                     <ImageIcon size={64} className="text-slate-400" />
                     <p className="text-slate-400 font-medium uppercase tracking-widest text-[11px]">No Media Attached</p>
                  </div>
               )}
               <div className="absolute top-6 left-6 flex gap-2">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg ${banner.is_active !== false ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'}`}>
                     {banner.is_active !== false ? 'Live Globally' : 'Currently Hidden'}
                  </span>
                  <span className="px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/20">
                     Priority: {banner.priority || 50}
                  </span>
               </div>
            </div>
         </div>

         {/* Details Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: General Settings */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
               <h3 className="flex items-center gap-3 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4">
                  <FileText className="text-indigo-500" size={18} /> Basic Information
               </h3>
               
               <div className="space-y-6">
                  <div>
                     <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Banner Title</p>
                     <p className="text-base font-bold text-slate-900 mt-1">{banner.title || 'Untitled Banner'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Description Content</p>
                     <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">{banner.description || 'No description provided.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Custom Schedule</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                           {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : 'Immediate'} 
                           <span className="text-slate-400 mx-1">→</span> 
                           {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Indefinite'}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Technical & Timeline */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
               <h3 className="flex items-center gap-3 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4">
                  <Activity className="text-orange-500" size={18} /> Timeline & Logistics
               </h3>
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Created On</span>
                        <span className="text-sm font-medium text-slate-900 mt-1">{new Date(banner.createdAt).toLocaleString()}</span>
                     </div>
                     <Clock size={20} className="text-slate-300" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Last Updated On</span>
                        <span className="text-sm font-medium text-slate-900 mt-1">{new Date(banner.updatedAt).toLocaleString()}</span>
                     </div>
                     <Clock size={20} className="text-slate-300" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Total Days Active</span>
                        <span className="text-lg font-bold text-indigo-600 mt-1 italic tabular-nums">{daysActive} Days</span>
                     </div>
                     <Activity size={24} className="text-indigo-300" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
