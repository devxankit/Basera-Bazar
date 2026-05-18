import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Landmark, Camera, ShieldCheck, Mail, Phone, Lock, CheckCircle2, ChevronRight, MapPinned, CreditCard, Building2, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { db } from '../../services/DataEngine';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../mockToast';

const steps = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Verify', icon: ShieldCheck },
  { id: 3, title: 'Details', icon: Landmark },
  { id: 4, title: 'KYC', icon: Camera },
];

export default function ExecutiveSignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const fallbackCameraRef = useRef(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [otp, setOtp] = useState('');
  const [ifscError, setIfscError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: {
      address_line: '',
      city: '',
      state: '',
      pincode: '',
    },
    bank_details: {
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      account_holder_name: '',
    },
    kyc: {
      aadhar_number: '',
      aadhar_image: null,
      pan_number: '',
      pan_image: null,
      live_photo: null,
    }
  });

  const handleInputChange = (e, section = null) => {
    let { name, value } = e.target;

    if (['phone', 'pincode', 'account_number', 'aadhar_number'].includes(name)) {
      if (name === 'phone') value = value.replace(/\s+/g, '').replace(/^\+91/, '');
      value = value.replace(/\D/g, '').slice(0, name === 'phone' ? 10 : name === 'pincode' ? 6 : name === 'aadhar_number' ? 12 : name === 'account_number' ? 18 : 20);
    }

    if (['name', 'city', 'bank_name', 'account_holder_name'].includes(name)) {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }

    if (name === 'ifsc_code') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
      if (value.length === 11 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
        setIfscError('Invalid IFSC (e.g. BARB0STAKOT)');
      } else {
        setIfscError('');
      }
    }

    if (name === 'pan_number') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }

    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, [field]: reader.result } }));
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error('Camera access failed. Please upload a photo instead.');
      setIsCameraOpen(false);
      // Automatically trigger file input for fallback
      if (fallbackCameraRef.current) {
        fallbackCameraRef.current.click();
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, live_photo: canvas.toDataURL('image/jpeg') } }));
      stopCamera();
    }
  };

  // Actions
  const sendOtp = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/executive/register/step1', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      toast.success('OTP sent to ' + formData.phone);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/executive/register/verify', {
        phone: formData.phone,
        otp,
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      login(res.data.executive, res.data.token);
      setStep(3);
      toast.success('Phone verified!');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDetails = async () => {
    setIsSubmitting(true);
    try {
      await api.put('/executive/register/step2', {
        address: formData.address,
        bank_details: formData.bank_details
      });
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalize = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Uploading documents...');
    try {
      const kycData = { ...formData.kyc };
      const uploadFields = ['aadhar_image', 'pan_image', 'live_photo'];
      
      for (const field of uploadFields) {
        if (kycData[field]?.startsWith('data:')) {
          const res = await db.uploadFile(await fetch(kycData[field]).then(r => r.blob()));
          kycData[field] = res.url;
        }
      }

      const res = await api.put('/executive/register/step3', { kyc: kycData });
      toast.success('KYC Submitted Successfully!', { id: loadingToast });
      
      const token = localStorage.getItem('baserabazar_token');
      login(res.data.executive, token);
      setTimeout(() => navigate('/executive/dashboard'), 1000);
    } catch (error) {
      toast.error('KYC Submission failed', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col max-w-md mx-auto relative overflow-x-hidden">
      
      {/* Clean Header */}
      <div className="bg-white px-6 pt-10 pb-6 sticky top-0 z-30 border-b border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/executive/login')}
            className="p-2 bg-slate-50 rounded-lg text-slate-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-1">
            {steps.map(s => (
              <div key={s.id} className={`w-6 h-1 rounded-full transition-colors duration-500 ${step >= s.id ? 'bg-[#fa8639]' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            {React.createElement(steps[step-1].icon, { size: 20 })}
          </div>
          <div>
            <h1 className="text-xl font-medium text-slate-900">{steps[step-1].title}</h1>
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Step {step} of 4</p>
          </div>
        </div>
      </div>

      <div className="flex-grow p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <InputField label="Full Name" name="name" icon={UserCircle} value={formData.name} onChange={handleInputChange} placeholder="As per documents" />
                <InputField label="Email Address" name="email" icon={Mail} value={formData.email} onChange={handleInputChange} placeholder="For notifications" />
                <InputField label="Phone Number" name="phone" icon={Phone} prefix="+91" value={formData.phone} onChange={handleInputChange} placeholder="10 digits" />
                <InputField label="Security Password" name="password" icon={Lock} type="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
              </div>
              <button 
                onClick={sendOtp} 
                disabled={isSubmitting || !formData.name || !formData.phone || !formData.password}
                className="w-full py-4 bg-slate-900 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                <span>{isSubmitting ? 'Sending...' : 'Continue'}</span>
                {!isSubmitting && <ChevronRight size={18} />}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center pt-10">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={48} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium text-slate-900">Verify Phone</h2>
                <p className="text-slate-500 font-normal">Enter the 6-digit code sent to<br/><span className="text-slate-900 font-medium">+91 {formData.phone}</span></p>
                <p className="text-[10px] font-medium text-indigo-600/50 uppercase tracking-[0.2em] mt-4">Demo Code: 123456</p>
              </div>
              <input 
                type="text" 
                maxLength="6" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                className="w-full bg-white border-2 border-slate-100 text-center text-4xl font-medium tracking-[0.8em] py-5 rounded-[1.5rem] focus:outline-none focus:border-indigo-600 focus:ring-8 focus:ring-indigo-600/5 transition-all" 
                placeholder="000000"
              />
              <button 
                onClick={verifyOtp} 
                disabled={isSubmitting || otp.length < 6}
                className="w-full py-5 bg-indigo-600 text-white font-medium rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {isSubmitting ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-indigo-600" />
                  <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Residential Address</h3>
                </div>
                <InputField label="Street Address" name="address_line" value={formData.address.address_line} onChange={(e) => handleInputChange(e, 'address')} placeholder="Building, Street" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City" name="city" value={formData.address.city} onChange={(e) => handleInputChange(e, 'address')} placeholder="Delhi" />
                  <InputField label="Pincode" name="pincode" value={formData.address.pincode} onChange={(e) => handleInputChange(e, 'address')} placeholder="110001" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-indigo-600" />
                  <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Bank Payout Details</h3>
                </div>
                <InputField label="Bank Name" name="bank_name" icon={Building2} value={formData.bank_details.bank_name} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="HDFC, SBI, etc." />
                <InputField label="Account Number" name="account_number" value={formData.bank_details.account_number} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="0000 0000 0000" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="IFSC Code" name="ifsc_code" value={formData.bank_details.ifsc_code} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="BARB0STAKOT" error={ifscError} />
                  <InputField label="Holder Name" name="account_holder_name" value={formData.bank_details.account_holder_name} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="John Doe" />
                </div>
              </div>

              <button
                onClick={submitDetails}
                disabled={
                  isSubmitting ||
                  !!ifscError ||
                  !formData.address.address_line ||
                  !formData.address.city ||
                  !formData.address.pincode ||
                  !formData.bank_details.bank_name ||
                  !formData.bank_details.account_number ||
                  !formData.bank_details.ifsc_code ||
                  !formData.bank_details.account_holder_name
                } 
                className="w-full py-5 bg-indigo-600 text-white font-medium rounded-2xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest text-xs disabled:opacity-30 disabled:pointer-events-none"
              >
                CONTINUE TO KYC
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
              {/* Live Photo Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-1">Identity Selfie</label>
                  {formData.kyc.live_photo && <CheckCircle2 size={16} className="text-green-500" />}
                </div>
                
                <div className={`relative h-64 rounded-[2.5rem] border-2 border-dashed overflow-hidden transition-all ${formData.kyc.live_photo || isCameraOpen ? 'border-indigo-600 bg-black shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                  {isCameraOpen ? (
                    <div className="relative w-full h-full">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                        <button onClick={stopCamera} className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white text-[10px] font-medium rounded-xl border border-white/20 uppercase tracking-widest">Cancel</button>
                        <button onClick={capturePhoto} className="px-8 py-3 bg-white text-slate-900 text-[10px] font-medium rounded-xl shadow-2xl uppercase tracking-widest">Capture</button>
                      </div>
                    </div>
                  ) : formData.kyc.live_photo ? (
                    <div className="relative w-full h-full">
                      <img src={formData.kyc.live_photo} alt="Selfie" className="w-full h-full object-cover" />
                      <button onClick={() => setIsCameraOpen(true)} className="absolute bottom-4 right-4 p-4 bg-indigo-600 text-white rounded-[1.25rem] shadow-xl hover:bg-indigo-700 transition-all"><Camera size={20} /></button>
                    </div>
                  ) : (
                    <div onClick={() => setIsCameraOpen(true)} className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center"><Camera size={32} /></div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-900 uppercase">Take Live Photo</p>
                        <p className="text-[10px] font-normal text-slate-400 mt-1">Tap to open camera</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <InputField label="Aadhar Card Number" name="aadhar_number" value={formData.kyc.aadhar_number} onChange={(e) => handleInputChange(e, 'kyc')} placeholder="12-digit UIDAI number" />
                  <DocUpload label="Aadhar Front Side" value={formData.kyc.aadhar_image} onChange={(e) => handleFileUpload(e, 'aadhar_image')} />
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <InputField label="PAN Card Number" name="pan_number" value={formData.kyc.pan_number} onChange={(e) => handleInputChange(e, 'kyc')} placeholder="ABCDE1234F" />
                  <DocUpload label="PAN Card Photo" value={formData.kyc.pan_image} onChange={(e) => handleFileUpload(e, 'pan_image')} />
                </div>
              </div>

              <button 
                onClick={finalize} 
                disabled={isSubmitting || !formData.kyc.live_photo || !formData.kyc.aadhar_image || !formData.kyc.pan_image}
                className="w-full py-5 bg-slate-900 text-white font-medium rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-30 uppercase tracking-widest text-xs"
              >
                {isSubmitting ? 'PROCESSING APPLICATION...' : 'FINALIZE REGISTRATION'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input type="file" ref={fallbackCameraRef} accept="image/*" capture="user" className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, live_photo: reader.result } }));
          reader.readAsDataURL(file);
        }
      }} />
    </div>
  );
}

const InputField = ({ label, icon: Icon, prefix, error, ...props }) => (
  <div className="space-y-1.5 sm:space-y-2 group">
    <label className="text-[9px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-1 leading-none">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
        {Icon && <Icon size={18} className="text-slate-300" />}
        {prefix && <span className="text-slate-900 font-medium text-[15px] border-r border-slate-100 pr-3">{prefix}</span>}
      </div>
      <input
        {...props}
        className={`w-full bg-slate-50 border ${error ? 'border-red-400' : 'border-slate-100'} py-4 ${Icon ? (prefix ? 'pl-28' : 'pl-14') : (prefix ? 'pl-20' : 'px-5')} pr-6 rounded-xl text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-slate-200 transition-all`}
      />
    </div>
    {error && <p className="text-[11px] text-red-500 font-medium ml-1">{error}</p>}
  </div>
);

const DocUpload = ({ label, value, onChange }) => (
  <div className="relative group">
    <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
    <div className={`w-full py-5 px-6 rounded-2xl border-2 border-dashed flex items-center justify-between transition-all ${value ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${value ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
          <Camera size={20} />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-medium text-slate-900 uppercase tracking-wider">{label}</p>
          <p className="text-[10px] font-normal text-slate-400">{value ? 'Click to replace photo' : 'Upload clear photo'}</p>
        </div>
      </div>
      {value && <CheckCircle2 size={20} className="text-indigo-600" />}
    </div>
  </div>
);
