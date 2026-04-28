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
  Package,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/baseralogo.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import KYCModal from '../../components/partner/KYCModal';
import { Skeleton } from '../../components/common/Skeleton';

export default function PartnerHome() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    listings: { total: 0, active: 0, pending: 0, featured: 0 },
    leads: { total: 0, unread: 0 }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/partners/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
    { label: 'Total', value: stats.listings.total, icon: <Building2 size={24} />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Active', value: stats.listings.active, icon: <CheckCircle2 size={24} />, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Pending', value: stats.listings.pending, icon: <Clock size={24} />, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: 'Featured', value: stats.listings.featured, icon: <Star size={24} />, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { label: 'Total Leads', value: stats.leads.total, icon: <Users size={24} />, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { label: 'Unread', value: stats.leads.unread, icon: <Mail size={24} />, color: 'text-red-500', bgColor: 'bg-red-50' },
  ];

  const getAddActionLabel = () => {
    if (actualRole.includes('agent')) return 'Property';
    if (actualRole.includes('service')) return 'Service';
    if (actualRole.includes('mandi')) return 'Material';
    return 'Listing';
  };

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = () => {
      const logs = localStorage.getItem(`baserabazar_activity_${partner._id || partner.id}`);
      if (logs) {
        try {
          const parsed = JSON.parse(logs);
          // Deduplicate "Account Registered" and other activities by title
          const uniqueActivities = [];
          const seenTitles = new Set();
          for (const activity of parsed) {
            if (!seenTitles.has(activity.title)) {
              seenTitles.add(activity.title);
              uniqueActivities.push(activity);
            }
          }
          setRecentActivities(uniqueActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
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
      <div className="bg-[#001b4e] pt-6 xs:pt-7 sm:pt-8 pb-14 xs:pb-18 px-5 xs:px-6 rounded-b-[24px] xs:rounded-b-[32px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 xs:w-48 xs:h-48 bg-white/5 rounded-full -mr-12 -mt-12 xs:-mr-16 xs:-mt-16 blur-3xl" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5 xs:gap-3">
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-white rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1 shrink-0">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-white/50 text-[10px] xs:text-[12px] font-bold uppercase tracking-widest leading-none mb-0.5">Partner Portal</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-white text-[16px] xs:text-[19px] font-bold truncate leading-tight uppercase tracking-tight">{partner.name}</h1>
                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white/70 text-[8px] xs:text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 xs:px-6 -mt-10 xs:-mt-14 relative z-20 space-y-4 xs:space-y-6">
        {/* Success / Recently Verified Banner */}
        {isRecentlyApproved && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#00a86b] rounded-2xl xs:rounded-[24px] p-4 xs:p-6 relative overflow-hidden shadow-xl shadow-emerald-500/10"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-10 h-10 xs:w-12 xs:h-12 bg-white/20 backdrop-blur-md rounded-xl xs:rounded-2xl flex items-center justify-center mb-2 xs:mb-3 border border-white/30 shadow-inner">
                <CheckCircle2 size={20} className="text-white xs:w-6 xs:h-6" />
              </div>
              
              <h2 className="text-white font-bold text-[15px] xs:text-[18px] leading-tight mb-0.5 xs:mb-1 uppercase tracking-tight">Verified</h2>
              <p className="text-emerald-50/80 font-semibold text-[10px] xs:text-[12px] leading-tight max-w-[240px] uppercase tracking-wider">
                Account is active. Start listing now.
              </p>
              
                {/* Only show Add Listing if NOT a supplier */}
                {!actualRole.includes('supplier') && (
                  <button 
                    onClick={() => {
                      if (actualRole.includes('agent')) navigate('/partner/add-property');
                      else if (actualRole.includes('mandi')) navigate('/partner/mandi/add-product');
                      else navigate('/partner/add-service');
                    }}
                    className="mt-3 xs:mt-4 w-full bg-white text-emerald-700 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl font-bold text-[11px] xs:text-[13px] uppercase tracking-widest flex items-center justify-center gap-1.5 xs:gap-2 shadow-lg active:scale-[0.98] transition-all"
                  >
                    Add Listing
                    <Plus size={12} strokeWidth={4} />
                  </button>
                )}
              </div>
            </motion.div>
        )}

        {/* KYC Rejected Banner */}
        {isRejected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-5 shadow-xl shadow-slate-900/10"
          >
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-900/20">
                <XCircle size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[18px] font-bold text-white tracking-tight leading-tight uppercase">KYC Rejected</h3>
                <p className="text-[12px] text-slate-400 font-medium mt-1 leading-relaxed">{rejectionMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setShowKYCModal(true)}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-[13px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
            >
              Resubmit Documents
            </button>
          </motion.div>
        )}
        {/* Role Rejected Banner */}
        {user?.role_requests?.some(r => {
          const isRejected = r.status === 'rejected';
          const isActive = partner.roles?.includes(r.role);
          const hasNewerPending = user.role_requests.some(pr => pr.role === r.role && pr.status === 'pending');
          return isRejected && !isActive && !hasNewerPending;
        }) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border-2 border-rose-100 rounded-2xl xs:rounded-[24px] p-4 xs:p-5 relative overflow-hidden"
          >
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                <XCircle size={20} />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-[15px] font-bold text-rose-900 tracking-tight leading-tight uppercase">Upgrade Rejected</h3>
                <div className="space-y-1 mt-1">
                  {user.role_requests
                    .filter(r => {
                      const isRejected = r.status === 'rejected';
                      const isActive = partner.roles?.includes(r.role);
                      const hasNewerPending = user.role_requests.some(pr => pr.role === r.role && pr.status === 'pending');
                      return isRejected && !isActive && !hasNewerPending;
                    })
                    .map((r, i) => (
                    <div key={i} className="text-[10px] text-rose-600 font-bold uppercase tracking-wide">
                      <span className="underline mr-1">{r.role.replace('_', ' ')}</span>: 
                      <span className="text-rose-500 font-medium ml-1 normal-case">{r.rejection_reason || 'Documents were not accepted.'}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/partner/add-role')}
                  className="mt-3 text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1"
                >
                  Try Again <Plus size={10} strokeWidth={4} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Role Pending Approval Banner */}
        {user?.role_requests?.some(r => r.status === 'pending') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#001b4e] rounded-2xl xs:rounded-[24px] p-4 xs:p-5 relative overflow-hidden shadow-xl shadow-blue-900/20 border border-white/10"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-10 h-10 xs:w-11 xs:h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-2 xs:mb-3 border border-white/20 shadow-inner">
                <Clock size={18} className="text-blue-400" />
              </div>
              
              <h2 className="text-white font-bold text-[14px] xs:text-[16px] leading-tight mb-0.5 xs:mb-1 uppercase tracking-tight">Role Under Review</h2>
              <p className="text-white/60 font-medium text-[9px] xs:text-[11px] leading-tight max-w-[260px] uppercase tracking-wider">
                We are verifying your GST documents for the 
                <span className="text-blue-400 mx-1">
                  {user.role_requests.filter(r => r.status === 'pending').map(r => r.role.replace('_', ' ')).join(', ')}
                </span> 
                role.
              </p>
            </div>
          </motion.div>
        )}

        {/* KYC Pending/Review Banner */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-5 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                <Clock size={22} className="animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight uppercase">Under Review</h3>
                <p className="text-[11px] text-indigo-100/60 font-semibold mt-1 leading-relaxed">Our team is reviewing your documents. We'll notify you soon.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Account Disabled Banner */}
        {isIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 p-4 xs:p-5 rounded-2xl xs:rounded-[24px] flex flex-col gap-4 shadow-sm active:scale-[0.99] transition-all group"
          >
            <div className="flex gap-3 xs:gap-4 items-start">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                <AlertCircle size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight uppercase">Action Required</h3>
                <p className="text-[10px] xs:text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Account inactive. Complete KYC to start.</p>
              </div>
            </div>
            <button
              onClick={() => setShowKYCModal(true)}
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-[11px] xs:text-[12px] uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              Verify Identity
              <ChevronRight size={14} />
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
            user={partner}
          />
        )}
        {/* Subscription Card */}
        {isApproved && (
          <motion.div
            onClick={() => navigate('/partner/subscription')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-3.5 xs:p-4.5 rounded-[20px] xs:rounded-[28px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 xs:gap-4 min-w-0">
              <div className="w-9 h-9 xs:w-11 xs:h-11 bg-green-50 rounded-lg xs:rounded-xl flex items-center justify-center text-green-500 shadow-inner shrink-0">
                <CheckCircle2 size={18} xs:size={22} fill="currentColor" className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[12px] xs:text-[14px] mm:text-[16px] font-bold text-[#001b4e] truncate pr-2 uppercase tracking-tight leading-none">
                  {partner.active_subscription_id?.plan_snapshot?.name || (partner.plan === 'free' ? 'Free Trail' : 'Free Trail')}
                </h3>
                <div className="flex items-center gap-2 xs:gap-3 mt-1 xs:mt-1.5">
                  <div className="flex items-center gap-1 text-slate-400 text-[9px] xs:text-[10px] mm:text-[12px] font-bold">
                    <Clock size={10} className="text-green-500" />
                    29 days left
                  </div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                  <div className="flex items-center gap-1 text-slate-400 text-[9px] xs:text-[10px] mm:text-[12px] font-bold">
                    <PlusCircle size={10} className="text-blue-500" />
                    1 available
                  </div>
                </div>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-[#001b4e] group-hover:translate-x-1 transition-all shrink-0" size={16} />
          </motion.div>
        )}

        {/* Overview Section */}
        {actualRole.includes('mandi') ? (
          <MandiOverview partner={partner} isRestricted={isRestricted} />
        ) : (
          <div className="space-y-4 xs:space-y-5">
            <h2 className="text-[15px] xs:text-[17px] font-bold text-[#001b4e] px-1 uppercase tracking-tight opacity-70">{getCategoryTheme()} Overview</h2>
            <Skeleton name="partner-overview-stats" loading={loading}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4 mm:gap-5">
                {overviewStats
                  .filter(stat => {
                    if (actualRole.includes('supplier')) {
                      return stat.label.toLowerCase().includes('lead') || stat.label.toLowerCase().includes('unread');
                    }
                    return true;
                  })
                  .map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-2.5 xs:p-4 rounded-xl xs:rounded-2xl shadow-sm border border-slate-50 flex flex-col items-center text-center group active:scale-95 transition-all"
                  >
                    <div className={`w-7 h-7 xs:w-9 xs:h-9 ${stat.bgColor} ${stat.color} rounded-full flex items-center justify-center mb-1.5 xs:mb-2 shadow-inner`}>
                      {React.cloneElement(stat.icon, { size: 14 })}
                    </div>
                    <div className="text-[13px] xs:text-[17px] font-bold text-[#001b4e] mb-0.5 leading-none">{stat.value}</div>
                    <div className="text-[7px] xs:text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-none">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </Skeleton>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3 xs:space-y-4">
          <h2 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] px-1 uppercase tracking-tight opacity-70">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 xs:gap-4">
            {!actualRole.includes('supplier') ? (
              <button
                onClick={() => {
                  if (isApproved) {
                    if (actualRole.includes('agent')) navigate('/partner/add-property');
                    else if (actualRole.includes('mandi')) navigate('/partner/mandi/add-product');
                    else navigate('/partner/add-service');
                  } else if (isPending) {
                    alert("Your application is currently under review.");
                  } else {
                    setShowKYCModal(true);
                  }
                }}
                className={`bg-white p-3.5 xs:p-4.5 rounded-2xl xs:rounded-[24px] shadow-sm border border-slate-50 flex flex-col items-start text-left group active:scale-95 transition-all w-full relative overflow-hidden ${isRestricted ? 'opacity-60' : ''}`}
              >
                <div className={`w-8 h-8 xs:w-9 xs:h-9 bg-blue-50 text-[#001b4e] rounded-xl flex items-center justify-center mb-2.5 xs:mb-3 shadow-inner`}>
                  <PlusCircle size={18} />
                </div>
                <h4 className="text-[12px] xs:text-[14px] font-bold text-[#001b4e] mb-0.5 uppercase tracking-tight leading-none">Add {getAddActionLabel()}</h4>
                <p className="text-[7px] xs:text-[9px] font-medium text-slate-400 leading-none uppercase tracking-widest">{isIncomplete ? 'KYC Required' : 'Create new'}</p>
              </button>
            ) : (
              /* Feature Yourself button for Suppliers */
              <button
                onClick={async () => {
                  if (!isApproved) {
                    alert("Please complete verification to use this feature.");
                    return;
                  }
                  try {
                    const res = await api.put('/partners/toggle-feature');
                    if (res.data.success) {
                      await refreshUser();
                      alert(res.data.message);
                    }
                  } catch (err) {
                    console.error("Feature toggle error:", err);
                  }
                }}
                className={`bg-white p-3.5 xs:p-4.5 rounded-2xl xs:rounded-[24px] shadow-sm border border-slate-50 flex flex-col items-start text-left group active:scale-95 transition-all w-full relative overflow-hidden ${isRestricted ? 'opacity-60' : ''}`}
              >
                <div className={`w-8 h-8 xs:w-9 xs:h-9 ${partner.is_featured ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500'} rounded-xl flex items-center justify-center mb-2.5 xs:mb-3 shadow-inner transition-colors`}>
                  <Star size={18} fill={partner.is_featured ? "currentColor" : "none"} />
                </div>
                <h4 className="text-[12px] xs:text-[14px] font-bold text-[#001b4e] mb-0.5 uppercase tracking-tight leading-none">
                  {partner.is_featured ? 'Featured' : 'Feature Self'}
                </h4>
                <p className="text-[7px] xs:text-[9px] font-medium text-slate-400 leading-none uppercase tracking-widest">
                  {partner.is_featured ? 'Listing active' : 'Get showcased'}
                </p>
                {partner.is_featured && (
                   <div className="absolute top-0 right-0 p-2">
                     <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                   </div>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (isApproved) {
                  navigate('/partner/leads');
                } else if (isPending) {
                  alert("Your application is currently under review.");
                } else {
                  setShowKYCModal(true);
                }
              }}
              className={`bg-white p-3.5 xs:p-4.5 rounded-2xl xs:rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-start text-left group active:scale-95 transition-all ${isRestricted ? 'opacity-60' : ''}`}
            >
              <div className={`w-8 h-8 xs:w-9 xs:h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2.5 xs:mb-3 shadow-inner`}>
                <Mail size={18} />
              </div>
              <h4 className="text-[12px] xs:text-[14px] font-bold text-[#001b4e] mb-0.5 uppercase tracking-tight leading-none">Inquiries</h4>
              <p className="text-[7px] xs:text-[9px] font-medium text-slate-400 leading-none uppercase tracking-widest">{isIncomplete ? 'KYC Required' : 'View leads'}</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 xs:space-y-4 pb-6">
          <h2 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] px-1 flex items-center gap-2 uppercase tracking-tight opacity-70">
            <History size={16} className="text-[#001b4e]" />
            Recent Activity
          </h2>
          <Skeleton name="partner-recent-activity" loading={loading}>
            <div className="bg-white rounded-[24px] xs:rounded-[28px] p-4 xs:p-5 shadow-sm border border-slate-50 space-y-4 xs:space-y-5">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <div key={idx} className={`flex items-start gap-3 xs:gap-4 ${idx !== recentActivities.length - 1 ? 'border-b border-slate-50 pb-4 xs:pb-5' : ''}`}>
                    <div className="w-8 h-8 xs:w-9 xs:h-9 bg-slate-50 rounded-lg xs:rounded-xl flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="text-[13px] xs:text-[14px] font-bold text-[#001b4e] leading-tight truncate pr-2">{activity.title}</div>
                      <div className="text-[10px] xs:text-[11px] font-medium text-slate-400 mt-0.5 xs:mt-1 uppercase tracking-wider">{activity.time}</div>
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
          </Skeleton>
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

function RoleSwitcher({ roles, activeRole, partnerId, isApproved, user }) {
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
      className="bg-white rounded-xl xs:rounded-2xl p-1.5 shadow-sm border border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar"
    >
      {safeRoles.map((role) => {
        const isActive = activeRole === role || activeRole === role.replace('_', '');
        const meta = roleLabels[role] || { label: role, icon: null };
        return (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap uppercase tracking-tight relative ${isActive
                ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20 ring-2 ring-indigo-900/10 scale-[1.02]'
                : 'text-slate-400 hover:bg-slate-50 border border-transparent'
              }`}
          >
            {isActive && (
              <motion.div 
                layoutId="activeRoleIndicator"
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
              >
                <Check size={8} strokeWidth={4} className="text-white" />
              </motion.div>
            )}
            {meta.icon && React.cloneElement(meta.icon, { size: 14, className: isActive ? 'text-blue-300' : 'text-slate-400' })}
            {meta.label}
          </button>
        );
      })}

      {/* Add Role Button - Only show if there are roles left to add (not active and not pending) */}
      {isApproved && (roles.length < 4 && !user?.role_requests?.some(r => r.status === 'pending' && !roles.includes(r.role))) && (
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

      <Skeleton name="mandi-overview-stats" loading={loading}>
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
      </Skeleton>

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
