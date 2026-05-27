import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

export default function ExecutiveReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const editReport = location.state?.editReport ?? null;
  const isEdit = !!editReport;

  const [form, setForm] = useState({
    partners_visited: isEdit ? String(editReport.partners_visited ?? '') : '',
    partners_registered: isEdit ? String(editReport.partners_registered ?? '') : '',
    subscriptions_sold: isEdit ? String(editReport.subscriptions_sold ?? '') : '',
    leads_uploaded: isEdit ? String(editReport.leads_uploaded ?? '') : '',
    notes: isEdit ? (editReport.notes ?? '') : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        partners_visited: Number(form.partners_visited) || 0,
        partners_registered: Number(form.partners_registered) || 0,
        subscriptions_sold: Number(form.subscriptions_sold) || 0,
        leads_uploaded: Number(form.leads_uploaded) || 0,
        notes: form.notes,
      };
      if (isEdit) {
        await api.patch('/executive/reports/daily', payload);
        toast.success('Report updated.');
      } else {
        await api.post('/executive/reports/daily', payload);
        toast.success('Daily report submitted.');
      }
      queryClient.invalidateQueries({ queryKey: ['executiveReportsHistory'] });
      navigate('/executive/reports');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit report.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/executive/reports')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={16} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Report' : 'Submit Daily Report'}</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Field Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Partners Visited</label>
              <input type="number" value={form.partners_visited} onChange={(e) => set('partners_visited', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Partners Registered</label>
              <input type="number" value={form.partners_registered} onChange={(e) => set('partners_registered', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Subscriptions Sold</label>
              <input type="number" value={form.subscriptions_sold} onChange={(e) => set('subscriptions_sold', e.target.value)} min={0} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Leads Uploaded</label>
              <input type="number" value={form.leads_uploaded} onChange={(e) => set('leads_uploaded', e.target.value)} min={0} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes / Remarks</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} maxLength={1000} className={`${inputCls} resize-none`} placeholder="Field observations, challenges, highlights..." />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.notes.length}/1000</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 disabled:opacity-60">
            <Save size={15} /> {submitting ? (isEdit ? 'Saving...' : 'Submitting...') : (isEdit ? 'Save Changes' : 'Submit Report')}
          </button>
          <button type="button" onClick={() => navigate('/executive/reports')} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
