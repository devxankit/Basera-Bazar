import React from 'react';
import {
  ArrowLeft, Shield, Lock, Eye, UserCheck,
  Mail, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const ICONS = [Eye, Shield, Lock, UserCheck];
const ICON_COLORS = ['text-blue-500', 'text-emerald-500', 'text-orange-500', 'text-purple-500'];
const ICON_BGS = ['bg-blue-50', 'bg-emerald-50', 'bg-orange-50', 'bg-purple-50'];

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect your name, phone number, email address, business details, location, and uploaded documents (ID proof, business license) when you register as a partner. We also collect usage data and listing analytics.',
  },
  {
    title: '2. How We Use Your Data',
    content:
      'Your data is used to verify your identity, manage your listings, process inquiries and orders, provide analytics, and improve the platform experience for you and your customers.',
  },
  {
    title: '3. Data Sharing',
    content:
      'We do not sell your personal or business data. Your business information and contact details are shown to users only on your public listings and when they make an enquiry or order.',
  },
  {
    title: '4. Your Rights',
    content:
      'You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com. You can also deactivate your account from your profile settings.',
  },
];

export default function PartnerPrivacyPolicy() {
  const navigate = useNavigate();

  const { data: rawData } = useQuery({
    queryKey: ['privacyPartner'],
    queryFn: () => api.get('/admin/system/page-content?key=CONTENT_PRIVACY_PARTNER').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const content = rawData?.data || {};
  const lastUpdated = content.last_updated || 'January 2025';
  const intro = content.intro || 'Basera Bazar values your privacy. This policy explains what data we collect from partners and how we use it.';
  const sections = content.sections || SECTIONS;

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 bg-[#f8fafc] font-sans pb-20" style={{ overflowX: 'clip' }}>
      {/* Immersive Hero */}
      <div className="relative bg-[#001b4e] overflow-hidden rounded-b-3xl shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-xl border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="mt-4 mb-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-[22px] font-black leading-tight uppercase tracking-widest"
            >
              Privacy <span className="text-blue-400 underline decoration-blue-500/30">Policy</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-[9px] mt-2 font-black uppercase tracking-[0.25em]"
            >
              How We Protect Your Data
            </motion.p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {/* Intro */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-1">Overview</h2>
          <div className="bg-white rounded-xl p-4 border border-slate-50 shadow-sm">
            <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
              {intro}
            </p>
            <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-1">Policy Details</h2>
          {sections.map((section, idx) => {
            const Icon = ICONS[idx % ICONS.length] || Shield;
            const iconBg = ICON_BGS[idx % ICON_BGS.length] || 'bg-blue-50';
            const iconColor = ICON_COLORS[idx % ICON_COLORS.length] || 'text-blue-500';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-xl border border-slate-50 shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#001b4e] uppercase tracking-tight mb-1.5">{section.title}</h3>
                    <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">{section.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#001b4e] rounded-xl p-5 relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-900/10"
          onClick={() => window.open('mailto:support@baserabazar.com')}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-[14px] font-black uppercase tracking-widest">Questions?</h3>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">support@baserabazar.com</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-white/20" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
