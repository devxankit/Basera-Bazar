import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Info, LayoutGrid, Type, 
  AlignLeft, FileText, Briefcase, 
  MapPin, Image as ImageIcon, Plus, 
  X, Navigation, ChevronDown, CheckCircle2,
  Trash2, UploadCloud, Building2
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

  const [formData, setFormData] = useState({
    category: '',
    subCategory: '',
    serviceName: '',
    serviceType: '',
    shortDescription: '',
    detailedDescription: '',
    experience: '',
    state: '',
    district: '',
    businessAddress: '',
    businessName: '',
    thumbnail: null,
    portfolio: []
  });

  const [activeStep, setActiveStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
      return;
    }

    if (editId) {
      const services = JSON.parse(localStorage.getItem('baserabazar_partner_services') || '[]');
      const found = services.find(s => s.id.toString() === editId);
      if (found) {
        setFormData(found);
        console.log('Edit Mode: Found and loaded service data:', found);
      } else {
        console.warn('Edit Mode: Service not found for ID:', editId);
      }
    }

    // Pre-populate business name from user context if not in edit mode
    if (!editId) {
      if (user.businessName) {
        setFormData(prev => ({ ...prev, businessName: user.businessName }));
      }
    }
  }, [editId, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shortDescription' && value.length > 500) return;
    
    if (name === 'state') {
      setFormData(prev => ({ 
        ...prev, 
        state: value,
        district: '' // Reset district when state changes
      }));
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

      // 2. Prepare Payload
      const payload = {
        ...formData,
        category: 'service',
        image: thumbnailUrl,
        images: portfolioUrls,
        title: formData.serviceName,
        details: {
          serviceType: formData.serviceType,
          experience: formData.experience,
          description: formData.detailedDescription || formData.shortDescription,
          businessName: formData.businessName
        },
        location_text: `${formData.businessAddress}, ${formData.district}, ${formData.state}`
      };

      // 3. Submit to API
      await db.create('listings', payload);
      
      setShowSuccessModal(true);
    } catch (error) {
       console.error('Error saving service:', error);
       alert(error.response?.data?.message || 'Failed to save service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const states = Object.keys(INDIA_DISTRICTS);
  const districts = formData.state ? INDIA_DISTRICTS[formData.state] : [];
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
        <section className="space-y-4">
          <SectionHeader icon={<LayoutGrid size={18} />} title="Category" />
          <div className="space-y-4">
            <SelectField 
              icon={<LayoutGrid size={18} />}
              label="Service Category *"
              name="category"
              value={formData.category}
              options={SERVICE_CATEGORIES}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* Basic Information Section */}
        <section className="space-y-4">
          <SectionHeader icon={<Type size={18} />} title="Basic Information" />
          <div className="space-y-5">
            <div>
              <InputField 
                icon={<Type size={18} />}
                label="Service Name *"
                name="serviceName"
                value={formData.serviceName}
                placeholder="E.g., Professional Interior Design Service"
                onChange={handleChange}
              />
              <p className="text-[11px] text-slate-400 mt-1.5 ml-1 font-medium italic">E.g., Professional Interior Design Service</p>
            </div>

            <InputField 
              icon={<Building2 size={18} />}
              label="Business Name *"
              name="businessName"
              value={formData.businessName}
              placeholder="Your registered business name"
              onChange={handleChange}
            />

            <SelectField 
              icon={<Briefcase size={18} />}
              label="Service Type *"
              name="serviceType"
              value={formData.serviceType}
              options={SERVICE_TYPES}
              onChange={handleChange}
            />

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
          
          <button className="w-full bg-[#001b4e] text-white py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all font-medium text-[15px]">
            <Navigation size={18} className="rotate-45" />
            Get Current Location
          </button>

          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              label="CITY *"
              name="district"
              value={formData.district}
              options={formData.state ? INDIA_DISTRICTS[formData.state] : []}
              placeholder={formData.state ? "Select City" : "Select StateFirst"}
              onChange={handleChange}
              disabled={!formData.state}
            />
            <SelectField 
              label="STATE *"
              name="state"
              value={formData.state}
              options={Object.keys(INDIA_DISTRICTS)}
              onChange={handleChange}
              placeholder="Select State"
            />
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
        </section>

        {/* Images Section */}
        <section className="space-y-4">
          <SectionHeader icon={<ImageIcon size={18} />} title="Images" />
          
          {/* Thumbnail Upload */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
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
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-slate-100 text-[#001b4e] rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-[18px] font-medium text-[#001b4e] uppercase tracking-tight">{title}</h3>
      <div className="flex-grow h-[1px] bg-slate-100 ml-2" />
    </div>
  );
}

function InputField({ icon, label, placeholder, name, value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-medium text-[#001b4e] uppercase tracking-wider z-10">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-12 pr-5 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all"
      />
    </div>
  );
}

function SelectField({ icon, label, options, name, value, onChange, placeholder, disabled }) {
  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-medium text-[#001b4e] uppercase tracking-wider z-10">
        {label}
      </label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-12 pr-10 text-[15px] font-medium text-[#001b4e] outline-none appearance-none focus:border-[#001b4e] transition-all"
      >
        <option value="">{placeholder || 'Select Option'}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <ChevronDown size={20} />
      </div>
    </div>
  );
}
