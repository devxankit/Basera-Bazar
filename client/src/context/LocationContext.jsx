import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(() => {
    return localStorage.getItem('basera_location') || 'Muzaffarpur, Bihar';
  });

  useEffect(() => {
    localStorage.setItem('basera_location', currentLocation);
  }, [currentLocation]);

  return (
    <LocationContext.Provider value={{ currentLocation, setCurrentLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
