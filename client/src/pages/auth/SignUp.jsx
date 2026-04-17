import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LocationPicker from '../../components/common/LocationPicker';

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
          backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px',
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
          <button onClick={primaryAction} style={{ padding: '16px', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 0 #182489' }}>
            {primaryText}
          </button>
          {secondaryText && (
            <button onClick={secondaryAction} style={{ padding: '16px', backgroundColor: '#f0f3ff', color: '#2334b2', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
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

  // OTP / verification states
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);

  // Popup modal state: null | 'EMAIL_EXISTS' | 'PHONE_EXISTS' | 'USER_EXISTS'
  const [popup, setPopup] = useState(null);

  // Timer Countdown Logic
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff',
    border: '1.5px solid #dde1f0', borderRadius: '14px',
    padding: '18px 18px 18px 54px', fontSize: '16px',
    fontWeight: '500', color: '#1b2c7a', outline: 'none',
  };
  const iconStyle = {
    position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)',
    color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none',
  };

  // ── STEP 1: Check uniqueness, then send OTP ────────────────────────────────
  const handleSendOtp = async () => {
    if (form.phone.length !== 10) return;

    // If called as resend, skip the check
    const isResend = showOtpInput;

    if (!isResend) {
      if (!form.fullName.trim()) { alert('Please enter your full name.'); return; }
      if (!form.email.trim()) { alert('Please enter your email address.'); return; }
      if (!form.password.trim()) { alert('Please enter a password.'); return; }

      // ── Check if email/phone already exist in the database ──
      try {
        setVerifying(true);
        await api.post('/auth/check-exists', {
          phone: form.phone,
          email: form.email.trim().toLowerCase(),
        });
        // No conflict — fall through to OTP
      } catch (error) {
        console.error('Signup Verification Error:', error);
        const code = error.response?.data?.code;
        const serverMsg = error.response?.data?.message;

        if (code === 'EMAIL_EXISTS' || code === 'PHONE_EXISTS' || code === 'USER_EXISTS') {
          setPopup(code);
        } else {
          // Provide a much more specific error message based on the response
          const detailedError = serverMsg 
            ? `Verification Failed: ${serverMsg}` 
            : 'Connection Error: Unable to reach the server. Please check your internet and try again.';
          alert(detailedError);
        }
        setVerifying(false);
        return;
      } finally {
        setVerifying(false);
      }
    }

    // ── Send OTP ──
    try {
      setVerifying(true);
      
      // Basic validation for location fields before OTP
      if (!form.city || !form.state || !form.district) {
        alert('Please select your location first.');
        setVerifying(false);
        return;
      }

      const response = await api.post('/auth/send-otp', { phone: form.phone });
      if (response.data.success) {
        setShowOtpInput(true);
        setTimer(60);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ── STEP 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      setVerifying(true);
      const response = await api.post('/auth/verify-otp', {
        phone: form.phone,
        otp,
        role: 'user',
        flow: 'signup', // tells backend to CREATE the user
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
        setIsVerified(true);
        setShowOtpInput(false);
        // Immediately log the user in after successful signup
        const { token, user } = response.data;
        login(user, token);
        navigate('/');
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'EMAIL_EXISTS' || code === 'PHONE_EXISTS') {
        setPopup(code);
        setShowOtpInput(false);
      } else {
        alert(error.response?.data?.message || 'Invalid OTP. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // ── STEP 3: Final Submit (normally bypassed since login is auto) ────────────
  const handleSignUp = (e) => {
    e.preventDefault();
    // User is already logged in via verifyOtp — nothing else needed
  };

  // ── Popup config map ────────────────────────────────────────────────────────
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
      secondaryText: 'Use Different Number', secondaryAction: () => { setPopup(null); setForm(f => ({ ...f, phone: '' })); }
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

          <form onSubmit={handleSignUp}>
            {/* Full Name */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
              <span style={iconStyle}><User size={22} strokeWidth={1.8} /></span>
              <input
                type="text" placeholder="Full Name" required
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                disabled={isVerified}
                style={inputStyle}
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
              <span style={iconStyle}><Mail size={22} strokeWidth={1.8} /></span>
              <input
                type="email" placeholder="Email Address" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={isVerified}
                style={inputStyle}
              />
            </motion.div>

            {/* Phone + Verify Button */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: isVerified || showOtpInput ? '10px' : '18px' }}>
              <span style={iconStyle}><Phone size={22} strokeWidth={1.8} /></span>
              <input
                type="tel" placeholder="Phone Number" required
                disabled={isVerified || showOtpInput}
                value={form.phone} maxLength={10}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                style={{ ...inputStyle, paddingRight: isVerified ? '120px' : (form.phone.length === 10 ? '100px' : '18px') }}
              />
              {form.phone.length === 10 && !isVerified && !showOtpInput && (
                <button
                  type="button" onClick={handleSendOtp}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                </button>
              )}
              {isVerified && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  <CheckCircle2 size={18} /> Verified
                </div>
              )}
            </motion.div>

            {/* OTP Input */}
            {showOtpInput && !isVerified && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', marginBottom: '18px' }}>
                <input
                  type="text" placeholder="Enter 6-digit OTP" maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, paddingLeft: '18px', borderColor: '#2334b2', backgroundColor: '#f8f9ff' }}
                />
                <button
                  type="button" onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || verifying}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: otp.length === 6 ? '#2334b2' : '#a0a8e0', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: otp.length === 6 ? 'pointer' : 'not-allowed' }}
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
                </button>
              </motion.div>
            )}

            {/* Resend OTP Timer */}
            {showOtpInput && !isVerified && (
              <motion.div variants={fadeInUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px', marginTop: '-10px', paddingRight: '4px' }}>
                {timer > 0 ? (
                  <span style={{ fontSize: '14px', color: '#8898cc', fontWeight: '500' }}>
                    Resend OTP in <span style={{ color: '#1b2c7a', fontWeight: '600' }}>00:{timer < 10 ? `0${timer}` : timer}</span>
                  </span>
                ) : (
                  <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', padding: 0, color: '#2334b2', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                    Resend OTP
                  </button>
                )}
              </motion.div>
            )}

            {/* Location Section */}
            <motion.div variants={fadeInUp} style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a567a', marginBottom: '8px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Location (Mandatory)
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                style={{
                  width: '100%', padding: '16px 18px', backgroundColor: '#ffffff',
                  border: '1.5px solid #dde1f0', borderRadius: '14px',
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

            {form.city && (
              <motion.div variants={fadeInUp} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={iconStyle}><AlertCircle size={20} strokeWidth={1.8} /></span>
                  <input
                    type="text" placeholder="Full Address / Landmark" required
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                   <input
                    type="text" placeholder="Pincode" required maxLength={6}
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                    style={{ ...inputStyle, paddingLeft: '18px' }}
                   />
                </div>
              </motion.div>
            )}

            {/* Password */}
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '10px' }}>
              <span style={iconStyle}><Lock size={22} strokeWidth={1.8} /></span>
              <input
                type={showPassword ? 'text' : 'password'} placeholder="Password" required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                disabled={isVerified}
                style={{ ...inputStyle, paddingRight: '54px' }}
              />
              <button
                type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3b52d4', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={24} strokeWidth={2} /> : <Eye size={24} strokeWidth={2} />}
              </button>
            </motion.div>

            {/* Terms */}
            <motion.p variants={fadeInUp} style={{ fontSize: '13px', color: '#8898cc', fontWeight: '500', lineHeight: 1.6, margin: '14px 2px 28px' }}>
              By signing up, you agree to our{' '}
              <span style={{ color: '#1b2c7a', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: '#1b2c7a', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy Policy</span>.
            </motion.p>

            {/* Info hint if phone not verified */}
            {!isVerified && !showOtpInput && form.phone.length === 10 && (
              <motion.p variants={fadeInUp} style={{ fontSize: '13px', color: '#8898cc', textAlign: 'center', marginBottom: '16px' }}>
                Click <strong style={{ color: '#2334b2' }}>Verify</strong> next to your phone number to create your account.
              </motion.p>
            )}
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
                  if (loc.isGPS) {
                    setForm(f => ({ 
                      ...f, 
                      coords: loc.coordinates,
                      city: loc.name || f.city,
                      state: loc.state || f.state,
                      district: loc.district || f.district
                    }));
                  } else {
                    setForm(f => ({ 
                      ...f, 
                      city: loc.name, 
                      district: loc.district, 
                      state: loc.state,
                      coords: null
                    }));
                  }
                  setIsLocationModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
