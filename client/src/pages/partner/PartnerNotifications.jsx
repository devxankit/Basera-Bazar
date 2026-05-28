import React, { useState, useEffect } from 'react';
import toast from '../../mockToast';
import {
  Bell, Trash2, CheckCircle2, XCircle,
  Clock, ArrowLeft, Loader2, Info, MessageSquare, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PartnerNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    api.patch('/notifications/read-all')
      .then(async () => {
        queryClient.setQueryData(['partnerNotifications'], (old) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.map(n => ({ ...n, is_read: true })) };
        });
        const { cacheService } = await import('../../services/CacheService');
        cacheService.invalidate('unread_notifications_count');
      })
      .catch(() => {});
  }, []);

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['partnerNotifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const rawNotifications = rawData?.success ? rawData.data : [];

  // Filter enquiry notifications by active role so a multi-role partner
  // doesn't see leads meant for a different role type (#174)
  const roleEnquiryTypeMap = {
    property_agent: 'property', property: 'property', agent: 'property',
    service_provider: 'service', service: 'service',
    supplier: 'supplier', supplier_partner: 'supplier',
    mandi_seller: 'mandi', mandi: 'mandi'
  };
  const activeRole = (user?.active_role || user?.partner_type || '').toLowerCase();
  const expectedEnquiryType = roleEnquiryTypeMap[activeRole];
  const notifications = rawNotifications.filter(n => {
    if (n.data?.type === 'enquiry' && expectedEnquiryType && n.data?.enquiry_type) {
      return n.data.enquiry_type === expectedEnquiryType;
    }
    return true;
  });

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        queryClient.setQueryData(['partnerNotifications'], (old) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter(n => n._id !== id) };
        });
      }
    } catch (err) {
      toast.error("Failed to delete notification");
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
            onClick={() => navigate(-1)}
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
                       <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(n._id); }} className="text-slate-300 hover:text-rose-500 p-1">
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-200 flex items-end justify-center p-4 pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-[#001b4e]">Delete Notification?</p>
                  <p className="text-[11px] font-medium text-slate-400">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[13px] font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[13px] font-bold shadow-lg shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
