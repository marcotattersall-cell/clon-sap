import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  isRealFirebaseConfigured
} from '../firebase/config';
import { upsertDocument } from '../services/firestoreService';

const AuthContext = createContext(null);

const CURRENT_AUTH_SESSION_KEY = 'sap_current_auth_session';
const DEFAULT_SAP_USER = null;

// Firebase Error Mapping Helper
const mapAuthErrorMessage = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'El usuario no está registrado en la plataforma.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciales inválidas. Por favor verifique su correo y contraseña.';
    case 'auth/email-already-in-use':
      return 'El correo electrónico ya se encuentra registrado.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico ingresado no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener una longitud mínima de 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de autenticación de Google se cerró antes de completar el acceso.';
    default:
      return 'Error de autenticación. Verifique las credenciales ingresadas.';
  }
};

// Slugify Helper para generar tenantId de Multi-Tenancy
export const slugifyTenantId = (companyName) => {
  if (!companyName || typeof companyName !== 'string') return 'tenant_demo';
  const clean = companyName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return clean ? `tenant_${clean}` : 'tenant_demo';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_SAP_USER);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync Firebase Auth state
  useEffect(() => {
    let unsubscribe = () => {};

    if (auth && isRealFirebaseConfigured) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const formatted = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Operador ERP',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.email || 'User')}`,
            emailVerified: firebaseUser.emailVerified,
            role: firebaseUser.role || 'MAINTENANCE_MGR',
            plant: firebaseUser.plant || '0001 (Planta Central)',
            provider: firebaseUser.providerData[0]?.providerId || 'firebase'
          };
          setUser(formatted);
          // Persist user profile to Firestore (IndexedDB cache automatically syncs)
          upsertDocument('users', firebaseUser.uid, formatted);
        } else {
          setUser(DEFAULT_SAP_USER);
        }
        setLoading(false);
      });
    } else {
      setUser(DEFAULT_SAP_USER);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const saveActiveSession = (userData) => {
    setUser(userData);
    if (userData?.uid) {
      upsertDocument('users', userData.uid, userData);
    }
  };

  // Real Email/Password Authentication
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    if (!email || !password) {
      const errorMsg = 'Debe ingresar correo y contraseña.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      if (auth && isRealFirebaseConfigured) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;
        const formatted = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          emailVerified: fbUser.emailVerified,
          role: 'MAINTENANCE_MGR',
          plant: '0001 (Planta Central)',
          provider: 'firebase-password'
        };
        saveActiveSession(formatted);
        return { success: true, user: formatted };
      } else {
        const errorMsg = 'Firebase Auth no está configurado.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = mapAuthErrorMessage(err.code);
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Register New User with Email, Password and Company Name (Multi-Tenancy)
  const registerWithEmail = async ({ email, password, displayName, companyName = 'Empresa Demo', role = 'MAINTENANCE_MGR', plant = '0001 (Planta Central)' }) => {
    setAuthError(null);
    if (!email || !password) {
      const errorMsg = 'Debe ingresar un correo y contraseña válidos.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const tenantId = slugifyTenantId(companyName);

      if (auth && isRealFirebaseConfigured) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        if (displayName) {
          await updateProfile(fbUser, { displayName });
        }

        const formatted = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName || email.split('@')[0],
          companyName: companyName || 'Empresa Demo',
          tenantId,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
          emailVerified: fbUser.emailVerified,
          role,
          plant,
          provider: 'firebase-password'
        };
        saveActiveSession(formatted);
        return { success: true, user: formatted };
      } else {
        const errorMsg = 'Firebase Auth no está activo.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = mapAuthErrorMessage(err.code);
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Sign In with Google OAuth Popup
  const loginWithGoogle = async (role = 'MAINTENANCE_MGR', plant = '0001 (Planta Central)') => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const formatted = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Usuario Google Enterprise',
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
          role,
          plant,
          provider: 'google.com'
        };
        saveActiveSession(formatted);
        return { success: true, user: formatted };
      } else {
        const errorMsg = 'Autenticación de Google no configurada.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = mapAuthErrorMessage(err.code);
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Real Enterprise Demo Login Helper (Authenticate official demo accounts)
  const loginDemoUser = async (roleKey = 'MAINTENANCE_MGR') => {
    setAuthError(null);
    const demoCredentials = {
      'MAINTENANCE_MGR': { email: 'admin.pm@operam-erp.com', pass: 'OperamEnterprise2026!', name: 'Marco Vidal (Jefe PM)', role: 'MAINTENANCE_MGR', plant: '0001 (Planta Central)' },
      'WAREHOUSE_SPEC': { email: 'almacen.mm@operam-erp.com', pass: 'OperamEnterprise2026!', name: 'Gonzalo Silva (Especialista Almacén)', role: 'WAREHOUSE_SPEC', plant: '0001 (Planta Central)' },
      'PURCHASING_MGR': { email: 'compras.po@operam-erp.com', pass: 'OperamEnterprise2026!', name: 'Patricia Lagos (Gerente Compras)', role: 'PURCHASING_MGR', plant: '0002 (Centro Antofagasta)' }
    };

    const target = demoCredentials[roleKey] || demoCredentials['MAINTENANCE_MGR'];

    try {
      if (auth && isRealFirebaseConfigured) {
        let fbUser = null;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, target.email, target.pass);
          fbUser = userCredential.user;
        } catch (e) {
          // If demo account does not exist in Firebase Auth yet, create it automatically
          const userCredential = await createUserWithEmailAndPassword(auth, target.email, target.pass);
          fbUser = userCredential.user;
          await updateProfile(fbUser, { displayName: target.name });
        }

        const formatted = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: target.name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(target.name)}`,
          emailVerified: true,
          role: target.role,
          plant: target.plant,
          provider: 'firebase-password'
        };
        saveActiveSession(formatted);
        return { success: true, user: formatted };
      } else {
        const fallbackUser = {
          uid: `demo-usr-${Date.now()}`,
          email: target.email,
          displayName: target.name,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(target.name)}`,
          emailVerified: true,
          role: target.role,
          plant: target.plant,
          provider: 'demo'
        };
        saveActiveSession(fallbackUser);
        return { success: true, user: fallbackUser };
      }
    } catch (err) {
      const errorMsg = mapAuthErrorMessage(err.code);
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Sign Out
  const logout = async () => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Error al cerrar sesión:', e);
    }
    setUser(DEFAULT_SAP_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
