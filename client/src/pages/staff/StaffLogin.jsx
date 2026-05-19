import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Phone, Lock, Eye, EyeOff, MapPin, Headphones, ArrowRight, Shield, TrendingUp, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../mockToast';

const ROLES = [
  {
    id: 'team_leader',
    label: 'Team Leader',
    subtitle: 'State Head',
    icon: Users,
    accent: '#4f46e5',
    bg: 'from-indigo-50 to-indigo-100/50',
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700',
    redirectTo: '/team-leader/dashboard',
  },
  {
    id: 'field_executive',
    label: 'Field Executive',
    subtitle: 'Outdoor / Field Work',
    icon: MapPin,
    accent: '#ea580c',
    bg: 'from-orange-50 to-orange-100/50',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-700',
    redirectTo: '/executive/dashboard',
    apiRole: 'executive',
  },
  {
    id: 'office_staff',
    label: 'Office Staff',
    subtitle: 'Indoor / Calling Work',
    icon: Headphones,
    accent: '#0d9488',
    bg: 'from-teal-50 to-teal-100/50',
    border: 'border-teal-300',
    badge: 'bg-teal-100 text-teal-700',
    redirectTo: '/office-staff/dashboard',
  },
];

const STATS = [
  { icon: Shield, label: 'Secure Portal', value: 'End-to-end encrypted' },
  { icon: TrendingUp, label: 'Live Dashboard', value: 'Real-time tracking' },
  { icon: Clock, label: '24/7 Access', value: 'Always available' },
];

export default function StaffLogin() {
  const [searchParams] = useSearchParams();
  const initialRole = ROLES.find((r) => r.id === searchParams.get('role')) || null;
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setIsSubmitting(true);

    const apiRole = selectedRole.apiRole || selectedRole.id;

    try {
      const { data } = await api.post('/auth/staff/login', {
        identifier: identifier.trim(),
        password,
        role: apiRole,
      });

      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user?.name || selectedRole.label}!`);
        navigate(selectedRole.redirectTo);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-[#001b4e] flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-white/3" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">BaseraBazar</span>
          </div>
          <p className="text-white/50 text-xs font-medium ml-13 -mt-1">Staff Management System</p>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-white leading-tight">
              Your Team,<br />
              <span className="text-indigo-300">One Platform.</span>
            </h2>
            <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
              Manage attendance, track targets, submit reports, and grow your career — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{label}</p>
                  <p className="text-white/45 text-xs">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/25 text-xs">
          © {new Date().getFullYear()} BaseraBazar. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#001b4e] mb-4 shadow-lg shadow-[#001b4e]/30">
              <Users size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Staff Portal Login</h1>
            <p className="text-slate-400 text-sm mt-1">BaseraBazar Staff Management System</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-black text-slate-900">Sign In</h1>
            <p className="text-slate-400 text-sm mt-1">Select your role and enter your credentials</p>
          </div>

          {/* Role selection */}
          <div className="mb-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Your Role</p>
            <div className="grid gap-2.5">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole?.id === role.id;
                return (
                  <motion.button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? `border-(--ac) bg-linear-to-r ${role.bg} shadow-sm`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                    style={{ '--ac': role.accent }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: isSelected ? role.accent : '#f1f5f9' }}
                    >
                      <Icon size={18} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{role.subtitle}</p>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: role.accent }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Credentials form */}
          <AnimatePresence mode="wait">
            {selectedRole && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  {/* Selected role badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${selectedRole.badge}`}>
                      Signing in as {selectedRole.label}
                    </span>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Identifier */}
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1.5">
                        Phone Number or Email
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="10-digit phone or email address"
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50 placeholder-slate-300 transition-all"
                          style={{ '--tw-ring-color': selectedRole.accent }}
                          onFocus={(e) => { e.target.style.borderColor = selectedRole.accent; e.target.style.boxShadow = `0 0 0 3px ${selectedRole.accent}22`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-bold text-slate-600">Password</label>
                        <button
                          type="button"
                          onClick={() => navigate('/staff/forgot-password')}
                          className="text-[11px] font-bold hover:underline"
                          style={{ color: selectedRole.accent }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none bg-slate-50 placeholder-slate-300 transition-all"
                          onFocus={(e) => { e.target.style.borderColor = selectedRole.accent; e.target.style.boxShadow = `0 0 0 3px ${selectedRole.accent}22`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 shadow-lg mt-4"
                      style={{
                        backgroundColor: selectedRole.accent,
                        boxShadow: `0 8px 24px ${selectedRole.accent}40`,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in as {selectedRole.label}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </motion.button>

                    {/* Field Executive signup link */}
                    {selectedRole.id === 'field_executive' && (
                      <p className="text-center text-xs text-slate-400 pt-1">
                        New field executive?{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/executive/signup')}
                          className="font-bold hover:underline"
                          style={{ color: selectedRole.accent }}
                        >
                          Sign up here
                        </button>
                      </p>
                    )}
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}
