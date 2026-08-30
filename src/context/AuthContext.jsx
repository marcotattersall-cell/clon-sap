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
  sendPasswordResetEmail,
  sendEmailVerification,
  isRealFirebaseConfigured
} from '../firebase/config';
import { upsertDocument } from '../services/dbService';

const AuthContext = createContext(null);

const CURRENT_AUTH_SESSION_KEY = 'sap_current_auth_session';
const DEFAULT_SAP_USER = null;

export const UNIVERSAL_ADMIN_EMAIL = 'marco.tattersall@gmail.com';

// Firebase Error Mapping Helper
const mapAuthErrorMessage = (code) => {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Dominio no autorizado en Firebase Auth. Agregue "operam-erp-enterprise.web.app" en Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente de Google. Por favor permite popups para este sitio o usa la pestaña "Crear Cuenta".';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Usuario no encontrado o credenciales incorrectas. Si es tu primera vez, selecciona la pestaña "Crear Cuenta".';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Por favor verifica e intenta nuevamente.';
    case 'auth/email-already-in-use':
      return 'El correo ya está registrado. Selecciona la pestaña "Ingresar" para entrar.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe contener al menos 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de Google se cerró antes de completar la autenticación.';
    default:
      return 'No se pudo iniciar sesión con Google. Verifique los dominios autorizados en Firebase o use "Crear Cuenta".';
  }
};

// Slugify Helper para generar tenantId de Multi-Tenancy
export const slugifyTenantId = (companyName) => {
  if (!companyName || typeof companyName !== 'string') return 'tenant_demo';
  const clean = companyName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return clean ? `tenant_${clean}` : 'tenant_demo';
};

