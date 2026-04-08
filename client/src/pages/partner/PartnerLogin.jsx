import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../../assets/baseralogo.png';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate('/'); // Redirect to dashboard or home for now
    }, 1500);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-8 pt-12 max-w-md mx-auto font-sans">
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full"
      >
        {/* Logo Section */}
        <motion.div variants={fadeInUp} className="flex flex-col items-center mb-10">
          <div className="flex flex-col items-center">
            <img src={logo} alt="Basera Bazar" className="h-24 object-contain" />
            <div className="mt-2 flex flex-col items-center">
              <span className="text-[14px] font-bold text-[#001b4e] tracking-[0.25em] uppercase">Partner App</span>
              <div className="flex items-center gap-1.5 mt-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <span className="text-[12px]">🤝</span>
                <span className="text-[9px] font-bold text-[#f97316] uppercase tracking-wider">Verified Partner</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div variants={fadeInUp} className="text-center mb-10 mt-6">
          <h1 className="text-[32px] font-bold text-[#001b4e] mb-2 tracking-tight">Welcome Back!</h1>
          <p className="text-slate-500 text-[16px]">Login to your partner account</p>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={fadeInUp} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-[#001b4e] group-focus-within:bg-indigo-50 transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-16 pr-4 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-400 outline-none focus:border-[#001b4e] focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-[#001b4e] group-focus-within:bg-indigo-50 transition-colors">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-16 pr-14 text-[15px] font-medium text-[#001b4e] placeholder:text-slate-400 outline-none focus:border-[#001b4e] focus:ring-4 focus:ring-indigo-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#001b4e] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </motion.div>

          {/* Login Button */}
          <motion.button
            variants={fadeInUp}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#001b4e] text-white py-5 rounded-[20px] font-bold text-[16px] shadow-lg shadow-indigo-900/20 active:bg-[#001b4e]/90 transition-all flex items-center justify-center mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Login'}
          </motion.button>
        </form>

        {/* Divider */}
        <motion.div 
          variants={fadeInUp}
          className="flex items-center gap-4 my-10 px-4"
        >
          <div className="flex-1 h-[1px] bg-slate-100" />
          <span className="text-slate-300 text-[13px] font-bold tracking-widest uppercase">OR</span>
          <div className="flex-1 h-[1px] bg-slate-100" />
        </motion.div>

        {/* Footer */}
        <motion.div variants={fadeInUp} className="text-center pb-12">
          <p className="text-slate-500 text-[15px]">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/partner/register')}
              className="text-[#f97316] font-bold hover:underline"
            >
              Become a Partner
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
