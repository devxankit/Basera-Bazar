import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const Toaster = () => {
  const { toasts, removeToast } = useToastInternal();
  
  return (
    <div className="fixed top-6 inset-x-0 z-[9999] flex flex-col items-center gap-3 pointer-events-none px-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className="pointer-events-auto min-w-[280px] max-w-sm bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-4 flex items-center gap-4"
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              toast.type === 'error' ? 'bg-rose-50 text-rose-600' :
              toast.type === 'loading' ? 'bg-indigo-50 text-indigo-600' :
              'bg-slate-50 text-slate-600'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={20} strokeWidth={2.5} />}
              {toast.type === 'error' && <AlertCircle size={20} strokeWidth={2.5} />}
              {toast.type === 'loading' && <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />}
              {toast.type === 'info' && <Info size={20} strokeWidth={2.5} />}
            </div>
            
            <div className="flex-grow">
              <p className="text-[14px] font-bold text-slate-900 leading-tight">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Internal hook for the Toaster component
const useToastInternal = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('Toaster must be used within ToastProvider');
  return context;
};

// Singleton-like state for the toast object
let toastRef = {
  success: () => {},
  error: () => {},
  loading: () => {},
  dismiss: () => {}
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => {
      // If ID exists (for loading update), replace it
      const exists = prev.find(t => t.id === id);
      if (exists) {
        return prev.map(t => t.id === id ? { ...t, message, type } : t);
      }
      return [...prev, { id, message, type }];
    });

    if (type !== 'loading' && !options.id) {
      setTimeout(() => removeToast(id), options.duration || 4000);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    toastRef.success = (msg, opts) => addToast(msg, 'success', opts);
    toastRef.error = (msg, opts) => addToast(msg, 'error', opts);
    toastRef.loading = (msg, opts) => addToast(msg, 'loading', opts);
    toastRef.dismiss = (id) => removeToast(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const toast = {
  success: (msg, opts) => toastRef.success(msg, opts),
  error: (msg, opts) => toastRef.error(msg, opts),
  loading: (msg, opts) => toastRef.loading(msg, opts),
  dismiss: (id) => toastRef.dismiss(id)
};

export default toast;
