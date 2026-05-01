import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Info, LayoutGrid, Type, 
  AlignLeft, FileText, Briefcase, 
  MapPin, Image as ImageIcon, Plus, 
  X, Navigation, ChevronDown, CheckCircle2,
  Trash2, UploadCloud, Building2, Star
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/DataEngine';
import { useAuth } from '../../context/AuthContext';

const SERVICE_CATEGORIES = [
  'AC maintenance', 'CCTV Services', 'Architect', 'Carpenter', 'Civil Engineer', 
  'Electrician', 'Interior Designer', 'Lift Installation', 'packers and movers', 
  'Painter', 'Plumber', 'Surveyor Ameen', 'Vastu Consultant'
];

const SERVICE_TYPES = ['Hourly Rate', 'Fixed Price', 'Project Based', 'Consultation'];

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';

const INDIA_DISTRICTS = INDIAN_STATES_DISTRICTS;

export default function AddService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const thumbnailRef = useRef(null);
  const portfolioRef = useRef(null);

  const [topCategories, setTopCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    category: '',
    subCategory: '',
    serviceName: '',
    serviceType: '',
    shortDescription: '',
    detailedDescription: '',
    experience: '',
    state: '',
    district: '',
    city: '',
    businessAddress: '',
    businessName: '',
    thumbnail: null,
    portfolio: [],
    videoLink: '',
    serviceRadiusKm: 10,
    latitude: 28.7041,
    longitude: 77.1025,
    is_featured: false
  });

  const [activeStep, setActiveStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    const fetchTopCats = async () => {
      try {
        const cats = await db.getCategories('service');
        setTopCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchTopCats();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
      return;
    }

    const fetchEditData = async () => {
      if (editId) {
        try {
          const res = await db.getById('listings', editId);
          if (res) {
            setFormData(prev => ({
              ...prev,
              category_id: res.category_id?._id || res.category_id || '',
              subcategory_id: res.subcategory_id?._id || res.subcategory_id || '',
              category: res.category_id?.name || '',
              serviceName: res.title || '',
              serviceType: res.details?.serviceType || '',
              shortDescription: res.short_description || '',
              detailedDescription: res.full_description || res.details?.description || '',
              experience: res.years_of_experience || res.details?.experience || '',
              state: res.address?.state || '',
              district: res.address?.district || '',
              city: res.address?.district || '',
              businessAddress: res.address?.full_address || res.details?.businessName || '',
              businessName: res.details?.businessName || user.businessName || '',
              thumbnail: res.thumbnail || '',
              portfolio: res.portfolio_images || [],
              videoLink: res.video_link || '',
              serviceRadiusKm: res.service_radius_km || 10,
              latitude: res.location?.coordinates?.[1] || 28.7041,
              longitude: res.location?.coordinates?.[0] || 77.1025,
              is_featured: res.is_featured || false
            }));
            
            if (res.category_id) {
              const catId = typeof res.category_id === 'object' ? res.category_id._id : res.category_id;
              db.getCategories('service', catId).then(setSubCategories);
            }
          }
        } catch (err) {
          console.error("Failed to fetch service for edit:", err);
        }
      } else if (user.businessName) {
        setFormData(prev => ({ ...prev, businessName: user.businessName }));
      }
    };
    
    fetchEditData();
  }, [editId, user, navigate]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'shortDescription' && value.length > 500) return;
    
    if (name === 'category_id') {
      const selected = topCategories.find(c => c._id === value);
      setFormData(prev => ({ 
        ...prev, 
        category_id: value, 
        category: selected?.name || '',
        subcategory_id: '',
        subCategory: ''
      }));
      if (value) {
        const subs = await db.getCategories('service', value);
        setSubCategories(subs);
      } else {
        setSubCategories([]);
      }
    } else if (name === 'subcategory_id') {
      const selected = subCategories.find(s => s._id === value);
      setFormData(prev => ({ ...prev, subcategory_id: value, subCategory: selected?.name || '' }));
    } else if (name === 'state') {
      const INDIAN_STATES = Object.keys(INDIAN_STATES_DISTRICTS);
      const normalizedState = INDIAN_STATES.find(s => s.toLowerCase() === value.toLowerCase()) || value;
      setFormData(prev => ({ ...prev, state: normalizedState, district: '', city: '' }));
    } else if (name === 'district') {
      setFormData(prev => ({ ...prev, district: value, city: prev.city || value }));
    } else if (name === 'is_featured') {
      const sub = user?.active_subscription_id;
      const limit = sub?.plan_snapshot?.featured_listings_limit || 0;
      const used = sub?.usage?.featured_listings_used || 0;
      
      if (e.target.checked && limit !== -1 && used >= limit) {
        alert(`You have reached your featured listings limit of ${limit}. Please upgrade your plan to feature more services.`);
        return;
      }
      setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e, field) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    if (field === 'thumbnail') {
      const compressedDataUrl = await compressImage(files[0]);
      setFormData(prev => ({ ...prev, thumbnail: compressedDataUrl }));
    } else if (field === 'portfolio') {
      const remainingSlots = 10 - formData.portfolio.length;
      const count = Math.min(files.length, remainingSlots);
      
      for (let i = 0; i < count; i++) {
        const compressedDataUrl = await compressImage(files[i]);
        setFormData(prev => ({ 
          ...prev, 
          portfolio: [...prev.portfolio, compressedDataUrl] 
        }));
      }
    }
  };

  const removePortfolioImage = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.category_id) {
      alert("Please select a service category.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Upload Images
      let thumbnailUrl = formData.thumbnail;
      if (formData.thumbnail && formData.thumbnail.startsWith('data:')) {
        const thumbBlob = await fetch(formData.thumbnail).then(r => r.blob());
        const thumbRes = await db.uploadFile(thumbBlob);
        thumbnailUrl = thumbRes.url;
      }

      const portfolioUrls = [];
      for (const img of formData.portfolio) {
        if (img.startsWith('data:')) {
          const blob = await fetch(img).then(r => r.blob());
          const res = await db.uploadFile(blob);
          portfolioUrls.push(res.url);
        } else {
          portfolioUrls.push(img);
        }
      }

      // 2. Prepare Payload natively matching the Mongoose schema
      const payload = {
        listing_type: 'service',
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        title: formData.serviceName,
        service_type: formData.serviceType,
        short_description: formData.shortDescription,
        full_description: formData.detailedDescription,
        years_of_experience: formData.experience,
        video_link: formData.videoLink,
        thumbnail: thumbnailUrl,
        portfolio_images: portfolioUrls,
        service_radius_km: formData.serviceRadiusKm,
        is_featured: formData.is_featured,
        address: {
          state: formData.state,
          district: formData.district,
          full_address: formData.businessAddress,
          city: formData.city
        },
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude || 0), parseFloat(formData.latitude || 0)]
        },
        // Legacy mapping support for fallback in DataEngine/create
        details: {
          businessName: formData.businessName
        }
      };

      // 3. Submit to API
      if (editId) {
        await db.update('listings', editId, payload);
      } else {
        await db.create('listings', payload);
      }
      
      setShowSuccessModal(true);
    } catch (error) {
       console.error('Error saving service:', error);
       alert(error.response?.data?.message || 'Failed to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [detecting, setDetecting] = useState(false);
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data && data.address) {
            const adr = data.address;
            const clean = (s) => s ? s.replace(/\s(district|zila|tahsil|division|tahsil|zila|subdivision|township|taluk|mandal)$/i, '').trim() : '';

            const stateName = adr.state || '';
            const INDIAN_STATES = Object.keys(INDIAN_STATES_DISTRICTS);
            const normalizedState = INDIAN_STATES.find(s => s.toLowerCase() === stateName.toLowerCase()) || stateName;
            
            const cityName = clean(adr.city || adr.town || adr.village || adr.suburb || 'Unknown');
            const rawDistrict = adr.county || adr.state_district || adr.city_district || cityName;

            // Find matching district
            const availableDistricts = INDIAN_STATES_DISTRICTS[normalizedState] || [];
            const cleanedRaw = clean(rawDistrict);
            const matchedDistrict = availableDistricts.find(d => clean(d) === cleanedRaw) || 
                                   availableDistricts.find(d => clean(d).includes(cleanedRaw) || cleanedRaw.includes(clean(d))) || 
                                   rawDistrict;

            setFormData(prev => ({
              ...prev,
              state: normalizedState,
              district: matchedDistrict,
              city: cityName === 'Unknown' ? (matchedDistrict || rawDistrict) : cityName,
              businessAddress: adr.road || prev.businessAddress,
              latitude,
              longitude
            }));
            alert("Location detected successfully!");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          alert("Failed to detect address details. Please enter manually.");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        alert(err.message || "Failed to detect location");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const states = Object.keys(INDIA_DISTRICTS);
  const districts = formData.state ? INDIA_DISTRICTS[formData.state] || [] : [];
  const categories = SERVICE_CATEGORIES;

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-[#f8fafc] font-sans pb-28">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 sticky top-0 z-[60] border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-medium text-[#001b4e]">{editId ? 'Edit Service' : 'Add New Service'}</h2>
      </div>

      <div className="p-6 space-y-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-[13px] text-blue-700 leading-relaxed font-medium">
            Fill in the details below to add your service. Fields marked with * are required.
          </p>
        </div>

        {/* Category Section */}
        <section className="space-y-3">
          <SectionHeader icon={<LayoutGrid size={14} />} title="Category" />
          <div className="grid grid-cols-1 gap-3">
            <SelectField 
              icon={<LayoutGrid size={14} />}
              label="Service Category *"
              name="category_id"
              value={formData.category_id}
              options={topCategories}
              onChange={handleChange}
              placeholder="Select Top Category"
            />

            {subCategories.length > 0 && (
              <SelectField 
                icon={<LayoutGrid size={14} />}
                label="Sub Category"
                name="subcategory_id"
                value={formData.subcategory_id}
                options={subCategories}
                onChange={handleChange}
                placeholder="Select Subcategory"
              />
            )}
          </div>
        </section>

        {/* Basic Information Section */}
        <section className="space-y-3">
          <SectionHeader icon={<Type size={14} />} title="Basic Information" />
          <div className="space-y-3">
            <InputField 
              icon={<Type size={14} />}
              label="Service Name *"
              name="serviceName"
              value={formData.serviceName}
              placeholder="E.g., Interior Design"
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-3">
              <InputField 
                icon={<Building2 size={14} />}
                label="Business Name *"
                name="businessName"
                value={formData.businessName}
                placeholder="Company Name"
                onChange={handleChange}
              />

              <SelectField 
                icon={<Briefcase size={14} />}
                label="Service Type *"
                name="serviceType"
                value={formData.serviceType}
                options={SERVICE_TYPES}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-medium text-[#001b4e] uppercase tracking-wider z-10">
                Short Description (Optional)
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows="3"
                placeholder="Brief summary of your service..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none"
              ></textarea>
              <div className="flex justify-end mt-1 px-1">
                <span className={`text-[11px] font-medium ${formData.shortDescription.length > 450 ? 'text-red-500' : 'text-slate-400'}`}>
                  {formData.shortDescription.length}/500
                </span>
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-medium text-[#001b4e] uppercase tracking-wider z-10">
                Detailed Description (Optional)
              </label>
              <textarea
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                rows="4"
                placeholder="Detailed information about your service"
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Additional Details Section */}
        <section className="space-y-4">
          <SectionHeader icon={<Info size={18} />} title="Additional Details" />
          <InputField 
            icon={<Briefcase size={18} />}
            label="Years of Experience (Optional)"
            name="experience"
            value={formData.experience}
            placeholder="e.g. 5 Years"
            onChange={handleChange}
          />
        </section>

        {/* Location Section */}
        <section className="space-y-4">
          <SectionHeader icon={<MapPin size={18} />} title="Location" />
          
          <button 
            type="button"
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full bg-[#001b4e] text-white py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all font-medium text-[15px] disabled:opacity-70"
          >
            {detecting ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Navigation size={18} className="rotate-45" />
            )}
            {detecting ? 'Detecting...' : 'Get Current Location'}
          </button>

          <div className="space-y-5">
            <SelectField 
              label="STATE *"
              name="state"
              value={formData.state}
              options={Object.keys(INDIA_DISTRICTS)}
              onChange={handleChange}
              placeholder="Select State"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="DISTRICT *"
                name="district"
                value={formData.district}
                options={districts}
                placeholder={formData.state ? "Select District" : "Select State First"}
                onChange={handleChange}
                disabled={!formData.state}
              />
              <InputField 
                label="TOWN / CITY *"
                name="city"
                value={formData.city}
                placeholder="e.g. Muzaffarpur"
                onChange={handleChange}
                disabled={!formData.state}
              />
            </div>
          </div>
            
            <div className="relative">
              <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-medium text-[#001b4e] uppercase tracking-wider z-10">
                Business Address (Optional)
              </label>
              <textarea
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                rows="2"
                placeholder="Your service location or business address"
                className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 px-5 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none"
              ></textarea>
            </div>
            
            <InputField 
              icon={<Navigation size={18} />}
              label="Service Radius (KM) *"
              name="serviceRadiusKm"
              type="number"
              value={formData.serviceRadiusKm}
              placeholder="e.g. 10"
              onChange={handleChange}
            />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-rose-500" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">GPS Center</span>
               </div>
               <div className="flex gap-3">
                  <input type="number" step="any" name="latitude" className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.latitude} onChange={handleChange} placeholder="Lat" />
                  <input type="number" step="any" name="longitude" className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" value={formData.longitude} onChange={handleChange} placeholder="Long" />
               </div>
            </div>
        </section>

        {/* Images Section */}
        <section className="space-y-4">
          <SectionHeader icon={<ImageIcon size={18} />} title="Images" />
          
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mb-6">
            <InputField 
              icon={<ImageIcon size={18} />}
              label="Video Showcase (YouTube Link)"
              name="videoLink"
              value={formData.videoLink}
              placeholder="https://youtube.com/watch?v=..."
              onChange={handleChange}
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <div>
                <h4 className="text-[16px] font-medium text-[#001b4e]">Service Thumbnail</h4>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide italic">Main image for your service</p>
              </div>
            </div>

            <input 
              type="file" 
              ref={thumbnailRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'thumbnail')}
            />

            <div 
              onClick={() => thumbnailRef.current.click()}
              className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
            >
              {formData.thumbnail ? (
                <>
                  <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, thumbnail: null })); }}
                    className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full text-white backdrop-blur-md"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 text-[#001b4e] rounded-2xl flex items-center justify-center shadow-inner">
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-center">
                    <div className="text-[15px] font-medium text-[#001b4e]">Tap to Add Thumbnail Image</div>
                    <div className="text-[11px] text-slate-400 mt-1">Recommended: 16:9 aspect ratio</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Portfolio Upload */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-[#001b4e]">Portfolio Images</h4>
                  <p className="text-[11px] text-slate-400 font-medium italic">You can add 10 more images</p>
                </div>
              </div>
              <div className="bg-slate-50 px-3 py-1 rounded-full text-[12px] font-medium text-[#001b4e] border border-slate-100">
                {formData.portfolio.length} / 10
              </div>
            </div>

            <input 
              type="file" 
              ref={portfolioRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, 'portfolio')}
            />

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <button 
                onClick={() => portfolioRef.current.click()}
                disabled={formData.portfolio.length >= 10}
                className="min-w-[100px] h-[100px] bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0 active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                  <Plus size={20} />
                </div>
                <span className="text-[11px] font-medium text-blue-700">Add Image</span>
              </button>

              {formData.portfolio.map((img, idx) => (
                <div key={idx} className="relative min-w-[100px] h-[100px] rounded-2xl overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                  <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removePortfolioImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 p-1 rounded-lg text-white shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Service Section */}
        <section className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[32px] p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-[#001b4e] uppercase tracking-tight">Feature this Service</h4>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">Showcase your service on the homepage to attract more leads.</p>
                
                {user?.active_subscription_id && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                      {user.active_subscription_id.usage?.featured_listings_used || 0} / {user.active_subscription_id.plan_snapshot?.featured_listings_limit === -1 ? '∞' : (user.active_subscription_id.plan_snapshot?.featured_listings_limit || 0)} Used
                    </span>
                  </div>
                )}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </section>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                  >
                    <CheckCircle2 size={48} />
                  </motion.div>
                </div>
                
                <h3 className="text-[22px] font-medium text-[#001b4e] mb-2">
                  {editId ? 'Service Updated!' : 'Service Created!'}
                </h3>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
                  {editId ? 'Your service details have been updated successfully.' : 'Your professional service has been successfully added to your inventory.'}
                </p>

                <button 
                  onClick={() => navigate('/partner/services')}
                  className="w-full bg-[#001b4e] text-white py-4.5 rounded-[20px] font-medium text-[16px] shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-[70] max-w-md mx-auto">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full bg-[#001b4e] text-white py-5 rounded-[24px] font-medium text-[18px] shadow-2xl shadow-blue-900/30 active:scale-[0.98] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Processing...' : (editId ? 'Update Service' : 'Create Service')}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
        {icon}
      </div>
      <h3 className="text-[12px] font-black text-[#001b4e] uppercase tracking-widest">{title}</h3>
    </div>
  );
}

function InputField({ label, name, type = 'text', value, placeholder, icon, onChange, disabled }) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-[#001b4e] uppercase mb-1 ml-1 tracking-tight">{label}</label>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3 z-10 flex items-center text-slate-400">{icon}</div>}
        <input 
          type={type} 
          name={name} 
          value={value} 
          placeholder={placeholder} 
          onChange={onChange}
          disabled={disabled}
          className={`w-full bg-white border border-slate-200 rounded-lg py-2.5 pr-3 text-[13px] font-bold text-[#001b4e] outline-none focus:border-blue-400 transition-all placeholder:text-slate-300 ${icon ? 'pl-9' : 'pl-3'} ${disabled ? 'opacity-50' : ''}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, name, value, options, icon, onChange, disabled, placeholder }) {
  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-[10px] font-black text-[#001b4e] uppercase mb-1 ml-1 tracking-tight">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">{icon}</div>}
        <select 
          name={name} 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
          className={`w-full bg-white border border-slate-200 rounded-lg py-2.5 pr-8 text-[13px] font-bold text-[#001b4e] outline-none appearance-none focus:border-blue-400 transition-all capitalize ${icon ? 'pl-9' : 'pl-3'}`}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map((opt, i) => {
            const val = typeof opt === 'object' ? opt._id : opt;
            const labelStr = typeof opt === 'object' ? opt.name : opt;
            return <option key={i} value={val} className="capitalize">{labelStr}</option>
          })}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
