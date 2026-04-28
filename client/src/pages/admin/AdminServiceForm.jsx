import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Camera, 
  CheckCircle2, Save, X, Loader2, ArrowLeft,
  LayoutGrid, Layers, Briefcase, Star, Map, Pin, Video, Clock, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';

const INDIAN_STATES = INDIAN_STATES_DISTRICTS;

export default function AdminServiceForm() {
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
    partner_id: '', category_id: '', subcategory_id: '', title: '',
    short_description: '', full_description: '', service_type: '',
    years_of_experience: '', video_link: '',
    location: { type: 'Point', coordinates: [77.1025, 28.7041] },
    address: { full_address: '', state: '', district: '', pincode: '' },
    portfolio_images: [], thumbnail: '', service_radius_km: 10,
    status: 'pending_approval', is_featured: false
  });

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [catRes, partnerRes] = await Promise.all([
          api.get('/admin/system/categories?type=service'),
          api.get('/admin/users')
        ]);

        if (catRes.data.success) setCategories(catRes.data.data);
        if (partnerRes.data.success) {
            setPartners(partnerRes.data.data.filter(u => 
              u.role === 'Service Provider' || 
              u.partner_type === 'service_provider' || 
              (u.roles && u.roles.includes('service_provider'))
            ));
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
              short_description: d.short_description || '',
              full_description: d.full_description || '',
              service_type: d.service_type || '',
              years_of_experience: d.years_of_experience || '',
              video_link: d.video_link || '',
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
              portfolio_images: d.portfolio_images || [],
              thumbnail: d.thumbnail || '',
              service_radius_km: d.service_radius_km || 10,
              status: d.status || 'pending_approval',
              is_featured: d.is_featured || false
            });
            if (d.category_id?._id || d.category_id) {
              fetchSubcategories(d.category_id?._id || d.category_id);
            }
          }
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchInitData();
  }, [id, isEdit]);

  const fetchSubcategories = async (catId) => {
    try {
      const res = await api.get(`/admin/system/categories?parent_id=${catId}`);
      if (res.data.success) setSubcategories(res.data.data);
    } catch (err) {
      console.error("Subcat error:", err);
    }
  };

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

      if (name === 'category_id') fetchSubcategories(value);
      return updated;
    });
  };

  const handleImageChange = (urls) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: urls,
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
        : await api.post('/admin/listings/service', formData);

      if (res.data.success) {
        setSuccess(`Service ${isEdit ? 'updated' : 'registered'} successfully!`);
        setTimeout(() => navigate('/admin/services'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save service registry.");
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <ArrowLeft size={18} />
          </button>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Management</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isEdit ? 'Refine Service' : 'Create New Service'}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-grow space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identity & Experience */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <LayoutGrid size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Service Identity</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Service Title <span className="text-rose-500">*</span></label>
                  <input name="title" required value={formData.title} onChange={handleInputChange} className={inputClass} placeholder="e.g. Professional Home Painting" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Top Category <span className="text-rose-500">*</span></label>
                    <select name="category_id" required value={formData.category_id} onChange={handleInputChange} className={inputClass}>
                      <option value="">Select Top Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  {subcategories.length > 0 && (
                    <div>
                      <label className={labelClass}>Sub Category</label>
                      <select name="subcategory_id" value={formData.subcategory_id} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select Subcategory (Optional)</option>
                        {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Assigned Provider</label>
                    <select name="partner_id" required value={formData.partner_id} onChange={handleInputChange} className={inputClass}>
                      <option value="">Select Account</option>
                      {partners.map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className={labelClass}>Experience (Years)</label>
                      <input type="number" name="years_of_experience" value={formData.years_of_experience} onChange={handleInputChange} className={inputClass} placeholder="e.g. 5" />
                   </div>
                   <div>
                      <label className={labelClass}>Service Type</label>
                      <select name="service_type" value={formData.service_type} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select Type</option>
                        <option value="Hourly Rate">Hourly Rate</option>
                        <option value="Fixed Price">Fixed Price</option>
                        <option value="Project Based">Project Based</option>
                        <option value="Consultation">Consultation</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>

            {/* Geographic Data */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <MapPin size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Service Coverage</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                      <label className={labelClass}>Full Address</label>
                      <input required value={formData.address.full_address} onChange={e => handleInputChange(e, 'address.full_address')} className={inputClass} placeholder="Street, Office location..." />
                   </div>
                   <div>
                      <label className={labelClass}>Service Radius (KM)</label>
                      <input type="number" name="service_radius_km" value={formData.service_radius_km} onChange={handleInputChange} className={inputClass} />
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Pin size={14} className="text-rose-500" />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">GPS Center</span>
                   </div>
                   <div className="flex gap-3">
                      <input type="number" step="any" className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.location.coordinates[1]} onChange={e => { const c = [...formData.location.coordinates]; c[1] = parseFloat(e.target.value); setFormData(p => ({...p, location: {...p.location, coordinates: c}})) }} placeholder="Lat" />
                      <input type="number" step="any" className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.location.coordinates[0]} onChange={e => { const c = [...formData.location.coordinates]; c[0] = parseFloat(e.target.value); setFormData(p => ({...p, location: {...p.location, coordinates: c}})) }} placeholder="Long" />
                   </div>
                </div>
              </div>
            </div>

            {/* Description & Assets */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <Camera size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Detailed Showcase</span>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className={labelClass}>Video Showcase (YouTube Link)</label>
                  <input name="video_link" value={formData.video_link} onChange={handleInputChange} className={inputClass} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Short Description</label>
                    <textarea rows={2} name="short_description" value={formData.short_description} onChange={handleInputChange} className={`${inputClass} resize-none`} placeholder="Brief summary of the service..." />
                  </div>
                  <div>
                    <label className={labelClass}>Detailed Description</label>
                    <textarea rows={2} name="full_description" value={formData.full_description} onChange={handleInputChange} className={`${inputClass} resize-none`} placeholder="Detailed explanation of services offered..." />
                  </div>
                </div>
                <MediaDropZone value={formData.portfolio_images} onChange={handleImageChange} label="Portfolio Gallery" />
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
                      <option value="suspended">Suspended</option>
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
                      {isEdit ? 'Save Changes' : 'Register Service'}
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
