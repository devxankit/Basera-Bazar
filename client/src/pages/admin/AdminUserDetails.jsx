import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreVertical,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, BarChart3,
  Package, Store, ShieldCheck, Globe, Zap, FileText, ExternalLink,
  UserMinus, UserCheck, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../services/api';

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

  const handleToggleStatus = async () => {
    try {
      const res = await api.put(`/admin/users/${id}`, { is_active: !user.is_active });
      if (res.data.success) {
        setUser({ ...user, is_active: !user.is_active });
        setShowOptions(false);
      }
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this user from the database? This action cannot be undone.")) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        navigate('/admin/users');
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !user) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl m-8 shadow-sm">
      <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight">{error || 'User Registry Error'}</h2>
      <button onClick={() => navigate('/admin/users')} className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all active:scale-95">Return to Directory</button>
    </div>
  );

  const displayRole = user.displayRole || (user.role === 'user' ? 'Customer' : user.role);
  const isPartner = user.source === 'Partner' || user.partner_type || (user.roles && user.roles.length > 0) || ['Agent', 'Supplier', 'Service Provider'].includes(user.role);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
           </div>
           
           <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-8 gap-6 z-10">
              <div className="flex items-start gap-6">
                 <button 
                   onClick={() => navigate('/admin/users')}
                   className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group shrink-0"
                 >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                 </button>
                 <div className="flex items-center gap-6">
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                       <div className="relative w-24 h-24 rounded-2xl bg-white p-1 overflow-hidden ring-1 ring-slate-100 shadow-xl">
                          <img 
                            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&bold=true`} 
                            className="w-full h-full object-cover rounded-xl" 
                            alt="" 
                          />
                          {user.is_active && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full transition-transform group-hover:scale-110" />
                          )}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight leading-none uppercase">{user.name}</h2>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[11px] font-semibold uppercase tracking-widest">{displayRole}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded border border-slate-100">Identity Registry</span>
                          <ChevronRight size={10} className="text-slate-300" />
                          <span className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded border border-orange-100">UID: {user?._id?.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <button 
                    onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold text-[12px] uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                 >
                    <Edit2 size={14} /> Update Identity
                 </button>
                 <div className="relative">
                   <button 
                     onClick={() => setShowOptions(!showOptions)}
                     className={cn(
                       "p-3 border rounded-2xl transition-all shadow-sm active:scale-95",
                       showOptions ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                     )}
                   >
                      <MoreVertical size={20} />
                   </button>

                   {showOptions && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                       <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button 
                            onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)}
                            className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors group"
                          >
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                <CreditCard size={18} />
                             </div>
                             <span className="font-bold text-sm tracking-tight">Subscriptions</span>
                          </button>

                          <button 
                            onClick={handleToggleStatus}
                            className="w-full flex items-center gap-4 p-4 text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors group"
                          >
                             <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                user.is_active ? "bg-rose-50 text-rose-400 group-hover:text-rose-600 group-hover:bg-rose-100" : "bg-emerald-50 text-emerald-400 group-hover:text-emerald-600 group-hover:bg-emerald-100"
                             )}>
                                {user.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                             </div>
                             <span className="font-bold text-sm tracking-tight text-left">{user.is_active ? 'Deactivate Node' : 'Activate Node'}</span>
                          </button>

                          <div className="h-px bg-slate-100 my-2 mx-4" />

                          <button 
                            onClick={handleDeleteUser}
                            className="w-full flex items-center gap-4 p-4 text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors group"
                          >
                             <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 group-hover:text-rose-600 group-hover:bg-rose-100 transition-colors">
                                <Trash2 size={18} />
                             </div>
                             <span className="font-bold text-sm tracking-tight text-left">Delete From DB</span>
                          </button>
                       </div>
                     </>
                   )}
                 </div>
              </div>
           </div>

           {/* Segmented Metric Pipeline */}
           <div className="relative border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 bg-slate-50/30">
              {[
                { label: 'Asset Portfolio', value: user.stats?.properties || 0, sub: 'Listings Controlled', icon: Briefcase, color: 'text-indigo-500' },
                { label: 'Capture Index', value: user.stats?.leads || 0, sub: 'Inbound Inquiries', icon: TrendingUp, color: 'text-orange-500' },
                { label: 'Service Output', value: user.stats?.services || 0, sub: 'Active Offerings', icon: Activity, color: 'text-purple-500' },
                { label: 'Trust Rating', value: user.rating?.toFixed(1) || '0.0', sub: 'Engagement Score', icon: Star, color: 'text-amber-500' }
              ].map((stat, i) => (
                <div key={i} className="p-8 border-r border-slate-50 last:border-0 group hover:bg-white transition-all">
                   <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
                         <stat.icon size={12} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-2xl font-semibold text-slate-900 tracking-tighter tabular-nums">{stat.value}</span>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mt-1">{stat.sub}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 space-y-8">
             {/* Communication Hub */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
               <div className="bg-slate-900 px-8 py-6 flex items-center gap-3">
                 <Zap size={18} className="text-orange-500" />
                 <h3 className="text-[12px] font-semibold text-white uppercase tracking-[0.2em] mt-0.5">Communication Node</h3>
               </div>
               <div className="p-8 space-y-2">
                  <div className="group space-y-2 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                     <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={10} className="text-indigo-500" /> Primary Endpoint
                     </label>
                     <p className="text-base font-semibold text-slate-900 truncate tracking-tight uppercase">{user.email || 'offline@baserabazar.sys'}</p>
                  </div>
                  <div className="group space-y-2 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                     <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={10} className="text-indigo-500" /> Telecom Gateway
                     </label>
                     <p className="text-base font-semibold text-slate-900 tabular-nums">{user.phone || '+91 000 000 0000'}</p>
                  </div>
                  <div className="group space-y-2 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                     <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={10} className="text-indigo-500" /> Deployment Area
                     </label>
                     <p className="text-base font-semibold text-slate-900 uppercase tracking-tight">{user.city || 'Central Hub'}, {user.state || 'Territory'}</p>
                  </div>
               </div>
             </div>

             {/* System Integrity board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30">
                   <h3 className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                     <ShieldCheck size={14} className="opacity-80" /> Integrity Profile
                   </h3>
                </div>
                <div className="p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Profile Status</span>
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest border",
                        user.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {user.is_active ? 'Active Node' : 'Suspended'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Core Version</span>
                      <span className="text-[11px] font-semibold text-slate-900 uppercase tracking-tight">System v{user.token_version || 1}.2.0</span>
                   </div>
                   <div className="pt-4 border-t border-slate-50 space-y-2">
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block">Network Induction</label>
                      <p className="text-base font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString('en-GB')}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-8 space-y-8">
             {/* Operational Profile board */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shadow-inner">
                         <Globe size={16} />
                      </div>
                      <h3 className="text-[12px] font-semibold text-orange-600 uppercase tracking-[0.2em] mt-0.5">Physical Fingerprint</h3>
                   </div>
                </div>
                <div className="p-10 space-y-10">
                   <div className="space-y-4">
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block ml-1">Verified Logistics Address</label>
                      <div className="relative p-6 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white group">
                         <div className="absolute -left-1 top-4 bottom-4 w-1 bg-orange-100 group-hover:bg-orange-500 transition-colors rounded-full" />
                         <p className="text-lg font-semibold text-slate-700 leading-relaxed uppercase tracking-tight">
                            {user.address || 'Standard physical induction address string unpopulated for this node.'}
                         </p>
                      </div>
                   </div>

                   {/* Partner Specific Intelligence */}
                   {isPartner && user.active_subscription && (
                     <div className="pt-8 border-t border-slate-50 space-y-6">
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block">Subscription Framework Matrix</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                           {[
                             { label: 'Core Tier', value: user.active_subscription.plan_snapshot?.name || 'Standard', color: 'text-indigo-600' },
                             { label: 'Expirations', value: new Date(user.active_subscription.ends_at).toLocaleDateString('en-GB'), color: 'text-rose-600' },
                             { label: 'Availability', value: user.active_subscription.plan_snapshot?.listings_limit === -1 ? 'Infinite' : 'Finite', color: 'text-emerald-600' }
                           ].map((item, i) => (
                             <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                                <p className={cn("text-lg font-semibold tracking-tight uppercase", item.color)}>{item.value}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Dynamic Account Controls notice */}
             <div className="bg-indigo-600 rounded-3xl p-1 shadow-xl shadow-indigo-100 transform hover:scale-[1.01] transition-transform duration-500">
                <div className="bg-white rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                         <Shield size={28} />
                      </div>
                      <div>
                         <p className="text-lg font-semibold text-slate-900 tracking-tight">Advanced Account Governance Active</p>
                         <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1 italic">Real-time profile synchronization with security bus</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)}
                     className="px-6 py-3 bg-indigo-600 text-white font-semibold text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-200"
                   >
                      Audit Subscription Meta
                   </button>
                </div>
             </div>

             {/* Identity & KYC Documents Section */}
             {isPartner && (
               <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-8">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                   <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shadow-inner">
                     <FileText size={16} />
                   </div>
                   <h3 className="text-[12px] font-semibold text-blue-600 uppercase tracking-[0.2em] mt-0.5">Identity & Role Documents</h3>
                 </div>
                 
                 <div className="p-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {/* Core KYC */}
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
                     
                     {/* Business KYC */}
                     <DocumentCard 
                       title="GST Certificate" 
                       number={user.kyc?.gst_number || user.role_requests?.[0]?.gst_number} 
                       image={user.kyc?.gst_image || user.role_requests?.[0]?.gst_image} 
                     />

                     {/* Role Specific Documents */}
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
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div>
          <h5 className="text-[13px] font-black text-slate-900">{title}</h5>
          {number && <p className="text-[10px] font-black text-indigo-600 uppercase mt-0.5">{number}</p>}
        </div>
        {image && (
          <a href={image} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      <div className="flex-grow aspect-[3/2] bg-slate-50 relative overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="text-center p-6 opacity-60">
            <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Not Provided</p>
          </div>
        )}
      </div>
    </div>
  );
}
