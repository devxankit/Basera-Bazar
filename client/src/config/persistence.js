// localStorage key under which the React Query cache is persisted (Layer 3).
// Shared between the persister (main.jsx) and the offline gate (OfflineGate),
// so the gate can tell whether there is any saved data to show while offline.
export const REACT_QUERY_CACHE_KEY = 'baserabazar_rq_cache';

// How long persisted data is considered usable offline before being discarded.
export const REACT_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Bump this to invalidate all previously persisted caches (e.g. after a schema
// change in cached payloads). Acts as a cache-busting version tag.
export const REACT_QUERY_CACHE_BUSTER = 'v1';

/**
 * Returns true when there is a non-empty persisted React Query cache in
 * localStorage — i.e. the user has loaded data before and we can show it while
 * offline instead of a blank/error screen.
 */
export function hasPersistedCache() {
  try {
    const raw = localStorage.getItem(REACT_QUERY_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const queries = parsed?.clientState?.queries;
    return Array.isArray(queries) && queries.length > 0;
  } catch {
    return false;
  }
}