// Helper para formatear perfiles de usuario garantizando privilegios de Administrador Universal
export const formatUserProfile = (firebaseUser, overrideRole = null, overridePlant = null) => {
  const isUniversalAdmin = firebaseUser.email?.toLowerCase().trim() === UNIVERSAL_ADMIN_EMAIL.toLowerCase();
  
  const role = isUniversalAdmin ? 'ADMINISTRATOR' : (overrideRole || firebaseUser.role || 'MAINTENANCE_MGR');
  const plant = overridePlant || firebaseUser.plant || '0001 (Planta Central)';
  const displayName = isUniversalAdmin 
    ? 'Marco Tattersall (Administrador Universal)' 
    : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Operador ERP');

  const tenantId = firebaseUser.tenantId || slugifyTenantId(firebaseUser.companyName || firebaseUser.email?.split('@')[1]?.split('.')[0]) || 'tenant_demo';

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName,
    photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.email || 'User')}`,
    emailVerified: firebaseUser.emailVerified,
    role,
    plant,
    tenantId,
    isUniversalAdmin,
    provider: firebaseUser.providerData?.[0]?.providerId || firebaseUser.provider || 'firebase'
  };
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
          const formatted = formatUserProfile(firebaseUser);
          setUser(formatted);
          // Persist user profile to Firestore/Supabase
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
        const formatted = formatUserProfile(fbUser);
        formatted.provider = 'firebase-password';
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
  const registerWithEmail = async ({ email, password, displayName, companyName = 'Empresa Demo', role = 'OPERATOR', plant = '0001 (Planta Central)' }) => {
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

        // Send Email Verification link automatically upon registration
        let verificationSent = false;
        try {
          const actionCodeSettings = {
            url: typeof window !== 'undefined' ? window.location.origin : 'https://operam-erp-enterprise.web.app',
            handleCodeInApp: false
          };
          await sendEmailVerification(fbUser, actionCodeSettings);
          verificationSent = true;
        } catch (vErr) {
          console.warn('[Firebase Auth] No se pudo enviar el correo de verificación inicial:', vErr);
        }

        const formatted = formatUserProfile({
          ...fbUser,
          displayName: displayName || fbUser.displayName,
          companyName: companyName || 'Empresa Demo'
        }, role, plant);
        formatted.tenantId = tenantId;
        formatted.provider = 'firebase-password';

        saveActiveSession(formatted);
        return { success: true, user: formatted, emailVerificationSent: verificationSent };
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

  // Re-send Email Verification Link manually
  const sendVerificationEmail = async (targetUser = null) => {
    setAuthError(null);
    const currentUserToVerify = targetUser || auth?.currentUser;
    if (!currentUserToVerify) {
      return { success: false, error: 'No hay ningún usuario activo para verificar.' };
    }
    try {
      const actionCodeSettings = {
        url: typeof window !== 'undefined' ? window.location.origin : 'https://operam-erp-enterprise.web.app',
        handleCodeInApp: false
      };
      await sendEmailVerification(currentUserToVerify, actionCodeSettings);
      return { success: true };
    } catch (err) {
      console.error('[Firebase Auth] Error al enviar comprobación de correo:', err);
      const errorMsg = mapAuthErrorMessage(err.code) || err.message || 'No se pudo enviar el correo de verificación.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Reload current Firebase user state to check if email was verified
  const reloadUser = async () => {
    if (auth?.currentUser) {
      try {
        await auth.currentUser.reload();
        const updatedFbUser = auth.currentUser;
        const formatted = formatUserProfile(updatedFbUser);
        setUser(formatted);
        upsertDocument('users', updatedFbUser.uid, formatted);
        return { success: true, emailVerified: updatedFbUser.emailVerified };
      } catch (err) {
        console.warn('[Firebase Auth] Error al recargar usuario:', err);
      }
    }
    return { success: false, emailVerified: user?.emailVerified || false };
  };

  // Sign In with Google OAuth Popup
  const loginWithGoogle = async (role = 'MAINTENANCE_MGR', plant = '0001 (Planta Central)') => {
    setAuthError(null);
    try {
      if (auth && isRealFirebaseConfigured) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const formatted = formatUserProfile(fbUser, role, plant);
        formatted.provider = 'google.com';

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

  // Direct Login for Universal Admin (marco.tattersall@gmail.com)
  const loginAsUniversalAdmin = async () => {
    setAuthError(null);
    const adminUser = {
      uid: 'admin-universal-marco-tattersall',
      email: UNIVERSAL_ADMIN_EMAIL,
      displayName: 'Marco Tattersall (Administrador Universal)',
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(UNIVERSAL_ADMIN_EMAIL)}`,
      emailVerified: true,
      role: 'ADMINISTRATOR',
      plant: '0001 (Planta Central)',
      isUniversalAdmin: true,
      provider: 'universal-admin'
    };
    saveActiveSession(adminUser);
    return { success: true, user: adminUser };
  };

  // Real Enterprise Demo Login Helper (Authenticate official demo accounts)
  const loginDemoUser = async (roleKey = 'MAINTENANCE_MGR') => {
    setAuthError(null);
    const demoCredentials = {
      'MAINTENANCE_MGR': { email: 'admin.pm@axomira-erp.com', pass: 'AxomiraEnterprise2026!', name: 'Marco Vidal (Jefe PM)', role: 'MAINTENANCE_MGR', plant: '0001 (Planta Central)' },
      'WAREHOUSE_SPEC': { email: 'almacen.mm@axomira-erp.com', pass: 'AxomiraEnterprise2026!', name: 'Gonzalo Silva (Especialista Almacén)', role: 'WAREHOUSE_SPEC', plant: '0001 (Planta Central)' },
      'PURCHASING_MGR': { email: 'compras.po@axomira-erp.com', pass: 'AxomiraEnterprise2026!', name: 'Patricia Lagos (Gerente Compras)', role: 'PURCHASING_MGR', plant: '0002 (Centro Antofagasta)' }
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

  // Enviar Correo Real de Restablecimiento de Contraseña (Firebase Auth SDK)
  const sendPasswordReset = async (targetEmail) => {
    setAuthError(null);
    if (!targetEmail) return { success: false, error: 'Correo no especificado.' };

    try {
      if (auth && isRealFirebaseConfigured) {
        const actionCodeSettings = {
          url: typeof window !== 'undefined' ? window.location.origin : 'https://operam-erp-enterprise.web.app',
          handleCodeInApp: false
        };
        await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);
        return { success: true };
      }
      return { success: true, simulated: true };
    } catch (err) {
      console.error('[Firebase Auth] Error al enviar correo de restablecimiento:', err);
      let errorMsg = mapAuthErrorMessage(err.code);
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'El correo especificado no se encuentra registrado en Firebase Authentication.';
      } else if (!errorMsg) {
        errorMsg = err.message || 'No se pudo enviar el correo de restablecimiento de contraseña.';
      }
      setAuthError(errorMsg);
      return { success: false, error: errorMsg, code: err.code };
    }
  };

  // Dynamically Switch Active Tenant Context (Multi-Tenancy)
  const switchTenant = (newTenantId) => {
    if (!newTenantId) return;
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, tenantId: newTenantId };
      if (prev.uid) {
        upsertDocument('users', prev.uid, updated);
      }
      return updated;
    });
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
        setAuthError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsUniversalAdmin,
        loginDemoUser,
        sendPasswordReset,
        sendVerificationEmail,
        reloadUser,
        switchTenant,
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
