import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// These are pulled from your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Safe Messaging Initialization (Prevents crash in unsupported browsers)
let messaging = null;
try {
  // Check if messaging is supported before initializing
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging initialized");
  } else {
    console.warn("⚠️ Firebase Messaging is not supported in this browser environment.");
  }
} catch (err) {
  console.error("❌ Failed to initialize Firebase Messaging:", err);
}

console.log("✅ Firebase initialized successfully");

export { messaging, getToken, onMessage };
