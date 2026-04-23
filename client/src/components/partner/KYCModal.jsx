import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Camera, FileText, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { db } from '../../services/DataEngine';

export default function KYCModal({ isOpen, onClose, user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    panImage: null,
    aadharFront: null,
    aadharBack: null,
    gstImage: null
  });

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

  const compressImage = (dataUrl, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
    });
  };

  const handleSubmit = async () => {
    const role = (user?.active_role || user?.partner_type || '').toLowerCase();
    const isMandiOrSupplier = role.includes('mandi') || role.includes('supplier');

    // Basic validation
    if (!formData.panImage || !formData.aadharFront || !formData.aadharBack) {
      alert("Please upload PAN and both sides of Aadhar card.");
      return;
    }
    if (isMandiOrSupplier && !formData.gstImage) {
      alert("Please upload your GST certificate.");
      return;
    }

    setLoading(true);
    try {
      // Upload images
      const fields = ['panImage', 'aadharFront', 'aadharBack', 'gstImage'];
      const payload = { kyc: { status: 'pending' } };

      const uploadTasks = fields.map(async (field) => {
        if (formData[field]) {
          // Compress image before upload
          const compressedBlob = await compressImage(formData[field]);
          const res = await db.uploadFile(compressedBlob);
          
          const backendField = {
            panImage: 'pan_image',
            aadharFront: 'aadhar_front_image',
            aadharBack: 'aadhar_back_image',
            gstImage: 'gst_image'
          }[field];
          
          return { field: backendField, url: res.url };
        }
        return null;
      });

      const results = await Promise.all(uploadTasks);
      results.forEach(res => {
        if (res) payload.kyc[res.field] = res.url;
      });

      payload.onboarding_status = 'pending_approval';
      await api.put('/auth/profile', payload);

      setSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to upload documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const role = (user?.active_role || user?.partner_type || '').toLowerCase();
  const isMandiOrSupplier = role.includes('mandi') || role.includes('supplier');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-[24px] font-bold text-[#001b4e]">Verification Pending</h2>
                <p className="text-slate-500">Your documents have been submitted for review. Our team will verify them shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[24px] font-bold text-[#001b4e] leading-tight">Complete KYC</h2>
                    <p className="text-slate-500 text-[14px] mt-1">Activate your account by verifying identity</p>
                  </div>
                  <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* PAN */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">PAN Card Image</label>
                    <input type="file" ref={panInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'panImage')} />
                    <div
                      onClick={() => panInputRef.current.click()}
                      className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 overflow-hidden relative group"
                    >
                      {formData.panImage ? (
                        <img src={formData.panImage} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={24} className="text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload PAN</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aadhar */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Aadhar Front</label>
                      <input type="file" ref={aadharFrontRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharFront')} />
                      <div onClick={() => aadharFrontRef.current.click()} className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 overflow-hidden group">
                        {formData.aadharFront ? <img src={formData.aadharFront} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-300" />}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Aadhar Back</label>
                      <input type="file" ref={aadharBackRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'aadharBack')} />
                      <div onClick={() => aadharBackRef.current.click()} className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 overflow-hidden group">
                        {formData.aadharBack ? <img src={formData.aadharBack} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-300" />}
                      </div>
                    </div>
                  </div>

                  {/* GST */}
                  {isMandiOrSupplier && (
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">GST Certificate</label>
                      <input type="file" ref={gstInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'gstImage')} />
                      <div onClick={() => gstInputRef.current.click()} className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center gap-2 overflow-hidden group">
                        {formData.gstImage ? (
                          <img src={formData.gstImage} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <FileText size={24} className="text-slate-300" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Upload GST</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-5 bg-[#001b4e] text-white rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Submit for Verification"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
