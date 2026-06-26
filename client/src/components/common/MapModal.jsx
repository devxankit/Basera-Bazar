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
    if (window.google?.maps) { resolve(); return; }
    const s = document.createElement('script');
    s.id   = 'gm-api';
    s.src  = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload  = resolve;
    s.onerror = () => { _mapsPromise = null; reject(new Error('Maps load failed')); };
    document.head.appendChild(s);
  });
  return _mapsPromise;
}

// ── Forward geocode a free-text query → [{ display, lat, lng }] ──────────────
// Uses the Geocoding API (no Places-API dependency, which the legacy
// Autocomplete widget required) with an OpenStreetMap/Nominatim fallback so the
// search keeps working even if the Google key has no Geocoding quota.
async function searchPlaces(query, signal) {
  const q = query.trim();
  if (!q) return [];

  if (API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:IN&key=${API_KEY}`;
      const res = await fetch(url, { signal });
      const data = await res.json();
      if (data.status === 'OK' && data.results?.length) {
        return data.results.map((r) => ({
          display: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e; // let the caller ignore stale requests
      /* otherwise fall through to Nominatim */
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=in&limit=8`,
      { headers: { 'Accept-Language': 'en-US,en' }, signal }
    );
    const results = await res.json();
    return (results || []).map((item) => ({
      display: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

export default function MapModal({ isOpen, onClose, onConfirm, initialCoordinates }) {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);
  const markerRef = useRef(null);

  const [position,  setPosition]  = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Search state ──
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showResults, setShowResults] = useState(false);

  useScrollLock(isOpen);

  // ── Initialize map when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Reset search when the modal is dismissed so it opens clean next time.
      setQuery('');
      setResults([]);
      setShowResults(false);
      return;
    }

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
          mapTypeControl:    false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: G.ControlPosition.RIGHT_BOTTOM },
        });
        mapRef.current = map;

        // ── Draggable marker ─────────────────────────────────────────────────
        const marker = new G.Marker({ position: center, map, draggable: true });
        markerRef.current = marker;

        const updatePos = (latLng) => {
          const p = { lat: latLng.lat(), lng: latLng.lng() };
          setPosition(p);
          marker.setPosition(p);
        };

        marker.addListener('dragend', () => updatePos(marker.getPosition()));
        map.addListener('click', (e) => updatePos(e.latLng));

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
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ intentionally exclude initialCoordinates so re-opening doesn't re-init

  // ── Debounced search as the user types (like a Maps search box) ────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchPlaces(query, ctrl.signal);
        setResults(found);
        setShowResults(true);
      } catch {
        /* aborted — a newer query superseded this one */
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  // Recenter the map + marker on a chosen point.
  const moveTo = useCallback((lat, lng) => {
    const p = { lat, lng };
    setPosition(p);
    if (mapRef.current) {
      mapRef.current.panTo(p);
      mapRef.current.setZoom(16);
    }
    if (markerRef.current) markerRef.current.setPosition(p);
  }, []);

  const handleSelectResult = (r) => {
    setQuery(r.display);
    setResults([]);
    setShowResults(false);
    moveTo(r.lat, r.lng);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length) handleSelectResult(results[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

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

          {/* Search box — rendered above the map */}
          <div className="absolute top-4 left-4 right-4 z-30">
            <div className="relative">
              {searching
                ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                : <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => { if (results.length) setShowResults(true); }}
                placeholder="Search area (e.g. Connaught Place, Delhi)"
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-10 text-[14px] font-medium shadow-xl outline-none focus:border-blue-400 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X size={16} />
                </button>
              )}

              {/* Results dropdown */}
              {showResults && (results.length > 0 || (!searching && query.trim())) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectResult(r); }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-[13px] font-medium text-slate-700 leading-snug">{r.display}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[13px] font-medium text-slate-400">
                      No matching locations found.
                    </div>
                  )}
                </div>
              )}
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
