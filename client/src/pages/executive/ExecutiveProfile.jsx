import React, { useState, useEffect } from 'react';
import {
  UserCircle, Mail, Phone, MapPin, Landmark,
  Camera, ShieldCheck, LogOut, ChevronRight,
  ShieldAlert, CheckCircle2, Clock, MapPinned, CreditCard,
  Building2, User, Zap, Shield, Key, Edit3, X, Save, ArrowLeft, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../mockToast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  }
};

export default function ExecutiveProfile() {
  const { logout, user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '' });
  const [isSavingBank, setIsSavingBank] = useState(false);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['executiveProfileData'],
    queryFn: () => api.get('/executive/dashboard').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const profile = rawData?.success ? rawData.data.profile : null;
  const kycStatus = profile?.onboarding_status;
  const isVerified = kycStatus === 'verified' || kycStatus === 'approved';

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({ name: profile.name, email: profile.email });
      const bd = profile.bank_details;
      if (bd) {
        setBankForm({
          account_number: bd.account_number || '',
          ifsc_code: bd.ifsc_code || '',
          bank_name: bd.bank_name || '',
          account_holder_name: bd.account_holder_name || ''
        });
      }
    }
  }, [profile?.name, profile?.email]);

  const handleLogout = () => {
    logout(true);
    navigate('/executive/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/executive/profile', editForm);
      if (res.data.success) {
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries({ queryKey: ['executiveProfileData'] });
        if (setUser) setUser({ ...user, ...editForm });
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      const res = await api.put('/executive/bank-details', bankForm);
      if (res.data.success) {
        toast.success('Bank details updated!');
        queryClient.invalidateQueries({ queryKey: ['executiveProfileData'] });
        setShowBankForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center max-w-md mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Clock className="text-slate-400" size={32} />
        </motion.div>
        <p className="mt-4 text-[10px] font-medium uppercase tracking-widest text-slate-400">Loading Profile...</p>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-32 font-inter">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-medium text-slate-900">Profile</h1>
        <button 
          onClick={() => {
            if (!isVerified) {
              toast.error('Profile editing is disabled until your account is verified by admin.');
              return;
            }
            setIsEditing(!isEditing);
          }}
          className={`p-2 rounded-xl transition-all ${
            isEditing 
              ? 'bg-slate-900 text-white' 
              : isVerified 
              ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              : 'bg-slate-50 text-slate-300 cursor-default'
          }`}
        >
          {isEditing ? <X size={20} /> : <Edit3 size={20} />}
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-10 space-y-10"
      >
        {/* Centered Identity Section */}
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-medium shadow-2xl shadow-emerald-200 relative z-10 overflow-hidden">
              {(profile?.kyc?.live_photo || profile?.image) ? (
                <img src={profile?.kyc?.live_photo || profile?.image} alt={profile?.name} className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.name?.charAt(0)?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full scale-150 -z-0" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-medium text-slate-900 tracking-tight">{profile?.name}</h2>
            <p className="text-slate-400 font-medium text-[15px]">+91 {profile?.phone}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic status badge */}
            {(kycStatus === 'verified' || kycStatus === 'approved') ? (
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 size={10} /> Verified
              </span>
            ) : kycStatus === 'rejected' ? (
              <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-medium uppercase tracking-widest rounded-full border border-rose-100 flex items-center gap-1.5">
                <ShieldAlert size={10} /> Rejected
              </span>
            ) : kycStatus === 'incomplete' ? (
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-medium uppercase tracking-widest rounded-full border border-blue-100">
                Action Required
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-medium uppercase tracking-widest rounded-full border border-amber-100 flex items-center gap-1.5">
                <Clock size={10} /> Under Review
              </span>
            )}
          </div>
        </motion.div>

        {/* KYC / Verification Status Card — Dynamic */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-medium text-slate-900 uppercase tracking-widest">Account Status</h3>
            {(kycStatus === 'verified' || kycStatus === 'approved') && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-medium uppercase tracking-widest rounded-lg border border-emerald-100">Verified</span>
            )}
            {(kycStatus === 'pending' || kycStatus === 'pending_approval') && (
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-medium uppercase tracking-widest rounded-lg border border-amber-100">Under Review</span>
            )}
            {kycStatus === 'rejected' && (
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[9px] font-medium uppercase tracking-widest rounded-lg border border-rose-100">Rejected</span>
            )}
            {kycStatus === 'incomplete' && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-medium uppercase tracking-widest rounded-lg border border-blue-100">Incomplete</span>
            )}
          </div>

          {/* VERIFIED / APPROVED */}
          {(kycStatus === 'verified' || kycStatus === 'approved') && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-emerald-900 leading-tight">Your account is fully verified!</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">You can now onboard sellers using your referral code.</p>
                </div>
              </div>
              {profile?.referral_code && (
                <div className="mt-3 bg-white border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Your Referral Code</span>
                  <span className="text-[15px] font-medium text-emerald-700 tracking-widest">{profile.referral_code}</span>
                </div>
              )}
            </div>
          )}

          {/* PENDING KYC / PENDING APPROVAL */}
          {(kycStatus === 'pending' || kycStatus === 'pending_approval') && (
            <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-5 space-y-3">
              <p className="text-[13px] font-medium text-amber-900 leading-relaxed">
                KYC verification is in progress. Admin will review your documents shortly.
              </p>
              <p className="text-[11px] font-medium text-amber-600 italic">Usually takes 24–48 working hours.</p>
            </div>
          )}

          {/* REJECTED */}
          {kycStatus === 'rejected' && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-rose-900 leading-relaxed">Your application was rejected.</p>
                  {profile?.kyc?.rejection_reason && (
                    <p className="text-[11px] text-rose-600 mt-1 italic">Reason: {profile.kyc.rejection_reason}</p>
                  )}
                  <p className="text-[11px] text-rose-500 mt-2">Please contact support for assistance.</p>
                </div>
              </div>
            </div>
          )}

          {/* INCOMPLETE */}
          {kycStatus === 'incomplete' && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
              <p className="text-[13px] font-medium text-blue-900 leading-relaxed">
                Your profile is incomplete. Please complete your KYC to proceed.
              </p>
              <p className="text-[11px] text-blue-600">Contact support or re-register to complete your KYC documents.</p>
            </div>
          )}
        </motion.div>

        {/* Unverified notice */}
        {!isVerified && (
          <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] font-medium text-amber-800 leading-relaxed">
              Profile editing and bank details are disabled until your account is verified by the admin.
            </p>
          </motion.div>
        )}

        {/* Edit Profile Form (Inline) */}
        <AnimatePresence>
          {isEditing && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleUpdateProfile}
              className="space-y-6 overflow-hidden"
            >
              <div className="h-px bg-slate-100" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-xl text-[15px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-xl text-[15px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-5 bg-slate-900 text-white font-medium rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                {isSaving ? 'Updating...' : 'Save Changes'}
                {!isSaving && <Save size={18} />}
              </button>
              <div className="h-px bg-slate-100" />
            </motion.form>
          )}
        </AnimatePresence>

        {/* Bank Details Card */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-slate-900 uppercase tracking-widest">Bank Details</h3>
            <button
              onClick={() => {
                if (!isVerified) {
                  toast.error('Bank details can only be edited after your account is verified.');
                  return;
                }
                setShowBankForm(!showBankForm);
              }}
              className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-widest rounded-lg transition-all ${
                showBankForm 
                  ? 'bg-slate-900 text-white' 
                  : isVerified
                  ? 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                  : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-default'
              }`}
            >
              {showBankForm ? 'Cancel' : (profile?.bank_details?.account_number ? 'Edit' : 'Add Bank')}
            </button>
          </div>

          {!showBankForm ? (
            profile?.bank_details?.account_number ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-[#001b4e] rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-[#fa8639]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{profile.bank_details.bank_name || 'Bank Account'}</p>
                    <p className="text-[13px] font-medium text-slate-900">XXXX XXXX {profile.bank_details.account_number?.slice(-4)}</p>
                    <p className="text-[11px] text-slate-400">{profile.bank_details.ifsc_code}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-[12px] font-medium text-amber-800">No bank account linked. Add your bank details to enable payouts.</p>
              </div>
            )
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleUpdateBankDetails}
              className="space-y-4"
            >
              {[{ label: 'Bank Name', key: 'bank_name', placeholder: 'e.g. State Bank of India' },
                { label: 'Account Holder Name', key: 'account_holder_name', placeholder: 'Full name as per bank' },
                { label: 'Account Number', key: 'account_number', placeholder: '12-digit account number' },
                { label: 'IFSC Code', key: 'ifsc_code', placeholder: 'e.g. SBIN0001234' }
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                  <input
                    type="text"
                    value={bankForm[key]}
                    onChange={(e) => setBankForm({ ...bankForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-xl text-[14px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={isSavingBank}
                className="w-full py-4 bg-slate-900 text-white font-medium rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
              >
                {isSavingBank ? 'Saving...' : 'Save Bank Details'}
                {!isSavingBank && <Save size={16} />}
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* Action: Logout */}
        <motion.div variants={itemVariants}>
          <button 
            onClick={handleLogout}
            className="w-full p-5 bg-rose-50/50 text-rose-600 border border-rose-100 rounded-2xl font-medium text-sm transition-all active:scale-[0.98] hover:bg-rose-50"
          >
            Logout
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}
