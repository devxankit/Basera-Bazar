import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  type = 'danger', // danger, warning, success, info
  loading = false
}) {
  const themes = {
    danger: {
      icon: Trash2,
      color: 'bg-rose-50 text-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
      progress: 'border-rose-200'
    },
    warning: {
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
      progress: 'border-amber-200'
    },
    success: {
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
      progress: 'border-emerald-200'
    },
    info: {
      icon: Info,
      color: 'bg-indigo-50 text-indigo-600',
      btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
      progress: 'border-indigo-200'
    }
  };

  const theme = themes[type] || themes.danger;
  const Icon = theme.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header/Banner logic could go here but keeping it clean */}
            <div className="p-8 sm:p-10">
              <div className="flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className={`w-20 h-20 rounded-full ${theme.color} flex items-center justify-center mb-6 shadow-inner ring-8 ring-white`}>
                  <Icon size={36} strokeWidth={2} />
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                  {title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 ${theme.btn}`}
                >
                  {loading ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>

            {/* Close corner button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
