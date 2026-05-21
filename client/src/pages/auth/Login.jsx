import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, Phone, User, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { registerFCMToken } from '../../services/pushNotificationService';
import { v, sanitize } from '../../utils/validators';
import toast from '../../mockToast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const onLoginSuccess = async (user, token) => {
    login(user, token);
    // Explicitly trigger FCM registration after login
    registerFCMToken(true);
    navigate('/');
  };
  const handleBack = () => { window.history.length > 2 ? navigate(-1) : navigate('/'); };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New States
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showOtpOnlyModal, setShowOtpOnlyModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [timer, setTimer] = useState(0);

  // Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1=phone, 2=otp, 3=new password
  const [fpPhone, setFpPhone] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpShowPass, setFpShowPass] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpTimer, setFpTimer] = useState(0);
  const [loginError, setLoginError] = useState('');

  // Legal modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Timer Countdown Logic
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  React.useEffect(() => {
    let interval;
    if (fpTimer > 0) {
      interval = setInterval(() => setFpTimer(p => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [fpTimer]);

  const openForgotModal = () => {
    setFpStep(1); setFpPhone(''); setFpOtp(''); setFpNewPass(''); setFpConfirm('');
    setFpError(''); setFpLoading(false); setFpTimer(0);
    setShowForgotModal(true);
  };

  const handleFpSendOtp = async () => {
    const err = v.phone(fpPhone);
    if (err) { setFpError(err); return; }
    setFpLoading(true); setFpError('');
    try {
      await api.post('/auth/send-otp', { phone: fpPhone, checkExists: true });
      setFpStep(2); setFpTimer(60);
    } catch (err) {
      setFpError(err.response?.data?.message || 'No account found with this phone number.');
    } finally { setFpLoading(false); }
  };

  const handleFpVerifyOtp = () => {
    // Don't call the API here — verify_only would delete the OTP from DB,
    // then resetPassword (step 3) would find nothing. Verify OTP atomically
    // in the final reset call instead.
    const err = v.otp(fpOtp);
    if (err) { setFpError(err); return; }
    setFpError('');
    setFpStep(3);
  };

  const handleFpReset = async () => {
    const pwErr = v.password(fpNewPass);
    if (pwErr) { setFpError(pwErr); return; }
    if (fpNewPass !== fpConfirm) { setFpError('Passwords do not match.'); return; }
    setFpLoading(true); setFpError('');
    try {
      await api.post('/auth/reset-password', { phone: fpPhone, otp: fpOtp, newPassword: fpNewPass });
      setShowForgotModal(false);
      setLoginMethod('password');
      setIdentifier(fpPhone);
      toast.success('Password reset successfully! Please log in with your new password.');
    } catch (err) {
      setFpError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally { setFpLoading(false); }
  };

  const handleSendOtp = async () => {
    const err = v.phone(identifier);
    if (err) { setLoginError(err); return; }
    setLoginError('');
    try {
      setLoading(true);
      const response = await api.post('/auth/send-otp', { 
        phone: identifier,
        checkExists: true // Tell backend to verify user exists
      });
      if (response.data.success) {
        setOtpSent(true);
        setTimer(60); // Start 60s timer
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.notExists) {
        setShowSignupModal(true);
      } else if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const err = v.otp(otp);
    if (err) { setLoginError(err); return; }
    setLoginError('');
    
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        phone: identifier,
        otp: otp,
        role: 'user'
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        onLoginSuccess(user, token);
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginMethod === 'otp') {
       handleVerifyOtp(e);
    } else {
      const idErr = identifier.includes('@') ? v.email(identifier) : v.phone(identifier);
      if (idErr) { setLoginError(idErr); return; }
      if (!password) { setLoginError('Password is required.'); return; }
      setLoginError('');
      try {
        setLoading(true);
        const response = await api.post('/auth/login', {
          identifier,
          password,
          role: 'user'
        });
        if (response.data.success) {
          const { token, user } = response.data;
          onLoginSuccess(user, token);
        }
      } catch (error) {
        const code = error.response?.data?.code;
        if (code === 'NOT_REGISTERED') {
          setShowSignupModal(true);
        } else if (code === 'NO_PASSWORD') {
          setShowOtpOnlyModal(true);
        } else if (error.response?.status === 403 && code === 'ACCOUNT_INACTIVE') {
          setShowInactiveModal(true);
        } else {
          toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', backgroundColor: '#edeef5', display: 'flex', flexDirection: 'column', maxWidth: '430px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}
    >

      {/* ── HEADER: full-width white bar ── */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{ backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', padding: '18px 20px', position: 'relative', borderBottom: '1px solid #dde1f0' }}
      >
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#2336b0', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <ArrowLeft size={26} strokeWidth={2} />
        </button>
        <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: '20px', fontWeight: '600', color: '#2336b0', pointerEvents: 'none' }}>
          Customer Login
        </span>
      </motion.div>

      {/* ── CONTENT ── */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ flex: 1, padding: '0 28px', backgroundColor: '#edeef5' }}
      >

        {/* Welcome text */}
        <motion.div variants={fadeInUp} style={{ textAlign: 'center', paddingTop: '52px', paddingBottom: '44px' }}>
          <div style={{ fontSize: '30px', fontWeight: '600', color: '#1b2c7a', lineHeight: 1.2, marginBottom: '10px', trackingTight: '-0.02em' }}>
            Welcome Back!
          </div>
          <div style={{ fontSize: '17px', fontWeight: '500', color: '#5468b8' }}>
            Sign in to your account to continue
          </div>
        </motion.div>

        {/* Method Switcher Tabs */}
        <motion.div variants={fadeInUp} style={{ 
          display: 'flex', 
          backgroundColor: '#e2e5f5', 
          borderRadius: '12px', 
          padding: '4px', 
          marginBottom: '28px',
          marginTop: '10px'
        }}>
          <button 
            type="button"
            onClick={() => { setLoginMethod('otp'); setOtpSent(false); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '10px', 
              border: 'none', 
              backgroundColor: loginMethod === 'otp' ? '#ffffff' : 'transparent',
              color: loginMethod === 'otp' ? '#2334b2' : '#6b79b0',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: loginMethod === 'otp' ? '0 2px 8px rgba(35, 52, 178, 0.1)' : 'none'
            }}
          >
            OTP Login
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '10px', 
              border: 'none', 
              backgroundColor: loginMethod === 'password' ? '#ffffff' : 'transparent',
              color: loginMethod === 'password' ? '#2334b2' : '#6b79b0',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: loginMethod === 'password' ? '0 2px 8px rgba(35, 52, 178, 0.1)' : 'none'
            }}
          >
            Password
          </button>
        </motion.div>

        <form onSubmit={handleLogin}>
          {/* Identity/Identifier input */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              {loginMethod === 'otp' ? <Phone size={22} strokeWidth={1.8} /> : (identifier.includes('@') ? <Mail size={22} strokeWidth={1.8} /> : <User size={22} strokeWidth={1.8} />)}
            </span>
            <input
              type={loginMethod === 'otp' ? 'tel' : 'text'}
              placeholder={loginMethod === 'otp' ? "Phone Number" : "Email or Phone Number"}
              required
              value={identifier}
              maxLength={loginMethod === 'otp' ? 10 : undefined}
              onChange={e => {
                const val = loginMethod === 'otp' ? sanitize.phone(e.target.value) : e.target.value;
                setIdentifier(val);
                setLoginError('');
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                border: '1.5px solid #dde1f0',
                borderRadius: '12px',
                padding: loginMethod === 'otp' && !otpSent ? '18px 100px 18px 54px' : '18px 18px 18px 54px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1b2c7a',
                outline: 'none',
              }}
            />
            {loginMethod === 'otp' && !otpSent && identifier.length === 10 && (
              <button
                type="button"
                onClick={handleSendOtp}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#2334b2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Send OTP
              </button>
            )}
          </motion.div>

          {loginError && (
            <p style={{ fontSize: '13px', color: '#e11d48', fontWeight: '600', marginTop: '-12px', marginBottom: '12px' }}>{loginError}</p>
          )}

          {/* OTP input or Password input */}
          {loginMethod === 'otp' && otpSent && (
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
              <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={22} strokeWidth={1.8} />
              </span>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(sanitize.otp(e.target.value)); setLoginError(''); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #dde1f0',
                  borderRadius: '12px',
                  padding: '18px 18px 18px 54px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1b2c7a',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3b52d4', fontSize: '13px', fontWeight: '600' }}
              >
                Edit Number
              </button>
            </motion.div>
          )}

          {/* Resend OTP Timer */}
          {loginMethod === 'otp' && otpSent && (
            <motion.div variants={fadeInUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px', marginTop: '-10px', paddingRight: '4px' }}>
              {timer > 0 ? (
                <span style={{ fontSize: '14px', color: '#8898cc', fontWeight: '500' }}>
                  Resend OTP in <span style={{ color: '#1b2c7a', fontWeight: '600' }}>00:{timer < 10 ? `0${timer}` : timer}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#2334b2',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  Resend OTP
                </button>
              )}
            </motion.div>
          )}

          {loginMethod === 'password' && (
            <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '10px' }}>
              <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={22} strokeWidth={1.8} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #dde1f0',
                  borderRadius: '12px',
                  padding: '18px 54px 18px 54px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1b2c7a',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3b52d4', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={24} strokeWidth={2} /> : <Eye size={24} strokeWidth={2} />}
              </button>
            </motion.div>
          )}

          {/* Forgot Password */}
          {loginMethod === 'password' && (
            <motion.div variants={fadeInUp} style={{ textAlign: 'right', marginBottom: '28px', marginTop: '8px' }}>
              <button type="button" onClick={openForgotModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#1b2c7a' }}>
                Forgot Password?
              </button>
            </motion.div>
          )}

          {/* Sign In button */}
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || (loginMethod === 'otp' && !otpSent)}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: (loading || (loginMethod === 'otp' && !otpSent)) ? '#a0a8e0' : '#2334b2',
              border: 'none',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '700',
              cursor: (loading || (loginMethod === 'otp' && !otpSent)) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || (loginMethod === 'otp' && !otpSent)) ? 'none' : '0 6px 0 #182489',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '0.01em',
              transition: 'all 0.1s',
              marginTop: loginMethod === 'otp' ? '20px' : '0'
            }}
            onMouseDown={e => { if(!loading && !(loginMethod === 'otp' && !otpSent)) { e.currentTarget.style.boxShadow = '0 2px 0 #182489'; e.currentTarget.style.transform = 'translateY(4px)'; } }}
            onMouseUp={e => { if(!loading && !(loginMethod === 'otp' && !otpSent)) { e.currentTarget.style.boxShadow = '0 6px 0 #182489'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : 'Sign In'}
          </motion.button>
        </form>

        {/* OR divider */}
        <motion.div 
          variants={fadeInUp}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '36px 12px' }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#cdd1e8' }} />
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#8898cc' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#cdd1e8' }} />
        </motion.div>

        {/* Sign Up link */}
        <motion.div variants={fadeInUp} style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <span style={{ fontSize: '17px', fontWeight: '500', color: '#8898cc' }}>Don't have an account? </span>
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', fontWeight: '600', color: '#1b2c7a', marginLeft: '4px' }}
          >
            Sign Up
          </button>
        </motion.div>
      </motion.div>

      {/* ── SIGNUP INVITATION MODAL ── */}
      {showSignupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(27, 44, 122, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '360px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              backgroundColor: '#f0f3ff', 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              color: '#2334b2'
            }}>
              <User size={32} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b2c7a', marginBottom: '12px' }}>
              Account Not Found
            </div>
            <div style={{ fontSize: '15px', color: '#5468b8', lineHeight: 1.5, marginBottom: '28px' }}>
              Oops! We couldn't find an account with <strong>{identifier}</strong>. Would you like to create a new account?
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => navigate('/signup', { state: { phone: identifier } })}
                style={{
                  padding: '16px',
                  backgroundColor: '#2334b2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #182489'
                }}
              >
                Yes, Sign Up Now
              </button>
              <button
                onClick={() => { setShowSignupModal(false); setIdentifier(''); }}
                style={{
                  padding: '16px',
                  backgroundColor: '#f0f3ff',
                  color: '#2334b2',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── OTP ONLY MODAL ── */}
      {showOtpOnlyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(27, 44, 122, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px',
              width: '100%', maxWidth: '360px', textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ backgroundColor: '#fff7ed', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f97316' }}>
              <Phone size={32} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b2c7a', marginBottom: '12px' }}>Use OTP Login</div>
            <div style={{ fontSize: '15px', color: '#5468b8', lineHeight: 1.5, marginBottom: '28px' }}>
              This account was registered using OTP and doesn't have a password set. Please use <strong>OTP Login</strong> to sign in.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => { setShowOtpOnlyModal(false); setLoginMethod('otp'); }}
                style={{ padding: '16px', backgroundColor: '#2334b2', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 0 #182489' }}
              >
                Switch to OTP Login
              </button>
              <button
                onClick={() => setShowOtpOnlyModal(false)}
                style={{ padding: '16px', backgroundColor: '#f0f3ff', color: '#2334b2', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,44,122,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b2c7a' }}>
                  {fpStep === 1 ? 'Forgot Password' : fpStep === 2 ? 'Verify OTP' : 'Set New Password'}
                </div>
                <div style={{ fontSize: '13px', color: '#8898cc', marginTop: '4px' }}>
                  {fpStep === 1 ? 'Enter your registered phone number' : fpStep === 2 ? `OTP sent to +91 ${fpPhone}` : 'Choose a strong new password'}
                </div>
              </div>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc', display: 'flex' }}>
                <X size={22} />
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex: 1, height: '3px', borderRadius: '9px', backgroundColor: fpStep >= s ? '#2334b2' : '#e2e5f5', transition: 'background-color 0.3s' }} />
              ))}
            </div>

            {fpError && (
              <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: '#e11d48', marginBottom: '16px', fontWeight: '500' }}>
                {fpError}
              </div>
            )}

            {fpStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex' }}>
                    <Phone size={20} strokeWidth={1.8} />
                  </span>
                  <input type="tel" placeholder="10-digit phone number" maxLength={10}
                    value={fpPhone} onChange={e => setFpPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', border: '1.5px solid #dde1f0', borderRadius: '12px', fontSize: '16px', fontWeight: '500', color: '#1b2c7a', outline: 'none', backgroundColor: '#f8f9ff' }}
                  />
                </div>
                <button onClick={handleFpSendOtp} disabled={fpPhone.length !== 10 || fpLoading}
                  style={{ padding: '16px', backgroundColor: fpPhone.length === 10 ? '#2334b2' : '#a0a8e0', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: fpPhone.length === 10 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {fpLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send OTP'}
                </button>
              </div>
            )}

            {fpStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex' }}>
                    <ShieldCheck size={20} strokeWidth={1.8} />
                  </span>
                  <input type="text" placeholder="6-digit OTP" maxLength={6}
                    value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', border: '1.5px solid #dde1f0', borderRadius: '12px', fontSize: '16px', fontWeight: '500', color: '#1b2c7a', outline: 'none', backgroundColor: '#f8f9ff', letterSpacing: '0.1em' }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  {fpTimer > 0 ? (
                    <span style={{ color: '#8898cc' }}>Resend in <strong style={{ color: '#1b2c7a' }}>00:{fpTimer < 10 ? `0${fpTimer}` : fpTimer}</strong></span>
                  ) : (
                    <button type="button" onClick={handleFpSendOtp} style={{ background: 'none', border: 'none', color: '#2334b2', fontWeight: '600', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                      Resend OTP
                    </button>
                  )}
                </div>
                <button onClick={handleFpVerifyOtp} disabled={fpOtp.length !== 6}
                  style={{ padding: '16px', backgroundColor: fpOtp.length === 6 ? '#2334b2' : '#a0a8e0', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: fpOtp.length === 6 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continue
                </button>
              </div>
            )}

            {fpStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex' }}>
                    <Lock size={20} strokeWidth={1.8} />
                  </span>
                  <input type={fpShowPass ? 'text' : 'password'} placeholder="New password (min 8 chars)"
                    value={fpNewPass} onChange={e => setFpNewPass(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 48px 16px 48px', border: '1.5px solid #dde1f0', borderRadius: '12px', fontSize: '16px', fontWeight: '500', color: '#1b2c7a', outline: 'none', backgroundColor: '#f8f9ff' }}
                  />
                  <button type="button" onClick={() => setFpShowPass(v => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc', display: 'flex' }}>
                    {fpShowPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex' }}>
                    <Lock size={20} strokeWidth={1.8} />
                  </span>
                  <input type={fpShowPass ? 'text' : 'password'} placeholder="Confirm new password"
                    value={fpConfirm} onChange={e => setFpConfirm(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', border: fpConfirm && fpNewPass !== fpConfirm ? '1.5px solid #f87171' : '1.5px solid #dde1f0', borderRadius: '12px', fontSize: '16px', fontWeight: '500', color: '#1b2c7a', outline: 'none', backgroundColor: fpConfirm && fpNewPass !== fpConfirm ? '#fff8f8' : '#f8f9ff' }}
                  />
                </div>
                {fpConfirm && fpNewPass !== fpConfirm && (
                  <p style={{ fontSize: '12px', color: '#e11d48', fontWeight: '600', marginTop: '-8px' }}>Passwords do not match</p>
                )}
                <button onClick={handleFpReset} disabled={!fpNewPass || !fpConfirm || fpLoading}
                  style={{ padding: '16px', backgroundColor: fpNewPass && fpConfirm ? '#2334b2' : '#a0a8e0', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: fpNewPass && fpConfirm ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: fpNewPass && fpConfirm ? '0 4px 0 #182489' : 'none' }}>
                  {fpLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Reset Password'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── ACCOUNT INACTIVE MODAL ── */}
      {showInactiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(27, 44, 122, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px',
              width: '100%', maxWidth: '360px', textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ backgroundColor: '#fff1f2', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#e11d48' }}>
              <Lock size={32} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1b2c7a', marginBottom: '12px' }}>Account Inactive</div>
            <div style={{ fontSize: '15px', color: '#5468b8', lineHeight: 1.5, marginBottom: '28px' }}>
              Your account has been deactivated by the administrator. Please contact support for more information.
            </div>
            <button
              onClick={() => { setShowInactiveModal(false); setIdentifier(''); setOtpSent(false); }}
              style={{ padding: '16px', backgroundColor: '#e11d48', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 0 #be123c', width: '100%' }}
            >
              Okay
            </button>
          </motion.div>
        </div>
      )}
      {/* ── TERMS OF SERVICE MODAL ── */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,44,122,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: '430px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1b2c7a' }}>Terms of Service</h2>
              <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc' }}><X size={22} /></button>
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
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>5. Payments & Orders</p>
              <p style={{ marginBottom: '16px' }}>All transactions are between buyers and sellers. Basera Bazar facilitates connections but is not a party to any transaction. Payment disputes must be resolved between the parties.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>6. Termination</p>
              <p style={{ marginBottom: '16px' }}>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>7. Changes to Terms</p>
              <p style={{ marginBottom: '24px' }}>We may update these terms from time to time. Continued use of the platform constitutes acceptance of the updated terms.</p>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,44,122,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px', width: '100%', maxWidth: '430px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1b2c7a' }}>Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8898cc' }}><X size={22} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, fontSize: '14px', color: '#4a567a', lineHeight: 1.7 }}>
              <p style={{ marginBottom: '16px', color: '#1b2c7a', fontWeight: '600' }}>Last updated: January 2025</p>
              <p style={{ marginBottom: '16px' }}>Basera Bazar values your privacy. This policy explains what data we collect and how we use it.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>1. Information We Collect</p>
              <p style={{ marginBottom: '16px' }}>We collect your name, phone number, email address, and location when you register or use our services. We also collect usage data to improve the platform.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>2. How We Use Your Data</p>
              <p style={{ marginBottom: '16px' }}>Your data is used to provide and improve our services, send relevant notifications, and connect you with the right businesses in your area.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>3. Data Sharing</p>
              <p style={{ marginBottom: '16px' }}>We do not sell your personal data. Your contact details are shared with partners only when you make an enquiry or place an order, and only to the extent necessary.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>4. Push Notifications</p>
              <p style={{ marginBottom: '16px' }}>With your permission, we send push notifications for order updates, new listings, and promotions. You can opt out at any time from your device settings.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>5. Data Security</p>
              <p style={{ marginBottom: '16px' }}>We use industry-standard encryption and security practices to protect your data. However, no system is 100% secure and we cannot guarantee absolute security.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>6. Your Rights</p>
              <p style={{ marginBottom: '16px' }}>You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com.</p>
              <p style={{ fontWeight: '600', color: '#1b2c7a', marginBottom: '8px' }}>7. Cookies</p>
              <p style={{ marginBottom: '24px' }}>We use session cookies for authentication. No third-party tracking cookies are used.</p>
              <p>For questions, contact us at <strong>support@baserabazar.com</strong></p>
            </div>
            <button onClick={() => setShowPrivacy(false)}
              style={{ marginTop: '20px', padding: '16px', backgroundColor: '#2334b2', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
              I Understand
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
