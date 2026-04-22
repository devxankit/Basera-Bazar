import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  
  const [position, setPosition] = useState(null);

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

      const map = L.map(mapContainerRef.current).setView([defaultPos.lat, defaultPos.lng], 13);
      mapInstanceRef.current = map;

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
