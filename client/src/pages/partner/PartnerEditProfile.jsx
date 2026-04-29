import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Save, Building2, 
  Mail, Phone, MapPin, User, Loader2, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    email: '',
    role: '',
    category: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        email: user.email || '',
        role: user.role || '',
        category: user.category || ''
      });
    } else {
      navigate('/partner/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/auth/profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        // For roles like Supplier, we might need business info
        ...(formData.businessName && { businessName: formData.businessName }),
        ...(formData.category && { category: formData.category })
      });

      if (response.data.success) {
        updateUser(response.data.data);
        
        // Log Activity
        const uid = user?._id || user?.id;
        if (uid) {
           const logKey = `baserabazar_activity_${uid}`;
           let logs = [];
           try { logs = JSON.parse(localStorage.getItem(logKey)) || []; } catch(e){}
           logs.push({
             type: 'profile',
             title: 'Profile Updated',
             time: 'Just now',
             timestamp: new Date().toISOString()
           });
           localStorage.setItem(logKey, JSON.stringify(logs));
        }

        alert('Profile updated successfully!');
        navigate('/partner/profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      alert(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-slate-50 font-sans pb-10">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/profile')}
            className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-[20px] font-medium text-[#001b4e]">Edit Profile</h2>
        </div>
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-5 pt-8 max-w-md mx-auto">
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          {/* Avatar Section (Read Only in this view) */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-[#001b4e] rounded-full flex items-center justify-center text-[40px] font-medium text-white shadow-xl shadow-blue-900/10 mb-2">
              {formData.name?.charAt(0) || 'U'}
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
              <InputField 
                icon={<Building2 size={18} />} 
                label="Business Name" 
                value={formData.businessName}
                onChange={(v) => setFormData({...formData, businessName: v})}
                placeholder="Enter your business name"
              />
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
      <label className="text-[13px] font-bold text-slate-500 ml-1 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-[#001b4e] transition-colors">
          {icon}
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-[15px] shadow-sm border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium text-[#181d5f]"
          required
        />
      </div>
    </div>
  );
}
