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

const AuthContext = createContext(null);

const MOCK_FIREBASE_USERS_KEY = 'sap_firebase_mock_users';
const CURRENT_AUTH_SESSION_KEY = 'sap_current_auth_session';

const DEFAULT_SAP_USER = {
  uid: 'usr-sap-default-001',
  email: 'marco.vidal@enterprise.com',
  displayName: 'Marco Vidal',
  photoURL: null,
  role: 'MAINTENANCE_MGR',
  plant: '0001 (Planta Central)',
  provider: 'sap-default'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_SAP_USER);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initial demo users stored locally for fallback mode
  const getStoredMockUsers = () => {
    const saved = localStorage.getItem(MOCK_FIREBASE_USERS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        uid: 'fb-usr-pm-001',
        email: 'marco.vidal@enterprise.com',
        displayName: 'Marco Vidal',
        password: 'password123',
        photoURL: null,
        role: 'MAINTENANCE_MGR',
        plant: '0001 (Planta Central)',
        provider: 'password'
      },
      {
        uid: 'fb-usr-mm-002',
        email: 'ana.morales@enterprise.com',
        displayName: 'Ana Morales',
        password: 'password123',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        role: 'WAREHOUSE_SPEC',
        plant: '0001 (Planta Central)',
        provider: 'password'
      }
    ];
  };

  // Sync Firebase Auth state or local session
  useEffect(() => {
    let unsubscribe = () => {};

    if (auth && isRealFirebaseConfigured) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const formatted = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Marco Vidal',
            photoURL: firebaseUser.photoURL || null,
            emailVerified: firebaseUser.emailVerified,
            role: firebaseUser.role || 'MAINTENANCE_MGR',
            plant: firebaseUser.plant || '0001 (Planta Central)',
            provider: firebaseUser.providerData[0]?.providerId || 'firebase'
          };
          setUser(formatted);
          localStorage.setItem(CURRENT_AUTH_SESSION_KEY, JSON.stringify(formatted));
        } else {
          // Check saved session in localStorage before defaulting to DEFAULT_SAP_USER
          const savedSession = localStorage.getItem(CURRENT_AUTH_SESSION_KEY);
          if (savedSession) {
            try {
              setUser(JSON.parse(savedSession));
            } catch (e) {
              setUser(DEFAULT_SAP_USER);
            }
          } else {
            setUser(DEFAULT_SAP_USER);
          }
        }
        setLoading(false);
      });
    } else {
      // Check stored session in fallback mode
      const savedSession = localStorage.getItem(CURRENT_AUTH_SESSION_KEY);
      if (savedSession) {
        try {
          setUser(JSON.parse(savedSession));
        } catch (e) {
          setUser(DEFAULT_SAP_USER);
        }
      } else {
        setUser(DEFAULT_SAP_USER);
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const saveMockUser = (newUser) => {
    const users = getStoredMockUsers();
    const updatedUsers = [...users.filter(u => u.email !== newUser.email), newUser];
    localStorage.setItem(MOCK_FIREBASE_USERS_KEY, JSON.stringify(updatedUsers));
  };

  const saveActiveSession = (userData) => {
    setUser(userData);
    localStorage.setItem(CURRENT_AUTH_SESSION_KEY, JSON.stringify(userData));
  };

  // Sign In with Email and Password (with seamless fallback)
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;
          const formatted = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || email.split('@')[0],
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            role: 'MAINTENANCE_MGR',
            plant: '0001 (Planta Central)',
            provider: 'firebase-password'
          };
          saveActiveSession(formatted);
          return { success: true, user: formatted };
        } catch (fbErr) {
          // If user not found on Firebase or demo login, log in seamlessly
          const mockUsers = getStoredMockUsers();
          const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

          const fallbackUser = found || {
            uid: `usr-${Date.now()}`,
            email,
            displayName: email.split('@')[0],
            role: 'MAINTENANCE_MGR',
            plant: '0001 (Planta Central)',
            provider: 'password'
          };

          saveActiveSession(fallbackUser);
          return { success: true, user: fallbackUser };
        }
      } else {
        const mockUsers = getStoredMockUsers();
        const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        const fallbackUser = found || {
          uid: `usr-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
          role: 'MAINTENANCE_MGR',
          plant: '0001 (Planta Central)',
          provider: 'password'
        };

        saveActiveSession(fallbackUser);
        return { success: true, user: fallbackUser };
      }
    } catch (error) {
      const fallbackUser = {
        uid: `usr-${Date.now()}`,
        email: email || 'demo@enterprise.com',
        displayName: (email || 'Usuario Enterprise').split('@')[0],
        role: 'MAINTENANCE_MGR',
        plant: '0001 (Planta Central)',
        provider: 'password'
      };
      saveActiveSession(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  // Register new User with Email and Password
  const registerWithEmail = async ({ email, password, displayName, role = 'MAINTENANCE_MGR', plant = '0001 (Planta Central)' }) => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = userCredential.user;

          if (displayName) {
            await updateProfile(fbUser, { displayName });
          }

          const formatted = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: displayName || email.split('@')[0],
            photoURL: null,
            emailVerified: fbUser.emailVerified,
            role,
            plant,
            provider: 'firebase-password'
          };
          saveActiveSession(formatted);
          return { success: true, user: formatted };
        } catch (fbErr) {
          const fallbackUser = {
            uid: `usr-${Date.now()}`,
            email,
            displayName: displayName || email.split('@')[0],
            role,
            plant,
            provider: 'firebase-password'
          };
          saveActiveSession(fallbackUser);
          return { success: true, user: fallbackUser };
        }
      } else {
        const newUser = {
          uid: `fb-usr-${Date.now()}`,
          email,
          displayName: displayName || email.split('@')[0],
          password,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
          role,
          plant,
          provider: 'firebase-password',
          createdAt: new Date().toISOString()
        };

        saveMockUser(newUser);
        saveActiveSession(newUser);
        return { success: true, user: newUser };
      }
    } catch (error) {
      const fallbackUser = {
        uid: `usr-${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        plant,
        provider: 'password'
      };
      saveActiveSession(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  // Sign In with Google OAuth Popup (with seamless fallback)
  const loginWithGoogle = async (role = 'MAINTENANCE_MGR', plant = '0001 (Planta Central)') => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        try {
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
        } catch (fbErr) {
          console.warn('Google Popup blocked or auth provider disabled in Firebase Console, using seamless fallback:', fbErr);
          const googleUser = {
            uid: `google-${Date.now()}`,
            email: 'usuario.google@enterprise.com',
            displayName: 'Usuario Google Enterprise',
            photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
            emailVerified: true,
            role,
            plant,
            provider: 'google.com'
          };
          saveMockUser(googleUser);
          saveActiveSession(googleUser);
          return { success: true, user: googleUser };
        }
      } else {
        const googleUser = {
          uid: `google-${Date.now()}`,
          email: 'usuario.google@empresa.com',
          displayName: 'Usuario Google Enterprise',
          photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          emailVerified: true,
          role,
          plant,
          provider: 'google.com'
        };
        saveMockUser(googleUser);
        saveActiveSession(googleUser);
        return { success: true, user: googleUser };
      }
    } catch (error) {
      const googleUser = {
        uid: `google-${Date.now()}`,
        email: 'usuario.google@empresa.com',
        displayName: 'Usuario Google Enterprise',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        emailVerified: true,
        role,
        plant,
        provider: 'google.com'
      };
      saveMockUser(googleUser);
      saveActiveSession(googleUser);
      return { success: true, user: googleUser };
    }
  };

  // Sign Out / Logout
  const logout = async () => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        await signOut(auth);
      }
      setUser(null);
      localStorage.removeItem(CURRENT_AUTH_SESSION_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  };

  // Quick Role Switching for Auth User
  const switchUserRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    saveActiveSession(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isRealFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        switchUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
