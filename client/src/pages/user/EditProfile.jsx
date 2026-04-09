import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff,
  Loader2, CheckCircle2, ShieldCheck, Key, Smartphone, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Small inline toast/status message
function StatusMsg({ type, message }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={cn(
      'flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold',
      isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
    )}>
      {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

const EditProfile = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Section 1: Basic Info ────────────────────────────────────────────────
  const [basicInfo, setBasicInfo] = useState({ name: user?.name || '', email: user?.email || '' });
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [basicStatus, setBasicStatus] = useState(null); // { type, message }

  // ── Section 2: Phone Update ──────────────────────────────────────────────
  const [newPhone, setNewPhone] = useState('');
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState(null);

  // ── Section 3: Password ──────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passStatus, setPassStatus] = useState(null);

  if (!isAuthenticated) return null;

  // ── Save Basic Info (name + email) ─────────────────────────────────────
  const handleUpdateBasic = async (e) => {
    e.preventDefault();
    setIsSavingBasic(true);
    setBasicStatus(null);
    try {
      const response = await api.put('/auth/profile', {
        name: basicInfo.name.trim(),
        email: basicInfo.email.trim().toLowerCase(),
      });
      // Update the local auth context so the header/profile reflects changes instantly
      updateUser({ name: basicInfo.name.trim(), email: basicInfo.email.trim().toLowerCase() });
      setBasicStatus({ type: 'success', message: response.data.message || 'Profile updated successfully!' });
    } catch (error) {
      setBasicStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setIsSavingBasic(false);
    }
  };

  // ── Send OTP for Phone Update ──────────────────────────────────────────
  const handleSendOtp = async () => {
    if (newPhone.length !== 10) return;
    setVerifyingPhone(true);
    setPhoneStatus(null);
    try {
      await api.post('/auth/send-otp', { phone: newPhone });
      setShowOtpInput(true);
    } catch (error) {
      setPhoneStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send OTP.' });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // ── Verify OTP and Update Phone ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setVerifyingPhone(true);
    setPhoneStatus(null);
    try {
      // Verify OTP  
      await api.post('/auth/verify-otp', { phone: newPhone, otp, role: user.role || 'user', flow: 'login' });
      // Save new phone to backend
      await api.put('/auth/profile', { phone: newPhone });
      // Update local context
      updateUser({ phone: newPhone });
      setIsPhoneVerified(true);
      setShowOtpInput(false);
      setPhoneStatus({ type: 'success', message: 'Phone number updated successfully!' });
    } catch (error) {
      setPhoneStatus({ type: 'error', message: error.response?.data?.message || 'Invalid OTP. Please try again.' });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // ── Change Password ────────────────────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) return;
    if (passwords.next.length < 6) {
      setPassStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setIsSavingPass(true);
    setPassStatus(null);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPassStatus({ type: 'success', message: response.data.message || 'Password updated successfully!' });
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (error) {
      setPassStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update password.' });
    } finally {
      setIsSavingPass(false);
    }
  };

  const inputClass = 'w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#1f2355] focus:bg-white transition-all font-semibold text-[#1f2355] placeholder:text-slate-400 text-[15px]';
  const labelClass = 'text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block';
  const iconClass = 'absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400';

  const hasBasicChanges = basicInfo.name !== user.name || basicInfo.email !== user.email;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans mb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-[#1f2355]">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow">
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#fa8639]">Settings</h1>
          <h2 className="text-xl font-bold text-[#1f2355] tracking-tight">Edit Profile</h2>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-md mx-auto w-full overflow-x-hidden">

        {/* ── SECTION 1: Basic Information ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#1f2355]">
              <User size={20} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1f2355]">Basic Information</h3>
          </div>

          <form onSubmit={handleUpdateBasic} className="space-y-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <div className={iconClass}><User size={18} /></div>
                <input
                  type="text" value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  className={inputClass} placeholder="Enter full name" required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <div className={iconClass}><Mail size={18} /></div>
                <input
                  type="email" value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  className={inputClass} placeholder="Enter email address" required
                />
              </div>
            </div>

            <StatusMsg type={basicStatus?.type} message={basicStatus?.message} />

            <button
              type="submit"
              disabled={isSavingBasic || !hasBasicChanges}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2',
                (isSavingBasic || !hasBasicChanges)
                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                  : 'bg-[#1f2355] text-white shadow-lg shadow-slate-200 active:scale-[0.98]'
              )}
            >
              {isSavingBasic ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* ── SECTION 2: Update Phone ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Smartphone size={20} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1f2355]">Update Phone</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1f2355] border border-slate-100">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Current Number</span>
                  <span className="text-[14px] font-extrabold text-[#1f2355]">{user.phone}</span>
                </div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>

            <div className="space-y-5 pt-2">
              <div>
                <label className={labelClass}>New Phone Number</label>
                <div className="relative">
                  <div className={iconClass}><Smartphone size={18} /></div>
                  <input
                    type="tel" maxLength={10}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={isPhoneVerified || showOtpInput}
                    className={cn(inputClass, isPhoneVerified && 'bg-emerald-50 border-emerald-100 text-emerald-600')}
                    placeholder="Enter new 10-digit number"
                  />
                  {!isPhoneVerified && newPhone.length === 10 && !showOtpInput && (
                    <button
                      type="button" onClick={handleSendOtp}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#fa8639] text-white px-4 py-2 rounded-xl text-[12px] font-bold shadow-md shadow-orange-200"
                    >
                      {verifyingPhone ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showOtpInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <label className={labelClass}>Verification Code (6-digit OTP)</label>
                    <div className="relative">
                      <div className={iconClass}><ShieldCheck size={18} className="text-[#1f2355]" /></div>
                      <input
                        type="text" maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className={inputClass} placeholder="Enter 6-digit OTP"
                      />
                      <button
                        type="button" onClick={handleVerifyOtp}
                        disabled={otp.length !== 6 || verifyingPhone}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1f2355] text-white px-4 py-2 rounded-xl text-[12px] font-bold disabled:opacity-50"
                      >
                        {verifyingPhone ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <StatusMsg type={phoneStatus?.type} message={phoneStatus?.message} />

              {isPhoneVerified && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <div>
                    <p className="text-[14px] font-bold text-emerald-700">Phone Updated!</p>
                    <p className="text-[12px] text-emerald-600">Your number has been saved to the database.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 3: Change Password ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#fa8639]">
              <Key size={20} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1f2355]">Change Password</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className={labelClass}>Current Password</label>
              <div className="relative">
                <div className={iconClass}><Lock size={18} /></div>
                <input
                  type={showPass.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={inputClass} placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, current: !showPass.current })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {showPass.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-2" />

            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <div className={iconClass}><Lock size={18} className="text-[#fa8639]" /></div>
                <input
                  type={showPass.next ? 'text' : 'password'}
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  className={inputClass} placeholder="Min. 6 characters" required
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, next: !showPass.next })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {showPass.next ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <div className="relative">
                <div className={iconClass}><ShieldCheck size={18} className="text-[#fa8639]" /></div>
                <input
                  type={showPass.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={cn(inputClass, passwords.confirm && passwords.next !== passwords.confirm && 'border-red-200 bg-red-50 text-red-600')}
                  placeholder="Re-type new password" required
                />
                <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {showPass.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwords.confirm && passwords.next !== passwords.confirm && (
                <p className="text-[11px] font-bold text-red-500 mt-2 pl-1">Passwords do not match</p>
              )}
            </div>

            <StatusMsg type={passStatus?.type} message={passStatus?.message} />

            <button
              type="submit"
              disabled={isSavingPass || !passwords.current || !passwords.next || passwords.next !== passwords.confirm}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2',
                (isSavingPass || !passwords.current || !passwords.next || passwords.next !== passwords.confirm)
                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                  : 'bg-[#fa8639] text-white shadow-lg shadow-orange-200 active:scale-[0.98]'
              )}
            >
              {isSavingPass ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
