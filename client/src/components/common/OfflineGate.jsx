import React, { useState } from 'react';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { hasPersistedCache } from '../../config/persistence';
import OfflineScreen from './OfflineScreen';

/**
 * OfflineGate — decides between the live app and the full-screen offline
 * fallback.
 *
 * - Online → always render the app.
 * - Offline WITH saved data → render the app (pages show last-known data; the
 *   OfflineBanner communicates the offline state). The current page is never
 *   torn down.
 * - Offline WITHOUT any saved data (e.g. a cold launch while offline) → show
 *   the friendly <OfflineScreen/> with a Refresh button instead of broken,
 *   empty pages.
 *
 * The "has saved data" check is snapshotted once on mount so that losing the
 * connection mid-session never yanks the user out of the page they're on — it
 * only applies to a fresh boot.
 */
export default function OfflineGate({ children }) {
  const isOnline = useOnlineStatus();
  // Snapshot whether saved data existed at boot. Mid-session connectivity loss
  // must not swap the live page for the offline screen.
  const [hadCacheAtBoot] = useState(() => hasPersistedCache());
  const [bootedOnline] = useState(() => isOnline);

  // Only gate the very first paint: if we started offline with nothing cached.
  if (!bootedOnline && !isOnline && !hadCacheAtBoot) {
    return <OfflineScreen />;
  }

  return children;
}
