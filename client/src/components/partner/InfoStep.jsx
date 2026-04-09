import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, Lock, MapPin, ChevronDown, Camera, 
  ShieldCheck, Eye, EyeOff, Navigation, Info, Building2, 
  FileText, CreditCard, Hash, Map, Box, Trash2, Image as ImageIcon,
  CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const INDIA_DISTRICTS = {
  'Bihar': ['Muzaffarpur', 'Patna', 'Gaya', 'Darbhanga', 'Bhagalpur', 'Hajipur', 'Purnia', 'Arrah', 'Begusarai', 'Munger', 'Bihar Sharif', 'Katihar', 'Sitamarhi', 'Siwan', 'Bhojpur', 'Saran'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Chittorgarh', 'Barmer', 'Churu'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida', 'Mathura', 'Bareilly', 'Gorakhpur', 'Moradabad', 'Firozabad', 'Aligarh', 'Jhansi', 'Muzaffarnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur', 'Satara', 'Jalgaon', 'Raigad', 'Ahmednagar', 'Amravati', 'Chandrapur', 'Latur', 'Nandurbar'],
  'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Mehsana', 'Morbi', 'Kutch', 'Navsari', 'Valsad', 'Bharuch', 'Botad'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa', 'Satna', 'Sagar', 'Dewas', 'Morena', 'Ratlam', 'Chhindwara', 'Shivpuri', 'Vidisha', 'Mandsaur', 'Balaghat'],
  'West Bengal': ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Bardhaman', 'Murshidabad', 'Nadia', 'Jalpaiguri', 'Darjeeling', 'Malda', 'Birbhum', 'Bankura', 'West Midnapore', 'East Midnapore', 'Siliguri', 'Hooghly'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Dindigul', 'Kancheepuram', 'Thanjavur', 'Virudhunagar', 'Krishnagiri', 'Namakkal', 'Ramanathapuram', 'Tiruppur'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Kalaburagi', 'Bidar', 'Raichur', 'Dharwar', 'Hassan', 'Udupi'],
  'Haryana': ['Gurugram', 'Faridabad', 'Ambala', 'Hisar', 'Rohtak', 'Panipat', 'Karnal', 'Sonipat', 'Yamunanagar', 'Panchkula', 'Bhiwani', 'Sirsa', 'Jhajjar', 'Jind', 'Mahendragarh', 'Nuh'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Gurdaspur', 'Ferozepur', 'Faridkot', 'Moga', 'Muktsar', 'Sangrur', 'Kapurthala', 'Fatehgarh Sahib'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Chaibasa', 'Dumka', 'Pakur', 'Chatra', 'Koderma', 'Latehar', 'Lohardaga', 'Simdega'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Puri', 'Sambalpur', 'Balasore', 'Baripada', 'Bhadrak', 'Angul', 'Dhenkanal', 'Kendrapara', 'Jajpur', 'Koraput', 'Rayagada', 'Sundargarh'],
};

const SUPPLIER_CATEGORIES = [
  'Aggregate supplier', 
  'bricks suppliers', 
  'cement supplier', 
  'construction materials supplier', 
  'sand supplier', 
  'tmt supplier'
];

export default function InfoStep({ formData, setFormData, onBack, onComplete, role, plan }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);
  
  // Verification States
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  
  const profileInputRef = useRef(null);
  const businessLogoRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    const file = e.target.files[0];
    if (!file) return;

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

    const compressedDataUrl = await compressImage(file);
    setFormData(prev => ({ ...prev, [field]: compressedDataUrl }));
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSendOtp = async () => {
    if (formData.phone.length !== 10) return;
    try {
      setVerifying(true);
      const response = await api.post('/auth/send-otp', { phone: formData.phone });
      if (response.data.success) {
        setShowOtpInput(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      setVerifying(true);
      const response = await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp: otp,
        role: 'partner'
      });
      
      if (response.data.success) {
        setIsVerified(true);
        setShowOtpInput(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifying(false);
    }
  };

  const states = Object.keys(INDIA_DISTRICTS);
  const districts = formData.state ? INDIA_DISTRICTS[formData.state] : [];

  const isPremium = plan === 'premium';

  return (
    <div className="flex flex-col h-full font-sans pb-10 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Your Information</h1>
        <p className="text-slate-500 text-[15px]">Please fill in your details</p>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          <input 
            type="file" 
            ref={profileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'profileImage')}
          />
          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative group">
            {formData.profileImage ? (
              <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-slate-300" />
            )}
            <button 
              type="button"
              onClick={() => profileInputRef.current.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={24} className="text-white" />
            </button>
          </div>
          <button 
            type="button"
            onClick={() => profileInputRef.current.click()}
            className="absolute bottom-1 right-1 w-9 h-9 bg-[#001b4e] rounded-full flex items-center justify-center border-2 border-white text-white shadow-lg active:scale-90 transition-all"
          >
            <Camera size={18} />
          </button>
        </div>
        <span className="text-[12px] font-medium text-slate-400 mt-2">Profile Photo (Optional)</span>
      </div>

      <div className="space-y-6">
        {/* Required Information Section */}
        <div>
          <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Required Information</h3>
          <div className="space-y-4">
            <InputField 
              icon={<User size={18} />} 
              label="Full Name *" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name" 
            />
            <InputField 
              icon={<Mail size={18} />} 
              label="Email Address *" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email for communications" 
            />
            <div className="relative">
              <InputField 
                icon={<Phone size={18} />} 
                label="Phone Number *" 
                name="phone"
                disabled={isVerified}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX" 
                style={{ paddingRight: isVerified ? '120px' : (formData.phone.length === 10 ? '100px' : '18px') }}
              />
              {formData.phone.length === 10 && !isVerified && !showOtpInput && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={verifying}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#001b4e] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                </button>
              )}
              {isVerified && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600 font-bold text-[14px]">
                  <CheckCircle2 size={18} /> Verified
                </div>
              )}
            </div>

            {showOtpInput && !isVerified && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <InputField 
                  icon={<ShieldCheck size={18} />} 
                  label="OTP Verification" 
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP" 
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || verifying}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#001b4e] text-white px-4 py-1.5 rounded-lg text-[13px] font-bold disabled:opacity-50"
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
                </button>
              </motion.div>
            )}
            <InputField 
              icon={<Lock size={18} />} 
              label="Password *" 
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              toggle={<button type="button" onClick={handleTogglePassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
            <InputField 
              icon={<Lock size={18} />} 
              label="Confirm Password *" 
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              toggle={<button type="button" onClick={handleToggleConfirmPassword}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
          </div>
        </div>

        {/* Location Information Section */}
        <div className="pt-2">
          <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Location Information</h3>
          
          <button className="w-full bg-gradient-to-br from-[#001b4e] to-[#2334b2] p-6 rounded-2xl flex flex-col items-center gap-3 text-white mb-6 shadow-xl shadow-indigo-900/10 active:scale-[0.98] transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
              <Navigation size={22} className="rotate-45" />
            </div>
            <div className="text-center">
              <div className="text-[16px] font-bold">Auto-Detect Location</div>
              <div className="text-[11px] text-white/70">Use GPS to automatically fill location details</div>
            </div>
            <div className="bg-white text-[#001b4e] px-6 py-2 rounded-xl text-[13px] font-bold mt-2 shadow-inner">
              Detect My Location
            </div>
          </button>

          <div className="grid grid-cols-1 gap-4">
            <SelectField 
              label="State *" 
              name="state"
              value={formData.state}
              onChange={handleChange}
              icon={<MapPin size={18} />} 
              options={states} 
            />
            <SelectField 
              label="District *" 
              name="district"
              value={formData.district}
              onChange={handleChange}
              icon={<Map size={18} />} 
              options={districts} 
              disabled={!formData.state}
            />
          </div>
        </div>

        {/* Role Specific Fields */}
        {role === 'supplier' && (
          <div className="pt-2">
            <h3 className="text-[14px] font-bold text-[#001b4e] uppercase tracking-wider mb-4 px-1">Supplier Categories *</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPLIER_CATEGORIES.map(category => {
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
                };

                return (
                  <div 
                    key={category} 
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
              <span className="text-[15px] font-bold">Add Optional Information</span>
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
                      accept="image/*"
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
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      icon={<CreditCard size={18} />} 
                      label="PAN Number" 
                      name="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      placeholder="ABCDE1234F" 
                    />
                    <InputField 
                      icon={<Hash size={18} />} 
                      label="GST Number" 
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                      placeholder="Optional" 
                    />
                  </div>

                  <InputField 
                    icon={<User size={18} />} 
                    label="Aadhar Number" 
                    name="aadhar"
                    value={formData.aadhar}
                    onChange={handleChange}
                    placeholder="12 digit number" 
                  />

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
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all resize-none"
                    ></textarea>
                  </div>

                  <InputField 
                    icon={<Map size={18} />} 
                    label="Pincode" 
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 digit number" 
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
          onClick={onComplete}
          disabled={!isVerified}
          className={`flex-[2] py-5 ${!isVerified ? 'bg-slate-300' : 'bg-[#001b4e]'} text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:bg-[#001b4e]/90 transition-all font-sans`}
        >
          {isPremium ? 'Proceed to Payment' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, icon, type = "text", placeholder, toggle, value, onChange, name, disabled }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-[#001b4e] uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border border-slate-200 rounded-2xl py-4.5 ${icon ? 'pl-12' : 'pl-5'} pr-12 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-300 outline-none focus:border-[#001b4e] transition-all`}
      />
      {toggle && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          {toggle}
        </div>
      )}
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
