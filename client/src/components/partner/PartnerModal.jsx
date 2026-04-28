import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, CreditCard, X, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function PartnerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type = 'confirm', 
  title, 
  message, 
  confirmLabel = 'Confirm',
  loading = false 
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={48} />;
      case 'payment': return <CreditCard className="text-orange-500" size={48} />;
      default: return <AlertCircle className="text-blue-500" size={48} />;
    }
  };

  const getThemeColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50';
      case 'payment': return 'bg-orange-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-[#001b4e]/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden relative z-10 shadow-2xl"
        >
          {/* Close Button */}
          {!loading && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          )}

          <div className="p-8 pt-10 flex flex-col items-center text-center">
            {/* Icon Bubble */}
            <div className={`w-24 h-24 ${getThemeColor()} rounded-full flex items-center justify-center mb-6`}>
              {getIcon()}
            </div>

            <h2 className="text-[24px] font-bold text-[#001b4e] mb-3 leading-tight">{title}</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
              {message}
            </p>

            {type === 'payment' && (
              <div className="w-full bg-slate-50 rounded-2xl p-4 mb-8 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[13px] font-bold text-[#001b4e]">Free Tier Subscription</div>
                    <div className="text-[11px] text-slate-400">Recurring annually</div>
                  </div>
                </div>
                <div className="text-[16px] font-bold text-[#001b4e]">₹999</div>
              </div>
            )}

            <div className="w-full space-y-3">
              <button
                disabled={loading}
                onClick={onConfirm}
                className={`w-full py-4.5 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all ${
                  type === 'payment' ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/30' : 'bg-[#001b4e] text-white shadow-lg shadow-blue-900/20'
                } active:scale-[0.98] disabled:opacity-70`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {confirmLabel}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
              
              {!loading && (
                <button
                  onClick={onClose}
                  className="w-full py-4 font-bold text-[15px] text-slate-400 hover:text-[#001b4e] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Security Footer */}
            <div className="mt-8 flex items-center gap-2 text-slate-300">
              <ShieldCheck size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Secure Encrypted Session</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
