'use strict';
const pick = require('../../utils/pick');

describe('pick', () => {
  test('returns only the specified keys', () => {
    const result = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('omits undefined values', () => {
    const result = pick({ a: 1, b: undefined, c: 3 }, ['a', 'b', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('returns empty object when keys array is empty', () => {
    expect(pick({ a: 1 }, [])).toEqual({});
  });

  test('returns empty object when no keys match', () => {
    expect(pick({ a: 1 }, ['z'])).toEqual({});
  });

  test('handles null and 0 values (not undefined)', () => {
    const result = pick({ a: null, b: 0, c: false }, ['a', 'b', 'c']);
    expect(result).toEqual({ a: null, b: 0, c: false });
  });

  test('does not mutate the original object', () => {
    const orig = { a: 1, b: 2 };
    pick(orig, ['a']);
    expect(orig).toEqual({ a: 1, b: 2 });
  });
});
