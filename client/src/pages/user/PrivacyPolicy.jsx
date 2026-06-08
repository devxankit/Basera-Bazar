import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const ICONS = [Eye, Shield, Lock, UserCheck];
const ICON_BGS = ['bg-blue-50', 'bg-emerald-50', 'bg-orange-50', 'bg-purple-50'];
const ICON_COLORS = ['text-blue-600', 'text-emerald-600', 'text-orange-600', 'text-purple-600'];

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect your name, phone number, email address, and location when you register or use our services. We also collect usage data to improve the platform.',
  },
  {
    title: '2. How We Use Your Data',
    content:
      'Your data is used to provide and improve our services, send relevant notifications, and connect you with the right businesses in your area.',
  },
  {
    title: '3. Data Sharing',
    content:
      'We do not sell your personal data. Your contact details are shared with partners only when you make an enquiry or place an order.',
  },
  {
    title: '4. Your Rights',
    content:
      'You can request access to, correction of, or deletion of your personal data by contacting us at support@baserabazar.com.',
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const { data: rawData } = useQuery({
    queryKey: ['privacyCustomer'],
    queryFn: () => api.get('/admin/system/page-content?key=CONTENT_PRIVACY_CUSTOMER').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const content = rawData?.data || {};
  const lastUpdated = content.last_updated || 'January 2025';
  const intro = content.intro || 'Basera Bazar values your privacy. This policy explains what data we collect and how we use it to provide you the best experience.';
  const sections = content.sections || SECTIONS;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 sticky top-0 z-50 border-b border-slate-100 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Privacy Policy</h2>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Intro */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#001b4e]">Basera Bazar Privacy Policy</h3>
              <p className="text-[11px] text-slate-400 font-medium">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            {intro}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Policy Details</h3>
          {sections.map((section, idx) => {
            const Icon = ICONS[idx % ICONS.length] || Shield;
            const iconBg = ICON_BGS[idx % ICON_BGS.length] || 'bg-blue-50';
            const iconColor = ICON_COLORS[idx % ICON_COLORS.length] || 'text-blue-600';
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#001b4e] mb-1.5">{section.title}</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Mail size={18} className="text-orange-500 shrink-0" />
          <p className="text-[12px] text-orange-700 font-medium leading-snug">
            For questions or concerns, contact us at <strong>support@baserabazar.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
