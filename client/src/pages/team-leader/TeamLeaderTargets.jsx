import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
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

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function TeamLeaderTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/team-leader/targets')
      .then(({ data }) => { if (data.success) setTargets(data.data); })
      .catch(() => toast.error('Failed to load targets.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Targets</h1>
        <p className="text-sm text-slate-500">Targets assigned by admin for your team</p>
      </div>

      {targets.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Target size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">No active targets assigned.</p>
        </div>
      )}

      {targets.map((t) => {
        const rate = t.target_value > 0 ? Math.min((t.achieved_value ?? 0) / t.target_value, 1) : 0;
        return (
          <div key={t._id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">{TYPE_LABELS[t.target_type] || t.target_type}</p>
                <p className="text-xs text-slate-500">{PERIOD_LABELS[t.target_period]} · {t.start_date} → {t.end_date}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
                {t.is_active ? 'Active' : 'Closed'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress: {t.achieved_value ?? 0} / {t.target_value}</span>
                <span className="font-bold">{Math.round(rate * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${rate >= 0.7 ? 'bg-green-500' : rate >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.round(rate * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Incentive: <strong className="text-green-700">
                  {t.incentive_type === 'percentage' ? `${t.incentive_rate}%` : `₹${t.incentive_rate}/unit`}
                </strong>
              </span>
              {t.description && <span className="text-slate-400 truncate max-w-40">{t.description}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
