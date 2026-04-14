import React, { useState, useEffect, useMemo } from 'react';
import { IndianRupee, Save, ArrowLeft, Plus, Trash2, Info, CheckCircle2, Infinity as InfinityIcon, Star, Zap, ShieldCheck, Calendar, X, Mail, Phone, Users } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminCreateManualSubscription() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  const [formData, setFormData] = useState({
    plan_id: '',
    starts_at: new Date().toISOString().split('T')[0],
    duration_days: 30,
    amount_paid: 0,
    listings_limit: 10,
    featured_listings_limit: 2,
    leads_limit: 50,
    notes: ''
  });

  const [unlimited, setUnlimited] = useState({
    listings: false,
    featured: false,
    leads: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get(`/admin/users/${userId}`),
          api.get('/admin/subscriptions/plans')
        ]);
        if (uRes.data.success) setUserDetails(uRes.data.data);
        if (pRes.data.success) setPlans(pRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const selectedPlan = useMemo(() => {
    return plans.find(p => p._id === formData.plan_id);
  }, [formData.plan_id, plans]);

  useEffect(() => {
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        duration_days: selectedPlan.duration_days,
        amount_paid: selectedPlan.price,
        listings_limit: selectedPlan.listings_limit === -1 ? 0 : selectedPlan.listings_limit,
        featured_listings_limit: selectedPlan.featured_listings_limit === -1 ? 0 : selectedPlan.featured_listings_limit,
        leads_limit: selectedPlan.leads_limit === -1 ? 0 : selectedPlan.leads_limit
      }));
      setUnlimited({
        listings: selectedPlan.listings_limit === -1,
        featured: selectedPlan.featured_listings_limit === -1,
        leads: selectedPlan.leads_limit === -1
      });
    }
  }, [selectedPlan]);

  const computedEndDate = useMemo(() => {
    const start = new Date(formData.starts_at);
    if (isNaN(start.getTime())) return 'N/A';
    start.setDate(start.getDate() + parseInt(formData.duration_days || 0));
    return start.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [formData.starts_at, formData.duration_days]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        partner_id: userId,
        ...formData,
        listings_limit: unlimited.listings ? -1 : parseInt(formData.listings_limit),
        featured_listings_limit: unlimited.featured ? -1 : parseInt(formData.featured_listings_limit),
        leads_limit: unlimited.leads ? -1 : parseInt(formData.leads_limit)
      };

      await api.post('/admin/subscriptions', payload);
      navigate('/admin/subscriptions');
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing subscription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-300 uppercase animate-pulse">Initializing Override Engine...</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 mt-4 animate-in fade-in duration-500">
      {/* Header Breadcrumb */}
      <div className="px-8 py-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Create Subscription for {userDetails?.name}</h1>
            <span className="text-slate-300">/</span>
            <Link to="/admin/dashboard" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Home</Link>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
           {/* User Hero Card */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100 uppercase">
                 {userDetails?.name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-grow">
                 <h2 className="text-lg font-black text-slate-900 tracking-tight">Create Subscription for {userDetails?.name}</h2>
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 font-bold">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] rounded uppercase tracking-widest">{userDetails?.role?.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs tracking-tight"><Mail size={12} /> {userDetails?.email || 'N/A'}</span>
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs tracking-tight"><Phone size={12} /> {userDetails?.phone || 'N/A'}</span>
                 </div>
              </div>
           </div>

           {/* Manual Form Area */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
                 <div className="bg-slate-900 p-1.5 rounded-full">
                    <Plus size={12} className="text-white" />
                 </div>
                 <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Create New Subscription</span>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                 {/* Row 1: Plan & Start Date */}
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Subscription Plan <span className="text-rose-500 font-black">*</span></label>
                       <select 
                        required
                        value={formData.plan_id}
                        onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                       >
                         <option value="">Select Plan</option>
                         {plans.map(plan => (
                           <option key={plan._id} value={plan._id}>{plan.name} (₹{plan.price})</option>
                         ))}
                       </select>
                       <p className="text-[10px] text-slate-400 italic">Select the subscription plan for this user</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Start Date <span className="text-rose-500 font-black">*</span></label>
                       <input 
                        type="date" 
                        required
                        value={formData.starts_at}
                        onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                       />
                       <p className="text-[10px] text-slate-400 italic">When does this subscription start?</p>
                    </div>
                 </div>

                 {/* Row 2: Duration, Amount, Computed End */}
                 <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Duration (Days) <span className="text-rose-500 font-black">*</span></label>
                       <input 
                        type="number" 
                        required
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                       />
                       <p className="text-[10px] text-slate-400 italic">How many days will this subscription last?</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Amount Paid (₹) <span className="text-rose-500 font-black">*</span></label>
                       <input 
                        type="number" 
                        required
                        value={formData.amount_paid}
                        onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                       />
                       <p className="text-[10px] text-slate-400 italic">How much did the user pay for this subscription?</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">End Date (Calculated)</label>
                       <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-500 cursor-not-allowed">
                          {computedEndDate}
                       </div>
                       <p className="text-[10px] text-slate-400 italic">Calculated based on start date and duration</p>
                    </div>
                 </div>

                 {/* Row 3: Limits Override */}
                 <div className="grid grid-cols-3 gap-8 pt-4">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Leads Available</label>
                       <input 
                        type="number" 
                        disabled={unlimited.leads}
                        value={formData.leads_limit}
                        onChange={(e) => setFormData({ ...formData, leads_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.leads ? 'opacity-40' : ''}`}
                       />
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={unlimited.leads}
                            onChange={(e) => setUnlimited({ ...unlimited, leads: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 transition-all"
                          />
                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                             <InfinityIcon size={14} className="text-slate-900" />
                             <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-none">Unlimited</span>
                          </div>
                       </label>
                       <p className="text-[10px] text-slate-400 italic">Check "Unlimited" or enter a number</p>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Listings Available</label>
                       <input 
                        type="number" 
                        disabled={unlimited.listings}
                        value={formData.listings_limit}
                        onChange={(e) => setFormData({ ...formData, listings_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.listings ? 'opacity-40' : ''}`}
                       />
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={unlimited.listings}
                            onChange={(e) => setUnlimited({ ...unlimited, listings: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 transition-all"
                          />
                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                             <InfinityIcon size={14} className="text-slate-900" />
                             <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-none">Unlimited</span>
                          </div>
                       </label>
                       <p className="text-[10px] text-slate-400 italic">Check "Unlimited" or enter a number</p>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Featured Listings</label>
                       <input 
                        type="number" 
                        disabled={unlimited.featured}
                        value={formData.featured_listings_limit}
                        onChange={(e) => setFormData({ ...formData, featured_listings_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.featured ? 'opacity-40' : ''}`}
                       />
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={unlimited.featured}
                            onChange={(e) => setUnlimited({ ...unlimited, featured: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 transition-all"
                          />
                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                             <InfinityIcon size={14} className="text-slate-900" />
                             <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-none">Unlimited</span>
                          </div>
                       </label>
                       <p className="text-[10px] text-slate-400 italic">Check "Unlimited" or enter a number</p>
                    </div>
                 </div>

                 {/* Notes Area */}
                 <div className="space-y-2 pt-4">
                    <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Notes</label>
                    <textarea 
                      rows="3"
                      placeholder="Any additional notes about this subscription"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-300"
                    />
                    <p className="text-[10px] text-slate-400 italic">Any additional notes about this subscription</p>
                 </div>

                 {/* Action Bar Footer */}
                 <div className="flex justify-end gap-3 pt-8 border-t border-slate-50">
                    <button 
                      type="button" 
                      onClick={() => navigate('/admin/subscriptions')}
                      className="px-8 py-2.5 bg-[#6c757d] text-white font-bold text-[13px] rounded-lg hover:bg-[#5a6268] transition-all flex items-center gap-2"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-10 py-2.5 bg-[#fa641e] text-white font-black text-[13px] rounded-lg hover:bg-[#e45b1b] transition-all shadow-lg shadow-orange-100 flex items-center gap-2"
                    >
                      <Save size={16} /> {saving ? 'Processing...' : 'Create Subscription'}
                    </button>
                 </div>
              </form>
           </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-8">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                 <Info size={18} /> Subscription Information
              </h2>
              
              <div className="p-5 bg-cyan-50 border border-cyan-100 rounded-xl space-y-4">
                 <h3 className="text-xs font-black text-cyan-900 flex items-center gap-2 italic uppercase tracking-tighter">
                   <Zap size={14} className="fill-cyan-500" /> Creating Manual Subscription
                 </h3>
                 <p className="text-[11px] font-semibold text-cyan-900 leading-relaxed italic opacity-80">
                    You are creating a manual subscription for this user. This will not process any payment and is typically used for:
                 </p>
                 <ul className="space-y-3 pl-4 list-disc text-[11px] font-bold text-cyan-800 italic opacity-90">
                    <li>Adding complimentary subscriptions</li>
                    <li>Extending existing subscriptions</li>
                    <li>Handling offline payments</li>
                 </ul>
              </div>

              <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                 <h3 className="text-xs font-black text-orange-900 flex items-center gap-2 italic uppercase tracking-tighter">
                   <Info size={14} className="fill-orange-500" /> Important Note
                 </h3>
                 <p className="text-[11px] font-semibold text-orange-900 leading-relaxed italic opacity-80">
                    Creating a new subscription will not automatically cancel any existing active subscriptions. If needed, please cancel active subscriptions first.
                 </p>
              </div>
           </div>

           {/* Selected Plan Details Block */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                 <ShieldCheck size={18} /> Selected Plan Details
              </h2>
              
              {selectedPlan ? (
                <div className="space-y-6 pt-2">
                   <div className="flex justify-between items-center text-[13px] font-black italic">
                      <span className="text-slate-400 tracking-tighter">Plan Name:</span>
                      <span className="text-slate-900">{selectedPlan.name}</span>
                   </div>
                   <div className="flex justify-between items-center text-[13px] font-black italic">
                      <span className="text-slate-400 tracking-tighter">Base Price:</span>
                      <span className="text-slate-900">₹{selectedPlan.price}</span>
                   </div>
                   <div className="flex justify-between items-center text-[13px] font-black italic">
                      <span className="text-slate-400 tracking-tighter">Duration:</span>
                      <span className="text-slate-900">{selectedPlan.duration_days} Days</span>
                   </div>
                   <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 italic">
                         <Layers size={14} /> Listings: {selectedPlan.listings_limit === -1 ? 'Unlimited' : selectedPlan.listings_limit}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 italic">
                         <Users size={14} /> Leads: {selectedPlan.leads_limit === -1 ? 'Unlimited' : selectedPlan.leads_limit}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                   <Zap size={32} className="text-slate-300 mb-3" />
                   <p className="text-[11px] font-black text-slate-400 italic uppercase">Please select a subscription plan to see its details</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
