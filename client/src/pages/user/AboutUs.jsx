import React from 'react';
import { ArrowLeft, Globe, Heart, Shield, Award, Users, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const STATS = [
  { value: '10,000+', label: 'Listings' },
  { value: '500+', label: 'Partners' },
  { value: '20+', label: 'Districts' },
  { value: '4.8★', label: 'Rating' },
];

const VALUES = [
  { icon: Shield, color: 'bg-blue-50 text-blue-600', title: 'Verified & Trusted', desc: 'Every partner is reviewed and verified before going live on our platform.' },
  { icon: Heart, color: 'bg-red-50 text-red-500', title: 'Local First', desc: 'We connect you with the best businesses in your own district and city.' },
  { icon: Award, color: 'bg-orange-50 text-orange-500', title: 'Quality Assured', desc: 'Listings are regularly audited to ensure accuracy and quality standards.' },
  { icon: Users, color: 'bg-emerald-50 text-emerald-600', title: 'Community Driven', desc: 'Built with feedback from real users and partners across Bihar.' },
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 sticky top-0 z-50 border-b border-slate-100 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">About Us</h2>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Branding hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#001b4e] rounded-3xl px-6 py-8 text-center space-y-3"
        >
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
            <Globe size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-white uppercase tracking-widest">
              बसेरा <span className="text-orange-400">Bazar</span>
            </h1>
            <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Building better, together</p>
          </div>
          <p className="text-white/70 text-[13px] leading-relaxed font-medium">
            Bihar's fastest growing marketplace for properties, services, and construction materials.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-slate-100 shadow-sm">
              <p className="text-[16px] font-black text-[#001b4e]">{s.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-2">
          <h3 className="text-[14px] font-black text-[#001b4e] uppercase tracking-wider">Our Mission</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Basera Bazar was built to solve a real problem — finding reliable property agents, skilled service providers,
            and quality building materials in Bihar was scattered, unorganized, and full of friction.
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            We bring everything together in one trusted platform, so builders, homeowners, and businesses can
            find exactly what they need, locally and quickly.
          </p>
        </div>

        {/* Values */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Our Values</h3>
          {VALUES.map(v => (
            <div key={v.title} className="bg-white rounded-2xl px-4 py-4 border border-slate-100 shadow-sm flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.color}`}>
                <v.icon size={20} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#001b4e]">{v.title}</p>
                <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Get in Touch</h3>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <a href="mailto:hello@baserabazar.com" className="flex items-center gap-3 text-[13px] text-[#001b4e] font-medium">
              <Mail size={16} className="text-orange-400" /> hello@baserabazar.com
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-3 text-[13px] text-[#001b4e] font-medium">
              <Phone size={16} className="text-emerald-500" /> +91 98765 43210
            </a>
            <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
              <MapPin size={16} className="text-blue-400 shrink-0" /> Muzaffarpur, Bihar, India
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest pb-2">
          © {new Date().getFullYear()} Basera Bazar · All rights reserved
        </p>
      </div>
    </div>
  );
}
