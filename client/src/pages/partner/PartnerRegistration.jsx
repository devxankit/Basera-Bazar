import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleStep from '../../components/partner/RoleStep';
import PlanStep from '../../components/partner/PlanStep';
import InfoStep from '../../components/partner/InfoStep';
import PartnerModal from '../../components/partner/PartnerModal';

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmLabel: ''
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
    category: '',
    // New Fields
    businessLogo: null,
    businessName: '',
    businessDescription: '',
    pan: '',
    aadhar: '',
    gst: '',
    address: '',
    pincode: '',
    profileImage: null
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleCompleteRequest = () => {
    if (selectedPlan === 'free') {
      setModalConfig({
        isOpen: true,
        type: 'confirm',
        title: 'Complete Registration',
        message: 'Are you sure you want to create your partner account with the provided information?',
        confirmLabel: 'Create Account'
      });
    } else {
      setModalConfig({
        isOpen: true,
        type: 'payment',
        title: 'Unlock Premium Features',
        message: 'Proceed to payment to activate your Pre-launching annual subscription.',
        confirmLabel: 'Pay & Activate'
      });
    }
  };

  const handleConfirmRegistration = () => {
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      
      // Store session info for dashboard simulation
      const partnerData = {
        name: formData.fullName || 'Partner',
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        role: selectedRole,
        plan: selectedPlan,
        category: formData.category,
        isLoggedIn: true
      };
      sessionStorage.setItem('activePartner', JSON.stringify(partnerData));
      
      // Navigate to partner home
      navigate('/partner/home');
    }, 2000);
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Select Role';
      case 2: return 'Choose Plan';
      case 3: return 'Your Information';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto font-sans relative overflow-x-hidden">
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
            <span className="text-[14px] font-bold text-[#001b4e]">Step {step} of 3</span>
            <span className="text-[13px] font-medium text-slate-400">{getStepTitle()}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '33.33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
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
            className="h-full"
          >
            {step === 1 && (
              <RoleStep 
                selectedRole={selectedRole} 
                onSelect={setSelectedRole} 
                onNext={nextStep} 
              />
            )}
            {step === 2 && (
              <PlanStep 
                selectedPlan={selectedPlan} 
                onSelect={setSelectedPlan} 
                onNext={nextStep} 
                onBack={prevStep} 
              />
            )}
            {step === 3 && (
              <InfoStep 
                formData={formData} 
                setFormData={setFormData} 
                onBack={prevStep} 
                onComplete={handleCompleteRequest}
                role={selectedRole}
                plan={selectedPlan}
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
