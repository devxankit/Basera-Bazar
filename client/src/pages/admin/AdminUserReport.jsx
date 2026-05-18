import React from 'react';
import { Users, TrendingUp, UserPlus, ShieldCheck, Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function AdminUserReport() {
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['adminUserReport'],
    queryFn: () => api.get('/admin/reports/users').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const data = (rawData?.data?.history || []).map(item => ({
    month: item._id,
    users: item.count,
  }));
  const summary = rawData?.data?.summary || {
    totalUsers: 0,
    verifiedPercentage: 0,
    growthRate: 0,
  };

  const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  const exportCSV = () => {
    const rows = [
      ['Month', 'New Registrations'],
      ...data.map(row => [row.month, row.users])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `user-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 pb-20 mt-4 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Logistics & Growth</h1>
          <p className="text-slate-500 font-medium mt-1">Analyzing registration velocity and user demographic trends.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={data.length === 0}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-700 font-black rounded-2xl transition-all hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} /> Export Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Registrations</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary.totalUsers}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Verified Partners</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{Number(summary.verifiedPercentage).toFixed(1)}%</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Growth Momentum</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
               {Number(summary.growthRate) >= 0 ? '+' : ''}{summary.growthRate}%
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-10">Monthly Enrollment Distribution</h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#4f46e5' }}
              />
              <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
