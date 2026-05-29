import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { registerFCMToken } from '../../services/pushNotificationService';
import LocationPicker from '../../components/common/LocationPicker';
import { useScrollLock } from '../../hooks/useScrollLock';
import { v, sanitize } from '../../utils/validators';
import useFormValidation from '../../hooks/useFormValidation';
import toast from '../../mockToast';
import TestingModeBanner from '../../components/common/TestingModeBanner';

// ─── Small reusable popup modal ───────────────────────────────────────────────
function AlertModal({ icon: Icon, iconBg, iconColor, title, message, primaryText, primaryAction, secondaryText, secondaryAction }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(27, 44, 122, 0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          backgroundColor: '#ffffff', borderRadius: '20px', padding: '32px',
          width: '100%', maxWidth: '360px', textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{ backgroundColor: iconBg, width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: iconColor }}>
          <Icon size={32} />
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b2c7a', marginBottom: '10px' }}>{title}</div>
        <div style={{ fontSize: '15px', color: '#5468b8', lineHeight: 1.6, marginBottom: '28px' }}>{message}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={primaryAction} style={{ padding: '16px', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 0 #182489' }}>
            {primaryText}
          </button>
          {secondaryText && (
            <button onClick={secondaryAction} style={{ padding: '16px', backgroundColor: '#f0f3ff', color: '#2334b2', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              {secondaryText}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main SignUp Component ────────────────────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const handleBack = () => { window.history.length > 2 ? navigate(-1) : navigate('/'); };

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: location.state?.phone || '',
    password: '',
    address: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    coords: null
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // OTP states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  // Popup modal state: null | 'EMAIL_EXISTS' | 'PHONE_EXISTS' | 'USER_EXISTS'
  const [popup, setPopup] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { errors, validateAll, setError, clearError, register } = useFormValidation();

  useScrollLock(isLocationModalOpen || showTerms || showPrivacy || !!popup);

  // Timer countdown
  React.useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff',
    border: '1.5px solid #dde1f0', borderRadius: '12px',
    padding: '18px 18px 18px 54px', fontSize: '16px',
    fontWeight: '500', color: '#1b2c7a', outline: 'none',
  };
  const iconStyle = {
    position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)',
    color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none',
  };

  // ── Validate all fields before any API call ──────────────────────────────
  const validate = () => {
    return validateAll({
      fullName: v.name(form.fullName),
      phone:    v.phone(form.phone),
      email:    v.email(form.email),
      password: v.password(form.password),
      // address is only visible after city is selected — only validate when visible
      address:  form.city ? v.address(form.address) : null,
      pincode:  form.pincode ? v.pincode(form.pincode) : null,
      location: (!form.city || !form.state || !form.district) ? 'Please select your location (city, state, district).' : null,
    });
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/send-otp', { phone: form.phone });
      if (res.data.success) setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Main submit: Step 1 = send OTP, Step 2 = verify + create account ────
  const handleSignUp = async (e) => {
    if (e) e.preventDefault();

    if (!showOtpInput) {
      // ── Step 1: validate → check-exists → send OTP ──
      if (!validate()) return;
      try {
        setLoading(true);
        await api.post('/auth/check-exists', {
          phone: form.phone,
          email: form.email.trim().toLowerCase(),
        });
        const otpRes = await api.post('/auth/send-otp', { phone: form.phone });
        if (otpRes.data.success) {
          setShowOtpInput(true);
          setTimer(60);
        }
      } catch (error) {
        const code = error.response?.data?.code;
        const msg = error.response?.data?.message;
        if (code === 'EMAIL_EXISTS' || code === 'PHONE_EXISTS' || code === 'USER_EXISTS') {
          setPopup(code);
        } else {
          toast.error(msg ? `Error: ${msg}` : 'Connection error. Please check your internet and try again.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Step 2: verify OTP + create account in one call ──
    const otpErr = v.otp(otp);
    if (otpErr) { setError('otp', otpErr); return; }
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        phone: form.phone,
        otp,
        role: 'user',
        flow: 'signup',
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        address: form.address,
        city: form.city,
        state: form.state,
        district: form.district,
        pincode: form.pincode,
        coords: form.coords
      });
      if (response.data.success) {
        const { token, user } = response.data;
        login(user, token);
        registerFCMToken(true);
        navigate('/');
      }
    } catch (error) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message;
      if (code === 'EMAIL_EXISTS' || code === 'PHONE_EXISTS' || code === 'USER_EXISTS') {
        setPopup(code);
        setShowOtpInput(false);
      } else {
        toast.error(msg || 'Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Popup config ────────────────────────────────────────────────────────
  const popupConfig = {
    EMAIL_EXISTS: {
      icon: Mail, iconBg: '#fff1f1', iconColor: '#ef4444',
      title: 'Email Already Registered',
      message: <>The email <strong>{form.email}</strong> is already linked to an account. Please use a different email or login.</>,
      primaryText: 'Go to Login', primaryAction: () => navigate('/login'),
      secondaryText: 'Use Different Email', secondaryAction: () => { setPopup(null); setForm(f => ({ ...f, email: '' })); }
    },
    PHONE_EXISTS: {
      icon: Phone, iconBg: '#fff7ed', iconColor: '#f97316',
      title: 'Phone Number Already Registered',
      message: <>The number <strong>{form.phone}</strong> is already linked to an account. Please use a different number or login.</>,
      primaryText: 'Go to Login', primaryAction: () => navigate('/login'),
      secondaryText: 'Use Different Number', secondaryAction: () => { setPopup(null); setForm(f => ({ ...f, phone: '' })); setShowOtpInput(false); setOtp(''); }
    },
    USER_EXISTS: {
      icon: AlertCircle, iconBg: '#f0f3ff', iconColor: '#2334b2',
      title: 'Account Already Exists',
      message: 'An account with this email and phone number already exists. Please login to continue.',
      primaryText: 'Go to Login', primaryAction: () => navigate('/login'),
      secondaryText: 'Cancel', secondaryAction: () => setPopup(null)
    }
  };

  const currentPopup = popup ? popupConfig[popup] : null;

  const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: 'easeOut' } };
  const staggerContainer = { animate: { transition: { staggerChildren: 0.08 } } };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: '100vh', backgroundColor: '#edeef5', display: 'flex', flexDirection: 'column', maxWidth: '430px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}
      >
        {/* ── HEADER ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', padding: '18px 20px', position: 'relative', borderBottom: '1px solid #dde1f0' }}
        >
          <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#2336b0', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <ArrowLeft size={26} strokeWidth={2} />
          </button>
          <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: '20px', fontWeight: '600', color: '#2336b0', pointerEvents: 'none' }}>
            Create Account
          </span>
        </motion.div>

        {/* ── CONTENT ── */}
        <motion.div
          variants={staggerContainer} initial="initial" animate="animate"
          style={{ flex: 1, padding: '0 28px', backgroundColor: '#edeef5', overflowY: 'auto' }}
        >
          <motion.div variants={fadeInUp} style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '36px' }}>
            <div style={{ fontSize: '30px', fontWeight: '600', color: '#1b2c7a', lineHeight: 1.2, marginBottom: '10px' }}>Get Started!</div>
            <div style={{ fontSize: '17px', fontWeight: '500', color: '#5468b8', lineHeight: 1.4, padding: '0 16px' }}>
              Join BaseraBazar to find your dream property
            </div>
          </motion.div>

          <TestingModeBanner />

          <form onSubmit={handleSignUp}>
            {/* Full Name */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
              <span style={iconStyle}><User size={22} strokeWidth={1.8} /></span>
              <input
                ref={register('fullName')}
                type="text" placeholder="Full Name" required
                value={form.fullName}
                onChange={e => { setForm({ ...form, fullName: e.target.value.replace(/[^A-Za-z\s'\-]/g, '') }); clearError('fullName'); }}
                style={{ ...inputStyle, borderColor: errors.fullName ? '#f87171' : '#dde1f0' }}
              />
              {errors.fullName && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.fullName}</p>}
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
              <span style={iconStyle}><Mail size={22} strokeWidth={1.8} /></span>
              <input
                ref={register('email')}
                type="email" placeholder="Email Address" required
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); clearError('email'); }}
                style={{ ...inputStyle, borderColor: errors.email ? '#f87171' : '#dde1f0' }}
              />
              {errors.email && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.email}</p>}
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeInUp} style={{ marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <span style={iconStyle}><Lock size={22} strokeWidth={1.8} /></span>
                <input
                  ref={register('password')}
                  type={showPassword ? 'text' : 'password'} placeholder="Password (uppercase, lowercase, digit, special char)" required
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); clearError('password'); }}
                  style={{ ...inputStyle, paddingRight: '54px', borderColor: errors.password ? '#f87171' : '#dde1f0' }}
                />
                <button
                  type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3b52d4', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={24} strokeWidth={2} /> : <Eye size={24} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.password}</p>}
            </motion.div>

            {/* Location */}
            <motion.div variants={fadeInUp} style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a567a', marginBottom: '8px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Location (Mandatory)
              </div>
              {errors.location && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '-4px', marginBottom: '6px', fontWeight: '500' }}>{errors.location}</p>}
              <button
                ref={register('location')}
                type="button"
                onClick={() => { setIsLocationModalOpen(true); clearError('location'); }}
                style={{
                  width: '100%', padding: '16px 18px', backgroundColor: '#ffffff',
                  border: '1.5px solid #dde1f0', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left'
                }}
              >
                <div style={{ backgroundColor: '#f0f3ff', padding: '10px', borderRadius: '12px', color: '#2334b2' }}>
                  <MapPin size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1b2c7a' }}>
                    {form.city ? `${form.city}, ${form.state}` : 'Select City'}
                  </div>
                  {form.district && <div style={{ fontSize: '12px', color: '#5468b8' }}>{form.district} District</div>}
                </div>
                <ChevronDown size={18} style={{ color: '#8898cc' }} />
              </button>
            </motion.div>

            {/* Address + Pincode (shown once city is selected) */}
            {form.city && (
              <motion.div variants={fadeInUp} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={iconStyle}><AlertCircle size={20} strokeWidth={1.8} /></span>
                  <input
                    ref={register('address')}
                    type="text" placeholder="Full Address / Landmark" required
                    value={form.address}
                    onChange={e => { setForm({ ...form, address: e.target.value }); clearError('address'); }}
                    style={{ ...inputStyle, borderColor: errors.address ? '#f87171' : '#dde1f0' }}
                  />
                  {errors.address && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.address}</p>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <input
                    ref={register('pincode')}
                    type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Pincode" required maxLength={6}
                    value={form.pincode}
                    onChange={e => { setForm({ ...form, pincode: sanitize.pincode(e.target.value) }); clearError('pincode'); }}
                    style={{ ...inputStyle, paddingLeft: '18px', borderColor: errors.pincode ? '#f87171' : '#dde1f0' }}
                  />
                  {errors.pincode && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.pincode}</p>}
                </div>
              </motion.div>
            )}

            {/* Phone Number */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: showOtpInput ? '10px' : '18px' }}>
              <span style={iconStyle}><Phone size={22} strokeWidth={1.8} /></span>
              <input
                ref={register('phone')}
                type="tel" placeholder="Phone Number" required
                disabled={showOtpInput}
                value={form.phone}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                autoComplete="tel-national"
                onChange={e => {
                  const val = sanitize.phone(e.target.value.replace(/^\+91/, ''));
                  setForm({ ...form, phone: val });
                  clearError('phone');
                }}
                style={{ ...inputStyle, opacity: showOtpInput ? 0.6 : 1, borderColor: errors.phone ? '#f87171' : '#dde1f0' }}
              />
              {showOtpInput && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>
                  <CheckCircle2 size={16} /> OTP Sent
                </div>
              )}
            </motion.div>

            {/* OTP Input (appears after first "Create Account" click) */}
            {showOtpInput && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '8px' }}>
                <input
                  type="text" placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(sanitize.otp(e.target.value)); clearError('otp'); }}
                  style={{ ...inputStyle, paddingLeft: '18px', borderColor: errors.otp ? '#f87171' : '#2334b2', backgroundColor: '#f8f9ff', letterSpacing: '0.3em', textAlign: 'center', fontSize: '20px', fontWeight: '700' }}
                />
                {errors.otp && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500', textAlign: 'center' }}>{errors.otp}</p>}
                {errors.phone && <p style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px', fontWeight: '500' }}>{errors.phone}</p>}
              </motion.div>
            )}

            {/* Resend OTP timer */}
            {showOtpInput && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingRight: '4px', paddingLeft: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setShowOtpInput(false); setOtp(''); setTimer(0); }}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#8898cc', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Change number
                </button>
                {timer > 0 ? (
                  <span style={{ fontSize: '13px', color: '#8898cc', fontWeight: '500' }}>
                    Resend in <span style={{ color: '#1b2c7a', fontWeight: '600' }}>00:{timer < 10 ? `0${timer}` : timer}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#2334b2', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                  >
                    Resend OTP
                  </button>
                )}
              </motion.div>
            )}

            {/* Create Account Button */}
            <motion.div variants={fadeInUp} style={{ marginTop: showOtpInput ? '4px' : '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '18px', backgroundColor: '#2334b2',
                  color: '#fff', border: 'none', borderRadius: '14px', fontSize: '18px',
                  fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 0 #182489', opacity: loading ? 0.8 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading
                  ? <Loader2 size={24} className="animate-spin" />
                  : showOtpInput ? 'Create Account' : 'Create Account'
                }
              </button>
            </motion.div>

            {/* Hint */}
            {showOtpInput && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '13px', color: '#8898cc', textAlign: 'center', marginTop: '12px', marginBottom: '0' }}>
                Enter the OTP sent to <strong style={{ color: '#1b2c7a' }}>+91 {form.phone}</strong> and tap Create Account.
              </motion.p>
            )}

            {/* Terms */}
            <motion.p variants={fadeInUp} style={{ fontSize: '13px', color: '#8898cc', fontWeight: '500', lineHeight: 1.6, margin: '14px 2px 28px' }}>
              By signing up, you agree to our{' '}
              <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#1b2c7a', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontSize: 'inherit' }}>Terms of Service</button>
              {' '}and{' '}
              <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#1b2c7a', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', fontSize: 'inherit' }}>Privacy Policy</button>.
            </motion.p>
          </form>

          {/* Log In link */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'center', padding: '16px 0 48px' }}>
            <span style={{ fontSize: '17px', fontWeight: '500', color: '#8898cc' }}>Already have an account? </span>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', fontWeight: '600', color: '#1b2c7a', marginLeft: '4px' }}
            >
              Log In
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── POPUP MODALS ── */}
      <AnimatePresence>
        {currentPopup && (
          <AlertModal
            key={popup}
            icon={currentPopup.icon}
            iconBg={currentPopup.iconBg}
            iconColor={currentPopup.iconColor}
            title={currentPopup.title}
            message={currentPopup.message}
            primaryText={currentPopup.primaryText}
            primaryAction={currentPopup.primaryAction}
            secondaryText={currentPopup.secondaryText}
            secondaryAction={currentPopup.secondaryAction}
          />
        )}
      </AnimatePresence>

      {/* Location Bottom Sheet */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ translateY: "100%" }}
              animate={{ translateY: 0 }}
              exit={{ translateY: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              style={{ height: '70dvh' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2 mb-1 opacity-50" />
              <LocationPicker
                onClose={() => setIsLocationModalOpen(false)}
                onSelect={(loc) => {
                  setForm(f => ({
                    ...f,
                    city: loc.name || (loc.isGPS ? 'Current Location' : ''),
                    district: loc.district || '',
                    state: loc.state || '',
                    coords: loc.coordinates || null
                  }));
                  setIsLocationModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TERMS OF SERVICE MODAL ── */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,44,122,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000 }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: '430px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1b2c7a' }}>Terms of Service</h2>
              <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc', display: 'flex' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, fontSize: '14px', color: '#4a567a', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '16px', color: '#1b2c7a', fontWeight: '600' }}>Last updated: January 2025</p>
              <p style={{ marginBottom: '16px' }}>Welcome to Basera Bazar. By using our platform, you agree to the following terms:</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>1. Use of Platform</p>
              <p style={{ marginBottom: '16px' }}>Basera Bazar provides a marketplace connecting users with property agents, service providers, suppliers, and mandi sellers. The platform is intended for lawful purposes only.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>2. Account Responsibility</p>
              <p style={{ marginBottom: '16px' }}>You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>3. Listings & Content</p>
              <p style={{ marginBottom: '16px' }}>Partners are solely responsible for the accuracy of their listings. Basera Bazar does not guarantee the quality, safety, or legality of products and services listed.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>4. Prohibited Activities</p>
              <p style={{ marginBottom: '16px' }}>You may not use the platform for fraudulent activities, posting false information, harassing other users, or violating any applicable law.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>5. Termination</p>
              <p style={{ marginBottom: '24px' }}>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
              <p>For questions, contact us at <strong>support@baserabazar.com</strong></p>
            </div>
            <button onClick={() => setShowTerms(false)}
              style={{ marginTop: '20px', padding: '16px', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
              I Understand
            </button>
          </motion.div>
        </div>
      )}

      {/* ── PRIVACY POLICY MODAL ── */}
      {showPrivacy && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,44,122,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000 }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: '430px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1b2c7a' }}>Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc', display: 'flex' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, fontSize: '14px', color: '#4a567a', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '16px', color: '#1b2c7a', fontWeight: '600' }}>Last updated: January 2025</p>
              <p style={{ marginBottom: '16px' }}>Basera Bazar values your privacy. This policy explains what data we collect and how we use it.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>1. Information We Collect</p>
              <p style={{ marginBottom: '16px' }}>We collect your name, phone number, email address, and location when you register or use our services. We also collect usage data to improve the platform.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>2. How We Use Your Data</p>
              <p style={{ marginBottom: '16px' }}>Your data is used to provide and improve our services, send relevant notifications, and connect you with the right businesses in your area.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>3. Data Sharing</p>
              <p style={{ marginBottom: '16px' }}>We do not sell your personal data. Your contact details are shared with partners only when you make an enquiry or place an order.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>4. Your Rights</p>
              <p style={{ marginBottom: '24px' }}>You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com.</p>
              <p>For questions, contact us at <strong>support@baserabazar.com</strong></p>
            </div>
            <button onClick={() => setShowPrivacy(false)}
              style={{ marginTop: '20px', padding: '16px', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
              I Understand
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
