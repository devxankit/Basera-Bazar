import { useEffect, useState } from 'react';

/**
 * useOnlineStatus — tracks the browser's connectivity.
 *
 * Returns `true` when the device reports a network connection and `false`
 * otherwise. Backed by `navigator.onLine` plus the `online`/`offline` window
 * events, so it updates the instant the connection drops or returns — without
 * triggering any navigation, so the currently-rendered page stays intact.
 *
 * Note: `navigator.onLine === true` only guarantees a *local* network link
 * exists (wifi/cellular), not that the internet is actually reachable. That's
 * fine for our purposes — real failed requests are still surfaced separately by
 * the axios layer.
 */
export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true,
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
