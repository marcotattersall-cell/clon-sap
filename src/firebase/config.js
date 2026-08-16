import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Configuración de Firebase para el proyecto clon-sap-2026
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC6wbgOuAkgATciHHT8iYCbElk8dmzOD98",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "clon-sap-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "clon-sap-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "clon-sap-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "649947207263",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:649947207263:web:bb45e017ecaef9a72d6dea"
};

// Configuración de producción de Firebase activa
export const isRealFirebaseConfigured = true;

// Inicializar la aplicación de Firebase sin duplicados
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn('[Firebase SDK] Advertencia de Inicialización:', error);
}

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
};
