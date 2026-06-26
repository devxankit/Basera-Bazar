import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Ruler, Search, X, CheckCircle2,
  AlertCircle, Loader2, Save, Hash, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../services/api';
import toast from '../../mockToast';

const inputClass =
  'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300';

export default function AdminPropertyUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formName, setFormName] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system/property-units?include_inactive=true');
      setUnits(res.data.success ? res.data.data : []);
    } catch {
      toast.error('Failed to load units.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditTarget(null);
    setFormName('');
    setFormOrder(units.length);
    setFormActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (unit) => {
    setEditTarget(unit);
    setFormName(unit.name);
    setFormOrder(unit.order ?? 0);
    setFormActive(unit.is_active ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(null); };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('Unit name is required.'); return; }
    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formName.trim(),
        order: Number(formOrder) || 0,
        is_active: formActive,
      };
      if (editTarget) {
        await api.put(`/admin/system/property-units/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/system/property-units', payload);
      }
      closeModal();
      await fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete "${unit.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/system/property-units/${unit._id}`);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleToggleActive = async (unit) => {
    try {
      await api.put(`/admin/system/property-units/${unit._id}`, { is_active: !unit.is_active });
      setUnits(prev => prev.map(u => u._id === unit._id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const filtered = units.filter(u =>
    !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalListings = units.reduce((sum, u) => sum + (u.listing_count || 0), 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Property Units</h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">
            Measurement units agents choose for a property's built-up area when listing.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 text-[14px] w-fit"
        >
          <Plus size={20} strokeWidth={3} />
          Add Unit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Units', value: units.length, icon: Ruler, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active', value: units.filter(u => u.is_active).length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Listings Using Units', value: totalListings, icon: Hash, color: 'text-amber-600 bg-amber-50' },
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
              Area Unit Registry
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} units
          </span>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search units..."
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
            <Ruler size={40} strokeWidth={1} />
            <p className="font-bold text-sm">No units found</p>
            <button onClick={openAdd} className="text-indigo-500 text-sm font-black hover:underline">
              + Add the first one
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Unit', 'Order', 'Status', 'Listings', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(unit => {
                const count = unit.listing_count || 0;
                return (
                  <tr key={unit._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Ruler size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{unit.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {String(unit._id).slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-500 tabular-nums">{unit.order ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${unit.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {unit.is_active ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Hash size={11} className="text-slate-300" />
                        <span className={`font-black tabular-nums ${count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(unit)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(unit)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                            unit.is_active
                              ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {unit.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {unit.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(unit)}
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
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Units</p>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  {editTarget ? 'Edit Unit' : 'Add New Unit'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  Unit Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. sq. ft., acre, gaj..."
                  className={inputClass}
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5">This is the label agents see in the unit dropdown.</p>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={e => setFormOrder(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Lower numbers appear first in the dropdown.</p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-700">Active</p>
                  <p className="text-[11px] text-slate-400">Available to agents when listing a property</p>
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
                {editTarget ? 'Save Changes' : 'Create Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
