import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { toast } from '../../../mockToast';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'];

const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white placeholder-slate-300';
const labelCls = 'block text-sm font-bold text-slate-600 mb-1.5';

const EMPTY_FORM = {
  name: '', phone: '', email: '', state: '', district: '', zone: '',
  fixed_salary: 25000, commission_rate: 5,
  password: '', confirm_password: '',
  profile_image: '',
  address: { address_line: '', city: '', state: '', pincode: '' },
};

export default function AdminTeamLeaderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { isLoading: fetching } = useQuery({
    queryKey: ['admin-team-leader-form', id],
    queryFn: () => api.get(`/admin/staff/team-leaders/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      if (data.success) {
        const tl = data.data;
        setForm((prev) => ({
          ...prev,
          name: tl.name || '',
          phone: tl.phone || '',
          email: tl.email || '',
          state: tl.state || '',
          district: tl.district || '',
          zone: tl.zone || '',
          fixed_salary: tl.fixed_salary || 25000,
          commission_rate: tl.commission_rate || 5,
          profile_image: tl.profile_image || '',
          address: tl.address || { address_line: '', city: '', state: '', pincode: '' },
        }));
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => isEdit
      ? api.put(`/admin/staff/team-leaders/${id}`, payload).then((r) => r.data)
      : api.post('/admin/staff/team-leaders', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-leaders'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['admin-team-leader-detail', id] });
      toast.success(isEdit ? 'Team Leader updated successfully.' : 'Team Leader created successfully.');
      navigate('/admin/staff/team-leaders');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save Team Leader.'),
  });

  const loading = saveMutation.isLoading;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('File too large (max 2MB)');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        set('profile_image', data.url);
        toast.success('Image uploaded.');
      }
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAddress = (field, value) => setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 0: case 1: return { score, label: 'Very Weak', color: 'bg-red-500' };
      case 2: return { score, label: 'Weak', color: 'bg-amber-500' };
      case 3: return { score, label: 'Medium', color: 'bg-blue-500' };
      case 4: return { score, label: 'Strong', color: 'bg-green-500' };
      default: return { score, label: '', color: 'bg-slate-200' };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit && form.password !== form.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!isEdit && getPasswordStrength(form.password).score < 3) {
      toast.error('Please use a stronger password.');
      return;
    }
    const payload = { ...form };
    delete payload.confirm_password;
    if (isEdit) delete payload.password;
    saveMutation.mutate(payload);
  };

  if (isEdit && fetching) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  const strength = getPasswordStrength(form.password);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/staff/team-leaders')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Team Leader' : 'Add Team Leader'}</h1>
          <p className="text-sm text-slate-500">State Head — Manages Field Executives and Office Staff</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Profile Image */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
              {form.profile_image ? (
                <img src={form.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 font-black text-3xl">{form.name?.[0]?.toUpperCase() || '?'}</div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 shadow-lg transition-transform hover:scale-110">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              <Save size={14} />
            </label>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">Profile Picture</h2>
            <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-wider">JPG, PNG OR WEBP (MAX 2MB)</p>
            <p className="text-[10px] text-slate-400 mt-2 italic">Recommended: Square aspect ratio for best display</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Rajesh Kumar" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone Number *</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required placeholder="10-digit mobile" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="work@email.com" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Location Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>State *</label>
              <select value={form.state} onChange={(e) => set('state', e.target.value)} required className={inputCls}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>District</label>
              <input type="text" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Lucknow" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Zone</label>
              <input type="text" value={form.zone} onChange={(e) => set('zone', e.target.value)} placeholder="e.g. North Zone" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Salary Structure */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Salary Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fixed Monthly Salary *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={form.fixed_salary}
                  onChange={(e) => set('fixed_salary', Number(e.target.value))}
                  min={25000} max={50000}
                  required
                  className={`${inputCls} pl-7`}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Range: ₹25,000 – ₹50,000</p>
            </div>
            <div>
              <label className={labelCls}>Team Commission Rate *</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.commission_rate}
                  onChange={(e) => set('commission_rate', Number(e.target.value))}
                  min={0} max={20} step={0.5}
                  required
                  className={`${inputCls} pr-7`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">% of total team business achieved</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Address Line</label>
              <input type="text" value={form.address.address_line} onChange={(e) => setAddress('address_line', e.target.value)} placeholder="House/Flat, Street, Area" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={form.address.city} onChange={(e) => setAddress('city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pincode</label>
              <input type="text" value={form.address.pincode} onChange={(e) => setAddress('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Credentials (only on create) */}
        {!isEdit && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Login Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Password *</label>
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Min 8 chars" className={inputCls} />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-100'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-black uppercase ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Confirm Password *</label>
                <input type="password" value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} required placeholder="Re-enter password" className={inputCls} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-medium">Requirement: 8+ chars with uppercase, number and special character.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#001b4e] text-white rounded-lg text-sm font-bold hover:bg-[#001337] transition-colors disabled:opacity-60">
            <Save size={15} /> {loading ? 'Saving...' : isEdit ? 'Update Team Leader' : 'Create Team Leader'}
          </button>
          <button type="button" onClick={() => navigate('/admin/staff/team-leaders')} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
