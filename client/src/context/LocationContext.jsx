import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('basera_location_v2');
    return saved ? JSON.parse(saved) : {
      city: 'Muzaffarpur',
      district: 'Muzaffarpur',
      state: 'Bihar',
      coords: [85.3647, 26.1209], // [Lng, Lat]
      formattedAddress: 'Muzaffarpur, Bihar'
    };
  });

  useEffect(() => {
    localStorage.setItem('basera_location_v2', JSON.stringify(location));
  }, [location]);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
