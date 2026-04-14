import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreHorizontal,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, ChevronRight
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
                <h1 className="text-xl font-bold text-slate-900">{user.name} <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest">{displayRole}</span></h1>
                <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                   {user.email || 'No email synced'} • <span className="text-slate-300">ID: {user._id}</span>
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
             <div key={i} className="p-5 text-center px-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                  <stat.icon size={11} /> {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</p>
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
             <div className="p-5 space-y-4">
                <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                   <p className="text-sm font-medium text-slate-900 tabular-nums">{user.phone}</p>
                </div>
                <div>
                   <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Registration Date</label>
                   <p className="text-sm font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</p>
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
             <div className="p-5">
                <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-1 mb-4">
                  "{user.address || 'Standard address not provided.'}"
                </p>
                <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">City</label>
                      <p className="text-xs font-bold text-slate-900">{user.city || 'N/A'}</p>
                   </div>
                   <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">State</label>
                      <p className="text-xs font-bold text-slate-900">{user.state || 'N/A'}</p>
                   </div>
                </div>
             </div>
           </div>
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
                   { label: 'Enrolled Subscription', value: user.active_subscription?.plan_name || 'Standard Tier', status: 'ACTIVE' }
                 ].map((log, i) => (
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
              <div className="p-4 border-t border-slate-100 bg-slate-50/20">
                 <div className="flex items-center gap-6">
                    <button onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)} className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 border border-indigo-100 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                       <CreditCard size={12} /> Subscription Audit
                    </button>
                    <button className="text-[10px] font-bold text-slate-400 px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center gap-2">
                       <Activity size={12} /> Activity stream
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
