import React, { useState, useEffect } from 'react';
import logo from '../../assets/baseralogo.png';
import { ChevronDown, MapPin, User, Bell, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationModal from '../common/LocationModal';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentLocation, setCurrentLocation } = useLocationContext();

  useEffect(() => {
    const handleOpenSelector = () => setIsModalOpen(true);
    window.addEventListener('open-location-selector', handleOpenSelector);
    return () => window.removeEventListener('open-location-selector', handleOpenSelector);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-lg border-b border-slate-200/50 flex flex-col pt-4 overflow-hidden font-sans pb-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        {/* Top Section: Logo + Info + Actions */}
        <div className="px-5 flex items-center gap-4 mb-5">
          {/* Logo Card */}
          <div className="w-[72px] h-[72px] bg-white rounded-[24px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] flex items-center justify-center p-2 flex-shrink-0 overflow-hidden border border-white">
             <img src={logo} alt="BaseraBazar" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col flex-grow">
            {/* Welcome Text */}
            <h1 className="text-[20px] font-bold text-[#181d5f] tracking-tight leading-none mb-2 px-1">Welcome to Basera</h1>

            {/* Location Pill */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white/80 border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm hover:border-emerald-200 group w-fit"
            >
              <MapPin size={14} className="text-[#34a853] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              <span className="text-[12px] font-bold text-[#181d5f]">{currentLocation}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Profile Icon Action */}
          <button 
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            className="h-11 w-11 bg-white flex items-center justify-center rounded-2xl text-[#181d5f] transition-all active:scale-95 border border-slate-200 shadow-sm hover:shadow-md"
          >
            <User size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Bottom Section: Info Bar */}
        <div className="px-5">
          <div className="bg-[#1f2355]/5 border border-[#1f2355]/10 rounded-[14px] py-3 px-4 flex items-center gap-3 shadow-inner">
            <div className="bg-[#1f2355] p-1.5 rounded-lg">
              <Building2 size={13} className="text-white" />
            </div>
            <p className="text-[13px] font-semibold text-[#1f2355] opacity-90">
              Showing content in <span className="text-[#fa8639] font-bold">{currentLocation}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Location Modal (Full Indian States) */}
      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={(loc) => setCurrentLocation(loc)}
      />
    </>
  );
};

export default Header;
