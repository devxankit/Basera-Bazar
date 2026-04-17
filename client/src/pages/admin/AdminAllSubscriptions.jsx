import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Filter, Search, Eye, Plus, Ban, 
  Loader2, AlertCircle, ChevronDown, Zap, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const AdminAllSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filters, setFilters] = useState({
    plan: 'all',
    status: 'all',
    role: 'all',
    search: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const [subRes, planRes] = await Promise.all([
        api.get(`/admin/subscriptions?${queryParams}`),
        api.get('/admin/subscriptions/plans')
      ]);

      if (subRes.data.success) {
        setSubscriptions(subRes.data.data);
      }
      if (planRes.data.success) {
        setPlans(planRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      plan: 'all',
      status: 'all',
      role: 'all',
      search: ''
    });
  };

  const handleCancelSubscription = async (id) => {
    if (!window.confirm("Are you sure you want to cancel/revoke this subscription?")) return;
    try {
      const res = await api.patch(`/admin/subscriptions/${id}/status`, { status: 'cancelled' });
      if (res.data.success) {
        alert("Subscription cancelled successfully");
        fetchData();
      }
    } catch (err) {
      alert("Failed to cancel subscription: " + (err.response?.data?.message || err.message));
    }
  };

  const totalPages = Math.ceil(subscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = subscriptions.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-4 animate-in fade-in duration-500 text-left font-Inter">
      <div className="max-w-[1600px] mx-auto px-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Subscription Management</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                Real-time registry of all active and expired user plans
              </p>
           </div>
           <button 
             onClick={() => navigate('/admin/subscriptions/plans')}
             className="px-6 py-2.5 bg-slate-900 text-white font-black text-[11px] rounded-xl shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
           >
              <Zap size={14} /> Manage Plans
           </button>
        </div>

        {/* Unified Filter Card */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div 
             onClick={() => setIsFilterOpen(!isFilterOpen)}
             className="px-8 py-5 flex items-center justify-between cursor-pointer border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
           >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                    <Filter size={16} />
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Registry</span>
              </div>
              <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }}>
                <ChevronDown size={20} className="text-slate-400" />
              </motion.div>
           </div>
           
           <AnimatePresence>
             {isFilterOpen && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden"
               >
                 <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Type</label>
                          <select 
                            value={filters.plan}
                            onChange={(e) => setFilters({...filters, plan: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                          >
                             <option value="all">All Plans</option>
                             {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                          <select 
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                          >
                             <option value="all">All Status</option>
                             <option value="active">Active</option>
                             <option value="expired">Expired</option>
                             <option value="cancelled">Cancelled</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Role</label>
                          <select 
                            value={filters.role}
                            onChange={(e) => setFilters({...filters, role: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                          >
                             <option value="all">All Roles</option>
                             <option value="ServiceProvider">Service Provider</option>
                             <option value="Agent">Agent</option>
                             <option value="Supplier">Supplier</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Registry</label>
                          <div className="relative">
                             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                               type="text"
                               placeholder="Name, Email, ID..."
                               value={filters.search}
                               onChange={(e) => setFilters({...filters, search: e.target.value})}
                               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 pl-10 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                             />
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-50">
                       <button 
                         onClick={handleResetFilters}
                         className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-500 font-black text-[10px] rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                       >
                          <RotateCcw size={14} /> Reset Filters
                       </button>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* List Table Card */}
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-100">
                    <Crown size={18} />
                 </div>
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Registrations List</h3>
              </div>
              <div className="flex items-center gap-3">
                {loading && <Loader2 className="animate-spin text-indigo-500" size={16} />}
                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-800 shadow-sm shadow-slate-100">
                   {subscriptions.length} Entries Found
                </span>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading && subscriptions.length === 0 ? (
                       <tr>
                          <td colSpan="8" className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Fetching Registry...</p>
                             </div>
                          </td>
                       </tr>
                    ) : subscriptions.length === 0 ? (
                       <tr>
                          <td colSpan="8" className="px-8 py-20 text-center text-slate-300 italic">
                             <AlertCircle size={40} className="mx-auto opacity-20 mb-4" />
                             <p className="text-xs font-black uppercase tracking-widest">No matching subscriptions found</p>
                          </td>
                       </tr>
                    ) : (
                       paginatedSubscriptions.map((sub) => (
                           <tr key={sub._id} className="group hover:bg-slate-50/50 transition-all">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100 uppercase">
                                       {sub.partner_id?.name ? sub.partner_id.name.split(' ').map(n => n[0]).join('') : 'BA'}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{sub.partner_id?.name || 'Unknown User'}</span>
                                       <span className="text-[10px] font-bold text-slate-400 leading-none mb-1.5">{sub.partner_id?.email || sub.partner_id?.phone || 'No contact info'}</span>
                                       <div className="bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter self-start italic">
                                          {sub.partner_id?.role || 'Partner'}
                                       </div>
                                    </div>
                                 </div>
                              </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-800 tracking-tight italic">{sub.plan_snapshot?.name || 'Manual Plan'}</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: BSP-{sub._id.slice(-6).toUpperCase()}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-700 tracking-tight italic">{sub.plan_snapshot?.duration_days || 30} Days</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{Math.round((sub.plan_snapshot?.duration_days || 30) / 30)} Month(s)</span>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-slate-900 tracking-tight italic">₹{sub.plan_snapshot?.price || 0}</span>
                                   <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter italic mt-0.5">inc. GST: ₹{Math.round((sub.plan_snapshot?.price || 0) * 0.18)}</span>
                                </div>
                             </td>
                    <td className="px-8 py-5 text-center">
                       <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          sub.status === 'active' ? 'bg-emerald-500 text-white border-emerald-400' :
                          sub.status === 'expired' ? 'bg-rose-500 text-white border-rose-400' : 
                          sub.status === 'no_plan' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                          'bg-slate-400 text-white border-slate-300'
                       }`}>
                          {sub.status === 'no_plan' ? 'No Active' : (sub.status || 'Active')}
                       </span>
                    </td>
                             <td className="px-8 py-5">
                                <span className="text-[12px] font-black text-slate-600 tracking-tight italic">{formatDate(sub.starts_at)}</span>
                             </td>
                             <td className="px-8 py-5">
                                <span className="text-[12px] font-black text-slate-600 tracking-tight italic">{formatDate(sub.ends_at)}</span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                   <button 
                                     onClick={() => navigate(`/admin/subscriptions/view/${sub._id}`)}
                                     className="w-8 h-8 rounded-full border border-orange-200 text-orange-500 flex items-center justify-center hover:bg-orange-50 transition-all shadow-sm group-hover:shadow-md"
                                     title="View Dossier"
                                   >
                                      <Eye size={14} />
                                   </button>
                                   <button 
                                     onClick={() => navigate(`/admin/subscriptions/add-manual/${sub.partner_id?._id || sub.partner_id}`)}
                                     className="w-8 h-8 rounded-full border border-orange-200 text-orange-500 flex items-center justify-center hover:bg-orange-50 transition-all shadow-sm"
                                     title="Add Manual Subscription"
                                   >
                                      <Plus size={14} />
                                   </button>
                                   <button 
                                     onClick={() => handleCancelSubscription(sub._id)}
                                     className="w-8 h-8 rounded-full border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-all shadow-sm"
                                     title="Revoke/Cancel"
                                   >
                                      <Ban size={14} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination Console */}
           {subscriptions.length > itemsPerPage && (
             <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-tight">
                   Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, subscriptions.length)} of {subscriptions.length} Node Entries
                </p>
                <div className="flex gap-2">
                   <button 
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => prev - 1)}
                     className="px-5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     Prev
                   </button>
                   <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-7 text-[10px] font-black rounded-md transition-all ${
                            currentPage === page ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                   </div>
                   <button 
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(prev => prev + 1)}
                     className="px-5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     Next
                   </button>
                </div>
             </div>
           )}

           {/* Manual Footer */}
           {subscriptions.length <= itemsPerPage && (
             <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-tight">Syncing Registry Node [04.2-A]</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">All Records Loaded</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdminAllSubscriptions;
