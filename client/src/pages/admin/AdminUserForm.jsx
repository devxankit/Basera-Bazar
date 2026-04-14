import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Shield, Briefcase, MapPin, 
  UserPlus, Activity, LayoutGrid, Zap, Package, 
  CheckCircle2, Save, X, Loader2, AlertCircle, ArrowLeft
} from 'lucide-react';
import api from '../../services/api';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

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
    name: '', email: '', phone: '', password: '', role: 'Customer',
    is_active: true, partner_type: 'property_agent', active_subscription_id: '',
    state: '', district: '', address: '', material_categories: [],
    service_category_id: '', delivery_radius_km: 10
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
        const [subRes, catRes] = await Promise.all([
          api.get('/admin/subscriptions/plans'),
          api.get('/admin/system/categories?type=service')
        ]);

        if (subRes.data.success) setSubscriptions(subRes.data.data);
        if (catRes.data.success) setServiceCategories(catRes.data.data);

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
        setError("Failed to sync database references.");
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
        setSuccess(`User ${isEdit ? 'updated' : 'created'} successfully!`);
        setTimeout(() => navigate('/admin/users'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      if (name === 'role') {
        if (value === 'Supplier') newData.partner_type = 'supplier';
        else if (value === 'Service Provider') newData.partner_type = 'service_provider';
        else newData.partner_type = 'property_agent';
        
        if (value === 'Customer' || value === 'Admin') {
          newData.state = '';
          newData.district = '';
        }
      }

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

  const isSupplier = formData.role === 'Supplier';
  const isServiceProvider = formData.role === 'Service Provider';
  const isPartner = formData.role !== 'Customer' && formData.role !== 'Admin';

  if (initLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <ArrowLeft size={18} />
            </button>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">User Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Refine User' : 'Add New User'}
          </h1>
        </div>
      </div>

      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
              <User size={16} className="text-slate-400" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Identity Information</span>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
                  <input name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <label className={labelClass}>Email Address <span className="text-rose-500">*</span></label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="rahul@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Phone Number <span className="text-rose-500">*</span></label>
                  <input name="phone" required maxLength={10} value={formData.phone} onChange={handleChange} className={inputClass} placeholder="10-digit primary contact" />
                </div>
                {!isEdit && (
                  <div>
                    <label className={labelClass}>Account Password <span className="text-rose-500">*</span></label>
                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Access Control Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
              <LayoutGrid size={16} className="text-slate-400" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Access Configuration</span>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>System Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                    <option value="Customer">Regular Customer</option>
                    <option value="Agent">Property Expert</option>
                    <option value="Supplier">Material Supplier</option>
                    <option value="Service Provider">Service Provider</option>
                    <option value="Admin">Platform Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-5 pt-7">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Account Active</span>
                    <span className="text-[11px] text-slate-400 font-medium">Grant immediate login access</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-sm"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Details Card (Conditional) */}
          {isPartner && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <Briefcase size={16} className="text-slate-400" />
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Commercial Status</span>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Platform Subscription</label>
                    <select name="active_subscription_id" value={formData.active_subscription_id} onChange={handleChange} className={inputClass}>
                      <option value="">Manual/No Active Plan</option>
                      {subscriptions.map(plan => (
                        <option key={plan._id} value={plan._id}>{plan.applicable_to?.[0] || 'Basic'} - ₹{plan.price}</option>
                      ))}
                    </select>
                  </div>
                  {isServiceProvider && (
                    <div>
                      <label className={labelClass}>Technical Specialty</label>
                      <select name="service_category_id" value={formData.service_category_id} onChange={handleChange} className={inputClass}>
                        <option value="">Select Specialty</option>
                        {serviceCategories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {isSupplier && (
                    <div>
                      <label className={labelClass}>Delivery Radius (KM)</label>
                      <input type="number" name="delivery_radius_km" value={formData.delivery_radius_km} onChange={handleChange} className={inputClass} placeholder="e.g. 50" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Operating State</label>
                    <select name="state" value={formData.state} onChange={handleChange} className={inputClass}>
                      <option value="">Select State</option>
                      {Object.keys(INDIAN_STATES).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Operating District</label>
                    <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.state} className={inputClass}>
                      <option value="">{formData.state ? 'Select District' : 'First Choose State'}</option>
                      {formData.state && INDIAN_STATES[formData.state]?.map(dst => <option key={dst} value={dst}>{dst}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Business Address</label>
                  <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Full legal location..." />
                </div>

                {isSupplier && (
                  <div className="space-y-3 pt-2">
                    <label className={labelClass}>Material Portfolio</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {SUPPLY_CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${formData.material_categories.includes(cat) ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${formData.material_categories.includes(cat) ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                            {formData.material_categories.includes(cat) && <CheckCircle2 size={10} strokeWidth={4} />}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
            <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {error && <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5"><AlertCircle size={14} /> {error}</span>}
                {success && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> {success}</span>}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 uppercase tracking-wide">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isEdit ? 'Save Changes' : 'Register User'}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
