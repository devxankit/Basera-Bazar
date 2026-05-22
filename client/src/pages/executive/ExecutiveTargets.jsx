import React, { useEffect } from 'react';
import { Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const TYPE_LABELS = {
  partner_onboarding: 'Partner Onboarding',
  calling: 'Calling',
  lead_generation: 'Lead Generation',
  sales: 'Sales',
  subscription: 'Subscription',
  custom: 'Custom',
};

export default function ExecutiveTargets() {
  const { data: rawData, isLoading: loading, error: targetsError } = useQuery({
    queryKey: ['executiveTargets'],
    queryFn: () => api.get('/executive/targets').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (targetsError) toast.error('Failed to load targets.');
  }, [targetsError]);

  const targets = rawData?.success ? rawData.data : [];

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Targets</h1>
        <p className="text-sm text-slate-500">Performance targets assigned to you</p>
      </div>

      {targets.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">No targets assigned yet.</p>
        </div>
      )}

      {targets.map((t) => {
        const rate = t.target_value > 0 ? Math.min((t.achieved_value ?? 0) / t.target_value, 1) : 0;
        return (
          <div key={t._id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">{TYPE_LABELS[t.target_type] || t.target_type}</p>
                <p className="text-xs text-slate-500">{t.target_period} · {t.start_date} → {t.end_date}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.is_active ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                {t.is_active ? 'Active' : 'Closed'}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress: {t.achieved_value ?? 0} / {t.target_value}</span>
                <span className={`font-bold ${rate >= 0.7 ? 'text-green-600' : rate >= 0.5 ? 'text-amber-500' : 'text-red-500'}`}>{Math.round(rate * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${rate >= 0.7 ? 'bg-green-500' : rate >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.round(rate * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                Incentive: <strong className="text-orange-700">{t.incentive_type === 'percentage' ? `${t.incentive_rate}%` : `₹${t.incentive_rate}/unit`}</strong>
              </span>
              <span className="text-green-700 font-bold">
                Earned: ₹{(t.incentive_earned ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
