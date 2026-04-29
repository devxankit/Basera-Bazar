import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Box, Building2, ChevronRight, 
  User, Mail, Phone, CreditCard, HelpCircle, Info, LogOut, Trash2, Clock, Loader2,
  Trophy, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PartnerProfile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // If no user is logged in, we shouldn't even be here
  useEffect(() => {
    if (!user) {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // For compatibility with the existing UI code, we map 'user' to 'partner'
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
      <div className="px-5 py-3 flex items-center justify-between sticky top-0 bg-white z-50 border-b border-slate-50">
        <button 
          onClick={() => navigate('/partner/home')}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-[18px] font-bold text-[#001b4e] uppercase tracking-tight">Profile</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 pt-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#001b4e] rounded-2xl xs:rounded-[24px] p-5 xs:p-6 flex flex-col items-center text-center shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mt-12 blur-2xl" />
          
          <div className="relative mb-3 xs:mb-4">
            <div className="w-16 h-16 xs:w-20 xs:h-20 bg-white rounded-full flex items-center justify-center text-[24px] xs:text-[32px] font-bold text-[#001b4e] shadow-lg border-2 xs:border-4 border-white/10">
              {partner.name?.charAt(0) || 'U'}
            </div>
            <button 
              onClick={() => navigate('/partner/edit-profile')}
              className="absolute bottom-0 right-0 w-6 h-6 xs:w-7 xs:h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 xs:border-4 border-[#001b4e] shadow-lg text-white active:scale-95 transition-all"
            >
              <Edit2 size={10} fill="currentColor" />
            </button>
          </div>

          <h2 className="text-white text-[18px] xs:text-[22px] font-bold mb-0.5 tracking-tight uppercase leading-tight">{partner.name}</h2>
          <p className="text-white/50 text-[11px] xs:text-[13px] font-medium uppercase tracking-widest mb-4 xs:mb-6">{partner.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 xs:gap-2">
            {partnerRoles.map(r => (
              <div key={r} className="bg-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-white/10 backdrop-blur-md relative group">
                <Building2 size={10} className="text-white/80" />
                <span className="text-white text-[9px] xs:text-[10px] font-medium tracking-widest uppercase">{getRoleLabel(r)}</span>
                {partnerRoles.length > 1 && (
                  <button 
                    onClick={() => setShowDeleteRoleModal(r)}
                    className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pending Roles */}
          {partner.role_requests?.some(r => r.status === 'pending') && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 opacity-60">
              {partner.role_requests.filter(r => r.status === 'pending').map(req => (
                <div key={req.role} className="bg-amber-500/10 px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-amber-500/20 backdrop-blur-md">
                  <Clock size={10} className="text-amber-500" />
                  <span className="text-amber-500 text-[8px] xs:text-[9px] font-bold tracking-widest uppercase">
                    {getRoleLabel(req.role)} (PENDING)
                  </span>
                </div>
              ))}
            </div>
          )}


        </div>

        {/* Subscription Status */}
        {!isIncomplete && (
          <motion.div 
            onClick={() => navigate('/partner/subscription')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-2xl p-4 sm:p-5 border border-green-100 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 shrink-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-green-800 text-[14px] sm:text-[15px] font-medium uppercase tracking-tight">Free Trial</span>
                  <ChevronRight size={14} className="text-green-400 sm:w-4 sm:h-4" />
                </div>
                <div className="text-green-700/60 text-[12px] sm:text-[13px] font-medium mt-0.5">29 days left • 1 listings</div>
              </div>
            </div>
            <ChevronRight className="text-green-300" size={18} />
          </motion.div>
        )}

        {/* Category Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-[#001b4e] rounded-full" />
            <h3 className="text-[#001b4e] text-[15px] font-black uppercase tracking-tight">Partner Dashboard</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Subscription */}
            {!isIncomplete && (
              <CategoryButton 
                icon={<CreditCard size={22} />}
                label="Subscription"
                subLabel="Active Plan"
                color="blue"
                onClick={() => navigate('/partner/subscription')}
              />
            )}
            
            {/* Order History */}
            <CategoryButton 
              icon={<Clock size={22} />}
              label="Order History"
              subLabel="Sales Data"
              color="indigo"
              onClick={() => navigate('/partner/mandi/orders-history')}
            />

            {/* Milestones */}
            <CategoryButton 
              icon={<Trophy size={22} />}
              label="Rewards"
              subLabel="Milestones"
              color="amber"
              onClick={() => navigate('/partner/milestones')}
            />

            {/* Penalties */}
            <CategoryButton 
              icon={<AlertCircle size={22} />}
              label="Penalties"
              subLabel="Account Health"
              color="rose"
              onClick={() => navigate('/partner/mandi/penalties')}
            />

            {/* Help */}
            <CategoryButton 
              icon={<HelpCircle size={22} />}
              label="Support"
              subLabel="Get Help"
              color="slate"
              onClick={() => navigate('/partner/help')}
            />

            {/* About */}
            <CategoryButton 
              icon={<Info size={22} />}
              label="About"
              subLabel="App Info"
              color="slate"
              onClick={() => navigate('/partner/about')}
            />
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-white border border-slate-200 text-slate-500 py-4.5 rounded-[24px] font-bold text-[14px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all mt-6 shadow-sm hover:bg-red-50 hover:text-red-500 hover:border-red-100"
        >
          <LogOut size={18} className="rotate-180" />
          LOGOUT SESSION
        </button>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LogOut size={28} className="rotate-180" />
                </div>
                <h3 className="text-[#001b4e] text-[20px] font-bold mb-2 uppercase tracking-tight">Confirm Logout</h3>
                <p className="text-slate-500 text-[14px] mb-8 leading-relaxed uppercase tracking-tight opacity-60">Are you sure you want to logout? You will need to login again to access your dashboard.</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-[#ff4d4d] text-white py-4 rounded-2xl font-bold text-[14px] shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Yes, Logout
                  </button>
                  <button 
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-[14px] active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Role Modal */}
        <AnimatePresence>
          {showDeleteRoleModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#001b4e]/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-[#001b4e] text-[20px] font-bold mb-2 uppercase tracking-tight">Delete Role?</h3>
                <p className="text-slate-500 text-[14px] mb-8 leading-relaxed uppercase tracking-tight opacity-60">
                  Are you sure you want to remove the <span className="text-[#001b4e] font-bold">{getRoleLabel(showDeleteRoleModal)}</span> role? 
                  Once deleted, you will need admin permission and re-verification to add it back.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    disabled={deleting}
                    onClick={() => handleDeleteRole(showDeleteRoleModal)}
                    className="w-full bg-[#ff4d4d] text-white py-4 rounded-2xl font-bold text-[14px] shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Delete'}
                  </button>
                  <button 
                    disabled={deleting}
                    onClick={() => setShowDeleteRoleModal(null)}
                    className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-[14px] active:scale-95 transition-all uppercase tracking-widest"
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

function CategoryButton({ icon, label, subLabel, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-[32px] border flex flex-col items-start gap-4 active:scale-95 transition-all text-left relative overflow-hidden group ${colorMap[color] || colorMap.slate}`}
    >
      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm relative z-10 transition-transform group-hover:scale-110">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="relative z-10">
        <div className="text-[14px] font-black uppercase tracking-tight leading-none mb-1">{label}</div>
        <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{subLabel}</div>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {React.cloneElement(icon, { size: 80 })}
      </div>
    </button>
  );
}
