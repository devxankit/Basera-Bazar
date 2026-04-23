import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Search, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search for suggestions
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${searchQuery}&countrycodes=in&limit=5`);
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggestion fetch error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const defaultPos = initialCoordinates && initialCoordinates[1] && initialCoordinates[0] 
      ? { lat: initialCoordinates[1], lng: initialCoordinates[0] } 
      : { lat: 28.7041, lng: 77.1025 }; // Default to Delhi

    setPosition(defaultPos);

    // Initialize Map Function
    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = window.L;
      
      // Fix icon issues
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([defaultPos.lat, defaultPos.lng], 13);
      mapInstanceRef.current = map;

      // Add zoom control at bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([defaultPos.lat, defaultPos.lng]).addTo(map);
      markerInstanceRef.current = marker;

      map.on('click', (e) => {
        const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(newPos);
        marker.setLatLng([newPos.lat, newPos.lng]);
      });
      
      // Fix sizing issue when loaded in modal
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Load Leaflet dynamically
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initMap();
      };
      document.head.appendChild(script);
    } else {
      // Small timeout to ensure DOM is ready
      setTimeout(initMap, 0);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isOpen, initialCoordinates]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (position) {
      onConfirm([position.lng, position.lat]);
    }
    onClose();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery || !window.L || !mapInstanceRef.current) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${searchQuery}&countrycodes=in&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        setPosition(newPos);
        mapInstanceRef.current.setView([newPos.lat, newPos.lng], 16);
        
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([newPos.lat, newPos.lng]);
        } else {
          markerInstanceRef.current = window.L.marker([newPos.lat, newPos.lng]).addTo(mapInstanceRef.current);
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { lat, lon } = suggestion;
    const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
    
    setPosition(newPos);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([newPos.lat, newPos.lng], 16);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([newPos.lat, newPos.lng]);
      } else {
        markerInstanceRef.current = window.L.marker([newPos.lat, newPos.lng]).addTo(mapInstanceRef.current);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div>
            <h2 className="text-[18px] font-black text-slate-800">Pin Location</h2>
            <p className="text-[12px] font-medium text-slate-500">Tap anywhere on the map to place the pin.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>
        
        <div className="w-full h-[350px] sm:h-[450px] bg-slate-100 relative">
          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1001]">
             <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search area (e.g. Indiranagar, Bangalore)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-medium shadow-xl outline-none focus:border-blue-400 transition-all"
                  />
                  
                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1002]"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSuggestionClick(s)}
                            className="w-full text-left px-5 py-3.5 hover:bg-slate-50 text-[13px] font-medium text-slate-700 border-b border-slate-50 last:border-0 flex items-start gap-3 transition-colors"
                          >
                            <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
                            <span className="truncate">{s.display_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
             </form>
          </div>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex-1">
            {position ? (
              <p className="text-[11px] sm:text-[13px] font-mono text-slate-600">
                <span className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mr-2">Selected:</span>
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-[12px] text-slate-400 font-medium">Loading map...</p>
            )}
          </div>
          <button 
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#001b4e] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-[#001b4e]/20 active:scale-95 transition-all"
          >
            Confirm <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
