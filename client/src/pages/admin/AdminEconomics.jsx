import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Save,
  Loader2,
  Users,
  Info,
  ChevronRight,
  TrendingUp,
  Target,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';
import Skeleton from '../../components/common/Skeleton';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const inputClass = "w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono";
const labelClass = "text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block";

export default function AdminEconomics() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commissionAmount, setCommissionAmount] = useState(100);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['adminEconomicsSettings'],
    queryFn: () => api.get('/admin/executives/config/settings').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (rawData?.data?.commission_amount !== undefined) {
      setCommissionAmount(rawData.data.commission_amount);
    }
  }, [rawData]);

  const saveMutation = useMutation({
    mutationFn: (amount) => api.put('/admin/executives/config/settings', { commission_amount: Number(amount) }),
    onSuccess: () => {
      toast.success("Executive commission updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminEconomicsSettings'] });
    },
    onError: (err) => {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    },
  });

  const saving = saveMutation.isPending;

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pb-20 text-left">
        <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-700 text-left">
      <div className="max-w-400 mx-auto px-8 space-y-8 mt-6">

        {/* Breadcrumbs & Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
             <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Admin</span>
             <ChevronRight size={12} className="text-slate-300" />
             <span className="hover:text-slate-600 cursor-pointer" onClick={() => navigate('/admin/executives')}>Field Executive</span>
             <ChevronRight size={12} className="text-slate-300" />
             <span className="text-indigo-600">Economics</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight uppercase">Financial Economics</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Configure global commission structures and payout rules for Field Executives.</p>
            </div>

            <button
              onClick={() => saveMutation.mutate(commissionAmount)}
              disabled={saving}
              className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Settings Panel */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm">
                    <Users size={18} />
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Executive Referral Settings</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Configuration</span>
                </div>
              </div>

              <div className="p-8 space-y-10">
                <div className="max-w-md">
                  <label className={labelClass}>Referral Payout Amount (₹)</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-indigo-600 transition-colors">₹</div>
                    <input
                      type="number"
                      value={commissionAmount}
                      onChange={e => setCommissionAmount(e.target.value)}
                      className={cn(inputClass, "pl-10")}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="mt-5 p-4 bg-indigo-50/50 rounded-xl flex items-start gap-3 border border-indigo-100">
                    <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-700 font-bold leading-relaxed uppercase">
                      This flat amount is credited to the Field Executive's wallet upon successful and verified Partner registration.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm border border-slate-200">
                            <ShieldCheck size={16} />
                         </div>
                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Automated Settlement</h4>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase">
                        All commissions are calculated in real-time. Payouts are queued for executive withdrawal once the target balance is met.
                      </p>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm border border-slate-200">
                            <TrendingUp size={16} />
                         </div>
                         <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Performance Impact</h4>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase">
                        Dynamic rates allow you to adjust commission incentives based on season, region, or business goals.
                      </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Additional Info / History Placeholder */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                     <Target size={24} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Earning Thresholds</h4>
                     <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Minimum wallet balance for withdrawal is ₹500.</p>
                  </div>
               </div>
               <button onClick={() => navigate('/admin/executives/withdrawals')} className="px-5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-200 transition-all">
                  Manage Payouts
               </button>
            </div>
          </div>

          {/* Sidebar / Quick Tips */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                   <AlertCircle size={140} />
                </div>
                <h4 className="text-lg font-semibold mb-4 relative z-10 uppercase tracking-tight">Economics Guide</h4>
                <div className="space-y-4 relative z-10">
                   {[
                     "Changes apply instantly to new registrations.",
                     "Existing referred partners are not affected.",
                     "Wallet credits are tracked in Transaction Ledger.",
                     "Tax deductions (TDS) are calculated during withdrawal."
                   ].map((tip, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{tip}</p>
                     </div>
                   ))}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
