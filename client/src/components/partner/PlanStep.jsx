import React from 'react';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    id: 'free',
    name: 'Free Trail',
    price: 'Free',
    duration: '1 month',
    tag: 'FREE',
    tagColor: 'bg-green-100 text-green-600',
    features: [
      '50 Leads',
      '1 Listings',
      '1 Featured Listings',
      '15 days Account Validity',
      '50 leads total'
    ]
  },
  {
    id: 'premium',
    name: 'Pre launching offer',
    price: '₹999',
    duration: '1 year',
    tag: 'POPULAR',
    tagColor: 'bg-orange-100 text-orange-600',
    features: [
      'Unlimited Leads',
      '10 Listings',
      '3 Featured Listings',
      'Verified Badge',
      'Priority Support'
    ]
  }
];

export default function PlanStep({ selectedPlan, onSelect, onNext, onBack }) {
  return (
    <div className="flex flex-col h-full font-sans">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-[#001b4e]">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-[26px] font-bold text-[#001b4e] tracking-tight">Select Plan</h1>
          <p className="text-slate-500 text-[14px]">Choose a plan that fits your business</p>
        </div>
      </div>

      <div className="space-y-4 flex-grow">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(plan.id)}
            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPlan === plan.id 
                ? 'border-[#001b4e] bg-indigo-50/20 shadow-sm' 
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold text-[#001b4e]">{plan.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${plan.tagColor}`}>
                  {plan.tag}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold text-[#001b4e]">{plan.price}</div>
                <div className="text-[11px] text-slate-400">{plan.duration}</div>
              </div>
            </div>

            <div className="space-y-2.5 mb-2">
              <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Plan Includes:</div>
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="text-[14px] font-medium text-slate-600">{feature}</span>
                </div>
              ))}
            </div>

            {selectedPlan === plan.id && (
              <div className="absolute top-4 right-4 text-[#001b4e]">
                {/* Visual indicator could go here if needed */}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4.5 rounded-2xl font-bold text-[16px] border border-slate-200 text-[#001b4e] hover:bg-slate-50 transition-all"
        >
          Back
        </button>
        <button
          disabled={!selectedPlan}
          onClick={onNext}
          className={`flex-[2] py-4.5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
            selectedPlan 
              ? 'bg-[#001b4e] text-white shadow-lg shadow-indigo-900/20' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
