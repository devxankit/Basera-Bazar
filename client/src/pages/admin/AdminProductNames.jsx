import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Package, ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

export default function AdminProductNames() {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category_id: '', brand_id: '' });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/admin/system/product-names', formData);
      if (res.data.success) {
        setSuccess('Product registered successfully!');
        setTimeout(() => {
          setShowModal(false);
          setFormData({ name: '', category_id: '', brand_id: '' });
          setSuccess(null);
          fetchData();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving product name');
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
          <span className="font-bold text-slate-900 tracking-tight">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'ASSOCIATED BRAND', 
      render: (row) => (
        <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100 italic">
          {row.brand_id?.name || 'No Brand'}
        </span>
      )
    },
    { 
      header: 'TAXONOMY CATEGORY', 
      render: (row) => (
        <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">
          {row.category_id?.name || 'General'}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg"><Edit2 size={16} /></button>
          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Master Catalog</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Product Dictionary</h1>
          <p className="text-slate-400 font-medium text-sm mt-0.5">Define standardized product labels for the marketplace.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-wide"
        >
          <Plus size={18} />
          Register Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={names} 
          loading={loading} 
          title="Catalog Entries"
        />
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-300">
            <div className="px-8 pt-8 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">New Product Registry</h2>
              <p className="text-sm font-bold text-slate-400 mt-2">Classify a new item for system-wide indexing.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
              <div>
                <label className={labelClass}>Registry Display Name</label>
                <input required className={inputClass} placeholder="e.g. ACC Gold Water Shield" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>Assign Brand</label>
                <select required className={inputClass} value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })}>
                  <option value="">Choose Listing Brand</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Catalog Category</label>
                <select required className={inputClass} value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                  <option value="">Choose Core Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-100 transition-all active:scale-95 uppercase tracking-wide"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Record Entry
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard
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
