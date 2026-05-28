import React, { useState } from 'react';
import { IndianRupee, TrendingUp, CheckCircle2, Clock, XCircle, Download, Filter, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const statusConfig = {
  success: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Success' },
  pending: { icon: Clock, cls: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Pending' },
  failed: { icon: XCircle, cls: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Failed' },
  refunded: { icon: XCircle, cls: 'text-slate-600 bg-slate-50 border-slate-100', label: 'Refunded' },
};

export default function AdminPaymentReport() {
  const [filter, setFilter] = useState('All');

  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ['adminFinancialStats'],
    queryFn: () => api.get('/admin/reports/financial-stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: txRaw, isLoading: ledgerLoading } = useQuery({
    queryKey: ['adminTransactions', filter],
    queryFn: () => api.get(`/admin/reports/transactions?status=${filter}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsRaw?.data || { totalRevenue: 0, successCount: 0, pendingAmount: 0, failedCount: 0, totalTransactions: 0 };
  const transactions = txRaw?.data || [];
  const loading = statsLoading && ledgerLoading;

  const successRate = stats.totalTransactions > 0
    ? Math.round((stats.successCount / stats.totalTransactions) * 100)
    : 0;

  const exportCSV = () => {
    const rows = [
      ['Transaction ID', 'Customer', 'Contact', 'Type', 'Amount (₹)', 'Date', 'Status'],
      ...transactions.map(txn => [
        txn._id ? txn._id.slice(-8).toUpperCase() : '—',
        txn.partner_id?.name || 'Anonymous',
        txn.partner_id?.email || txn.partner_id?.phone || '—',
        txn.type ? txn.type.replace(/_/g, ' ') : '—',
        txn.amount != null ? txn.amount : '—',
        txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        txn.status || '—',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: 'All successful payments', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: IndianRupee },
    { label: 'Success Rate', value: `${successRate}%`, sub: `${stats.successCount} successful orders`, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: TrendingUp },
    { label: 'Pending Payouts', value: `₹${stats.pendingAmount.toLocaleString()}`, sub: 'Awaiting confirmation', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    { label: 'Failed Transactions', value: stats.failedCount, sub: 'Require attention', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Financial Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transaction Ledger</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Comprehensive transaction ledger and real-time revenue analytics.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-3 transition-all hover:shadow-md hover:border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center border`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
            <p className="text-[11px] font-bold text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden relative">
        {ledgerLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )}

        {/* Table Controls */}
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Filter size={18} className="text-slate-400" /> Transaction Ledger
          </h2>
          <div className="flex items-center gap-2">
            {['All', 'Success', 'Pending', 'Failed'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Transaction ID', 'Customer', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                  <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No transactions found
                      </td>
                  </tr>
              ) : (
                transactions.map((txn, i) => {
                  const config = statusConfig[txn.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-[12px] font-black text-indigo-600 font-mono">#{txn._id ? txn._id.slice(-8).toUpperCase() : '—'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-sm text-slate-800">{txn.partner_id?.name || 'Anonymous'}</p>
                        <p className="text-[11px] text-slate-400 font-bold tracking-tight">{txn.partner_id?.email || txn.partner_id?.phone || 'No Contact'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                          {txn.type ? txn.type.replace(/_/g, ' ') : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-base font-black text-slate-900">₹{txn.amount != null ? txn.amount.toLocaleString() : '—'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-500">{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.cls}`}>
                          <StatusIcon size={12} /> {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
