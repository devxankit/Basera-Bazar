import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, MapPin, ChevronDown, Camera, 
  ShieldCheck, Eye, EyeOff, Navigation, Info, Building2, 
  FileText, CreditCard, Hash, Map, Box, Trash2, Image as ImageIcon,
  CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import LocationPicker from '../common/LocationPicker';

import { INDIAN_STATES_DISTRICTS } from '../../constants/indiaGeoData';
import { v } from '../../utils/validators';
import toast from '../../mockToast';
import { useBackgroundUpload } from '../../hooks/useBackgroundUpload';

const INDIA_DISTRICTS = INDIAN_STATES_DISTRICTS;

// SUPPLIER_CATEGORIES will be fetched dynamically from API

// Common variations returned by Google Maps / Nominatim that don't match INDIA_DISTRICTS keys
const STATE_ALIASES = {
  'nct of delhi': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  'delhi nct': 'Delhi',
  'pondicherry': 'Puducherry',
  'orissa': 'Odisha',
  'uttaranchal': 'Uttarakhand',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jk': 'Jammu and Kashmir',
  'tamilnadu': 'Tamil Nadu',
  'andhrapradesh': 'Andhra Pradesh',
  'madhyapradesh': 'Madhya Pradesh',
  'westbengal': 'West Bengal',
  'arunachalpradesh': 'Arunachal Pradesh',
  'himachalpradesh': 'Himachal Pradesh',
  'uttarpradesh': 'Uttar Pradesh',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

// Normalize an externally-supplied state name to a key in INDIA_DISTRICTS
const findMatchingState = (rawState) => {
  if (!rawState) return '';
  const trimmed = rawState.trim();
  const lower = trimmed.toLowerCase();

  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];

  const keys = Object.keys(INDIA_DISTRICTS);

  // Exact case-insensitive
  const exact = keys.find(s => s.toLowerCase() === lower);
  if (exact) return exact;

  // Partial match (e.g. "Delhi" inside "Delhi NCT")
  const partial = keys.find(s =>
    s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
  );
  return partial || trimmed;
};

// Helper to find best matching district from our list
const findMatchingDistrict = (state, rawDistrict) => {
  if (!state || !rawDistrict) return '';
  const availableDistricts = INDIA_DISTRICTS[state] || [];

  const clean = (s) => s.toLowerCase().replace(/\s(district|zila|tahsil|division)$/i, '').trim();
  const cleanedRaw = clean(rawDistrict);

  // 1. Exact or cleaned match
  const match = availableDistricts.find(d => clean(d) === cleanedRaw);
  if (match) return match;

  // 2. Partial match
  const partial = availableDistricts.find(d =>
    clean(d).includes(cleanedRaw) || cleanedRaw.includes(clean(d))
  );
  return partial || '';
};

