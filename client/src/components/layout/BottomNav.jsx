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
    { icon: Building2, label: 'PROPERTIES', path: '/browse/property' },
    { icon: ShoppingBag, label: 'MANDI', path: '/mandi-bazar', isSpecial: true },
    { icon: Wrench, label: 'SERVICE', path: '/browse/service' },
    { icon: Store, label: 'SUPPLIER', path: '/browse/supplier' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-2 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white flex items-center justify-between px-2 py-2 rounded-[32px] shadow-[0_-15px_40px_-5px_rgba(0,0,0,0.08),0_20px_50px_-5px_rgba(0,0,0,0.15)] border border-slate-50 relative">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex-1 relative z-10"
          >
            {({ isActive }) => (
              <div className={cn(
                "flex flex-col items-center gap-1 py-1.5 transition-all duration-300",
                item.isSpecial ? "-mt-8" : ""
              )}>
                {item.isSpecial ? (
                  /* Special Highlighted Mandi Button */
                  <div className="flex flex-col items-center gap-1.5 group">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative overflow-hidden border-4 border-white",
                      isActive 
                        ? "bg-gradient-to-br from-[#1f2355] to-[#3b4191] scale-110 rotate-[5deg] shadow-indigo-200" 
                        : "bg-gradient-to-br from-[#1f2355] to-[#181d5f] group-hover:scale-105"
                    )}>
                      {/* Inner Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                      <item.icon 
                        size={26} 
                        className={cn(
                          "text-white transition-all duration-500",
                          isActive ? "scale-110" : "group-hover:rotate-12"
                        )} 
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className={cn(
                      "text-[9px] font-black tracking-[0.05em] uppercase transition-all duration-300",
                      isActive ? "text-[#1f2355]" : "text-slate-400 group-hover:text-slate-600"
                    )}>{item.label}</span>
                  </div>
                ) : (
                  /* Standard Nav Button */
                  <div className="flex flex-col items-center gap-1.5 relative group">
                    {isActive && (
                      <>
                        <motion.div 
                          layoutId="nav-bg"
                          className="absolute inset-x-0 inset-y-0 bg-[#1f2355]/5 rounded-2xl -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                        <motion.div 
                          layoutId="nav-dot"
                          className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      </>
                    )}
                    <item.icon 
                      size={18} 
                      strokeWidth={isActive ? 3 : 2} 
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "text-[#1f2355] scale-110" : "text-slate-300 group-hover:text-[#1f2355]/40"
                      )} 
                    />
                    <span className={cn(
                      "text-[8px] font-black tracking-tight leading-none transition-all duration-300",
                      isActive ? "text-[#1f2355]" : "text-slate-300 group-hover:text-slate-400"
                    )}>{item.label}</span>
                  </div>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
