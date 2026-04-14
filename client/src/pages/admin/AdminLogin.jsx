import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import baseraLogo from '../../assets/baseralogo.png';

const inputClass = "w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white placeholder-slate-300 shadow-sm shadow-slate-100/50";
const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/auth/login', {
        identifier,
        password,
        role: 'super_admin'
      });

      if (response.data.success) {
        const { token, user } = response.data;
        login(user, token);
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Identity verification failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px]"
      >
        {/* Identity Head */}
        <div className="text-center mb-12">
          <motion.div 
             initial={{ scale: 0.9 }}
             animate={{ scale: 1 }}
             className="inline-flex items-center justify-center p-5 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 mb-8 border border-slate-50 relative group"
          >
            <div className="absolute inset-0 bg-indigo-50 rounded-[2.5rem] scale-95 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
            <img src={baseraLogo} alt="Basera" className="h-20 w-auto object-contain relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Central Command</p>
        </div>

        {/* Access Module */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl text-indigo-100 pointer-events-none" />
          
          <form onSubmit={handleLogin} className="space-y-7 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider border border-rose-100 flex items-center gap-3 shadow-sm shadow-rose-100/20"
              >
                 <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                 {error}
              </motion.div>
            )}

            <div className="group">
              <label className={labelClass}>Officer Identifier</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="Email or Username"
                  className={inputClass}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className={labelClass}>Secure Access Code</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-slate-200/50 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Persistence Check */}
        <p className="text-center mt-12 text-slate-300 text-[10px] font-black uppercase tracking-widest">
          Authorized Personnel Only &bull; End-to-End Encrypted
        </p>
      </motion.div>
    </div>
  );
}
