import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Star,
  Users,
  Mail,
  PlusCircle,
  Plus,
  MessageSquare,
  ChevronRight,
  History,
  TrendingUp,
  AlertCircle,
  XCircle,
  Shield,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/baseralogo.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import KYCModal from '../../components/partner/KYCModal';

export default function PartnerHome() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showKYCModal, setShowKYCModal] = useState(false);

  if (!user) return null;
  const partner = user;
  const actualRole = (partner?.active_role || partner?.partner_type || partner?.role || '').toLowerCase();

  // Account states
  const isApproved = partner.onboarding_status === 'approved';
  const isRejected = partner.onboarding_status === 'rejected';
  const isPending = partner.onboarding_status === 'pending_approval';
  const isKYCPending = !partner.kyc?.pan_image || !partner.kyc?.aadhar_front_image;
  
  // Success banner logic: Show for 24 hours after approval
  const approvedAt = partner.kyc?.reviewed_at;
  const isRecentlyApproved = isApproved && approvedAt && (new Date() - new Date(approvedAt)) < (24 * 60 * 60 * 1000);

  // Account is restricted if not approved
  const isRestricted = !isApproved;
  
  // Incomplete is for initial onboarding (no documents or explicitly incomplete)
  const isIncomplete = (partner.onboarding_status === 'incomplete' || isKYCPending) && !isRejected && !isPending && !isApproved;

  const rejectionMessage = partner.kyc?.rejection_reason || "Your documents were not accepted. Please check the requirements and resubmit.";

  const getRoleLabel = () => {
    if (actualRole.includes('agent')) return 'Agent';
    if (actualRole.includes('service')) return 'Service Provider';
    if (actualRole.includes('supplier')) return 'Supplier';
    if (actualRole.includes('mandi')) return 'Mandi Seller';
    return partner.partner_type || partner.role || 'Partner';
  };

  const getCategoryTheme = () => {
    if (actualRole.includes('agent')) return 'Properties';
    if (actualRole.includes('service')) return 'Services';
    if (actualRole.includes('supplier')) return 'Products';
    if (actualRole.includes('mandi')) return 'Mandi Marketplace';
    return 'Items';
  };

  const overviewStats = [
    { label: 'Total', value: '0', icon: <Building2 size={24} />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Active', value: '0', icon: <CheckCircle2 size={24} />, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Pending', value: '0', icon: <Clock size={24} />, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Featured', value: '0', icon: <Star size={24} />, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Total Leads', value: '0', icon: <Users size={24} />, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { label: 'Unread', value: '0', icon: <Mail size={24} />, color: 'text-red-500', bgColor: 'bg-red-50' },
  ];

  const getAddActionLabel = () => {
    if (actualRole.includes('agent')) return 'Property';
    if (actualRole.includes('service')) return 'Service';
    return 'Product';
  };

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = () => {
      const logs = localStorage.getItem(`baserabazar_activity_${partner._id || partner.id}`);
      if (logs) {
        try {
          const parsed = JSON.parse(logs);
          setRecentActivities(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
        } catch (e) {
          setRecentActivities([]);
        }
      }
    };
    fetchActivities();

    // Listen for custom events if we dispatch them
    window.addEventListener('baserabazar_activity_updated', fetchActivities);
    return () => window.removeEventListener('baserabazar_activity_updated', fetchActivities);
  }, [partner]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'listing': return <Package className="text-blue-500" size={18} />;
      case 'profile': return <Users className="text-purple-500" size={18} />;
      case 'subscription': return <AlertCircle className="text-orange-500" size={18} />;
      case 'inquiry': return <MessageSquare className="text-green-500" size={18} />;
      default: return <History className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-[#001b4e] pt-8 xs:pt-10 sm:pt-12 pb-20 xs:pb-24 px-5 xs:px-6 rounded-b-[32px] xs:rounded-b-[40px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 xs:w-64 xs:h-64 bg-white/5 rounded-full -mr-16 -mt-16 xs:-mr-20 xs:-mt-20 blur-3xl" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="w-12 h-12 xs:w-14 xs:h-14 bg-white rounded-xl xs:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-1 shrink-0">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-white/60 text-[12px] xs:text-[14px]">Good Afternoon</div>
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                <h1 className="text-white text-[18px] xs:text-[22px] font-bold truncate">{partner.name}</h1>
                <span className="bg-white/10 px-2 xs:px-3 py-0.5 xs:py-1 rounded-full text-white/80 text-[9px] xs:text-[11px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-20 space-y-8">
        {/* Success / Recently Verified Banner */}
        {isRecentlyApproved && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 mb-2 bg-[#00a86b] rounded-[32px] p-5 sm:p-8 relative overflow-hidden shadow-2xl shadow-emerald-500/10"
          >
            {/* Decorative background circle */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 sm:mb-5 border border-white/30 shadow-inner">
                <CheckCircle2 size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              
              <h2 className="text-white font-black text-[18px] sm:text-[26px] leading-tight mb-1 sm:mb-2 uppercase tracking-tight">You're Verified!</h2>
              <p className="text-emerald-50/90 font-medium text-[12px] sm:text-[15px] leading-relaxed max-w-[260px] sm:max-w-[280px]">
                Congratulations! Your account is now fully active. You can start listing your properties, products or services.
              </p>
              
              <button 
                onClick={() => {
                  if (actualRole.includes('agent')) navigate('/partner/add-property');
                  else if (actualRole.includes('supplier')) navigate('/partner/add-product');
                  else if (actualRole.includes('mandi')) navigate('/partner/mandi/add-product');
                  else navigate('/partner/add-service');
                }}
                className="mt-5 sm:mt-8 w-full bg-white text-emerald-700 py-3.5 sm:py-4.5 rounded-2xl font-black text-[13px] sm:text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 shadow-xl active:scale-[0.98] transition-all"
              >
                Start Your First Listing
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                  <Plus size={14} sm:size={16} strokeWidth={3} />
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* KYC Rejected Banner */}
        {isRejected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-industrial border border-slate-800 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col gap-5 sm:gap-6 shadow-xl shadow-slate-900/10"
            style={{ backgroundColor: '#0f172a' }} // Deep Midnight
          >
            <div className="flex gap-4 sm:gap-5 items-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-900/20">
                <XCircle size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[18px] sm:text-[20px] font-black text-white tracking-tight leading-tight">KYC Rejected</h3>
                <p className="text-[12px] sm:text-[14px] text-slate-400 font-medium mt-1 sm:mt-1.5 leading-relaxed">{rejectionMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setShowKYCModal(true)}
              className="w-full py-4 sm:py-5 bg-white text-slate-900 rounded-[20px] sm:rounded-[24px] font-black text-[13px] sm:text-[15px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
            >
              Resubmit Documents
            </button>
          </motion.div>
        )}

        {/* KYC Pending/Review Banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col gap-5 sm:gap-6 shadow-2xl shadow-indigo-900/20 relative overflow-hidden group"
          >
            {/* Background Decorative Element */}
            <div className="absolute -right-10 -top-10 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-500/10 rounded-full blur-3xl" />
            
            <div className="flex gap-4 sm:gap-5 items-start relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                <Clock size={24} className="sm:w-7 sm:h-7 animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[18px] sm:text-[20px] font-black text-white tracking-tight leading-tight">Verification in Progress</h3>
                <p className="text-[12px] sm:text-[14px] text-indigo-100/60 font-medium mt-1 sm:mt-1.5 leading-relaxed">Our team is currently reviewing your documents. We'll notify you once your portal is active.</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Reviewing</span>
              </div>
              <div className="text-white/10">
                <Shield size={28} className="sm:w-8 sm:h-8" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Disabled Banner */}
        {isIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col gap-5 sm:gap-6 shadow-xl shadow-slate-200/50 group active:scale-[0.99] transition-all"
          >
            <div className="flex gap-4 sm:gap-5 items-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200 group-hover:rotate-12 transition-transform">
                <AlertCircle size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[18px] sm:text-[20px] font-black text-slate-900 tracking-tight leading-tight">Action Required</h3>
                <p className="text-[12px] sm:text-[14px] text-slate-500 font-medium mt-1 sm:mt-1.5 leading-relaxed">Your account is currently inactive. Complete your KYC verification to unlock all features.</p>
              </div>
            </div>
            <button
              onClick={() => setShowKYCModal(true)}
              className="w-full py-4 sm:py-5 bg-rose-500 text-white rounded-[20px] sm:rounded-[24px] font-black text-[13px] sm:text-[15px] uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3"
            >
              Start Verification
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
        {/* Role Switcher — shown only when partner has multiple roles */}
        {(partner?.roles?.length > 1 || true) && (
          <RoleSwitcher
            roles={partner?.roles || (partner?.partner_type ? [partner.partner_type] : [])}
            activeRole={actualRole}
            partnerId={partner?._id || partner?.id}
            isApproved={isApproved}
          />
        {/* Subscription Card */}
        {isApproved && (
          <motion.div
            onClick={() => navigate('/partner/subscription')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 xs:p-5 mm:p-6 rounded-[24px] xs:rounded-[32px] mm:rounded-[40px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 xs:gap-4 mm:gap-5 min-w-0">
              <div className="w-10 h-10 xs:w-12 xs:h-12 mm:w-14 mm:h-14 bg-green-50 rounded-xl xs:rounded-2xl flex items-center justify-center text-green-500 shadow-inner shrink-0 relative">
                <CheckCircle2 size={20} fill="currentColor" className="text-white xs:w-6 xs:h-6" />
                <CheckCircle2 size={24} className="absolute opacity-100 xs:w-7 xs:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] xs:text-[15px] mm:text-[19px] font-black text-[#001b4e] truncate pr-2 uppercase tracking-tight">
                  {partner.plan === 'free' ? 'Free Trial Plan' : 'Pre-launching Offer'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 xs:gap-x-3 gap-y-0.5 mt-0.5 mm:mt-1">
                  <div className="flex items-center gap-1 xs:gap-1.5 text-slate-400 text-[10px] xs:text-[11px] mm:text-[13px] font-bold">
                    <Clock size={11} className="text-green-500 xs:w-[13px] xs:h-[13px]" />
                    29 days left
                  </div>
                  <div className="hidden xs:block w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="flex items-center gap-1 xs:gap-1.5 text-slate-400 text-[10px] xs:text-[11px] mm:text-[13px] font-bold">
                    <PlusCircle size={11} className="text-blue-500 xs:w-[13px] xs:h-[13px]" />
                    1 available
                  </div>
                </div>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-[#001b4e] group-hover:translate-x-1 transition-all shrink-0" size={18} />
          </motion.div>
        )}

        {/* Overview Section */}
        {actualRole.includes('mandi') ? (
          <MandiOverview partner={partner} isRestricted={isRestricted} />
        ) : (
          <div className="space-y-4 xs:space-y-5">
            <h2 className="text-[16px] xs:text-[18px] mm:text-[20px] font-black text-[#001b4e] px-1 uppercase tracking-tight">{getCategoryTheme()} Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4 mm:gap-5">
              {overviewStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-3 xs:p-4 mm:p-5 rounded-[20px] xs:rounded-[24px] mm:rounded-[28px] shadow-sm border border-slate-50 flex flex-col items-center text-center group active:scale-95 transition-all"
                >
                  <div className={`w-8 h-8 xs:w-10 xs:h-10 mm:w-12 mm:h-12 ${stat.bgColor} ${stat.color} rounded-full flex items-center justify-center mb-2 xs:mb-2.5 mm:mb-3 shadow-inner`}>
                    {React.cloneElement(stat.icon, { size: 18 })}
                  </div>
                  <div className="text-[16px] xs:text-[18px] mm:text-[20px] font-black text-[#001b4e] mb-0.5">{stat.value}</div>
                  <div className="text-[9px] xs:text-[10px] mm:text-[12px] font-black text-slate-400 uppercase tracking-tighter mm:tracking-tight leading-none">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-5">
          <h2 className="text-[20px] font-medium text-[#001b4e] px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => {
                if (isApproved) {
                  if (actualRole.includes('agent')) navigate('/partner/add-property');
                  else if (actualRole.includes('supplier')) navigate('/partner/add-product');
                  else if (actualRole.includes('mandi')) navigate('/partner/mandi/add-product');
                  else navigate('/partner/add-service');
                } else if (isPending) {
                  alert("Your application is currently under review. Please wait for approval to add new listings.");
                } else {
                  setShowKYCModal(true);
                }
              }}
              className={`bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-start text-left group active:scale-95 transition-all w-full relative overflow-hidden ${isRestricted ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              {isRestricted && (
                <div className="absolute top-4 right-4 text-slate-300">
                  <AlertCircle size={20} />
                </div>
              )}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner ${isIncomplete ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-[#001b4e]'}`}>
                <PlusCircle size={24} />
              </div>
              <h4 className="text-[17px] font-medium text-[#001b4e] mb-1">Add {getAddActionLabel()}</h4>
              <p className="text-[13px] font-normal text-slate-400 leading-snug">{isIncomplete ? 'KYC Required' : 'Create new listing'}</p>
            </button>
            <button
              onClick={() => {
                if (isApproved) {
                  navigate('/partner/leads');
                } else if (isPending) {
                  alert("Your application is currently under review. Inquiries will be available once approved.");
                } else {
                  setShowKYCModal(true);
                }
              }}
              className={`bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-start text-left group active:scale-95 transition-all ${isRestricted ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner ${isRestricted ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 text-purple-600'}`}>
                <Mail size={24} />
              </div>
              <h4 className="text-[17px] font-medium text-[#001b4e] mb-1">Inquiries</h4>
              <p className="text-[13px] font-normal text-slate-400 leading-snug">{isIncomplete ? 'KYC Required' : 'View messages'}</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-5 pb-10">
          <h2 className="text-[20px] font-medium text-[#001b4e] px-1 flex items-center gap-2">
            <History size={20} className="text-[#001b4e]" />
            Recent Activity
          </h2>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 space-y-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
                <div key={idx} className={`flex items-start gap-4 ${idx !== recentActivities.length - 1 ? 'border-b border-slate-50 pb-5' : ''}`}>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="text-[14px] font-medium text-[#001b4e] leading-snug">{activity.title}</div>
                    <div className="text-[12px] font-normal text-slate-400 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-10 text-slate-300">
                <History size={48} className="mb-4 opacity-10" />
                <span className="text-[15px] font-bold">No recent activity</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <KYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        user={partner}
        onComplete={() => refreshUser && refreshUser()}
      />
    </div>
  );
}

function RoleSwitcher({ roles, activeRole, partnerId, isApproved }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const roleLabels = {
    'property_agent': { label: 'Agent', icon: <Building2 size={16} /> },
    'service_provider': { label: 'Service', icon: <Star size={16} /> },
    'supplier': { label: 'Supplier', icon: <Package size={16} /> },
    'mandi_seller': { label: 'Mandi', icon: <Package size={16} /> },
  };

  const handleSwitch = async (role) => {
    if (role === activeRole) return;
    try {
      await api.put('/partners/switch-role', { role });
      // Refresh user data from backend
      if (refreshUser) {
        await refreshUser();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Switch role error:', err);
    }
  };

  const safeRoles = roles && roles.length > 0 ? roles : ['property_agent'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
    >
      {safeRoles.map((role) => {
        const isActive = activeRole.includes(role.replace('_', ''));
        const meta = roleLabels[role] || { label: role, icon: null };
        return (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            className={`flex items-center gap-2 px-4 py-3 rounded-[22px] text-[13px] font-bold transition-all whitespace-nowrap ${isActive
                ? 'bg-[#001b4e] text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            {meta.icon}
            {meta.label}
          </button>
        );
      })}

      {/* Add Role Button */}
      {isApproved && (
        <button
          onClick={() => navigate('/partner/add-role')}
          className="flex items-center gap-1.5 px-3 py-3 rounded-[22px] text-[13px] font-bold text-blue-500 hover:bg-blue-50 transition-all whitespace-nowrap border border-dashed border-blue-200"
        >
          <PlusCircle size={16} />
          Add
        </button>
      )}
    </motion.div>
  );
}

function MandiOverview({ partner, isRestricted }) {
  const navigate = useNavigate();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/mandi/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const mandiStats = [
    { label: 'Active Products', value: stats?.active_products || '0', icon: <Package size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-50', path: '/partner/mandi/inventory' },
    { label: 'Total Orders', value: stats?.total_orders || '0', icon: <TrendingUp size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-50', path: '/partner/mandi/orders' },
    { label: 'Penalty Due', value: `₹${stats?.penalty_due || 0}`, icon: <AlertCircle size={20} />, color: 'text-rose-600', bgColor: 'bg-rose-50', path: '/partner/mandi/penalties' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-[#001b4e] p-6 rounded-[32px] text-white shadow-xl shadow-indigo-900/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Mandi Seller Account</p>
              <h2 className="text-[28px] font-bold">Penalty Score: ₹{stats?.penalty_due || 0}</h2>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <AlertCircle className={stats?.penalty_due > 0 ? "text-rose-400" : "text-green-400"} size={24} />
            </div>
          </div>
          <p className="text-white/40 text-[11px] leading-tight">
            Penalties are applied if you cancel an active lead. High penalty scores may lead to account suspension.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mandiStats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center text-center active:scale-95 transition-all"
          >
            <div className={`w-10 h-10 ${stat.bgColor} ${stat.color} rounded-full flex items-center justify-center mb-2`}>
              {stat.icon}
            </div>
            <div className="text-[16px] font-bold text-[#001b4e]">{stat.value}</div>
            <div className="text-[10px] font-medium text-slate-400 uppercase leading-tight">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Mandi Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-[#001b4e] px-1">Marketplace Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => {
              if (isApproved) {
                navigate('/partner/mandi/add-product');
              } else if (isPending) {
                alert("Your application is currently under review. Material listing will be enabled once approved.");
              } else {
                setShowKYCModal(true);
              }
            }} 
            className={`bg-[#001b4e] p-5 rounded-3xl text-white flex flex-col items-center gap-2 shadow-lg shadow-indigo-900/10 active:scale-95 transition-all ${isRestricted ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            <PlusCircle size={24} />
            <span className="text-[14px] font-bold">List Material</span>
          </button>
          <button 
            onClick={() => {
              if (isApproved) {
                navigate('/partner/mandi/inventory');
              } else if (isPending) {
                alert("Your application is currently under review. Stock management will be enabled once approved.");
              } else {
                setShowKYCModal(true);
              }
            }} 
            className={`bg-white p-5 rounded-3xl border border-slate-100 text-[#001b4e] flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all ${isRestricted ? 'opacity-60 grayscale-[0.5]' : ''}`}
          >
            <Package size={24} />
            <span className="text-[14px] font-bold">Manage Stock</span>
          </button>
        </div>
      </div>
      <KYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        user={partner}
      />
    </div>
  );
}
