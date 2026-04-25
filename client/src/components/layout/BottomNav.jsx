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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-2 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white flex items-center justify-between px-3 py-3 rounded-2xl shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.08),0_15px_40px_-5px_rgba(0,0,0,0.12)] border border-slate-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              cn(
                "flex flex-col items-center gap-1.5 transition-all flex-1 py-1 relative",
                isActive ? "text-[#181d5f]" : "text-slate-300"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -top-1 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={22} strokeWidth={isActive ? 3 : 2.5} />
                <span className={cn(
                  "text-[9px] font-black tracking-wider leading-none",
                  isActive ? "text-[#181d5f]" : "text-slate-300"
                )}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
