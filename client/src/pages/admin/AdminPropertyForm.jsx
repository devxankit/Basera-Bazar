import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, IndianRupee, Home, Camera, 
  CheckCircle2, ArrowRight, ArrowLeft, Save, Loader2, 
  Plus, X, Info, LayoutGrid, Layers, Maximize2, 
  Bed, Bath, Warehouse, Briefcase, Star, Map, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import MediaDropZone from '../../components/common/MediaDropZone';

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: Building2 },
  { id: 'hostel_pg', label: 'Hostel/PG', icon: Home },
  { id: 'office', label: 'Office Space', icon: Briefcase },
  { id: 'plot', label: 'Land/Plot', icon: Map },
  { id: 'warehouse', label: 'Warehouse', icon: Warehouse }
];

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

const INDIAN_STATES = {
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer", "Kota", "Bhilwara", "Alwar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Noida", "Ghaziabad", "Prayagraj"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "East Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"]
};

export default function AdminPropertyForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [partners, setPartners] = useState([]);

  const [formData, setFormData] = useState({
    partner_id: '',
    category_id: '',
    subcategory_id: '',
    title: '',
    description: '',
    property_type: 'apartment',
    listing_intent: 'sell',
    location: {
      type: 'Point',
      coordinates: [77.1025, 28.7041] // Default Delhi
    },
    address: {
      full_address: '',
      state: '',
      district: '',
      pincode: ''
    },
    pricing: {
      amount: '',
      currency: 'INR',
      negotiable: false,
      deposit: '',
      maintenance: ''
    },
    details: {
      area: {
        value: '',
        unit: 'sqft',
        super_built_up_area: '',
        carpet_area: ''
      },
      bhk: '',
      bathrooms: '',
      washrooms: '',
      furnishing: 'unfurnished',
      floor_number: '',
      total_floors: '',
      parking: 'none',
      facing: 'no-preference',
      possession: 'ready'
    },
    images: [],
    thumbnail: '',
    status: 'pending_approval',
    is_featured: false
  });

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [catRes, partnerRes] = await Promise.all([
          api.get('/admin/system/categories?type=property'),
          api.get('/admin/users') // To pick a partner
        ]);

        if (catRes.data.success) setCategories(catRes.data.data);
        if (partnerRes.data.success) {
            // Filter to only agents
            setPartners(partnerRes.data.data.filter(u => u.role === 'Agent' || u.source === 'Partner'));
        }

        if (isEdit) {
          try {
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
              if (d.category_id?._id || d.category_id) {
                fetchSubcategories(d.category_id?._id || d.category_id);
              }
            }
          } catch (err) {
            console.error("Fetch detail error:", err);
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
      images: urls,
      thumbnail: urls.length > 0 && !urls.includes(prev.thumbnail) ? urls[0] : prev.thumbnail
    }));
  };

  const handleSubmit = async (e, forceSubmit = false) => {
    e?.preventDefault();
    if (!forceSubmit && step < 4 && !isEdit) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("📤 Submitting Property Data:", formData);
      const res = isEdit 
        ? await api.put(`/admin/listings/${id}`, formData)
        : await api.post('/admin/listings/property', formData);

      if (res.data.success) {
        setSuccess(`Property ${isEdit ? 'Updated' : 'Marketed'} Successfully!`);
        setTimeout(() => navigate('/admin/properties'), 2000);
      }
    } catch (err) {
      console.error("Submission error details:", err.response?.data);
      setError(err.response?.data?.message || err.message || "Failed to save property registry.");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 border-r-4 border-r-transparent border-b-4 border-indigo-600/20"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Establishing Secure DB Connection...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-50 rounded-lg">
               <Building2 className="text-indigo-600" size={16} />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory / Real Estate</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            {isEdit ? 'Refine Listing' : 'Market Registration'}
          </h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
           {[1, 2, 3, 4].map((s) => (
             <div key={s} className="flex items-center gap-2">
               <div 
                 onClick={() => setStep(s)}
                 className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                 step === s ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110' : 
                 step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
               }`}>
                 {step > s ? <CheckCircle2 size={16} /> : s}
               </div>
               {s < 4 && <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-indigo-600"
                   initial={{ width: 0 }}
                   animate={{ width: step > s ? '100%' : '0%' }}
                 />
               </div>}
             </div>
           ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2">
           <AnimatePresence mode="wait">
             {/* STEP 1: BASIC INFO */}
             {step === 1 && (
               <motion.div 
                 key="step1"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
               >
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Core Classification</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identify the primary property tier</p>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Listing Title</label>
                        <input 
                          required 
                          placeholder="e.g. Premium 3BHK Penthouse in High-Rise" 
                          className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                          value={formData.title}
                          onChange={(e) => handleInputChange(e)}
                          name="title"
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assigned Agent/Partner</label>
                          <select 
                            required 
                            name="partner_id"
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer"
                            value={formData.partner_id}
                            onChange={(e) => handleInputChange(e)}
                          >
                            <option value="">Select Account</option>
                            {partners.map(p => (
                              <option key={p._id} value={p._id}>{p.name} ({p.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Listing Intent</label>
                          <div className="flex bg-slate-50 p-1.5 rounded-[20px] border border-slate-100">
                            {INTENTS.map(i => (
                              <button
                                key={i.id}
                                type="button"
                                onClick={() => handleInputChange({ target: { name: 'listing_intent', value: i.id } })}
                                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black transition-all ${
                                  formData.listing_intent === i.id ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {i.label}
                              </button>
                            ))}
                          </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Market Category</label>
                           <select 
                             required 
                             name="category_id"
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-black text-slate-700 transition-all cursor-pointer"
                             value={formData.category_id}
                             onChange={(e) => handleInputChange(e)}
                           >
                             <option value="">Select Category</option>
                             {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                           </select>
                        </div>
                      </div>
                   </div>
               </motion.div>
             )}

             {/* STEP 2: LOCATION */}
             {step === 2 && (
               <motion.div 
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
               >
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                    <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-xl">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Geographic Data</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pinpoint the physical location</p>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">State</label>
                           <select 
                             required 
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                             value={formData.address.state}
                             onChange={(e) => handleInputChange(e, 'address.state')}
                           >
                             <option value="">Select State</option>
                             {Object.keys(INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">District/City</label>
                           <select 
                             required 
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all disabled:opacity-50"
                             value={formData.address.district}
                             onChange={(e) => handleInputChange(e, 'address.district')}
                             disabled={!formData.address.state}
                           >
                             <option value="">Select District</option>
                             {formData.address.state && INDIAN_STATES[formData.address.state].map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Precise Address</label>
                           <input 
                             required 
                             placeholder="Street, Landmark, Neighborhood"
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                             value={formData.address.full_address}
                             onChange={(e) => handleInputChange(e, 'address.full_address')}
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">PIN Code</label>
                           <input 
                             required 
                             placeholder="6-digit"
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all text-center"
                             value={formData.address.pincode}
                             onChange={(e) => handleInputChange(e, 'address.pincode')}
                             maxLength={6}
                           />
                        </div>
                     </div>

                     <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <Pin className="text-rose-500" size={18} />
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">GPS Coordinates</h4>
                           </div>
                           <button 
                             type="button"
                             onClick={() => {
                               if (navigator.geolocation) {
                                 navigator.geolocation.getCurrentPosition(
                                   (position) => {
                                     const newCoords = [position.coords.longitude, position.coords.latitude];
                                     setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: newCoords } }));
                                   },
                                   (error) => alert("Failed to fetch location automatically. Please ensure location permissions are granted or enter manually.")
                                 );
                               } else {
                                 alert("Geolocation is not supported by your browser.");
                               }
                             }}
                             className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 active:scale-95"
                           >
                             Auto-Fetch
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Latitude</label>
                              <input 
                                type="number" 
                                step="any"
                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-mono text-sm"
                                value={formData.location.coordinates[1]}
                                onChange={(e) => {
                                   const newCoords = [...formData.location.coordinates];
                                   newCoords[1] = parseFloat(e.target.value);
                                   setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: newCoords } }));
                                }}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Longitude</label>
                              <input 
                                type="number" 
                                step="any"
                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-mono text-sm"
                                value={formData.location.coordinates[0]}
                                onChange={(e) => {
                                   const newCoords = [...formData.location.coordinates];
                                   newCoords[0] = parseFloat(e.target.value);
                                   setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: newCoords } }));
                                }}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {/* STEP 3: PRICING & DETAILS */}
             {step === 3 && (
               <motion.div 
                 key="step3"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
               >
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xl">
                      <IndianRupee size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Valuation & Metrics</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Financials and physical dimensions</p>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Asking Price (₹)</label>
                           <input 
                             type="number"
                             required 
                             placeholder="Ex: 8500000"
                             className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-amber-500 outline-none font-bold text-slate-700 transition-all text-2xl"
                             value={formData.pricing.amount}
                             onChange={(e) => handleInputChange(e, 'pricing.amount')}
                           />
                        </div>
                        <div className="flex items-center gap-8 mt-auto py-5">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price Negotiable</span>
                              <p className="text-xs text-slate-400">Can the final price be discussed?</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer scale-110">
                             <input type="checkbox" checked={formData.pricing.negotiable} onChange={(e) => handleInputChange(e, 'pricing.negotiable')} className="sr-only peer" />
                             <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                           </label>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Area (Sqft)</label>
                           <input type="number" placeholder="Value" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold" value={formData.details.area.value} onChange={(e) => handleInputChange(e, 'details.area.value')} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Super Built-up (Sqft)</label>
                           <input type="number" placeholder="Value" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold" value={formData.details.area.super_built_up_area} onChange={(e) => handleInputChange(e, 'details.area.super_built_up_area')} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Carpet Area (Sqft)</label>
                           <input type="number" placeholder="Value" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold" value={formData.details.area.carpet_area} onChange={(e) => handleInputChange(e, 'details.area.carpet_area')} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { name: 'bhk', label: 'BHK', icon: Home },
                          { name: 'bathrooms', label: 'Bathrooms', icon: Bath },
                          { name: 'washrooms', label: 'Washrooms', icon: Bath },
                          { name: 'total_floors', label: 'Total Floors', icon: Layers }
                        ].map(item => (
                          <div key={item.name} className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{item.label}</label>
                             <div className="relative group">
                                <item.icon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="number" className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none font-bold transition-all" value={formData.details[item.name]} onChange={(e) => handleInputChange(e, `details.${item.name}`)} />
                             </div>
                          </div>
                        ))}
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Furnishing Status</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {FURNISHING_TYPES.map(f => (
                             <button
                               key={f.id}
                               type="button"
                               onClick={() => handleInputChange({ target: { name: 'furnishing', value: f.id } }, 'details.furnishing')}
                               className={`py-4 rounded-2xl border-2 font-black text-[11px] uppercase tracking-widest transition-all ${
                                 formData.details.furnishing === f.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                               }`}
                             >
                               {f.label}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {/* STEP 4: MEDIA & FINAL */}
             {step === 4 && (
               <motion.div 
                 key="step4"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
               >
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Market Presentation</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual assets and final status</p>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-10">
                     <div className="space-y-3">
                        <MediaDropZone 
                          value={formData.images}
                          onChange={handleImageChange}
                          label="Property Showcase Gallery"
                          description="Add high-resolution property imagery"
                        />
                        
                        {formData.images.length > 0 && (
                          <div className="mt-8 space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Select Primary Market Image</label>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                               {formData.images.map(img => (
                                 <button
                                   key={img}
                                   type="button"
                                   onClick={() => setFormData(prev => ({ ...prev, thumbnail: img }))}
                                   className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${
                                     formData.thumbnail === img ? 'border-emerald-500 scale-105' : 'border-transparent'
                                   }`}
                                 >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                    {formData.thumbnail === img && (
                                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="text-white" size={24} />
                                      </div>
                                    )}
                                 </button>
                               ))}
                            </div>
                          </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Description</label>
                        <textarea 
                           rows={6}
                           className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[32px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                           placeholder="Describe the property's unique selling points, amenities, and surroundings..."
                           value={formData.description}
                           onChange={(e) => handleInputChange(e)}
                           name="description"
                        />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-inner">
                           <div className="flex items-center gap-5">
                              <div className={`p-4 rounded-full ${formData.is_featured ? 'bg-amber-400 text-white' : 'bg-slate-200 text-white'}`}>
                                <Star fill={formData.is_featured ? "currentColor" : "none"} size={20} />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900">Featured Listing</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Show in top marketplace slots</p>
                              </div>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer scale-110">
                             <input type="checkbox" checked={formData.is_featured} onChange={(e) => handleInputChange(e, 'is_featured')} className="sr-only peer" />
                             <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                           </label>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 px-2">Market Status</label>
                          <select 
                            className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[32px] focus:border-indigo-600 outline-none font-bold cursor-pointer"
                            value={formData.status}
                            onChange={(e) => handleInputChange(e)}
                            name="status"
                          >
                             <option value="pending_approval">Pending Moderation</option>
                             <option value="active">Live (Verified)</option>
                             <option value="inactive">Unlisted (Paused)</option>
                             <option value="sold_rented">Sold / Rented</option>
                          </select>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
           <div className="bg-white rounded-[44px] p-10 border border-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.07)] sticky top-10 overflow-hidden relative group">
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50 transition-transform group-hover:scale-110">
                  <Maximize2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic">Listing Control</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Step {step} of 4: Registry Entry</p>
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed tracking-tight border-l-4 border-indigo-100 pl-4 py-1">
                  Ready to go live? All listings are synchronized across our verified marketplace cloud. Please ensure data accuracy before publishing.
                </p>
              </div>

              <div className="space-y-4 pt-10 relative z-10">
                 {isEdit && (
                   <button 
                     type="button" 
                     onClick={(e) => handleSubmit(e, true)}
                     disabled={loading}
                     className="w-full flex items-center justify-center gap-4 py-7 bg-emerald-500 text-white rounded-[28px] font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} />}
                     Update Changes
                   </button>
                 )}

                 <button 
                   type={isEdit ? "button" : "submit"} 
                   onClick={(e) => {
                     if (isEdit) {
                       if (step < 4) setStep(step + 1);
                       else handleSubmit(e, true);
                     }
                   }}
                   disabled={loading}
                   className={`w-full flex items-center justify-center gap-4 py-7 ${isEdit ? 'bg-slate-800 text-white py-5' : 'bg-indigo-600 text-white py-7'} rounded-[28px] font-black text-xl shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50`}
                 >
                   {loading && !isEdit ? <Loader2 className="animate-spin" size={24} /> : (step === 4 ? <Save size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />)}
                   {step === 4 ? (isEdit ? 'Save on Final Step' : 'Publish Property') : (isEdit ? 'Next Page' : 'Continue Submission')}
                 </button>

                 {step > 1 && (
                   <button 
                    type="button" 
                    onClick={() => setStep(step - 1)} 
                    className="w-full flex items-center justify-center gap-4 py-5 bg-slate-50 text-slate-400 rounded-[28px] font-black text-lg hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                   >
                     <ArrowLeft size={18} strokeWidth={3} />
                     Go Back
                   </button>
                 )}
                 <button 
                  type="button" 
                  onClick={() => navigate(-1)} 
                  className="w-full flex items-center justify-center gap-4 py-4 text-slate-400 rounded-[28px] font-black text-sm hover:text-rose-500 transition-all mt-4"
                 >
                   Discard Changes
                 </button>
              </div>

              <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-start gap-4">
                  <Info className="text-rose-500 shrink-0 mt-1" />
                  <p className="text-rose-200 font-bold text-sm leading-tight">{error}</p>
                </motion.div>}

                {success && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-start gap-4">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" />
                  <p className="text-emerald-200 font-bold text-sm leading-tight">{success}</p>
                </motion.div>}
              </AnimatePresence>
           </div>
        </div>
      </form>
    </div>
  );
}
