import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Box, Building2, ChevronRight, 
  User, Mail, Phone, CreditCard, HelpCircle, Info, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function PartnerProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // If no user is logged in, we shouldn't even be here
  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // For compatibility with the existing UI code, we map 'user' to 'partner'
  const partner = user;

  const handleLogout = () => {
    logout();
    navigate('/partner/login');
  };

  if (!partner) return null;

  const getRoleLabel = (roleStr) => {
    const r = (roleStr || '').toLowerCase();
    if (r.includes('agent') || r === 'property_agent') return 'Agent';
    if (r.includes('service') || r === 'service_provider') return 'Service Provider';
    if (r === 'supplier') return 'Supplier';
    if (r.includes('mandi') || r === 'mandi_seller') return 'Mandi Seller';
    return roleStr || 'Partner';
  };

  const partnerRoles = partner.roles && partner.roles.length > 0 
    ? partner.roles 
    : (partner.partner_type ? [partner.partner_type] : [partner.role || 'Partner']);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white z-50 shadow-sm">
        <button 
          onClick={() => navigate('/partner/home')}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-medium text-[#001b4e]">Profile</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 pt-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#001b4e] rounded-[32px] p-8 flex flex-col items-center text-center shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16 blur-2xl" />
          
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[40px] font-medium text-[#001b4e] shadow-lg border-4 border-white/10">
              {partner.name?.charAt(0) || 'U'}
            </div>
            <button 
              onClick={() => navigate('/partner/edit-profile')}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-[#001b4e] shadow-lg text-white active:scale-95 transition-all"
            >
              <Edit2 size={12} fill="currentColor" />
            </button>
          </div>

          <h2 className="text-white text-[24px] font-bold mb-1">{partner.name}</h2>
          <p className="text-white/60 text-[14px] mb-6">{partner.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {partnerRoles.map(r => (
              <div key={r} className="bg-white/10 px-4 py-1.5 rounded-2xl flex items-center gap-2 border border-white/10 backdrop-blur-md">
                <Building2 size={14} className="text-white/80" />
                <span className="text-white text-[12px] font-bold tracking-wide uppercase">{getRoleLabel(r)}</span>
              </div>
            ))}
          </div>

          {/* Add Role CTA */}
          <button 
            onClick={() => navigate('/partner/add-role')}
            className="mt-4 bg-white/10 hover:bg-white/20 border border-dashed border-white/30 px-5 py-2 rounded-2xl text-white/80 text-[12px] font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            + Add Role
          </button>
        </div>

        {/* Subscription Status */}
        <motion.div 
          onClick={() => navigate('/partner/subscription')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-[24px] p-5 border border-green-100 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
              <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-green-800 text-[15px] font-medium uppercase tracking-tight">Free Trial</span>
                <ChevronRight size={16} className="text-green-400" />
              </div>
              <div className="text-green-700/60 text-[13px] font-medium mt-0.5">29 days left • 1 listings</div>
            </div>
          </div>
          <ChevronRight className="text-green-300" size={20} />
        </motion.div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 bg-[#001b4e] rounded-full" />
            <h3 className="text-[#001b4e] text-[17px] font-medium tracking-tight">Profile Information</h3>
          </div>
          <div className="space-y-3">
            <InfoField icon={<User className="text-blue-500" size={18} />} label="Full Name" value={partner.name} />
            <InfoField icon={<Mail className="text-indigo-500" size={18} />} label="Email" value={partner.email} />
            <InfoField icon={<Phone className="text-slate-600" size={18} />} label="Phone" value={partner.phone || 'N/A'} />
            {partner.role !== 'agent' && (
              <InfoField icon={<Building2 className="text-slate-500" size={18} />} label="Business Name" value={partner.businessName || 'N/A'} />
            )}
            {partner.role === 'supplier' && (
              <InfoField icon={<Box className="text-orange-500" size={18} />} label="Supplier Categories" value={partner.category || 'N/A'} />
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 bg-[#001b4e] rounded-full" />
            <h3 className="text-[#001b4e] text-[17px] font-medium tracking-tight">Settings</h3>
          </div>
          <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm">
            <SettingsItem 
              icon={<div className="bg-blue-50 p-2.5 rounded-xl text-[#001b4e]"><CreditCard size={18} /></div>} 
              label="Subscription" 
              text="Free Trial • 29 days left" 
              badge="ACTIVE" 
              onClick={() => navigate('/partner/subscription')}
            />
            <SettingsItem 
              icon={<div className="bg-slate-50 p-2.5 rounded-xl text-[#001b4e]"><HelpCircle size={18} /></div>} 
              label="Help & Support" 
              text="Get help with your account" 
              border={true} 
              onClick={() => navigate('/partner/help')}
            />
            <SettingsItem 
              icon={<div className="bg-slate-50 p-2.5 rounded-xl text-[#001b4e]"><Info size={18} /></div>} 
              label="About" 
              text="App version and information" 
              border={false} 
              onClick={() => navigate('/partner/about')}
            />
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-[#ff4d4d] text-white py-5 rounded-[24px] font-medium text-[16px] flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all mt-4"
        >
          <LogOut size={20} className="rotate-180" />
          Logout
        </button>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm px-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LogOut size={32} className="rotate-180" />
                </div>
                <h3 className="text-[#001b4e] text-[22px] font-bold mb-2">Confirm Logout</h3>
                <p className="text-slate-500 text-[15px] mb-8 leading-relaxed px-2">Are you sure you want to logout? You will need to login again to access your partner dashboard.</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-[#ff4d4d] text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Yes, Logout
                  </button>
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="text-slate-400 text-[12px] font-medium tracking-wide">Version 1.0.0</div>
          <div className="text-slate-300 text-[11px] mt-1 font-medium">© 2025 Basera Bazar</div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 flex items-center gap-5 shadow-sm">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">{label}</div>
        <div className="text-[#001b4e] text-[15px] font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, text, badge, border = true, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer ${border ? 'border-b border-slate-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <div className="text-[#001b4e] text-[15px] font-medium">{label}</div>
          <div className="text-slate-400 text-[12px] font-medium mt-0.5">{text}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-green-500 text-white text-[9px] font-medium px-2 py-1 rounded-lg tracking-wider">
            {badge}
          </span>
        )}
        <ChevronRight className="text-slate-300" size={20} />
      </div>
    </div>
  );
}
