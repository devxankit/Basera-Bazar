import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const handleBack = () => { window.history.length > 2 ? navigate(-1) : navigate('/'); };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/'); }, 1500);
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

        <form onSubmit={handleLogin}>
          {/* Email input */}
          <motion.div variants={fadeInUp} style={{ position: 'relative', marginBottom: '18px' }}>
            <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4a567a', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Mail size={22} strokeWidth={1.8} />
            </span>
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
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
              }}
            />
          </motion.div>

          {/* Password input */}
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
                borderRadius: '14px',
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

          {/* Forgot Password */}
          <motion.div variants={fadeInUp} style={{ textAlign: 'right', marginBottom: '28px', marginTop: '8px' }}>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#1b2c7a' }}>
              Forgot Password?
            </button>
          </motion.div>

          {/* Sign In button */}
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
              letterSpacing: '0.01em',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = '0 2px 0 #182489'; e.currentTarget.style.transform = 'translateY(4px)'; }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 6px 0 #182489'; e.currentTarget.style.transform = 'translateY(0)'; }}
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
    </motion.div>
  );
}
