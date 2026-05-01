import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Wrench, Package, Store, Check, 
  ChevronRight, Loader2, CheckCircle2, Upload, FileText, 
  CreditCard, Info, Zap, Activity, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ALL_ROLES = [
  {
    id: 'property_agent',
    title: 'Property Agent',
    description: 'Buy, sell & rent properties. List real estate with RERA compliance.',
    icon: <Building2 size={26} />,
    theme: 'blue',
    kycRequired: ['aadhar', 'pan']
  },
  {
    id: 'service_provider',
    title: 'Service Provider',
    description: 'Offer construction, plumbing, electrical & home services.',
    icon: <Wrench size={26} />,
    theme: 'emerald',
    kycRequired: ['aadhar', 'pan']
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Supply building materials, fittings & construction goods.',
    icon: <Package size={26} />,
    theme: 'amber',
    kycRequired: ['aadhar', 'pan', 'gst']
  },
  {
    id: 'mandi_seller',
    title: 'Mandi Seller',
    description: 'Sell raw materials on Basera Bazar with daily pricing.',
    icon: <Store size={26} />,
    theme: 'purple',
    kycRequired: ['aadhar', 'pan', 'gst']
  }
];

const themeMap = {
  blue: {
    active: 'border-blue-500 bg-blue-50/30 shadow-blue-500/20 ring-blue-50',
    iconBg: 'bg-blue-500 text-white shadow-md shadow-blue-500/30',
    iconIdle: 'bg-slate-100/80 text-blue-500',
    check: 'bg-blue-500 text-white'
  },
  emerald: {
    active: 'border-emerald-500 bg-emerald-50/30 shadow-emerald-500/20 ring-emerald-50',
    iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
    iconIdle: 'bg-slate-100/80 text-emerald-500',
    check: 'bg-emerald-500 text-white'
  },
  amber: {
    active: 'border-amber-500 bg-amber-50/30 shadow-amber-500/20 ring-amber-50',
    iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
    iconIdle: 'bg-slate-100/80 text-amber-500',
    check: 'bg-amber-500 text-white'
  },
  purple: {
    active: 'border-purple-500 bg-purple-50/30 shadow-purple-500/20 ring-purple-50',
    iconBg: 'bg-purple-500 text-white shadow-md shadow-purple-500/30',
    iconIdle: 'bg-slate-100/80 text-purple-500',
    check: 'bg-purple-500 text-white'
  }
};

