import React from 'react';
import { ArrowLeft, Info, Heart, Shield, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/baseralogo.png';

export default function PartnerAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl shadow-slate-200 overflow-x-hidden bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50">
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-[17px] font-bold text-[#001b4e] uppercase tracking-tight">Support</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 pt-6 space-y-6 text-center">
        {/* Logo & App Info */}
        <div className="space-y-2 xs:space-y-3">
          <div className="mt-4 xs:mt-6 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#001b4e] text-[24px] xs:text-[26px] font-bold leading-tight uppercase tracking-tight"
            >
              How can we <br /> <span className="text-blue-600 underline decoration-blue-500/30">help</span> you?
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-[10px] xs:text-[11px] mt-2 xs:mt-3 font-medium uppercase tracking-widest leading-none opacity-60"
            >
              Search for topics or browse below
            </motion.p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-2xl xs:rounded-[24px] p-5 xs:p-6 shadow-sm border border-slate-100 space-y-3">
          <div className="w-10 h-10 xs:w-11 xs:h-11 bg-blue-50 rounded-xl flex items-center justify-center mx-auto text-blue-600">
            <Info size={20} />
          </div>
          <h3 className="text-[15px] xs:text-[16px] font-bold text-[#001b4e] uppercase tracking-tight leading-none opacity-70">Connecting Bihar</h3>
          <p className="text-[12px] xs:text-[13px] text-slate-500 leading-snug font-medium opacity-80">
            Basera Bazar is a hyper-local platform dedicated to Bihar's property and home service ecosystem.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-2 gap-3 xs:gap-4">
          <SupportCard 
            icon={<MessageCircle size={20} className="text-green-500" />} 
            label="WhatsApp" 
            sub="Chat with us"
            onClick={() => window.open('https://wa.me/918969321391', '_blank')}
          />
          <SupportCard 
            icon={<Phone size={20} className="text-blue-500" />} 
            label="Hotline" 
            sub="Direct call"
            onClick={() => window.open('tel:+918969321391', '_blank')}
          />
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-slate-400 text-[12px] font-medium leading-relaxed italic">
            "Building a better foundation for every home in Bihar."
          </p>
          <p className="text-[10px] text-slate-300 mt-6 font-medium tracking-tight uppercase">© 2025 Basera Bazar • Made in Bihar</p>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ icon, label, sub, onClick }) {
  return (
    <motion.button 
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-2xl xs:rounded-[24px] border flex flex-col gap-2 text-left transition-all bg-white border-slate-100 shadow-sm`}
    >
      <div className={`w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[#001b4e] text-[12px] xs:text-[13px] font-bold uppercase tracking-tight leading-none">{label}</div>
        <div className="text-slate-400 text-[9px] xs:text-[10px] font-medium mt-1.5 uppercase tracking-widest opacity-60 leading-none">{sub}</div>
      </div>
    </motion.button>
  );
}
