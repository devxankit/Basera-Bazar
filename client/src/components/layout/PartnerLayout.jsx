import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PartnerBottomNav from '../../components/partner/PartnerBottomNav';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { subscribeToNotifications } from '../../services/pushService';

import { Bell, ChevronLeft } from 'lucide-react';

export default function PartnerLayout({ children }) {
  const { user } = useAuth();
  const [role, setRole] = useState('agent');
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Priority 1: active_role from multi-role system
    if (user && (user.active_role || user.partner_type || user.role)) {
      setRole(user.active_role || user.partner_type || user.role);
    } else {
      // Priority 2: Local storage for persistence across reloads
      const savedRole = localStorage.getItem('baserabazar_partner_role');
      if (savedRole) {
        setRole(savedRole);
      }
    }
    
    // Fetch unread count
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setUnreadCount(res.data.data.filter(n => !n.is_read).length);
        }
      } catch (err) {}
    };
    fetchUnread();

    // ── PUSH NOTIFICATION REGISTRATION ──
    const initPush = async () => {
       try {
         await subscribeToNotifications();
       } catch (err) {
         console.warn("[Push] Registration failed:", err);
       }
    };
    initPush();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {/* Top Header - ONLY visible on Partner Home */}
      {location.pathname === '/partner/home' && (
        <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {location.pathname !== '/partner/home' ? (
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <ChevronLeft size={20} />
                </button>
             ) : (
                <div className="w-10 h-10 rounded-xl bg-[#001b4e] flex items-center justify-center text-white font-black text-xl">B</div>
             )}
             <span className="font-black text-slate-800 tracking-tight">BaseraBazar</span>
          </div>
          
          <button 
            onClick={() => navigate('/partner/notifications')}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 relative active:scale-95 transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        </header>
      )}

      <main className="flex-grow">
        {children}
      </main>
      
      {!location.pathname.includes('/partner/subscription') && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] max-w-md mx-auto w-full border-t border-slate-100/50">
          <PartnerBottomNav role={role} />
        </div>
      )}
    </div>
  );
}
