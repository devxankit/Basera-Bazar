import React from 'react';
import { Building2, Wrench, Package, Store, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  {
    id: 'agent',
    title: 'Agent',
    description: 'Buy, sell & rent properties.',
    icon: <Building2 size={26} />,
    theme: 'blue'
  },
  {
    id: 'service',
    title: 'Service Provider',
    description: 'Offer construction & home services.',
    icon: <Wrench size={26} />,
    theme: 'emerald'
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Supply building materials & fittings.',
    icon: <Package size={26} />,
    theme: 'amber'
  },
  {
    id: 'mandi',
    title: 'Mandi Seller',
    description: 'Sell raw materials with daily pricing.',
    icon: <Store size={26} />,
    theme: 'purple'
  }
];

const getThemeClasses = (theme, isSelected) => {
  const themes = {
    blue: {
      active: 'border-blue-500 bg-blue-50/30 shadow-blue-500/20 ring-blue-50',
      iconBg: isSelected ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100/80 text-blue-500',
      check: 'bg-blue-500 text-white'
    },
    emerald: {
      active: 'border-emerald-500 bg-emerald-50/30 shadow-emerald-500/20 ring-emerald-50',
      iconBg: isSelected ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-100/80 text-emerald-500',
      check: 'bg-emerald-500 text-white'
    },
    amber: {
      active: 'border-amber-500 bg-amber-50/30 shadow-amber-500/20 ring-amber-50',
      iconBg: isSelected ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100/80 text-amber-500',
      check: 'bg-amber-500 text-white'
    },
    purple: {
      active: 'border-purple-500 bg-purple-50/30 shadow-purple-500/20 ring-purple-50',
      iconBg: isSelected ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-slate-100/80 text-purple-500',
      check: 'bg-purple-500 text-white'
    }
  };
  return themes[theme];
};

export default function RoleStep({ selectedRole, onSelect, onNext }) {
  return (
    <div className="flex flex-col uppercase-none pb-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#001b4e] mb-3 tracking-tight">Choose Your Role</h1>
        <p className="text-slate-500 text-[15px] leading-relaxed">Select the role that best describes your business</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          const themeStyle = getThemeClasses(role.theme, isSelected);
          
          return (
            <motion.button
              key={role.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(role.id)}
              className={`relative flex flex-col p-5 rounded-3xl border-2 transition-all text-left overflow-hidden ${
                isSelected 
                  ? `${themeStyle.active} shadow-xl ring-4` 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${themeStyle.iconBg}`}>
                  {role.icon}
                </div>
                {isSelected ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${themeStyle.check}`}
                  >
                    <Check size={14} strokeWidth={3.5} />
                  </motion.div>
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />
                )}
              </div>

              <div className="relative z-10 mt-auto">
                <h3 className="text-[16px] font-bold text-[#001b4e] mb-1.5">{role.title}</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed font-medium line-clamp-3">{role.description}</p>
              </div>
              
              {/* Background Glow Effect */}
              {isSelected && (
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none" />
              )}
            </motion.button>
          );
        })}
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
