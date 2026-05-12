import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, IndianRupee, RefreshCw, CheckCircle2, AlertCircle,
  TrendingDown, Calendar, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from '../../mockToast';
import ExecutiveBottomNav from '../../components/executive/ExecutiveBottomNav';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

export default function ExecutiveSalary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState({ current: 0, base: 0, records: [] });

  const fetchSalary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/executive/salary');
      if (res.data.success) {
        setSalaryData({
          current: res.data.current_salary,
          base: res.data.base_salary,
          records: res.data.data || []
        });
      }
    } catch (err) {
      toast.error('Failed to load salary details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSalary(); }, []);

  const { current, base, records } = salaryData;
  const deductionAmount = base - current;
  const hasDeduction = deductionAmount > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-x-hidden pb-28 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-4">
        <button
          onClick={() => navigate('/executive/dashboard')}
          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-slate-900 tracking-tight">Salary Details</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Monthly Payroll Ledger</p>
        </div>
        <button
          onClick={fetchSalary}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="px-6 pt-6 space-y-4">
          <div className="h-44 bg-slate-50 rounded-3xl animate-pulse" />
          <div className="h-32 bg-slate-50 rounded-3xl animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 pt-6 space-y-5"
        >
          {/* Current Salary Hero */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white space-y-4 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-4 bottom-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                  <IndianRupee size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Effective Salary</p>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">Your active monthly disbursement</p>
                </div>
              </div>

              <div className="relative">
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-5xl font-black text-white tracking-tight"
                >
                  ₹{current.toLocaleString('en-IN')}
                </motion.p>
                <p className="text-xs font-medium text-slate-400 mt-1">per month</p>
              </div>

              {/* Deduction notice */}
              {hasDeduction && (
                <div className="relative flex items-start gap-3 bg-rose-500/15 border border-rose-500/20 rounded-2xl p-3">
                  <TrendingDown size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">Compounding Penalty Active</p>
                    <p className="text-[10px] font-medium text-slate-400 leading-snug">
                      Base salary: ₹{base.toLocaleString('en-IN')} | Cumulative deduction: ₹{deductionAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 leading-snug">
                      Maintain ≥50% monthly task completion to avoid further deductions.
                    </p>
                  </div>
                </div>
              )}

              {!hasDeduction && base > 0 && (
                <div className="relative flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Full Salary — No Active Penalty</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Base vs Effective Breakdown */}
          {base > 0 && (
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary</p>
                  <p className="text-2xl font-black text-slate-900">₹{base.toLocaleString('en-IN')}</p>
                  <p className="text-[9px] font-bold text-slate-400">Contracted amount</p>
                </div>
                <div className={`border rounded-2xl p-4 space-y-1 ${hasDeduction ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective</p>
                  <p className={`text-2xl font-black ${hasDeduction ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{current.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {hasDeduction ? `−₹${deductionAmount.toLocaleString('en-IN')} deducted` : 'No deduction'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Monthly Ledger Records */}
          <motion.div variants={itemVariants}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Monthly Ledger</p>

            {records.length > 0 ? (
              <div className="space-y-3">
                {records.map((rec) => (
                  <div
                    key={rec._id}
                    className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                          <Calendar size={14} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{rec.month}</p>
                          <p className="text-[10px] font-medium text-slate-400">Avg completion: {rec.completion_rate}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">₹{rec.final_payable?.toLocaleString('en-IN')}</p>
                        {rec.is_paid ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                            <CheckCircle2 size={10} /> Paid
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-500 uppercase">Pending</span>
                        )}
                      </div>
                    </div>

                    {rec.deduction_applied && (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                        <TrendingDown size={12} className="text-rose-500 shrink-0" />
                        <p className="text-[10px] font-bold text-rose-600">
                          10% compounding penalty applied — deducted ₹{rec.deduction_amount?.toLocaleString('en-IN')}
                          {' '}(completion was below 50%)
                        </p>
                      </div>
                    )}

                    {rec.remarks && (
                      <p className="text-[10px] font-medium text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                        {rec.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <IndianRupee className="mx-auto text-slate-200" size={48} />
                <div>
                  <p className="font-bold text-slate-500 text-sm">No ledger records yet</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Monthly salary records appear here after the 1st of each month.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Note about how it works */}
          <motion.div variants={itemVariants}>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How It Works</p>
              <ul className="space-y-1.5 text-[11px] font-medium text-slate-500 leading-snug">
                <li className="flex items-start gap-1.5"><span className="text-indigo-400 font-black mt-0.5">•</span> Admin sets a daily partner onboarding target for all executives.</li>
                <li className="flex items-start gap-1.5"><span className="text-indigo-400 font-black mt-0.5">•</span> Your monthly completion average must be <strong className="text-slate-700">≥50%</strong> to maintain full salary.</li>
                <li className="flex items-start gap-1.5"><span className="text-rose-400 font-black mt-0.5">•</span> If the average falls below 50%, a <strong className="text-rose-600">10% compounding deduction</strong> is applied to your effective salary on the 1st of the next month.</li>
                <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-black mt-0.5">•</span> Salary restoration is done manually by the admin on request.</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ExecutiveBottomNav />
    </div>
  );
}
