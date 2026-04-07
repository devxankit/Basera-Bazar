import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, Wrench, Store } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Building2, label: 'Properties', path: '/browse/property' },
    { icon: Wrench, label: 'Services', path: '/browse/service' },
    { icon: Store, label: 'Suppliers', path: '/browse/supplier' }
  ];

  return (
    <nav className="z-50 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe-offset-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            cn(
              "flex flex-col items-center gap-1.5 px-3 py-1 transition-all",
              isActive ? "text-primary-600" : "text-slate-400"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-primary-50 shadow-sm" : "bg-transparent"
              )}>
                <item.icon size={22} strokeWidth={isActive ? 2 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-widest",
                isActive ? "text-primary-700" : "text-slate-400"
              )}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
