import React, { useState } from 'react';
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

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm flex flex-col pt-4 overflow-hidden font-sans pb-4">
        {/* Top Section: Logo + Info + Actions */}
        <div className="px-5 flex items-center gap-4 mb-5">
          {/* Logo Card */}
          <div className="w-[72px] h-[72px] bg-white rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] flex items-center justify-center p-2 flex-shrink-0 overflow-hidden border border-slate-50">
             <img src={logo} alt="BaseraBazar" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col justify-center items-center flex-grow">
            {/* Welcome Text */}
            <h1 className="text-[22px] font-semibold text-[#181d5f] tracking-tight leading-none mb-2">Welcome to Basera</h1>

            {/* Location Pill */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#edf9f0] border border-[#d1e8d6] rounded-full px-3 py-1.5 flex items-center gap-2 active:scale-95 transition-transform"
            >
              <MapPin size={16} className="text-[#34a853]" strokeWidth={2} />
              <span className="text-[13px] font-medium text-[#181d5f]">{currentLocation}</span>
              <ChevronDown size={14} className="text-[#181d5f]" />
            </button>
          </div>

          {/* Profile Icon Action */}
          <button 
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
            className="h-10 w-10 bg-[#e8eaf6] flex items-center justify-center rounded-full text-[#181d5f] transition-all active:scale-95 border border-[#d0d4eb] flex-shrink-0"
          >
            <User size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bottom Section: Info Bar */}
        <div className="px-5">
          <div className="bg-[#eaf4fe] border border-[#d0e5f9] rounded-[14px] py-2.5 px-4 flex items-center gap-3">
            <Building2 size={16} className="text-[#2081e2]" />
            <p className="text-[13px] text-[#2081e2]">
              Showing content in {currentLocation}
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
