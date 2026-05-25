import React, { useState, useEffect } from 'react';
import toast from '../../mockToast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
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
  2: [...Object.keys(DEFAULT_FORM), 'profileImage_file', 'businessLogo_file'], // InfoStep
  3: [],                        // OTP step owns authState only
  4: ['pan', 'aadhar', 'gst', 'panImage', 'aadharFront', 'aadharBack', 'gstImage',
      'panImage_file', 'aadharFront_file', 'aadharBack_file', 'gstImage_file'], // KYCStep
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

  // Note: payment errors from Razorpay callback are now handled by /payment/status page.
  // We no longer read ?error from the URL here.

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
    nextStep();
  };

  // Shared registration payload (no images — uploaded separately after auth)
  const buildRegisterPayload = (backendRole, planType = null) => ({
    phone_verified_token: authState.phoneVerifiedToken,
    name: formData.fullName,
    email: formData.email,
    password: formData.password,
    partner_type: backendRole,
    coords: formData.coords || [85.3647, 26.1209],
    state: formData.state,
    district: formData.district,
    city: formData.city,
    address: formData.address,
    pincode: formData.pincode,
    service_radius_km: formData.service_radius_km,
    referral_code: formData.referral_code || undefined,
    pan_number: formData.pan,
    aadhar_number: formData.aadhar,
    gst_number: formData.gst,
    business_name: formData.businessName,
    business_description: formData.businessDescription,
    ...(planType && { plan_type: planType }),
  });

  // Upload images using the auth token that was just set, then PATCH the partner record.
  // Non-blocking: a failure here does not abort registration — images can be updated later.
  //
  // Priority order for each field:
  //   1. File object stored by KYCStep (formData[field_file]) — most reliable, has MIME type
  //   2. blob: / data: URL stored in formData[field]         — fallback for InfoStep images
  //   3. https: Cloudinary URL already uploaded              — already done, just pass through
  const uploadAndPatchMedia = async () => {
    try {
      const uploadFile = async (file) => {
        try {
          const res = await db.uploadFile(file);
          return res?.url || null;
        } catch { return null; }
      };

      const uploadIfNeeded = async (field) => {
        // 1. Raw File object (from KYCStep — stored as formData[field + '_file'])
        const fileObj = formData[`${field}_file`];
        if (fileObj instanceof File) {
          return uploadFile(fileObj);
        }
        const url = formData[field];
        if (!url) return null;
        // 2. Already a Cloudinary URL
        if (url.startsWith('https://')) return url;
        // 3. blob: or data: URL (e.g. from InfoStep profile/logo background upload)
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          try {
            const blob = await fetch(url).then(r => r.blob());
            return uploadFile(blob);
          } catch { return null; }
        }
        return null;
      };

      const [profileUrl, logoUrl, panUrl, aadharFrontUrl, aadharBackUrl, gstUrl] = await Promise.all([
        uploadIfNeeded('profileImage'),
        uploadIfNeeded('businessLogo'),
        uploadIfNeeded('panImage'),
        uploadIfNeeded('aadharFront'),
        uploadIfNeeded('aadharBack'),
        uploadIfNeeded('gstImage'),
      ]);

      if (profileUrl || logoUrl || panUrl || aadharFrontUrl || aadharBackUrl || gstUrl) {
        await api.patch('/partners/onboard-media', {
          image: profileUrl,
          business_logo: logoUrl,
          pan_image: panUrl,
          aadhar_front_image: aadharFrontUrl,
          aadhar_back_image: aadharBackUrl,
          gst_image: gstUrl,
        });
      }
    } catch (err) {
      console.warn('Media upload during registration failed — images can be updated in profile:', err);
    }
  };


  const handleConfirmRegistration = async () => {
    if (!authState?.phoneVerifiedToken) {
      toast.error("Please verify your phone number first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const roleMapping = { 'agent': 'property_agent', 'service': 'service_provider', 'supplier': 'supplier', 'mandi': 'mandi_seller' };
      const backendRole = roleMapping[selectedRole] || 'service_provider';

      // Step 1: Register partner (no images) — pass 'free_trial' so server grants trial subscription
      const res = await api.post('/auth/partner/register', buildRegisterPayload(backendRole, 'free_trial'));
      const { user: userData, token } = res.data;

      // Step 2: Write token and user to localStorage and update auth context immediately
      login(userData, token);

      // Step 3: Set auth token so subsequent requests are authenticated
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Step 4: Upload images and patch partner record (non-blocking)
      await uploadAndPatchMedia();

      const activity = {
        title: `Account Registered as ${selectedRole}`,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        type: 'profile'
      };
      const activityKey = `baserabazar_activity_${userData.id || userData._id}`;
      const existingLogs = JSON.parse(localStorage.getItem(activityKey) || '[]');
      localStorage.setItem(activityKey, JSON.stringify([activity, ...existingLogs.filter(l => l.title !== activity.title)]));

      sessionStorage.removeItem(STORAGE_KEY);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      // Show "Welcome Aboard!" status screen with 5-second countdown → /partner/home
      const params = new URLSearchParams({
        status: 'success',
        redirect: '/partner/home',
        context: 'registration',
      });
      window.location.replace(`/payment/status?${params.toString()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
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
      const roleMapping = { 'agent': 'property_agent', 'service': 'service_provider', 'supplier': 'supplier', 'mandi': 'mandi_seller' };
      const backendRole = roleMapping[selectedRole] || 'service_provider';

      // Step 1: Register partner (no images)
      const regRes = await api.post('/auth/partner/register', buildRegisterPayload(backendRole));
      const { user: userData, token } = regRes.data;

      // Step 2: Write token and user to localStorage and update auth context immediately
      login(userData, token);

      // Step 3: Set auth token so upload and subscription requests are authenticated
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Step 4: Upload images and patch partner record (non-blocking)
      await uploadAndPatchMedia();

      // Step 5: Initiate Subscription
      const initRes = await api.post('/finance/subscription/initiate', { plan_id: selectedPlan });
      const { order_id, amount, key, plan_name } = initRes.data;

      const completeRegistration = async (paymentId, signature) => {
        await api.post('/finance/subscription/verify', {
          razorpay_order_id: order_id,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          plan_id: selectedPlan
        });
        const activity = {
          title: `Account Registered as ${selectedRole}`,
          time: new Date().toLocaleTimeString(),
          timestamp: new Date().toISOString(),
          type: 'profile'
        };
        const activityKey = `baserabazar_activity_${userData.id || userData._id}`;
        const existingLogs = JSON.parse(localStorage.getItem(activityKey) || '[]');
        localStorage.setItem(activityKey, JSON.stringify([activity, ...existingLogs.filter(l => l.title !== activity.title)]));
        sessionStorage.removeItem(STORAGE_KEY);
        // Route through status page — shows "Payment Successful!" / "Welcome Aboard!" with 5s countdown
        const params = new URLSearchParams({
          status: 'success',
          redirect: '/partner/home',
          context: 'registration',
        });
        window.location.replace(`/payment/status?${params.toString()}`);
      };

      // Demo mode: skip Razorpay modal and auto-verify
      if (key === 'rzp_test_mock') {
        await completeRegistration(`pay_mock_${Date.now()}`, 'mock_signature');
        return;
      }

      const callbackBase = api.defaults.baseURL?.startsWith('http') 
        ? api.defaults.baseURL 
        : window.location.origin + (api.defaults.baseURL || '/api');

      const options = {
        key,
        amount,
        currency: "INR",
        name: "Basera Bazar",
        description: `Subscription: ${plan_name}`,
        image: "https://res.cloudinary.com/dbqsy9vvt/image/upload/v1714570000/logos/logo_main.png",
        order_id,
        prefill: {
          name: formData.fullName || "",
          email: formData.email || "",
          contact: formData.phone || ""
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setIsSubmitting(false)
        },
        redirect: true,
        callback_url: `${callbackBase}/finance/subscription/callback?plan_id=${selectedPlan}&redirect_to=${encodeURIComponent('/partner/register')}&origin=${encodeURIComponent(window.location.origin)}`
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start payment.");
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
      {/* Exit registration confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#001b4e]/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <X size={28} className="text-orange-500" />
            </div>
            <h3 className="text-[20px] font-bold text-[#001b4e] mb-2">Exit Registration?</h3>
            <p className="text-slate-500 text-[14px] mb-7 leading-relaxed">Your progress will be lost and you'll need to start over.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { sessionStorage.removeItem(STORAGE_KEY); navigate('/partner/login'); }}
                className="w-full py-4 bg-[#001b4e] text-white rounded-2xl font-bold text-[15px]"
              >
                Yes, Exit
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-3 text-slate-400 font-bold text-[14px] hover:text-[#001b4e] transition-colors"
              >
                Continue Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header / Progress Bar */}
      <div className="bg-white sticky top-0 z-50">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50">
          <button
            onClick={() => step === 1 ? setShowExitConfirm(true) : prevStep()}
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
                onVerified={(phoneVerifiedToken) => {
                  setAuthState({ phoneVerifiedToken });
                  nextStep();
                }}
              />
            )}
            {step === 4 && (
              <KYCStep
                formData={formData}
                setFormData={setFormData}
                onBack={prevStep}
                onComplete={nextStep}
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