export default function AddRolePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [success, setSuccess] = useState(false);

  const [step, setStep] = useState(1); // 1: Select/Switch Role, 2: Role Details, 3: KYC/GST, 4: Subscription Required
  const [profileData, setProfileData] = useState({
    business_name: '',
    business_description: '',
    rera_number: '',
    rera_certificate_image: '',
    uploading: false
  });
  const [gstData, setGstData] = useState({
    number: '',
    image: null,
    uploading: false
  });

  const currentRoles = user?.roles || (user?.partner_type ? [user.partner_type] : []);
  const activeRole = user?.active_role || user?.partner_type || currentRoles[0];
  
  const availableRoles = ALL_ROLES.filter(role => {
    if (currentRoles.includes(role.id)) return false;
    const hasPendingRequest = user?.role_requests?.some(r => r.role === role.id && r.status === 'pending');
    return !hasPendingRequest;
  });

  const handleSwitchRole = async (roleId) => {
    if (roleId === activeRole) return;
    setSwitching(roleId);
    try {
      const res = await api.put('/partners/switch-role', { role: roleId });
      if (res.data.success) {
        await refreshUser();
        navigate('/partner/home');
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to switch role.");
    } finally {
      setSwitching(null);
    }
  };

  const handleNextStep = () => {
    if (!selectedRole) return;
    
    if (step === 1) {
      if (selectedRole === 'supplier' || selectedRole === 'mandi_seller') {
        setStep(3); 
      } else if (selectedRole === 'property_agent') {
        setStep(2);
      } else {
        handleAddRole();
      }
    } else if (step === 3) {
      if (selectedRole === 'mandi_seller' && !profileData.business_name) {
        setStep(2);
      } else {
        setStep(4);
      }
    } else if (step === 2) {
      if (selectedRole === 'mandi_seller' && !gstData.image) {
        setStep(3);
      } else {
        setStep(4);
      }
    }
  };

  const handleFileUpload = async (e, type = 'gst') => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'rera') {
      setProfileData(prev => ({ ...prev, uploading: true }));
    } else {
      setGstData(prev => ({ ...prev, uploading: true }));
    }

    try {
      const formData = new FormData();
      formData.append('image', file); 

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        if (type === 'rera') {
          setProfileData(prev => ({ ...prev, rera_certificate_image: res.data.url }));
        } else {
          setGstData(prev => ({ ...prev, image: res.data.url }));
        }
      } else {
        throw new Error(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload certificate. Ensure it is a valid image (jpg/png).");
    } finally {
      if (type === 'rera') {
        setProfileData(prev => ({ ...prev, uploading: false }));
      } else {
        setGstData(prev => ({ ...prev, uploading: false }));
      }
    }
  };

  const handleAddRole = async () => {
    setSubmitting(true);
    try {
      const payload = {
        new_role: selectedRole,
        profile_data: selectedRole === 'mandi_seller' 
          ? { business_name: profileData.business_name, business_description: profileData.business_description }
          : selectedRole === 'property_agent'
          ? { rera_number: profileData.rera_number, rera_certificate_image: profileData.rera_certificate_image }
          : {},
        gst_number: gstData.number,
        gst_image: gstData.image,
        rera_number: selectedRole === 'property_agent' ? profileData.rera_number : undefined,
        rera_certificate_image: selectedRole === 'property_agent' ? profileData.rera_certificate_image : undefined
      };

      const res = await api.post('/partners/add-role', payload);

      if (res.data.success) {
        if (['supplier', 'mandi_seller', 'property_agent'].includes(selectedRole)) {
          setStep(4);
          await refreshUser();
        } else {
          setSuccess(true);
          await refreshUser();
          setTimeout(() => {
            navigate('/partner/home');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Add role error:', error);
      alert(error.response?.data?.message || 'Failed to add role. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={48} className="text-green-500" />
        </motion.div>
        <h2 className="text-[24px] font-bold text-[#001b4e] mb-2">
          {['supplier', 'mandi_seller'].includes(selectedRole) ? 'Request Submitted!' : 'Role Added!'}
        </h2>
        <p className="text-slate-400 text-[15px] font-medium uppercase tracking-tight opacity-60">
          {['supplier', 'mandi_seller'].includes(selectedRole) 
            ? 'Admin will verify your documents shortly.' 
            : 'Your account has been upgraded successfully.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] flex flex-col font-sans pb-32">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <button 
          onClick={() => {
            if (step === 3) setStep(selectedRole === 'mandi_seller' ? 2 : 1);
            else if (step === 2) setStep(1);
            else navigate(-1);
          }}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-[17px] font-bold text-[#001b4e] uppercase tracking-tight">
          {step === 1 ? 'Add or Switch Role' : step === 2 ? 'Role Details' : step === 3 ? 'Verification' : 'Activation'}
        </h2>
        <div className="w-8" />
      </div>

      <main className="flex-grow p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Switching Mode Section */}
              {currentRoles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Zap size={16} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Modes</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {currentRoles.map(roleId => {
                      const roleMeta = ALL_ROLES.find(r => r.id === roleId);
                      const isActive = activeRole === roleId;
                      const isSwitching = switching === roleId;
                      
                      return (
                        <button
                          key={roleId}
                          disabled={isActive || switching}
                          onClick={() => handleSwitchRole(roleId)}
                          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                            isActive 
                              ? 'bg-white border-[#001b4e] shadow-md ring-2 ring-[#001b4e]/5' 
                              : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm opacity-60 grayscale-[0.5]'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-[#001b4e] text-white' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {isSwitching ? <Loader2 size={20} className="animate-spin" /> : roleMeta?.icon}
                          </div>
                          
                          <div className="flex-grow text-left">
                            <div className="text-[14px] font-bold text-[#001b4e] uppercase tracking-tight">
                              {roleMeta?.title || roleId}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                              {isActive ? 'Currently Active' : 'Switch to this mode'}
                            </div>
                          </div>
                          
                          {isActive && (
                            <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                              <ShieldCheck size={14} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Role Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Activity size={16} className="text-blue-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upgrade Account</span>
                </div>

                {availableRoles.length === 0 ? (
                  <div className="bg-white rounded-[24px] p-8 text-center border border-slate-100 shadow-sm opacity-50">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-[15px] font-bold text-[#001b4e] uppercase tracking-tight">Full Stack Partner</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-tight leading-relaxed">
                      You have activated all available roles. No further upgrades possible.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableRoles.map((role) => {
                      const isSelected = selectedRole === role.id;
                      const theme = themeMap[role.theme];
                      return (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(isSelected ? null : role.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-[24px] border-2 transition-all text-left ${
                            isSelected 
                              ? `${theme.active} shadow-lg scale-[1.02]` 
                              : 'border-slate-50 bg-white hover:border-slate-100'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isSelected ? theme.iconBg : theme.iconIdle
                          }`}>
                            {role.icon}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-[14px] font-black text-[#001b4e] mb-0.5 uppercase tracking-tight leading-none">{role.title}</h3>
                            <p className="text-slate-400 text-[10px] font-medium leading-snug uppercase tracking-tight opacity-60">{role.description}</p>
                          </div>
                          <div className="shrink-0 pr-1">
                            {isSelected ? (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme.check}`}>
                                <Check size={14} strokeWidth={4} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-slate-100 rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {availableRoles.length > 0 && (
                <button
                  disabled={!selectedRole || submitting}
                  onClick={handleNextStep}
                  className={`w-full py-5 rounded-[24px] font-bold text-[16px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${
                    selectedRole 
                      ? 'bg-[#001b4e] text-white shadow-xl shadow-blue-900/20 active:scale-95' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : (
                    <>
                      {['supplier', 'mandi_seller', 'property_agent'].includes(selectedRole) ? 'Continue Setup' : 'Activate Role'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight leading-tight">
                {selectedRole === 'mandi_seller' ? 'Business Setup' : 'Professional Verification'}
              </h1>
              
              <div className="space-y-5 pt-2">
                {selectedRole === 'mandi_seller' && (
                  <>
                    <InputField 
                      label="Business Name" 
                      value={profileData.business_name}
                      onChange={v => setProfileData({...profileData, business_name: v})}
                      placeholder="e.g. Muzaffarpur Mandi Traders"
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">About Your Business</label>
                      <textarea
                        value={profileData.business_description}
                        onChange={(e) => setProfileData({ ...profileData, business_description: e.target.value })}
                        placeholder="What materials do you sell?"
                        rows={4}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-5 text-[14px] font-medium outline-none focus:border-blue-500/20 transition-all resize-none shadow-sm"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'property_agent' && (
                  <>
                    <InputField 
                      label="RERA Number (Optional)" 
                      value={profileData.rera_number}
                      onChange={v => setProfileData({...profileData, rera_number: v})}
                      placeholder="e.g. BR-12345-67890"
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RERA Certificate</label>
                      <div className="relative group">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'rera')}
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full border-2 border-dashed rounded-[24px] p-8 flex flex-col items-center justify-center transition-all ${profileData.rera_certificate_image ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white shadow-sm'}`}>
                          {profileData.uploading ? <Loader2 size={32} className="text-blue-500 animate-spin" /> : (
                            profileData.rera_certificate_image ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Upload size={32} className="text-slate-300" />
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{profileData.rera_certificate_image ? 'Certificate Uploaded' : 'Upload Image'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                disabled={submitting || (selectedRole === 'mandi_seller' && !profileData.business_name)}
                onClick={selectedRole === 'mandi_seller' ? handleNextStep : handleAddRole}
                className="w-full py-5 rounded-[24px] bg-[#001b4e] text-white font-bold text-[16px] shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Details'}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-[20px] font-black text-[#001b4e] uppercase tracking-tight">Tax Identification</h1>
              
              <div className="space-y-5 pt-2">
                <InputField 
                  label="GST Number" 
                  value={gstData.number}
                  onChange={v => setGstData({...gstData, number: v.toUpperCase()})}
                  placeholder="e.g. 10AAAAA0000A1Z5"
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">GST Certificate</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center transition-all ${gstData.image ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white shadow-sm'}`}>
                      {gstData.uploading ? <Loader2 size={40} className="text-blue-500 animate-spin" /> : (
                        gstData.image ? <CheckCircle2 size={40} className="text-emerald-500" /> : <Upload size={40} className="text-slate-200" />
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                        {gstData.image ? 'Verified Certificate' : 'Click to Upload'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 border border-blue-100">
                  <FileText size={20} className="text-blue-500 shrink-0" />
                  <p className="text-[11px] font-medium text-blue-700 leading-relaxed uppercase tracking-tight">
                    Our team will verify your GST details within 24 hours to activate your professional listing.
                  </p>
                </div>
              </div>

              <button
                disabled={submitting || !gstData.number || !gstData.image || gstData.uploading}
                onClick={handleAddRole}
                className="w-full py-5 rounded-[24px] bg-[#001b4e] text-white font-bold text-[16px] shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Activate Now'}
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 pt-10"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200 border border-slate-50 relative">
                <CreditCard size={40} className="text-[#001b4e]" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-[#001b4e] shadow-lg">
                  <Zap size={18} fill="currentColor" />
                </div>
              </div>
              
              <div>
                <h1 className="text-[22px] font-black text-[#001b4e] mb-2 uppercase tracking-tight">Premium Activation</h1>
                <p className="text-slate-400 text-[13px] font-medium leading-relaxed uppercase tracking-tight opacity-70 px-4">
                  To start listing as a <span className="text-[#001b4e] font-bold">{selectedRole?.replace('_', ' ')}</span>, please select a professional plan.
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                <button
                  onClick={() => navigate('/partner/subscription')}
                  className="w-full py-5 bg-[#001b4e] text-white rounded-[24px] font-bold text-[16px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  View Premium Plans
                </button>
                <button
                  onClick={() => navigate('/partner/home')}
                  className="w-full py-4 text-slate-300 font-bold text-[12px] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Setup Later
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-5 text-[14px] font-bold text-[#001b4e] outline-none focus:border-blue-500/20 shadow-sm transition-all uppercase tracking-tight"
      />
    </div>
  );
}
