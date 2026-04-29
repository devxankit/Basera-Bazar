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
      {/* Header removed from here as per user request to move notification icon into PartnerHome content */}

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
