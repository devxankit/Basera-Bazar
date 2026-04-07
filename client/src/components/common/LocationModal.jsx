import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Major cities for all Indian states
const statesData = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bangalore", "Hubli", "Mysore", "Gulbarga", "Belgaum"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry"]
};

const LocationModal = ({ isOpen, onClose, onSelect }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      document.body.style.overflow = 'auto';
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const handleAutoDetect = () => {
    setIsDetecting(true);
    setTimeout(() => {
      setIsDetecting(false);
      onSelect('Muzaffarpur, Bihar');
      onClose();
    }, 1500);
  };

  const handleConfirm = () => {
    if (selectedCity && selectedState) {
      onSelect(`${selectedCity}, ${selectedState}`);
      onClose();
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-end justify-center transition-all duration-300",
      isOpen ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"
    )}>
      {/* Backdrop for closing */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className={cn(
        "relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl transition-transform duration-500 ease-out p-6 pb-10 transform",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-semibold text-primary-900 tracking-tight">Select Location</h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-primary-600 border border-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Location Card (Ref #4 style) */}
          <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-100/50 flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <MapPin size={64} className="text-emerald-500" />
             </div>
             <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-50">
                <div className="relative">
                   <Navigation size={24} className="animate-pulse" />
                   <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20" />
                </div>
             </div>
             <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-semibold text-emerald-600/60 uppercase tracking-widest leading-none">Current Location</span>
                </div>
                <p className="text-lg font-semibold text-emerald-900 leading-tight tracking-tight mt-1">Muzaffarpur, Bihar</p>
             </div>
          </div>

          {/* Auto Detect Button */}
          <button 
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="w-full bg-[#1e293b] hover:bg-slate-900 text-white p-5 rounded-[24px] font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 shadow-xl shadow-slate-200"
          >
            {isDetecting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Navigation size={18} className="translate-y-[1px]" />
            )}
            <span className="uppercase tracking-widest text-[11px]">{isDetecting ? 'Detecting Location...' : 'Auto-Detect Location'}</span>
          </button>

          {/* Manual Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
             <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Or choose manually:</p>
             
             <div className="space-y-4">
                <div className="relative group">
                   <select 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none font-bold text-slate-700 outline-none focus:border-primary-500 focus:bg-white transition-all text-sm group-hover:border-slate-200"
                     value={selectedState}
                     onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                   >
                     <option value="">Select State</option>
                     {Object.keys(statesData).sort().map(state => (
                       <option key={state} value={state}>{state}</option>
                     ))}
                   </select>
                   <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>

                <div className="relative group">
                   <select 
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 appearance-none font-semibold text-slate-700 outline-none focus:border-primary-500 focus:bg-white transition-all text-sm disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed group-hover:border-slate-200"
                     value={selectedCity}
                     onChange={(e) => setSelectedCity(e.target.value)}
                     disabled={!selectedState}
                   >
                     <option value="">{selectedState ? 'Select City' : 'Select state first'}</option>
                     {selectedState && statesData[selectedState].map(city => (
                       <option key={city} value={city}>{city}</option>
                     ))}
                   </select>
                   <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
             </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="mt-10">
          <button 
            disabled={!selectedCity}
            onClick={handleConfirm}
            className={cn(
              "w-full p-5 rounded-[24px] font-semibold uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] shadow-2xl",
              selectedCity ? "bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
