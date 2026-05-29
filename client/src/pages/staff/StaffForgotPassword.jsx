import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, ArrowLeft, Key, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';
import TestingModeBanner from '../../components/common/TestingModeBanner';

export default function StaffForgotPassword() {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP & New Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) return toast.error('Valid phone number required.');
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/staff/forgot-password', { phone });
      if (data.success) {
        toast.success('OTP sent successfully.');
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('OTP and new password are required.');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(newPassword)) return toast.error('Password must contain at least one uppercase letter.');
    if (!/[0-9]/.test(newPassword)) return toast.error('Password must contain at least one number.');
    if (!/[^A-Za-z0-9]/.test(newPassword)) return toast.error('Password must contain at least one special character (e.g. @, #, !).');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/staff/reset-password', {
        phone,
        otp,
        new_password: newPassword
      });
      if (data.success) {
        toast.success('Password reset successfully!');
        navigate('/staff/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button 
          onClick={() => navigate('/staff/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-indigo-600 mb-4 shadow-lg shadow-indigo-100">
            <Key size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1">Recover your BaseraBazar staff account</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <TestingModeBanner />
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Enter your registered phone number. We'll send you a 6-digit OTP to verify your identity.</p>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white placeholder-slate-300"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle size={16} />
                <p className="text-[11px] font-bold">OTP SENT TO +91 {phone}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Didn't receive OTP? Try again
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
