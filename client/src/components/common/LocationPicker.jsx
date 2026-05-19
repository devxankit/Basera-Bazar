import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, ChevronRight, X, Loader2 } from 'lucide-react';

const MAJOR_CITIES = [
  { name: 'Muzaffarpur', state: 'Bihar', district: 'Muzaffarpur', coordinates: [85.3647, 26.1209] },
  { name: 'Patna', state: 'Bihar', district: 'Patna', coordinates: [85.1376, 25.5941] },
  { name: 'Gaya', state: 'Bihar', district: 'Gaya', coordinates: [84.9917, 24.7906] },
  { name: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Jodhpur', state: 'Rajasthan', district: 'Jodhpur', coordinates: [73.0243, 26.2389] },
  { name: 'New Delhi', state: 'Delhi', district: 'New Delhi', coordinates: [77.2090, 28.6139] },
  { name: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru', coordinates: [77.5946, 12.9716] },
];

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function parseGoogleComponents(components) {
  const get = (type) =>
    (components || []).find(c => c.types.includes(type))?.long_name || '';
  return {
    city:
      get('locality') ||
      get('sublocality_level_1') ||
      get('administrative_area_level_3') ||
      '',
    district: get('administrative_area_level_2') || '',
    state: get('administrative_area_level_1') || '',
  };
}

function parseNominatimAddress(addr) {
  return {
    city: addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '',
    district: addr.county || addr.state_district || '',
    state: addr.state || '',
  };
}

// Reverse geocode lat/lng → { city, district, state }
async function reverseGeocode(lat, lng) {
  // 1) Try Google Maps first (richer India coverage when key is configured)
  if (GMAPS_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return parseGoogleComponents(data.results[0].address_components);
      }
    } catch { /* fall through to Nominatim */ }
  }

  // 2) Nominatim fallback (no API key, free)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    );
    const data = await res.json();
    return parseNominatimAddress(data.address || {});
  } catch {
    return { city: '', district: '', state: '' };
  }
}

// Forward geocode search query → array of locations
async function forwardGeocode(query) {
  if (GMAPS_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:IN&key=${GMAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results.map(item => {
          const { city, district, state } = parseGoogleComponents(item.address_components);
          return {
            name: city || item.formatted_address.split(',')[0].trim(),
            district,
            state,
            coordinates: [item.geometry.location.lng, item.geometry.location.lat],
            display: item.formatted_address,
          };
        }).filter(r => r.state);
      }
    } catch { /* fall through to Nominatim */ }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=8`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    );
    const results = await res.json();
    return results.map(item => {
      const { city, district, state } = parseNominatimAddress(item.address || {});
      return {
        name: city || item.display_name.split(',')[0].trim(),
        district,
        state,
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        display: item.display_name,
      };
    }).filter(r => r.state);
  } catch {
    return [];
  }
}

export default function LocationPicker({ onSelect, onClose, initialLocation = null, isMandatory = false }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const mapped = await forwardGeocode(searchQuery);
        setSearchResults(mapped);
      } catch (err) {
        console.error('Location search error:', err);
        setError('Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const { city, district, state } = await reverseGeocode(latitude, longitude);
          onSelect({
            coordinates: [longitude, latitude],
            name: city || null,
            state,
            district,
            isGPS: true,
          });
        } catch {
          onSelect({ coordinates: [longitude, latitude], isGPS: true });
        } finally {
          setLoading(false);
        }
      },
      err => {
        const messages = {
          1: 'Location permission denied. Please allow access in browser settings.',
          2: 'Could not detect location. Check your device GPS or pick a city below.',
          3: 'Location request timed out. Please try again or pick a city below.',
        };
        setError(messages[err.code] || 'Failed to detect location. Pick a city below.');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 0 }
    );
  };

  const handleCitySelect = city => {
    onSelect({
      name: city.name,
      district: city.district,
      state: city.state,
      coordinates: city.coordinates || null,
      isManual: true,
    });
  };

  const popularCities = MAJOR_CITIES.filter(
    city =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-t-[32px] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-4 pb-4 border-b border-slate-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[22px] font-bold text-[#001b4e]">Select Location</h2>
          {!isMandatory && onClose && (
            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search city or area..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-[#001b4e] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#001b4e]/5 transition-all"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-6 py-6 space-y-8">
        {/* GPS Button */}
        <button
          onClick={handleDetectLocation}
          disabled={loading}
          className="w-full bg-[#001b4e] p-6 rounded-2xl flex items-center gap-4 text-white shadow-xl shadow-blue-900/10 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Navigation size={22} className="rotate-45" />}
          </div>
          <div className="text-left">
            <div className="text-[16px] font-bold">Use Current Location</div>
            <div className="text-[12px] text-white/60">Using GPS for better precision</div>
          </div>
          <ChevronRight size={20} className="ml-auto text-white/40" />
        </button>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-[13px] font-medium">
            {error}
          </div>
        )}

        {/* Popular Cities / Search Results */}
        <div>
          <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
            {searchQuery.length >= 3 ? 'Search Results' : 'Popular Cities'}
          </h3>
          <div className="grid grid-cols-1 gap-3 pb-8">
            {isSearching ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3 text-[#001b4e]" />
                <p className="text-[13px] font-bold tracking-wide uppercase">Searching across India...</p>
              </div>
            ) : (
              (searchQuery.length >= 3 ? searchResults : popularCities).map((city, idx) => (
                <button
                  key={city.name + idx}
                  onClick={() => handleCitySelect(city)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-[#001b4e]/20 hover:bg-slate-50/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#001b4e] truncate">{city.name}</div>
                    <div className="text-[12px] text-slate-400 truncate">
                      {city.district ? `${city.district}, ` : ''}{city.state}
                    </div>
                  </div>
                  {initialLocation?.city === city.name && (
                    <div className="ml-auto bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))
            )}

            {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="text-slate-400 mb-2">
                  <Search size={32} className="mx-auto opacity-20" />
                </div>
                <p className="text-[14px] font-bold text-[#001b4e]">No cities found</p>
                <p className="text-[12px] text-slate-400 mt-1">Try a more general search term</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50">
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Accurate location helps us show you the best services and products available in your area.
        </p>
      </div>
    </div>
  );
}
