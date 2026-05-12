const EARTH_RADIUS_M = 6371000;

/**
 * Calculate the great-circle distance (meters) between two GPS coordinates
 * using the Haversine formula.
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Check if a point is within a geo-fence zone.
 * Returns { valid: boolean, distanceM: number }
 */
function checkGeoFence(lat, lng, centerLat, centerLng, radiusMeters) {
  const distanceM = calculateDistance(lat, lng, centerLat, centerLng);
  return { valid: distanceM <= radiusMeters, distanceM: Math.round(distanceM) };
}

module.exports = { calculateDistance, checkGeoFence };
