import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, ArrowLeft, Loader2, CheckCircle2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function OTPStep({ formData, selectedRole, onBack, onVerified }) {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    try {
      setVerifying(true);
      setError('');
      const response = await api.post('/auth/send-otp', { phone: formData.phone.trim() });
      if (response.data.success) {
        setTimer(60);
        setOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try {
      setVerifying(true);
      setError('');
      const roleMapping = {
        'agent': 'property_agent',
        'service': 'service_provider',
        'supplier': 'supplier',
        'mandi': 'mandi_seller'
      };
      
      const response = await api.post('/auth/verify-otp', {
        phone: formData.phone.trim(),
        otp: otp,
        role: 'partner',
        partner_type: roleMapping[selectedRole] || 'service_provider',
        flow: 'signup',
        name: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (response.data?.success) {
        onVerified(response.data.user, response.data.token);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col font-sans">
      <div className="mb-8 p-1">
        <h1 className="text-[28px] font-bold text-[#001b4e] tracking-tight">Verify Phone</h1>
        <p className="text-slate-500 text-[15px] mt-1">We've sent a 6-digit code to</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#001b4e] font-bold text-[17px] tracking-tight">+91 {formData.phone}</span>
          <button 
            onClick={onBack}
            className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Edit Number
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001b4e] transition-colors">
            <ShieldCheck size={20} />
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit OTP"
            className={`w-full bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-5 pl-12 pr-4 text-[22px] font-black tracking-[0.4em] text-[#001b4e] placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium outline-none focus:border-[#001b4e] focus:ring-4 focus:ring-blue-50/50 transition-all`}
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-[13px] font-bold flex gap-2 items-start border border-red-100"
          >
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || verifying}
            className="w-full bg-[#001b4e] text-white py-5 rounded-2xl font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
          </button>

          <div className="text-center pt-2">
            {timer > 0 ? (
              <p className="text-slate-400 text-[14px] font-medium">
                Resend code in <span className="text-[#001b4e] font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
              </p>
            ) : (
              <button 
                onClick={handleResend}
                disabled={verifying}
                className="text-[#001b4e] font-bold text-[14px] hover:underline transition-all"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-10 p-6 bg-slate-50 rounded-[28px] border border-slate-100">
           <div className="flex gap-4 items-start">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                <Info size={20} />
             </div>
             <div>
               <h4 className="text-[#001b4e] text-[15px] font-bold mb-1">Having trouble?</h4>
               <p className="text-slate-500 text-[12px] leading-relaxed font-medium">If you didn't receive the SMS, please check your signal strength or try again in a few minutes.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
