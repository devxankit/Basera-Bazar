import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Wallet, UserCircle, LayoutGrid, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const ExecutiveBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Console', icon: LayoutGrid, path: '/executive/dashboard' },
    { id: 'partners', label: 'Network', icon: Users, path: '/executive/partners' },
    { id: 'wallet', label: 'Payouts', icon: Wallet, path: '/executive/wallet' },
    { id: 'profile', label: 'Vault', icon: UserCircle, path: '/executive/profile' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="bg-white border border-slate-100 flex justify-around items-center py-2 px-2 rounded-2xl shadow-xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 group relative py-1"
            >
              <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest transition-all duration-300 ${
                isActive ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExecutiveBottomNav;
