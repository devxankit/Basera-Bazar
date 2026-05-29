import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner — a slim, non-blocking bar that appears when the device loses
 * connectivity and briefly confirms when it comes back. It does NOT navigate or
 * unmount anything, so whatever page the user is on stays exactly as it was;
 * only newly-attempted network calls fail (and those are handled elsewhere).
 *
 * Mount it once, globally (inside the Router in App.jsx).
 *
 * It subscribes to the online/offline events directly (rather than via the
 * shared useOnlineStatus hook) so all state updates happen inside event
 * callbacks — the "Back online" flash naturally only fires after a real
 * reconnection.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true,
  );
  const [showBackOnline, setShowBackOnline] = useState(false);
  const flashTimer = useRef(null);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setShowBackOnline(false), 2500);
    };
    const goOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
      clearTimeout(flashTimer.current);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearTimeout(flashTimer.current);
    };
  }, []);

  const visible = !isOnline || showBackOnline;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed top-0 inset-x-0 z-[9998] flex justify-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div
            className={`mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg pointer-events-auto ${
              isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Back online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>You&apos;re offline — showing saved data</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
