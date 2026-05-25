import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Zap } from 'lucide-react';

const COUNTDOWN_SECONDS = 5;

/**
 * PaymentStatusPage — Full-screen animated payment result page.
 *
 * Query params:
 *   status   = "success" | "failed"
 *   redirect = URL path to navigate to after countdown  (e.g. /partner/home)
 *   message  = Optional custom message (Razorpay error description etc.)
 *   context  = Optional context label (e.g. "subscription" | "order" | "registration")
 */
export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawStatus  = searchParams.get('status')   || 'success';
  const rawRedirect = searchParams.get('redirect') || '/';
  const rawMessage  = searchParams.get('message')  || '';
  const context    = searchParams.get('context')   || 'subscription';

  const isSuccess  = rawStatus === 'success';
  const redirectTo = decodeURIComponent(rawRedirect);
  const message    = rawMessage ? decodeURIComponent(rawMessage) : '';

  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [hasRedirected, setHasRedirected] = useState(false);
  const intervalRef = useRef(null);

  const doRedirect = useCallback(() => {
    if (hasRedirected) return;
    setHasRedirected(true);
    clearInterval(intervalRef.current);
    // Signal to the destination page about the payment outcome
    if (isSuccess) {
      if (context === 'order') {
        sessionStorage.setItem('bb_order_payment_success', '1');
      } else {
        // subscription / registration — destination page should refresh user
        sessionStorage.setItem('bb_subscription_payment_success', '1');
      }
    }
    navigate(redirectTo, { replace: true });
  }, [hasRedirected, navigate, redirectTo, isSuccess, context]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          doRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [doRedirect]);

  // ── Content config ─────────────────────────────────────────────────────────
  const config = isSuccess
    ? {
        bg: 'from-emerald-950 via-emerald-900 to-[#001b4e]',
        glow: 'bg-emerald-500/20',
        ring: '#10b981',
        iconBg: 'bg-emerald-500',
        Icon: CheckCircle2,
        title: context === 'order' ? 'Order Confirmed!' : context === 'registration' ? 'Welcome Aboard!' : 'Payment Successful!',
        subtitle: context === 'order'
          ? 'Your marketplace order has been placed. The seller will confirm soon.'
          : context === 'registration'
          ? 'Your account is ready. You can now explore Basera Bazar as a partner.'
          : 'Your subscription is now active. Enjoy all premium benefits.',
        redirectLabel: 'Redirecting to your dashboard',
        btnLabel: 'Continue',
        btnClass: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30',
        particles: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
      }
    : {
        bg: 'from-red-950 via-rose-900 to-[#1a0a0a]',
        glow: 'bg-red-500/20',
        ring: '#ef4444',
        iconBg: 'bg-red-500',
        Icon: XCircle,
        title: 'Payment Failed',
        subtitle: 'Your payment could not be processed. No money has been deducted.',
        redirectLabel: 'Redirecting you to retry',
        btnLabel: 'Retry Payment',
        btnClass: 'bg-red-500 hover:bg-red-400 shadow-red-500/30',
        particles: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
      };

  // ── SVG countdown ring ──────────────────────────────────────────────────────
  const R        = 36;
  const circ     = 2 * Math.PI * R;
  const progress = (count / COUNTDOWN_SECONDS) * circ;

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${config.bg} flex flex-col items-center justify-center p-6 overflow-hidden relative font-sans`}>

      {/* Floating particle blobs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            background: config.particles[i % config.particles.length],
            left: `${(i * 19) % 85}%`,
            top: `${(i * 27) % 80}%`,
          }}
          animate={{
            y: [0, -30 - i * 8, 0],
            x: [0, 15 - i * 5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Glow halo behind icon */}
      <div className={`absolute w-64 h-64 rounded-full ${config.glow} blur-3xl pointer-events-none`} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl text-center">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center shadow-2xl`}
            >
              <config.Icon size={40} className="text-white" strokeWidth={2.5} />
            </motion.div>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-[28px] font-black text-white tracking-tight leading-tight mb-2"
          >
            {config.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-white/60 text-[14px] font-medium leading-relaxed mb-4"
          >
            {config.subtitle}
          </motion.p>

          {/* Razorpay error detail (failure only) */}
          <AnimatePresence>
            {!isSuccess && message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="mb-5 px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-2xl"
              >
                <p className="text-[11px] font-black text-red-200 uppercase tracking-wider mb-1">Reason from gateway</p>
                <p className="text-[13px] text-red-100 font-medium leading-relaxed">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 mb-6" />

          {/* Countdown ring + label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col items-center gap-3 mb-6"
          >
            <div className="relative w-20 h-20">
              {/* Background ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r={R}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="5"
                />
                {/* Progress ring */}
                <circle
                  cx="40" cy="40" r={R}
                  fill="none"
                  stroke={config.ring}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ - progress}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              {/* Countdown number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[26px] font-black text-white tabular-nums">{count}</span>
              </div>
            </div>
            <p className="text-white/50 text-[12px] font-semibold uppercase tracking-widest">
              {config.redirectLabel}…
            </p>
          </motion.div>

          {/* CTA button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            onClick={doRedirect}
            className={`w-full py-4 ${config.btnClass} text-white rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2`}
          >
            {isSuccess ? <ArrowRight size={18} /> : <RotateCcw size={18} />}
            {config.btnLabel}
          </motion.button>
        </div>

        {/* Footer brand */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-2 mt-5"
        >
          <Zap size={14} className="text-white/30" fill="currentColor" />
          <span className="text-white/30 text-[11px] font-black uppercase tracking-widest">Basera Bazar</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
