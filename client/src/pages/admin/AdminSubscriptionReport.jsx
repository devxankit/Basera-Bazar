import React, { useState, useEffect } from 'react';
import { BadgePercent, TrendingUp, TrendingDown, Users, Download, Filter, IndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

import Skeleton from '../../components/common/Skeleton';

export default function AdminSubscriptionReport() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/reports/subscriptions');
        if (res.data.success) {
          setData(res.data.data.history.map(item => ({
            month: item._id,
            revenue: item.revenue,
            count: item.count
          })));
          setSummary(res.data.data.summary);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="space-y-8 pb-20 mt-4 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Analytics & Growth</h1>
            <p className="text-slate-500 font-medium mt-1">Detailed growth analytics for premium plans and marketplace commissions.</p>
          </div>
        )}
        {!loading && (
          <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 text-sm">
            <Download size={18} /> Download Full Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Subscriptions', value: summary.activeSubscriptions, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Conversion Rate', value: `${Number(summary.conversionRate).toFixed(1)}%`, icon: Users, color: 'text-orange-600 bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1 flex items-center gap-1">
                    {stat.value}
                  </h3>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trendline</h2>
          <div className="flex items-center gap-2">
             <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${Number(summary.growthRate) >= 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
               {Number(summary.growthRate) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {summary.growthRate}% Growth
             </span>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#4f46e5' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
