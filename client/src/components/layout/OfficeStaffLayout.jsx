import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Clock, Target, FileText, IndianRupee, UserCircle } from 'lucide-react';
import { Toaster } from '../../mockToast';

const NAV_ITEMS = [
  { label: 'Home', icon: LayoutGrid, path: '/office-staff/dashboard' },
  { label: 'Attend.', icon: Clock, path: '/office-staff/attendance' },
  { label: 'Targets', icon: Target, path: '/office-staff/targets' },
  { label: 'Reports', icon: FileText, path: '/office-staff/reports' },
  { label: 'Salary', icon: IndianRupee, path: '/office-staff/salary' },
  { label: 'Profile', icon: UserCircle, path: '/office-staff/profile' },
];

function OfficeStaffBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm z-50">
      <div className="bg-white border border-slate-100 flex justify-around items-center py-2 px-1 rounded-2xl shadow-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 group"
            >
              <div
                className={`p-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-teal-500 hover:bg-teal-50'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[8px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-teal-600' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OfficeStaffLayout({ children }) {
  const location = useLocation();
  const hideNav = location.pathname === '/office-staff/login';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto relative shadow-sm border-x border-slate-100 overflow-x-hidden font-outfit">
      <Toaster />
      <main className={`grow ${!hideNav ? 'pb-32' : ''}`}>{children}</main>
      {!hideNav && <OfficeStaffBottomNav />}
    </div>
  );
}
