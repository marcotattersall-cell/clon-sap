import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSAP } from '../../context/SAPContext';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Building2,
  Wrench,
  Package,
  Database,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    authError,
    isRealFirebaseConfigured
  } = useAuth();

  const { setCurrentRole, addToast } = useSAP();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('MAINTENANCE_MGR');
  const [plant, setPlant] = useState('0001 (Planta Central)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setLocalError('Por favor completa el correo y la contraseña.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalError('La contraseña debe contener al menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      setIsSubmitting(false);
      if (res.success) {
        setCurrentRole(res.user.role || role);
        addToast(`Sesión iniciada como: ${res.user.displayName || res.user.email}`, 'success');
        onClose();
      } else {
        setLocalError(res.error);
      }
    } else {
      const res = await registerWithEmail({
        email,
        password,
        displayName,
        role,
        plant
      });
      setIsSubmitting(false);
      if (res.success) {
        setCurrentRole(res.user.role);
        addToast(`Usuario ${res.user.displayName} registrado en Firebase con éxito!`, 'success');
        onClose();
      } else {
        setLocalError(res.error);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError('');
    const res = await loginWithGoogle(role, plant);
    setIsSubmitting(false);
    if (res.success) {
      setCurrentRole(res.user.role);
      addToast(`Autenticado vía Google: ${res.user.displayName}`, 'success');
      onClose();
    } else {
      setLocalError(res.error);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsSubmitting(true);
    const res = await loginWithEmail(demoEmail, 'password123');
    setIsSubmitting(false);
    if (res.success) {
      setCurrentRole(demoRole);
      addToast(`Sesión demo iniciada: ${res.user.displayName}`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="enterprise-card w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative border border-slate-300 dark:border-slate-800">
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-sap-blue flex items-center justify-center font-black text-[10px]">
              OPM
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-slate-100">
                Autenticación Firebase Operam ERP
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {isRealFirebaseConfigured ? 'Conectado a Firebase Cloud Auth' : 'Firebase Demo Mode (Offline Active)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-bold">
          <button
            onClick={() => { setMode('login'); setLocalError(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-sap-blue text-sap-blue bg-white dark:bg-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            onClick={() => { setMode('register'); setLocalError(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-sap-blue text-sap-blue bg-white dark:bg-slate-950'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Usuario</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(localError || authError) && (
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo (Display Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Roberto Gómez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 focus:ring-1 focus:ring-sap-blue focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="usuario@empresa.sap.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 focus:ring-1 focus:ring-sap-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 focus:ring-1 focus:ring-sap-blue focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rol Asignado en el Sistema
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-2 focus:ring-1 focus:ring-sap-blue focus:outline-none"
                >
                  <option value="MAINTENANCE_MGR">Jefe Mantenimiento (PM)</option>
                  <option value="WAREHOUSE_SPEC">Especialista Almacén (MM/WM)</option>
                  <option value="PURCHASING_MGR">Gerente Compras (MM-PUR)</option>
                  <option value="FINANCIAL_DIR">Director Financiero (FI/CO)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Centro de Planta
                </label>
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-2 focus:ring-1 focus:ring-sap-blue focus:outline-none"
                >
                  <option value="0001 (Planta Central)">0001 (Planta Central)</option>
                  <option value="0002 (Planta Norte)">0002 (Planta Norte)</option>
                  <option value="0003 (Almacén Sur)">0003 (Almacén Sur)</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold py-2.5 rounded transition-colors shadow flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{mode === 'login' ? 'Iniciar Sesión en el Sistema' : 'Registrar Nuevo Usuario'}</span>
              </>
            )}
          </button>

          {/* Social Sign-In (Google OAuth) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 rounded transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google Firebase</span>
            </button>
          </div>

          
        </form>
      </div>
    </div>
  );
};
