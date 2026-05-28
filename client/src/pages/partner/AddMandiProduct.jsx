import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Tag, Box, Plus, X,
  Camera, IndianRupee, Database,
  Loader2, Check, ChevronRight, ChevronDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { db } from '../../services/DataEngine';
import { v } from '../../utils/validators';
import toast from '../../mockToast';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useBackgroundUpload } from '../../hooks/useBackgroundUpload';

export default function AddMandiProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { queueUpload, awaitUpload } = useBackgroundUpload();

  const [loading, setLoading] = useState(false);

  // Inline add state
  const [addingType, setAddingType] = useState(false);
  const [addingSubType, setAddingSubType] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [savingAttr, setSavingAttr] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    unit: 'Bag',
    material_id: '',
    material_name: '',
    grade_id: '',
    stock: '',
    description: '',
    thumbnail: null,
    images: [],
    type_name: '',
    sub_type_name: '',
    brand_name: '',
    is_featured: false
  });

  const [showLimitModal, setShowLimitModal] = useState(false);

  useScrollLock(showLimitModal);

  // --- React Query: subscription limits ---
  const { data: limitsData } = useQuery({
    queryKey: ['subscriptionLimits'],
    queryFn: () => api.get('/partners/subscription/limits').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const subscriptionLimits = limitsData?.success
    ? {
        canAddListing: !limitsData.data.usage.is_listing_limit_reached,
        canFeature: !limitsData.data.usage.is_featured_limit_reached,
        message: limitsData.data.messages.listing,
        planName: limitsData.data.plan_name
      }
    : { canAddListing: true, canFeature: true, message: '', planName: 'Loading...' };

  // --- React Query: partner profile (subscription info) ---
  const { data: profileData } = useQuery({
    queryKey: ['partnerProfile'],
    queryFn: () => api.get('/partners/profile').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const subscriptionInfo = profileData?.success
    ? (() => {
        const partner = profileData.data;
        const sub = partner.active_subscription_id;
        return {
          isPro: !!sub && sub.plan_snapshot?.price > 0,
          featuredLimit: sub?.plan_snapshot?.featured_listings_limit || 0,
          district: partner.district,
          state: partner.state
        };
      })()
    : null;

  // --- React Query: categories ---
  const { data: categoriesData, isLoading: fetchingCats } = useQuery({
    queryKey: ['mandiProductCategories'],
    queryFn: () => api.get('/listings/categories?type=product&parent_id=null').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesData?.success ? categoriesData.data : [];

  // --- React Query: edit product data ---
  const { data: editProductData } = useQuery({
    queryKey: ['editMandiProduct', editId],
    queryFn: () => api.get(`/listings/${editId}`).then(r => r.data),
    enabled: !!editId,
    staleTime: 5 * 60 * 1000,
  });

  // Populate form when edit data arrives
  useEffect(() => {
    if (editProductData?.success) {
      const item = editProductData.data;
      setFormData({
        title: item.title || '',
        brand: item.brand || '',
        price: item.pricing?.price_per_unit || item.price || '',
        unit: item.pricing?.unit || item.unit || 'Bag',
        material_id: item.category_id?._id || item.category_id || item.material_id || '',
        material_name: item.category_id?.name || item.material_name || '',
        grade_id: item.subcategory_id?._id || item.subcategory_id || item.grade_id || '',
        stock: item.stock_quantity || item.stock || '',
        description: item.description || '',
        thumbnail: item.thumbnail || item.image || null,
        images: item.images || [],
        type_name: item.type_name || '',
        sub_type_name: item.sub_type_name || '',
        brand_name: item.brand_name || item.brand || '',
        is_featured: item.is_featured || false
      });
    }
  }, [editProductData]);

  // --- React Query: seller attributes (depends on selected category) ---
  const { data: sellerAttrsData } = useQuery({
    queryKey: ['sellerAttributes', formData.material_id],
    queryFn: () => api.get(`/listings/seller-attributes/my?category_id=${formData.material_id}`).then(r => r.data),
    enabled: !!formData.material_id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const sellerTypes = sellerAttrsData?.success
    ? sellerAttrsData.data.filter(a => a.attribute_type === 'type')
    : [];
  const sellerSubTypes = sellerAttrsData?.success
    ? sellerAttrsData.data.filter(a => a.attribute_type === 'sub_type')
    : [];
  const sellerBrands = sellerAttrsData?.success
    ? sellerAttrsData.data.filter(a => a.attribute_type === 'brand')
    : [];

  // Auto-generate title from combination
  useEffect(() => {
    if (!editId) {
      const parts = [formData.material_name, formData.type_name, formData.sub_type_name, formData.brand_name].filter(Boolean);
      if (parts.length > 0) {
        setFormData(prev => ({ ...prev, title: parts.join(' - ') }));
      }
    }
  }, [formData.material_name, formData.type_name, formData.sub_type_name, formData.brand_name]);

  const handleAddAttribute = async (attrType, parentId = null) => {
    if (!newItemName.trim() || !formData.material_id) return;
    try {
      setSavingAttr(true);
      const payload = {
        category_id: formData.material_id,
        attribute_type: attrType,
        name: newItemName.trim()
      };
      if (attrType === 'sub_type' && parentId) {
        payload.parent_attribute_id = parentId;
      }
      const res = await api.post('/listings/seller-attributes', payload);
      if (res.data.success) {
        const newAttr = res.data.data;
        setNewItemName('');
        setAddingType(false); setAddingSubType(false); setAddingBrand(false);
        // Optimistically add to cache so the new item is visible immediately
        // (server-side cache would otherwise return stale data for up to 10 minutes)
        queryClient.setQueryData(['sellerAttributes', formData.material_id], (old) => {
          if (!old?.success) return old;
          return { ...old, data: [...(old.data || []), newAttr] };
        });
        if (attrType === 'type') setFormData(prev => ({ ...prev, type_name: newAttr.name, sub_type_name: '' }));
        if (attrType === 'sub_type') setFormData(prev => ({ ...prev, sub_type_name: newAttr.name }));
        if (attrType === 'brand') setFormData(prev => ({ ...prev, brand_name: newAttr.name }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add. May already exist.");
    } finally {
      setSavingAttr(false);
    }
  };

  const handleDeleteAttribute = async (attrId, attrType, attrName) => {
    try {
      await api.delete(`/listings/seller-attributes/${attrId}`);
      queryClient.setQueryData(['sellerAttributes', formData.material_id], (old) => {
        if (!old?.success) return old;
        return { ...old, data: old.data.filter(a => a._id !== attrId) };
      });
      if (attrType === 'type' && formData.type_name === attrName) setFormData(prev => ({ ...prev, type_name: '', sub_type_name: '' }));
      if (attrType === 'sub_type' && formData.sub_type_name === attrName) setFormData(prev => ({ ...prev, sub_type_name: '' }));
      if (attrType === 'brand' && formData.brand_name === attrName) setFormData(prev => ({ ...prev, brand_name: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, thumbnail: localUrl }));
    // Compress + upload in the background
    queueUpload('thumbnail', file);
  };

  const handleSubmit = async () => {
    if (!formData.material_id) {
      toast.error("Please select a product category.");
      return;
    }
    const priceErr = v.price(formData.price);
    if (priceErr) { toast.error(priceErr); return; }
    try {
      setLoading(true);
      // Resolve background thumbnail upload — near-instant if already done
      let thumbnailUrl = formData.thumbnail;
      if (formData.thumbnail && formData.thumbnail.startsWith('blob:')) {
        thumbnailUrl = await awaitUpload('thumbnail') || null;
      }
      const payload = {
        ...formData,
        thumbnail: thumbnailUrl,
        category: 'mandi_product',
        title: formData.title || formData.material_name || 'Product'
      };
      if (editId) {
        await api.put(`/listings/${editId}`, payload);
      } else {
        await api.post('/listings/mandi', payload);
      }
      navigate('/partner/inventory');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limit_reached) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.message || "Failed to save product.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: get parent type ID for sub-type dropdown
  const getSelectedTypeId = () => {
    const t = sellerTypes.find(t => t.name === formData.type_name);
    return t?._id || null;
  };

  // Filtered sub-types for selected type
  const filteredSubTypes = sellerSubTypes.filter(st => {
    const parentId = getSelectedTypeId();
    return parentId && (st.parent_attribute_id?._id === parentId || st.parent_attribute_id === parentId);
  });

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-[#001b4e] px-5 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-[20px] font-medium">{editId ? 'Edit Product' : 'Add Product to Stock'}</h1>
      </div>

      <div className="p-5 space-y-5">
        {/* Subscription Limit Warning */}
        {!subscriptionLimits.canAddListing && !editId && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4 shadow-sm shadow-rose-900/5">
            <div className="flex gap-3">
              <Tag className="text-rose-500 shrink-0 mt-0.5" size={20} />
              <div className="text-left">
                <h4 className="text-[15px] font-black text-rose-900 uppercase tracking-tight">Listing Limit Reached</h4>
                <p className="text-[13px] text-rose-700 leading-relaxed font-medium mt-1">
                  {subscriptionLimits.message || "Your current plan limit has been reached. Please upgrade your plan or delete an existing product to add a new one."}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/partner/subscription')}
              className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
            >
              Upgrade Plan Now
            </button>
          </div>
        )}

        {/* STEP 1: Product Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-[#001b4e] text-white flex items-center justify-center text-[11px] font-black">1</div>
            <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Product Category</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium -mt-1">Choose what material you're selling</p>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map(cat => (
              <button 
                key={cat._id}
                onClick={() => setFormData({...formData, material_id: cat._id, material_name: cat.name, grade_id: '', type_name: '', sub_type_name: '', brand_name: '', price: '', stock: '', description: ''})}
                className={`p-3.5 rounded-xl border-2 text-[13px] font-bold transition-all ${
                  formData.material_id === cat._id ? 'border-[#001b4e] bg-blue-50 text-[#001b4e] shadow-md shadow-blue-900/5' : 'border-slate-100 bg-slate-50/50 text-slate-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Location Info Note */}
        {subscriptionInfo?.district && (
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white mt-0.5">
              <Box size={14} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#001b4e] uppercase tracking-tight">Listing Location</p>
              <p className="text-[10px] text-blue-600 font-bold opacity-80 leading-relaxed mt-0.5">
                This product will be visible to customers in <span className="underline">{subscriptionInfo.district}, {subscriptionInfo.state}</span>.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Type */}
        {formData.material_id && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black">2</div>
                <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Type</h3>
              </div>
              <button onClick={() => { setAddingType(true); setNewItemName(''); }} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1">
                <Plus size={12} /> Add New
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-1">
              {/gitti|aggregate/i.test(formData.material_name) ? 'e.g. 20mm, 40mm, 10mm, 6mm' : /sand|m.sand/i.test(formData.material_name) ? 'e.g. River Sand, M-Sand, Robo Sand' : 'e.g. Standard, Premium, Grade A'}
            </p>

            {/* Inline add */}
            <AnimatePresence>
              {addingType && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type name..." value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      className="flex-grow bg-blue-50 border border-blue-100 rounded-xl py-2.5 px-3 text-[13px] font-bold text-[#001b4e] outline-none" autoFocus />
                    <button onClick={() => handleAddAttribute('type')} disabled={savingAttr} className="px-3 bg-blue-600 text-white rounded-xl text-[11px] font-bold">
                      {savingAttr ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button onClick={() => setAddingType(false)} className="px-2 text-slate-400"><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {sellerTypes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {sellerTypes.map(t => (
                  <div key={t._id} className={`relative rounded-xl border-2 transition-all ${formData.type_name === t.name ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>
                    <button onClick={() => setFormData({...formData, type_name: t.name, sub_type_name: ''})}
                      className={`w-full p-3 pr-7 text-[12px] font-bold text-left ${formData.type_name === t.name ? 'text-blue-700' : 'text-slate-400'}`}>
                      {t.name}
                    </button>
                    <button onClick={() => handleDeleteAttribute(t._id, 'type', t.name)}
                      className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : !addingType && (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold">No types added yet. Click "Add New" above.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: Sub-Type */}
        {formData.type_name && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[11px] font-black">3</div>
                <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Sub-Type</h3>
              </div>
              <button onClick={() => { setAddingSubType(true); setNewItemName(''); }} className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1">
                <Plus size={12} /> Add New
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-1">
              {/gitti|aggregate/i.test(formData.material_name) ? 'e.g. Washed, Crushed, Fine' : 'e.g. Grade A, Grade B, Fine'}
            </p>

            <AnimatePresence>
              {addingSubType && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Sub-type name..." value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      className="flex-grow bg-orange-50 border border-orange-100 rounded-xl py-2.5 px-3 text-[13px] font-bold text-[#001b4e] outline-none" autoFocus />
                    <button onClick={() => handleAddAttribute('sub_type', getSelectedTypeId())} disabled={savingAttr} className="px-3 bg-orange-500 text-white rounded-xl text-[11px] font-bold">
                      {savingAttr ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button onClick={() => setAddingSubType(false)} className="px-2 text-slate-400"><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredSubTypes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredSubTypes.map(st => (
                  <div key={st._id} className={`relative rounded-xl border-2 transition-all ${formData.sub_type_name === st.name ? 'border-orange-500 bg-orange-50' : 'border-slate-100'}`}>
                    <button onClick={() => setFormData({...formData, sub_type_name: st.name})}
                      className={`w-full p-3 pr-7 text-[12px] font-bold text-left ${formData.sub_type_name === st.name ? 'text-orange-700' : 'text-slate-400'}`}>
                      {st.name}
                    </button>
                    <button onClick={() => handleDeleteAttribute(st._id, 'sub_type', st.name)}
                      className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : !addingSubType && (
              <div className="flex items-center gap-2">
                <button onClick={() => setFormData({...formData, sub_type_name: ''})}
                  className="text-[11px] font-bold text-slate-400 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  Skip (No sub-type)
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 4: Brand */}
        {formData.material_id && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-black">4</div>
                <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Brand</h3>
              </div>
              <button onClick={() => { setAddingBrand(true); setNewItemName(''); }} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1">
                <Plus size={12} /> Add New
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-1">e.g. UltraTech, ACC, Local Brand</p>

            <AnimatePresence>
              {addingBrand && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Brand name..." value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      className="flex-grow bg-emerald-50 border border-emerald-100 rounded-xl py-2.5 px-3 text-[13px] font-bold text-[#001b4e] outline-none" autoFocus />
                    <button onClick={() => handleAddAttribute('brand')} disabled={savingAttr} className="px-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold">
                      {savingAttr ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button onClick={() => setAddingBrand(false)} className="px-2 text-slate-400"><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {sellerBrands.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {sellerBrands.map(b => (
                  <div key={b._id} className={`relative rounded-xl border-2 transition-all ${formData.brand_name === b.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                    <button onClick={() => setFormData({...formData, brand_name: b.name})}
                      className={`w-full p-3 pr-7 text-[12px] font-bold text-left ${formData.brand_name === b.name ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {b.name}
                    </button>
                    <button onClick={() => handleDeleteAttribute(b._id, 'brand', b.name)}
                      className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : !addingBrand && (
              <div className="text-[11px] font-bold text-slate-400 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-center">
                No brands added yet
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 5: Price & Stock */}
        {formData.material_id && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px] font-black">5</div>
              <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Price & Stock</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Price *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IndianRupee size={16} /></div>
                  <input type="number" placeholder="0.00" value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-3 text-[14px] font-bold text-[#001b4e] outline-none focus:bg-white focus:border-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Unit</label>
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-3 text-[14px] font-bold text-[#001b4e] outline-none">
                  <option value="Bag">Per Bag</option>
                  <option value="Trolley">Per Trolley</option>
                  <option value="Cubic Feet">Per CFT</option>
                  <option value="Piece">Per Piece</option>
                  <option value="Ton">Per Ton</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Stock Qty</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Database size={16} /></div>
                <input type="number" placeholder="Available quantity" value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-3 text-[14px] font-bold text-[#001b4e] outline-none focus:bg-white focus:border-blue-500/20" />
              </div>
            </div>

            {/* Featured Listing Toggle */}
            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${formData.is_featured ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.is_featured ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                   <Tag size={16} />
                </div>
                <div>
                   <div className="flex items-center gap-2">
                     <span className="text-[12px] font-black text-[#001b4e] uppercase tracking-tight">Featured Listing</span>
                     {subscriptionInfo && !subscriptionInfo.isPro && (
                       <span className="bg-[#001b4e] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Pro</span>
                     )}
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Boost visibility in marketplace</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!subscriptionLimits.canFeature && !formData.is_featured) {
                    toast.error(subscriptionLimits.message || "Featured limit reached! Upgrade to feature more.");
                  } else {
                    setFormData({...formData, is_featured: !formData.is_featured});
                  }
                }}
                className={`w-12 h-6 rounded-full relative transition-all ${formData.is_featured ? 'bg-blue-600' : 'bg-slate-200'} ${(!subscriptionLimits.canFeature && !formData.is_featured) ? 'opacity-50 grayscale' : ''}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_featured ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Image & Description (Optional) */}
        {formData.material_id && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-[#001b4e] font-bold text-[13px] uppercase tracking-wider">Photo & Description <span className="text-slate-300 font-medium normal-case">(Optional)</span></h3>
            <div className="relative">
              <div onClick={() => fileInputRef.current.click()}
                className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 h-32 flex items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98] transition-all">
                {formData.thumbnail ? (
                  <img src={formData.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <Camera size={28} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tap to upload</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} />
              </div>
              {formData.thumbnail && (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail: null }))}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>
            <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[13px] font-medium text-[#001b4e] min-h-[80px] outline-none focus:bg-white focus:border-blue-500/20"
              placeholder="Any additional details about this product..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} />
          </motion.div>
        )}

        {/* Product Preview & Submit */}
        {formData.material_id && formData.price && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Preview Card */}
            <div className="bg-gradient-to-br from-[#001b4e] to-[#0f3472] rounded-2xl p-5 text-white space-y-2">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">Product Preview</div>
              <h4 className="text-[16px] font-black leading-tight">{formData.title || formData.material_name}</h4>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.type_name && <span className="text-[9px] font-bold bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">{formData.type_name}</span>}
                {formData.sub_type_name && <span className="text-[9px] font-bold bg-orange-500/20 text-orange-200 px-2 py-1 rounded-full">{formData.sub_type_name}</span>}
                {formData.brand_name && <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-full">{formData.brand_name}</span>}
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-[24px] font-black">₹{Number(formData.price).toLocaleString()}</span>
                <span className="text-[11px] text-blue-300 font-bold">/ {formData.unit}</span>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-emerald-600 text-white py-5 rounded-xl font-bold text-[15px] uppercase tracking-[0.15em] shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : (
                <>{editId ? 'Update Product' : 'Add to My Stock'}<ChevronRight size={20} /></>
              )}
            </button>
          </motion.div>
        )}
      </div>
      {/* Limit Reached Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Box size={32} />
              </div>
              <h3 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight mb-2">Listing Limit Reached</h3>
              <p className="text-slate-400 text-[13px] font-bold uppercase tracking-tight opacity-60 leading-relaxed mb-8">
                Your current plan allows only 1 active listing. Upgrade to Pro to list unlimited materials.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/partner/subscription')}
                  className="w-full py-4 bg-[#001b4e] text-white rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                >
                  Upgrade to Pro
                </button>
                <button 
                  onClick={() => setShowLimitModal(false)}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
