import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Building2, Package, MapPin, CheckCircle2,
  Trash2, UploadCloud, Info, Check, Plus, Camera, Navigation, Hash, 
  Settings
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/DataEngine';

const SUPPLIER_CATEGORIES_ALL = [
  'Aggregate supplier', 
  'bricks suppliers', 
  'cement supplier', 
  'construction materials supplier', 
  'sand supplier', 
  'tmt supplier'
];

const UNITS = ['bag', 'ton', 'cubic meter', 'kg', 'piece'];

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';

const INDIA_DISTRICTS = INDIAN_STATES_DISTRICTS;

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [activeStep, setActiveStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerCategories, setPartnerCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic details and location
    title: '',
    category: '', // Material Category
    brand: '',
    description: '',
    state: '',
    district: '',
    completeAddress: '',
    pinCode: '',
    
    // Step 2: Pricing
    unit: 'bag',
    price: '', // Price per unit
    priceOnRequest: false,
    minOrderQty: '',
    
    // Step 3: Media & Specs
    thumbnail: null,
    images: [],
    specifications: [] // array of { key: '', value: '' }
  });

  useEffect(() => {
    const activePartner = JSON.parse(sessionStorage.getItem('activePartner') || '{}');
    if (activePartner.category) {
        setPartnerCategories(activePartner.category.split(', '));
        // Set default category to first available if not editing
        if (!editId && !formData.category) {
            setFormData(prev => ({...prev, category: activePartner.category.split(', ')[0]}));
        }
    } else {
        setPartnerCategories(SUPPLIER_CATEGORIES_ALL);
    }

    if (editId) {
      const stored = JSON.parse(localStorage.getItem('baserabazar_partner_services') || '[]');
      const found = stored.find(s => s.id.toString() === editId);
      if (found) {
        setFormData(prev => ({ 
          ...prev, 
          ...found, 
          images: found.images || [],
          specifications: found.specifications || []
        }));
      }
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'state') {
      setFormData(prev => ({ 
        ...prev, 
        state: value,
        district: '' // Reset district when state changes
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleSelect = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    } else if (field === 'images') {
      const maxSlots = 5 - formData.images.length;
      const count = Math.min(files.length, maxSlots);
      
      for (let i = 0; i < count; i++) {
        const compressedDataUrl = await compressImage(files[i]);
        setFormData(prev => ({ ...prev, images: [...prev.images, compressedDataUrl] }));
      }
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Specification handlers
  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
  };

  const submitFinalProduct = async () => {
    try {
      setIsSubmitting(true);
      
      // 1. Upload Images
      let thumbnailUrl = formData.thumbnail;
      if (formData.thumbnail && formData.thumbnail.startsWith('data:')) {
        const thumbBlob = await fetch(formData.thumbnail).then(r => r.blob());
        const thumbRes = await db.uploadFile(thumbBlob);
        thumbnailUrl = thumbRes.url;
      }

      const galleryUrls = [];
      for (const img of formData.images) {
        if (img.startsWith('data:')) {
          const blob = await fetch(img).then(r => r.blob());
          const res = await db.uploadFile(blob);
          galleryUrls.push(res.url);
        } else {
          galleryUrls.push(img);
        }
      }

      // 2. Prepare Payload
      const payload = {
        title: formData.title,
        category: 'supplier',
        sub_category: formData.category, // Map UI category to sub_category
        brand: formData.brand,
        price: {
          value: formData.price,
          unit: formData.unit
        },
        image: thumbnailUrl,
        images: galleryUrls,
        location_text: `${formData.completeAddress}, ${formData.district}, ${formData.state}`,
        details: {
          description: formData.description,
          specifications: formData.specifications,
          minOrderQty: formData.minOrderQty,
          priceOnRequest: formData.priceOnRequest
        }
      };

      // 3. Submit
      await db.create('listings', payload);
      
      setShowConfirmModal(false);
      navigate('/partner/inventory'); 
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (activeStep < 3) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setShowConfirmModal(true);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] px-5 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-[20px] font-medium">{editId ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      {/* Progress Bar */}
      <div className="bg-white py-6 px-8 border-b border-slate-100 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 -z-10" />
        <div 
          className="absolute top-1/2 left-8 h-1 bg-blue-500 -translate-y-1/2 -z-10 transition-all duration-500 ease-out"
          style={{ width: `calc(${(activeStep - 1) * 50}% - 8px)` }}
        />
        {[1, 2, 3].map((step) => (
          <div 
            key={step}
            onClick={() => step < activeStep && setActiveStep(step)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-all shadow-sm
              ${activeStep === step ? 'bg-[#001b4e] text-white scale-110 shadow-blue-900/30' : 
                activeStep > step ? 'bg-blue-500 text-white cursor-pointer' : 'bg-slate-200 text-slate-400'}`}
          >
            {activeStep > step ? <Check size={18} strokeWidth={3} /> : step}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="p-5 max-w-lg mx-auto">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeStep === 1 && (
              <StepOne formData={formData} handleChange={handleChange} partnerCategories={partnerCategories} />
            )}
            {activeStep === 2 && (
              <StepTwo formData={formData} handleChange={handleChange} handleSelect={handleSelect} />
            )}
            {activeStep === 3 && (
              <StepThree formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} removeImage={removeImage} addSpec={addSpec} removeSpec={removeSpec} handleSpecChange={handleSpecChange} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 flex items-center justify-between z-40 max-w-md mx-auto">
        {activeStep > 1 ? (
          <button 
            onClick={prevStep}
            className="px-8 py-3.5 border-2 border-[#001b4e] text-[#001b4e] rounded-xl font-bold text-[15px] active:scale-95 transition-all"
          >
            Previous
          </button>
        ) : <div className="px-8" />}
        <button 
          onClick={nextStep}
          className="px-10 py-3.5 bg-[#001b4e] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
        >
          {activeStep === 3 ? (editId ? 'Update Product' : 'Submit Product') : 'Next'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                <CheckCircle2 size={40} className="text-blue-500" />
              </div>
              <h3 className="text-[22px] font-bold text-[#001b4e] mb-2">Ready to Submit?</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                Your product will be registered to your inventory and reviewed by our team before going live.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={submitFinalProduct}
                  disabled={isSubmitting}
                  className="w-full bg-[#001b4e] text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-blue-900/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Yes, List My Product'}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full bg-slate-50 text-slate-500 py-4 rounded-xl font-bold text-[15px] hover:bg-slate-100 active:scale-95 transition-all"
                >
                  Cancel and Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// STEP 1 COMPONENTS
// -------------------------------------------------------------
function StepOne({ formData, handleChange, partnerCategories }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Basic Details" icon={<Package size={18} className="text-blue-500" />}>
        <div className="space-y-4">
          <InputField 
            label="Material Name *" 
            name="title" 
            value={formData.title} 
            icon={<Package size={18} />} 
            placeholder="Ex: UltraTech Premium Cement" 
            onChange={handleChange} 
          />
          
          <SelectField 
            label="Material Category *" 
            name="category" 
            icon={<Building2 size={18} />} 
            value={formData.category} 
            options={partnerCategories} 
            onChange={handleChange} 
          />
          
          <InputField 
            label="Brand (Optional)" 
            name="brand" 
            value={formData.brand} 
            icon={<Settings size={18} />} 
            placeholder="Ex: UltraTech" 
            onChange={handleChange} 
          />

          <div>
            <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3}
              placeholder="Write a detailed description..."
              className="w-full border border-slate-200 rounded-xl p-4 text-[14px] font-medium resize-none outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Service Location" icon={<MapPin size={18} className="text-blue-500" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              label="CITY *" 
              name="district" 
              value={formData.district} 
              options={formData.state ? INDIA_DISTRICTS[formData.state] : []} 
              onChange={handleChange} 
              disabled={!formData.state}
            />
            <SelectField 
              label="STATE *" 
              name="state" 
              value={formData.state} 
              options={Object.keys(INDIA_DISTRICTS)} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Complete Address</label>
            <textarea 
              name="completeAddress" 
              value={formData.completeAddress} 
              onChange={handleChange} 
              rows={2}
              placeholder="Enter complete address..."
              className="w-full border border-slate-200 rounded-xl p-3 text-[14px] font-medium resize-none outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          
          <InputField label="PIN Code *" name="pinCode" type="number" value={formData.pinCode} icon={<Hash size={18} />} placeholder="Enter PIN code" onChange={handleChange} />
        </div>
      </SectionCard>
    </div>
  );
}

// -------------------------------------------------------------
// STEP 2 COMPONENTS
// -------------------------------------------------------------
function StepTwo({ formData, handleChange, handleSelect }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Pricing Setup" icon={<span className="font-bold text-blue-500 text-[18px]">₹</span>}>
        <div className="space-y-4">
          
          <div className="flex items-center justify-between p-4 border border-blue-100 rounded-xl bg-blue-50/50 mb-2">
            <div className="flex items-center gap-3">
                <Info size={18} className="text-blue-500"/>
                <div>
                  <div className="text-[14px] font-bold text-[#001b4e]">Price on Request</div>
                  <div className="text-[11px] text-slate-500 font-medium">Hide exact pricing from public view</div>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="priceOnRequest" checked={formData.priceOnRequest} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className={`transition-all duration-300 ${formData.priceOnRequest ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Unit *" name="unit" value={formData.unit} options={UNITS} onChange={handleChange} />
              <InputField 
                label={`Price per ${formData.unit || 'unit'}${!formData.priceOnRequest ? ' *' : ''}`} 
                name="price" 
                type="number"
                value={formData.price} 
                icon={<span className="font-bold text-slate-400 text-lg">₹</span>} 
                placeholder="Ex: 350" 
                onChange={handleChange} 
              />
            </div>
          </div>
          
          <InputField 
            label="Minimum Order Quantity (Optional)" 
            name="minOrderQty" 
            type="number"
            value={formData.minOrderQty} 
            placeholder={`Ex: 50 ${formData.unit}s`} 
            onChange={handleChange} 
          />
        </div>
      </SectionCard>
    </div>
  );
}

// -------------------------------------------------------------
// STEP 3 COMPONENTS
// -------------------------------------------------------------
function StepThree({ formData, handleChange, handleFileChange, removeImage, addSpec, removeSpec, handleSpecChange }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Product Images" icon={<Camera size={18} className="text-blue-500" />}>
        <div>
          <label className="block text-[13px] font-bold text-[#001b4e] mb-3">Main Cover Image / Thumbnail</label>
          <div className="relative w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group bg-slate-50 hover:bg-slate-100 transition-colors">
            {formData.thumbnail ? (
              <>
                <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-medium text-[13px] flex items-center gap-2"><UploadCloud size={16}/> Replace Image</span>
                </div>
              </>
            ) : (
               <div className="text-center">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                   <UploadCloud size={20} className="text-slate-400" />
                 </div>
                 <p className="text-[13px] font-medium text-slate-500">Tap to add thumbnail image</p>
               </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'thumbnail')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
             <label className="block text-[13px] font-bold text-[#001b4e]">Additional Angles</label>
             <span className="text-[12px] font-medium text-slate-400">{formData.images.length}/5</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <img src={img} alt={`Additional ${idx}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-white/80 p-1.5 rounded-full text-red-500 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {formData.images.length < 5 && (
            <div className="relative w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
               <span className="text-[14px] font-bold text-[#001b4e] flex items-center gap-2">
                 <Camera size={18} className="text-slate-400"/>
                 Add Additional Images
               </span>
               <input 
                 type="file" 
                 accept="image/*" 
                 multiple
                 onChange={(e) => handleFileChange(e, 'images')}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Product Specifications" icon={<Settings size={18} className="text-blue-500" />}>
        <div className="space-y-3 mb-4">
           {formData.specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                   <input 
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-medium outline-none placeholder:text-slate-300"
                      placeholder="Ex: Grade"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                   />
                </div>
                <div className="flex-[1.5]">
                   <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-bold text-[#001b4e] outline-none placeholder:text-slate-300"
                      placeholder="Ex: OPC 53"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                   />
                </div>
                <button onClick={() => removeSpec(idx)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                   <Trash2 size={18} />
                </button>
              </div>
           ))}
        </div>
        <button 
           onClick={addSpec}
           className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
        >
           <Plus size={16} /> Add Specification
        </button>
      </SectionCard>
    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE COMPONENTS
// -------------------------------------------------------------
function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
        {icon}
        <h2 className="text-[16px] font-bold text-[#001b4e]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, name, type = 'text', value, placeholder, icon, onChange }) {
  return (
    <div className="w-full">
      <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">{label}</label>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-4 z-10 flex items-center text-slate-400">{icon}</div>}
        <input 
          type={type} 
          name={name} 
          value={value} 
          placeholder={placeholder} 
          onChange={onChange}
          className={`w-full bg-white border border-slate-200 rounded-xl py-3.5 pr-4 text-[14px] font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 ${icon ? 'pl-11' : 'pl-4'}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, name, value, options, icon, onChange, disabled }) {
  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">{icon}</div>}
        <select 
          name={name} 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
          className={`w-full bg-white border border-slate-200 rounded-xl py-3.5 pr-10 text-[14px] font-medium outline-none appearance-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all capitalize ${icon ? 'pl-11' : 'pl-4'}`}
        >
          <option value="" disabled hidden>Select option</option>
          {options.map((opt, i) => (
            <option key={i} value={opt} className="capitalize">{opt}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function ChevronDown({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
