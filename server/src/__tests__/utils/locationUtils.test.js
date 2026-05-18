'use strict';
const { getCityCoords, CITY_COORDINATES } = require('../../utils/locationUtils');

describe('getCityCoords', () => {
  test('returns coordinates for a known city', () => {
    const coords = getCityCoords('patna');
    expect(Array.isArray(coords)).toBe(true);
    expect(coords).toHaveLength(2);
    expect(coords[0]).toBeCloseTo(85.1376, 2);
    expect(coords[1]).toBeCloseTo(25.5941, 2);
  });

  test('is case-insensitive', () => {
    expect(getCityCoords('PATNA')).toEqual(getCityCoords('patna'));
    expect(getCityCoords('Muzaffarpur')).toEqual(getCityCoords('muzaffarpur'));
  });

  test('trims leading/trailing whitespace', () => {
    expect(getCityCoords('  patna  ')).toEqual(getCityCoords('patna'));
  });

  test('returns null for unknown city', () => {
    expect(getCityCoords('atlantis')).toBeNull();
  });

  test('returns null when called with null or undefined', () => {
    expect(getCityCoords(null)).toBeNull();
    expect(getCityCoords(undefined)).toBeNull();
    expect(getCityCoords('')).toBeNull();
  });
});

describe('CITY_COORDINATES', () => {
  test('is a plain object', () => {
    expect(typeof CITY_COORDINATES).toBe('object');
    expect(CITY_COORDINATES).not.toBeNull();
  });

  test('every entry is a [lng, lat] pair', () => {
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      expect(Array.isArray(coords)).toBe(true);
      expect(coords).toHaveLength(2);
      expect(typeof coords[0]).toBe('number');
      expect(typeof coords[1]).toBe('number');
    }
  });
});
