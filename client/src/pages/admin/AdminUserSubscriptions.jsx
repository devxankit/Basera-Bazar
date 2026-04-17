import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CreditCard, Plus, Eye, Ban, Calendar, Clock, 
  ChevronRight, ArrowLeft, Layers, Star, Users, Briefcase, Mail, Phone,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

export default function AdminUserSubscriptions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          api.get(`/admin/users/${id}`),
          api.get(`/admin/users/${id}/subscriptions`)
        ]);
        
        if (uRes.data.success) setUser(uRes.data.data);
        if (sRes.data.success) {
           // If no real sub history, use the one from user object if it exists
           const subs = sRes.data.data.length > 0 ? sRes.data.data : (uRes.data.data.active_subscription ? [uRes.data.data.active_subscription] : []);
           setSubscriptions(subs);
        }
      } catch (err) {
        console.error("Fetch sub history fail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
        <span className="text-slate-900">{user?.name}'s Subscriptions</span>
        <ChevronRight size={16} />
        <Link to="/admin/dashboard" className="hover:text-orange-500 transition-colors">Home</Link>
      </div>

      {/* User Summary Card */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="xl:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="flex-grow space-y-4 text-center md:text-left">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    {user?.name || 'User'}'s Subscriptions
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                      {user?.role || 'Partner'}
                    </span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-bold">
                      <Mail size={14} className="text-slate-400" />
                      {user?.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-bold">
                      <Phone size={14} className="text-slate-400" />
                      {user?.phone}
                    </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Subscriptions</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tight tabular-nums">{subscriptions.length}</h3>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-4 rounded-[1.2rem] shadow-xl shadow-orange-100 transition-all flex items-center gap-2 active:scale-95 text-[15px]">
              <Plus size={20} strokeWidth={3} />
              Add Subscription
            </button>
         </div>
      </div>

      {/* Subscription History Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
               <CreditCard size={18} />
             </div>
             <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Subscription History</h3>
           </div>
           {subscriptions.length > 0 && (
             <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                 <CheckCircle2 size={12} /> Active Plan: Free Trail
               </span>
               <span className="px-3 py-1 bg-cyan-100 text-cyan-600 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                 <Clock size={12} /> Until: 08 May 2026
               </span>
             </div>
           )}
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50/50">
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Start Date</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">End Date</th>
                 <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {subscriptions.length > 0 ? subscriptions.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 tracking-tight">{sub.plan_snapshot?.name || 'Manual Plan'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {sub._id?.toString().slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{sub.plan_snapshot?.duration_days || 30} Days</p>
                      <p className="text-[11px] font-bold text-slate-400">Validity Period</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-black text-slate-900 tracking-tight">₹{sub.plan_snapshot?.price || 0}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                           <Layers size={14} className="text-slate-400" />
                           Listings: {sub.plan_snapshot?.listings_limit === -1 ? '∞' : sub.plan_snapshot?.listings_limit || 0}
                         </div>
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                           <Star size={14} className="text-slate-400" />
                           Featured: {sub.plan_snapshot?.featured_listings_limit === -1 ? '∞' : sub.plan_snapshot?.featured_listings_limit || 0}
                         </div>
                         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                           <Users size={14} className="text-slate-400" />
                           Leads: {sub.plan_snapshot?.leads_limit === -1 ? '∞' : sub.plan_snapshot?.leads_limit || 0}
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm ${
                        sub.status === 'active' ? 'bg-emerald-500' : 
                        sub.status === 'expired' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}>
                        {sub.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[13px] font-black text-slate-800 tracking-tight">
                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[13px] font-black text-slate-800 tracking-tight">
                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => navigate(`/admin/subscriptions/view/${sub._id}`)}
                            className="w-9 h-9 flex items-center justify-center border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 active:scale-90 transition-all"
                          >
                            <Eye size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                )) : (
                 <tr>
                   <td colSpan="8" className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center">
                        <CreditCard size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">No recorded subscription history</p>
                     </div>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

         {/* Pagination Footer Mockup */}
         <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
              Showing 1 to {subscriptions.length} of {subscriptions.length} entries
            </span>
            <div className="flex items-center gap-2">
               {/* Pagination buttons can go here if needed */}
            </div>
         </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => navigate(`/admin/users/view/${id}`)}
          className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[15px] shadow-2xl shadow-slate-200 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
          Back to User Profile
        </button>
      </div>
    </div>
  );
}
