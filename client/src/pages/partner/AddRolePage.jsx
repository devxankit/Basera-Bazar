import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Wrench, Package, Store, Check, ChevronRight, Loader2, CheckCircle2, Upload, FileText, CreditCard, Info } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);

  const [step, setStep] = useState(1); // 1: Select Role, 2: Role Details, 3: KYC/GST, 4: Subscription Required
  const [profileData, setProfileData] = useState({
    business_name: '',
    business_description: '',
    rera_number: ''
  });
  const [gstData, setGstData] = useState({
    number: '',
    image: null,
    uploading: false
  });

  const currentRoles = user?.roles || (user?.partner_type ? [user.partner_type] : []);
  
  const availableRoles = ALL_ROLES.filter(role => {
    // Hide if already active
    if (currentRoles.includes(role.id)) return false;
    
    // Hide ONLY if there is a PENDING request. 
    // If it was rejected, let them apply again.
    const hasPendingRequest = user?.role_requests?.some(r => r.role === role.id && r.status === 'pending');
    return !hasPendingRequest;
  });

  const handleNextStep = () => {
    if (!selectedRole) return;
    
    // Step 1 -> Step 2 (if details needed) or Step 3 (if GST/Verification needed)
    if (step === 1) {
      if (selectedRole === 'supplier' || selectedRole === 'mandi_seller') {
        setStep(3); // Go straight to verification for high-stakes roles
      } else if (selectedRole === 'property_agent') {
        setStep(2);
      } else {
        handleAddRole();
      }
    } else if (step === 3) {
      // After verification (Step 3), if it's Mandi, they might still need business details (Step 2)
      // or go straight to Subscription (Step 4)
      if (selectedRole === 'mandi_seller' && !profileData.business_name) {
        setStep(2);
      } else {
        setStep(4);
      }
    } else if (step === 2) {
      // After Step 2, if it's Mandi and hasn't done GST yet (unlikely in this flow but for safety)
      if (selectedRole === 'mandi_seller' && !gstData.image) {
        setStep(3);
      } else {
        setStep(4);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setGstData(prev => ({ ...prev, uploading: true }));
    try {
      const formData = new FormData();
      formData.append('image', file); // Use 'image' key as expected by server

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setGstData(prev => ({ ...prev, image: res.data.url }));
      } else {
        throw new Error(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload certificate. Ensure it is a valid image (jpg/png).");
    } finally {
      setGstData(prev => ({ ...prev, uploading: false }));
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
          ? { rera_number: profileData.rera_number }
          : {},
        gst_number: gstData.number,
        gst_image: gstData.image
      };

      const res = await api.post('/partners/add-role', payload);

      if (res.data.success) {
        // For roles that require payment/approval, show Step 4 instead of direct success
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
        <p className="text-slate-400 text-[15px] font-medium">
          {['supplier', 'mandi_seller'].includes(selectedRole) 
            ? 'Admin will verify your documents shortly.' 
            : 'Your account has been upgraded successfully.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto font-sans">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50 shadow-sm">
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
        <h2 className="text-[17px] xs:text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">
          {step === 1 ? 'Add New Role' : step === 2 ? 'Role Details' : step === 3 ? 'Verification' : 'Subscription'}
        </h2>
        <div className="w-8" />
      </div>

      <main className="flex-grow px-6 pt-6 pb-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Current Roles */}
              <div className="mb-6 xs:mb-8">
                <p className="text-[9px] xs:text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2 xs:mb-3 opacity-50">Active Roles</p>
                <div className="flex flex-wrap gap-2">
                  {currentRoles.map(r => {
                    const roleMeta = ALL_ROLES.find(ar => ar.id === r);
                    return (
                      <div key={r} className="flex items-center gap-1.5 bg-[#001b4e] text-white px-3 py-1.5 rounded-xl text-[11px] xs:text-[12px] font-bold uppercase tracking-tight">
                        {roleMeta?.icon && React.cloneElement(roleMeta.icon, { size: 14 })}
                        {roleMeta?.title || r}
                        <Check size={12} className="text-green-400" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Roles */}
              <div className="mb-6 xs:mb-8">
                <h1 className="text-[20px] xs:text-[22px] font-bold text-[#001b4e] mb-1 uppercase tracking-tight leading-tight">Upgrade Account</h1>
                <p className="text-slate-400 text-[12px] xs:text-[13px] font-medium leading-snug mb-5 xs:mb-6 uppercase tracking-tight opacity-50">
                  Select a new role to add. Switch anytime.
                </p>

                {availableRoles.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-10 text-center">
                    <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-[18px] font-bold text-[#001b4e] mb-2">All Roles Active</h3>
                    <p className="text-slate-400 text-[14px]">You already have all available roles.</p>
                  </div>
                ) : (
                  <div className="space-y-3 xs:space-y-4">
                    {availableRoles.map((role) => {
                      const isSelected = selectedRole === role.id;
                      const theme = themeMap[role.theme];
                      return (
                        <motion.button
                          key={role.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedRole(isSelected ? null : role.id)}
                          className={`w-full flex items-center gap-4 xs:gap-5 p-4 xs:p-5 rounded-2xl border-2 transition-all text-left ${
                            isSelected 
                              ? `${theme.active} shadow-lg ring-2 xs:ring-4 ring-offset-0` 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className={`w-11 h-11 xs:w-14 xs:h-14 rounded-xl xs:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                            isSelected ? theme.iconBg : theme.iconIdle
                          }`}>
                            {React.cloneElement(role.icon, { size: isSelected ? 22 : 20 })}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-[14px] xs:text-[15px] font-bold text-[#001b4e] mb-0.5 uppercase tracking-tight leading-none">{role.title}</h3>
                            <p className="text-slate-400 text-[10px] xs:text-[11px] font-medium leading-snug uppercase tracking-widest opacity-50">{role.description}</p>
                          </div>
                          <div className="shrink-0">
                            {isSelected ? (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-6 h-6 xs:w-7 xs:h-7 rounded-full flex items-center justify-center ${theme.check}`}
                              >
                                <Check size={14} strokeWidth={4} />
                              </motion.div>
                            ) : (
                              <div className="w-5 h-5 xs:w-6 xs:h-6 border-2 border-slate-100 rounded-full" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Button */}
              {availableRoles.length > 0 && (
                <button
                  disabled={!selectedRole || submitting}
                  onClick={handleNextStep}
                  className={`w-full py-5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                    selectedRole 
                      ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {['supplier', 'mandi_seller', 'property_agent'].includes(selectedRole) ? 'Continue' : 'Add Role'}
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
              <h1 className="text-[24px] font-bold text-[#001b4e]">
                {selectedRole === 'mandi_seller' ? 'Business Details' : 'Agent Details'}
              </h1>
              <p className="text-slate-400 text-[14px] font-medium">Please provide some basic information for your new role.</p>

              {selectedRole === 'mandi_seller' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700 ml-1 uppercase tracking-tight">Business Name</label>
                    <input
                      type="text"
                      value={profileData.business_name}
                      onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                      placeholder="e.g. Muzaffarpur Mandi Traders"
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all uppercase tracking-tight"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700 ml-1 uppercase tracking-tight">Business Description</label>
                    <textarea
                      value={profileData.business_description}
                      onChange={(e) => setProfileData({ ...profileData, business_description: e.target.value })}
                      placeholder="What materials do you sell?"
                      rows={4}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all resize-none uppercase tracking-tight"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'property_agent' && (
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700 ml-1 uppercase tracking-tight">RERA Number (Optional)</label>
                  <input
                    type="text"
                    value={profileData.rera_number}
                    onChange={(e) => setProfileData({ ...profileData, rera_number: e.target.value })}
                    placeholder="e.g. BR-12345-67890"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all uppercase tracking-tight"
                  />
                </div>
              )}

              <button
                disabled={submitting || (selectedRole === 'mandi_seller' && !profileData.business_name)}
                onClick={selectedRole === 'mandi_seller' ? handleNextStep : handleAddRole}
                className={`w-full py-5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  !submitting && (selectedRole !== 'mandi_seller' || profileData.business_name)
                    ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm & Proceed'}
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
              <h1 className="text-[24px] font-bold text-[#001b4e] uppercase tracking-tight">Verification</h1>
              <p className="text-slate-400 text-[13px] font-medium leading-relaxed uppercase tracking-tight opacity-70">
                To list as a {selectedRole?.replace('_', ' ')}, you must provide valid GST details for business verification.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700 ml-1 uppercase tracking-tight">GST Number</label>
                  <input
                    type="text"
                    value={gstData.number}
                    onChange={(e) => setGstData({ ...gstData, number: e.target.value.toUpperCase() })}
                    placeholder="e.g. 10AAAAA0000A1Z5"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all uppercase tracking-tight"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-700 ml-1 uppercase tracking-tight">GST Certificate</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${gstData.image ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                      {gstData.uploading ? (
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                      ) : gstData.image ? (
                        <>
                          <CheckCircle2 size={32} className="text-green-500 mb-2" />
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Uploaded</span>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="text-slate-300 mb-2" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Upload Certificate</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
                <FileText size={20} className="text-amber-500 shrink-0" />
                <p className="text-[11px] font-medium text-amber-700 leading-relaxed uppercase tracking-tight">
                  Verification may take up to 24-48 hours.
                </p>
              </div>

              <button
                disabled={submitting || !gstData.number || !gstData.image || gstData.uploading}
                onClick={handleAddRole}
                className={`w-full py-5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  !submitting && gstData.number && gstData.image && !gstData.uploading
                    ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm & Proceed'}
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 pt-4"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <CreditCard size={40} className="text-[#001b4e]" />
              </div>
              
              <div>
                <h1 className="text-[24px] font-bold text-[#001b4e] mb-2 uppercase tracking-tight">Upgrade Required</h1>
                <p className="text-slate-400 text-[13px] font-medium leading-relaxed uppercase tracking-tight opacity-70">
                  To activate the <span className="text-[#001b4e] font-bold">{selectedRole?.replace('_', ' ')}</span> role, you need a professional plan.
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                <button
                  onClick={() => navigate('/partner/subscription')}
                  className="w-full py-5 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  View Plans
                </button>
                <button
                  onClick={() => navigate('/partner/home')}
                  className="w-full py-4 text-slate-400 font-bold text-[14px] active:scale-95 transition-all uppercase tracking-widest"
                >
                  Skip for Now
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 border border-slate-100 mt-4">
                <Info size={20} className="text-blue-500 shrink-0" />
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight text-left">
                  Your request is submitted. Activation requires verified documents and a professional plan.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
