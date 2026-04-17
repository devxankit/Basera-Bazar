import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreVertical,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight, BarChart3,
  Package, Store, ShieldCheck, Globe, Zap
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
  const isPartner = ['Agent', 'Supplier', 'Service Provider'].includes(user.role);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-[1600px] mx-auto px-8 space-y-8 mt-6">
        
        {/* Action Header Block */}
        <div className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           {/* Immersive Background element */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/40 via-purple-50/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
           
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
                 <button className="p-3 border border-slate-200 bg-white text-slate-400 rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <MoreVertical size={20} />
                 </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
