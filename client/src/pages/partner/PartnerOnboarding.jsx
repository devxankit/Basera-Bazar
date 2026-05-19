import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Camera, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/DataEngine';

export default function PartnerOnboarding() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const isMandi = (user?.active_role || user?.partner_type || '').toLowerCase().includes('mandi');

  const [formData, setFormData] = useState({
    pan: '',
    panImage: null,
    aadhar: '',
    aadharFront: null,
    aadharBack: null,
    gst: '',
    gstImage: null,
    // Mandi Specific
    businessName: '',
    businessLogo: null,
    businessDescription: ''
  });

  // Sync with user data once loaded
  useEffect(() => {
    if (user) {
      // Aggressively find mandi data in all possible locations
      const mandiData =
        user.profile?.mandi_profile ||
        user.mandi_profile ||
        user.profile ||
        {};
      
      setFormData(prev => ({
        ...prev,
        pan: user.kyc?.pan_number || user.pan_number || prev.pan,
        panImage: user.kyc?.pan_image || user.pan_image || prev.panImage,
        aadhar: user.kyc?.aadhar_number || user.aadhar_number || prev.aadhar,
        aadharFront: user.kyc?.aadhar_front_image || user.aadhar_front_image || prev.aadharFront,
        aadharBack: user.kyc?.aadhar_back_image || user.aadhar_back_image || prev.aadharBack,
        gst: user.kyc?.gst_number || user.gst_number || prev.gst,
        gstImage: user.kyc?.gst_image || user.gst_image || prev.gstImage,
        // Mandi Specific (check both business_name and businessName just in case)
        businessName: mandiData.business_name || mandiData.businessName || user.business_name || prev.businessName,
        businessLogo: mandiData.business_logo || mandiData.businessLogo || user.business_logo || prev.businessLogo,
        businessDescription: mandiData.business_description || mandiData.businessDescription || user.business_description || prev.businessDescription
      }));
    }
  }, [user]);

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, [field]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const submitOnboardingMutation = useMutation({
    mutationFn: async (fd) => {
      const uploadIfNeeded = async (val) => {
        if (val && val.startsWith('data:')) {
          const res = await db.uploadFile(await fetch(val).then(r => r.blob()));
          return res.url;
        }
        return val;
      };

      const [panUrl, aadharFrontUrl, aadharBackUrl, gstUrl, logoUrl] = await Promise.all([
        uploadIfNeeded(fd.panImage),
        uploadIfNeeded(fd.aadharFront),
        uploadIfNeeded(fd.aadharBack),
        uploadIfNeeded(fd.gstImage),
        uploadIfNeeded(fd.businessLogo)
      ]);

      const updatePayload = {
        'kyc.pan_number': fd.pan,
        'kyc.pan_image': panUrl,
        'kyc.aadhar_number': fd.aadhar,
        'kyc.aadhar_front_image': aadharFrontUrl,
        'kyc.aadhar_back_image': aadharBackUrl,
        'kyc.gst_number': fd.gst,
        'kyc.gst_image': gstUrl,
        onboarding_status: 'pending_approval'
      };

      if (isMandi) {
        updatePayload['profile.mandi_profile.business_name'] = fd.businessName;
        updatePayload['profile.mandi_profile.business_logo'] = logoUrl;
        updatePayload['profile.mandi_profile.business_description'] = fd.businessDescription;
      }

      return api.put('/auth/profile', updatePayload).then(r => r.data);
    },
    onSuccess: (data) => {
      if (data.success) {
        login(data.data, localStorage.getItem('baserabazar_token'));
        alert("Verification details submitted successfully! Please wait for Admin approval.");
        navigate('/partner/home');
      }
    },
    onError: (error) => {
      console.error('Onboarding error:', error);
      alert(error.response?.data?.message || 'Submission failed. Please try again.');
    }
  });

  const isSubmitting = submitOnboardingMutation.isPending;

  const handleComplete = () => {
    if (!formData.pan || !formData.panImage || !formData.aadhar || !formData.aadharFront || !formData.aadharBack) {
      alert("Please upload all required documents (PAN and Aadhar).");
      return;
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      alert("Please enter a valid PAN Card number (e.g. ABCDE1234F).");
      return;
    }
    if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
      alert("Please enter a valid 12-digit Aadhar Card number.");
      return;
    }
    if (isMandi && !formData.businessName) {
      alert("Please enter your Business Name.");
      return;
    }
    submitOnboardingMutation.mutate(formData);
  };

  const isPending = user?.onboarding_status === 'pending_approval';
  const isRejected = user?.onboarding_status === 'rejected';
  const rejectionReason = user?.kyc?.rejection_reason;

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 border-b border-slate-50 px-5 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate('/partner/home')}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[17px] font-bold text-[#001b4e]">
          {isPending ? 'Verification Pending' : isRejected ? 'Verification Rejected' : 'Complete Profile'}
        </h2>
      </div>

      <main className="flex-grow px-6 pt-8 pb-32">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">
            {isPending ? 'Under Review' : isRejected ? 'Action Required' : 'Identity Verification'}
          </h1>
          <p className="text-slate-500 text-[15px]">
            {isPending 
              ? 'Our team is verifying your documents. This usually takes 24-48 hours.' 
              : isRejected 
              ? 'Your previous submission was rejected. Please review and resubmit.' 
              : 'Upload your documents to activate your account'}
          </p>
        </div>

        {isRejected && (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl mb-8 shadow-sm">
            <h3 className="text-rose-700 font-bold text-[14px] flex items-center gap-2 mb-2">
              <span className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center">!</span>
              Documents Rejected
            </h3>
            <p className="text-rose-600 text-[13px] leading-relaxed font-medium">
              Reason: {rejectionReason || 'Invalid or blurry documents provided.'}
            </p>
          </div>
        )}

        {isPending && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start mb-8">
            <CheckCircle2 size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
              You have already submitted your documents. You can update them below if needed, but it may reset your verification queue position.
            </p>
          </div>
        )}

        {!isPending && !isRejected && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-8">
            <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
              Verified partners get 3x more visibility and trust from customers. Your account will be activated once these are approved.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Mandi Profile Info */}
          {isMandi && (
            <div className="space-y-6 pb-4 border-b border-slate-100">
               <h3 className="text-[15px] font-bold text-[#001b4e] uppercase tracking-wider">Business Details</h3>
               
               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="e.g. Muzaffarpur Fresh Fruits"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Business Description</label>
                  <textarea 
                    rows={3}
                    value={formData.businessDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                    placeholder="Tell customers about your products and expertise..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium resize-none"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Business Logo</label>
                  <label className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'businessLogo')} />
                    {formData.businessLogo ? (
                      <img src={formData.businessLogo} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      <>
                        <Camera size={20} className="text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400">Upload Shop Logo</span>
                      </>
                    )}
                  </label>
               </div>
            </div>
          )}

          <h3 className="text-[15px] font-bold text-[#001b4e] uppercase tracking-wider">KYC Documents</h3>

          {/* PAN Card */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">PAN Card Number</label>
              <input 
                type="text" 
                value={formData.pan}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))}
                maxLength={10}
                placeholder="ABCDE1234F"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">PAN Card Image</label>
              <label className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'panImage')} />
                {formData.panImage ? (
                  <img src={formData.panImage} className="w-full h-full object-cover" alt="PAN" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Camera size={20} className="text-slate-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-400">Upload PAN Card</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Aadhar */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Aadhar Card Number</label>
              <input 
                type="text" 
                value={formData.aadhar}
                onChange={(e) => setFormData(prev => ({ ...prev, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                maxLength={12}
                placeholder="1234 5678 9012"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">Aadhar Card Images</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharFront')} />
                  {formData.aadharFront ? (
                    <img src={formData.aadharFront} className="w-full h-full object-cover" alt="Front" />
                  ) : (
                    <>
                      <Camera size={20} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400">Front Side</span>
                    </>
                  )}
                </label>
                <label className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharBack')} />
                  {formData.aadharBack ? (
                    <img src={formData.aadharBack} className="w-full h-full object-cover" alt="Back" />
                  ) : (
                    <>
                      <Camera size={20} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400">Back Side</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* GST (Optional) */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">GST Number (Optional)</label>
              <input 
                type="text" 
                value={formData.gst}
                onChange={(e) => setFormData(prev => ({ ...prev, gst: e.target.value.toUpperCase() }))}
                placeholder="22AAAAA0000A1Z5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">GST Certificate</label>
              <label className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'gstImage')} />
                {formData.gstImage ? (
                  <img src={formData.gstImage} className="w-full h-full object-cover" alt="GST" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-400">Upload GST Certificate</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-5 bg-white border-t border-slate-50">
        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-full py-4 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Documents'}
          {!isSubmitting && <CheckCircle2 size={20} />}
        </button>
      </div>
    </div>
  );
}
