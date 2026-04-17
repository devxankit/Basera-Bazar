/**
 * Common City Coordinates for Manual Entry Fallback
 * [Longitude, Latitude]
 */
const CITY_COORDINATES = {
  // Bihar
  'muzaffarpur': [85.3647, 26.1209],
  'patna': [85.1376, 25.5941],
  'gaya': [85.0002, 24.7914],
  'darbhanga': [85.8954, 26.1158],
  'bhagalpur': [87.0133, 25.2425],
  'hajipur': [85.2066, 25.6835],

  // Rajasthan
  'jaipur': [75.7873, 26.9124],
  'jodhpur': [73.0243, 26.2389],
  'udaipur': [73.7125, 24.5854],
  'kota': [75.8335, 25.2138],

  // Others
  'new delhi': [77.2090, 28.6139],
  'mumbai': [72.8777, 19.0760],
  'bengaluru': [77.5946, 12.9716],
  'kolkata': [88.3639, 22.5726]
};

/**
 * Get coordinates for a city
 * @param {string} cityName 
 * @returns {Array|null} [lng, lat]
 */
const getCityCoords = (cityName) => {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalized] || null;
};

module.exports = {
  CITY_COORDINATES,
  getCityCoords
};
