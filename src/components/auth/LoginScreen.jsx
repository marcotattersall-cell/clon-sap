import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSAP } from '../../context/SAPContext';
import {
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
  UserPlus,
  ArrowRight,
  Globe,
  Layers
} from 'lucide-react';

export const LoginScreen = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginDemoUser,
    authError
  } = useAuth();

  const { setCurrentRole, addToast } = useSAP();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('MAINTENANCE_MGR');
  const [plant, setPlant] = useState('0001 (Planta Central)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError('');
    const res = await loginWithGoogle(role, plant);
    setIsSubmitting(false);
    if (res.success) {
      setCurrentRole(res.user.role || role);
      addToast(`Bienvenido a Operam ERP Industrial: ${res.user.displayName}`, 'success');
    } else {
      setLocalError(res.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setLocalError('Por favor ingresa tu correo y contraseña corporativos.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      setIsSubmitting(false);
      if (res.success) {
        setCurrentRole(res.user.role || role);
        addToast(`Sesión iniciada como: ${res.user.displayName || res.user.email}`, 'success');
      } else {
        setLocalError(res.error);
      }
    } else {
      const res = await registerWithEmail({
        email,
        password,
        displayName,
        companyName: companyName || 'Empresa Demo',
        role,
        plant
      });
      setIsSubmitting(false);
      if (res.success) {
        setCurrentRole(res.user.role);
        addToast(`Usuario de ${companyName || 'Empresa Demo'} registrado con éxito: ${res.user.displayName}`, 'success');
      } else {
        setLocalError(res.error);
      }
    }
  };

  const handleQuickDemoLogin = async (roleKey) => {
    setIsSubmitting(true);
    setLocalError('');
    const res = await loginDemoUser(roleKey);
    setIsSubmitting(false);
    if (res.success) {
      setCurrentRole(res.user.role);
      addToast(`Acceso Demo Autenticado: ${res.user.displayName}`, 'success');
    } else {
      setLocalError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-sap-blue selection:text-white relative overflow-hidden">
      {/* Background Subtle SAP Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Top Enterprise Brand Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <img
            src="/favicon.svg"
            alt="Operam ERP Logo"
            className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1 border border-slate-700 shadow"
          />
          <div>
            <div className="font-extrabold text-sm text-slate-100 tracking-tight">
              Enterprise ERP Cloud Platform
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Portal de Acceso Seguro</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Proyecto: enterprise-erp-2026</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
          <span className="bg-sky-950 text-sky-400 border border-sky-800 px-2.5 py-1 rounded font-bold">
            Tema: Compact Enterprise Grid
          </span>
          <span className="text-slate-600">|</span>
          <span>Planta Central 0001</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="enterprise-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
          
          {/* Card Top Title Banner */}
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800 text-center relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 p-2 mb-3 shadow-lg border border-slate-700">
              <img src="/favicon.svg" alt="Operam ERP Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-100">
              Autenticación Operam ERP
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Inicia sesión con tu cuenta corporativa de Google o credenciales de acceso para entrar al sistema.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* 🔴 PROMINENT GOOGLE SIGN IN BUTTON AT THE VERY TOP */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Método Recomendado
              </label>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 group transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="font-extrabold text-sm">Iniciar Sesión con Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Error Banner */}
              {(localError || authError) && (
                <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError || authError}</span>
                </div>
              )}

              {/* Direct 1-Click Instant Demo Roles */}
              <div className="space-y-1.5 mt-2">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                  ⚡ Acceso Rápido Autenticado (Demo Roles)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('MAINTENANCE_MGR')}
                    className="bg-sky-900/40 hover:bg-sky-800/60 border border-sky-700/60 text-sky-200 p-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]"
                  >
                    <Wrench className="w-4 h-4 mb-1 text-sky-400" />
                    <span>Jefe PM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('WAREHOUSE_SPEC')}
                    className="bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/60 text-amber-200 p-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]"
                  >
                    <Package className="w-4 h-4 mb-1 text-amber-400" />
                    <span>Almacén MM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('PURCHASING_MGR')}
                    className="bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/60 text-emerald-200 p-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]"
                  >
                    <Building2 className="w-4 h-4 mb-1 text-emerald-400" />
                    <span>Compras PO</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                O ingresa con tu correo corporativo
              </span>
            </div>

            {/* Tab Selector: Iniciar Sesión vs Registro */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-lg p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); setLocalError(''); }}
                className={`flex-1 py-2 rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-sap-blue shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setLocalError(''); }}
                className={`flex-1 py-2 rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-800 text-sap-blue shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Cuenta</span>
              </button>
            </div>

            {/* Error Banner */}
            {(localError || authError) && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{localError || authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Ing. Roberto Gómez"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Empresa / Organización (SaaS Multi-Tenant)</span>
                      <span className="text-[10px] text-sap-blue font-mono font-bold">Aislamiento Total</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Constructora del Norte SpA"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="carlos.ruiz@sap.enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none"
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
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none"
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
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-sap-blue focus:outline-none"
                    >
                      <option value="MAINTENANCE_MGR">Jefe Mantenimiento (PM)</option>
                      <option value="WAREHOUSE_SPEC">Especialista Almacén (MM/WM)</option>
                      <option value="PURCHASING_MGR">Gerente Compras (MM-PUR)</option>
                      <option value="FINANCIAL_DIR">Director Financiero (FI/CO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Planta Operativa
                    </label>
                    <select
                      value={plant}
                      onChange={(e) => setPlant(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-sap-blue focus:outline-none"
                    >
                      <option value="0001 (Planta Central)">0001 (Planta Central)</option>
                      <option value="0002 (Planta Norte)">0002 (Planta Norte)</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{mode === 'login' ? 'Ingresar al Sistema Enterprise ERP' : 'Registrar Nuevo Usuario en Firebase'}</span>
                  </>
                )}
              </button>
            </form>

            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 relative z-10 border-t border-slate-900">
        Enterprise Cloud ERP 2026 • Firebase Auth Protected • Planta Central 0001
      </footer>
    </div>
  );
};
