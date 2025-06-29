import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { FIREBASE_CONFIG, IS_FIREBASE_CONFIGURED } from "./constants";

let app, auth;

if (IS_FIREBASE_CONFIGURED) {
  try {
    console.log('🔥 Initializing Firebase...');
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully!');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    auth = null;
  }
} else {
  console.warn('⚠️ Firebase not configured - missing environment variables');
  console.warn('To enable Firebase auth, check your .env file and restart dev server');
  auth = null;
}

export { auth };
export default app; 