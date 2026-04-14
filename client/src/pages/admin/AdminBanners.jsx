import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, ExternalLink, ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', image_url: '', link_url: '', position: 'home_top', priority: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system/banners');
      setBanners(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/admin/system/banners', formData);
      if (res.data.success) {
        setSuccess('Banner published successfully!');
        setTimeout(() => {
          setShowModal(false);
          setFormData({ title: '', image_url: '', link_url: '', position: 'home_top', priority: 0 });
          setSuccess(null);
          fetchData();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      header: 'BANNER', 
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-24 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
            <img src={row.image_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{row.title || 'Untitled Banner'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.position}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'LINK', 
      render: (row) => row.link_url ? (
        <a href={row.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline py-1 px-3 bg-indigo-50 rounded-lg text-xs w-fit">
          View Target <ExternalLink size={12} />
        </a>
      ) : <span className="text-slate-300 italic text-xs">No Link</span>
    },
    { 
      header: 'PRIORITY', 
      render: (row) => (
        <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-600 text-[10px] uppercase tracking-wider">{row.priority} Rank</span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg hover:bg-indigo-50"><Edit2 size={16} /></button>
          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 rounded-lg hover:bg-rose-50"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Growth Engine</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banner Management</h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Configure promotional visuals and ad spots.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-wide"
        >
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={banners} 
          loading={loading} 
          title="Active Campaigns"
        />
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Campaign Banner</h2>
              <p className="text-sm font-bold text-slate-400 mt-1">Add a new visual spot to the global marketplace.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
              <div>
                <label className={labelClass}>Internal Identifier</label>
                <input required className={inputClass} placeholder="e.g. Summer Festival 2024" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>Image Asset URL</label>
                <input required className={inputClass} placeholder="https://res.cloudinary.com/..." value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Placement</label>
                  <select className={inputClass} value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}>
                    <option value="home_top">Home Header</option>
                    <option value="home_middle">Middle Strip</option>
                    <option value="category_sidebar">Sidebar</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Display Priority</label>
                  <input type="number" className={inputClass} value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Redirect Target (Optional)</label>
                <input className={inputClass} placeholder="https://baserabazar.com/listings/..." value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-100 transition-all active:scale-95 uppercase tracking-wide"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSubmitting ? 'Processing...' : 'Publish to System'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard Changes
                </button>
              </div>

              {error && <div className="p-4 bg-rose-50 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold border border-rose-100">
                <AlertCircle size={16} /> {error}
              </div>}
              {success && <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3 text-emerald-600 text-xs font-bold border border-emerald-100">
                <CheckCircle2 size={16} /> {success}
              </div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
