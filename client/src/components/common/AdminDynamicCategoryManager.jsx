import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Tag, Package, Search, X, CheckCircle2,
  AlertCircle, Loader2, Save, Hash, Users, Wrench, 
  Edit2, Image as ImageIcon, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../services/api';
import MediaDropZone from '../common/MediaDropZone';

const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300';

/*
  TYPE CONFIG
  ─────────────────────────────────────────────────────────
  type        │ label          │ allow multi-select partners?
  ────────────┼────────────────┼──────────────────────────
  supplier    │ "Materials"    │ YES (supplier can supply multiple)
  service     │ "Services"     │ NO  (one main category per SP)
  property    │ "Properties"   │ N/A (agent picks when listing)
  product     │ "Products"     │ NO
  ─────────────────────────────────────────────────────────
*/

const TYPE_META = {
  supplier: {
    label: 'Product Category',
    desc: 'Material/product types that suppliers can be classified under. A supplier may cover multiple.',
    partnerLabel: 'Suppliers',
    color: 'text-amber-600 bg-amber-50',
    icon: Package,
    multiSelect: true,
  },
  service: {
    label: 'Service Categories',
    desc: 'Service types that service providers specialize in. Each provider picks one.',
    partnerLabel: 'Providers',
    color: 'text-indigo-600 bg-indigo-50',
    icon: Wrench,
    multiSelect: false,
  },
  property: {
    label: 'Property Categories',
    desc: 'Property types used when listing properties. Agents choose when creating a listing.',
    partnerLabel: 'Listings',
    color: 'text-emerald-600 bg-emerald-50',
    icon: Tag,
    multiSelect: false,
  },
  product: {
    label: 'Product Categories',
    desc: 'Product types for inventory management.',
    partnerLabel: 'Products',
    color: 'text-rose-600 bg-rose-50',
    icon: Package,
    multiSelect: false,
  },
};

export default function AdminDynamicCategoryManager({ type = 'supplier' }) {
  const meta = TYPE_META[type] || TYPE_META.supplier;
  const IconComp = meta.icon;

  const [categories, setCategories] = useState([]);
  const [partnerCountMap, setPartnerCountMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formRelated, setFormRelated] = useState([]);
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* ── fetch categories + partner count ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, usersRes] = await Promise.all([
        api.get(`/admin/system/categories?type=${type}`),
        type === 'supplier' || type === 'service'
          ? api.get('/admin/users')
          : Promise.resolve({ data: { success: false } }),
      ]);

      const cats = catRes.data.success ? catRes.data.data : [];
      setCategories(cats);

      if (usersRes.data.success) {
        const map = {};

        if (type === 'supplier') {
          const suppliers = usersRes.data.data.filter(
            u => (u.role || u.displayRole || '').toLowerCase() === 'supplier'
          );
          suppliers.forEach(s => {
            (s.profile?.supplier_profile?.material_categories || []).forEach(cat => {
              const key = cat.toLowerCase();
              map[key] = (map[key] || 0) + 1;
            });
          });
        } else if (type === 'service') {
          const providers = usersRes.data.data.filter(
            u => (u.role || u.displayRole || '').toLowerCase().includes('service')
          );
          providers.forEach(sp => {
            const catId = sp.profile?.service_profile?.category_id;
            if (catId) {
              const key = String(catId);
              map[key] = (map[key] || 0) + 1;
            }
          });
        }
        setPartnerCountMap(map);
      }
    } catch (err) {
      console.error('Fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── count helpers ── */
  const getCount = (cat) => {
    if (type === 'supplier') {
      const base = (cat.name || '')
        .toLowerCase()
        .replace(/\s*supplier[s]?\s*/gi, '')
        .trim();
      return Object.entries(partnerCountMap).reduce((sum, [key, val]) => {
        if (base && (base.includes(key) || key.includes(base))) return sum + val;
        return sum;
      }, 0);
    }
    if (type === 'service') {
      return partnerCountMap[String(cat._id)] || 0;
    }
    return cat.listingCount || 0;
  };

  /* ── modal helpers ── */
  const openAdd = () => {
    setEditTarget(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('');
    setFormRelated([]);
    setFormActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormIcon(cat.icon || '');
    setFormRelated(cat.related_categories || []);
    setFormActive(cat.is_active ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(null); };

  const toggleRelated = (catId) =>
    setFormRelated(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('Category name is required.'); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        icon: formIcon,
        type,
        related_categories: formRelated,
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/system/categories/${id}`);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.put(`/admin/system/categories/${cat._id}`, {
        ...cat,
        is_active: !cat.is_active,
      });
      // Optimistic update — no full refetch needed
      setCategories(prev =>
        prev.map(c => c._id === cat._id ? { ...c, is_active: !c.is_active } : c)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const filtered = categories.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = filtered.reduce((sum, c) => sum + getCount(c), 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{meta.label}</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">{meta.desc}</p>
          {meta.multiSelect && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-black text-amber-700 uppercase tracking-widest">
              <CheckCircle2 size={11} strokeWidth={3} /> Multi-category supported
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 text-[14px] w-fit"
        >
          <Plus size={20} strokeWidth={3} />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Categories', value: categories.length, icon: IconComp, color: meta.color },
          { label: 'Active', value: categories.filter(c => c.is_active).length, icon: Tag, color: 'text-emerald-600 bg-emerald-50' },
          { label: meta.partnerLabel + ' Assigned', value: totalCount, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.color}`}><stat.icon size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
              Repository Live Index
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} nodes
          </span>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
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
            <Tag size={40} strokeWidth={1} />
            <p className="font-bold text-sm">No categories found</p>
            <button onClick={openAdd} className="text-indigo-500 text-sm font-black hover:underline">
              + Add the first one
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Category', 'Description', 'Status', meta.partnerLabel, 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => {
                const count = getCount(cat);
                return (
                  <tr key={cat._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {cat.icon
                            ? <img src={cat.icon} alt="" className="w-full h-full object-cover" />
                            : <IconComp size={16} className="text-slate-400" />
                          }
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm italic">{cat.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {String(cat._id).slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-[12px] text-slate-500 truncate">
                        {cat.description || <span className="italic text-slate-300">No description</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cat.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {cat.is_active ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Hash size={11} className="text-slate-300" />
                        <span className={`font-black tabular-nums ${count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{count}</span>
                        {count > 0 && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            {count === 1 ? meta.partnerLabel.replace(/s$/, '') : meta.partnerLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                            cat.is_active
                              ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {cat.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {cat.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id, cat.name)}
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {meta.label}
                </p>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {editTarget ? 'Edit Category' : 'Add New Category'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={
                    type === 'supplier' ? 'e.g. Sand Supplier, TMT Supplier...' :
                    type === 'service' ? 'e.g. AC Maintenance, Plumber...' :
                    'e.g. Residential Apartment...'
                  }
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

              {/* Icon upload */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={14} className="text-slate-400" /> Category Icon (optional)
                </label>
                <MediaDropZone
                  value={formIcon ? [formIcon] : []}
                  onChange={urls => setFormIcon(urls[0] || '')}
                  multiple={false}
                  label="Upload icon"
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
                {editTarget ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
