import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignUp() {
  const navigate = useNavigate();
  const handleBack = () => { window.history.length > 2 ? navigate(-1) : navigate('/'); };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });

  const handleSignUp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/'); }, 1500);
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    border: '1.5px solid #dde1f0',
    borderRadius: '14px',
    padding: '18px 18px 18px 54px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1b2c7a',
    outline: 'none',
  };

  const iconStyle = {
    position: 'absolute',
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#4a567a',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
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
        staggerChildren: 0.08
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', backgroundColor: '#edeef5', display: 'flex', flexDirection: 'column', maxWidth: '430px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}
    >

      {/* ── HEADER ── */}
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
          Create Account
        </span>
      </motion.div>

      {/* ── CONTENT ── */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ flex: 1, padding: '0 28px', backgroundColor: '#edeef5', overflowY: 'auto' }}
      >

        {/* Welcome text */}
        <motion.div variants={fadeInUp} style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '36px' }}>
          <div style={{ fontSize: '30px', fontWeight: '600', color: '#1b2c7a', lineHeight: 1.2, marginBottom: '10px', trackingTight: '-0.02em' }}>
            Get Started!
          </div>
          <div style={{ fontSize: '17px', fontWeight: '500', color: '#5468b8', lineHeight: 1.4, padding: '0 16px' }}>
            Join BaseraBazar to find your dream property
          </div>
        </motion.div>

        <form onSubmit={handleSignUp}>

          {/* Full Name */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={iconStyle}><User size={22} strokeWidth={1.8} /></span>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              style={inputStyle}
            />
          </motion.div>

          {/* Email */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={iconStyle}><Mail size={22} strokeWidth={1.8} /></span>
            <input
              type="email"
              placeholder="Email Address"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </motion.div>

          {/* Phone */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={iconStyle}><Phone size={22} strokeWidth={1.8} /></span>
            <input
              type="tel"
              placeholder="Phone Number"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '10px' }}>
            <span style={iconStyle}><Lock size={22} strokeWidth={1.8} /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ ...inputStyle, paddingRight: '54px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
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

          {/* Create Account button */}
          <motion.button
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: '#2334b2',
              border: 'none',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 0 #182489',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = '0 2px 0 #182489'; e.currentTarget.style.transform = 'translateY(4px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 6px 0 #182489'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : 'Create Account'}
          </motion.button>
        </form>

        {/* Log In link */}
        <motion.div variants={fadeInUp} style={{ textAlign: 'center', padding: '36px 0 48px' }}>
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
  );
}
