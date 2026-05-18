'use strict';

// Mock redis to be unavailable → tests exercise the in-memory fallback path
jest.mock('../../config/redis', () => null);

const CacheManager = require('../../utils/cache');

beforeEach(() => {
  // Clear the internal memoryCache between tests
  // We expose it indirectly via clearByPrefix
  return CacheManager.clear();
});

describe('CacheManager (in-memory fallback path)', () => {
  test('set and get round-trips a value', async () => {
    await CacheManager.set('key1', { foo: 'bar' }, 1);
    const result = await CacheManager.get('key1');
    expect(result).toEqual({ foo: 'bar' });
  });

  test('get returns null for missing key', async () => {
    expect(await CacheManager.get('no-such-key')).toBeNull();
  });

  test('delete removes a key', async () => {
    await CacheManager.set('key2', 42, 1);
    await CacheManager.delete('key2');
    expect(await CacheManager.get('key2')).toBeNull();
  });

  test('clearByPrefix removes only matching keys', async () => {
    await CacheManager.set('ns:a', 1, 1);
    await CacheManager.set('ns:b', 2, 1);
    await CacheManager.set('other:c', 3, 1);
    await CacheManager.clearByPrefix('ns:');
    expect(await CacheManager.get('ns:a')).toBeNull();
    expect(await CacheManager.get('ns:b')).toBeNull();
    expect(await CacheManager.get('other:c')).toEqual(3);
  });

  test('get returns null after TTL expires', async () => {
    // Use fake timers to advance past TTL
    jest.useFakeTimers();
    await CacheManager.set('ttl-key', 'value', 1); // 1 minute TTL
    jest.advanceTimersByTime(61 * 1000);
    expect(await CacheManager.get('ttl-key')).toBeNull();
    jest.useRealTimers();
  });

  test('clear empties all in-memory keys', async () => {
    await CacheManager.set('a', 1, 1);
    await CacheManager.set('b', 2, 1);
    await CacheManager.clear();
    expect(await CacheManager.get('a')).toBeNull();
    expect(await CacheManager.get('b')).toBeNull();
  });
});

describe('ping', () => {
  test('returns false when redis is unavailable', async () => {
    const { ping } = require('../../utils/cache');
    expect(await ping()).toBe(false);
  });
});
