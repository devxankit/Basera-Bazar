import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Package, 
  UserCircle,
  TrendingUp,
  ShoppingBag,
  Zap,
  LayoutGrid
} from 'lucide-react';

export default function PartnerBottomNav({ role }) {
  const location = useLocation();
  const normalizedRole = (role || '').toLowerCase();
  const isMandi = normalizedRole.includes('mandi');

  const navItems = isMandi ? [
    { label: 'Home', icon: <Home size={22} />, path: '/partner/home' },
    { label: 'Stocks', icon: <Package size={22} />, path: '/partner/inventory' },
    { label: 'Orders', icon: <ShoppingBag size={22} />, path: '/partner/orders' },
    { label: 'Leads', icon: <TrendingUp size={22} />, path: '/partner/leads' },
    { label: 'Profile', icon: <UserCircle size={22} />, path: '/partner/profile' }
  ] : [
    { label: 'Home', icon: <Home size={24} />, path: '/partner/home' },
    { label: 'Inventory', icon: <Package size={24} />, path: '/partner/inventory' },
    { label: 'Leads', icon: <TrendingUp size={24} />, path: '/partner/leads' },
    { label: 'Profile', icon: <UserCircle size={24} />, path: '/partner/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,27,78,0.12)] rounded-3xl px-2 py-2 flex justify-around items-center pointer-events-auto ring-1 ring-[#001b4e]/5"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center p-2 group transition-all duration-300 min-w-[64px]"
            >
              {/* Background Glow/Indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#001b4e]/5 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with scaling */}
              <div className={`relative z-10 transition-all duration-300 ${
                isActive ? 'text-[#001b4e] -translate-y-1' : 'text-slate-400 group-hover:text-slate-600'
              }`}>
                {item.icon}
                
                {/* Active Dot */}
                {isActive && (
                  <motion.div 
                    layoutId="activeDot"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fa8639] rounded-full"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </div>

              {/* Label */}
              <span className={`relative z-10 text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${
                isActive ? 'text-[#001b4e] opacity-100 scale-110' : 'text-slate-400 opacity-60'
              }`}>
                {item.label}
              </span>

              {/* Tap Ripple Effect (Subtle) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="absolute inset-0 rounded-2xl"
              />
            </NavLink>
          );
        })}
      </motion.div>
    </div>
  );
}
