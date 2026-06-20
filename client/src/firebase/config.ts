/**
 * Firebase Configuration
 * Initializes Firebase with environment variables
 * All sensitive data is loaded from environment variables only
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase Configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    console.warn(
      `Missing Firebase configuration: ${missingFields.join(', ')}. ` +
        'Please set the required environment variables.'
    );
  }
};

validateFirebaseConfig();

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const performance = getPerformance(app);
export const functions = getFunctions(app, 'asia-southeast1'); // Use appropriate region
export { httpsCallable } from 'firebase/functions';

// ============= Firebase App Check =============

/**
 * Initialize Firebase App Check
 * Protects backend from abuse
 */
export async function initializeAppCheckService(): Promise<void> {
  try {
    const recaptchaV3Provider = new ReCaptchaV3Provider(
      import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || ''
    );

    initializeAppCheck(app, {
      provider: recaptchaV3Provider,
      isTokenAutoRefreshEnabled: true,
    });

    console.log('Firebase App Check initialized');
  } catch (error) {
    console.error('Error initializing App Check:', error);
  }
}

// Initialize App Check on startup
initializeAppCheckService();

// Firebase Messaging (FCM)
let messaging: ReturnType<typeof getMessaging> | null = null;

export const getFirebaseMessaging = () => {
  if (!messaging && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn('Firebase Messaging not available:', error);
    }
  }
  return messaging;
};

// Request FCM Token
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    return token || null;
  } catch (error) {
    console.warn('Failed to get FCM token:', error);
    return null;
  }
};

// Listen to FCM Messages
export const listenToFCMMessages = (
  callback: (payload: any) => void
): (() => void) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      
      callback(payload);
    });
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to listen to FCM messages:', error);
    return () => {};
  }
};

// Log Analytics Event
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
  try {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
  }
};

// Enable Emulators in Development (optional)
const enableEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (enableEmulators && !auth.emulatorConfig) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase Emulators');
  } catch (error) {
    console.warn('Failed to connect Firebase Emulators:', error);
  }
}

export default app;
