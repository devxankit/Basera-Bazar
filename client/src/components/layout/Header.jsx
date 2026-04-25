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
      <div className="relative bg-white pt-6 pb-4 overflow-hidden font-sans">
        {/* Top Icons Bar */}
        <div className="px-5 flex items-center justify-between relative z-20">
          <button className="w-11 h-11 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.08)] flex items-center justify-center text-slate-700 active:scale-95 transition-all">
            <Menu size={22} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.08)] flex items-center justify-center text-slate-700 relative active:scale-95 transition-all">
              <Bell size={22} strokeWidth={2.5} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
            </button>
            <button 
              onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
              className="w-11 h-11 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.08)] flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            >
              <User size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Hero Section Container */}
        <div className="relative mt-4 px-5 flex items-center min-h-[200px]">
          {/* Left Text Content */}
          <div className="relative z-10 w-[65%] pt-2">
            <p className="text-[#181d5f] text-base font-bold tracking-tight">Welcome to</p>
            <h1 className="text-[36px] font-black tracking-tighter leading-[1.05] mt-1">
              <span className="text-orange-500">Basera</span> <br />
              <span className="text-[#181d5f]">Bazar</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black mt-2 tracking-[0.15em] uppercase">Build better. Live better.</p>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-2 bg-white border border-slate-50 rounded-xl px-4 py-2.5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all"
            >
              <MapPin size={16} className="text-[#181d5f]" strokeWidth={3} />
              <span className="text-[13px] font-black text-[#181d5f]">
                {location.city || location.district || 'Muzaffarpur, Bihar'}
              </span>
              <ChevronDown size={14} className="text-slate-400" strokeWidth={3} />
            </button>
          </div>

          {/* Right House Image */}
          <div className="absolute top-0 right-0 bottom-0 w-[55%] pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
              alt="Hero House" 
              className="w-full h-full object-contain object-right transform scale-125 translate-x-4"
            />
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
