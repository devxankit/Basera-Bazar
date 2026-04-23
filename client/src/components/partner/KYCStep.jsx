import React, { useRef } from 'react';
import { ShieldCheck, Camera, CheckCircle2, ChevronRight, FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KYCStep({ formData, setFormData, onBack, onComplete, onSkip, role }) {
  const panInputRef = useRef(null);
  const aadharFrontRef = useRef(null);
  const aadharBackRef = useRef(null);
  const gstInputRef = useRef(null);

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, [field]: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const isMandiOrSupplier = role === 'mandi' || role === 'supplier';

  return (
    <div className="flex flex-col font-sans pb-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Identity Verification</h1>
        <p className="text-slate-500 text-[15px]">Upload your documents to activate your account</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-8">
        <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
          Verified partners get 3x more visibility and trust from customers. You can skip this step and complete it later from your profile.
        </p>
      </div>

      <div className="space-y-6">
        {/* PAN Card */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1">PAN Card Image</label>
          <input type="file" ref={panInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'panImage')} />
          <div 
            onClick={() => panInputRef.current.click()}
            className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
          >
            {formData.panImage ? (
              <img src={formData.panImage} className="w-full h-full object-cover" alt="PAN" />
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Camera size={20} className="text-slate-400" />
                </div>
                <span className="text-[13px] font-bold text-slate-400">Upload PAN Card</span>
              </>
            )}
          </div>
        </div>

        {/* Aadhar Cards */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Aadhar Card Images</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <input type="file" ref={aadharFrontRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharFront')} />
              <div 
                onClick={() => aadharFrontRef.current.click()}
                className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
              >
                {formData.aadharFront ? (
                  <img src={formData.aadharFront} className="w-full h-full object-cover" alt="Aadhar Front" />
                ) : (
                  <>
                    <Camera size={20} className="text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-400 text-center px-2">Front Side</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <input type="file" ref={aadharBackRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharBack')} />
              <div 
                onClick={() => aadharBackRef.current.click()}
                className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
              >
                {formData.aadharBack ? (
                  <img src={formData.aadharBack} className="w-full h-full object-cover" alt="Aadhar Back" />
                ) : (
                  <>
                    <Camera size={20} className="text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-400 text-center px-2">Back Side</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GST Certificate */}
        {isMandiOrSupplier && (
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">GST Certificate</label>
            <input type="file" ref={gstInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'gstImage')} />
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
        )}
      </div>

      <div className="mt-12 space-y-3">
        <button
          onClick={onComplete}
          className="w-full py-5 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Complete Registration
          <ChevronRight size={20} />
        </button>
        
        <button
          onClick={onSkip}
          className="w-full py-5 bg-white text-slate-400 rounded-2xl font-bold text-[15px] active:bg-slate-50 transition-all"
        >
          Skip for Now
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
