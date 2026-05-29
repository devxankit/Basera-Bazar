import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './mockToast'
import {
  REACT_QUERY_CACHE_KEY,
  REACT_QUERY_CACHE_MAX_AGE,
  REACT_QUERY_CACHE_BUSTER,
} from './config/persistence'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — matches server-side cache TTLs
      // gcTime must be >= the persisted maxAge, otherwise queries are evicted
      // from memory before they can be restored/kept across reloads.
      gcTime: REACT_QUERY_CACHE_MAX_AGE,
      retry: 1,
    },
  },
})

// Layer 3 — persist the React Query cache to localStorage so last-known data is
// shown instantly on reload and remains available while offline. Only
// successful queries are written; failed/loading ones are skipped.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: REACT_QUERY_CACHE_KEY,
  throttleTime: 1000,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: REACT_QUERY_CACHE_MAX_AGE,
        buster: REACT_QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <ToastProvider>
        <App />
      </ToastProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
