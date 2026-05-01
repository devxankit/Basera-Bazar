import React, { useState, useEffect } from 'react';
import {
  Bell, Trash2, CheckCircle2, XCircle,
  Clock, ArrowLeft, Loader2, Info, MessageSquare, ShoppingBag
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
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'listing_rejection':
        return <XCircle className="text-rose-500" size={18} />;
      case 'enquiry':
        return <MessageSquare className="text-blue-500" size={18} />;
      case 'mandi_order':
        return <ShoppingBag className="text-indigo-500" size={18} />;
      default:
        return <Bell className="text-[#001b4e]" size={18} />;
    }
  };

  const handleNotificationClick = (n) => {
    const type = n.data?.type;
    if (type === 'enquiry' && n.data?.enquiry_id) {
      navigate(`/partner/lead-details/${n.data.enquiry_id}`);
    } else if (type === 'account_status_change') {
      navigate('/partner/profile');
    } else if (type === 'mandi_order') {
      navigate('/partner/marketplace/orders');
    } else if (type === 'listing_approval' || type === 'listing_rejection') {
      navigate('/partner/inventory');
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-32">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/partner/home')}
            className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Alert Center</h2>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Updates...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
             <Bell size={64} className="text-slate-200 mb-6" />
             <h3 className="text-[18px] font-bold text-slate-400 uppercase tracking-tight">No Alerts</h3>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex gap-3.5 active:scale-[0.99] transition-all cursor-pointer mb-3"
                >
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    {React.cloneElement(getIcon(n.data?.type), { size: 18 })}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <div className="text-[13px] font-black text-[#001b4e] uppercase tracking-tight truncate leading-tight">{n.title}</div>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} className="text-slate-300 hover:text-rose-500 p-1">
                          <Trash2 size={12} />
                       </button>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 leading-normal">{n.body}</p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-slate-200 text-[9px] font-black uppercase tracking-widest">
                       <Clock size={10} />
                       {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
