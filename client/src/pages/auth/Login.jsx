import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, Phone, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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

  // Timer Countdown Logic
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (identifier.length !== 10) return;
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
        alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        phone: identifier,
        otp: otp,
        role: 'user'
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        login(user, token);
        navigate('/');
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        alert(error.response?.data?.message || 'Invalid OTP. Please try again.');
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
      if (!identifier || !password) return;
      try {
        setLoading(true);
        const response = await api.post('/auth/login', {
          identifier,
          password,
          role: 'user'
        });
        if (response.data.success) {
          const { token, user } = response.data;
          login(user, token);
          navigate('/');
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
          alert(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
              onChange={e => setIdentifier(e.target.value)}
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
                onChange={e => setOtp(e.target.value)}
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
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#1b2c7a' }}>
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
    </motion.div>
  );
}
