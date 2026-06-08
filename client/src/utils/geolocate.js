// Location detection helpers with a graceful IP-based fallback.
//
// Why this exists: `navigator.geolocation` works fine in a real browser but is
// DENIED inside an Android WebView unless the native wrapper explicitly grants
// the WebView's own geolocation prompt. Since the app is wrapped in Flutter, GPS
// often fails there even after the OS location permission is granted. These
// helpers try precise GPS first and, when it is unavailable, fall back to an
// approximate (city-level) location derived from the device's IP address — which
// needs no permission and works inside the WebView.

/**
 * Promisified navigator.geolocation.getCurrentPosition.
 * Rejects if geolocation is unsupported or the request fails/denies/times out.
 */
export function getCurrentPositionAsync(options = { enableHighAccuracy: false, timeout: 60000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Approximate location from the device IP address. No permission required, so it
 * works inside the Flutter WebView. City-level accurate only (not GPS-precise).
 * Tries two free, key-less, HTTPS providers for resilience.
 *
 * @returns {Promise<{latitude:number, longitude:number, city:string, state:string, source:'ip'}>}
 */
export async function ipGeolocate() {
  // Provider 1: ipwho.is — reliable, key-less, no aggressive rate limit.
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const d = await res.json();
      if (d.success !== false && typeof d.latitude === 'number') {
        return {
          latitude: d.latitude,
          longitude: d.longitude,
          city: d.city || '',
          state: d.region || '',
          source: 'ip',
        };
      }
    }
  } catch {
    /* fall through to provider 2 */
  }

  // Provider 2: ipapi.co — secondary (free tier rate-limits, so not primary).
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const d = await res.json();
      if (!d.error && typeof d.latitude === 'number' && typeof d.longitude === 'number') {
        return {
          latitude: d.latitude,
          longitude: d.longitude,
          city: d.city || '',
          state: d.region || '',
          source: 'ip',
        };
      }
    }
  } catch {
    /* both providers failed */
  }

  throw new Error('IP geolocation failed');
}

/**
 * Best-effort coordinates: precise GPS if available, otherwise approximate IP.
 * Returns the raw coords plus a `source` flag ('gps' | 'ip') and, for the IP
 * path, the city/state the provider reported (so callers can skip a redundant
 * reverse-geocode). Throws only if BOTH GPS and IP lookup fail.
 *
 * @returns {Promise<{latitude:number, longitude:number, source:'gps'|'ip', city?:string, state?:string}>}
 */
export async function detectCoordinates(gpsOptions) {
  try {
    const pos = await getCurrentPositionAsync(gpsOptions);
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: 'gps' };
  } catch {
    // GPS denied/unsupported/timed out (typical inside the WebView) → IP fallback.
    return await ipGeolocate();
  }
}
