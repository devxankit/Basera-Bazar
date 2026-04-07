import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#edeef5', display: 'flex', flexDirection: 'column', maxWidth: '430px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── HEADER: full-width white bar ── */}
      <div style={{ backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', padding: '18px 20px', position: 'relative' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#2336b0', display: 'flex', alignItems: 'center', position: 'relative', z_index: 2 }}>
          <ArrowLeft size={26} strokeWidth={2} />
        </button>
        <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: '20px', fontWeight: '600', color: '#2336b0', pointerEvents: 'none' }}>
          Customer Login
        </span>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: '0 28px', backgroundColor: '#edeef5' }}>

        {/* Welcome text */}
        <div style={{ textAlign: 'center', paddingTop: '52px', paddingBottom: '44px' }}>
          <div style={{ fontSize: '30px', fontWeight: '600', color: '#1b2c7a', lineHeight: 1.2, marginBottom: '10px', trackingTight: '-0.02em' }}>
            Welcome Back!
          </div>
          <div style={{ fontSize: '17px', fontWeight: '500', color: '#5468b8' }}>
            Sign in to your account to continue
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email input */}
          <div style={{ position: 'relative', marginBottom: '18px' }}>
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
          </div>

          {/* Password input */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
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
          </div>

          {/* Forgot Password */}
          <div style={{ textAlign: 'right', marginBottom: '28px', marginTop: '8px' }}>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#1b2c7a' }}>
              Forgot Password?
            </button>
          </div>

          {/* Sign In button — deep navy with bottom shadow for embossed look */}
          <button
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
            {loading ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
          </button>
        </form>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '36px 12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#cdd1e8' }} />
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#8898cc' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#cdd1e8' }} />
        </div>

        {/* Sign Up link */}
        <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <span style={{ fontSize: '17px', fontWeight: '500', color: '#8898cc' }}>Don't have an account? </span>
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', fontWeight: '600', color: '#1b2c7a', marginLeft: '4px' }}
          >
            Sign Up
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
