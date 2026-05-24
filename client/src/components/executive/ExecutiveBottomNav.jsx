import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  CalendarCheck, 
  FileText, 
  CalendarX, 
  UserCircle,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useExecutive } from '../../context/ExecutiveContext';
import { toast } from '../../mockToast';

const ExecutiveBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useExecutive();

  const onboardingStatus = data?.profile?.onboarding_status;
  const isVerified = onboardingStatus === 'approved' || onboardingStatus === 'verified';

  // Pages restricted to verified executives only
  const RESTRICTED_PATHS = [
    '/executive/attendance',
    '/executive/reports',
    '/executive/leaves',
  ];

  const navItems = [
    { id: 'home',       label: 'Home',       icon: LayoutGrid,   path: '/executive/dashboard',  restricted: false },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/executive/attendance', restricted: true  },
    { id: 'reports',    label: 'Reports',    icon: FileText,      path: '/executive/reports',    restricted: true  },
    { id: 'leaves',     label: 'Leaves',     icon: CalendarX,     path: '/executive/leaves',     restricted: true  },
    { id: 'profile',    label: 'Profile',    icon: UserCircle,    path: '/executive/profile',    restricted: false },
  ];

  const handleNavClick = (item) => {
    if (item.restricted && !isVerified) {
      toast.error('Your account is under review. This feature will be unlocked after verification by admin.');
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <div className="bg-white border border-slate-100 flex justify-around items-center py-2 px-2 rounded-2xl shadow-xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isLocked = item.restricted && !isVerified;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center gap-1 group relative py-1"
            >
              <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-900 text-white' 
                  : isLocked
                  ? 'text-slate-300'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}>
                {isLocked ? <Lock size={18} strokeWidth={2} /> : <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                {isLocked && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white" />
                )}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest transition-all duration-300 ${
                isActive ? 'text-slate-900' : isLocked ? 'text-slate-300' : 'text-slate-400'
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
