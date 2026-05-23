import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../mockToast';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

export default function OfficeStaffReportForm() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    calls_made: '', follow_ups_done: '', leads_generated: '', data_entries_updated: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        calls_made: Number(form.calls_made) || 0,
        follow_ups_done: Number(form.follow_ups_done) || 0,
        leads_generated: Number(form.leads_generated) || 0,
        data_entries_updated: Number(form.data_entries_updated) || 0,
        notes: form.notes,
        date: today
      };
      await api.post('/office-staff/reports/daily', payload);
      toast.success('Daily report submitted.');
      navigate('/office-staff/reports');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit report.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/office-staff/reports')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Submit Daily Report</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Activity Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Calls Made</label>
              <input type="number" value={form.calls_made} onChange={(e) => set('calls_made', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Follow-ups Done</label>
              <input type="number" value={form.follow_ups_done} onChange={(e) => set('follow_ups_done', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Leads Generated</label>
              <input type="number" value={form.leads_generated} onChange={(e) => set('leads_generated', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Data Entries Updated</label>
              <input type="number" value={form.data_entries_updated} onChange={(e) => set('data_entries_updated', e.target.value)} min={0} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes / Remarks</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} maxLength={1000} className={`${inputCls} resize-none`} placeholder="Describe your work, challenges, or highlights for today..." />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.notes.length}/1000</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-60">
            <Save size={15} /> {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <button type="button" onClick={() => navigate('/office-staff/reports')} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
