import React, { useState, useEffect } from 'react';
import { IndianRupee, Save, ArrowLeft, Plus, Trash2, Info, CheckCircle2, Infinity as InfinityIcon, Star, Zap, ShieldCheck, ChevronLeft, Minus, X } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminSubscriptionPlanForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    applicable_to: '',
    duration_days: 30,
    price: 0,
    listings_limit: 10,
    featured_listings_limit: 2,
    leads_limit: 50,
    features: [''],
    is_active: true
  });

  const [unlimited, setUnlimited] = useState({
    listings: false,
    featured: false,
    leads: false
  });

  useEffect(() => {
    if (id) {
      const fetchPlan = async () => {
        setLoading(true);
        try {
          const res = await api.get('/admin/subscriptions/plans');
          if (res.data.success) {
            const plan = res.data.data.find(p => p._id === id);
            if (plan) {
              setFormData({
                ...plan,
                applicable_to: plan.applicable_to?.[0] || '',
                features: plan.features?.length > 0 ? plan.features : ['']
              });
              setUnlimited({
                listings: plan.listings_limit === -1,
                featured: plan.featured_listings_limit === -1,
                leads: plan.leads_limit === -1
              });
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPlan();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        applicable_to: [formData.applicable_to],
        listings_limit: unlimited.listings ? -1 : parseInt(formData.listings_limit),
        featured_listings_limit: unlimited.featured ? -1 : parseInt(formData.featured_listings_limit),
        leads_limit: unlimited.leads ? -1 : parseInt(formData.leads_limit),
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (id) {
        await api.put(`/admin/subscriptions/plans/${id}`, payload);
      } else {
        await api.post('/admin/subscriptions/plans', payload);
      }
      navigate('/admin/subscriptions/plans');
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving plan');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing...</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 mt-4 animate-in fade-in duration-500">
      {/* Breadcrumb Header */}
      <div className="px-8 py-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">{id ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h1>
            <span className="text-slate-300">/</span>
            <Link to="/admin/dashboard" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Home</Link>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-12 gap-8">
        {/* Main Form Area */}
        <div className="col-span-12 lg:col-span-8">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Card Header Strip */}
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-1.5 rounded-full">
                       <Plus size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Create New Plan</span>
                 </div>
                 <button 
                  onClick={() => navigate('/admin/subscriptions/plans')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5d6778] text-white font-bold text-[11px] rounded-lg hover:bg-[#4a5463] transition-all uppercase"
                 >
                   <ArrowLeft size={14} /> Back to Plans
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                 {/* Top Row: Name & Role */}
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Plan Name <span className="text-rose-500 font-black">*</span></label>
                       <input 
                        type="text" 
                        required
                        placeholder="e.g. Silver Package"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Target User Role <span className="text-rose-500 font-black">*</span></label>
                       <select 
                        required
                        value={formData.applicable_to}
                        onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all pr-10"
                       >
                         <option value="">Select Role</option>
                         <option value="property_agent">Property Agent</option>
                         <option value="service_provider">Service Provider</option>
                         <option value="supplier">Supplier</option>
                         <option value="mandi_seller">Mandi Seller</option>
                       </select>
                    </div>
                 </div>

                 {/* Price & Duration */}
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Price (₹) <span className="text-rose-500 font-black">*</span></label>
                       <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">₹</div>
                          <input 
                            type="number" 
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-8 pr-4 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Duration (Days) <span className="text-rose-500 font-black">*</span></label>
                       <input 
                        type="number" 
                        required
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
                       />
                       <p className="text-[10px] text-slate-400 italic">Typical values: 30 (1 month), 90 (3 months), 180 (6 months), 365 (1 year)</p>
                    </div>
                 </div>

                 {/* Limits Row */}
                 <div className="grid grid-cols-3 gap-8 pt-4">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Max Listings</label>
                       <input 
                        type="number" 
                        disabled={unlimited.listings}
                        value={formData.listings_limit}
                        onChange={(e) => setFormData({ ...formData, listings_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.listings ? 'bg-slate-50 opacity-40' : ''}`}
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
                             <span className="text-[11px] font-bold text-slate-900">Unlimited Listings</span>
                          </div>
                       </label>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Max Featured Listings</label>
                       <input 
                        type="number" 
                        disabled={unlimited.featured}
                        value={formData.featured_listings_limit}
                        onChange={(e) => setFormData({ ...formData, featured_listings_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.featured ? 'bg-slate-50 opacity-40' : ''}`}
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
                             <span className="text-[11px] font-bold text-slate-900">Unlimited Featured</span>
                          </div>
                       </label>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Number of Leads</label>
                       <input 
                        type="number" 
                        disabled={unlimited.leads}
                        value={formData.leads_limit}
                        onChange={(e) => setFormData({ ...formData, leads_limit: e.target.value })}
                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all ${unlimited.leads ? 'bg-slate-50 opacity-40' : ''}`}
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
                             <span className="text-[11px] font-bold text-slate-900">Unlimited Leads</span>
                          </div>
                       </label>
                       <p className="text-[10px] text-slate-400 italic">Max leads user can receive</p>
                    </div>
                 </div>

                 {/* Description */}
                 <div className="space-y-2 pt-4">
                    <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Description</label>
                    <textarea 
                      rows="4"
                      placeholder="Brief description of the plan"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-300"
                    />
                 </div>

                 {/* Additional Features */}
                 <div className="space-y-4 pt-4">
                    <label className="text-[11px] font-black text-[#5d6778] uppercase tracking-wide">Additional Features</label>
                    <div className="space-y-3">
                       {formData.features.map((feature, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1 relative group">
                               <input 
                                  type="text" 
                                  value={feature}
                                  onChange={(e) => updateFeature(idx, e.target.value)}
                                  placeholder="e.g. Priority customer support"
                                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                               />
                               {formData.features.length > 1 && (
                                 <button 
                                  type="button" 
                                  onClick={() => removeFeature(idx)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center border border-rose-200 text-rose-500 rounded bg-white hover:bg-rose-500 hover:text-white transition-all"
                                 >
                                   <X size={14} />
                                 </button>
                               )}
                            </div>
                         </div>
                       ))}
                       <button 
                        type="button" 
                        onClick={addFeature}
                        className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-600 font-bold text-[11px] rounded-lg hover:bg-orange-50 transition-all uppercase"
                       >
                         <Plus size={16} /> Add Feature
                       </button>
                    </div>
                 </div>

                 {/* Active Status */}
                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-4">
                       <button 
                         type="button" 
                         onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                         className={`relative w-12 h-6 rounded-full transition-all flex items-center px-1 ${formData.is_active ? 'bg-orange-500' : 'bg-slate-300'}`}
                       >
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                       <div>
                          <p className="text-xs font-black text-slate-800 tracking-tight">Active Plan</p>
                          <p className="text-[10px] text-slate-400 italic">If disabled, users won't be able to purchase this plan</p>
                       </div>
                    </div>
                 </div>

                 {/* Form Actions Footer */}
                 <div className="flex justify-end gap-3 pt-8">
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, features: [''], name: '', description: '', price: 0 })}
                      className="px-8 py-2.5 bg-slate-50 text-slate-600 font-bold text-[13px] rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Reset
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-10 py-2.5 bg-[#fa641e] text-white font-black text-[13px] rounded-lg hover:bg-[#e45b1b] transition-all shadow-lg shadow-orange-100"
                    >
                      {saving ? 'Processing...' : id ? 'Update Plan' : 'Create Plan'}
                    </button>
                 </div>
              </form>
           </div>
        </div>

        {/* Sidebar Guide Area */}
        <div className="col-span-12 lg:col-span-4">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8 sticky top-8">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">Plan Creation Guide</h2>
              
              <div className="space-y-6">
                 <div>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-3">Tips for Creating Plans</h3>
                    <ul className="space-y-4">
                       {[
                         { icon: Info, text: 'Create different tiers (Basic, Standard, Premium) for each role' },
                         { icon: Info, text: 'Offer better value for longer duration plans' },
                         { icon: Info, text: 'Consider the specific needs of each user role' },
                         { icon: Info, text: 'Be clear about what each feature includes' },
                         { icon: InfinityIcon, text: 'Use unlimited option for premium plans', color: 'text-emerald-500' }
                       ].map((item, i) => (
                         <li key={i} className="flex gap-3">
                            <item.icon size={14} className={item.color || "text-slate-900"} />
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{item.text}</p>
                         </li>
                       ))}
                    </ul>
                 </div>

                 <div className="pt-6 border-t border-slate-50">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-3">Field Descriptions</h3>
                    <div className="space-y-4 font-bold">
                       <div>
                          <p className="text-[11px] text-slate-900 uppercase tracking-tighter">Max Listings</p>
                          <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">The maximum number of properties, products, or services a user can list</p>
                       </div>
                       <div>
                          <p className="text-[11px] text-slate-900 uppercase tracking-tighter">Featured Listings</p>
                          <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">How many of their listings can be marked as featured (appears at top of search results)</p>
                       </div>
                       <div>
                          <p className="text-[11px] text-slate-900 uppercase tracking-tighter">Number of Leads</p>
                          <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">Maximum number of customer inquiries a user can receive</p>
                       </div>
                       <div>
                          <p className="text-[11px] text-slate-900 uppercase tracking-tighter">Unlimited Option</p>
                          <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">Check the unlimited box to remove restrictions for premium plans</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Platform Branding Footer Footer */}
      <div className="mt-12 px-8 flex items-center justify-between border-t border-slate-200 pt-8 opacity-60">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 BaseraBazar - Real Estate & Construction Marketplace</p>
         <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
         </div>
      </div>
    </div>
  );
}
