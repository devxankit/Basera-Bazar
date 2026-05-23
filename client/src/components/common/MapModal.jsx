import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle2, Search, Loader2, MapPin } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import toast from '../../mockToast';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 28.7041, lng: 77.1025 }; // Delhi

// ── Singleton loader: script is injected once per page lifetime ──────────────
// Re-opening the modal never makes a second network request.
let _mapsPromise = null;
function loadGoogleMaps() {
  if (_mapsPromise) return _mapsPromise;
  _mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) { resolve(); return; }
    const s = document.createElement('script');
    s.id   = 'gm-api';
    s.src  = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload  = resolve;
    s.onerror = () => { _mapsPromise = null; reject(new Error('Maps load failed')); };
    document.head.appendChild(s);
  });
  return _mapsPromise;
}

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates }) {
  const mapDivRef    = useRef(null);
  const searchRef    = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const acRef        = useRef(null);   // Autocomplete instance

  const [position,  setPosition]  = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useScrollLock(isOpen);

  // ── Initialize map when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const center =
      initialCoordinates?.[0] && initialCoordinates?.[1]
        ? { lat: initialCoordinates[1], lng: initialCoordinates[0] }
        : DEFAULT_CENTER;

    setPosition(center);
    setIsLoading(true);

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;

        const G = window.google.maps;

        // ── Map ──────────────────────────────────────────────────────────────
        const map = new G.Map(mapDivRef.current, {
          center,
          zoom: 14,
          // Minimal controls — reduces visual clutter and doesn't cost extra
          mapTypeControl:    false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: G.ControlPosition.RIGHT_BOTTOM },
        });
        mapRef.current = map;

        // ── Draggable marker ─────────────────────────────────────────────────
        // Drag-end and click have zero API cost.
        const marker = new G.Marker({ position: center, map, draggable: true });
        markerRef.current = marker;

        const updatePos = (latLng) => {
          const p = { lat: latLng.lat(), lng: latLng.lng() };
          setPosition(p);
          marker.setPosition(p);
        };

        marker.addListener('dragend', () => updatePos(marker.getPosition()));
        map.addListener('click', (e) => updatePos(e.latLng));

        // ── Places Autocomplete (session-based — cheapest search option) ──────
        // Only charges per *session* (type → select), not per keystroke.
        // fields: geometry only — avoids the premium "Contact" and "Atmosphere" SKUs.
        if (searchRef.current) {
          const ac = new G.places.Autocomplete(searchRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['geometry'],          // minimal data → minimal billing
          });
          acRef.current = ac;

          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const newPos = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setPosition(newPos);
            map.panTo(newPos);
            map.setZoom(16);
            marker.setPosition(newPos);
          });
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load Google Maps. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      const G = window.google?.maps;
      if (G) {
        if (markerRef.current) {
          G.event.clearInstanceListeners(markerRef.current);
          markerRef.current.setMap(null);
          markerRef.current = null;
        }
        if (mapRef.current) {
          G.event.clearInstanceListeners(mapRef.current);
          mapRef.current = null;
        }
        if (acRef.current) {
          G.event.clearInstanceListeners(acRef.current);
          acRef.current = null;
        }
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ intentionally exclude initialCoordinates so re-opening doesn't re-init

  const handleConfirm = useCallback(() => {
    if (position) onConfirm([position.lng, position.lat]);
    onClose();
  }, [position, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div>
            <h2 className="text-[18px] font-black text-slate-800">Pin Location</h2>
            <p className="text-[12px] font-medium text-slate-500">
              Search, tap the map, or drag the pin to set the property location.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Map + search overlay */}
        <div className="relative w-full h-[350px] sm:h-[450px] bg-slate-100">

          {/* Places Autocomplete input — rendered above the map */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search area (e.g. Connaught Place, Delhi)"
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-medium shadow-xl outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-[13px] font-medium text-slate-500">Loading map…</p>
            </div>
          )}

          {/* Google Maps renders here */}
          <div ref={mapDivRef} className="w-full h-full" />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex-1 min-w-0 mr-4">
            {position ? (
              <p className="text-[11px] sm:text-[13px] font-mono text-slate-600 truncate">
                <span className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mr-2">
                  Selected:
                </span>
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin size={14} /> Tap the map to pin a location
              </p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={!position || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#001b4e] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-[#001b4e]/20 active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            Confirm <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
