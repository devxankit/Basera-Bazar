import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../../assets/baseralogo.png';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [timer, setTimer] = useState(0);
  const { login } = useAuth();

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
    if (phone.length !== 10) return;
    try {
      setLoading(true);
      const response = await api.post('/auth/send-otp', { 
        phone,
        checkExists: true // Ensure partner exists before sending OTP
      });
      if (response.data.success) {
        setOtpSent(true);
        setTimer(60);
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.notExists) {
        setShowSignupModal(true);
      } else if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        alert(error.response?.data?.message || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!otp) return;
    
    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp,
        role: 'partner'
      });
      
      if (response.data.success) {
        // Save to localStorage for 15+ days persistence
        localStorage.setItem('baserabazar_partner_role', response.data.user.role);
        localStorage.setItem('baserabazar_partner_data', JSON.stringify(response.data.user));
        
        login(response.data.user, response.data.token);
        navigate('/partner/home');
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        alert(error.response?.data?.message || 'Invalid OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-white flex flex-col items-center px-8 pt-12 max-w-md mx-auto font-sans">
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full"
      >
        {/* Logo Section */}
        <motion.div variants={fadeInUp} className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center">
            <img src={logo} alt="Basera Bazar" className="h-24 object-contain" />
            <div className="mt-2 flex flex-col items-center">
              <span className="text-[14px] font-bold text-[#001b4e] tracking-[0.25em] uppercase">Partner App</span>
              <div className="flex items-center gap-1.5 mt-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <span className="text-[12px]">🤝</span>
                <span className="text-[9px] font-bold text-[#f97316] uppercase tracking-wider">Verified Partner</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div variants={fadeInUp} className="text-center mb-10 mt-6">
          <h1 className="text-[32px] font-bold text-[#001b4e] mb-2 tracking-tight">Welcome Back!</h1>
          <p className="text-slate-500 text-[16px]">Login to your partner account</p>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={fadeInUp} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-[#001b4e] group-focus-within:bg-indigo-50 transition-colors">
              <Phone size={20} />
            </div>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              maxLength={10}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-16 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-400 outline-none focus:border-[#001b4e] focus:ring-4 focus:ring-indigo-50 transition-all"
            />
            {!otpSent && phone.length === 10 && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#f97316] hover:underline"
              >
                Send OTP
              </button>
            )}
          </motion.div>

          {otpSent && (
            <motion.div variants={fadeInUp} className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-[#001b4e] group-focus-within:bg-indigo-50 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                maxLength={6}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-16 pr-14 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-400 outline-none focus:border-[#001b4e] focus:ring-4 focus:ring-indigo-50 transition-all"
              />
            </motion.div>
          )}

          {/* Resend OTP Timer */}
          {otpSent && (
            <div className="flex justify-end px-1">
              {timer > 0 ? (
                <span className="text-[12px] font-medium text-slate-400">
                  Resend OTP in <span className="text-[#001b4e] font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[12px] font-bold text-[#f97316] hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          )}

          {/* Login Button */}
          <motion.button
            variants={fadeInUp}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#001b4e] text-white py-5 rounded-[20px] font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:bg-[#001b4e]/90 transition-all flex items-center justify-center mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Login'}
          </motion.button>
        </form>

        {/* Divider */}
        <motion.div 
          variants={fadeInUp}
          className="flex items-center gap-4 my-10 px-4"
        >
          <div className="flex-1 h-[1px] bg-slate-100" />
          <span className="text-slate-300 text-[13px] font-bold tracking-widest uppercase">OR</span>
          <div className="flex-1 h-[1px] bg-slate-100" />
        </motion.div>

        {/* Footer */}
        <motion.div variants={fadeInUp} className="text-center pb-12">
          <p className="text-slate-500 text-[15px]">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/partner/register')}
              className="text-[#f97316] font-bold hover:underline"
            >
              Become a Partner
            </button>
          </p>
        </motion.div>
      </motion.div>
      {/* ── ACCOUNT INACTIVE MODAL ── */}
      {showInactiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 27, 78, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyCenter: 'center',
          zIndex: 1000, padding: '20px'
        }} className="flex items-center justify-center">
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
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#001b4e', marginBottom: '12px' }}>Account Inactive</div>
            <div style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.5, marginBottom: '28px' }}>
              Your partner account has been deactivated by the administrator. Please contact support to resolve this.
            </div>
            <button
              onClick={() => { setShowInactiveModal(false); setPhone(''); setOtpSent(false); }}
              className="w-full py-4 bg-[#e11d48] text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
            >
              Okay
            </button>
          </motion.div>
        </div>
      )}

      {/* ── ACCOUNT NOT FOUND MODAL ── */}
      {showSignupModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 27, 78, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyCenter: 'center',
          zIndex: 1000, padding: '20px'
        }} className="flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px',
              width: '100%', maxWidth: '360px', textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ backgroundColor: '#f0f3ff', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#001b4e' }}>
              <Phone size={32} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#001b4e', marginBottom: '12px' }}>Account Not Found</div>
            <div style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.5, marginBottom: '28px' }}>
              We couldn't find a partner account with <strong>{phone}</strong>. Would you like to join as a partner?
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/partner/register', { state: { phone } })}
                className="w-full py-4 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
              >
                Become a Partner
              </button>
              <button
                onClick={() => { setShowSignupModal(false); setPhone(''); }}
                className="w-full py-4 bg-slate-100 text-[#001b4e] rounded-2xl font-bold text-[16px] active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
