import React, { createContext, useContext, useState, useCallback } from 'react';
import { saveLocationToCookie, loadLocationFromCookie } from '../utils/locationStorage';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(() => {
    try { localStorage.removeItem('basera_location_v2'); } catch { /* ignore */ }
    return loadLocationFromCookie();
  });

  const setLocation = useCallback((loc) => {
    saveLocationToCookie(loc);
    setLocationState(loc);
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
