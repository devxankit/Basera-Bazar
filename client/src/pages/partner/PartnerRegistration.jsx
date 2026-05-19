import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleStep from '../../components/partner/RoleStep';
import InfoStep from '../../components/partner/InfoStep';
import OTPStep from '../../components/partner/OTPStep';
import KYCStep from '../../components/partner/KYCStep';
import PlanStep from '../../components/partner/PlanStep';
import PartnerModal from '../../components/partner/PartnerModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/DataEngine';

const STORAGE_KEY = 'partner_reg';

const DEFAULT_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  state: '',
  district: '',
  category: '',
  businessLogo: null,
  businessName: '',
  businessDescription: '',
  pan: '',
  aadhar: '',
  gst: '',
  address: '',
  pincode: '',
  profileImage: null,
  service_radius_km: 100,
  city: '',
  coords: null,
  referral_code: ''
};

// Fields that belong to each step — clearing on back uses these lists
const STEP_FIELDS = {
  2: Object.keys(DEFAULT_FORM), // InfoStep owns all formData
  3: [],                        // OTP step owns authState only
  4: ['pan', 'aadhar', 'gst', 'panImage', 'aadharFront', 'aadharBack', 'gstImage'],
  5: [],                        // Plan step owns selectedPlan/selectedPlanObject only
};

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmLabel: ''
  });

  // Restore from sessionStorage on mount
  const saved = loadSaved();
  const [step, setStep] = useState(saved?.step || 1);
  const [selectedRole, setSelectedRole] = useState(saved?.selectedRole || null);
  const [selectedPlan, setSelectedPlan] = useState(saved?.selectedPlan || null);
  const [selectedPlanObject, setSelectedPlanObject] = useState(saved?.selectedPlanObject || null);
  const [formData, setFormData] = useState(saved?.formData || DEFAULT_FORM);
  const [authState, setAuthState] = useState(saved?.authState || null);

  // Persist to sessionStorage whenever relevant state changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, selectedRole, selectedPlan, selectedPlanObject, formData, authState
    }));
  }, [step, selectedRole, selectedPlan, selectedPlanObject, formData, authState]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));

  const prevStep = () => {
    setStep(prev => {
      const newStep = Math.max(prev - 1, 1);
      // Clear data belonging to steps >= current (going backward)
      if (prev >= 2) {
        const fieldsToClear = STEP_FIELDS[prev] || [];
        if (fieldsToClear.length > 0) {
          setFormData(fd => {
            const cleared = { ...fd };
            fieldsToClear.forEach(f => { cleared[f] = DEFAULT_FORM[f] ?? null; });
            return cleared;
          });
        }
      }
      if (prev >= 3) setAuthState(null);
      if (prev >= 5) { setSelectedPlan(null); setSelectedPlanObject(null); }
      return newStep;
    });
  };

  const handleCompleteRequest = () => {
    // This now just moves to the plan step
    nextStep();
  };

  const handleConfirmRegistration = async () => {
    if (!authState) {
       alert("Please verify your phone number first.");
       return;
    }

    setIsSubmitting(true);
    try {
      // 1. Ensure token is set (already handled in onVerified)
      const { token, user: userData } = authState;

      // 2. Handle Image Uploads for Profile/Business Logo
      let profileUrl = formData.profileImage;
      if (formData.profileImage && formData.profileImage.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.profileImage).then(r => r.blob()));
         profileUrl = res.url;
      }

      let logoUrl = formData.businessLogo;
      if (formData.businessLogo && formData.businessLogo.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.businessLogo).then(r => r.blob()));
         logoUrl = res.url;
      }

      let panUrl = formData.panImage;
      if (formData.panImage && formData.panImage.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.panImage).then(r => r.blob()));
         panUrl = res.url;
      }

      let aadharFrontUrl = formData.aadharFront;
      if (formData.aadharFront && formData.aadharFront.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.aadharFront).then(r => r.blob()));
         aadharFrontUrl = res.url;
      }

      let aadharBackUrl = formData.aadharBack;
      if (formData.aadharBack && formData.aadharBack.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.aadharBack).then(r => r.blob()));
         aadharBackUrl = res.url;
      }

      let gstUrl = formData.gstImage;
      if (formData.gstImage && formData.gstImage.startsWith('data:')) {
         const res = await db.uploadFile(await fetch(formData.gstImage).then(r => r.blob()));
         gstUrl = res.url;
      }

      // 3. Update Profile with full details
      const roleMapping = {
        'agent': 'property_agent',
        'service': 'service_provider',
        'supplier': 'supplier',
        'mandi': 'mandi_seller'
      };
      const backendRole = roleMapping[selectedRole] || 'service_provider';

      const updatePayload = {
        name: formData.fullName,
        email: formData.email,
        partner_type: backendRole,
        roles: [backendRole],
        active_role: backendRole,
        image: profileUrl,
        service_radius_km: formData.service_radius_km,
        location: {
           type: 'Point',
           coordinates: formData.coords || [85.3647, 26.1209]
        },
        state: formData.state,
        district: formData.district,
        address: formData.address,
        pincode: formData.pincode,
        'kyc.pan_number': formData.pan,
        'kyc.pan_image': panUrl,
        'kyc.aadhar_number': formData.aadhar,
        'kyc.aadhar_front_image': aadharFrontUrl,
        'kyc.aadhar_back_image': aadharBackUrl,
        'kyc.gst_number': formData.gst,
        'kyc.gst_image': gstUrl,
        onboarding_status: (panUrl && formData.pan && aadharFrontUrl && formData.aadhar) ? 'pending_approval' : 'incomplete'
      };

      if (backendRole === 'mandi_seller') {
        updatePayload['profile.mandi_profile.business_name'] = formData.businessName;
        updatePayload['profile.mandi_profile.business_logo'] = logoUrl;
        updatePayload['profile.mandi_profile.business_description'] = formData.businessDescription;
      }

      await api.put('/auth/profile', updatePayload);

      // 4. Handle Subscription (if free trial or plan passed)
      // If it's a paid plan, we handle it separately via Razorpay verification which also activates it.
      // If it's free trial, we can activate it via a separate endpoint if we had one, 
      // but for now, we'll assume the backend handles 'trial' logic or we activate it here.
      // However, per requirements, the user MUST choose a plan to complete registration.
      
      // For Free Trial activation:
      if (selectedPlan === 'free_trial') {
        // Find a trial plan on backend or handle trial logic
        // We can call a specialized trial activation endpoint
        try {
          // We'll use a hidden 0-price plan if available, or just skip and let admin handle it
          // For now, let's just complete registration.
        } catch (subErr) {
          console.error("Failed to activate free trial:", subErr);
        }
      }

      // 6. Finalize Auth Session
      const activity = {
        title: `Account Registered as ${selectedRole}`,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        type: 'profile'
      };
      const activityKey = `baserabazar_activity_${userData.id || userData._id}`;
      const existingLogs = JSON.parse(localStorage.getItem(activityKey) || '[]');
      const filteredLogs = existingLogs.filter(log => log.title !== activity.title);
      localStorage.setItem(activityKey, JSON.stringify([activity, ...filteredLogs]));

      login(userData, token);
      sessionStorage.removeItem(STORAGE_KEY);

      setModalConfig(prev => ({ ...prev, isOpen: false }));
      navigate('/partner/home');
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentAndActivate = async () => {
    if (!selectedPlanObject || selectedPlan === 'free_trial') {
      handleConfirmRegistration();
      return;
    }

    setIsSubmitting(true);
    try {
    // Temporarily set token so protected routes work before login() is called
      api.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;

      // 1. Initiate Subscription
      const initRes = await api.post('/finance/subscription/initiate', {
        plan_id: selectedPlan
      });

      const { order_id, amount, key, plan_name } = initRes.data;

      const options = {
        key,
        amount,
        currency: "INR",
        name: "Basera Bazar",
        description: `Subscription: ${plan_name}`,
        order_id,
        handler: async (response) => {
          try {
            // 2. Verify and Activate
            await api.post('/finance/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan
            });
            
            // 3. Complete Profile Update
            await handleConfirmRegistration();
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setIsSubmitting(false)
        },
        // Pass referral code to verify if needed, but it's already in formData
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert(error.response?.data?.message || "Failed to start payment.");
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Select Role';
      case 2: return 'Your Information';
      case 3: return 'Verify Phone';
      case 4: return 'KYC Documents';
      case 5: return 'Subscription Plan';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-white flex flex-col font-sans overflow-x-hidden">
      {/* Header / Progress Bar */}
      <div className="bg-white sticky top-0 z-50">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50">
          <button 
            onClick={() => step === 1 ? navigate('/partner/login') : prevStep()}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[17px] font-bold text-[#001b4e]">Partner Registration</h2>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] font-bold text-[#001b4e]">Step {step} of {totalSteps}</span>
            <span className="text-[13px] font-medium text-slate-400">{getStepTitle()}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '25%' }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              className="h-full bg-[#3b82f6] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-grow px-6 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className=""
          >
            {step === 1 && (
              <RoleStep 
                selectedRole={selectedRole} 
                onSelect={setSelectedRole} 
                onNext={nextStep} 
              />
            )}
            {step === 2 && (
              <InfoStep 
                formData={formData} 
                setFormData={setFormData} 
                onBack={prevStep} 
                onComplete={handleCompleteRequest}
                onProceedToVerify={() => {
                  // This is called when user clicks "Send OTP"
                  nextStep();
                }}
                isVerified={!!authState}
                role={selectedRole}
                plan={selectedPlan}
              />
            )}
            {step === 3 && (
              <OTPStep 
                formData={formData}
                selectedRole={selectedRole}
                onBack={prevStep}
                onVerified={(userData, token) => {
                  // Set token on API instance immediately for subsequent steps
                  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                  setAuthState({ user: userData, token });
                  nextStep();
                }}
              />
            )}
            {step === 4 && (
              <KYCStep 
                formData={formData}
                setFormData={setFormData}
                onBack={prevStep}
                onComplete={() => {
                  if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
                    alert("Please enter a valid PAN Card number (e.g. ABCDE1234F).");
                    return;
                  }
                  if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
                    alert("Please enter a valid 12-digit Aadhar Card number.");
                    return;
                  }
                  nextStep();
                }}
                onSkip={nextStep}
                role={selectedRole}
              />
            )}
            {step === 5 && (
              <PlanStep 
                selectedRole={{
                  'agent': 'property_agent',
                  'service': 'service_provider',
                  'supplier': 'supplier',
                  'mandi': 'mandi_seller'
                }[selectedRole]}
                selectedPlan={selectedPlan}
                onSelect={(id, plan) => {
                  setSelectedPlan(id);
                  setSelectedPlanObject(plan);
                }}
                onBack={prevStep}
                onNext={handlePaymentAndActivate}
                submitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Confirmation Modals */}
      <PartnerModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        loading={isSubmitting}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmRegistration}
      />
    </div>
  );
}
