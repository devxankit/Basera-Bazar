import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Phone, Lock, Eye, EyeOff, MapPin, Headphones, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../mockToast';

const ROLES = [
  {
    id: 'team_leader',
    label: 'Team Leader',
    subtitle: 'State Head',
    icon: Users,
    color: 'indigo',
    accent: '#4f46e5',
    bg: '#eef2ff',
    redirectTo: '/team-leader/dashboard',
  },
  {
    id: 'field_executive',
    label: 'Field Executive',
    subtitle: 'Outdoor / Field Work',
    icon: MapPin,
    color: 'orange',
    accent: '#ea580c',
    bg: '#fff7ed',
    redirectTo: '/executive/dashboard',
    apiRole: 'executive',
  },
  {
    id: 'office_staff',
    label: 'Office Staff',
    subtitle: 'Indoor / Calling Work',
    icon: Headphones,
    color: 'teal',
    accent: '#0d9488',
    bg: '#f0fdfa',
    redirectTo: '/office-staff/dashboard',
  },
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

  const accent = selectedRole?.accent || '#001b4e';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#001b4e] mb-4">
            <Users size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Staff Portal Login</h1>
          <p className="text-slate-500 text-sm mt-1">BaseraBazar Staff Management System</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          {/* Step 1: Select Role */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Select Your Role</p>
          <div className="grid gap-2 mb-6">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[color:var(--accent-color)] bg-[color:var(--accent-bg)]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  style={{
                    '--accent-color': role.accent,
                    '--accent-bg': role.bg,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isSelected ? role.accent : '#f1f5f9' }}
                  >
                    <Icon size={18} className={isSelected ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{role.label}</p>
                    <p className="text-xs text-slate-400">{role.subtitle}</p>
                  </div>
                  {isSelected && <ChevronRight size={16} style={{ color: role.accent }} />}
                </button>
              );
            })}
          </div>

          {/* Step 2: Credentials (revealed after role selection) */}
          <AnimatePresence>
            {selectedRole && (
              <motion.form
                key="creds"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
              >
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  {/* Identifier */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">Phone Number or Email</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="10-digit phone or email"
                        required
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white placeholder-slate-300"
                      />
                    </div>
                  </div>

                  {/* Password */}
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold text-slate-600">Password</label>
                      <button 
                        type="button" 
                        onClick={() => navigate('/staff/forgot-password')} 
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white placeholder-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: selectedRole.accent }}
                  >
                    {isSubmitting ? 'Signing in...' : `Sign in as ${selectedRole.label}`}
                  </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Admin?{' '}
          <a href="/admin/login" className="text-[#001b4e] font-semibold hover:underline">
            Go to Admin Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}
