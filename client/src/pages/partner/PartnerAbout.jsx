import { ArrowLeft, Info, Heart, Shield, Award, Users, MessageCircle, Phone, Globe, ShieldCheck, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PartnerAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-[#f8fafc] font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1.5 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-[#001b4e] uppercase tracking-widest">Company Info</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Branding */}
        <div className="text-center py-4">
           <div className="w-16 h-16 bg-[#001b4e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/10 border border-white/10">
              <Globe size={32} className="text-white" />
           </div>
           <h1 className="text-[24px] font-black text-[#001b4e] uppercase tracking-widest">Basera <span className="text-blue-600">Bazar</span></h1>
           <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Connecting Bihar</p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <Globe size={64} />
          </div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Info size={18} />
             </div>
             <h3 className="text-[14px] font-black text-[#001b4e] uppercase tracking-tight">Our Mission</h3>
          </div>
          <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
            Empowering local businesses and service providers across Bihar through a high-performance digital marketplace. We bridge the gap between demand and local expertise.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className="grid grid-cols-2 gap-3">
           <ValueCard icon={<ShieldCheck size={20} className="text-emerald-500" />} title="Verified" sub="Trust First" />
           <ValueCard icon={<Award size={20} className="text-amber-500" />} title="Quality" sub="Best Standard" />
           <ValueCard icon={<Users size={20} className="text-indigo-500" />} title="Local" sub="Community" />
           <ValueCard icon={<Heart size={20} className="text-rose-500" />} title="Passion" sub="Bihar Pride" />
        </div>

        {/* Contact Suite */}
        <div className="space-y-3">
           <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-1">Get in touch</h2>
           <div className="grid grid-cols-2 gap-3">
             <SupportCard 
               icon={<MessageCircle size={22} className="text-emerald-500" />} 
               label="WhatsApp" 
               sub="Chat Now"
               onClick={() => window.open('https://wa.me/918969321391', '_blank')}
             />
             <SupportCard 
               icon={<Phone size={22} className="text-blue-500" />} 
               label="Hotline" 
               sub="Call Now"
               onClick={() => window.open('tel:+918969321391', '_blank')}
             />
           </div>
        </div>

        {/* Footer Info */}
        <div className="pt-8 border-t border-slate-100 text-center space-y-4">
          <p className="text-slate-200 text-[10px] font-black leading-relaxed italic uppercase tracking-widest">
            "Building a better foundation for every home in Bihar."
          </p>
          <div className="flex flex-col items-center gap-1">
             <p className="text-[10px] text-slate-300 font-black tracking-widest uppercase">Version 2.0.4 • Professional Grade</p>
             <p className="text-[9px] text-slate-200 font-bold tracking-widest uppercase">© 2025 Basera Bazar • Made in Bihar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, sub }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-50 shadow-sm text-center flex flex-col items-center">
       <div className="mb-2">{icon}</div>
       <div className="text-[#001b4e] text-[12px] font-black uppercase tracking-tight leading-none">{title}</div>
       <div className="text-slate-200 text-[9px] font-bold mt-1 uppercase tracking-widest">{sub}</div>
    </div>
  );
}

function SupportCard({ icon, label, sub, onClick }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl border border-slate-50 flex flex-col gap-3 text-left transition-all bg-white shadow-sm"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-[#001b4e] text-[13px] font-black uppercase tracking-tight leading-none">{label}</div>
        <div className="text-slate-300 text-[9px] font-black mt-1.5 uppercase tracking-widest opacity-60">{sub}</div>
      </div>
    </motion.button>
  );
}
