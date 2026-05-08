import React, { useState, useEffect } from 'react';
import { 
  UserCircle, Mail, Phone, MapPin, Landmark, 
  Camera, ShieldCheck, LogOut, ChevronRight,
  ShieldAlert, CheckCircle2, Clock, MapPinned, CreditCard,
  Building2, User, Zap, Shield, Key, Edit3, X, Save, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/executive/dashboard');
      if (res.data.success) {
        setProfile(res.data.data.profile);
        setEditForm({
          name: res.data.data.profile.name,
          email: res.data.data.profile.email
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/executive/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/executive/profile', editForm);
      if (res.data.success) {
        toast.success('Profile updated successfully');
        setProfile({ ...profile, ...editForm });
        // Update global user context if needed
        if (setUser) {
          setUser({ ...user, ...editForm });
        }
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
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

  const kycStatus = profile?.onboarding_status;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-32 font-inter">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-medium text-slate-900">Profile</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
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
            <div className="w-32 h-32 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-medium shadow-2xl shadow-emerald-200 relative z-10">
              {profile?.name?.charAt(0).toLowerCase()}
            </div>
            <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full scale-150 -z-0" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-medium text-slate-900 tracking-tight">{profile?.name}</h2>
            <p className="text-slate-400 font-medium text-[15px]">+91 {profile?.phone}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-medium uppercase tracking-widest rounded-full border border-slate-100">
              Verification Pending
            </span>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium uppercase tracking-widest rounded-full border border-emerald-100">
              Active
            </span>
          </div>
        </motion.div>

        {/* KYC Verification Card */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-medium text-slate-900 uppercase tracking-widest">KYC Verification</h3>
            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-medium uppercase tracking-widest rounded-lg border border-orange-100">
              Submitted
            </span>
          </div>

          <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-5 space-y-3">
            <p className="text-[13px] font-medium text-orange-900 leading-relaxed">
              KYC verification is in progress. Admin will review your documents shortly.
            </p>
            <p className="text-[11px] font-medium text-orange-600 italic">
              Usually takes 24-48 working hours.
            </p>
          </div>
        </motion.div>

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
