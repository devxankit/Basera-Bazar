import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset expanded state when modal opens
      setIsExpanded(false);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

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

  // Pull behavior logic
  const handleDragEnd = (_, info) => {
    // If user pulls UP more than 50px, expand to 90%
    if (info.offset.y < -50) {
      setIsExpanded(true);
    } 
    // If user pulls DOWN more than 50px and is expanded, collapse to 60%
    else if (info.offset.y > 50 && isExpanded) {
      setIsExpanded(false);
    }
    // If user pulls DOWN more than 100px while collapsed, close modal
    else if (info.offset.y > 100 && !isExpanded) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div 
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={{ translateY: "100%" }}
            animate={{ 
              translateY: 0,
              height: isExpanded ? "90vh" : "60vh"
            }}
            exit={{ translateY: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white rounded-t-[40px] shadow-2xl p-5 pb-6 overflow-hidden flex flex-col"
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 opacity-50 cursor-grab active:cursor-grabbing" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-primary-900 tracking-tight">Select Location</h2>
              <button 
                onClick={onClose} 
                className="p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-primary-600 border border-slate-100 transition-colors active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
               <div className="space-y-4 pb-4">
                 {/* Current Location Card */}
                 <motion.div 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.05 }}
                   className="p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-100/50 flex items-center gap-3 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform"
                   onClick={handleAutoDetect}
                 >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <MapPin size={48} className="text-emerald-500" />
                    </div>
                    <div className="p-2.5 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-50">
                       <Navigation size={20} className="animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-[9px] font-semibold text-emerald-600/60 uppercase tracking-widest leading-none">Current Location</span>
                       </div>
                       <p className="text-base font-semibold text-emerald-900 leading-tight tracking-tight mt-0.5">Muzaffarpur, Bihar</p>
                    </div>
                 </motion.div>

                 {/* Auto Detect Button */}
                 <motion.button 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   onClick={handleAutoDetect}
                   disabled={isDetecting}
                   className="w-full bg-[#1e293b] hover:bg-slate-900 text-white p-4 rounded-[20px] font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-slate-200"
                 >
                   {isDetecting ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <Navigation size={16} />
                   )}
                   <span className="uppercase tracking-widest text-[10px] font-semibold">{isDetecting ? 'Detecting...' : 'Auto-Detect Location'}</span>
                 </motion.button>

                 {/* Manual Selection */}
                 <motion.div 
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.15 }}
                   className="space-y-3 pt-3 border-t border-slate-50"
                 >
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Or choose manually:</p>
                    
                    <div className="space-y-3">
                       <div className="relative group">
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 appearance-none font-semibold text-slate-700 outline-none focus:border-primary-500 focus:bg-white transition-all text-sm group-hover:border-slate-200"
                            value={selectedState}
                            onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                          >
                            <option value="">Select State</option>
                            {Object.keys(statesData).sort().map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                       </div>

                       <div className="relative group">
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 appearance-none font-semibold text-slate-700 outline-none focus:border-primary-500 focus:bg-white transition-all text-sm disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed group-hover:border-slate-200"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedState}
                          >
                            <option value="">{selectedState ? 'Select City' : 'Select state first'}</option>
                            {selectedState && statesData[selectedState].map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                       </div>
                    </div>
                 </motion.div>
               </div>
            </div>

            {/* Confirm Button */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 pt-4 border-t border-slate-50"
            >
              <button 
                disabled={!selectedCity}
                onClick={handleConfirm}
                className={cn(
                  "w-full p-4 rounded-[20px] font-semibold uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] shadow-xl",
                  selectedCity ? "bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                Confirm Location
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LocationModal;
