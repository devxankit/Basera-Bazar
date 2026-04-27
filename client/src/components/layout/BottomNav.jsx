import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, Wrench, Store, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'HOME', path: '/' },
    { icon: Building2, label: 'PROPERTY', path: '/browse/property' },
    { icon: Wrench, label: 'SERVICE', path: '/browse/service' },
    { icon: ShoppingBag, label: 'MANDI', path: '/mandi-bazar' },
    { icon: Store, label: 'SUPPLY', path: '/browse/supplier' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-2 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white flex items-center justify-between px-2 py-2 rounded-[28px] shadow-[0_-15px_40px_-5px_rgba(0,0,0,0.06),0_15px_40px_-5px_rgba(0,0,0,0.1)] border border-slate-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex-1"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-1.5 py-1.5 relative group">
                {isActive && (
                  <>
                    <motion.div 
                      layoutId="nav-bg"
                      className="absolute inset-x-1 inset-y-0.5 bg-[#181d5f]/5 rounded-2xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                    <motion.div 
                      layoutId="nav-dot"
                      className="absolute -top-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  </>
                )}
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 3 : 2} 
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-[#181d5f] scale-110" : "text-slate-300 group-hover:text-slate-400"
                  )} 
                />
                <span className={cn(
                  "text-[8px] font-black tracking-tight leading-none transition-all duration-300",
                  isActive ? "text-[#181d5f]" : "text-slate-300 group-hover:text-slate-400"
                )}>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
