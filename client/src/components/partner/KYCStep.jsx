import React, { useRef, useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2, ChevronRight, FileText, ArrowLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { v, sanitize } from '../../utils/validators';
import toast from '../../mockToast';
import { useBackgroundUpload } from '../../hooks/useBackgroundUpload';

export default function KYCStep({ formData, setFormData, onBack, onComplete, role }) {
  const panInputRef = useRef(null);
  const aadharFrontRef = useRef(null);
  const aadharBackRef = useRef(null);
  const gstInputRef = useRef(null);
  const { queueUpload, awaitUpload, cancelUpload } = useBackgroundUpload();

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [field]: localUrl }));
    // Compress + upload in the background right now
    queueUpload(field, file);
  };

  const handleRemoveFile = (field) => {
    cancelUpload(field);
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  const [kycErrors, setKycErrors] = useState({});
  const isMandiOrSupplier = role === 'mandi' || role === 'supplier';

  const handleComplete = async () => {
    const errs = {};
    if (!formData.pan?.trim()) {
      errs.pan = 'PAN card number is required';
    } else {
      const e = v.pan(formData.pan);
      if (e) errs.pan = e;
    }
    if (!formData.panImage) errs.panImage = 'PAN card image is required';
    if (!formData.aadhar?.trim()) {
      errs.aadhar = 'Aadhaar card number is required';
    } else {
      const e = v.aadhar(formData.aadhar);
      if (e) errs.aadhar = e;
    }
    if (!formData.aadharFront) errs.aadharFront = 'Aadhaar front image is required';
    if (isMandiOrSupplier && formData.gst) { const e = v.gstOptional(formData.gst); if (e) errs.gst = e; }
    if (Object.keys(errs).length > 0) {
      setKycErrors(errs);
      toast.error('Please fill all required KYC documents before continuing.');
      return;
    }
    setKycErrors({});
    // Resolve background upload URLs before passing to the parent flow
    // These are already uploading in the background — this will be near-instant
    const [panUrl, aadharFrontUrl, aadharBackUrl, gstUrl] = await Promise.all([
      awaitUpload('panImage'),
      awaitUpload('aadharFront'),
      awaitUpload('aadharBack'),
      awaitUpload('gstImage'),
    ]);
    // Patch resolved Cloudinary URLs into formData before parent finalizes
    setFormData(prev => ({
      ...prev,
      panImage: panUrl || prev.panImage,
      aadharFront: aadharFrontUrl || prev.aadharFront,
      aadharBack: aadharBackUrl || prev.aadharBack,
      gstImage: gstUrl || prev.gstImage,
    }));
    onComplete();
  };

  return (
    <div className="flex flex-col font-sans pb-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Identity Verification</h1>
        <p className="text-slate-500 text-[15px]">Upload your documents to activate your account</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-8">
        <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
          KYC verification is required to activate your account. Verified partners get 3x more visibility and trust from customers.
        </p>
      </div>

      <div className="space-y-6">
        {/* PAN Card */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 ml-1">PAN Card Number</label>
            <input 
              type="text" 
              value={formData.pan}
              onChange={(e) => { setFormData(prev => ({ ...prev, pan: sanitize.pan(e.target.value) })); setKycErrors(p => ({ ...p, pan: undefined })); }}
              maxLength={10}
              placeholder="ABCDE1234F"
              className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium ${kycErrors.pan ? 'border-red-400' : 'border-slate-200'}`}
            />
            {kycErrors.pan && <p className="text-[12px] text-red-500 font-semibold mt-1 ml-1">{kycErrors.pan}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 ml-1">PAN Card Image <span className="text-red-500">*</span></label>
            <input type="file" ref={panInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => { handleFileChange(e, 'panImage'); setKycErrors(p => ({ ...p, panImage: undefined })); }} />
            <div
              className={`w-full h-40 bg-slate-50 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group ${kycErrors.panImage ? 'border-red-400' : 'border-slate-200'}`}
            >
              {formData.panImage ? (
                <>
                  <img src={formData.panImage} className="w-full h-full object-cover" alt="PAN" onClick={() => panInputRef.current.click()} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile('panImage'); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg backdrop-blur-sm"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div onClick={() => panInputRef.current.click()} className="flex flex-col items-center gap-2 w-full h-full justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={20} className="text-slate-400" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-400">Upload PAN Card</span>
                </div>
              )}
            </div>
            {kycErrors.panImage && <p className="text-[12px] text-red-500 font-semibold mt-1 ml-1">{kycErrors.panImage}</p>}
          </div>
        </div>

        {/* Aadhar Cards */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Aadhar Card Number</label>
            <input 
              type="text" 
              value={formData.aadhar}
              onChange={(e) => { setFormData(prev => ({ ...prev, aadhar: sanitize.aadhar(e.target.value) })); setKycErrors(p => ({ ...p, aadhar: undefined })); }}
              maxLength={12}
              placeholder="1234 5678 9012"
              className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium ${kycErrors.aadhar ? 'border-red-400' : 'border-slate-200'}`}
            />
            {kycErrors.aadhar && <p className="text-[12px] text-red-500 font-semibold mt-1 ml-1">{kycErrors.aadhar}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Aadhar Card Images <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <input type="file" ref={aadharFrontRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => { handleFileChange(e, 'aadharFront'); setKycErrors(p => ({ ...p, aadharFront: undefined })); }} />
                <div
                  className={`h-32 bg-slate-50 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group ${kycErrors.aadharFront ? 'border-red-400' : 'border-slate-200'}`}
                >
                  {formData.aadharFront ? (
                    <>
                      <img src={formData.aadharFront} className="w-full h-full object-cover" alt="Aadhar Front" onClick={() => aadharFrontRef.current.click()} />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile('aadharFront'); }}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md backdrop-blur-sm"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div onClick={() => aadharFrontRef.current.click()} className="flex flex-col items-center gap-2 w-full h-full justify-center">
                      <Camera size={20} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400 text-center px-2">Front Side</span>
                    </div>
                  )}
                </div>
                {kycErrors.aadharFront && <p className="text-[11px] text-red-500 font-semibold">{kycErrors.aadharFront}</p>}
              </div>
              <div className="space-y-2">
                <input type="file" ref={aadharBackRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e, 'aadharBack')} />
                <div 
                  className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
                >
                  {formData.aadharBack ? (
                    <>
                      <img src={formData.aadharBack} className="w-full h-full object-cover" alt="Aadhar Back" onClick={() => aadharBackRef.current.click()} />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile('aadharBack'); }}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md backdrop-blur-sm"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div onClick={() => aadharBackRef.current.click()} className="flex flex-col items-center gap-2 w-full h-full justify-center">
                      <Camera size={20} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400 text-center px-2">Back Side</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GST Certificate */}
        {isMandiOrSupplier && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">GST Number (Optional)</label>
              <input 
                type="text" 
                value={formData.gst}
                onChange={(e) => { setFormData(prev => ({ ...prev, gst: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) })); setKycErrors(p => ({ ...p, gst: undefined })); }}
                placeholder="22AAAAA0000A1Z5"
                className={`w-full bg-slate-50 border rounded-xl py-3 px-4 text-[14px] outline-none focus:border-blue-500 transition-all font-medium ${kycErrors.gst ? 'border-red-400' : 'border-slate-200'}`}
              />
              {kycErrors.gst && <p className="text-[12px] text-red-500 font-semibold mt-1 ml-1">{kycErrors.gst}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 ml-1">GST Certificate</label>
              <input type="file" ref={gstInputRef} className="hidden" accept="image/jpeg, image/png, image/webp, application/pdf" onChange={(e) => handleFileChange(e, 'gstImage')} />
              <div 
                onClick={() => gstInputRef.current.click()}
                className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
              >
                {formData.gstImage ? (
                  <img src={formData.gstImage} className="w-full h-full object-cover" alt="GST" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-400">Upload GST Certificate</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-3">
        <button
          onClick={handleComplete}
          className="w-full py-5 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Complete Registration
          <ChevronRight size={20} />
        </button>
        
        <button
          onClick={onBack}
          className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 font-bold text-[13px]"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </div>
  );
}
