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
      <header className="sticky top-0 z-50 bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-lg border-b border-slate-200/50 flex flex-col pt-6 pb-6 overflow-hidden font-sans shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        {/* Integrated Top Bar */}
        <div className="px-5 flex items-center justify-between gap-2">
          {/* Logo Card */}
          <div className="w-[52px] h-[52px] bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
             <img src={logo} alt="BaseraBazar" className="w-full h-full object-contain" />
          </div>

          {/* Center Identity Section */}
          <div className="flex-grow flex flex-col items-center justify-center min-w-0 px-1">
            <h1 className="text-[clamp(18px,5.2vw,24px)] font-extrabold text-[#181d5f] tracking-tighter leading-none whitespace-nowrap overflow-hidden text-ellipsis mb-2">
              Welcome to Basera
            </h1>

            {/* Compact Location Pill nested under Title */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-50/50 border border-emerald-100/50 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all w-fit max-w-full"
            >
              <MapPin size={12} className="text-[#34a853] shrink-0" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-[#181d5f] truncate whitespace-nowrap">{currentLocation}</span>
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Profile Action */}
          <button 
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            className="h-[52px] w-[52px] bg-white flex items-center justify-center rounded-2xl text-[#181d5f] transition-all active:scale-95 border border-slate-200 shadow-sm flex-shrink-0"
          >
            <User size={24} strokeWidth={2} />
          </button>
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
