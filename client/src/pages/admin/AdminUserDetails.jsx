import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreHorizontal,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, BarChart3,
  Package, Store
} from 'lucide-react';
import api from '../../services/api';

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !user) return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
      <AlertCircle size={32} className="mx-auto text-slate-300 mb-4" />
      <h2 className="text-lg font-bold text-slate-900">{error || 'Unknown Error'}</h2>
      <button onClick={() => navigate('/admin/users')} className="mt-4 text-xs font-bold text-indigo-600 underline uppercase tracking-widest">Return to directory</button>
    </div>
  );

  const displayRole = user.displayRole || (user.role === 'user' ? 'Customer' : user.role);
  const isPartner = ['Agent', 'Supplier', 'Service Provider'].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 mt-4">
      {/* Structural Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/admin/users')} className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=f1f5f9&color=64748b`} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name} <span className="ml-2 text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg uppercase tracking-widest">{displayRole}</span></h1>
                <p className="text-[13px] font-bold text-slate-400 mt-1 flex items-center gap-2 italic">
                   {user.email || 'No email synced'} • <span className="text-slate-400 font-black">ID: {user._id?.toString().slice(-6).toUpperCase()}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/admin/users/edit/${user._id}`)} className="px-4 py-2 border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
              <Edit2 size={12} /> Edit Profile
            </button>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <MoreHorizontal size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats Banner (Segmented) */}
        <div className="grid grid-cols-4 border-t border-slate-200 divide-x divide-slate-200 bg-slate-50/30">
            {[
              { label: 'Properties', value: user.stats?.properties || 0, icon: Briefcase },
              { label: 'Leads', value: user.stats?.leads || 0, icon: TrendingUp },
              { label: 'Services', value: user.stats?.services || 0, icon: Activity },
              { label: 'Trust Rating', value: `${user.rating?.toFixed(1) || '0.0'} / 5.0`, icon: Star }
            ].map((stat, i) => (
              <div key={i} className="p-6 text-center border-l first:border-l-0 border-slate-200">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                   <stat.icon size={12} /> {stat.label}
                 </p>
                 <p className="text-xl font-black text-slate-900 tabular-nums italic">{stat.value}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Secondary Info Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50">
               <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                 <Phone size={14} className="text-slate-400" /> Contact Details
               </h3>
             </div>
              <div className="p-6 space-y-5">
                 <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                    <p className="text-[15px] font-black text-slate-900 tabular-nums italic">{user.phone || 'N/A'}</p>
                 </div>
                 <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registration Date</label>
                    <p className="text-[15px] font-black text-slate-900 italic">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                 </div>
                <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Account Status</label>
                   <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{user.is_active ? 'Active Node' : 'Suspended'}</span>
                   </div>
                </div>
             </div>
           </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> Location Info
                </h3>
              </div>
              <div className="p-6">
                 <p className="text-[14px] font-bold text-slate-700 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1 mb-6">
                   "{user.address || 'Standard address not provided.'}"
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">City</label>
                       <p className="text-[14px] font-black text-slate-900 italic">{user.city || 'N/A'}</p>
                    </div>
                    <div>
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">State</label>
                       <p className="text-[14px] font-black text-slate-900 italic">{user.state || 'N/A'}</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Subscription Status Card */}
            {isPartner && user.active_subscription && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400" /> Subscription Status
                  </h3>
                </div>
                <div className="p-8 flex flex-col items-center">
                   <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                     <CheckCircle2 size={32} />
                   </div>
                   <h4 className="text-lg font-bold text-slate-900 leading-none">Active Subscription</h4>
                   <p className="text-sm font-medium text-slate-500 mt-2 italic">{user.active_subscription.plan_snapshot?.name || 'Standard Tier'}</p>

                   <div className="w-full mt-8 space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start Date</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">{user.active_subscription.starts_at ? new Date(user.active_subscription.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End Date</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">{user.active_subscription.ends_at ? new Date(user.active_subscription.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">₹{user.active_subscription.plan_snapshot?.price || 0}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listings Available</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">
                              {user.active_subscription.plan_snapshot?.listings_limit === -1 ? 'Unlimited' : 
                               Math.max(0, (user.active_subscription.plan_snapshot?.listings_limit || 0) - (user.active_subscription.usage?.listings_created || 0))}
                            </span>
                         </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Featured Listings</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">
                               {user.active_subscription.plan_snapshot?.featured_listings_limit === -1 ? 'Unlimited' : 
                                Math.max(0, (user.active_subscription.plan_snapshot?.featured_listings_limit || 0) - (user.active_subscription.usage?.featured_listings_used || 0))}
                            </span>
                         </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-50 pb-2 text-left">
                         <div className="flex flex-col w-full">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leads Available</span>
                            <span className="text-sm font-bold text-slate-900 mt-1">
                               {user.active_subscription.plan_snapshot?.leads_limit === -1 ? 'Unlimited' : 
                                Math.max(0, (user.active_subscription.plan_snapshot?.leads_limit || 0) - (user.active_subscription.usage?.enquiries_received_this_month || 0))}
                            </span>
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={() => navigate('/admin/subscriptions')}
                      className="w-full mt-10 py-3 bg-orange-500 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all uppercase tracking-[0.15em] shadow-lg shadow-orange-100"
                   >
                      <BarChart3 size={16} /> View All Subscriptions
                   </button>
                </div>
              </div>
            )}
        </div>

        {/* Detailed Operations Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           {/* Partnership Data if applicable */}
           {(user.partner_type === 'supplier' || user.partner_type === 'service_provider') && (
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                   <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                     <Briefcase size={14} className="text-slate-400" /> Partner Specialization
                   </h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-10">
                   {user.partner_type === 'supplier' && (
                     <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Material Categories</label>
                        <div className="flex flex-wrap gap-1.5">
                           {(user.profile?.supplier_profile?.material_categories || []).map((cat, i) => (
                             <span key={i} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                               {cat}
                             </span>
                           ))}
                        </div>
                     </div>
                   )}
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Operating Parameters</label>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-slate-50">
                            <td className="py-2 text-slate-400">Delivery Radius</td>
                            <td className="py-2 text-right font-bold text-slate-900">{user.profile?.supplier_profile?.delivery_radius_km || 10} KM</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-400">Onboarding Sync</td>
                            <td className="py-2 text-right font-bold text-slate-900">VERIFIED</td>
                          </tr>
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
           )}

           {/* Mandi Seller Specific Details */}
           {user.partner_type === 'mandi_seller' && (
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                <div className="p-4 border-b border-slate-200 bg-emerald-50/30">
                   <h3 className="text-[10px] font-bold text-emerald-900 uppercase tracking-[0.1em] flex items-center gap-2">
                     <Store size={14} className="text-emerald-500" /> Mandi Seller Profile
                   </h3>
                </div>
                <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-10">
                      <div>
                         <label className="text-[9px] font-bold text-slate-400 uppercase block mb-2">Business Presence</label>
                         <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                           {user.profile?.mandi_profile?.business_name || 'Individual Seller'}
                         </p>
                         <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                           {user.profile?.mandi_profile?.business_description || 'No business information provided.'}
                         </p>
                      </div>
                      <div>
                         <label className="text-[9px] font-bold text-slate-400 uppercase block mb-2">Performance & Trust</label>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Penalty Due</p>
                               <p className={`text-xl font-black tabular-nums ${user.profile?.mandi_profile?.penalty_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                 ₹{user.profile?.mandi_profile?.penalty_due || 0}
                               </p>
                            </div>
                            <div className="flex-1 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Mandi Status</p>
                               <p className="text-sm font-black text-indigo-700 uppercase">VERIFIED</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-3">Materials Managed</label>
                      <div className="flex flex-wrap gap-2">
                        {(user.profile?.mandi_profile?.material_types || []).length > 0 ? (
                          (user.profile?.mandi_profile?.material_types || []).map((type, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                              <Package size={12} className="text-slate-400" />
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No material types defined</span>
                        )}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* Security Logs (Table View) */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                   <Shield size={14} className="text-slate-400" /> Registry Integrity Logs
                 </h3>
                 <span className="text-[9px] font-bold text-slate-300">CORE_SYNC_V{user.token_version || 1}.0</span>
              </div>
              <div className="divide-y divide-slate-100">
                 {[
                   { label: 'Security Versioning', value: `Token v${user.token_version || 1}.0`, status: 'OK' },
                   { label: 'Identity Source Provider', value: user.source || 'Direct Registration', status: null },
                   { label: 'Connectivity Validation', value: 'System Authenticated', status: 'OK' },
                   isPartner ? { label: 'Enrolled Subscription', value: user.active_subscription?.plan_snapshot?.name || 'Standard Tier', status: 'ACTIVE' } : null
                 ].filter(Boolean).map((log, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <span className="text-xs font-medium text-slate-500">{log.label}</span>
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">{log.value}</span>
                          {log.status && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100">{log.status}</span>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
                {isPartner && (
                   <div className="p-6 border-t border-slate-100 bg-slate-50/20">
                      <div className="flex items-center gap-6">
                         <button onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)} className="text-[12px] font-black text-indigo-600 px-6 py-3 border-2 border-indigo-100 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm">
                            <CreditCard size={14} /> Subscription Audit
                         </button>
                      </div>
                   </div>
                )}
           </div>
        </div>
      </div>
    </div>
  );
}
