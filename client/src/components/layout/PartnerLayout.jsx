import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PartnerBottomNav from '../../components/partner/PartnerBottomNav';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
        const { cacheService } = await import('../../services/CacheService');
        const count = await cacheService.get('unread_notifications_count', async () => {
          const res = await api.get('/notifications');
          if (res.data.success) {
            return res.data.data.filter(n => !n.is_read).length;
          }
          return 0;
        }, 1 * 60 * 1000); // 1 minute cache for notifications
        setUnreadCount(count);
      } catch (err) {}
    };
    fetchUnread();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden">
      {/* Header removed from here as per user request to move notification icon into PartnerHome content */}

      <main className="flex-grow">
        {children}
      </main>
      
      {!location.pathname.includes('/partner/subscription') && 
       !location.pathname.includes('/partner/add-product') && 
       !location.pathname.includes('/partner/marketplace/orders/') &&
       !location.pathname.includes('/partner/lead-details/') && (
        <PartnerBottomNav role={role} />
      )}
    </div>
  );
}
