import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from '../../mockToast';

export default function OfficeStaffSalary() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/office-staff/salary')
      .then(({ data }) => { if (data.success) setRecords(data.data); })
      .catch(() => toast.error('Failed to load salary data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleWhatsAppShare = (r) => {
    const text = encodeURIComponent(
      `BaseraBazar Salary — ${r.month}\n` +
      `Base: ₹${(r.base_salary || 0).toLocaleString('en-IN')}\n` +
      `Incentive: ₹${(r.incentive_amount || 0).toLocaleString('en-IN')}\n` +
      `Net Pay: ₹${(r.effective_salary || 0).toLocaleString('en-IN')}\n` +
      `Status: ${r.status?.toUpperCase()}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  const latest = records[0];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">Salary</h1>
        <p className="text-sm text-slate-500">Your monthly earnings and incentives</p>
      </div>

      {latest && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">This Month — {latest.month}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Fixed Salary</span>
              <span className="font-bold">₹{(latest.base_salary || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Performance Incentive</span>
              <span className="font-bold text-green-600">₹{(latest.incentive_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            {latest.deduction_applied && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Deduction</span>
                <span className="font-bold text-red-500">-₹{(latest.deduction_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
              <span className="font-black text-slate-800">Net Pay</span>
              <span className="font-black text-teal-600 text-base">₹{(latest.effective_salary || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${latest.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {latest.status?.toUpperCase()}
            </span>
            <button onClick={() => handleWhatsAppShare(latest)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-bold hover:bg-green-100">
              Share on WA
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-700">Salary History</h3>
        </div>
        {records.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No salary records yet.</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-black text-slate-500 uppercase">Month</th>
                <th className="px-4 py-2.5 text-left text-xs font-black text-slate-500 uppercase">Base</th>
                <th className="px-4 py-2.5 text-left text-xs font-black text-slate-500 uppercase">Incentive</th>
                <th className="px-4 py-2.5 text-left text-xs font-black text-slate-500 uppercase">Net</th>
                <th className="px-4 py-2.5 text-left text-xs font-black text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{r.month}</td>
                  <td className="px-4 py-2.5 text-slate-600">₹{(r.base_salary || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-green-600 font-semibold">₹{(r.incentive_amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 font-black text-slate-900">₹{(r.effective_salary || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
