import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ChevronLeft, 
  Circle, 
  Package, 
  Truck, 
  BadgePercent, 
  Info,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../../components/common/Skeleton';

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'Order Delivered!',
      message: 'Your order #BB-9021 for UltraTech Cement has been delivered successfully.',
      time: '2 hours ago',
      isRead: false,
      icon: Package,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 2,
      type: 'offer',
      title: 'Flash Sale: 20% OFF!',
      message: 'Get exclusive discounts on Saria and Steel today. Valid for next 4 hours.',
      time: '5 hours ago',
      isRead: false,
      icon: BadgePercent,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      id: 3,
      type: 'shipping',
      title: 'Order Out for Delivery',
      message: 'The truck for your order #BB-9025 is on its way to Muzaffarpur.',
      time: 'Yesterday',
      isRead: true,
      icon: Truck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 4,
      type: 'info',
      title: 'New Mandi Prices Updated',
      message: 'Daily rates for Bricks and Aggregate have been updated for your region.',
      time: '2 days ago',
      isRead: true,
      icon: Info,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600'
    }
  ];

  return (
    <div className="bg-white min-h-screen pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
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

      {/* ── NOTIFICATION LIST ── */}
      <div className="px-4 flex flex-col gap-4 mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-2 w-1/4 rounded-md mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {notifications.length > 0 ? (
              notifications.map((note, index) => (
                <motion.div 
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer flex gap-4 ${
                    note.isRead ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-orange-100 shadow-sm'
                  }`}
                >
                  {!note.isRead && (
                    <div className="absolute top-4 right-4">
                      <Circle size={8} fill="#f59e0b" className="text-orange-500" />
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${note.iconBg} ${note.iconColor}`}>
                    <note.icon size={22} strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-black text-[14px] truncate ${note.isRead ? 'text-[#1f2355]' : 'text-[#1f2355]'}`}>
                        {note.title}
                      </h3>
                    </div>
                    <p className="text-slate-500 font-medium text-[12px] leading-snug mt-1 line-clamp-2">
                      {note.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2.5 text-slate-400">
                      <Clock size={10} />
                      <span className="font-bold text-[10px] uppercase tracking-wider">{note.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))
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
                <p className="text-slate-400 font-medium text-sm mt-1">We'll let you know when something <br />important happens.</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── FOOTER MARK ALL READ ── */}
      {notifications.some(n => !n.isRead) && (
        <div className="px-4 mt-8">
          <button className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[#1f2355] font-black uppercase text-[12px] tracking-widest active:scale-[0.98] transition-all bg-white hover:bg-slate-50 shadow-sm">
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
