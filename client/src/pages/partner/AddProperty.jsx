import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Home, MapPin, Search, Map, ChevronDown, CheckCircle2,
  Trash2, UploadCloud, Info, BedDouble, Bath, Users, Square, Navigation, CheckCircle,
  Building2, Camera, Star, AlertCircle, X, Triangle, Check, Car, Bike
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/DataEngine';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TYPES = ['Commercial', 'Residential', 'Agricultural', 'Industrial'];
const UNITS = ['sq. ft.', 'sq. m.', 'acre', 'dismil', 'gaj'];

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';
import MapModal from '../../components/common/MapModal';

const INDIA_DISTRICTS = INDIAN_STATES_DISTRICTS;

export default function AddProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [activeStep, setActiveStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Essential Details
    title: '',
    intention: 'For Sale',
    price: '',
    categoryId: '',
    categoryName: '',
    subcategoryId: '',
    subcategoryName: '',
    propertyType: '',
    builtUpArea: '',
    unit: 'sq. ft.',
    description: '',
    
    // Step 2: Room Configuration & Details
    bedrooms: '',
    bathrooms: '',
    washrooms: '',
    furnishing: '',
    superBuiltUpArea: '',
    carpetArea: '',
    monthlyMaintenance: '',
    floorNumber: '',
    totalFloors: '',
    facing: '',
    constructionStatus: '',
    projectName: '',
    listedBy: '',
    bachelorsAllowed: false,
    bikeParking: false,
    carParking: false,
    
    // Step 3: Location
    state: '',
    district: '',
    city: '',
    completeAddress: '',
    pinCode: '',
    latitude: '',
    longitude: '',

    // Step 4: Images & Options
    thumbnail: null,
    images: [],
    isFeatured: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
      return;
    }

    if (editId) {
      const fetchProperty = async () => {
        try {
          const res = await api.get(`/listings/${editId}`);
          if (res.data.success) {
            const data = res.data.data;
            // Map backend schema back to frontend formData
            setFormData(prev => ({
              ...prev,
              title: data.title || '',
              description: data.description || '',
              propertyType: data.property_type || '',
              intention: data.listing_intent === 'rent' ? 'For Rent' : 'For Sale',
              price: data.pricing?.amount || '',
              categoryId: data.category_id || '',
              subcategoryId: data.subcategory_id || '',
              
              // Address
              state: data.address?.state || '',
              district: data.address?.district || '',
              completeAddress: data.address?.full_address || '',
              pinCode: data.address?.pincode || '',
              
              // Details
              bedrooms: data.details?.bhk || '',
              bathrooms: data.details?.bathrooms || '',
              washrooms: data.details?.washrooms || '',
              furnishing: data.details?.furnishing || '',
              builtUpArea: data.details?.area?.value || '',
              unit: data.details?.area?.unit || 'sq. ft.',
              superBuiltUpArea: data.details?.area?.super_built_up_area || '',
              carpetArea: data.details?.area?.carpet_area || '',
              monthlyMaintenance: data.pricing?.maintenance || '',
              floorNumber: data.details?.floor_number || '',
              totalFloors: data.details?.total_floors || '',
              facing: data.details?.facing || '',
              constructionStatus: data.details?.possession || 'ready',
              
              // Images
              thumbnail: data.images?.[0] || data.thumbnail || null,
              images: data.images || [],
              
              latitude: data.location?.coordinates?.[1] || '',
              longitude: data.location?.coordinates?.[0] || '',
              isFeatured: data.is_featured || false
            }));
          }
        } catch (err) {
          console.error("Error fetching property for edit:", err);
        }
      };
      fetchProperty();
    }
  }, [editId, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'state') {
      const INDIAN_STATES = Object.keys(INDIAN_STATES_DISTRICTS);
      const normalizedState = INDIAN_STATES.find(s => s.toLowerCase() === value.toLowerCase()) || value;
      setFormData(prev => ({ 
        ...prev, 
        state: normalizedState,
        district: '',
        city: ''
      }));
    } else if (name === 'district') {
      setFormData(prev => ({ 
        ...prev, 
        district: value,
        city: prev.city || value 
      }));
    } else if (name === 'pinCode') {
      const val = value.slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: val }));
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

  const [parentCategories, setParentCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const res = await api.get('/listings/categories?type=property');
        if (res.data.success) {
          setParentCategories(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch property parent categories", err);
      }
    };
    fetchParentCategories();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      const fetchSubCategories = async () => {
        try {
          const res = await api.get(`/listings/categories?type=property&parent_id=${formData.categoryId}`);
          if (res.data.success) {
            setSubCategories(res.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch property sub categories", err);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [formData.categoryId]);

  const handleCategorySelect = (e) => {
    const selectedId = e.target.value;
    const selectedCat = parentCategories.find(c => c._id === selectedId);
    setFormData(prev => ({ 
      ...prev, 
      categoryId: selectedId,
      categoryName: selectedCat ? selectedCat.name : '',
      subcategoryId: '',
      subcategoryName: ''
    }));
  };

  const handleSubCategorySelect = (e) => {
    const selectedId = e.target.value;
    const selectedCat = subCategories.find(c => c._id === selectedId);
    setFormData(prev => ({ 
      ...prev, 
      subcategoryId: selectedId,
      subcategoryName: selectedCat ? selectedCat.name : ''
    }));
  };

  const handleFileChange = async (e, field) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      if (field === 'thumbnail') {
        const file = files[0];
        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, thumbnail: localUrl }));
        
        // Upload to Cloudinary
        const res = await db.uploadFile(file);
        if (res?.url) {
          setFormData(prev => ({ ...prev, thumbnail: res.url }));
        }
      } else if (field === 'images') {
        const maxSlots = 10 - formData.images.length;
        const count = Math.min(files.length, maxSlots);
        
        for (let i = 0; i < count; i++) {
          const file = files[i];
          // Show local preview immediately
          const localUrl = URL.createObjectURL(file);
          setFormData(prev => ({ ...prev, images: [...prev.images, localUrl] }));
          
          // Upload to Cloudinary and replace local URL
          const res = await db.uploadFile(file);
          if (res?.url) {
            setFormData(prev => ({
              ...prev,
              images: prev.images.map(img => img === localUrl ? res.url : img)
            }));
          }
        }
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const [detecting, setDetecting] = useState(false);
  const handleAutoDetectLocation = () => {
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
            const clean = (s) => s ? s.replace(/\s(district|zila|tahsil|division|subdivision|township|taluk|mandal)$/i, '').trim() : '';

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
              completeAddress: adr.road || prev.completeAddress,
              pinCode: adr.postcode || prev.pinCode,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
            alert("Location details detected successfully!");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
          alert("GPS Coordinates detected. Please enter address manually.");
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        alert("Failed to get location. Please allow location permissions.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFetchCoordinates = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        alert("Coordinates captured successfully!");
        setDetecting(false);
      },
      (error) => {
        alert("Failed to get location. Please allow location permissions.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapConfirm = (coords) => {
    setFormData(prev => ({
      ...prev,
      longitude: coords[0].toString(),
      latitude: coords[1].toString()
    }));
  };

  const submitFinalProperty = async () => {
    try {
      setIsSubmitting(true);
      
      // Images are already uploaded to Cloudinary via handleFileChange.
      // We just use the stored URLs directly.
      const payload = {
        ...formData,
        image: formData.thumbnail,  // Main thumbnail URL
        images: formData.images,    // Additional image URLs (already Cloudinary)
        category: 'property',
        serviceType: formData.subcategoryName || formData.categoryName,
        details: {
          propertyType: formData.subcategoryName || formData.categoryName,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          area: formData.builtUpArea,
          areaUnit: formData.unit,
          description: formData.description,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          furnishing: formData.furnishing,
          facing: formData.facing,
          constructionStatus: formData.constructionStatus
        },
        price: {
          value: formData.price,
          unit: formData.intention === 'For Sale' ? 'L' : '/mo'
        },
        location_text: `${formData.completeAddress}, ${formData.city || formData.district}, ${formData.state}`
      };

      // 3. Create/Update Listing via API
      if (editId) {
        await api.put(`/listings/${editId}`, payload);
      } else {
        await db.create('listings', payload);
      }
      
      // Log Activity
      const uid = user?._id || user?.id;
      if (uid) {
         const logKey = `baserabazar_activity_${uid}`;
         let logs = [];
         try { logs = JSON.parse(localStorage.getItem(logKey)) || []; } catch(e){}
         logs.push({
           type: 'listing',
           title: `Added Property: ${formData.title}`,
           time: 'Just now',
           timestamp: new Date().toISOString()
         });
         localStorage.setItem(logKey, JSON.stringify(logs));
      }
      
      setShowConfirmModal(false);
      navigate('/partner/inventory');
    } catch (error) {
      console.error('Error saving property:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to save property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Basic Validation per Step
    if (activeStep === 1) {
      if (!formData.title || !formData.price || !formData.categoryId || (subCategories.length > 0 && !formData.subcategoryId)) {
        alert('Please fill in all required fields: Title, Price, and Category.');
        return;
      }
    }
    
    if (activeStep === 3) {
      if (!formData.state || !formData.district || !formData.completeAddress || !formData.pinCode) {
        alert('Please fill in all required location details: State, City, Address, and PIN Code.');
        return;
      }
    }

    if (activeStep < 4) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else if (activeStep === 4) {
      if (!formData.thumbnail && formData.images.length === 0) {
        alert('Please upload at least one image of the property.');
        return;
      }
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
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] px-5 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 rounded-lg p-1 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-[20px] font-medium">{editId ? 'Edit Property' : 'Add New Property'}</h1>
      </div>

      {/* Progress Bar */}
      <div className="bg-white py-4 px-8 border-b border-slate-100 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
        <div 
          className="absolute top-1/2 left-8 h-0.5 bg-green-500 -translate-y-1/2 -z-10 transition-all duration-500 ease-out"
          style={{ width: `calc(${(activeStep - 1) * 33.33}% - 8px)` }}
        />
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step}
            onClick={() => step < activeStep && setActiveStep(step)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] transition-all shadow-sm
              ${activeStep === step ? 'bg-[#001b4e] text-white scale-110 shadow-blue-900/30' : 
                activeStep > step ? 'bg-green-500 text-white cursor-pointer' : 'bg-slate-200 text-slate-400'}`}
          >
            {activeStep > step ? <Check size={14} strokeWidth={4} /> : step}
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
              <StepOne 
                formData={formData} 
                handleChange={handleChange} 
                handleCategorySelect={handleCategorySelect}
                handleSubCategorySelect={handleSubCategorySelect}
                parentCategories={parentCategories}
                subCategories={subCategories}
              />
            )}
            {activeStep === 2 && (
              <StepTwo formData={formData} handleChange={handleChange} handleSelect={handleSelect} />
            )}
            {activeStep === 3 && (
              <StepThree 
                formData={formData} 
                handleChange={handleChange} 
                handleSelect={handleSelect} 
                handleFetchCoordinates={handleFetchCoordinates}
                setShowMapModal={setShowMapModal}
              />
            )}
            {activeStep === 4 && (
              <StepFour formData={formData} handleChange={handleChange} handleFileChange={handleFileChange} removeImage={removeImage} uploadingImage={uploadingImage} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center gap-2 z-40 max-w-md mx-auto">
        {activeStep > 1 && (
          <button 
            onClick={prevStep}
            className="flex-1 py-3.5 border-2 border-[#001b4e] text-[#001b4e] rounded-lg font-black text-[13px] uppercase tracking-widest active:scale-95 transition-all whitespace-nowrap"
          >
            Back
          </button>
        )}
        <button 
          onClick={nextStep}
          disabled={uploadingImage}
          className={`flex-[2] py-4 rounded-lg font-black text-[13px] uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap ${
            uploadingImage 
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
              : 'bg-[#001b4e] text-white shadow-blue-900/20'
          }`}
        >
          {uploadingImage ? 'Uploading...' : (activeStep === 4 ? (editId ? 'Update' : 'Submit') : 'Next')}
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
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="text-[22px] font-bold text-[#001b4e] mb-2">Ready to Submit?</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                Your property will be registered to your portfolio and reviewed by our team before going live.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={submitFinalProperty}
                  className="w-full bg-[#fa8639] text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
                >
                  Yes, List My Property
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

      <MapModal 
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onConfirm={handleMapConfirm}
        initialCoordinates={formData.latitude && formData.longitude ? [parseFloat(formData.longitude), parseFloat(formData.latitude)] : null}
      />
    </div>
  );
}

// -------------------------------------------------------------
// STEP 1 COMPONENTS
// -------------------------------------------------------------
function StepOne({ formData, handleChange, handleCategorySelect, handleSubCategorySelect, parentCategories, subCategories }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Essential Details" icon={<Home size={14} className="text-blue-500" />}>
        <div className="space-y-3">
          <InputField 
            label="Property Title *" 
            name="title" 
            value={formData.title} 
            icon={<Home size={14} />} 
            placeholder="Choose a descriptive title" 
            onChange={handleChange} 
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-[10px] font-black text-[#001b4e] uppercase mb-1 ml-1">Intention</label>
               <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select name="intention" value={formData.intention} onChange={handleChange} className="w-full border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-[13px] font-bold text-[#001b4e] outline-none appearance-none bg-slate-50/50">
                    <option value="For Sale">For Sale</option>
                    <option value="For Rent">For Rent</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>
            <InputField 
              label="Price *" 
              name="price" 
              type="number"
              value={formData.price} 
              icon={<span className="font-bold text-slate-400 text-sm">₹</span>} 
              placeholder="Ex: 50L" 
              onChange={handleChange} 
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Property Classification" icon={<Triangle size={16} className="fill-blue-500 text-blue-500" />}>
        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Market Category *</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Building2 size={18} /></div>
              <select 
                name="categoryId" 
                value={formData.categoryId} 
                onChange={handleCategorySelect} 
                className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pr-10 text-[14px] font-medium outline-none appearance-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all pl-11"
              >
                <option value="" disabled hidden>Select Category</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {subCategories.length > 0 && (
            <div className="w-full animate-in fade-in slide-in-from-top-2">
              <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Sub Category *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Home size={18} /></div>
                <select 
                  name="subcategoryId" 
                  value={formData.subcategoryId} 
                  onChange={handleSubCategorySelect} 
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pr-10 text-[14px] font-medium outline-none appearance-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all pl-11"
                >
                  <option value="" disabled hidden>Select Sub Category</option>
                  {subCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Area Information" icon={<Triangle size={16} className="text-blue-500 transform rotate-[-90deg]" />}>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <InputField label="Built-up Area" name="builtUpArea" type="number" value={formData.builtUpArea} icon={<Square size={18} />} placeholder="Ex: 1200" onChange={handleChange} />
          </div>
          <div className="col-span-2">
            <SelectField label="Unit" name="unit" icon={null} value={formData.unit} options={UNITS} onChange={handleChange} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Property Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={4}
            placeholder="Write a detailed description..."
            className="w-full border border-slate-200 rounded-xl p-4 text-[14px] font-medium resize-none outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
          <div className="text-right text-[11px] text-slate-400 font-medium mt-1">{(formData.description || '').length}/1000</div>
        </div>
      </SectionCard>
    </div>
  );
}

// -------------------------------------------------------------
// STEP 2 COMPONENTS
// -------------------------------------------------------------
function StepTwo({ formData, handleChange, handleSelect }) {
  const isPlotOrLand = 
    (formData.categoryName || '').toLowerCase().includes('plot') || 
    (formData.categoryName || '').toLowerCase().includes('land') ||
    (formData.subcategoryName || '').toLowerCase().includes('plot') || 
    (formData.subcategoryName || '').toLowerCase().includes('land');

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-blue-600 mb-6 font-medium text-[13px]">
         <Info size={18} className="mt-0.5 shrink-0" />
         <p>All fields in this step are optional but highly recommended to attract better leads.</p>
      </div>

      {!isPlotOrLand && (
        <SectionCard title="Room Configuration" icon={<BedDouble size={18} className="text-blue-500" />}>
          <div className="space-y-4">
            <SelectField label="Bedrooms (Optional)" name="bedrooms" icon={<BedDouble size={18} />} value={formData.bedrooms} options={['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Penthouse']} onChange={handleChange} />
            <SelectField label="Bathrooms (Optional)" name="bathrooms" icon={<Bath size={18} />} value={formData.bathrooms} options={['1', '2', '3', '4', '5+']} onChange={handleChange} />
            <SelectField label="Washrooms (Optional)" name="washrooms" icon={<Users size={18} />} value={formData.washrooms} options={['1', '2', '3', '4', '5+']} onChange={handleChange} />
            <SelectField label="Furnishing (Optional)" name="furnishing" icon={<Home size={18} />} value={formData.furnishing} options={['Fully Furnished', 'Semi Furnished', 'Unfurnished']} onChange={handleChange} />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Area Details" icon={<Square size={18} className="text-blue-500" />}>
        <div className="space-y-4">
           <InputField label="Super Built-up Area (Optional)" name="superBuiltUpArea" type="number" value={formData.superBuiltUpArea} icon={<Home size={18} />} placeholder="Enter area..." onChange={handleChange} />
           <InputField label="Carpet Area (Optional)" name="carpetArea" type="number" value={formData.carpetArea} icon={<Square size={18} />} placeholder="Enter area..." onChange={handleChange} />
           <InputField label="Monthly Maintenance (Optional)" name="monthlyMaintenance" type="number" value={formData.monthlyMaintenance} icon={<span className="font-bold text-slate-400">₹</span>} placeholder="Enter maintenance amount..." onChange={handleChange} />
        </div>
      </SectionCard>

      {!isPlotOrLand && (
        <SectionCard title="Building & Floor Details" icon={<Building2 size={18} className="text-blue-500" />}>
          <div className="space-y-4">
            <SelectField label="Floor Number (Optional)" name="floorNumber" icon={<Square size={18} />} value={formData.floorNumber} options={['Ground', '1', '2', '3', '4', '5', '6-10', '10+']} onChange={handleChange} />
            <SelectField label="Total Floors (Optional)" name="totalFloors" icon={<Building2 size={18} />} value={formData.totalFloors} options={['1', '2', '3', '4', '5', '6-10', '10+']} onChange={handleChange} />
            <SelectField label="Property Facing (Optional)" name="facing" icon={<Navigation size={18} />} value={formData.facing} options={['East', 'West', 'North', 'South', 'North-East', 'South-East', 'North-West', 'South-West']} onChange={handleChange} />
            <SelectField label="Construction Status (Optional)" name="constructionStatus" icon={<Building2 size={18} />} value={formData.constructionStatus} options={['Ready to move', 'Under construction', 'New Launch']} onChange={handleChange} />
          </div>
        </SectionCard>
      )}
      
      <SectionCard title="Additional Information" icon={<Info size={18} className="text-blue-500 fill-blue-500" />}>
         <div className="space-y-4">
           <InputField label="Project/Society Name (Optional)" name="projectName" value={formData.projectName} icon={<Building2 size={18} />} placeholder="Enter society name" onChange={handleChange} />
           <SelectField label="Listed By (Optional)" name="listedBy" icon={<Users size={18} />} value={formData.listedBy} options={['Owner', 'Dealer/Agent', 'Builder']} onChange={handleChange} />
           
           {!isPlotOrLand && (
             <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <Users size={18} className="text-slate-400"/>
                   <div>
                      <div className="text-[14px] font-bold text-[#001b4e]">Bachelors Allowed</div>
                      <div className="text-[11px] text-slate-400 font-medium">Allow bachelor tenants</div>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="bachelorsAllowed" checked={formData.bachelorsAllowed} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
           )}
         </div>
      </SectionCard>

      {!isPlotOrLand && (
        <SectionCard title="Parking Facilities" icon={<span className="font-bold text-blue-500 text-[18px]">P</span>}>
           <div className="space-y-3">
             <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <Bike size={18} className="text-slate-400"/>
                   <div>
                      <div className="text-[14px] font-bold text-[#001b4e]">Bike Parking</div>
                      <div className="text-[11px] text-slate-400 font-medium">Two-wheeler parking available</div>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="bikeParking" checked={formData.bikeParking} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
             
             <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <Car size={18} className="text-slate-400"/>
                   <div>
                      <div className="text-[14px] font-bold text-[#001b4e]">Car Parking</div>
                      <div className="text-[11px] text-slate-400 font-medium">Four-wheeler parking available</div>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="carParking" checked={formData.carParking} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
           </div>
        </SectionCard>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// STEP 3 COMPONENTS
// -------------------------------------------------------------
function StepThree({ formData, handleChange, handleSelect, handleFetchCoordinates, setShowMapModal }) {
  const districtOptions = formData.state ? INDIA_DISTRICTS[formData.state] || [] : [];
  return (
    <div className="space-y-6">
      <SectionCard title="Property Address" icon={<Home size={18} className="text-blue-500 fill-blue-500" />}>
        <div className="space-y-6">
          <div className="space-y-4">
            <SelectField label="STATE *" name="state" value={formData.state} options={Object.keys(INDIA_DISTRICTS)} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="CITY/DISTRICT *" name="district" value={formData.district} options={districtOptions} onChange={handleChange} disabled={!formData.state} />
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Town / City *</label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange}
                  placeholder="e.g. Muzaffarpur"
                  disabled={!formData.state}
                  className="w-full border border-slate-200 rounded-xl py-3.5 px-4 text-[14px] font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">Complete Address *</label>
            <div className="relative">
               <Home size={18} className="absolute left-4 top-4 text-slate-400" />
               <textarea 
                  name="completeAddress" 
                  value={formData.completeAddress} 
                  onChange={handleChange} 
                  rows={3}
                  placeholder="Enter complete address..."
                  className="w-full border border-slate-200 rounded-xl p-3 pl-11 text-[14px] font-medium resize-none outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
               />
            </div>
          </div>
          
          <InputField label="PIN Code *" name="pinCode" type="number" value={formData.pinCode} icon={<MapPin size={18} />} placeholder="Enter PIN code" onChange={handleChange} />
        </div>
      </SectionCard>

      <SectionCard title="GPS Coordinates" icon={<Navigation size={18} className="text-blue-500" />}>
         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-slate-500 mb-4 font-medium text-[12px]">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <p>Tip: Click "Detect Location" while you're at the property site for most accurate coordinates.</p>
         </div>
         <div className="grid grid-cols-2 gap-4 mb-4">
            <InputField label="Latitude (Optional)" name="latitude" value={formData.latitude} icon={<Map size={18} />} placeholder="Ex: 28.7041" onChange={handleChange} />
            <InputField label="Longitude (Optional)" name="longitude" value={formData.longitude} icon={<Map size={18} />} placeholder="Ex: 77.1025" onChange={handleChange} />
         </div>

         <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleFetchCoordinates}
              className="flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-[13px] active:scale-95 transition-all"
            >
              <Navigation size={16} />
              Fetch GPS
            </button>
            <button
              onClick={() => setShowMapModal(true)}
              className="flex items-center justify-center gap-2 py-3.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-[13px] active:scale-95 transition-all"
            >
              <Search size={16} />
              Select from Map
            </button>
         </div>
      </SectionCard>
    </div>
  );
}

// -------------------------------------------------------------
// STEP 4 COMPONENTS
// -------------------------------------------------------------
function StepFour({ formData, handleChange, handleFileChange, removeImage, uploadingImage }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Property Images" icon={<Camera size={18} className="text-blue-500" />}>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3 text-orange-800 mb-6 font-medium text-[13px]">
           <AlertCircle size={18} className="mt-0.5 shrink-0 text-orange-500" />
           <p>Add high-quality images to attract more buyers. First image will be used as a thumbnail.</p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#001b4e] mb-3">Main Property Image</label>
          <div className="relative w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group bg-slate-50 hover:bg-slate-100 transition-colors">
            {uploadingImage && !formData.thumbnail ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] text-slate-500 font-medium">Uploading to Cloudinary...</p>
              </div>
            ) : formData.thumbnail ? (
              <>
                <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-medium text-[13px] flex items-center gap-2"><UploadCloud size={16}/> Replace Image</span>
                  </div>
                )}
              </>
            ) : (
               <div className="text-center">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                   <UploadCloud size={24} className="text-slate-400" />
                 </div>
                 <p className="text-[13px] font-medium text-slate-500">Tap to add main property image</p>
                 <p className="text-[11px] font-medium text-slate-400 mt-1">JPG, JPEG, PNG - Max 5MB</p>
               </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              disabled={uploadingImage}
              onChange={(e) => handleFileChange(e, 'thumbnail')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
             <label className="block text-[13px] font-bold text-[#001b4e]">Additional Images</label>
             <span className="text-[12px] font-medium text-slate-400">{formData.images.length}/10</span>
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

          {formData.images.length < 10 && (
            <div className={`relative w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center transition-colors ${uploadingImage ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 hover:bg-slate-100'}`}>
               {uploadingImage ? (
                 <span className="text-[14px] font-bold text-blue-600 flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   Uploading...
                 </span>
               ) : (
                 <span className="text-[14px] font-bold text-[#001b4e] flex items-center gap-2">
                   <Camera size={18} className="text-slate-400"/>
                   Add Additional Images
                 </span>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 multiple
                 disabled={uploadingImage}
                 onChange={(e) => handleFileChange(e, 'images')}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Listing Options" icon={<Star size={18} className="text-yellow-500 fill-yellow-500" />}>
         <div className="flex items-center justify-between p-5 border border-yellow-200 rounded-2xl bg-[#fffef5] shadow-sm">
            <div className="flex items-start gap-4">
               <div className="mt-0.5"><Star size={20} className="text-yellow-500 fill-yellow-500"/></div>
               <div>
                  <div className="text-[15px] font-bold text-[#001b4e]">Mark as Featured Property</div>
                  <div className="text-[12px] text-slate-500 font-medium mt-1 leading-snug">Featured properties appear prominently in search results and get more visibility</div>
               </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="sr-only peer" />
              <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
         </div>
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

function SelectField({ label, name, value, options, icon, onChange }) {
  return (
    <div className="w-full">
      <label className="block text-[11px] font-bold text-[#001b4e] uppercase mb-1.5 ml-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">{icon}</div>}
        <select 
          name={name} 
          value={value} 
          onChange={onChange} 
          className={`w-full bg-white border border-slate-200 rounded-xl py-3.5 pr-10 text-[14px] font-medium outline-none appearance-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all ${icon ? 'pl-11' : 'pl-4'}`}
        >
          <option value="" disabled hidden>Select option</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
