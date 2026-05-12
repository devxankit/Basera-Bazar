import React, { useEffect, useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

export default function OfficeStaffProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: { address_line: '', city: '', state: '', pincode: '' }, bank_details: { account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '' } });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    api.get('/office-staff/profile')
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
  }, []);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setNested = (group, field, value) => setForm((p) => ({ ...p, [group]: { ...p[group], [field]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/office-staff/profile', form);
      toast.success('Profile updated.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/auth/staff/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setChangingPw(false); }
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">{profile?.email}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Personal Info</h3>
          <div>
            <label className={labelCls}>Full Name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address Line</label>
            <input type="text" value={form.address.address_line} onChange={(e) => setNested('address', 'address_line', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={form.address.city} onChange={(e) => setNested('address', 'city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pincode</label>
              <input type="text" value={form.address.pincode} onChange={(e) => setNested('address', 'pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bank Details</h3>
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

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-60">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Change Password</h3>
          <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div>
          <label className={labelCls}>Current Password</label>
          <input type={showPw ? 'text' : 'password'} value={pwForm.current_password} onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input type={showPw ? 'text' : 'password'} value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} required className={inputCls} placeholder="Min 8 chars, uppercase, number, special" />
        </div>
        <div>
          <label className={labelCls}>Confirm Password</label>
          <input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required className={inputCls} />
        </div>
        <button type="submit" disabled={changingPw} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-60">
          {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
