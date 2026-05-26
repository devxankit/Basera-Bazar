import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Landmark, Camera, ShieldCheck, Mail, Phone, Lock, CheckCircle2, ChevronRight, MapPinned, CreditCard, Building2, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast, Toaster } from '../../mockToast';
import TestingModeBanner from '../../components/common/TestingModeBanner';
import { useBackgroundUpload } from '../../hooks/useBackgroundUpload';

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
  const { queueUpload, awaitUpload, cancelUpload } = useBackgroundUpload();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [ifscError, setIfscError] = useState('');
  const [errors, setErrors] = useState({});
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState(null);

  // Field-level validators — schema-like for clarity and reuse
  const VALIDATORS = {
    name: (v) => !v?.trim() ? 'Full name is required' : !/^[a-zA-Z\s]+$/.test(v.trim()) ? 'Name can only contain letters' : '',
    email: (v) => !v?.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email format' : '',
    phone: (v) => !v ? 'Phone is required' : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit Indian number' : '',
    password: (v) => !v ? 'Password is required' : v.length < 8 ? 'Min 8 characters' : !/\d/.test(v) ? 'Must include a number' : '',
    confirmPassword: (v, fd) => !v ? 'Please confirm your password' : v !== fd.password ? 'Passwords do not match' : '',
    pincode: (v) => !v ? 'Pincode is required' : !/^\d{6}$/.test(v) ? 'Must be exactly 6 digits' : '',
    account_number: (v) => !v ? 'Account number is required' : !/^\d{9,18}$/.test(v) ? 'Must be 9–18 digits' : '',
    ifsc_code: (v) => !v ? 'IFSC is required' : !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v) ? 'Invalid IFSC (e.g. BARB0STAKOT)' : '',
    aadhar_number: (v) => !v ? 'Aadhaar number is required' : !/^\d{12}$/.test(v) ? 'Must be exactly 12 digits' : '',
    pan_number: (v) => !v ? 'PAN number is required' : !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) ? 'Invalid PAN (e.g. ABCDE1234F)' : '',
  };

  const validateField = (name, value) => {
    const fn = VALIDATORS[name];
    return fn ? fn(value, formData) : '';
  };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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

    // Live-clear error when the field becomes valid
    const fieldError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError || undefined }));
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately (fast — no upload needed for preview)
    const localPreview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, [field]: localPreview } }));

    // Compress + upload to Cloudinary in the background right now
    queueUpload(field, file);
  };

  const handleRemoveKycImage = (field) => {
    // Cancel background upload and delete from Cloudinary if already done
    cancelUpload(field);
    setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, [field]: null } }));
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

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

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
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, live_photo: dataUrl } }));
      stopCamera();
      // Convert dataURL to File and queue background upload
      fetch(dataUrl)
        .then(r => r.blob())
        .then(blob => {
          const file = new File([blob], 'live_photo.jpg', { type: 'image/jpeg' });
          queueUpload('live_photo', file);
        })
        .catch(() => {}); // non-fatal
    }
  };

  const validateStep = (fields) => {
    const stepErrors = {};
    fields.forEach(f => {
      const err = validateField(f, getFieldValue(f));
      if (err) stepErrors[f] = err;
    });
    setErrors(prev => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  // Resolve a possibly-nested field name to its value
  const getFieldValue = (name) => {
    if (formData[name] !== undefined) return formData[name];
    if (formData.address[name] !== undefined) return formData.address[name];
    if (formData.bank_details[name] !== undefined) return formData.bank_details[name];
    if (formData.kyc[name] !== undefined) return formData.kyc[name];
    return '';
  };

  // Actions
  const sendOtp = async () => {
    if (!validateStep(['name', 'email', 'phone', 'password', 'confirmPassword'])) {
      toast.error('Please fix the highlighted errors');
      return;
    }
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
      setResendTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setIsSubmitting(true);
    setOtpError('');
    setOtp('');
    try {
      await api.post('/executive/register/step1', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      toast.success('OTP resent to ' + formData.phone);
      setResendTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setIsSubmitting(true);
    setOtpError('');
    try {
      const res = await api.post('/executive/register/verify', {
        phone: formData.phone,
        otp,
      });
      // Store token only — no DB write yet, don't log in
      setPhoneVerifiedToken(res.data.phone_verified_token);
      setStep(3);
      toast.success('Phone verified!');
    } catch (error) {
      setOtpError('Incorrect OTP. Please try again.');
      setOtp('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDetails = async () => {
    if (!validateStep(['pincode', 'account_number', 'ifsc_code'])) {
      toast.error('Please fix the highlighted errors');
      return;
    }
    if (!phoneVerifiedToken) {
      toast.error('Session expired. Please restart registration.');
      setStep(1);
      return;
    }
    setIsSubmitting(true);
    try {
      // Create executive account now — first DB write
      const res = await api.post('/executive/register/create', {
        phone_verified_token: phoneVerifiedToken,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        bank_details: formData.bank_details,
      });
      login(res.data.executive, res.data.token);
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: convert a data: URL to a proper File with correct MIME type + name
  const dataURLtoFile = (dataUrl, filename) => {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new File([ab], filename, { type: mime });
  };

  const finalize = async () => {
    const kycErrors = {};
    if (!formData.kyc.aadhar_number) kycErrors.aadhar_number = 'Aadhaar number is required';
    else if (!/^\d{12}$/.test(formData.kyc.aadhar_number)) kycErrors.aadhar_number = 'Must be exactly 12 digits';
    if (!formData.kyc.pan_number) kycErrors.pan_number = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.kyc.pan_number)) kycErrors.pan_number = 'Invalid PAN (e.g. ABCDE1234F)';
    if (!formData.kyc.aadhar_image) kycErrors.aadhar_image = 'Aadhaar image is required';
    if (!formData.kyc.pan_image) kycErrors.pan_image = 'PAN card image is required';
    if (Object.keys(kycErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...kycErrors }));
      toast.error('Please fill all required KYC fields');
      return;
    }
    setIsSubmitting(true);
    const loadingToastId = toast.loading('Finalizing submission…');
    try {
      // Background uploads started on file-select — await them here.
      // If already done, these resolve instantly (zero wait).
      const [aadharUrl, panUrl, livePhotoUrl] = await Promise.all([
        awaitUpload('aadhar_image'),
        awaitUpload('pan_image'),
        awaitUpload('live_photo'),
      ]);

      const kycData = {
        ...formData.kyc,
        aadhar_image: aadharUrl || formData.kyc.aadhar_image,
        pan_image: panUrl || formData.kyc.pan_image,
        live_photo: livePhotoUrl || formData.kyc.live_photo || null,
      };

      const res = await api.put('/executive/register/step3', { kyc: kycData });
      toast.dismiss(loadingToastId);
      toast.success('KYC submitted! Redirecting…');

      const token = localStorage.getItem('baserabazar_token');
      login(res.data.executive, token);
      setTimeout(() => navigate('/executive/dashboard'), 1200);
    } catch (error) {
      toast.dismiss(loadingToastId);
      const msg = error.response?.data?.message || error.message || 'KYC submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto relative overflow-x-hidden">
      <Toaster />

      {/* Header */}
      <div className="bg-[#001b4e] px-6 pt-10 pb-7 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/executive/login')}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Step {step} of {steps.length}</span>
          <div className="w-9" />
        </div>

        {/* Step name + progress */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#fa8639] flex items-center justify-center shadow-lg shadow-orange-900/30">
            {React.createElement(steps[step - 1].icon, { size: 22, className: 'text-white' })}
          </div>
          <div>
            <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest leading-none mb-1">Field Executive</p>
            <h1 className="text-white text-[22px] font-bold leading-tight">{steps[step - 1].title}</h1>
          </div>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-2">
          {steps.map(s => (
            <div key={s.id} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${step > s.id ? 'bg-[#fa8639]' : step === s.id ? 'bg-white' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow p-5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 pt-2">
              <TestingModeBanner />
              <p className="text-slate-500 text-sm font-medium mb-2">Fill in your basic information to get started.</p>
              <InputField label="Full Name" name="name" icon={UserCircle} value={formData.name} onChange={handleInputChange} placeholder="As per documents" inputMode="text" autoComplete="name" maxLength={60} error={errors.name} />
              <InputField label="Email Address" name="email" icon={Mail} type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" autoComplete="email" maxLength={100} error={errors.email} />
              <InputField label="Phone Number" name="phone" icon={Phone} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" prefix="+91" value={formData.phone} onChange={handleInputChange} placeholder="10-digit number" error={errors.phone} />
              <InputField label="Password" name="password" icon={Lock} type="password" autoComplete="new-password" value={formData.password} onChange={handleInputChange} placeholder="Min 8 chars, include a number" error={errors.password} />
              <InputField label="Confirm Password" name="confirmPassword" icon={Lock} type="password" autoComplete="new-password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Re-enter your password" error={errors.confirmPassword} />

              <button
                onClick={sendOtp}
                disabled={isSubmitting || !formData.name || !formData.phone || !formData.password || !formData.confirmPassword}
                className="w-full py-4 bg-[#001b4e] text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-40 mt-2"
              >
                <span className="text-[15px]">{isSubmitting ? 'Sending OTP…' : 'Send OTP & Continue'}</span>
                {!isSubmitting && <ChevronRight size={20} />}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center pt-8">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-slate-900">Verify Your Phone</h2>
                <p className="text-slate-500 text-sm mt-1">6-digit code sent to<br /><span className="text-[#001b4e] font-bold text-base">+91 {formData.phone}</span></p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  className={`w-full bg-slate-50 border-2 text-center text-4xl font-bold tracking-[0.6em] py-5 rounded-2xl focus:outline-none transition-all ${otpError ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900'}`}
                  placeholder="••••••"
                />
                {otpError && <p className="text-sm font-semibold text-red-500">{otpError}</p>}
                <div className="flex justify-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-slate-400 font-medium">Resend in <span className="text-indigo-600 font-bold">{resendTimer}s</span></p>
                  ) : (
                    <button type="button" onClick={resendOtp} disabled={isSubmitting} className="text-sm font-bold text-indigo-600 underline underline-offset-2 disabled:opacity-50">
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={verifyOtp}
                disabled={isSubmitting || otp.length < 6}
                className="w-full py-4 bg-indigo-600 text-white font-bold text-[15px] rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 pt-2">
              {/* Address Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Residential Address</span>
                </div>
                <div className="p-5 space-y-4">
                  <InputField label="Street Address" name="address_line" value={formData.address.address_line} onChange={(e) => handleInputChange(e, 'address')} placeholder="Building, Street, Area" autoComplete="address-line1" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="City" name="city" value={formData.address.city} onChange={(e) => handleInputChange(e, 'address')} placeholder="Delhi" autoComplete="address-level2" />
                    <InputField label="Pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={formData.address.pincode} onChange={(e) => handleInputChange(e, 'address')} placeholder="110001" error={errors.pincode} />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCard size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Bank Payout Details</span>
                </div>
                <div className="p-5 space-y-4">
                  <InputField label="Bank Name" name="bank_name" icon={Building2} value={formData.bank_details.bank_name} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="e.g. HDFC, SBI" />
                  <InputField label="Account Number" name="account_number" inputMode="numeric" maxLength={18} value={formData.bank_details.account_number} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="9–18 digits" error={errors.account_number} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="IFSC Code" name="ifsc_code" maxLength={11} value={formData.bank_details.ifsc_code} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="BARB0STAKOT" error={ifscError || errors.ifsc_code} />
                    <InputField label="Account Holder" name="account_holder_name" value={formData.bank_details.account_holder_name} onChange={(e) => handleInputChange(e, 'bank_details')} placeholder="Full name" />
                  </div>
                </div>
              </div>

              <button
                onClick={submitDetails}
                disabled={
                  isSubmitting || !!ifscError ||
                  !formData.address.address_line || !formData.address.city || !formData.address.pincode ||
                  !formData.bank_details.bank_name || !formData.bank_details.account_number ||
                  !formData.bank_details.ifsc_code || !formData.bank_details.account_holder_name
                }
                className="w-full py-4 bg-[#001b4e] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <span>Continue to KYC</span>
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 pt-2">
              <p className="text-slate-500 text-sm font-medium">Upload your identity documents clearly for fast verification.</p>

              {/* Live Photo */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Camera size={16} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Identity Selfie</span>
                  </div>
                  {formData.kyc.live_photo && <CheckCircle2 size={18} className="text-green-500" />}
                </div>
                <div className="p-4">
                  <div className={`relative h-56 rounded-2xl border-2 border-dashed overflow-hidden transition-all ${formData.kyc.live_photo || isCameraOpen ? 'border-indigo-400 bg-black' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}>
                    {isCameraOpen ? (
                      <div className="relative w-full h-full">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                          <button onClick={stopCamera} className="px-5 py-2.5 bg-white/15 backdrop-blur text-white text-xs font-bold rounded-xl border border-white/20 uppercase tracking-wider">Cancel</button>
                          <button onClick={capturePhoto} className="px-7 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-xl uppercase tracking-wider">Capture</button>
                        </div>
                      </div>
                    ) : formData.kyc.live_photo ? (
                      <div className="relative w-full h-full">
                        <img src={formData.kyc.live_photo} alt="Selfie" className="w-full h-full object-cover" />
                        <button onClick={() => setIsCameraOpen(true)} className="absolute bottom-3 right-3 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"><Camera size={18} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Camera size={28} /></div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">Take Live Photo</p>
                          <p className="text-xs text-slate-400 mt-0.5">Tap to open camera</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Aadhaar */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                    <MapPinned size={16} className="text-orange-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Aadhaar Card</span>
                </div>
                <div className="p-5 space-y-4">
                  <InputField label="Aadhaar Number" name="aadhar_number" inputMode="numeric" maxLength={12} value={formData.kyc.aadhar_number} onChange={(e) => handleInputChange(e, 'kyc')} placeholder="12-digit UIDAI number" error={errors.aadhar_number} />
                  <DocUpload label="Aadhaar Front Side" value={formData.kyc.aadhar_image} onChange={(e) => handleFileUpload(e, 'aadhar_image')} onRemove={() => handleRemoveKycImage('aadhar_image')} error={errors.aadhar_image} />
                </div>
              </div>

              {/* PAN */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CreditCard size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">PAN Card</span>
                </div>
                <div className="p-5 space-y-4">
                  <InputField label="PAN Number" name="pan_number" maxLength={10} value={formData.kyc.pan_number} onChange={(e) => handleInputChange(e, 'kyc')} placeholder="ABCDE1234F" error={errors.pan_number} />
                  <DocUpload label="PAN Card Photo" value={formData.kyc.pan_image} onChange={(e) => handleFileUpload(e, 'pan_image')} onRemove={() => handleRemoveKycImage('pan_image')} error={errors.pan_image} />
                </div>
              </div>

              <button
                onClick={finalize}
                disabled={isSubmitting || !formData.kyc.live_photo || !formData.kyc.aadhar_number || !formData.kyc.aadhar_image || !formData.kyc.pan_number || !formData.kyc.pan_image}
                className="w-full py-4 bg-[#001b4e] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {isSubmitting ? 'Processing…' : 'Finalize Registration'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input type="file" ref={fallbackCameraRef} accept="image/jpeg, image/png, image/webp" capture="user" className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const localUrl = URL.createObjectURL(file);
          setFormData(prev => ({ ...prev, kyc: { ...prev.kyc, live_photo: localUrl } }));
          queueUpload('live_photo', file);
        }
      }} />
    </div>
  );
}

const InputField = ({ label, icon: Icon, prefix, error, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
        {Icon && <Icon size={18} className="text-slate-400" />}
        {prefix && <span className="text-slate-700 font-bold text-[15px] border-r border-slate-200 pr-3">{prefix}</span>}
      </div>
      <input
        {...props}
        className={`w-full bg-white border-2 ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#001b4e]'} py-3.5 ${Icon ? (prefix ? 'pl-28' : 'pl-12') : (prefix ? 'pl-20' : 'px-4')} pr-4 rounded-xl text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:outline-none transition-all`}
      />
    </div>
    {error && <p className="text-xs text-red-500 font-semibold ml-0.5">{error}</p>}
  </div>
);

const DocUpload = ({ label, value, onChange, onRemove, error }) => (
  <div className="space-y-1.5">
    <div className="relative">
      {!value && <input type="file" accept="image/jpeg, image/png, image/webp" onChange={onChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />}
      <div className={`w-full py-4 px-5 rounded-2xl border-2 border-dashed flex items-center justify-between transition-all ${value ? 'border-green-400 bg-green-50' : error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-[#001b4e] hover:bg-blue-50'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden ${value ? 'bg-green-500 text-white' : error ? 'bg-red-100 text-red-500' : 'bg-white text-slate-400 border border-slate-200'}`}>
            {value ? <img src={value} alt={label} className="w-full h-full object-cover" /> : <Camera size={20} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{value ? '✓ Uploaded — tap × to remove' : 'Tap to upload photo'}</p>
          </div>
        </div>
        {value ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            className="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        ) : <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">Upload</span>}
      </div>
    </div>
    {error && <p className="text-xs text-red-500 font-semibold ml-0.5">{error}</p>}
  </div>
);
