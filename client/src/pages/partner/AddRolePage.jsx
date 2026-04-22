import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Wrench, Package, Store, Check, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
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

  const [step, setStep] = useState(1); // 1: Select Role, 2: Role Details
  const [profileData, setProfileData] = useState({
    business_name: '',
    business_description: '',
    rera_number: ''
  });

  const currentRoles = user?.roles || (user?.partner_type ? [user.partner_type] : []);
  const availableRoles = ALL_ROLES.filter(r => !currentRoles.includes(r.id));

  const handleNextStep = () => {
    if (!selectedRole) return;
    // Mandi and Agent need extra details
    if (selectedRole === 'mandi_seller' || selectedRole === 'property_agent') {
      setStep(2);
    } else {
      handleAddRole();
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
          : {}
      };

      const res = await api.post('/partners/add-role', payload);

      if (res.data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          navigate('/partner/home');
        }, 1500);
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
        <h2 className="text-[24px] font-bold text-[#001b4e] mb-2">Role Added!</h2>
        <p className="text-slate-400 text-[15px]">Your account has been upgraded successfully.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto font-sans">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <button 
          onClick={() => step === 2 ? setStep(1) : navigate(-1)}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[17px] font-bold text-[#001b4e]">
          {step === 1 ? 'Add New Role' : 'Role Details'}
        </h2>
        <div className="w-8" />
      </div>

      <main className="flex-grow px-6 pt-6 pb-10">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Current Roles */}
              <div className="mb-8">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Current Roles</p>
                <div className="flex flex-wrap gap-2">
                  {currentRoles.map(r => {
                    const roleMeta = ALL_ROLES.find(ar => ar.id === r);
                    return (
                      <div key={r} className="flex items-center gap-2 bg-[#001b4e] text-white px-4 py-2.5 rounded-2xl text-[13px] font-bold">
                        {roleMeta?.icon && React.cloneElement(roleMeta.icon, { size: 16 })}
                        {roleMeta?.title || r}
                        <Check size={14} className="text-green-400" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Roles */}
              <div className="mb-8">
                <h1 className="text-[24px] font-bold text-[#001b4e] mb-2">Upgrade Your Account</h1>
                <p className="text-slate-400 text-[14px] leading-relaxed mb-6">
                  Select a new role to add to your partner account. You can switch between roles anytime.
                </p>

                {availableRoles.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-10 text-center">
                    <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-[18px] font-bold text-[#001b4e] mb-2">All Roles Active</h3>
                    <p className="text-slate-400 text-[14px]">You already have all available roles.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableRoles.map((role) => {
                      const isSelected = selectedRole === role.id;
                      const theme = themeMap[role.theme];
                      return (
                        <motion.button
                          key={role.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedRole(isSelected ? null : role.id)}
                          className={`w-full flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all text-left ${
                            isSelected 
                              ? `${theme.active} shadow-xl ring-4` 
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                            isSelected ? theme.iconBg : theme.iconIdle
                          }`}>
                            {role.icon}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-[16px] font-bold text-[#001b4e] mb-1">{role.title}</h3>
                            <p className="text-slate-400 text-[12px] leading-relaxed">{role.description}</p>
                          </div>
                          <div className="shrink-0">
                            {isSelected ? (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center ${theme.check}`}
                              >
                                <Check size={16} strokeWidth={3} />
                              </motion.div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-slate-200 rounded-full" />
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
                      {selectedRole === 'mandi_seller' || selectedRole === 'property_agent' ? 'Continue' : 'Add Role'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              )}
            </motion.div>
          ) : (
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
              <p className="text-slate-400 text-[14px]">Please provide some basic information for your new role.</p>

              {selectedRole === 'mandi_seller' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Business Name</label>
                    <input
                      type="text"
                      value={profileData.business_name}
                      onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                      placeholder="e.g. Muzaffarpur Mandi Traders"
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">Business Description</label>
                    <textarea
                      value={profileData.business_description}
                      onChange={(e) => setProfileData({ ...profileData, business_description: e.target.value })}
                      placeholder="What materials do you sell?"
                      rows={4}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all resize-none"
                    />
                  </div>
                </>
              )}

              {selectedRole === 'property_agent' && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">RERA Number (Optional)</label>
                  <input
                    type="text"
                    value={profileData.rera_number}
                    onChange={(e) => setProfileData({ ...profileData, rera_number: e.target.value })}
                    placeholder="e.g. BR-12345-67890"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-[15px] font-medium outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all"
                  />
                </div>
              )}

              <button
                disabled={submitting || (selectedRole === 'mandi_seller' && !profileData.business_name)}
                onClick={handleAddRole}
                className={`w-full py-5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  !submitting && (selectedRole !== 'mandi_seller' || profileData.business_name)
                    ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20 active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Confirm & Add Role'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
