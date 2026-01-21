import * as firebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Safely access Vite env variables
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Only initialize if keys are present
const isConfigured = !!firebaseConfig.apiKey;

const app = isConfigured ? firebaseApp.initializeApp(firebaseConfig) : undefined;
export const db = app ? getFirestore(app) : null;
export const isFirebaseEnabled = isConfigured;
