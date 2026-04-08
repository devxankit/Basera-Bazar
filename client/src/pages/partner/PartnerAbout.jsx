import React from 'react';
import { ArrowLeft, Info, Heart, Shield, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/baseralogo.png';

export default function PartnerAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate('/partner/profile')}
          className="p-1 text-[#001b4e] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-medium text-[#001b4e]">About Basera Bazar</h2>
        <div className="w-8" />
      </div>

      <div className="px-5 pt-8 space-y-10 text-center">
        {/* Logo & App Info */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-white rounded-[32px] mx-auto shadow-2xl shadow-blue-900/10 flex items-center justify-center p-4 border border-slate-50 overflow-hidden">
            <img src={logo} alt="BaseraBazar" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-[#181d5f]">Basera Bazar</h1>
            <p className="text-slate-400 text-[14px] font-medium tracking-wide">Version 1.0.0 (Beta)</p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 space-y-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <Info size={24} />
          </div>
          <h3 className="text-[19px] font-bold text-[#001b4e]">Connecting Bihar</h3>
          <p className="text-[15px] text-slate-500 leading-relaxed font-normal">
            Basera Bazar is a hyper-local platform dedicated to streamlining the property, home service, and material supply ecosystem in Bihar. We empower local partners to grow their business while providing users with verified high-quality services.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-2 gap-4">
          <ValueCard icon={<Shield className="text-emerald-500" size={24} />} title="Trust" desc="Verified Partners" />
          <ValueCard icon={<Award className="text-orange-500" size={24} />} title="Quality" desc="Premium Services" />
          <ValueCard icon={<Users className="text-blue-500" size={24} />} title="Community" desc="Local Support" />
          <ValueCard icon={<Heart className="text-red-500" size={24} />} title="Passion" desc="Bihar's Growth" />
        </div>

        {/* Footer Info */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-slate-400 text-[13px] font-medium leading-relaxed italic">
            "Building a better foundation for every home in Bihar."
          </p>
          <div className="mt-8 space-y-2">
            <button className="text-[13px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Terms of Service</button>
            <div className="h-1 w-1 bg-slate-300 rounded-full mx-auto" />
            <button className="text-[13px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Privacy Policy</button>
          </div>
          <p className="text-[12px] text-slate-300 mt-10 font-bold tracking-tight uppercase">© 2025 Basera Bazar • Proudly Made in Bihar</p>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-5 rounded-[32px] border border-slate-50 shadow-sm flex flex-col items-center gap-2">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-1">
        {icon}
      </div>
      <h4 className="text-[15px] font-bold text-[#001b4e]">{title}</h4>
      <p className="text-[11px] text-slate-400 font-medium leading-tight">{desc}</p>
    </div>
  );
}
