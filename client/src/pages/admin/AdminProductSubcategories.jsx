import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Tag, Search, X, AlertCircle,
  Loader2, Save, Edit2, ToggleLeft, ToggleRight,
  ChevronDown, Layers
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300';

export default function AdminProductSubcategories() {
  const [subcategories, setSubcategories] = useState([]);   // items with parent_id set
  const [parentCategories, setParentCategories] = useState([]); // top-level supplier/product cats
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '', deleting: false });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* ── Fetch data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL supplier categories (parent + subcategories)
      const res = await api.get('/admin/system/categories?type=supplier');
      if (res.data.success) {
        const all = res.data.data;
        // Parent categories = those with parent_id === null
        setParentCategories(all.filter(c => !c.parent_id));
        // Subcategories = those with a parent_id set
        setSubcategories(all.filter(c => !!c.parent_id));
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Modal helpers ── */
  const openAdd = () => {
    setEditTarget(null);
    setFormName('');
    setFormDescription('');
    setFormParentId('');
    setFormActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (sub) => {
    setEditTarget(sub);
    setFormName(sub.name);
    setFormDescription(sub.description || '');
    setFormParentId(sub.parent_id?._id || sub.parent_id || '');
    setFormActive(sub.is_active ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(null); };

  const handleSave = async () => {
    if (!formParentId) { setFormError('Please select a parent category.'); return; }
    if (!formName.trim()) { setFormError('Sub-category name is required.'); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        type: 'supplier',
        parent_id: formParentId,
        is_active: formActive,
      };
      if (editTarget) {
        await api.put(`/admin/system/categories/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/system/categories', payload);
      }
      closeModal();
      await fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = (id, name) => setDeleteModal({ isOpen: true, id, name, deleting: false });

  const confirmDelete = async () => {
    setDeleteModal(m => ({ ...m, deleting: true }));
    try {
      await api.delete(`/admin/system/categories/${deleteModal.id}`);
      setDeleteModal({ isOpen: false, id: null, name: '', deleting: false });
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
      setDeleteModal(m => ({ ...m, deleting: false }));
    }
  };

  const handleToggleActive = async (sub) => {
    try {
      await api.put(`/admin/system/categories/${sub._id}`, {
        name: sub.name,
        description: sub.description,
        type: 'supplier',
        parent_id: sub.parent_id?._id || sub.parent_id,
        is_active: !sub.is_active,
      });
      setSubcategories(prev =>
        prev.map(s => s._id === sub._id ? { ...s, is_active: !s.is_active } : s)
      );
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const filtered = subcategories.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '', deleting: false })}
        onConfirm={confirmDelete}
        title="Delete Sub-category"
        message={`Delete "${deleteModal.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteModal.deleting}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Product Sub-Categories</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">
            Manage sub-categories linked to a parent product category.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 text-[14px] w-fit"
        >
          <Plus size={20} strokeWidth={3} />
          Add Sub-Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Sub-Categories', value: subcategories.length, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active', value: subcategories.filter(s => s.is_active).length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Parent Categories', value: parentCategories.length, color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.color}`}><Layers size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sub-Category Index</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} entries</span>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search sub-categories..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder-slate-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
            <Layers size={40} strokeWidth={1} />
            <p className="font-bold text-sm">No sub-categories found</p>
            <button onClick={openAdd} className="text-indigo-500 text-sm font-black hover:underline">
              + Add the first one
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Sub-Category', 'Parent Category', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => {
                const parentName =
                  (typeof sub.parent_id === 'object' ? sub.parent_id?.name : '') ||
                  parentCategories.find(p => p._id === sub.parent_id)?.name ||
                  'Unknown';
                return (
                  <tr key={sub._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{sub.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ID: {String(sub._id).slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[11px] font-black text-amber-700 uppercase tracking-wide">
                        <Tag size={10} strokeWidth={3} />
                        {parentName}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-[12px] text-slate-500 truncate">
                        {sub.description || <span className="italic text-slate-300">No description</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${sub.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {sub.is_active ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(sub)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(sub)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                            sub.is_active
                              ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {sub.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {sub.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(sub._id, sub.name)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto animate-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Sub-Categories</p>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {editTarget ? 'Edit Sub-Category' : 'Add New Sub-Category'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              {/* Parent Category Select */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formParentId}
                    onChange={e => setFormParentId(e.target.value)}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">— Select Parent Category —</option>
                    {parentCategories.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  e.g. select "Brick Supplier" to create sub-types under it
                </p>
              </div>

              {/* Sub-category Name */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Sub-Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Red Brick, Fly Ash Brick, AAC Block..."
                  className={inputClass}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description (optional)"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-700">Active</p>
                  <p className="text-[11px] text-slate-400">Visible to partners and users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm" />
                </label>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-500 text-sm font-bold">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-7 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-95"
              >
                {formSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editTarget ? 'Save Changes' : 'Create Sub-Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
