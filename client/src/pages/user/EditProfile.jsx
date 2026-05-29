import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff,
  Loader2, CheckCircle2, ShieldCheck, Key, Smartphone, AlertCircle, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v, sanitize } from '../../utils/validators';
import useFormValidation from '../../hooks/useFormValidation';

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
  const [basicStatus, setBasicStatus] = useState(null); // { type, message }

  // ── Section 2: Phone Update ──────────────────────────────────────────────
  const [newPhone, setNewPhone] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState(null);

  // ── Section 0: Profile Photo ─────────────────────────────────────────────
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageStatus(null);
    try {
      const { compressImage } = await import('../../utils/imageUtils');
      const optimized = await compressImage(file);
      const formData = new FormData();
      formData.append('image', optimized);
      const uploadRes = await api.post('/upload', formData);
      if (uploadRes.data.success) {
        await api.put('/auth/profile', { profileImage: uploadRes.data.url });
        updateUser({ profileImage: uploadRes.data.url });
        setImageStatus({ type: 'success', message: 'Profile photo updated!' });
      }
    } catch (err) {
      setImageStatus({ type: 'error', message: err.response?.data?.message || 'Upload failed. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Section 3: Password ──────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [passStatus, setPassStatus] = useState(null);
  const { errors, validateAll, clearError, register } = useFormValidation();

  if (!isAuthenticated) return null;

  // ── Save Basic Info (name + email) ─────────────────────────────────────
  const updateBasicMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/profile', payload).then(r => r.data),
    onSuccess: (data) => {
      updateUser({ name: basicInfo.name.trim(), email: basicInfo.email.trim().toLowerCase() });
      setBasicStatus({ type: 'success', message: data.message || 'Profile updated successfully!' });
    },
    onError: (error) => {
      setBasicStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update profile.' });
    },
  });

  const handleUpdateBasic = (e) => {
    e.preventDefault();
    setBasicStatus(null);
    const ok = validateAll({
      name:  v.name(basicInfo.name),
      email: v.email(basicInfo.email),
    });
    if (!ok) return;
    updateBasicMutation.mutate({
      name: basicInfo.name.trim(),
      email: basicInfo.email.trim().toLowerCase(),
    });
  };

  const isSavingBasic = updateBasicMutation.isPending;

  // ── Send OTP for Phone Update ──────────────────────────────────────────
  const sendOtpMutation = useMutation({
    mutationFn: (phone) => api.post('/auth/send-otp', { phone }).then(r => r.data),
    onSuccess: () => { setShowOtpInput(true); setPhoneStatus(null); },
    onError: (error) => setPhoneStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send OTP.' }),
  });

  const handleSendOtp = () => {
    const err = v.phone(newPhone);
    if (err) { setPhoneStatus({ type: 'error', message: err }); return; }
    setPhoneStatus(null);
    sendOtpMutation.mutate(newPhone);
  };

  // ── Verify OTP and Update Phone ────────────────────────────────────────
  const verifyOtpMutation = useMutation({
    mutationFn: async (payload) => {
      await api.post('/auth/verify-otp', { phone: payload.phone, otp: payload.otp, role: user.role || 'user', flow: 'verify_only' });
      return api.put('/auth/profile', { phone: payload.phone }).then(r => r.data);
    },
    onSuccess: () => {
      updateUser({ phone: newPhone });
      setIsPhoneVerified(true);
      setShowOtpInput(false);
      setPhoneStatus({ type: 'success', message: 'Phone number updated successfully!' });
    },
    onError: (error) => setPhoneStatus({ type: 'error', message: error.response?.data?.message || 'Invalid OTP. Please try again.' }),
  });

  const handleVerifyOtp = () => {
    const err = v.otp(otp);
    if (err) { setPhoneStatus({ type: 'error', message: err }); return; }
    setPhoneStatus(null);
    verifyOtpMutation.mutate({ phone: newPhone, otp });
  };

  const verifyingPhone = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  // ── Change Password ────────────────────────────────────────────────────
  const updatePasswordMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/change-password', payload).then(r => r.data),
    onSuccess: (data) => {
      setPassStatus({ type: 'success', message: data.message || 'Password updated successfully!' });
      setPasswords({ current: '', next: '', confirm: '' });
    },
    onError: (error) => setPassStatus({ type: 'error', message: error.response?.data?.message || 'Failed to update password.' }),
  });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwords.current) { setPassStatus({ type: 'error', message: 'Current password is required.' }); return; }
    const pwErr = v.password(passwords.next);
    if (pwErr) { setPassStatus({ type: 'error', message: pwErr }); return; }
    const cfmErr = v.passwordConfirm(passwords.confirm, passwords.next);
    if (cfmErr) { setPassStatus({ type: 'error', message: cfmErr }); return; }
    setPassStatus(null);
    updatePasswordMutation.mutate({ currentPassword: passwords.current, newPassword: passwords.next });
  };

  const isSavingPass = updatePasswordMutation.isPending;

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

        {/* ── SECTION 0: Profile Photo ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Camera size={20} />
            </div>
            <h3 className="text-[17px] font-bold text-[#1f2355]">Profile Photo</h3>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f1f5f9&color=64748b`}
                alt="Profile"
                className="w-20 h-20 rounded-3xl object-cover border-2 border-slate-100"
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-[#1f2355]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="relative cursor-pointer block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <span className="flex items-center gap-2 px-5 py-3 bg-[#1f2355] text-white rounded-2xl text-[13px] font-bold w-fit shadow-sm">
                  <Camera size={16} /> Change Photo
                </span>
              </label>
              <p className="text-[11px] text-slate-400 font-medium mt-2">JPEG, PNG or WebP · Max 5MB</p>
            </div>
          </div>
          <StatusMsg type={imageStatus?.type} message={imageStatus?.message} />
        </motion.div>

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
                  ref={register('name')}
                  type="text" value={basicInfo.name}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, name: e.target.value.replace(/[^A-Za-z\s'\-]/g, '') }); clearError('name'); }}
                  className={cn(inputClass, errors.name && 'border-red-300')} placeholder="Enter full name" required
                />
                {errors.name && <p className="text-[12px] text-red-500 font-semibold mt-1">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <div className={iconClass}><Mail size={18} /></div>
                <input
                  ref={register('email')}
                  type="email" value={basicInfo.email}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, email: e.target.value }); clearError('email'); }}
                  className={cn(inputClass, errors.email && 'border-red-300')} placeholder="Enter email address" required
                />
                {errors.email && <p className="text-[12px] text-red-500 font-semibold mt-1">{errors.email}</p>}
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
                    type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10}
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
                  className={inputClass} placeholder="Min. 8 characters" required
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
