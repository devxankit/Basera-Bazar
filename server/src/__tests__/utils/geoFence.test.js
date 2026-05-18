'use strict';
const { calculateDistance, checkGeoFence } = require('../../utils/geoFence');

describe('calculateDistance', () => {
  test('returns 0 for identical coordinates', () => {
    expect(calculateDistance(28.6139, 77.209, 28.6139, 77.209)).toBe(0);
  });

  test('calculates known distance between Delhi and Mumbai (~1153 km)', () => {
    const dist = calculateDistance(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1_100_000);
    expect(dist).toBeLessThan(1_200_000);
  });

  test('returns a positive number for any two distinct points', () => {
    const dist = calculateDistance(26.1209, 85.3647, 25.5941, 85.1376);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('checkGeoFence', () => {
  const centerLat = 26.1209;
  const centerLng = 85.3647;

  test('returns valid:true when point is inside the radius', () => {
    // Same point as center — distance 0
    const result = checkGeoFence(centerLat, centerLng, centerLat, centerLng, 1000);
    expect(result.valid).toBe(true);
    expect(result.distanceM).toBe(0);
  });

  test('returns valid:false when point is outside the radius', () => {
    // Patna is ~65 km from Muzaffarpur
    const result = checkGeoFence(25.5941, 85.1376, centerLat, centerLng, 10_000);
    expect(result.valid).toBe(false);
    expect(result.distanceM).toBeGreaterThan(10_000);
  });

  test('distanceM is rounded to integer', () => {
    const result = checkGeoFence(26.12, 85.37, centerLat, centerLng, 5000);
    expect(Number.isInteger(result.distanceM)).toBe(true);
  });

  test('returns valid:true exactly at the boundary', () => {
    const dist = calculateDistance(centerLat, centerLng, 26.12, 85.37);
    const result = checkGeoFence(26.12, 85.37, centerLat, centerLng, Math.ceil(dist));
    expect(result.valid).toBe(true);
  });
});
