import React, { useState } from 'react';
import { Crown, Star, Zap, Users, CheckCircle2, XCircle, Edit3, ToggleLeft, Plus, IndianRupee } from 'lucide-react';

const MOCK_PLANS = [
  {
    id: 1,
    name: 'Gold Partner',
    icon: Crown,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    headerColor: 'from-amber-500 to-orange-500',
    price: 4999,
    duration: 'month',
    activeUsers: 38,
    status: 'Active',
    features: [
      'Up to 50 Property Listings',
      'Priority Search Placement',
      'Dedicated Account Manager',
      'Advanced Analytics Dashboard',
      'Lead Management Tools',
      'Unlimited Inquiry Responses',
    ],
    excluded: [],
  },
  {
    id: 2,
    name: 'Silver Listing',
    icon: Star,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    headerColor: 'from-slate-500 to-slate-600',
    price: 1999,
    duration: 'month',
    activeUsers: 74,
    status: 'Active',
    features: [
      'Up to 20 Property Listings',
      'Standard Search Placement',
      'Email Support',
      'Basic Analytics',
      'Lead Notifications',
    ],
    excluded: [
      'Dedicated Account Manager',
      'Advanced Analytics Dashboard',
    ],
  },
  {
    id: 3,
    name: 'Property Booster',
    icon: Zap,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    headerColor: 'from-indigo-500 to-purple-600',
    price: 799,
    duration: 'listing',
    activeUsers: 22,
    status: 'Active',
    features: [
      'Single Listing Premium Boost',
      'Highlighted in Search Results',
      '7-Day Featured Badge',
      'Social Media Promotion',
    ],
    excluded: [
      'Dedicated Account Manager',
      'Advanced Analytics Dashboard',
      'Lead Management Tools',
    ],
  },
];

export default function AdminSubscriptionPlans() {
  const [plans, setPlans] = useState(MOCK_PLANS);

  const toggleStatus = (id) => {
    setPlans(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
    ));
  };

  const totalRevenue = plans.reduce((sum, p) => sum + (p.price * p.activeUsers), 0);
  const totalSubscribers = plans.reduce((sum, p) => sum + p.activeUsers, 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Manage your platform's pricing and feature tiers.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Plus size={16} /> Add New Plan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Subscribers</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-900">{totalSubscribers}</p>
            <span className="text-sm font-bold text-emerald-600 mb-1">+12 this month</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Monthly Revenue</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
            <span className="text-sm font-bold text-emerald-600 mb-1">est.</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Plans</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-900">{plans.filter(p => p.status === 'Active').length}</p>
            <span className="text-sm font-bold text-slate-400 mb-1">of {plans.length} total</span>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className={`bg-gradient-to-br ${plan.headerColor} p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <plan.icon size={24} className="text-white" />
                </div>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  plan.status === 'Active'
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-black/20 border-black/20 text-white/70'
                }`}>
                  {plan.status}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black">₹{plan.price.toLocaleString()}</span>
                <span className="text-sm opacity-75 font-medium">/ {plan.duration}</span>
              </div>
            </div>

            {/* Subscribers */}
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={15} />
                <span className="text-sm font-bold">Active Subscribers</span>
              </div>
              <span className="text-lg font-black text-slate-900">{plan.activeUsers}</span>
            </div>

            {/* Features */}
            <div className="px-6 py-5 flex-grow space-y-3">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-600">{f}</span>
                </div>
              ))}
              {plan.excluded.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 opacity-40">
                  <XCircle size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-400 line-through">{f}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-50 flex items-center gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[11px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => toggleStatus(plan.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest border transition-all ${
                  plan.status === 'Active'
                    ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                }`}
              >
                <ToggleLeft size={14} />
                {plan.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
