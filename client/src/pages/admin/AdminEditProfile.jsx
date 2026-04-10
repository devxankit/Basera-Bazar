import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, CheckCircle2, Save, Key, Upload, Lock, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white placeholder-slate-300";
const labelClass = "block text-sm font-bold text-slate-600 mb-1.5";

export default function AdminEditProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '',
    role: 'SuperAdmin', status: 'Active', profileImage: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Fetch profile from DB on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get('/admin/profile/me');
        if (res.data.success) {
          const d = res.data.data;
          setProfile(d);
          setProfileForm({
            name: d.name || 'Super Admin',
            email: d.email || '',
            phone: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            state: d.state || '',
            role: d.role || 'super_admin',
            status: d.status || 'Active',
            profileImage: d.profileImage || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
        const errMsg = err.response?.data?.message || `Connection failed (${err.code || 'Check if server is running on port 5001'})`;
        setFetchError(errMsg);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local Preview (Instant)
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(prev => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);

    // Actual Upload to Cloudinary
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setProfileForm(prev => ({ ...prev, profileImage: res.data.url }));
        setProfileMsg({ type: 'success', text: 'Image uploaded! Remember to save profile.' });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setProfileMsg({ type: 'error', text: 'Image upload failed. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/admin/profile/update', {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        profileImage: profileForm.profileImage,
      });
      if (res.data.success) {
        const updatedDoc = res.data.data;
        setProfile(updatedDoc);
        updateUser(updatedDoc); // Sync global context (Header/Sidebar)
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: res.data.message || 'Update failed.' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Server error. Please try again.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.put('/admin/profile/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: res.data.message || 'Failed to change password.' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Server error. Please try again.' });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMsg(null), 4000);
    }
  };

  if (loadingProfile) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Profile...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-10 bg-white rounded-3xl border border-slate-100 max-w-2xl mx-auto my-12 text-center shadow-2xl">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Profile Loading Failed</h2>
            <p className="text-slate-400 font-medium">The server rejected the current session identity.</p>
          </div>
          
          <div className="bg-slate-900/5 p-4 rounded-2xl border border-slate-900/10 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Response:</p>
            <code className="text-[13px] text-rose-600 font-bold block leading-relaxed">{fetchError}</code>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button onClick={() => window.location.reload()} className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Try Again</button>
          <button onClick={() => { localStorage.clear(); window.location.assign('/admin/login'); }} className="flex-1 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95">Reset & Re-login</button>
        </div>
        
        <div className="pt-4 border-t border-slate-50 w-full mt-2">
          <p className="text-[11px] text-slate-400 font-bold">Current ID in Token: <span className="text-slate-900 font-black">{user?.id || user?._id || 'MISSING'}</span></p>
        </div>
      </div>
    );
  }

  const initials = profileForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
        <p className="text-slate-400 font-medium text-sm mt-1">Manage your administrator account details and security settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT: Profile Summary Card ── */}
        <div className="w-full lg:w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
            <User size={16} className="text-slate-400" />
            <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Profile Summary</span>
          </div>

          {/* Avatar & Name */}
          <div className="flex flex-col items-center py-8 px-5 border-b border-slate-50">
            <div className="relative group/avatar">
              {profileForm.profileImage ? (
                <img 
                  src={profileForm.profileImage} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover/avatar:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200 group-hover/avatar:scale-105 transition-transform duration-500">
                  {initials}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight text-center mt-4">{profileForm.name}</h3>
            <span className="mt-2 px-3 py-1 bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest rounded-md">
              SuperAdmin
            </span>
          </div>

          {/* Contact Info */}
          <div className="px-5 py-6 space-y-6 border-b border-slate-50">
            {/* Email Row */}
            <div className="group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Email Address</p>
              <a
                href={`mailto:${profileForm.email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Mail size={18} />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[13px] font-bold text-slate-700 break-all leading-tight">
                    {profileForm.email}
                  </p>
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Send Mail</p>
                </div>
              </a>
            </div>

            {/* Phone Row */}
            <div className="group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Phone Number</p>
              <a
                href={`tel:${profileForm.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Phone size={18} />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[14px] font-bold text-slate-700">
                    {profileForm.phone || 'Not provided'}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Call Now</p>
                </div>
              </a>
            </div>

            {/* Address */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Office Location</p>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
                <p className="text-sm font-bold leading-relaxed">
                  {[profileForm.address, profileForm.city, profileForm.state].filter(Boolean).join(', ') || 'Address not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Status</p>
            <span className="px-3 py-1.5 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-md inline-flex items-center gap-1.5">
              <CheckCircle2 size={12} /> {profileForm.status}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Form Sections ── */}
        <div className="flex-grow space-y-6">

          {/* Update Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <form onSubmit={handleProfileSubmit}>
              <div className="p-6 space-y-5">
                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
                    <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address <span className="text-rose-500">*</span></label>
                    <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} className={inputClass} required />
                  </div>
                </div>

                {/* Row 2: Phone + Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Phone Number <span className="text-rose-500">*</span></label>
                    <input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Profile Image</label>
                    <label className="flex items-center gap-0 border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-300 transition-all bg-white group/upload">
                      <span className="px-4 py-3 bg-slate-50 border-r border-slate-200 text-sm font-bold text-slate-600 flex items-center gap-2 whitespace-nowrap group-hover/upload:bg-indigo-50 group-hover/upload:text-indigo-600 transition-colors">
                        {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} 
                        {uploadingImage ? 'Uploading...' : 'Choose file'}
                      </span>
                      <span className="px-4 py-3 text-sm text-slate-400 truncate flex-grow flex items-center gap-3">
                        {profileForm.profileImage && (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                            <img src={profileForm.profileImage} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        )}
                        {profileForm.profileImage && typeof profileForm.profileImage === 'string' && profileForm.profileImage.startsWith('http') 
                          ? 'image_uploaded.png' 
                          : (profileForm.profileImage?.name || 'No file chosen')}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1.5">Recommended: 300×300 px (JPG, PNG)</p>
                  </div>
                </div>

                {/* Row 3: Address */}
                <div>
                  <label className={labelClass}>Address</label>
                  <textarea name="address" value={profileForm.address} onChange={handleProfileChange} rows={3} className={`${inputClass} resize-none`} placeholder="Enter full address..." />
                </div>

                {/* Row 4: City + State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>City</label>
                    <input type="text" name="city" value={profileForm.city} onChange={handleProfileChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input type="text" name="state" value={profileForm.state} onChange={handleProfileChange} className={inputClass} />
                  </div>
                </div>

                {/* Row 5: Role + Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      Role <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black rounded uppercase tracking-wider">SuperAdmin only</span>
                    </label>
                    <select name="role" value={profileForm.role} onChange={handleProfileChange} className={inputClass} disabled>
                      <option value="super_admin">SuperAdmin</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Account Status <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black rounded uppercase tracking-wider">SuperAdmin only</span>
                    </label>
                    <select name="status" value={profileForm.status} onChange={handleProfileChange} className={inputClass}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                {profileMsg && (
                  <span className={`text-sm font-bold flex items-center gap-2 ${profileMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {profileMsg.text}
                  </span>
                )}
                <div className="ml-auto">
                  <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 uppercase tracking-wide">
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {savingProfile ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Update Password Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2.5">
              <Key size={16} className="text-slate-400" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Update Password</span>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { label: 'Current Password', name: 'currentPassword', value: passwordForm.currentPassword },
                    { label: 'New Password', name: 'newPassword', value: passwordForm.newPassword },
                    { label: 'Confirm Password', name: 'confirmPassword', value: passwordForm.confirmPassword },
                  ].map(field => (
                    <div key={field.name}>
                      <label className={labelClass}>{field.label} <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input type="password" name={field.name} value={field.value} onChange={handlePasswordChange} className={`${inputClass} pr-10`} required />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                {passwordMsg && (
                  <span className={`text-sm font-bold flex items-center gap-2 ${passwordMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {passwordMsg.text}
                  </span>
                )}
                <div className="ml-auto">
                  <button type="submit" disabled={savingPassword} className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 uppercase tracking-wide">
                    {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    {savingPassword ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
