import React, { useState, useEffect } from 'react';
import {
  Bell, Trash2, CheckCircle2, XCircle,
  Clock, ArrowLeft, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PartnerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'listing_approval':
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'listing_rejection':
        return <XCircle className="text-rose-500" size={20} />;
      default:
        return <Info className="text-indigo-500" size={20} />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'listing_approval':
        return 'bg-emerald-50';
      case 'listing_rejection':
        return 'bg-rose-50';
      default:
        return 'bg-indigo-50';
    }
  };

  return (
    <div className="pb-24 pt-4 px-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Updates & Alerts</p>
      </div>

      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#001b4e]" size={36} />
          <p className="text-slate-400 font-black tracking-widest text-[10px] uppercase">Syncing alerts...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                key={n._id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex gap-4 group hover:border-[#001b4e]/10 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${getBg(n.data?.type)} flex-shrink-0 flex items-center justify-center`}>
                  {getIcon(n.data?.type)}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-slate-900 leading-tight truncate">{n.title}</h3>
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mt-1 leading-relaxed">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-slate-300">
                    <Clock size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
            <Bell size={40} className="text-slate-200" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">All caught up!</h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">No pending notifications</p>
          <button
            onClick={() => navigate('/partner/home')}
            className="mt-8 px-8 py-3 bg-[#001b4e] text-white font-black rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all text-sm"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
