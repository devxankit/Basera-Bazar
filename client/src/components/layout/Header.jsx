import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import LocationPicker from '../common/LocationPicker';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location, setLocation } = useLocationContext();

  useEffect(() => {
    const handleOpenSelector = () => setIsModalOpen(true);
    window.addEventListener('open-location-selector', handleOpenSelector);
    return () => window.removeEventListener('open-location-selector', handleOpenSelector);
  }, []);

  const handleLocationSelect = (loc) => {
    if (loc.isGPS) {
      setLocation(prev => ({
        ...prev,
        city: loc.name || (loc.isGPS ? 'Current Location' : prev.city),
        state: loc.state || prev.state,
        district: loc.district || prev.district,
        coords: loc.coordinates,
        formattedAddress: loc.name ? `${loc.name}, ${loc.state}` : 'Current GPS Location'
      }));
    } else {
      setLocation({
        city: loc.name,
        district: loc.district,
        state: loc.state,
        coords: null,
        formattedAddress: `${loc.name}, ${loc.state}`
      });
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative bg-white overflow-hidden font-sans min-h-[280px]">
        {/* Full Header Background Container */}
        <div className="absolute inset-0 z-0">
          {/* House Image - Shifted Right */}
          <div className="absolute top-0 right-0 bottom-0 w-[85%] pointer-events-none">
            <img 
              src="/basera-home-hero.jpeg" 
              alt="Hero House" 
              className="w-full h-full object-cover object-[70%_center] opacity-100"
            />
            {/* Smooth Mask/Fade from Left */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-[60%]" />
            {/* Fade from Top for status bar area */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent h-[20%]" />
          </div>
        </div>

        {/* Top Icons Bar (Overlay) */}
        <div className="relative z-20 px-5 pt-6 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-700 relative active:scale-95 transition-all">
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              className="w-10 h-10 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            >
              <User size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Hero Content (Overlay) */}
        <div className="relative z-20 mt-2 px-4 xs:px-5 flex flex-col justify-center min-h-[160px] xs:min-h-[180px]">
          <div className="max-w-[65%] xs:max-w-[55%]">
            <p className="text-[#181d5f] font-bold tracking-tight opacity-90" style={{ fontSize: 'clamp(10px, 3vw, 13px)' }}>Welcome to</p>
            <h1 className="font-black tracking-tighter leading-none mt-1 flex flex-wrap gap-x-2" style={{ fontSize: 'clamp(20px, 7.5vw, 34px)' }}>
              <span className="text-orange-500">Basera</span> 
              <span className="text-[#181d5f]">Bazar</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-tight" style={{ fontSize: 'clamp(8px, 2.5vw, 11px)' }}>Build better. Live better.</p>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 xs:mt-6 flex items-center gap-1.5 xs:gap-2 bg-white border border-slate-100 rounded-xl px-3 xs:px-4 py-2 xs:py-2.5 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.12)] active:scale-[0.98] transition-all w-fit"
            >
              <MapPin size={12} className="text-[#181d5f] shrink-0" strokeWidth={3} />
              <span className="font-black text-[#181d5f] truncate max-w-[120px] xs:max-w-none" style={{ fontSize: 'clamp(9px, 3vw, 12px)' }}>
                {location.city || location.district || 'Muzaffarpur, Bihar'}
              </span>
              <ChevronDown size={10} className="text-slate-400 shrink-0" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Location Bottom Sheet */}
      <div className={`fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className={`relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl transition-transform duration-500 transform ${isModalOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '75vh' }}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 opacity-50" />
          <LocationPicker 
            onClose={() => setIsModalOpen(false)} 
            onSelect={handleLocationSelect}
            initialLocation={location}
          />
        </div>
      </div>
    </>
  );
};

export default Header;
