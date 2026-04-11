import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

export default function AdminProductNames() {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category_id: '', brand_id: '' });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nRes, cRes, bRes] = await Promise.all([
        api.get('/admin/system/product-names'),
        api.get('/admin/system/categories?type=product'),
        api.get('/admin/system/brands')
      ]);
      setNames(nRes.data.data);
      setCategories(cRes.data.data);
      setBrands(bRes.data.data);
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
      const res = await api.post('/admin/system/product-names', formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({ name: '', category_id: '', brand_id: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product name');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      header: 'PRODUCT NAME', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 transition-all font-black">
            <Package size={20} />
          </div>
          <span className="font-bold text-slate-900">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'BRAND', 
      render: (row) => row.brand_id?.name || <span className="text-slate-300 italic text-xs">No Brand</span>
    },
    { 
      header: 'CATEGORY', 
      render: (row) => row.category_id?.name || <span className="text-slate-300 italic text-xs">General</span>
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-slate-500 font-medium mt-1">Manage the exact product hierarchy (Product Name {'>'} Brand {'>'} Category).</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center gap-2.5 active:scale-95"
        >
          <Plus size={20} />
          Add Product Name
        </button>
      </div>

      <AdminTable 
        columns={columns} 
        data={names} 
        loading={loading} 
        title="Product Name Registry"
      />

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Register Product</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. ACC Gold Water Shield Cement"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Brand</label>
                <select 
                  required
                  value={formData.brand_id}
                  onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Primary Category</label>
                <select 
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
