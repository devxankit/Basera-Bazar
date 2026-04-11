import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Eye } from 'lucide-react';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminCategoryManagement({ 
  type, 
  title, 
  description, 
  showParent = false,
  endpoint = 'categories' 
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', parent_id: '', type: type });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/system/${endpoint}?type=${type}`);
      if (res.data.success) {
        setItems(res.data.data);
        if (showParent) {
          // If this is for subcategories, we only want top-level parents of the same type
          setParents(res.data.data.filter(i => !i.parent_id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post(`/admin/system/${endpoint}`, { ...formData, type });
      if (res.data.success) {
        setShowModal(false);
        setFormData({ name: '', parent_id: '', type: type });
        fetchItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this item?')) return;
    try {
      const res = await api.delete(`/admin/system/${endpoint}/${id}`);
      if (res.data.success) {
        fetchItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting item');
    }
  };

  const columns = [
    { 
      header: 'NAME', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all font-black">
            {row.name[0]}
          </div>
          <span className="font-bold text-slate-900">{row.name}</span>
        </div>
      )
    },
    ...(showParent ? [{
      header: 'PARENT CATEGORY',
      render: (row) => row.parent_id?.name || <span className="text-slate-300 italic text-xs">Top Level</span>
    }] : []),
    {
      header: 'STATUS',
      render: (row) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
          row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/properties/categories/view/${row._id}`)}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={() => navigate(`/admin/properties/categories/edit/${row._id}${showParent ? '?parent=' + (row.parent_id?._id || '') : ''}`)}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row._id)}
            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
            title="Deactivate"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-20 mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-medium mt-1">{description}</p>
        </div>
        <button 
          onClick={() => navigate(`/admin/properties/categories/add?type=${type}${showParent ? '&parent=null' : ''}`)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center gap-2.5 active:scale-95"
        >
          <Plus size={20} />
          Add {title.slice(0, -1)}
        </button>
      </div>

      <AdminTable 
        columns={columns} 
        data={items} 
        loading={loading} 
        title={`${title} List`}
      />

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Create {title.slice(0, -1)}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                  placeholder="e.g. Electrician, Apartments..."
                />
              </div>

              {showParent && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Parent Category</label>
                  <select 
                    value={formData.parent_id}
                    onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                  >
                    <option value="">None (Top Level)</option>
                    {parents.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              )}

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
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
