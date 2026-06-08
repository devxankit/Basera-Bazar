import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Users, ClipboardCheck, FileText, IndianRupee, UserCircle } from 'lucide-react';
import api from '../../services/api';
import { Toaster } from '../../mockToast';

const NAV_ITEMS = [
  { label: 'Home', icon: LayoutGrid, path: '/team-leader/dashboard' },
  { label: 'Team', icon: Users, path: '/team-leader/team/executives' },
  { label: 'Verify', icon: ClipboardCheck, path: '/team-leader/attendance', badgeKey: 'attendance' },
  { label: 'Reports', icon: FileText, path: '/team-leader/reports', badgeKey: 'reports' },
  { label: 'Salary', icon: IndianRupee, path: '/team-leader/salary' },
  { label: 'Profile', icon: UserCircle, path: '/team-leader/profile' },
];

const HIDE_NAV = ['/team-leader/login'];

function TeamLeaderBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ attendance: 0, reports: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data } = await api.get('/team-leader/pending-counts');
        if (data.success) setCounts(data.data);
      } catch (err) { /* counts fetch failure is non-critical */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm z-50">
      <div className="bg-white border border-slate-100 flex justify-around items-center py-2 px-1 rounded-2xl shadow-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 group relative"
            >
              <div
                className={`p-2.5 rounded-xl transition-all relative ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] font-bold uppercase tracking-widest ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
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

export default function TeamLeaderLayout({ children }) {
  const location = useLocation();
  const hideNav = HIDE_NAV.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col max-w-md mx-auto relative shadow-sm border-x border-slate-100 overflow-x-hidden font-outfit">
      <Toaster />
      <main className={`grow ${!hideNav ? 'pb-32' : ''}`}>{children}</main>
      {!hideNav && <TeamLeaderBottomNav />}
    </div>
  );
}
