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

// Validate config before initialization
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfig.filter(key => !firebaseConfig[key]);

let app = null;

if (missingKeys.length > 0) {
  console.warn(`⚠️ Firebase configuration is incomplete. Missing keys: [${missingKeys.join(', ')}]. Push notifications will be disabled.`);
} else {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase App:", err);
  }
}

// Safe Messaging Initialization (Prevents crash in unsupported browsers)
let messaging = null;
try {
  // Check if messaging is supported before initializing
  if (app && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
    messaging = getMessaging(app);
    console.log("✅ Firebase Messaging initialized");
  } else {
    console.warn("⚠️ Firebase Messaging is not supported or Firebase App not initialized.");
  }
} catch (err) {
  console.error("❌ Failed to initialize Firebase Messaging:", err);
}

export { messaging, getToken, onMessage };
