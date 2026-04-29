import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Plus, Image as ImageIcon, Info, CheckCircle2, Calendar, X, Layout, ShieldCheck, Zap, Smartphone, Monitor, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

export default function AdminBannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 50,
    position: 'home_top',
    is_active: true,
    image_url: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (id) {
      const fetchBanner = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/admin/system/banners/${id}`);
          if (res.data.success) {
            const banner = res.data.data;
               setFormData({
                 title: banner.title || '',
                 description: banner.description || '',
                 priority: banner.priority || 50,
                 position: banner.position || 'home_top',
                 is_active: banner.is_active !== false,
                 image_url: banner.image_url || '',
                 start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
                 end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
               });
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load banner details');
        } finally {
          setLoading(false);
        }
      };
      fetchBanner();
    }
  }, [id]);

  const handleSubmit = async (e, addAnother = false) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await api.put(`/admin/system/banners/${id}`, formData);
      } else {
        await api.post('/admin/system/banners', formData);
      }
      
      if (addAnother) {
        setFormData({ title: '', description: '', priority: 50, is_active: true, image_url: '', start_date: '', end_date: '' });
        alert('Banner created! You can add another one now.');
      } else {
        navigate('/admin/banners');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving Assets...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 mt-4 animate-in fade-in duration-500">
      {/* Header Breadcrumb */}
      <div className="px-8 py-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{id ? 'Edit Banner' : 'Create New Banner'}</h1>
            <span className="text-slate-300">/</span>
            <Link to="/admin/dashboard" className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors lowercase tracking-tight">Home</Link>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-12 gap-8">
        <form onSubmit={handleSubmit} className="col-span-12 lg:col-span-8 space-y-8">
           {/* Section: Banner Information */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                 <div className="bg-slate-900 p-1.5 rounded-full">
                    <Zap size={12} className="text-white" />
                 </div>
                 <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Banner Information</span>
              </div>

              <div className="p-8 space-y-8">
                 <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                       <Info size={18} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Basic Details</h4>
                       <p className="text-[11px] font-bold text-slate-400 mt-0.5 leading-none">Internal identification and display settings</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Banner Title</label>
                       <input 
                        required
                        type="text" 
                        placeholder="e.g., Welcome to Basera - Find Your Dream Home"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Banner Description</label>
                       <textarea 
                        rows="3"
                        placeholder="Brief description of the banner content"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-slate-300"
                       />
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                       <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Display Priority</label>
                          <input 
                            type="number" 
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold shadow-xs outline-none" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Banner Placement</label>
                          <select 
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold italic shadow-xs outline-none"
                          >
                            <option value="home_top">Marketplace Carousel</option>
                            <option value="home_middle">Home Middle Strip</option>
                            <option value="category_sidebar">Category Sidebar</option>
                            <option value="popup">Announcement Popup</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                          <select 
                            value={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold italic shadow-xs outline-none"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section: Banner Image URL */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                 <div className="bg-slate-900 p-1.5 rounded-full">
                    <ImageIcon size={12} className="text-white" />
                 </div>
                 <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Banner Media Assets</span>
              </div>

              <div className="p-8 space-y-8">
                 <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 flex items-center justify-between text-white border border-white/10 shadow-xl shadow-indigo-100">
                    <div className="space-y-4 relative z-10">
                       <h4 className="text-xs font-black uppercase tracking-widest italic leading-none opacity-80">Recommended Specs</h4>
                       <div className="space-y-2">
                          <p className="flex items-center gap-3 text-[11px] font-bold italic">
                             <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                             <span>Desktop: 1920×500px</span>
                          </p>
                          <p className="flex items-center gap-3 text-[11px] font-bold italic">
                             <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                             <span>Mobile: 800×400px</span>
                          </p>
                       </div>
                    </div>
                    <div className="opacity-20">
                       <ImageIcon size={64} strokeWidth={1} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <MediaDropZone 
                      label="Banner Image"
                      description="Click or drag high-quality banner image here"
                      value={formData.image_url ? [formData.image_url] : []}
                      onChange={(urls) => setFormData({ ...formData, image_url: urls[0] || '' })}
                      multiple={false}
                      maxFiles={1}
                      accentColor="indigo"
                    />
                 </div>
              </div>
           </div>

           {/* Section: Schedule */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                 <div className="bg-slate-900 p-1.5 rounded-full">
                    <Calendar size={12} className="text-white" />
                 </div>
                 <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Visibility Schedule</span>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Auto-Publish Date</label>
                    <input 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold shadow-xs outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Auto-Expire Date</label>
                    <input 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold shadow-xs outline-none"
                    />
                 </div>
              </div>
           </div>

           {/* Error Message */}
           {error && (
             <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-pulse">
                <AlertCircle size={16} /> {error}
             </div>
           )}

           {/* Action Bar Footer */}
           <div className="flex items-center justify-between pt-4">
              <button 
                type="button" 
                onClick={() => navigate('/admin/banners')}
                className="px-8 py-3 bg-slate-500 text-white font-bold text-[11px] rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-slate-100"
              >
                <ArrowLeft size={16} /> Discard
              </button>
              <div className="flex items-center gap-3">
                 <button 
                  type="submit"
                  disabled={saving}
                  className="px-10 py-3 bg-[#fa641e] text-white font-bold text-[11px] rounded-lg hover:bg-[#e45b1b] transition-all shadow-lg shadow-orange-100 flex items-center gap-2 uppercase tracking-widest"
                 >
                   {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                   {saving ? 'Processing...' : (id ? 'Update Asset' : 'Deploy Banner')}
                 </button>
                 {!id && (
                   <button 
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={saving}
                    className="px-8 py-3 bg-emerald-500 text-white font-bold text-[11px] rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 uppercase tracking-widest"
                   >
                     <Plus size={16} /> Create & Add Another
                   </button>
                 )}
              </div>
           </div>
        </form>

        {/* Sidebar Guidelines */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8 sticky top-24">
              <h2 className="text-[11px] font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2 italic">
                 <ShieldCheck size={18} className="text-emerald-500" /> Operational Rules
              </h2>
              
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                       <h4 className="text-[11px] font-bold text-slate-800 uppercase italic">Priority Weight</h4>
                       <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Higher numbers (e.g. 500) appear closer to the first slide in carousel rotation.</p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                       <h4 className="text-[11px] font-bold text-slate-800 uppercase italic">Asset Hosting</h4>
                       <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Use CDN links (Cloudinary, S3) for optimal loading performance across mobile networks.</p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                       <h4 className="text-[11px] font-bold text-slate-800 uppercase italic">Active Window</h4>
                       <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Banners won't show if today's date is outside the schedule window.</p>
                    </div>
                 </div>
              </div>

              <div className="p-5 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-4">
                 <Smartphone size={20} className="text-sky-500 shrink-0" />
                 <p className="text-[10px] font-medium text-sky-700 leading-relaxed italic">
                    <span className="block font-bold uppercase tracking-tight mb-1">Device Note:</span>
                    Carousel images are center-cropped on mobile viewports. Ensure principal subjects are centered.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
