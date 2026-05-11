import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreVertical,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, BarChart3,
  Package, Store, ShieldCheck, Globe, Zap, FileText, ExternalLink,
  UserMinus, UserCheck, Trash2, Landmark, Building2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false, type: 'danger' });

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await api.get(`/admin/users/${id}`);
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        setError("User profile not found in database.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetail();
  }, [id]);

  const openConfirm = (title, message, action, type = 'danger') => {
    setConfirmModal({ isOpen: true, title, message, action, loading: false, type });
  };

  const executeConfirm = async () => {
    setConfirmModal(m => ({ ...m, loading: true }));
    try {
      await confirmModal.action();
    } finally {
      setConfirmModal(m => ({ ...m, isOpen: false, loading: false }));
    }
  };

  const handleToggleStatus = () => {
    const newActive = !user.is_active;
    const action = newActive ? 'activate' : 'deactivate';
    openConfirm(
      `${newActive ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${action} this user?`,
      async () => {
        const updateData = { is_active: newActive };
        if (newActive && isPartner) {
          updateData.onboarding_status = 'approved';
          updateData['kyc.status'] = 'approved';
          updateData['kyc.reviewed_at'] = new Date().toISOString();
        }
        const res = await api.put(`/admin/users/${id}`, updateData);
        if (res.data.success) {
          setUser({ ...user, ...updateData });
          toast.success(`User ${action}d successfully`);
          setShowOptions(false);
        }
      },
      newActive ? 'info' : 'warning'
    );
  };

  const handleDeleteUser = () => {
    openConfirm(
      'Delete User',
      'Are you sure you want to permanently delete this user? This action cannot be undone.',
      async () => {
        const res = await api.delete(`/admin/users/${id}`);
        if (res.data.success) {
          toast.success("User deleted successfully");
          navigate('/admin/users');
        }
      }
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !user) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'User Not Found'}</h2>
      <button onClick={() => navigate('/admin/users')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all active:scale-95">Back to Users</button>
    </div>
  );

  const roleMap = {
    'property_agent': 'Agent',
    'supplier': 'Supplier',
    'mandi_seller': 'Seller',
    'service_provider': 'Service Provider'
  };

  const displayRole = user.displayRole || (user.role === 'user' ? 'Customer' : user.role);
  const displayRoles = user.displayRoles || [displayRole];
  const isPartner = user.source === 'Partner' || user.partner_type || (user.roles && user.roles.length > 0) || ['Agent', 'Supplier', 'Service Provider'].includes(user.role);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
        onConfirm={executeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        loading={confirmModal.loading}
      />
      <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/users')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 p-1 overflow-hidden">
                       <img 
                         src={user.profileImage || user.image || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&bold=true`} 
                         className="w-full h-full object-cover rounded-xl" 
                         alt="" 
                       />
                       {user.is_active && (
                         <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                       )}
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{user.name}</h2>
                          <div className="flex gap-1.5">
                             {displayRoles.map((role, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold uppercase tracking-widest">{role}</span>
                             ))}
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">User Profile</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">ID: {user?._id?.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold text-[12px] uppercase tracking-widest rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Edit Profile
                 </button>
                 <div className="relative">
                   <button 
                     onClick={() => setShowOptions(!showOptions)}
                     className={cn(
                       "p-3 border rounded-xl transition-all active:scale-95",
                       showOptions ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-white text-slate-400 hover:border-indigo-600 hover:text-indigo-600"
                     )}
                   >
                      <MoreVertical size={20} />
                   </button>

                   {showOptions && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                       <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                          <button 
                            onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)}
                            className="w-full flex items-center gap-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                             <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <CreditCard size={18} />
                             </div>
                             <span className="font-semibold text-sm">Subscriptions</span>
                          </button>

                          <button 
                            onClick={handleToggleStatus}
                            className="w-full flex items-center gap-4 p-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                             <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                user.is_active ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                             )}>
                                {user.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                             </div>
                             <span className="font-semibold text-sm text-left">{user.is_active ? 'Deactivate User' : 'Activate User'}</span>
                          </button>

                          <div className="h-px bg-slate-100 my-2 mx-4" />

                          <button 
                            onClick={handleDeleteUser}
                            className="w-full flex items-center gap-4 p-4 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                             <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400">
                                <Trash2 size={18} />
                             </div>
                             <span className="font-semibold text-sm text-left">Delete User</span>
                          </button>
                       </div>
                     </>
                   )}
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Listings', value: user.stats?.properties || 0, icon: Briefcase, color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Leads', value: user.stats?.leads || 0, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
             { label: 'Services', value: user.stats?.services || 0, icon: Activity, color: 'bg-purple-50 text-purple-600' },
             { label: 'Rating', value: user.rating?.toFixed(1) || '0.0', icon: Star, color: 'bg-amber-50 text-amber-600' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.color)}>
                   <stat.icon size={20} />
                </div>
                <div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-semibold text-slate-900 tracking-tighter">{stat.value}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 space-y-8">
             {/* Contact Details */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                 <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contact Information</h3>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" /> Email Address
                     </label>
                     <p className="text-sm font-semibold text-slate-900 truncate uppercase">{user.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={12} className="text-slate-400" /> Phone Number
                     </label>
                     <p className="text-sm font-semibold text-slate-900 tabular-nums">{user.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" /> Location
                     </label>
                     <p className="text-sm font-semibold text-slate-900 uppercase">{user.city || 'N/A'}, {user.state || 'N/A'}</p>
                  </div>
               </div>
             </div>

             {/* System Details */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                   <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Account Details</h3>
                </div>
                <div className="p-6 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Status</span>
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest border",
                        user.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Joined On</span>
                      <span className="text-sm font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-8 space-y-8">
             {/* Address & Subscription */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                   <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Office / Residential Address</h3>
                </div>
                <div className="p-8">
                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-base font-semibold text-slate-700 leading-relaxed uppercase">
                         {user.address || 'No address provided in the database.'}
                      </p>
                   </div>

                   {isPartner && user.active_subscription && (
                     <div className="mt-8 pt-8 border-t border-slate-200">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Active Subscription</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {[
                             { label: 'Current Plan', value: user.active_subscription.plan_snapshot?.name || 'Standard', color: 'text-indigo-600' },
                             { label: 'Expiry Date', value: new Date(user.active_subscription.ends_at).toLocaleDateString('en-GB'), color: 'text-slate-900' },
                             { label: 'Listing Limit', value: user.active_subscription.plan_snapshot?.listings_limit === -1 ? 'Unlimited' : user.active_subscription.plan_snapshot?.listings_limit, color: 'text-slate-900' }
                           ].map((item, i) => (
                             <div key={i} className="p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <p className={cn("text-base font-semibold uppercase", item.color)}>{item.value}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* KYC Documents */}
             {isPartner && (
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                   <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Verification Documents</h3>
                   <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-widest">Verified Assets</span>
                 </div>
                 
                 <div className="p-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     <DocumentCard 
                       title="PAN Card" 
                       number={user.kyc?.pan_number} 
                       image={user.kyc?.pan_image} 
                     />
                     <DocumentCard 
                       title="Aadhar Front" 
                       number={user.kyc?.aadhar_number} 
                       image={user.kyc?.aadhar_front_image} 
                     />
                     <DocumentCard 
                       title="Aadhar Back" 
                       image={user.kyc?.aadhar_back_image} 
                     />
                     <DocumentCard 
                       title="GST Certificate" 
                       number={user.kyc?.gst_number || user.role_requests?.[0]?.gst_number} 
                       image={user.kyc?.gst_image || user.role_requests?.[0]?.gst_image} 
                     />
                     <DocumentCard 
                       title="RERA Certificate" 
                       number={user.profile?.property_profile?.rera_number} 
                       image={user.profile?.property_profile?.rera_certificate_image} 
                     />
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ title, number, image }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-200 transition-all group flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h5 className="text-[12px] font-bold text-slate-900">{title}</h5>
          {number && <p className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5">{number}</p>}
        </div>
        {image && (
          <a href={image} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div className="grow aspect-[3/2] bg-slate-50 relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-center p-6">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Not Uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
