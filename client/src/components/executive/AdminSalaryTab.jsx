import React, { useState, useEffect } from 'react';
import { IndianRupee, Edit3, CheckCircle2, AlertCircle, RefreshCw, PlayCircle, FileText, XCircle, DollarSign, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from '../../mockToast';
import Skeleton from '../common/Skeleton';
import ConfirmationModal from '../common/ConfirmationModal';

export default function AdminSalaryTab() {
  const [loading, setLoading] = useState(true);
  const [executives, setExecutives] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('config'); // 'config' | 'ledger'
  
  const [salaryForm, setSalaryForm] = useState({ base: 0, effective: 0 });
  const [remarksForm, setRemarksForm] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, loading: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [execRes, recRes] = await Promise.all([
        api.get('/admin/executives?limit=200'),
        api.get('/admin/executives/salary-records')
      ]);
      if (execRes.data.success) setExecutives(execRes.data.data);
      if (recRes.data.success) setRecords(recRes.data.data);
    } catch (err) {
      toast.error('Failed to load executive salary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (exec) => {
    setSelectedExec(exec);
    setSalaryForm({
      base: exec.salary?.base || 0,
      effective: exec.salary?.effective || exec.salary?.base || 0
    });
    setShowSalaryModal(true);
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    if (salaryForm.base < 0 || salaryForm.effective < 0) {
      toast.error('Salary amounts cannot be negative');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put(`/admin/executives/${selectedExec._id}/salary`, {
        base: Number(salaryForm.base),
        effective: Number(salaryForm.effective)
      });
      if (res.data.success) {
        toast.success('Executive salary updated successfully!');
        setShowSalaryModal(false);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPay = (rec) => {
    setSelectedRecord(rec);
    setRemarksForm('');
    setShowPayModal(true);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/admin/executives/salary-records/${selectedRecord._id}/pay`, {
        remarks: remarksForm
      });
      if (res.data.success) {
        toast.success('Salary marked as paid successfully!');
        setShowPayModal(false);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark salary paid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessMonthly = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Trigger Monthly Deduction Processing',
      message: 'This will instantly compute average monthly completion rates for all executives. Any executive below the 50% threshold will receive a compounding 10% deduction on their effective salary. Proceed?',
      action: async () => {
        try {
          const res = await api.post('/admin/executives/process-monthly');
          if (res.data.success) {
            toast.success(res.data.message || 'Monthly compounding deductions processed successfully!');
            await fetchData();
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Processing failed');
        }
      }
    });
  };

  const executeConfirm = async () => {
    setConfirmModal(m => ({ ...m, loading: true }));
    try {
      await confirmModal.action();
    } finally {
      setConfirmModal(m => ({ ...m, isOpen: false, loading: false }));
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
        onConfirm={executeConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="warning"
        loading={confirmModal.loading}
      />

      {/* Top Metric Cards & Trigger */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Base Payroll</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              ₹{executives.reduce((sum, e) => sum + (e.salary?.base || 0), 0)}
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Effective Payout Outflow</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block text-indigo-600">
              ₹{executives.reduce((sum, e) => sum + (e.salary?.effective || e.salary?.base || 0), 0)}
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-col justify-center items-stretch">
          <button
            onClick={handleProcessMonthly}
            className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-amber-100/50 shadow-sm shadow-amber-50"
          >
            <PlayCircle size={18} />
            Trigger Deduction Processing
          </button>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-600" />
              Executive Performance & Ledger Controls
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage base salaries, view applied effective penalties, and audit monthly ledgers.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
            <button
              onClick={() => setActiveSection('config')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeSection === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Salary Config
            </button>
            <button
              onClick={() => setActiveSection('ledger')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeSection === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Ledger & Payouts ({records.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : activeSection === 'config' ? (
          <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-5 text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Executive</span>
              <span>Referral Code</span>
              <span>Base Salary</span>
              <span>Effective Salary</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {executives.map((row) => (
                <div key={row._id} className="px-6 py-4 grid grid-cols-5 items-center bg-white">
                  <span className="font-bold text-slate-900 text-sm">{row.name}</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit border border-indigo-100 tracking-wider">
                    {row.referral_code || 'N/A'}
                  </span>
                  <span className="font-bold text-slate-600 text-sm">₹{row.salary?.base || 0}</span>
                  <div>
                    <span className="font-black text-slate-900 text-sm">₹{row.salary?.effective || row.salary?.base || 0}</span>
                    {row.salary?.effective && row.salary?.effective < (row.salary?.base || 0) && (
                      <span className="text-[10px] font-black text-rose-500 block">Compounding Penalty Applied</span>
                    )}
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-bold rounded-xl transition-all text-xs border border-slate-100 inline-flex items-center gap-1.5"
                    >
                      <Edit3 size={14} /> Adjust
                    </button>
                  </div>
                </div>
              ))}
              {executives.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold text-sm bg-white">
                  No registered field executives found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-6 text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Month</span>
              <span>Executive</span>
              <span>Avg Completion</span>
              <span>Deduction Applied</span>
              <span>Final Payable</span>
              <span className="text-right">Payout Status</span>
            </div>
            <div className="divide-y divide-slate-100">
              {records.map((rec) => (
                <div key={rec._id} className="px-6 py-4 grid grid-cols-6 items-center bg-white">
                  <span className="font-bold text-slate-900 text-sm">{rec.month}</span>
                  <span className="font-bold text-slate-700 text-sm">{rec.executive_id?.name || 'Unknown'}</span>
                  <span className="font-bold text-slate-600 text-sm">{rec.completion_rate}%</span>
                  <div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${rec.deduction_applied ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {rec.deduction_applied ? `Yes (-₹${rec.deduction_amount})` : 'No'}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">₹{rec.final_payable}</span>
                  <div className="text-right">
                    {rec.is_paid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        <CheckCircle2 size={12} /> Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenPay(rec)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black rounded-xl transition-all text-xs border border-indigo-100 inline-flex items-center gap-1"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {records.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold text-sm bg-white">
                  No monthly salary records or processing logs generated yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Salary Modal */}
      <AnimatePresence>
        {showSalaryModal && selectedExec && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowSalaryModal(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Adjust Executive Salary</h3>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">{selectedExec.name}</p>
                </div>
                <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveSalary} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Base Salary (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={salaryForm.base}
                    onChange={(e) => setSalaryForm({ ...salaryForm, base: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                    required
                  />
                  <p className="text-[10px] font-medium text-slate-400">The fixed base payroll for this employee.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Effective Salary (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={salaryForm.effective}
                    onChange={(e) => setSalaryForm({ ...salaryForm, effective: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                    required
                  />
                  <p className="text-[10px] font-medium text-slate-400">Current active monthly payout after applied compounding deductions.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSalaryModal(false)}
                    className="px-5 py-2.5 text-slate-500 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 text-xs transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mark Paid Modal */}
      <AnimatePresence>
        {showPayModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowPayModal(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Salary Payout</h3>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">Payable: ₹{selectedRecord.final_payable}</p>
                </div>
                <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleMarkPaid} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Audit Remarks / Ref No</label>
                  <textarea 
                    value={remarksForm}
                    onChange={(e) => setRemarksForm(e.target.value)}
                    placeholder="e.g. Paid via Bank Transfer Ref #TXN12345"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-600 transition-all min-h-[100px]"
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-5 py-2.5 text-slate-500 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-100 text-xs transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
