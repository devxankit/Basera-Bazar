// Escape special regex metacharacters so user input can't cause ReDoS (H-1)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


/**
 * Sort listings by location priority:
 * 2 = same district, 1 = same state, 0 = other
 */
// Sort listings by location priority:
// 2 = same district, 1 = same state, 0 = other
const sortByLocationPriority = (items, district, state) => {
  if (!district && !state) return items;
  return items.sort((a, b) => {
    const getScore = (item) => {
      // Support both Partner (top-level) and Listing (address sub-object) schemas
      const d = (item.address?.district || item.district || '').toLowerCase();
      const s = (item.address?.state || item.state || '').toLowerCase();

      const targetD = (district || '').toLowerCase();
      const targetS = (state || '').toLowerCase();

      if (targetD && d === targetD) return 2;
      if (targetS && s === targetS) return 1;
      return 0;
    };
    return getScore(b) - getScore(a);
  });
};

/**
 * Calculates geodesic distance between two points in km using Haversine formula
 */
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Sorts items by geodesic distance to target latitude and longitude (closest first)
 */
const sortByProximity = (items, latitude, longitude) => {
  if (isNaN(latitude) || isNaN(longitude)) return items;

  const getDistanceScore = (item) => {
    // GeoJSON point coordinates: [longitude, latitude]
    const coords = item.location?.coordinates || item.coordinates;
    if (!coords || coords.length < 2) return Infinity;
    const itemLng = coords[0];
    const itemLat = coords[1];
    if (itemLng === 0 && itemLat === 0) return Infinity;
    return getDistanceInKm(latitude, longitude, itemLat, itemLng);
  };

  return [...items].sort((a, b) => getDistanceScore(a) - getDistanceScore(b));
};

module.exports = { escapeRegex, sortByLocationPriority, getDistanceInKm, sortByProximity };

