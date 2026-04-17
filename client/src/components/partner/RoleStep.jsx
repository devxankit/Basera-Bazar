import React from 'react';
import { Briefcase, HeartHandshake, Box, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  {
    id: 'agent',
    title: 'Agent',
    description: 'Buy, sell, and rent properties. Connect buyers with sellers.',
    icon: <Briefcase className="text-blue-500" size={24} />,
    bgColor: 'bg-blue-50'
  },
  {
    id: 'service',
    title: 'Service Provider',
    description: 'Offer construction, renovation, and property-related services.',
    icon: <HeartHandshake className="text-green-600" size={24} />,
    bgColor: 'bg-green-50'
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Supply construction materials, furniture, and fittings.',
    icon: <Box className="text-orange-500" size={24} />,
    bgColor: 'bg-orange-50'
  },
  {
    id: 'mandi',
    title: 'Mandi Seller',
    description: 'Sell construction materials (Bricks, Sand, etc.) with daily pricing.',
    icon: <Briefcase className="text-cyan-600" size={24} />,
    bgColor: 'bg-cyan-50'
  }
];

export default function RoleStep({ selectedRole, onSelect, onNext }) {
  return (
    <div className="flex flex-col uppercase-none pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#001b4e] mb-3 tracking-tight">Choose Your Role</h1>
        <p className="text-slate-500 text-[15px] leading-relaxed">Select the role that best describes your business</p>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <motion.button
            key={role.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.id)}
            className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all text-left ${
              selectedRole === role.id 
                ? 'border-[#001b4e] bg-indigo-50/30' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`w-14 h-14 ${role.bgColor} rounded-xl flex items-center justify-center shrink-0 mr-4`}>
              {role.icon}
            </div>
            <div className="flex-grow">
              <h3 className="text-[17px] font-bold text-[#001b4e] mb-1">{role.title}</h3>
              <p className="text-slate-400 text-[13px] leading-snug">{role.description}</p>
            </div>
            {selectedRole === role.id && (
              <div className="ml-2 w-6 h-6 bg-[#001b4e] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-8">
        <button
          disabled={!selectedRole}
          onClick={onNext}
          className={`w-full py-5 rounded-2xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
            selectedRole 
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
