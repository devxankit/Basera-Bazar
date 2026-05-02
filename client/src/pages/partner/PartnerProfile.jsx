import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Box, Building2, ChevronRight, 
  User, Mail, Phone, CreditCard, HelpCircle, Info, LogOut, Trash2, Clock, Loader2,
  Trophy, AlertCircle, Shield, Settings, Bell, Star, Zap, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/baseralogo.png';

export default function PartnerProfile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const partner = user;
  const isKYCPending = !partner.kyc?.pan_image || !partner.kyc?.aadhar_front_image;
  const isIncomplete = partner.onboarding_status === 'incomplete' || isKYCPending || !partner.is_active;

  const handleLogout = () => {
    logout();
    navigate('/partner/login');
  };

  const handleDeleteRole = async (roleId) => {
    setDeleting(true);
    try {
      const res = await api.delete('/partners/delete-role', { data: { role: roleId } });
      if (res.data.success) {
        await refreshUser();
        setShowDeleteRoleModal(null);
      }
    } catch (err) {
      console.error("Delete role error:", err);
      alert(err.response?.data?.message || "Failed to delete role.");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleLabel = (roleStr) => {
    const r = (roleStr || '').toLowerCase();
    if (r.includes('agent') || r === 'property_agent') return 'Agent';
    if (r.includes('service') || r === 'service_provider') return 'Service';
    if (r === 'supplier') return 'Supplier';
    if (r.includes('mandi') || r === 'mandi_seller') return 'Mandi';
    return roleStr || 'Partner';
  };

  const partnerRoles = partner.roles && partner.roles.length > 0 
    ? partner.roles 
    : (partner.partner_type ? [partner.partner_type] : [partner.role || 'Partner']);

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-bold text-[#001b4e] uppercase tracking-widest">Profile Hub</h2>
        </div>
        <button 
          onClick={() => navigate('/partner/edit-profile')}
          className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
        >
          <Edit2 size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#001b4e] rounded-full flex items-center justify-center text-white text-[28px] font-bold mb-3 shadow-lg shadow-blue-900/20">
            {partner.name?.charAt(0)}
          </div>
          <h2 className="text-[20px] font-bold text-[#001b4e] uppercase tracking-tight">{partner.name}</h2>
          <div className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mt-0.5">{partner.email}</div>
          <div className="text-slate-400 text-[12px] font-bold uppercase tracking-wider">{partner.phone}</div>
          
          <div className="flex flex-wrap justify-center gap-1.5 mt-5">
            {partnerRoles.map(r => (
              <div key={r} className="bg-slate-50 text-[#001b4e] px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-100 flex items-center gap-2">
                {getRoleLabel(r)}
                {partnerRoles.length > 1 && (
                  <button onClick={() => setShowDeleteRoleModal(r)} className="text-[#001b4e]/30 hover:text-red-500">
                    <Trash2 size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Highlight */}
        {!isIncomplete && (
          <div 
            onClick={() => navigate('/partner/subscription')}
            className="bg-[#001b4e] rounded-2xl p-6 text-white flex items-center justify-between shadow-xl shadow-blue-900/20 relative overflow-hidden active:scale-95 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown size={24} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-[14px] font-bold uppercase tracking-wider opacity-60">Active Plan</div>
                <div className="text-[18px] font-bold">Standard Free</div>
              </div>
            </div>
            <ChevronRight size={24} className="opacity-40" />
          </div>
        )}

        {/* Menu Sections */}
        <div className="space-y-4">
          <SectionTitle title="Business Management" />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <MenuOption icon={<Clock size={20} />} label="Order History" onClick={() => navigate('/partner/mandi/orders-history')} />
            <MenuOption icon={<Trophy size={20} />} label="My Rewards" onClick={() => navigate('/partner/milestones')} />
            <MenuOption icon={<AlertCircle size={20} />} label="Penalties" onClick={() => navigate('/partner/mandi/penalties')} />
            <MenuOption icon={<HelpCircle size={20} />} label="Support Center" onClick={() => navigate('/partner/help')} />
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle title="Account Settings" />
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <MenuOption icon={<User size={20} />} label="Edit Profile" onClick={() => navigate('/partner/edit-profile')} />
            <MenuOption icon={<Zap size={20} />} label="Add or Switch Role" onClick={() => navigate('/partner/add-role')} />
            {partner.kyc?.status !== 'approved' && (
              <MenuOption icon={<Shield size={20} />} label="KYC Documents" onClick={() => {}} />
            )}
            <MenuOption icon={<Bell size={20} />} label="Notifications" onClick={() => navigate('/partner/notifications')} />
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-rose-50 text-rose-600 py-4.5 rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-rose-100 shadow-sm"
        >
          <LogOut size={18} />
          Logout Session
        </button>

        {/* Footer */}
        <div className="text-center pb-12">
          <div className="text-[12px] font-bold text-slate-300 uppercase tracking-[0.3em]">Basera Bazar Partner</div>
          <div className="text-[10px] font-medium text-slate-200 mt-1">Version 2.0.4</div>
        </div>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl">
               <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LogOut size={28} />
               </div>
               <h3 className="text-[#001b4e] text-[20px] font-bold mb-2">Logout?</h3>
               <p className="text-slate-500 text-[14px] mb-8">Are you sure you want to end your current session?</p>
               <div className="flex flex-col gap-3">
                  <button onClick={handleLogout} className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">Yes, Logout</button>
                  <button onClick={() => setShowLogoutModal(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Role Modal */}
      <AnimatePresence>
        {showDeleteRoleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl">
               <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={28} />
               </div>
               <h3 className="text-[#001b4e] text-[20px] font-bold mb-2">Delete Role?</h3>
               <p className="text-slate-500 text-[14px] mb-8">Remove the {getRoleLabel(showDeleteRoleModal)} profile from your account?</p>
               <div className="flex flex-col gap-3">
                  <button onClick={() => handleDeleteRole(showDeleteRoleModal)} disabled={deleting} className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">
                    {deleting ? 'Deleting...' : 'Delete Role'}
                  </button>
                  <button onClick={() => setShowDeleteRoleModal(null)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-all">Keep Role</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="px-1 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{title}</div>
  );
}

function MenuOption({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
    >
      <div className="flex items-center gap-3.5">
        <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-[#001b4e] group-hover:bg-indigo-50 rounded-lg transition-all">{React.cloneElement(icon, { size: 18 })}</div>
        <span className="text-[14px] font-bold text-[#001b4e] uppercase tracking-tight transition-colors">{label}</span>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-[#001b4e] transition-colors" />
    </button>
  );
}
