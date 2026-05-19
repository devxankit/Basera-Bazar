import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

// Location is kept in memory only. A hard refresh (or new tab) always
// re-triggers the mandatory location modal — by design.
// SPA route changes preserve it because state survives in-app navigation.
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);

  // Clear any legacy value from earlier builds so it doesn't leak in
  useEffect(() => {
    try { localStorage.removeItem('basera_location_v2'); } catch { /* ignore */ }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
