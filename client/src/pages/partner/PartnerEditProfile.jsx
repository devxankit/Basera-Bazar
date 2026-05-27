import React, { useState, useEffect } from 'react';
import toast from '../../mockToast';
import {
  ArrowLeft, Edit2, Save, Building2,
  Mail, Phone, MapPin, User, Loader2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { v } from '../../utils/validators';

const SUPPLIER_CATEGORIES = [
  'Aggregate supplier', 
  'bricks suppliers', 
  'cement supplier', 
  'construction materials supplier', 
  'sand supplier', 
  'tmt supplier'
];

export default function PartnerEditProfile() {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    email: '',
    role: '',
    category: '',
    businessDescription: '',
    businessLogo: ''
  });

  useEffect(() => {
    refreshUser().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        role: user.role || '',
        category: user.category || '',
        businessName: user.business_name || '',
        businessDescription: user.business_description || '',
        businessLogo: user.business_logo || ''
      });
    } else {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => api.put('/auth/profile', payload).then(r => r.data),
    onSuccess: (data) => {
      if (data.success) {
        updateUser(data.data);
        const uid = user?._id || user?.id;
        if (uid) {
          const logKey = `baserabazar_activity_${uid}`;
          let logs = [];
          try { logs = JSON.parse(localStorage.getItem(logKey)) || []; } catch (e) {}
          logs.push({ type: 'profile', title: 'Profile Updated', time: 'Just now', timestamp: new Date().toISOString() });
          localStorage.setItem(logKey, JSON.stringify(logs));
        }
        toast.success('Profile updated successfully!');
        navigate('/partner/profile');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  });

  const loading = updateProfileMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameErr = v.name(formData.name);
    if (nameErr) { toast.error(nameErr); return; }
    const emailErr = v.emailOptional(formData.email);
    if (emailErr) { toast.error(emailErr); return; }
    if (formData.businessDescription && formData.businessDescription.trim().length > 0 && formData.businessDescription.trim().length < 10) {
      toast.error('Business description must be at least 10 characters.'); return;
    }
    updateProfileMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      business_name: formData.businessName,
      business_description: formData.businessDescription,
      business_logo: formData.businessLogo,
      ...(formData.category && { category: formData.category })
    });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-slate-50 font-sans pb-10" style={{ overflowX: 'clip' }}>
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Edit Profile</h2>
        </div>
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-5 pt-8 max-w-md mx-auto">
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-[#001b4e] rounded-full flex items-center justify-center text-[32px] font-black text-white shadow-xl shadow-blue-900/10 mb-2 border-4 border-white">
              {formData.name?.charAt(0) || 'U'}
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Partner Account</div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Business Logo</label>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                {formData.businessLogo ? (
                  <img src={formData.businessLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={24} className="text-slate-200" />
                )}
              </div>
              <div className="flex-1">
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const fd = new FormData();
                        fd.append('image', file);
                        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        if (res.data.success) {
                          setFormData(prev => ({ ...prev, businessLogo: res.data.url }));
                        }
                      } catch {
                        toast.error('Logo upload failed. Please try again.');
                      }
                    };
                    input.click();
                  }}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {formData.businessLogo ? 'Change Logo' : 'Upload Business Logo'}
                </button>
                <div className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or SVG. Max 2MB.</div>
              </div>
              {formData.businessLogo && (
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, businessLogo: '' })}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <InputField 
              icon={<User size={18} />} 
              label="Full Name" 
              value={formData.name}
              onChange={(v) => setFormData({...formData, name: v})}
              placeholder="Enter your full name"
            />

            <InputField 
              icon={<Mail size={18} />} 
              label="Email Address" 
              value={formData.email}
              onChange={(v) => setFormData({...formData, email: v})}
              placeholder="Enter your email address"
              type="email"
            />

            <InputField 
              icon={<Phone size={18} />} 
              label="Phone Number" 
              value={formData.phone}
              onChange={(v) => setFormData({...formData, phone: v})}
              placeholder="Enter your phone number"
              type="tel"
            />

            {formData.role !== 'agent' && (
              <>
                <InputField 
                  icon={<Building2 size={18} />} 
                  label="Business Name" 
                  value={formData.businessName}
                  onChange={(v) => setFormData({...formData, businessName: v})}
                  placeholder="Enter your business name"
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Business Description</label>
                  <div className="relative group">
                    <div className="absolute top-4 left-4 text-slate-400 group-focus-within:text-[#001b4e] transition-colors">
                      <Edit2 size={16} />
                    </div>
                    <textarea 
                      value={formData.businessDescription}
                      onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
                      placeholder="Tell us about your business..."
                      className="w-full bg-white rounded-xl py-3.5 pl-11 pr-4 text-[14px] shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-[#001b4e] min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.role === 'supplier' && (
              <div className="pt-2">
                <label className="text-[13px] font-bold text-slate-500 ml-1 uppercase tracking-wider mb-2 block">Product Categories</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPLIER_CATEGORIES.map(category => {
                    let currentCats = [];
                    if (typeof formData.category === 'string') {
                      currentCats = formData.category ? formData.category.split(', ') : [];
                    } else if (Array.isArray(formData.category)) {
                      currentCats = formData.category;
                    }
                    
                    const isSelected = currentCats.includes(category);
                    
                    const toggleCategory = () => {
                       let newCats;
                       if (isSelected) {
                         newCats = currentCats.filter(c => c !== category);
                       } else {
                         newCats = [...currentCats, category];
                       }
                       setFormData({ ...formData, category: newCats.join(', ') });
                    };

                    return (
                      <div 
                        key={category} 
                        onClick={toggleCategory}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected 
                            ? 'border-[#001b4e] bg-blue-50/50' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-[#001b4e] border-[#001b4e]' : 'border-slate-300'
                        }`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <span className="text-[14px] font-medium text-[#001b4e] capitalize leading-tight">
                          {category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/partner/profile')}
              className="flex-1 bg-white text-slate-600 py-4 rounded-2xl font-bold text-[15px] border border-slate-200 active:scale-95 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#001b4e] text-white py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

function InputField({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-[#001b4e] transition-colors">
          {React.cloneElement(icon, { size: 16 })}
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white rounded-xl py-3.5 pl-11 pr-4 text-[14px] shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-[#001b4e]"
          required
        />
      </div>
    </div>
  );
}
