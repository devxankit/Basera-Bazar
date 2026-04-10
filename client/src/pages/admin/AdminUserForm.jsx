import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Shield, Briefcase, MapPin, 
  Save, X, AlertCircle, CheckCircle2, Loader2, ChevronRight, 
  UserPlus, Edit3, Key, Activity, Heart, Star, LayoutGrid,
  Map, Package, Zap, Globe, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const SUPPLY_CATEGORIES = ['Aggregate', 'Bricks', 'Cement', 'Construction Material', 'Sand', 'TMT'];

const INDIAN_STATES = {
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer", "Kota", "Bhilwara", "Alwar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Noida", "Ghaziabad", "Prayagraj"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "East Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Mangaluru", "Belagavi", "Gulbarga"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Darjeeling"]
};

export default function AdminUserForm() {
  const { id } = useParams(); 
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer',
    is_active: true,
    partner_type: 'property_agent',
    active_subscription_id: '',
    state: '',
    district: '',
    address: '',
    material_categories: [],
    service_category_id: '',
    delivery_radius_km: 10
  });

  const [subscriptions, setSubscriptions] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        // 1. Fetch Dynamic Form Dependencies Parallelly
        const [subRes, catRes] = await Promise.all([
          api.get('/admin/subscriptions/plans'),
          api.get('/admin/system/categories?type=service')
        ]);

        if (subRes.data.success) setSubscriptions(subRes.data.data);
        if (catRes.data.success) setServiceCategories(catRes.data.data);

        // 2. Fetch User Data if Editing
        if (isEdit) {
          const response = await api.get(`/admin/users/${id}`);
          if (response.data.success) {
            const u = response.data.data;
            const profile = u.partner_profile || {};
            setFormData({
              name: u.name || '',
              email: u.email || '',
              phone: u.phone || '',
              password: '',
              role: u.role || 'Customer',
              is_active: u.is_active ?? true,
              partner_type: u.partner_type || 'property_agent',
              active_subscription_id: u.active_subscription_id || '',
              state: profile.state || '',
              district: profile.district || '',
              address: profile.address || '',
              material_categories: profile.supplier_profile?.material_categories || [],
              service_category_id: profile.service_profile?.service_category_id || '',
              delivery_radius_km: profile.supplier_profile?.delivery_radius_km || 10
            });
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to sync database references. Retrying...");
      } finally {
        setInitLoading(false);
      }
    };
    fetchInitData();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (isEdit) {
        response = await api.put(`/admin/users/${id}`, formData);
      } else {
        response = await api.post('/admin/users', formData);
      }

      if (response.data.success) {
        setSuccess(`Database Entry ${isEdit ? 'Updated' : 'Securely Created'}! Navigating...`);
        setTimeout(() => navigate('/admin/users'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Cloud DB rejected submission. Check uniqueness constraints.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      // Reset dependent fields when role changes
      if (name === 'role') {
        if (value === 'Supplier') newData.partner_type = 'supplier';
        else if (value === 'Service Provider') newData.partner_type = 'service_provider';
        else newData.partner_type = 'property_agent';
        
        // Reset location if not partner
        if (value === 'Customer' || value === 'Admin') {
          newData.state = '';
          newData.district = '';
        }
      }

      // Reset district if state changes
      if (name === 'state') newData.district = '';

      return newData;
    });
  };

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const current = prev.material_categories || [];
      const updated = current.includes(cat) 
        ? current.filter(c => c !== cat)
        : [...current, cat];
      return { ...prev, material_categories: updated };
    });
  };

  const isPartner = ['Agent', 'Supplier', 'Service Provider'].includes(formData.role);
  const isSupplier = formData.role === 'Supplier';
  const isServiceProvider = formData.role === 'Service Provider';
  const isCustomer = formData.role === 'Customer' || formData.role === 'Admin';

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 border-r-4 border-r-transparent border-b-4 border-indigo-600/20"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Establishing DB Tunnel...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/admin/users')}>
             <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
               <UserPlus className="text-slate-400 group-hover:text-indigo-600" size={16} />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database / User Registry</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            {isEdit ? 'Refine Credentials' : 'Secure Registration'}
          </h1>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Load</p>
             <p className="text-sm font-black text-emerald-500">OPTIMAL</p>
           </div>
           <div className="h-10 w-px bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Tier</p>
             <p className="text-sm font-black text-indigo-600 uppercase">SuperAdmin</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
           
           {/* Section 1: Core Identity */}
           <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Identity Information</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Primary System Credentials</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Auto-Validated
                </div>
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Legal Name</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input name="name" required value={formData.name} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" placeholder="e.g. Rahul Sharma" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Access</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" placeholder="rahul@example.com" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Secure Link (Phone)</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input name="phone" required maxLength={10} value={formData.phone} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" placeholder="10-digit primary contact" />
                  </div>
                </div>

                {!isEdit && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vault Key (Password)</label>
                    <div className="relative group">
                      <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all" placeholder="••••••••" />
                    </div>
                  </div>
                )}
              </div>
           </div>

           {/* Section 2: Global Permissions (Role Hidden logic refined) */}
           <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl">
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Access Configuration</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Platform Integrity Controls</p>
                  </div>
                </div>
              </div>
              
              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Master Role</label>
                      <select name="role" value={formData.role} onChange={handleChange} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer">
                        <option value="Customer">Regular Customer</option>
                        <option value="Agent">Property Expert</option>
                        <option value="Supplier">Material Supplier</option>
                        <option value="Service Provider">Technical Professional</option>
                        <option value="Admin">Platform Admin</option>
                      </select>
                    </div>

                    {!isCustomer && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Internal Category</label>
                        <select name="partner_type" value={formData.partner_type} onChange={handleChange} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer">
                          <option value="property_agent">Property Expert</option>
                          <option value="supplier">Material Supplier</option>
                          <option value="service_provider">Technical Pro</option>
                        </select>
                      </div>
                    )}
                 </div>

                 <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-5">
                       <div className={`p-4 rounded-2xl ${formData.is_active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-slate-200 text-white'}`}>
                         <Shield size={24} />
                       </div>
                       <div>
                         <h4 className="font-black text-slate-900 text-lg">Grant Data Access</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enable immediate login capabilities</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                      <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only peer" />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm"></div>
                    </label>
                 </div>
              </div>
           </div>

           {/* Section 3: Professional/Partner Details */}
           {!isCustomer && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                  <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-xl">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Commercial Status</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Revenue & Operations Layer</p>
                  </div>
                </div>
                
                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Platform Subscription</label>
                      <div className="relative">
                        <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select name="active_subscription_id" value={formData.active_subscription_id} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-orange-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer">
                          <option value="">Manual/No Active Plan</option>
                          {subscriptions.map(plan => (
                            <option key={plan._id} value={plan._id}>{plan.applicable_to?.[0] || 'Basic'} - ₹{plan.price} ({plan.duration_days} Days)</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isServiceProvider && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Technical Specialization</label>
                        <select name="service_category_id" value={formData.service_category_id} onChange={handleChange} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all cursor-pointer">
                          <option value="">Select Service Specialty</option>
                          {serviceCategories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {isSupplier && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Logistics Perimeter (KM)</label>
                        <div className="relative group">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={18} />
                          <input type="number" name="delivery_radius_km" value={formData.delivery_radius_km} onChange={handleChange} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:bg-white focus:border-orange-500 outline-none font-bold text-slate-700 transition-all shadow-inner focus:shadow-none" placeholder="e.g. 50" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Operational State</label>
                        <select name="state" value={formData.state} onChange={handleChange} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold text-slate-700 cursor-pointer">
                           <option value="">Select State</option>
                           {Object.keys(INDIAN_STATES).map(st => (
                             <option key={st} value={st}>{st}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Operational District / City</label>
                        <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.state} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[24px] focus:border-indigo-600 outline-none font-bold text-slate-700 cursor-pointer disabled:opacity-50">
                           <option value="">{formData.state ? 'Select District' : 'First Choose State'}</option>
                           {formData.state && INDIAN_STATES[formData.state].map(dst => (
                             <option key={dst} value={dst}>{dst}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Official Business Address</label>
                     <textarea name="address" rows={3} value={formData.address} onChange={handleChange} placeholder="Please provide the full legal/operational location..." className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[32px] focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all shadow-inner focus:shadow-none" />
                  </div>
                </div>
              </motion.div>
           )}

           {/* Section 4: Supply Portfolio */}
           {isSupplier && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/20 flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Material Categories</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dynamic Supply Portfolio</p>
                  </div>
                </div>

                <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                   {SUPPLY_CATEGORIES.map(cat => (
                     <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all text-left ${formData.material_categories.includes(cat) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200'}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.material_categories.includes(cat) ? 'border-white bg-white/20' : 'border-slate-200'}`}>
                           {formData.material_categories.includes(cat) && <CheckCircle2 size={14} strokeWidth={4} />}
                        </div>
                        <span className="font-black text-xs uppercase tracking-wider">{cat}</span>
                     </button>
                   ))}
                </div>
              </motion.div>
           )}
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[44px] p-12 text-white space-y-10 shadow-3xl sticky top-10 border border-white/5">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                  <Globe className="text-orange-500 animate-pulse" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter leading-none italic">Database Registry</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed tracking-tight">
                  Database commit will be performed under SuperAdmin authority. All modifications are logged to the audit system.
                </p>
              </div>

              <div className="space-y-4 pt-10">
                 <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-5 py-8 bg-indigo-600 text-white rounded-[32px] font-black text-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                   {loading ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} strokeWidth={3} />}
                   {isEdit ? 'Sync Changes' : 'Push to DB'}
                 </button>
                 <button type="button" onClick={() => navigate(-1)} className="w-full flex items-center justify-center gap-5 py-8 bg-white/5 text-white rounded-[32px] font-black text-2xl hover:bg-white/10 transition-all border border-white/10">
                   <X size={28} strokeWidth={3} />
                   Discard
                 </button>
              </div>

              <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-start gap-4 shadow-inner">
                  <AlertCircle className="text-rose-500 shrink-0 mt-1" />
                  <p className="text-rose-200 font-bold text-sm leading-tight tracking-tight">{error}</p>
                </motion.div>}

                {success && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-start gap-4 shadow-inner">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" />
                  <p className="text-emerald-200 font-bold text-sm leading-tight tracking-tight">{success}</p>
                </motion.div>}
              </AnimatePresence>
           </div>
        </div>
      </form>
    </div>
  );
}
