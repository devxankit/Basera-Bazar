import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Star, Calendar, 
  MapPin, Clock, Edit2, ArrowLeft, MoreHorizontal,
  CreditCard, Activity, CheckCircle2, AlertCircle,
  Building2, Briefcase, TrendingUp, DollarSign, List, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-orange-500 border-r-4 border-r-transparent border-b-4 border-orange-500/20"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing User Record...</p>
    </div>
  );

  if (error || !user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-[3rem] border border-slate-100 shadow-xl">
      <AlertCircle size={64} className="text-rose-500 mb-6" />
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{error || 'Unknown Record Error'}</h2>
      <button 
        onClick={() => navigate('/admin/users')}
        className="mt-6 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
      >
        Return to Directory
      </button>
    </div>
  );

  const displayRole = user.displayRole || (user.role === 'user' ? 'Customer' : user.role);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 bg-white border border-slate-100 text-slate-400 rounded-[1.5rem] hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm group"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              User Insight
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                displayRole === 'Admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                displayRole === 'Agents' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {displayRole}
              </span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
              Database UID: <span className="text-slate-900">{user._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate(`/admin/users/edit/${user._id}`)}
             className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-[1.5rem] shadow-xl shadow-orange-100 transition-all flex items-center gap-3 active:scale-95 text-[15px]"
           >
             <Edit2 size={20} strokeWidth={2.5} />
             Edit Profile
           </button>
           <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-[1.5rem] hover:bg-slate-50 transition-all shadow-sm">
             <MoreHorizontal size={24} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Col: Profile Identity Card */}
        <div className="space-y-10">
           <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
              {/* Dynamic Gradient Background */}
              <div className="h-40 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                 <div className="absolute top-6 right-8">
                    <div className={`px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20 font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-xl ${user.is_active ? 'bg-emerald-500/80 shadow-emerald-500/20' : 'bg-slate-800/80 shadow-slate-900/20'}`}>
                      {user.is_active ? 'Account Active' : 'Account Suspended'}
                    </div>
                 </div>
              </div>

              <div className="px-10 pb-10 -mt-20 relative text-center">
                 <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-8 border-white mx-auto shadow-2xl relative group overflow-hidden">
                    <img 
                      src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=fa8639&color=fff&size=512`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt="" 
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 </div>

                 <div className="mt-8 space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{user.name}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
                      <Mail size={14} className="text-indigo-400" />
                      {user.email || 'No email registered'}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-10">
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50 text-center space-y-2 group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-default">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Rating</p>
                       <div className="flex items-center justify-center gap-2">
                          <Star size={18} className="text-amber-500 fill-amber-500" />
                          <span className="text-2xl font-black text-slate-900 tabular-nums">{user.rating?.toFixed(1) || '0.0'}</span>
                       </div>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50 text-center space-y-2 group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-default">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                       <div className="flex items-center justify-center gap-2">
                          <Calendar size={18} className="text-slate-400" />
                          <span className="text-base font-black text-slate-900">
                            {new Date(user.createdAt).getFullYear()}
                          </span>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => navigate(`/admin/users/subscriptions/${user._id}`)}
                   className="w-full mt-6 py-5 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3 border border-indigo-100"
                 >
                    <CreditCard size={18} />
                    Subscription History
                 </button>
              </div>
           </div>

           {/* Quick Contact Card */}
           <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-8 shadow-2xl shadow-slate-900/20">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Contact Bridge
              </h3>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="p-3 bg-white/10 rounded-xl">
                       <Phone size={20} className="text-orange-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Phone Link</p>
                       <p className="text-lg font-bold mt-0.5">{user.phone}</p>
                    </div>
                 </div>
                 
                 {user.address && (
                   <div className="flex items-start gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="p-3 bg-white/10 rounded-xl">
                         <MapPin size={20} className="text-orange-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Location</p>
                         <p className="text-lg font-bold mt-0.5 leading-tight">{user.address}, {user.city}</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Col: Activity & Data Panels */}
        <div className="lg:col-span-2 space-y-10">
           
           {/* Summary Stats Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between group hover:-translate-y-1 transition-all">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <List size={24} />
                 </div>
                 <div className="mt-8">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tight">{user.stats?.properties || 0}</h4>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Total Listings</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between group hover:-translate-y-1 transition-all">
                 <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <TrendingUp size={24} />
                 </div>
                 <div className="mt-8">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tight">{user.stats?.leads || 0}</h4>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Generated Leads</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between group hover:-translate-y-1 transition-all text-orange-600">
                 <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Activity size={24} />
                 </div>
                 <div className="mt-8">
                    <h4 className="text-4xl font-black text-slate-900 tracking-tight">{user.stats?.services || 0}</h4>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Service Engagements</p>
                 </div>
              </div>
           </div>

           {/* Detailed Information Tabs */}
           <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <Activity size={20} className="text-indigo-600" />
                   System Logs & Meta Status
                 </h3>
              </div>

              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Verification Insights</h4>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                             <span className="text-sm font-bold text-slate-600">Email Verified</span>
                             <CheckCircle2 size={20} className="text-emerald-500" />
                          </div>
                          <div className={`flex items-center justify-between p-5 rounded-2xl ${user.is_active ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                             <span className={`text-sm font-bold ${user.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>Account Standing</span>
                             <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                               {user.is_active ? 'GOOD' : 'SUSPENDED'}
                             </span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Session Fingerprint</h4>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                             <span className="text-sm font-bold text-slate-600">Token Version</span>
                             <span className="text-sm font-black text-slate-900 tabular-nums">{user.token_version || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                             <span className="text-sm font-bold text-slate-600">Internal Category</span>
                             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em]">{user.source || 'User Core'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Subscription Health */}
                 <div className="pt-10 border-t border-slate-50">
                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-1000 rotate-12">
                          <Building2 size={120} />
                       </div>
                       <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="space-y-3">
                             <h4 className="text-2xl font-black tracking-tight">Active Subscription Tier</h4>
                             <p className="text-indigo-100 text-sm font-medium max-w-sm opacity-80">
                               Manage plan accessibility and platform features for this partner entity.
                             </p>
                          </div>
                          <div className="shrink-0 text-center md:text-right">
                             {user.active_subscription ? (
                               <div className="bg-white text-indigo-600 px-10 py-5 rounded-[2.2rem] shadow-xl">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Currently Enrolled</p>
                                  <p className="text-2xl font-black mt-1 leading-none underline decoration-indigo-200 underline-offset-8 uppercase">{user.active_subscription.plan_name}</p>
                               </div>
                             ) : (
                               <div className="bg-white/10 text-white px-10 py-5 rounded-[2.2rem] border border-white/20">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                                  <p className="text-2xl font-black mt-1 leading-none">FREE / INACTIVE</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
