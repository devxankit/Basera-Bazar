import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, Circle, Package, Truck, BadgePercent, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const ICON_MAP = {
  order_status: { icon: Package, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  promotion:    { icon: BadgePercent, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
  shipping:     { icon: Truck, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  new_listing:  { icon: Info, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  default:      { icon: Bell, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (note) => {
    if (!note.is_read) {
      try {
        await api.patch(`/notifications/${note._id}/read`);
        setNotifications(prev =>
          prev.map(n => n._id === note._id ? { ...n, is_read: true } : n)
        );
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    const redirectUrl = note.data?.redirect_url;
    if (redirectUrl) navigate(redirectUrl);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="bg-white min-h-screen pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 px-4 pt-0 pb-3 flex items-center gap-4 border-b border-slate-50 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#1f2355] active:scale-95 transition-all"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="py-3">
          <h1 className="text-[#1f2355] font-black text-xl leading-none">Notifications</h1>
          <p className="text-slate-400 font-semibold text-[11px] mt-1 uppercase tracking-wider">Stay updated with Basera Bazar</p>
        </div>
      </div>

      {/* Notification List */}
      <div className="px-4 flex flex-col gap-4 mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-md bg-slate-100" />
                  <div className="h-3 w-full rounded-md bg-slate-100" />
                  <div className="h-2 w-1/4 rounded-md bg-slate-100 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {notifications.length > 0 ? (
              notifications.map((note, index) => {
                const typeKey = note.data?.type || 'default';
                const { icon: Icon, iconBg, iconColor } = ICON_MAP[typeKey] || ICON_MAP.default;
                return (
                  <motion.div
                    key={note._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleClick(note)}
                    className={`relative p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer flex gap-4 ${
                      note.is_read
                        ? 'bg-white border-slate-100'
                        : 'bg-slate-50/50 border-orange-100 shadow-sm'
                    }`}
                  >
                    {!note.is_read && (
                      <div className="absolute top-4 right-4">
                        <Circle size={8} fill="#f59e0b" className="text-orange-500" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${iconBg} ${iconColor}`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[14px] truncate text-[#1f2355]">{note.title}</h3>
                      <p className="text-slate-500 font-medium text-[12px] leading-snug mt-1 line-clamp-2">
                        {note.body}
                      </p>
                      <div className="flex items-center gap-1 mt-2.5 text-slate-400">
                        <Clock size={10} />
                        <span className="font-bold text-[10px] uppercase tracking-wider">
                          {relativeTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <Bell size={40} strokeWidth={1} />
                </div>
                <h3 className="text-[#1f2355] font-black text-lg">No Notifications yet</h3>
                <p className="text-slate-400 font-medium text-sm mt-1">
                  We'll let you know when something <br />important happens.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mark All Read */}
      {hasUnread && (
        <div className="px-4 mt-8">
          <button
            onClick={handleMarkAllRead}
            className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[#1f2355] font-black uppercase text-[12px] tracking-widest active:scale-[0.98] transition-all bg-white hover:bg-slate-50 shadow-sm"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