export default function InfoStep({ formData, setFormData, onBack, onComplete, onProceedToVerify, isVerified, role, plan }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { queueUpload, awaitUpload } = useBackgroundUpload();
  
  // Verification States
  const [verifying, setVerifying] = useState(false);
  const [showExistsModal, setShowExistsModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [referralStatus, setReferralStatus] = useState('idle'); // 'idle', 'validating', 'success', 'error'
  const [executiveName, setExecutiveName] = useState('');
  const [shake, setShake] = useState(false);
  const [dynamicSupplierCategories, setDynamicSupplierCategories] = useState([]);

  useEffect(() => {
    if (role === 'supplier') {
      const fetchSupplierCats = async () => {
        try {
          const res = await api.get('/listings/categories?type=supplier');
          if (res.data.success) {
            setDynamicSupplierCategories(res.data.data);
          }
        } catch (err) {
        }
      };
      fetchSupplierCats();
    }
  }, [role]);
  
  
  const profileInputRef = useRef(null);
  const businessLogoRef = useRef(null);
  const panInputRef = useRef(null);
  const aadharFrontRef = useRef(null);
  const aadharBackRef = useRef(null);
  const gstInputRef = useRef(null);

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'phone') {
      value = value.replace(/\s+/g, '').replace(/^\+91/, '');
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'fullName') {
      value = value.replace(/[^A-Za-z\s'\-]/g, '');
    }

    if (name === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    if (name === 'state') {
      // Normalize state name to match our constants if it comes from external source
      const normalizedState = states.find(s => s.toLowerCase() === value.toLowerCase()) || value;
      setFormData(prev => ({ 
        ...prev, 
        state: normalizedState,
        district: '', // Reset district when state changes
        city: '' // Reset city when state changes
      }));
      if (errors.location) setErrors(prev => ({ ...prev, location: null }));
    } else if (name === 'district') {
      setFormData(prev => ({ 
        ...prev, 
        district: value,
        // If city is empty, use district as a fallback city
        city: prev.city || value 
      }));
      if (errors.location) setErrors(prev => ({ ...prev, location: null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [field]: localUrl }));
    // Compress + upload in the background
    queueUpload(field, file);
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Priority order for scrolling/toasting — first field with an error wins
  const FIELD_ORDER = ['fullName', 'email', 'phone', 'password', 'confirmPassword', 'location', 'service_radius_km', 'category'];

  const validateForm = () => {
    const newErrors = {};

    const nameErr = v.name(formData.fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = v.email(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = v.phone(formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const pwErr = v.password(formData.password);
    if (pwErr) newErrors.password = pwErr;

    const cfmErr = v.passwordConfirm(formData.confirmPassword, formData.password);
    if (cfmErr) newErrors.confirmPassword = cfmErr;

    if (!formData.state || !(formData.city || formData.district)) {
      newErrors.location = "Please set your service location (state and city)";
    }

    const radiusErr = v.radius(formData.service_radius_km);
    if (radiusErr) newErrors.service_radius_km = radiusErr;

    if (role === 'supplier' && (!formData.category || formData.category.length === 0)) {
      newErrors.category = "Please select at least one supplier category";
    }

    // Pincode — only validate format if something is entered (optional field)
    if (formData.pincode?.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const scrollToFirstError = (errs) => {
    const firstKey = FIELD_ORDER.find(k => errs[k]);
    if (!firstKey) return;

    // Show specific toast for this field
    toast.error(errs[firstKey]);

    setTimeout(() => {
      let el;
      if (firstKey === 'location') {
        el = document.querySelector('[data-field="location"]');
      } else {
        el = document.querySelector(`[name="${firstKey}"]`);
      }
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') el.focus();
    }, 100);
  };

  const handleSendOtp = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      scrollToFirstError(errs);
      return;
    }
    try {
      setVerifying(true);
      
      // 1. Check for conflicts (Existing Phone or Email)
      const conflictRes = await api.post('/auth/check-conflicts', {
        phone: formData.phone.trim(),
        email: formData.email.trim()
      });

      if (conflictRes.data.success) {
        const { conflicts } = conflictRes.data;
        
        if (conflicts.both) {
          setShowExistsModal(true);
          return;
        }

        if (conflicts.phone || conflicts.email) {
          const newErrors = { ...errors };
          if (conflicts.phone) newErrors.phone = "Phone number already exists";
          if (conflicts.email) newErrors.email = "Email already registered";
          setErrors(newErrors);
          return;
        }
      }

      // 2. Request OTP if no conflicts
      const response = await api.post('/auth/send-otp', { phone: formData.phone.trim() });
      if (response.data.success) {
        onProceedToVerify();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setVerifying(false);
    }
  };

  const handleValidateReferral = async () => {
    if (!formData.referral_code?.trim()) return;
    
    setReferralStatus('validating');
    try {
      const res = await api.post('/admin/system/validate-referral', { code: formData.referral_code });
      if (res.data.success) {
        setReferralStatus('success');
        setExecutiveName(res.data.data.name);
      }
    } catch (error) {
      setReferralStatus('error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };


  const states = Object.keys(INDIA_DISTRICTS);
  const districts = formData.state ? (INDIA_DISTRICTS[formData.state] || []) : [];

  const isPremium = plan === 'premium';

  return (
    <div className="flex flex-col font-sans pb-10 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Your Information</h1>
        <p className="text-slate-500 text-[15px]">Please fill in your details</p>
      </div>

      {/* Business Profile Photo Upload */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          <input 
            type="file" 
            ref={profileInputRef} 
            className="hidden" 
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => handleFileChange(e, 'profileImage')}
          />
          <div className="w-32 h-32 bg-slate-100 rounded-[32px] flex items-center justify-center border-4 border-white shadow-xl overflow-hidden relative group">
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <ImageIcon size={40} className="text-slate-300 mx-auto mb-1" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Add Photo</span>
              </div>
            )}
            <button 
              type="button"
              onClick={() => profileInputRef.current.click()}
              className="absolute inset-0 bg-[#001b4e]/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
            >
              <Camera size={24} className="text-white mb-1" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
            </button>
          </div>
          <button 
            type="button"
            onClick={() => profileInputRef.current.click()}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#3b82f6] rounded-2xl flex items-center justify-center border-2 border-white text-white shadow-lg active:scale-90 transition-all"
          >
            <Camera size={20} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[13px] font-bold text-[#001b4e]">Business / Profile Photo</span>
          <p className="text-[11px] text-slate-400 font-medium">This will be shown to your customers</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Required Information Section */}
        <div>
          <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Required Information</h3>
          <div className="space-y-4">
            <div className={shake ? "animate-shake" : ""}>
              <InputField 
                icon={<Hash size={18} />} 
                label="Referral Code (Optional)" 
                name="referral_code"
                value={formData.referral_code}
                onChange={(e) => {
                  handleChange({ target: { name: 'referral_code', value: e.target.value.toUpperCase() } });
                  if (referralStatus !== 'idle') setReferralStatus('idle');
                }}
                placeholder="Enter executive referral code"
                style={{ 
                  paddingRight: '90px',
                  borderColor: referralStatus === 'success' ? '#10b981' : (referralStatus === 'error' ? '#ef4444' : undefined),
                  backgroundColor: referralStatus === 'success' ? '#f0fdf4' : (referralStatus === 'error' ? '#fef2f2' : undefined),
                }}
                action={
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {referralStatus === 'success' ? (
                      <div className="bg-emerald-500 text-white p-2 rounded-xl flex items-center justify-center transition-all animate-fade-in shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleValidateReferral}
                        disabled={!formData.referral_code || referralStatus === 'validating'}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all bg-[#001b4e] text-white ${(!formData.referral_code || referralStatus === 'validating') ? 'opacity-50' : 'opacity-100'}`}
                      >
                        {referralStatus === 'validating' ? <Loader2 size={14} className="animate-spin" /> : 'CHECK'}
                      </button>
                    )}
                  </div>
                }
              />
              <AnimatePresence>
                {referralStatus === 'success' && executiveName && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 px-1 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[12px] font-bold text-emerald-600 tracking-wide uppercase">
                      Referred by: <span className="text-[#001b4e]">{executiveName}</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <InputField
              icon={<User size={18} />}
              label="Full Name *"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              inputMode="text"
              autoComplete="name"
              maxLength={60}
              error={errors.fullName}
            />
            <InputField
              icon={<Mail size={18} />}
              label="Email Address *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email for communications"
              autoComplete="email"
              maxLength={100}
              error={errors.email}
            />
              <div className="relative">
                <InputField
                  icon={<Phone size={18} />}
                  label="Phone Number *"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  disabled={isVerified}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  prefix="+91"
                  error={errors.phone}
                  style={{ paddingRight: isVerified ? '120px' : '18px' }}
                />
                {isVerified && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600 font-bold text-[14px]">
                    <CheckCircle2 size={18} /> Verified
                  </div>
                )}
              </div>

            <InputField
              icon={<Lock size={18} />}
              label="Password *"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars, include a number"
              error={errors.password}
              toggle={<button type="button" onClick={handleTogglePassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
            <InputField
              icon={<Lock size={18} />}
              label="Confirm Password *"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              error={errors.confirmPassword}
              toggle={<button type="button" onClick={handleToggleConfirmPassword}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
          </div>
        </div>

        {/* Location Information Section */}
        <div className="pt-2">
          <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Location Information</h3>
          
          <button
            type="button"
            data-field="location"
            onClick={() => setIsLocationModalOpen(true)}
            className={`w-full p-6 rounded-2xl flex flex-col items-center gap-3 text-white mb-6 shadow-xl active:scale-[0.98] transition-all ${
              formData.city
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-900/20'
                : 'bg-gradient-to-br from-[#001b4e] to-[#2334b2] shadow-indigo-900/20'
            } ${errors.location ? 'ring-2 ring-red-400' : ''}`}
          >
            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md">
              {formData.city
                ? <CheckCircle2 size={24} />
                : <Navigation size={22} className="rotate-45" />}
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold">
                {formData.city ? `${formData.city}, ${formData.state}` : 'Set Service Location'}
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                {formData.city
                  ? (formData.district ? `${formData.district} District` : 'Location confirmed')
                  : 'Use GPS or pick a city manually'}
              </div>
            </div>
            <div className="bg-white text-[#001b4e] px-6 py-2 rounded-xl text-[12px] font-bold mt-1 shadow-inner uppercase tracking-wider">
              {formData.city ? 'Change Location' : 'Detect My Location'}
            </div>
            {errors.location && (
              <span className="text-[11px] bg-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                {errors.location}
              </span>
            )}
          </button>

          <div className="grid grid-cols-1 gap-6 mt-8 relative z-10 bg-transparent">
            <InputField
              icon={<Box size={18} />}
              label="Serviceable Radius (in KM) *"
              name="service_radius_km"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={formData.service_radius_km ?? ''}
              onChange={handleChange}
              placeholder="e.g. 50"
              error={errors.service_radius_km}
            />
            <div className="text-[11px] text-slate-400 px-1 -mt-4 mb-2">
              Distance from your center you can provide service to.
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <SelectField 
                label="State *" 
                name="state"
                value={formData.state}
                onChange={handleChange}
                icon={<Map size={18} />} 
                options={states}
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="District *" 
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  icon={<MapPin size={18} />} 
                  options={districts}
                  disabled={!formData.state}
                />
                <InputField 
                  label="Town / City *" 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  icon={<Building2 size={18} />}
                  placeholder="e.g. Muzaffarpur"
                  disabled={!formData.state}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Specific Fields */}
        {role === 'supplier' && (
          <div className="pt-2">
            <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Supplier Categories *</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dynamicSupplierCategories.map(cat => {
                const category = cat.name;
                let currentCats = [];
                if (typeof formData.category === 'string') {
                  currentCats = formData.category ? formData.category.split(', ') : [];
                } else if (Array.isArray(formData.category)) {
                  currentCats = formData.category;
                }
                
                const isSelected = currentCats.includes(category);
                
                const toggleCategory = () => {
                   let newCats;
                   if (isSelected) {
                     newCats = currentCats.filter(c => c !== category);
                   } else {
                     newCats = [...currentCats, category];
                   }
                   handleChange({
                     target: {
                       name: 'category',
                       value: newCats.join(', ')
                     }
                   });
                   if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                };

                return (
                  <div 
                    key={cat._id} 
                    onClick={toggleCategory}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected 
                        ? 'border-[#001b4e] bg-blue-50/50' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-[#001b4e] border-[#001b4e]' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#001b4e] capitalize leading-tight">
                      {category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Information Accordion */}
        <div className="pt-2">
          <button 
            type="button"
            onClick={() => setIsOptionalOpen(!isOptionalOpen)}
            className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 text-[#001b4e]">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <span className="text-[18px] font-bold">{isOptionalOpen ? '-' : '+'}</span>
              </div>
              <span className="text-[15px] font-bold">
                {role === 'mandi' ? 'Business & Address Details' : 'Additional Information'}
              </span>
            </div>
            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOptionalOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isOptionalOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-5 bg-slate-50/50 border-x border-b border-slate-100 rounded-b-2xl pt-8">
                  {/* Business Logo Upload */}
                  <div className="flex flex-col items-center mb-4">
                    <input 
                      type="file" 
                      ref={businessLogoRef} 
                      className="hidden" 
                      accept="image/jpeg, image/png, image/webp"
                      onChange={(e) => handleFileChange(e, 'businessLogo')}
                    />
                    <div 
                      onClick={() => businessLogoRef.current.click()}
                      className="w-full h-32 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-slate-400 group overflow-hidden"
                    >
                      {formData.businessLogo ? (
                        <img src={formData.businessLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <>
                          <ImageIcon size={32} className="group-hover:text-indigo-500 transition-colors" />
                          <span className="text-[13px] font-medium">Upload Business Logo</span>
                        </>
                      )}
                    </div>
                  </div>

                  <InputField
                    icon={<Building2 size={18} />}
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Name of your shop or company"
                    error={errors.businessName}
                  />

                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400">
                      <FileText size={18} />
                    </div>
                    <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#001b4e] uppercase tracking-wider">
                      Business Description
                    </label>
                    <textarea
                      name="businessDescription"
                      value={formData.businessDescription}
                      onChange={handleChange}
                      placeholder="Tell us about your products or services..."
                      rows="3"
                      className={`w-full bg-white border ${errors.businessDescription ? 'border-red-400' : 'border-slate-200'} rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none`}
                    ></textarea>
                    {errors.businessDescription && <p className="text-red-500 text-[12px] font-medium mt-1 ml-1">{errors.businessDescription}</p>}
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#001b4e] uppercase tracking-wider">
                      Full Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Building, Street, Area..."
                      rows="2"
                      className={`w-full bg-white border ${errors.address ? 'border-red-400' : 'border-slate-200'} rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none`}
                    ></textarea>
                    {errors.address && <p className="text-red-500 text-[12px] font-medium mt-1 ml-1">{errors.address}</p>}
                  </div>

                  <InputField
                    icon={<Map size={18} />}
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 digit number"
                    inputMode="numeric"
                    maxLength={6}
                    error={errors.pincode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Info Footer */}
        <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mt-4">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
            Your information is secured and will be used only for the account verification.
          </p>
        </div>
      </div>

      <div className="mt-12 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-5 rounded-2xl font-bold text-[16px] border border-slate-200 text-[#001b4e] active:bg-slate-50 transition-all font-sans"
        >
          Back
        </button>
        <button
          onClick={isVerified ? onComplete : handleSendOtp}
          disabled={verifying}
          className={`flex-[2] py-5 ${verifying ? 'bg-slate-300' : 'bg-[#001b4e]'} text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all font-sans flex items-center justify-center gap-2`}
        >
          {verifying ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              {!isVerified ? (
                <>Send OTP</>
              ) : (
                <>{isPremium ? 'Proceed to Payment' : 'Create Account'}</>
              )}
            </>
          )}
        </button>
      </div>

      {/* Location Bottom Sheet */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLocationModalOpen(false)}
            />
            <motion.div 
              initial={{ translateY: "100%" }}
              animate={{ translateY: 0 }}
              exit={{ translateY: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl overflow-hidden" 
              style={{ height: '70vh' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 opacity-50" />
              <LocationPicker
                onClose={() => setIsLocationModalOpen(false)}
                onSelect={(loc) => {
                  setFormData(prev => {
                    // Normalize the state name FIRST so it matches INDIA_DISTRICTS keys
                    const normalizedState = findMatchingState(loc.state) || prev.state;
                    const detectedDistrict = findMatchingDistrict(normalizedState, loc.district);

                    if (loc.isGPS) {
                      return {
                        ...prev,
                        coords: loc.coordinates,
                        city: loc.name || prev.city,
                        state: normalizedState,
                        district: detectedDistrict || loc.district || prev.district,
                      };
                    }
                    return {
                      ...prev,
                      city: loc.name,
                      district: detectedDistrict || loc.district,
                      state: normalizedState,
                      coords: null,
                    };
                  });
                  if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                  setIsLocationModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── USER ALREADY REGISTERED MODAL ── */}
      <AnimatePresence>
        {showExistsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowExistsModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[360px] bg-white rounded-[32px] p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                <User size={32} />
              </div>
              
              <h3 className="text-[20px] font-bold text-[#001b4e] mb-3">User Already Registered</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                The phone number and email you entered are already linked to an existing account. Would you like to log in instead?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/partner/login')}
                  className="w-full py-4.5 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-all"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => setShowExistsModal(false)}
                  className="w-full py-4.5 bg-slate-100 text-[#001b4e] rounded-2xl font-bold text-[16px] active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, icon, prefix, type = "text", placeholder, toggle, action, value, onChange, name, disabled, style, error, ...rest }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="relative">
        <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#001b4e] uppercase tracking-wider z-10">
          {label}
        </label>
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          {prefix && (
            <span className={`absolute ${icon ? 'left-11' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[14px] border-r border-slate-100 pr-2 h-5 flex items-center`}>
              {prefix}
            </span>
          )}
          <input
            type={type}
            name={name}
            value={value}
            disabled={disabled}
            onChange={onChange}
            placeholder={placeholder}
            style={style}
            {...rest}
            className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-4.5 ${icon ? (prefix ? 'pl-22' : 'pl-12') : (prefix ? 'pl-14' : 'pl-5')} pr-12 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all`}
          />
          {action}
          {toggle && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {toggle}
            </div>
          )}
        </div>
      </div>
      {error && <span className="text-[11px] text-red-500 font-medium px-2">{error}</span>}
    </div>
  );
}

function SelectField({ label, icon, options, name, value, onChange, disabled }) {
  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#001b4e] uppercase tracking-wider">
        {label}
      </label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-12 pr-10 text-[15px] font-medium text-[#001b4e] outline-none appearance-none focus:border-[#001b4e] transition-all"
      >
        <option value="">Select Option</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <ChevronDown size={20} />
      </div>
    </div>
  );
}

function BoxIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
