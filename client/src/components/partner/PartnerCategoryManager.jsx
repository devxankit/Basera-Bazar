import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, X, ChevronRight, Layers, FolderPlus,
  Loader2, AlertCircle, Tag, Hash, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const TABS = [
  { key: 'type', label: 'Types', icon: Layers, color: 'blue' },
  { key: 'sub_type', label: 'Sub-Types', icon: Hash, color: 'orange' },
  { key: 'brand', label: 'Brands', icon: Award, color: 'emerald' }
];

export default function PartnerCategoryManager({ onClose }) {
  const [activeTab, setActiveTab] = useState('type');
  const [parentCategories, setParentCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedParentTypeId, setSelectedParentTypeId] = useState('');
  const [newName, setNewName] = useState('');

  // Fetch top-level supplier categories (Bricks, Cement, Sand, etc.)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/listings/categories?type=supplier&parent_id=null');
        setParentCategories(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  // Fetch seller's own attributes
  useEffect(() => {
    fetchAttributes();
  }, [selectedCategoryId]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = selectedCategoryId ? `?category_id=${selectedCategoryId}` : '';
      const res = await api.get(`/listings/seller-attributes/my${params}`);
      setAttributes(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your attributes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !selectedCategoryId) return;

    if (activeTab === 'sub_type' && !selectedParentTypeId) {
      setError("Please select a parent Type for this Sub-Type.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        category_id: selectedCategoryId,
        attribute_type: activeTab,
        name: newName.trim()
      };
      if (activeTab === 'sub_type') {
        payload.parent_attribute_id = selectedParentTypeId;
      }

      const res = await api.post('/listings/seller-attributes', payload);
      if (res.data.success) {
        setNewName('');
        fetchAttributes();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attribute? Sub-types under it will also be removed.")) return;
    try {
      await api.delete(`/listings/seller-attributes/${id}`);
      fetchAttributes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  // Filter attributes by current tab
  const filteredAttrs = attributes.filter(a => a.attribute_type === activeTab);

  // Get types for the selected category (for sub-type parent dropdown)
  const typesForCategory = attributes.filter(a => a.attribute_type === 'type');

  const tabConfig = TABS.find(t => t.key === activeTab);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-[18px] font-black text-[#001b4e] uppercase tracking-tight">Manage Attributes</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Types, Sub-Types & Brands</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setNewName(''); }}
              className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.key 
                  ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50/30`
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} className="mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-5">

          {/* Category Selector (always visible) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Category *</label>
            <select 
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setSelectedParentTypeId(''); }}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[#001b4e] outline-none shadow-sm focus:border-blue-500/30"
            >
              <option value="">Select Category</option>
              {parentCategories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-Type: Parent Type Selector */}
          {activeTab === 'sub_type' && selectedCategoryId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Type *</label>
              {typesForCategory.length === 0 ? (
                <p className="text-[12px] text-rose-500 font-bold bg-rose-50 p-3 rounded-xl">Add types first before adding sub-types.</p>
              ) : (
                <select
                  value={selectedParentTypeId}
                  onChange={(e) => setSelectedParentTypeId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[#001b4e] outline-none shadow-sm focus:border-orange-500/30"
                >
                  <option value="">Select Type</option>
                  {typesForCategory.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Add Form */}
          {selectedCategoryId && (
            <form onSubmit={handleAdd} className="flex gap-2">
              <input 
                type="text"
                placeholder={`Add ${tabConfig.label.slice(0, -1)} name...`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-grow bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-[14px] font-bold text-[#001b4e] outline-none focus:bg-white focus:border-blue-500/20 transition-all"
              />
              <button 
                type="submit"
                disabled={submitting || !newName.trim() || (activeTab === 'sub_type' && !selectedParentTypeId)}
                className="px-4 bg-[#001b4e] text-white rounded-xl font-bold text-[12px] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </form>
          )}

          {/* List */}
          {!selectedCategoryId ? (
            <div className="text-center py-10 text-slate-300">
              <FolderPlus size={40} className="mx-auto mb-3" />
              <p className="text-[12px] font-bold uppercase tracking-widest">Select a category to manage</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : filteredAttrs.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">No {tabConfig.label.toLowerCase()} added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttrs.map(attr => (
                <div key={attr._id} className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between group hover:border-blue-500/20 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activeTab === 'type' ? 'bg-blue-50 text-blue-600' :
                      activeTab === 'sub_type' ? 'bg-orange-50 text-orange-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <tabConfig.icon size={14} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#001b4e]">{attr.name}</div>
                      {attr.parent_attribute_id && (
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Under: {attr.parent_attribute_id.name || 'Unknown'}
                        </div>
                      )}
                      {attr.category_id && (
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {attr.category_id.name || ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(attr._id)}
                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-500 text-[11px] font-bold uppercase tracking-widest text-center border-t border-rose-100">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
}
