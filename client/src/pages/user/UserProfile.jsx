import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { db } from '../../services/DataEngine';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';
import { 
  User, Mail, Phone, Calendar, LogOut, ChevronRight, 
  Package, Wrench, Settings, ArrowLeft, Building2, MapPin, 
  ExternalLink, Clock, CheckCircle2, ShoppingCart, MessageSquare, Briefcase, Send,
  ShoppingBag, Download, ArrowRight, Bell, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Skeleton from '../../components/common/Skeleton';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const UserProfile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLocation } = useLocationContext();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
  };

  const navButtons = [
    { label: 'My Orders', icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600', path: '/profile/my-orders', subtitle: 'Track your marketplace bookings' },
    { label: 'My Enquiries', icon: MessageSquare, color: 'bg-orange-50 text-orange-600', path: '/profile/my-enquiries', subtitle: 'Properties, services & materials' },
    { label: 'Help & Support', icon: Phone, color: 'bg-emerald-50 text-emerald-600', path: '#', subtitle: 'Contact our customer care' },
    { label: 'FAQs', icon: HelpCircle, color: 'bg-purple-50 text-purple-600', path: '#', subtitle: 'Commonly asked questions' },
    { label: 'About Us', icon: Building2, color: 'bg-blue-50 text-blue-600', path: '#', subtitle: 'Learn more about Basera Bazar' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1f2355] pt-0 pb-20 sm:pb-24 px-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fa8639]/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-30" />
        
        <div className="flex items-center justify-between py-8 relative z-10">
          <button onClick={() => navigate('/')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[14px] sm:text-[16px] font-bold text-white uppercase tracking-[0.2em]">Profile Hub</h1>
          <button onClick={() => navigate('/profile/edit')} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all active:scale-95">
            <Settings size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 relative z-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#fa8639] to-orange-600 border-4 border-white/10 flex items-center justify-center p-0.5 shadow-xl"
          >
             <div className="w-full h-full rounded-xl sm:rounded-xl bg-white flex items-center justify-center text-[#1f2355]">
               <User size={28} sm:size={36} strokeWidth={2.5} />
             </div>
          </motion.div>
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <motion.h2 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[22px] sm:text-[26px] font-black text-white tracking-tight truncate"
            >
              {user.name}
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-white/70 text-[12px] sm:text-[13px] font-bold"
            >
              <MapPin size={12} className="text-[#fa8639]" />
              <span className="truncate">{currentLocation || 'Location not set'}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6 -mt-10 sm:-mt-12 relative z-20 space-y-6"
      >
        {/* Main Navigation List */}
        <div className="bg-white rounded-[32px] p-2 shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
           <motion.div 
             className="flex flex-col"
             initial="hidden"
             animate="show"
             variants={{
               hidden: { opacity: 0 },
               show: {
                 opacity: 1,
                 transition: {
                   staggerChildren: 0.1,
                   delayChildren: 0.6
                 }
               }
             }}
           >
              {navButtons.map((btn, idx) => (
                 <motion.button 
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  key={idx} 
                  onClick={() => btn.path !== '#' && navigate(btn.path)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98] group",
                    idx !== navButtons.length - 1 && "border-b border-slate-50"
                  )}
                 >
                    <div className="flex items-center gap-4">
                       <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", btn.color)}>
                          <btn.icon size={22} strokeWidth={2.5} />
                       </div>
                       <div className="text-left">
                          <div className="text-[15px] font-black text-[#1f2355]">{btn.label}</div>
                          <div className="text-[11px] font-bold text-slate-400">{btn.subtitle}</div>
                       </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#fa8639] group-hover:bg-orange-50 transition-all">
                       <ChevronRight size={18} strokeWidth={3} />
                    </div>
                 </motion.button>
              ))}
           </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
           <button 
             onClick={() => setShowLogoutConfirm(true)}
             className="w-full py-4 bg-white rounded-2xl border border-red-50 shadow-sm flex items-center justify-center gap-2 text-[13px] font-black text-red-500 uppercase tracking-wider active:scale-95 transition-all"
           >
              <LogOut size={16} /> Log Out
           </button>
        </div>

        {/* Become Partner Banner */}
        <div 
          onClick={() => navigate('/partner/register')}
          className="bg-gradient-to-br from-[#1f2355] to-[#001b4e] rounded-[32px] p-6 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer shadow-xl shadow-indigo-900/10"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-14 h-14 bg-[#fa8639] rounded-[22px] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Briefcase size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-black text-white leading-tight">Become a Partner</h3>
              <p className="text-[12px] text-white/60 font-bold mt-0.5">List your business today</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-sm group-hover:translate-x-1.5 transition-transform shrink-0">
            <ArrowRight size={20} strokeWidth={3} />
          </div>
        </div>

        <div className="text-center pb-8">
           <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Basera Bazar v1.0.2</p>
        </div>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-[#1f2355]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mx-auto mb-6">
                <LogOut size={36} strokeWidth={3} />
              </div>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-[20px] font-black text-[#1f2355]">Signing Out?</h3>
                <p className="text-[14px] font-bold text-slate-400 leading-relaxed">Are you sure you want to exit your session?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleLogout} className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-red-200">Yes, Log Out</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[14px] uppercase tracking-widest active:scale-[0.98] transition-all">Stay Logged In</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
