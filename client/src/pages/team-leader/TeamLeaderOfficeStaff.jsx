import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../mockToast';

const SPEC_LABELS = {
  lead_generation: 'Lead Generation',
  follow_up: 'Follow-up',
  customer_support: 'Customer Support',
  data_update: 'Data Update',
};

export default function TeamLeaderOfficeStaff() {
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['teamLeaderOfficeStaff'],
    queryFn: () => api.get('/team-leader/team/office-staff').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    onError: () => toast.error('Failed to load office staff.'),
  });

  const officeStaff = rawData?.success ? rawData.data : [];

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">My Office Staff</h1>
        <p className="text-sm text-slate-500">{officeStaff.length} member(s) under your team</p>
      </div>

      {officeStaff.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
          No office staff assigned yet.
        </div>
      )}

      {officeStaff.map((os) => (
        <div key={os._id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-slate-800">{os.name}</p>
              <p className="text-xs text-slate-500">{os.phone}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-700">
                {SPEC_LABELS[os.calling_specialization] || os.calling_specialization}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${os.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {os.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">This month:</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-teal-500"
                  style={{ width: `${Math.min(Math.round((os.monthly_achievement ?? 0) * 100), 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{Math.round((os.monthly_achievement ?? 0) * 100)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
