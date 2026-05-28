import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, Phone, Bell, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/baseralogo.png';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { registerFCMToken } from '../../services/pushNotificationService';
import { v, sanitize } from '../../utils/validators';
import toast from '../../mockToast';
import TestingModeBanner from '../../components/common/TestingModeBanner';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = location.state?.redirectTo || '/partner/home';

  // Auth method
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'

  // OTP flow
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  // Password flow
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showOtpOnlyModal, setShowOtpOnlyModal] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // ── Post-login flow ──
  const onLoginSuccess = async (user, token) => {
    login(user, token);
    localStorage.setItem('baserabazar_partner_role', user.role);
    if (Notification.permission === 'default') {
      setShowNotificationPrompt(true);
      return;
    }
    registerFCMToken(true);
    navigate(redirectTo);
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') registerFCMToken(true);
    } catch (err) {
    } finally {
      setShowNotificationPrompt(false);
      navigate(redirectTo);
    }
  };

  // ── Timer Countdown ──
  React.useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // ── OTP Handlers ──
  const handleSendOtp = async () => {
    const err = v.phone(phone);
    if (err) { toast.error(err); return; }
    try {
      setLoading(true);
      const res = await api.post('/auth/send-otp', { phone, checkExists: true, role: 'partner' });
      if (res.data.success) { setOtpSent(true); setTimer(60); }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.notExists) setShowSignupModal(true);
      else if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_INACTIVE') setShowInactiveModal(true);
      else toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const err = v.otp(otp);
    if (err) { toast.error(err); return; }
    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', { phone, otp, role: 'partner' });
      if (res.data.success) onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_INACTIVE') setShowInactiveModal(true);
      else toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password Handler ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const idErr = identifier.includes('@') ? v.email(identifier) : v.phone(identifier);
    if (idErr) { toast.error(idErr); return; }
    if (!password) { toast.error('Password is required.'); return; }
    setLoginError('');
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { identifier, password, role: 'partner' });
      if (res.data.success) onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'NOT_REGISTERED') setShowSignupModal(true);
      else if (code === 'NO_PASSWORD') setShowOtpOnlyModal(true);
      else if (err.response?.status === 403 && code === 'ACCOUNT_INACTIVE') setShowInactiveModal(true);
      else toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (loginMethod === 'otp') handleVerifyOtp(e);
    else handlePasswordLogin(e);
  };

  const switchMethod = (method) => {
    setLoginMethod(method);
    setOtpSent(false);
    setOtp('');
    setPhone('');
    setIdentifier('');
    setPassword('');
  };

  // ── Styles ──
  const brand = '#001b4e';
  const accent = '#f97316';
  const inputBase = {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px 18px 18px 54px',
    fontSize: '16px',
    fontWeight: '500',
    color: brand,
    outline: 'none',
    transition: 'border 0.2s',
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white flex flex-col font-outfit">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex flex-col items-center pt-10 pb-6">
        <img src={logo} alt="Basera Bazar" className="h-16 object-contain mb-3" />
        <span className="text-[13px] font-bold tracking-[0.25em] uppercase" style={{ color: brand }}>Partner App</span>
        <div className="flex items-center gap-1.5 mt-1 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
          <span className="text-[10px]">🤝</span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accent }}>Verified Partner</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-8 pt-8 pb-12"
      >
        {/* Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: brand }}>Welcome Back!</h1>
          <p className="text-slate-500 text-[15px]">Login to your partner account</p>
        </div>

        {/* ── Method Switcher ── */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-7 gap-1">
          {['otp', 'password'].map(method => (
            <button
              key={method}
              type="button"
              onClick={() => switchMethod(method)}
              className="flex-1 py-3 rounded-lg text-[14px] font-bold transition-all"
              style={{
                background: loginMethod === method ? '#ffffff' : 'transparent',
                color: loginMethod === method ? brand : '#94a3b8',
                boxShadow: loginMethod === method ? '0 2px 8px rgba(0,27,78,0.08)' : 'none',
              }}
            >
              {method === 'otp' ? 'OTP Login' : 'Password'}
            </button>
          ))}
        </div>

        <TestingModeBanner />

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── OTP FLOW ── */}
          {loginMethod === 'otp' && (
            <>
              {/* Phone input */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <Phone size={20} />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Phone Number"
                  maxLength={10}
                  style={{ ...inputBase, paddingRight: phone.length === 10 && !otpSent ? '100px' : '18px' }}
                />
                {!otpSent && phone.length === 10 && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: brand, color: '#fff', border: 'none', borderRadius: 10,
                      padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {loading ? '...' : 'Send OTP'}
                  </button>
                )}
              </div>

              {/* OTP Input */}
              <AnimatePresence>
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ position: 'relative' }}
                  >
                    <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                      <Lock size={20} />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      autoFocus
                      style={{ ...inputBase, letterSpacing: '0.4em', fontSize: 20, fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: accent, fontSize: 13, fontWeight: 700 }}
                    >
                      Edit
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Resend timer */}
              {otpSent && (
                <div className="text-right pr-1">
                  {timer > 0 ? (
                    <span className="text-[13px] text-slate-400 font-medium">
                      Resend in <span className="font-bold" style={{ color: brand }}>00:{timer < 10 ? `0${timer}` : timer}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[13px] font-bold underline underline-offset-2"
                      style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── PASSWORD FLOW ── */}
          {loginMethod === 'password' && (
            <>
              {/* Identifier */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <User size={20} />
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Phone or Email"
                  style={inputBase}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <Lock size={20} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  style={{ ...inputBase, paddingRight: 54 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={loading || (loginMethod === 'otp' && !otpSent)}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-bold text-[16px] text-white mt-2 transition-all active:scale-95"
            style={{
              background: (loading || (loginMethod === 'otp' && !otpSent)) ? '#94a3b8' : brand,
              cursor: (loading || (loginMethod === 'otp' && !otpSent)) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || (loginMethod === 'otp' && !otpSent)) ? 'none' : `0 6px 0 #00112e`,
            }}
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-slate-300 text-[13px] font-bold tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-slate-500 text-[15px]">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/partner/register')}
              className="font-bold hover:underline"
              style={{ color: accent, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Become a Partner
            </button>
          </p>
        </div>
      </motion.div>

      {/* ══ MODALS ══ */}

      {/* Account Inactive */}
      {showInactiveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,27,78,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#fff1f2', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#e11d48' }}>
              <Lock size={32} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: brand, marginBottom: 12 }}>Account Inactive</div>
            <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5, marginBottom: 28 }}>Your partner account has been deactivated. Please contact support to resolve this.</div>
            <button onClick={() => { setShowInactiveModal(false); setPhone(''); setOtpSent(false); setIdentifier(''); }}
              style={{ width: '100%', padding: '14px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Okay
            </button>
          </motion.div>
        </div>
      )}

      {/* Account Not Found */}
      {showSignupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,27,78,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#f0f3ff', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: brand }}>
              <Phone size={32} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: brand, marginBottom: 12 }}>Account Not Found</div>
            <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5, marginBottom: 28 }}>
              We couldn't find a partner account with <strong>{phone || identifier}</strong>. Would you like to join as a partner?
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/partner/register', { state: { phone: phone || identifier } })}
                style={{ padding: '14px', background: brand, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Become a Partner
              </button>
              <button onClick={() => { setShowSignupModal(false); setPhone(''); setIdentifier(''); }}
                style={{ padding: '14px', background: '#f1f5f9', color: brand, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OTP Only — no password set */}
      {showOtpOnlyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,27,78,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#fff7ed', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: accent }}>
              <Phone size={32} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: brand, marginBottom: 12 }}>Use OTP Login</div>
            <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5, marginBottom: 28 }}>
              This account doesn't have a password set. Please use <strong>OTP Login</strong> to sign in.
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowOtpOnlyModal(false); switchMethod('otp'); }}
                style={{ padding: '14px', background: brand, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Switch to OTP Login
              </button>
              <button onClick={() => setShowOtpOnlyModal(false)}
                style={{ padding: '14px', background: '#f1f5f9', color: brand, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Permission */}
      <AnimatePresence>
        {showNotificationPrompt && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center px-6 bg-[#001b4e]/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2" style={{ background: accent }} />
              <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6" style={{ background: '#f0f3ff', color: brand }}>
                <Bell size={32} className="animate-bounce" />
              </div>
              <h3 className="text-[22px] font-black mb-3 tracking-tight uppercase" style={{ color: brand }}>Enable Notifications</h3>
              <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-8">
                Get instant updates about <strong>new orders</strong>, <strong>payments</strong>, and <strong>account alerts</strong>.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white transition-all"
                  style={{ background: brand }}
                >
                  Enable Notifications
                </button>
                <button
                  onClick={() => { setShowNotificationPrompt(false); navigate('/partner/home'); }}
                  className="w-full py-4 text-slate-400 font-black hover:text-slate-700 transition-all text-[11px] uppercase tracking-[0.2em]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
