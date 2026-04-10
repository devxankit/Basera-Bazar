import React, { useState } from 'react';
import { IndianRupee, TrendingUp, CheckCircle2, Clock, XCircle, Download, Filter } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'TXN-2024-001', user: 'Rajesh Kumar', email: 'rajesh@gmail.com', type: 'Subscription', plan: 'Gold Partner', amount: 4999, date: '2024-04-09', status: 'Success' },
  { id: 'TXN-2024-002', user: 'Priya Sharma', email: 'priya@gmail.com', type: 'Subscription', plan: 'Silver Listing', amount: 1999, date: '2024-04-09', status: 'Success' },
  { id: 'TXN-2024-003', user: 'Anil Mehta', email: 'anil@gmail.com', type: 'Listing Boost', plan: 'Property Booster', amount: 799, date: '2024-04-08', status: 'Pending' },
  { id: 'TXN-2024-004', user: 'Sunita Patel', email: 'sunita@gmail.com', type: 'Subscription', plan: 'Gold Partner', amount: 4999, date: '2024-04-08', status: 'Success' },
  { id: 'TXN-2024-005', user: 'Vikas Gupta', email: 'vikas@gmail.com', type: 'Listing Boost', plan: 'Property Booster', amount: 799, date: '2024-04-07', status: 'Failed' },
  { id: 'TXN-2024-006', user: 'Meena Joshi', email: 'meena@gmail.com', type: 'Subscription', plan: 'Silver Listing', amount: 1999, date: '2024-04-07', status: 'Success' },
  { id: 'TXN-2024-007', user: 'Deepak Singh', email: 'deepak@gmail.com', type: 'Subscription', plan: 'Gold Partner', amount: 4999, date: '2024-04-06', status: 'Success' },
  { id: 'TXN-2024-008', user: 'Kavita Rao', email: 'kavita@gmail.com', type: 'Listing Boost', plan: 'Property Booster', amount: 799, date: '2024-04-06', status: 'Success' },
  { id: 'TXN-2024-009', user: 'Ramesh Yadav', email: 'ramesh@gmail.com', type: 'Subscription', plan: 'Silver Listing', amount: 1999, date: '2024-04-05', status: 'Pending' },
  { id: 'TXN-2024-010', user: 'Anjali Verma', email: 'anjali@gmail.com', type: 'Subscription', plan: 'Gold Partner', amount: 4999, date: '2024-04-05', status: 'Success' },
  { id: 'TXN-2024-011', user: 'Suresh Nair', email: 'suresh@gmail.com', type: 'Listing Boost', plan: 'Property Booster', amount: 799, date: '2024-04-04', status: 'Success' },
  { id: 'TXN-2024-012', user: 'Pooja Desai', email: 'pooja@gmail.com', type: 'Subscription', plan: 'Gold Partner', amount: 4999, date: '2024-04-04', status: 'Failed' },
];

const statusConfig = {
  Success: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  Pending: { icon: Clock, cls: 'text-amber-600 bg-amber-50 border-amber-100' },
  Failed: { icon: XCircle, cls: 'text-rose-600 bg-rose-50 border-rose-100' },
};

export default function AdminPaymentReport() {
  const [filter, setFilter] = useState('All');

  const totalRevenue = MOCK_TRANSACTIONS.filter(t => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0);
  const successCount = MOCK_TRANSACTIONS.filter(t => t.status === 'Success').length;
  const pendingAmount = MOCK_TRANSACTIONS.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
  const failedCount = MOCK_TRANSACTIONS.filter(t => t.status === 'Failed').length;
  const successRate = Math.round((successCount / MOCK_TRANSACTIONS.length) * 100);

  const filtered = filter === 'All' ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.filter(t => t.status === filter);

  const statCards = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'All successful payments', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: IndianRupee },
    { label: 'Success Rate', value: `${successRate}%`, sub: `${successCount} of ${MOCK_TRANSACTIONS.length} transactions`, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: TrendingUp },
    { label: 'Pending Payouts', value: `₹${pendingAmount.toLocaleString()}`, sub: 'Awaiting confirmation', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    { label: 'Failed Transactions', value: failedCount, sub: 'Require attention', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Reports</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Comprehensive transaction ledger and revenue analytics.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-3">
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="px-8 py-5 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Order ID', 'Customer', 'Type', 'Plan', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((txn, i) => {
                const { icon: StatusIcon, cls } = statusConfig[txn.status];
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-black text-indigo-600 font-mono">{txn.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-sm text-slate-800">{txn.user}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{txn.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">{txn.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600">{txn.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-black text-slate-900">₹{txn.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-500">{txn.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cls}`}>
                        <StatusIcon size={12} /> {txn.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
