import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', image_url: '', link_url: '', position: 'home_top', priority: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      const res = await api.post('/admin/system/banners', formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({ title: '', image_url: '', link_url: '', position: 'home_top', priority: 0 });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving banner');
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
        <a href={row.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline">
          View Link <ExternalLink size={12} />
        </a>
      ) : <span className="text-slate-300 italic text-xs">No Link</span>
    },
    { 
      header: 'PRIORITY', 
      render: (row) => (
        <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-600 text-xs">{row.priority}</span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-20 mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banner Management</h1>
          <p className="text-slate-500 font-medium mt-1">Configure promotional banners and advertisements across the app.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center gap-2.5 active:scale-95"
        >
          <Plus size={20} />
          Add Banner
        </button>
      </div>

      <AdminTable 
        columns={columns} 
        data={banners} 
        loading={loading} 
        title="Active Banners"
      />

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Create Banner</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Title (Internal)</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Summer Sale 2024"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Image URL</label>
                <input 
                  type="text" 
                  required
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Position</label>
                <select 
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                >
                  <option value="home_top">Home Header</option>
                  <option value="home_middle">Home Middle Section</option>
                  <option value="category_sidebar">Category Sidebar</option>
                  <option value="popup">Promotional Popup</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
