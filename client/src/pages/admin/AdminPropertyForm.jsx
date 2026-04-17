import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, IndianRupee, Home, Camera, 
  CheckCircle2, Save, X, Loader2, ArrowLeft,
  LayoutGrid, Layers, Briefcase, Star, Map, Pin, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

const INTENTS = [
  { id: 'sell', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
  { id: 'lease', label: 'For Lease' }
];

const FURNISHING_TYPES = [
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'semi-furnished', label: 'Semi-Furnished' },
  { id: 'fully-furnished', label: 'Fully-Furnished' }
];

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';

const INDIAN_STATES = INDIAN_STATES_DISTRICTS;

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [partners, setPartners] = useState([]);

  const [formData, setFormData] = useState({
    partner_id: '', category_id: '', subcategory_id: '', title: '', description: '',
    property_type: 'apartment', listing_intent: 'sell',
    location: { type: 'Point', coordinates: [77.1025, 28.7041] },
    address: { full_address: '', state: '', district: '', pincode: '' },
    pricing: { amount: '', currency: 'INR', negotiable: false, deposit: '', maintenance: '' },
    details: {
      area: { value: '', unit: 'sqft', super_built_up_area: '', carpet_area: '' },
      bhk: '', bathrooms: '', washrooms: '', furnishing: 'unfurnished',
      floor_number: '', total_floors: '', parking: 'none', facing: 'no-preference', possession: 'ready'
    },
    images: [], thumbnail: '', status: 'pending_approval', is_featured: false
  });

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [catRes, partnerRes] = await Promise.all([
          api.get('/admin/system/categories?type=property&parent_id=null'),
          api.get('/admin/users')
        ]);

        if (catRes.data.success) setCategories(catRes.data.data);
        if (partnerRes.data.success) {
          setPartners(partnerRes.data.data.filter(u => u.role === 'Agent' || u.source === 'Partner'));
        }

        if (isEdit) {
          const res = await api.get(`/admin/listings/detail/${id}`);
          if (res.data.success) {
            const d = res.data.data;
            setFormData({
              partner_id: d.partner_id?._id || d.partner_id || '',
              category_id: d.category_id?._id || d.category_id || '',
              subcategory_id: d.subcategory_id?._id || d.subcategory_id || '',
              title: d.title || '',
              description: d.description || '',
              property_type: d.property_type || 'apartment',
              listing_intent: d.listing_intent || 'sell',
              location: {
                type: 'Point',
                coordinates: d.location?.coordinates || [77.1025, 28.7041]
              },
              address: {
                full_address: d.address?.full_address || '',
                state: d.address?.state || '',
                district: d.address?.district || '',
                pincode: d.address?.pincode || ''
              },
              pricing: {
                amount: d.pricing?.amount || '',
                currency: d.pricing?.currency || 'INR',
                negotiable: d.pricing?.negotiable || false,
                deposit: d.pricing?.deposit || '',
                maintenance: d.pricing?.maintenance || ''
              },
              details: {
                area: {
                  value: d.details?.area?.value || '',
                  unit: d.details?.area?.unit || 'sqft',
                  super_built_up_area: d.details?.area?.super_built_up_area || '',
                  carpet_area: d.details?.area?.carpet_area || ''
                },
                bhk: d.details?.bhk || '',
                bathrooms: d.details?.bathrooms || '',
                washrooms: d.details?.washrooms || '',
                furnishing: d.details?.furnishing || 'unfurnished',
                floor_number: d.details?.floor_number || '',
                total_floors: d.details?.total_floors || '',
                parking: d.details?.parking || 'none',
                facing: d.details?.facing || 'no-preference',
                possession: d.details?.possession || 'ready'
              },
              images: d.images || [],
              thumbnail: d.thumbnail || '',
              status: d.status || 'pending_approval',
              is_featured: d.is_featured || false
            });
          }
        }
      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to sync database references.");
      } finally {
        setInitLoading(false);
      }
    };
    fetchInitData();
  }, [id, isEdit]);

  useEffect(() => {
    if (formData.category_id) {
      const fetchSubcategories = async () => {
        try {
          const res = await api.get(`/admin/system/categories?type=property&parent_id=${formData.category_id}`);
          if (res.data.success) {
            setSubcategories(res.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch property subcategories", err);
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [formData.category_id]);

  const handleInputChange = (e, fieldPath) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (type === 'number' && value !== '' ? Number(value) : value);

    setFormData(prev => {
      const updated = { ...prev };
      if (fieldPath) {
        const parts = fieldPath.split('.');
        let current = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = val;
      } else {
        updated[name] = val;
      }
      return updated;
    });
  };

  const handleImageChange = (urls) => {
    setFormData(prev => ({
      ...prev,
      images: urls,
      thumbnail: urls.length > 0 && !urls.includes(prev.thumbnail) ? urls[0] : prev.thumbnail
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = isEdit 
        ? await api.put(`/admin/listings/${id}`, formData)
        : await api.post('/admin/listings/property', formData);

      if (res.data.success) {
        setSuccess(`Property ${isEdit ? 'updated' : 'registered'} successfully!`);
        setTimeout(() => navigate('/admin/properties'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save property registry.");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <ArrowLeft size={18} />
          </button>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Management</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isEdit ? 'Refine Property' : 'Market Registration'}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* RIGHT: Form Areas */}
        <div className="flex-grow space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Core Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <LayoutGrid size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Classification</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Listing Title <span className="text-rose-500">*</span></label>
                  <input name="title" required value={formData.title} onChange={handleInputChange} className={inputClass} placeholder="e.g. Premium 3BHK Penthouse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Market Category</label>
                    <select name="category_id" required value={formData.category_id} onChange={e => { handleInputChange(e); handleInputChange({ target: { name: 'subcategory_id', value: '', type: 'text' } }); }} className={inputClass}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {subcategories.length > 0 ? (
                    <div>
                      <label className={labelClass}>Sub Category</label>
                      <select name="subcategory_id" required value={formData.subcategory_id} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select Sub Category</option>
                        {subcategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Assigned Agent</label>
                      <select name="partner_id" required value={formData.partner_id} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select Account</option>
                        {partners.map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {subcategories.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Assigned Agent</label>
                      <select name="partner_id" required value={formData.partner_id} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select Account</option>
                        {partners.map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelClass}>Listing Intent</label>
                  <div className="flex gap-4">
                    {INTENTS.map(i => (
                      <button key={i.id} type="button" onClick={() => handleInputChange({ target: { name: 'listing_intent', value: i.id } })} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${formData.listing_intent === i.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Data */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Geographic Data</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>State</label>
                    <select required value={formData.address.state} onChange={e => handleInputChange(e, 'address.state')} className={inputClass}>
                      <option value="">Select State</option>
                      {Object.keys(INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>District</label>
                    <select required value={formData.address.district} onChange={e => handleInputChange(e, 'address.district')} disabled={!formData.address.state} className={inputClass}>
                      <option value="">Select District</option>
                      {formData.address.state && INDIAN_STATES[formData.address.state]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Full Address</label>
                    <input required value={formData.address.full_address} onChange={e => handleInputChange(e, 'address.full_address')} className={inputClass} placeholder="Street, Landmark..." />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input required maxLength={6} value={formData.address.pincode} onChange={e => handleInputChange(e, 'address.pincode')} className={inputClass} placeholder="6-digit" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Pin size={14} className="text-rose-500" />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">GPS Coordinates</span>
                   </div>
                   <div className="flex gap-3">
                      <input type="number" step="any" step={0.000001} className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.location.coordinates[1]} onChange={e => { const c = [...formData.location.coordinates]; c[1] = parseFloat(e.target.value); setFormData(p => ({...p, location: {...p.location, coordinates: c}})) }} placeholder="Lat" />
                      <input type="number" step="any" className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.location.coordinates[0]} onChange={e => { const c = [...formData.location.coordinates]; c[0] = parseFloat(e.target.value); setFormData(p => ({...p, location: {...p.location, coordinates: c}})) }} placeholder="Long" />
                   </div>
                </div>
              </div>
            </div>

            {/* Metrics & Valuation */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <IndianRupee size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Metrics & Valuation</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Asking Price (₹)</label>
                    <input type="number" required value={formData.pricing.amount} onChange={e => handleInputChange(e, 'pricing.amount')} className={inputClass} placeholder="Ex: 8500000" />
                  </div>
                  <div className="flex items-center gap-4 pt-7">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full transition-all relative ${formData.pricing.negotiable ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${formData.pricing.negotiable ? 'translate-x-4' : ''}`} />
                        <input type="checkbox" className="hidden" checked={formData.pricing.negotiable} onChange={e => handleInputChange(e, 'pricing.negotiable')} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">Price Negotiable</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className={labelClass}>BHK</label>
                    <input type="number" value={formData.details.bhk} onChange={e => handleInputChange(e, 'details.bhk')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Bathrooms</label>
                    <input type="number" value={formData.details.bathrooms} onChange={e => handleInputChange(e, 'details.bathrooms')} className={inputClass} />
                  </div>
                  <div>
                     <label className={labelClass}>Area (Sqft)</label>
                     <input type="number" value={formData.details.area.value} onChange={e => handleInputChange(e, 'details.area.value')} className={inputClass} />
                  </div>
                  <div>
                     <label className={labelClass}>Floors</label>
                     <input type="number" value={formData.details.total_floors} onChange={e => handleInputChange(e, 'details.total_floors')} className={inputClass} />
                  </div>
                </div>
                <div>
                   <label className={labelClass}>Furnishing</label>
                   <div className="flex gap-3">
                      {FURNISHING_TYPES.map(f => (
                        <button key={f.id} type="button" onClick={() => handleInputChange({ target: { name: 'furnishing', value: f.id } }, 'details.furnishing')} className={`flex-1 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${formData.details.furnishing === f.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                          {f.label}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Assets & Status */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <Camera size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Market Assets</span>
              </div>
              <div className="p-6 space-y-6">
                <MediaDropZone value={formData.images} onChange={handleImageChange} label="Gallery" />
                <div>
                  <label className={labelClass}>Detailed Description</label>
                  <textarea rows={4} name="description" value={formData.description} onChange={handleInputChange} className={`${inputClass} resize-none`} placeholder="Unique selling points..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center gap-3">
                         <Star className={formData.is_featured ? 'text-amber-500' : 'text-slate-300'} fill={formData.is_featured ? 'currentColor' : 'none'} size={16} />
                         <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Featured</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.is_featured} onChange={e => handleInputChange(e, 'is_featured')} className="sr-only peer" />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                      </label>
                   </div>
                   <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold_rented">Sold / Rented</option>
                   </select>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    {error && <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5"><AlertCircle size={14} /> {error}</span>}
                    {success && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> {success}</span>}
                 </div>
                 <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 uppercase tracking-wide">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {isEdit ? 'Save Changes' : 'Register Property'}
                    </button>
                 </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
