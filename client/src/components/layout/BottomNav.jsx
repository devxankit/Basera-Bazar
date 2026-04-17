import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, Wrench, Store, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Building2, label: 'Property', path: '/browse/property' },
    { icon: Wrench, label: 'Service', path: '/browse/service' },
    { icon: ShoppingBag, label: 'Mandi', path: '/mandi-bazar' },
    { icon: Store, label: 'Supply', path: '/browse/supplier' }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/40 flex items-center justify-between px-3 py-2.5 rounded-[32px] shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center gap-1 transition-all flex-1 py-1 relative",
                isActive ? "text-[#1f2355]" : "text-slate-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all duration-500",
                  isActive ? "bg-indigo-50/80 scale-110 shadow-sm" : "bg-transparent scale-100"
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.1em]",
                  isActive ? "text-[#1f2355]" : "text-slate-400"
                )}>{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute -top-1 w-1 h-1 bg-[#fa8639] rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
