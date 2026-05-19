'use strict';
const { escapeRegex, sortByLocationPriority, getDistanceInKm, sortByProximity } = require('../../utils/listingUtils');

describe('escapeRegex', () => {
  test('escapes regex metacharacters', () => {
    expect(escapeRegex('hello.world')).toBe('hello\\.world');
    expect(escapeRegex('a+b*c?')).toBe('a\\+b\\*c\\?');
    expect(escapeRegex('(foo|bar)')).toBe('\\(foo\\|bar\\)');
    expect(escapeRegex('[test]')).toBe('\\[test\\]');
  });

  test('returns plain string unchanged when no special chars', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });

  test('handles empty string', () => {
    expect(escapeRegex('')).toBe('');
  });
});

describe('sortByLocationPriority', () => {
  const items = [
    { district: 'delhi', state: 'delhi ncr' },
    { district: 'patna', state: 'bihar' },
    { district: 'muzaffarpur', state: 'bihar' },
    { district: 'mumbai', state: 'maharashtra' },
  ];

  test('sorts same-district items first (score 2)', () => {
    const result = sortByLocationPriority([...items], 'muzaffarpur', 'bihar');
    expect(result[0].district).toBe('muzaffarpur');
  });

  test('sorts same-state (different district) items second (score 1)', () => {
    const result = sortByLocationPriority([...items], 'muzaffarpur', 'bihar');
    expect(result[1].district).toBe('patna'); // same state bihar
  });

  test('returns items unchanged when no district and state given', () => {
    const arr = [...items];
    const result = sortByLocationPriority(arr, '', '');
    expect(result).toBe(arr);
  });

  test('supports nested address sub-object (listing schema)', () => {
    const listingItems = [
      { address: { district: 'gaya', state: 'bihar' } },
      { address: { district: 'patna', state: 'bihar' } },
    ];
    const result = sortByLocationPriority(listingItems, 'patna', 'bihar');
    expect(result[0].address.district).toBe('patna');
  });

  test('comparison is case-insensitive', () => {
    const mixed = [
      { district: 'Patna', state: 'Bihar' },
      { district: 'muzaffarpur', state: 'bihar' },
    ];
    const result = sortByLocationPriority(mixed, 'muzaffarpur', 'bihar');
    expect(result[0].district).toBe('muzaffarpur');
  });
});

describe('getDistanceInKm', () => {
  test('calculates correct distance between two points', () => {
    const dist = getDistanceInKm(26.2, 78.1, 26.1209, 85.3647);
    expect(dist).toBeGreaterThan(700);
    expect(dist).toBeLessThan(750);
  });

  test('returns 0 for the same point', () => {
    const dist = getDistanceInKm(26.2, 78.1, 26.2, 78.1);
    expect(dist).toBe(0);
  });
});

describe('sortByProximity', () => {
  const items = [
    { name: 'Far Item', location: { coordinates: [85.3647, 26.1209] } },
    { name: 'Near Item', location: { coordinates: [78.12, 26.21] } },
    { name: 'No Coord Item' }
  ];

  test('sorts items by proximity to target coordinates', () => {
    const sorted = sortByProximity(items, 26.2, 78.1);
    expect(sorted[0].name).toBe('Near Item');
    expect(sorted[1].name).toBe('Far Item');
    expect(sorted[2].name).toBe('No Coord Item');
  });

  test('returns original list if coordinates are invalid', () => {
    const sorted = sortByProximity(items, NaN, NaN);
    expect(sorted).toEqual(items);
  });
});

