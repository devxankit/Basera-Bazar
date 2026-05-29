import React, { useEffect, useState } from 'react';
import {
  Save, Eye, EyeOff, LogOut, UserCircle, Edit3, X,
  Phone, Mail, MapPin, Building2, CreditCard, Key, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest';

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[13px] font-medium text-slate-800 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

export default function TeamLeaderProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: { address_line: '', city: '', state: '', pincode: '' },
    bank_details: { account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '' },
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const loadProfile = () => {
    api.get('/team-leader/profile')
      .then(({ data }) => {
        if (data.success) {
          setProfile(data.data);
          setForm({
            name: data.data.name || '',
            phone: data.data.phone || '',
            address: data.data.address || { address_line: '', city: '', state: '', pincode: '' },
            bank_details: data.data.bank_details || { account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '' },
          });
        }
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setNested = (group, field, value) => setForm((p) => ({ ...p, [group]: { ...p[group], [field]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/team-leader/profile', form);
      if (data.success) {
        toast.success('Profile updated.');
        setProfile((p) => ({ ...p, ...form }));
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match.');
    if (pwForm.new_password.length < 8) return toast.error('Password must be at least 8 characters.');
    setChangingPw(true);
    try {
      await api.put('/auth/staff/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setShowPwSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    logout(true);
    navigate('/staff/login?role=team_leader');
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  const addr = profile?.address;
  const bank = profile?.bank_details;
  const addressStr = [addr?.address_line, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Fullscreen photo */}
      <AnimatePresence>
        {showFullPhoto && (profile?.profile_image || profile?.image) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFullPhoto(false)}
            className="fixed inset-0 z-200 bg-black/90 flex items-center justify-center p-6"
          >
            <img
              src={profile.profile_image || profile.image}
              alt={profile.name}
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <h1 className="text-[16px] font-black text-slate-900 uppercase tracking-wide">My Profile</h1>
        <button
          onClick={() => setIsEditing((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isEditing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isEditing ? <><X size={13} /> Cancel</> : <><Edit3 size={13} /> Edit Profile</>}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile hero */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div
              onClick={() => { if (profile?.profile_image || profile?.image) setShowFullPhoto(true); }}
              className={`w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center shrink-0 ${(profile?.profile_image || profile?.image) ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
              {(profile?.profile_image || profile?.image) ? (
                <img src={profile.profile_image || profile.image} alt={profile?.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={36} className="text-white/70" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white leading-tight truncate">{profile?.name || '—'}</h2>
              <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-widest mt-0.5">Team Leader</p>
              {profile?.state && (
                <p className="text-indigo-300 text-[11px] font-medium mt-1 flex items-center gap-1">
                  <MapPin size={10} /> {profile.state}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* VIEW MODE */}
        {!isEditing && (
          <>
            {/* Contact & Personal */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Personal Info</h3>
              <InfoRow icon={Phone} label="Phone" value={profile?.phone ? `+91 ${profile.phone}` : null} />
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
              <InfoRow icon={MapPin} label="Address" value={addressStr || null} />
            </div>

            {/* Bank Details */}
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bank Details</h3>
              {bank?.account_number ? (
                <>
                  <InfoRow icon={Building2} label="Bank Name" value={bank.bank_name} />
                  <InfoRow icon={CreditCard} label="Account Number" value={`XXXX XXXX ${bank.account_number.slice(-4)}`} />
                  <InfoRow icon={Key} label="IFSC Code" value={bank.ifsc_code} />
                  <InfoRow icon={CreditCard} label="Account Holder" value={bank.account_holder_name} />
                </>
              ) : (
                <p className="text-[12px] text-amber-600 font-medium py-1">No bank account linked yet.</p>
              )}
            </div>

            {/* Change password toggle */}
            <button
              onClick={() => setShowPwSection((v) => !v)}
              className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2"><Key size={15} className="text-slate-400" /> Change Password</span>
              <ChevronRight size={16} className={`text-slate-300 transition-transform ${showPwSection ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showPwSection && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleChangePassword}
                  className="overflow-hidden bg-white border border-slate-100 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={labelCls}>Change Password</h3>
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>Current Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.current_password} onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>New Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} required className={inputCls} placeholder="Min 8 chars" />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm New Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required className={inputCls} />
                  </div>
                  <button type="submit" disabled={changingPw} className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-60">
                    {changingPw ? 'Changing...' : 'Change Password'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <motion.form
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="space-y-4"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className={labelCls}>Personal Info</h3>
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value.replace(/[0-9]/g, ''))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address Line</label>
                <input type="text" value={form.address.address_line} onChange={(e) => setNested('address', 'address_line', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={form.address.city} onChange={(e) => setNested('address', 'city', e.target.value.replace(/[0-9]/g, ''))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input type="text" value={form.address.pincode} onChange={(e) => setNested('address', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className={labelCls}>Bank Details</h3>
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input type="text" value={form.bank_details.account_holder_name} onChange={(e) => setNested('bank_details', 'account_holder_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bank Name</label>
                <input type="text" value={form.bank_details.bank_name} onChange={(e) => setNested('bank_details', 'bank_name', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Account Number</label>
                  <input type="text" value={form.bank_details.account_number} onChange={(e) => setNested('bank_details', 'account_number', e.target.value.replace(/\D/g, ''))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>IFSC Code</label>
                  <input type="text" value={form.bank_details.ifsc_code} onChange={(e) => setNested('bank_details', 'ifsc_code', e.target.value.toUpperCase())} className={inputCls} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.form>
        )}

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>

      {/* Logout confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} className="text-rose-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Log Out?</h3>
              <p className="text-sm text-slate-500 mb-5">Are you sure you want to log out of your account?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleLogout} className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors">
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
