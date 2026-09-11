import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSAP } from '../../context/SAPContext';
import AxomiraLogo from '../common/AxomiraLogo';
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
  Layers,
  Send,
  RefreshCw,
  Check
} from 'lucide-react';

export const LoginScreen = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    confirmOTPCode,
    resendOTPCode,
    loginWithGoogle,
    loginAsUniversalAdmin,
    loginDemoUser,
    sendVerificationEmail,
    reloadUser,
    authError,
    setAuthError
  } = useAuth();

  const { setCurrentRole, addToast, setActiveTab } = useSAP();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('MAINTENANCE_MGR');
  const [plant, setPlant] = useState('0001 (Planta Central)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Email verification & OTP state
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [activeOTPCode, setActiveOTPCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  React.useEffect(() => {
    setLocalError('');
    if (setAuthError) setAuthError(null);
  }, [mode, setAuthError]);

  React.useEffect(() => {
    let timer;
    if (showVerificationNotice && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showVerificationNotice, otpCountdown]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (localError) setLocalError('');
    if (authError && setAuthError) setAuthError(null);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (localError) setLocalError('');
    if (authError && setAuthError) setAuthError(null);
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const cleanDigit = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);
    if (localError) setLocalError('');

    if (cleanDigit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      if (localError) setLocalError('');
      const targetIndex = Math.min(pasted.length, 5);
      const targetInput = document.getElementById(`otp-input-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleConfirmOTP = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setLocalError('Por favor ingresa los 6 dígitos del código de verificación.');
      return;
    }

    setVerifyingOTP(true);
    setLocalError('');
    const res = await confirmOTPCode(registeredEmail || email, code);
    setVerifyingOTP(false);

    if (res.success) {
      addToast('🎉 ¡Código OTP verificado exitosamente! Bienvenido a AXOMIRA ERP.', 'success');
      setShowVerificationNotice(false);
      setActiveTab('LAUNCHPAD');
    } else {
      setLocalError(res.error || 'El código ingresado es incorrecto.');
    }
  };

  const handleRequestNewOTP = async () => {
    setResendingEmail(true);
    setLocalError('');
    const res = await resendOTPCode(registeredEmail || email, displayName || 'Usuario ERP');
    setResendingEmail(false);
    if (res.success) {
      setActiveOTPCode(res.code);
      setOtpCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      addToast(`✉️ Nuevo código OTP de 6 dígitos enviado a ${registeredEmail || email}`, 'success');
    } else {
      setLocalError(res.error || 'No se pudo reenviar el código OTP.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError('');
    const res = await loginWithGoogle(role, plant);
    setIsSubmitting(false);
    if (res.success) {
      setCurrentRole(res.user.role || role);
      setActiveTab('LAUNCHPAD');
      addToast(`Bienvenido a AXOMIRA INTELLIGENT CLOUD ERP: ${res.user.displayName}`, 'success');
    } else {
      setLocalError(res.error);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    const res = await sendVerificationEmail();
    setResendingEmail(false);
    if (res.success) {
      addToast(`✉️ Correo de verificación reenviado con éxito a ${registeredEmail || email}`, 'success');
    } else {
      addToast(res.error || 'No se pudo reenviar el correo de verificación.', 'error');
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    const res = await reloadUser();
    setCheckingVerification(false);
    if (res.emailVerified) {
      addToast('🎉 ¡Excelente! Tu correo electrónico ha sido verificado correctamente.', 'success');
      setShowVerificationNotice(false);
    } else {
      addToast('El correo aún no aparece como verificado. Por favor revisa la liga en tu correo o intenta reenviarlo.', 'info');
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
        setActiveTab('LAUNCHPAD');
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
        setRegisteredEmail(email);
        setActiveOTPCode(res.otpCode || '');
        setShowVerificationNotice(true);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpCountdown(60);
        addToast(`¡Cuenta registrada! Revisa el código OTP de 6 dígitos enviado a ${email}`, 'success');
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
      setActiveTab('LAUNCHPAD');
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
          <AxomiraLogo variant="horizontal" dark className="h-9" />
          <div className="border-l border-slate-700/80 pl-3">
            <div className="font-extrabold text-xs text-slate-200 tracking-tight">
              AXOMIRA Intelligent Cloud ERP
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Portal de Acceso Seguro</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Proyecto: clon-sap-2026</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
          <button
            onClick={() => setActiveTab('LANDING')}
            className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver Landing Page</span>
          </button>
          <span className="text-slate-600">|</span>
          <span>Planta Central 0001</span>
        </div>
      </header>

      {/* Central Login & OTP Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-6">
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header Bar inside card */}
          <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold text-xs tracking-wider text-slate-200 uppercase">
                {showVerificationNotice ? 'Verificación OTP Requerida' : 'Autenticación Única (SSO / SAML)'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
              v4.0 Live
            </span>
          </div>

          <div className="p-6 space-y-5">
            {showVerificationNotice ? (
              <form onSubmit={handleConfirmOTP} className="space-y-5 text-center animate-in fade-in zoom-in-95 py-2">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-xl shadow-sky-950/30">
                  <Lock className="w-8 h-8 animate-pulse text-sky-400" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">
                    Seguridad Corporativa de 2 Factores (2FA / OTP)
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-slate-100">
                    Ingresa el Código de 6 Dígitos
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Hemos enviado un código de verificación de 6 dígitos a tu correo:
                  </p>
                  <div className="inline-block bg-slate-800 text-sky-300 font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 mt-1 shadow-inner">
                    {registeredEmail || email}
                  </div>
                </div>

                {/* Badge de demostración rápida para facilitar pruebas */}
                {activeOTPCode && (
                  <div className="p-3 bg-sky-950/60 border border-sky-800/80 rounded-xl text-xs space-y-1 text-sky-200 animate-in fade-in">
                    <div className="flex items-center justify-center space-x-1.5 font-bold text-emerald-400">
                      <Mail className="w-4 h-4" />
                      <span>✉️ Simulación de Correo Transaccional ERP</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Tu código OTP de 6 dígitos es: <strong className="text-sky-300 font-mono text-sm tracking-widest px-2 py-0.5 bg-slate-900 rounded border border-sky-500/40 select-all">{activeOTPCode}</strong>
                    </p>
                  </div>
                )}

                {/* 6 Casillas Numéricas para Ingreso de Código OTP */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Copia o escribe el código (puedes pegar Ctrl+V / Cmd+V)
                  </label>
                  <div className="flex justify-center items-center space-x-2 sm:space-x-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 sm:w-11 sm:h-12 text-center text-xl font-black font-mono bg-slate-950 border border-slate-700 text-sky-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 rounded-xl outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {localError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-center justify-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{localError}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={verifyingOTP}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center space-x-2 border border-emerald-400/30 cursor-pointer disabled:opacity-50"
                  >
                    {verifyingOTP ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    <span className="text-sm font-extrabold">Verificar y Acceder al ERP</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendingEmail || otpCountdown > 0}
                    onClick={handleRequestNewOTP}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
                  >
                    {resendingEmail ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {resendingEmail
                        ? 'Generando código...'
                        : otpCountdown > 0
                        ? `Reenviar nuevo código (${otpCountdown}s)`
                        : 'Reenviar nuevo código de 6 dígitos'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowVerificationNotice(false); setMode('login'); setLocalError(''); }}
                    className="w-full text-slate-400 hover:text-slate-200 text-xs py-1 transition-colors font-medium cursor-pointer"
                  >
                    ← Volver al Menú de Ingreso
                  </button>
                </div>
              </form>
            ) : (
              <>
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
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-extrabold text-sm">Iniciar Sesión con Google</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (loginAsUniversalAdmin) {
                        const res = await loginAsUniversalAdmin();
                        if (res.success) {
                          setCurrentRole('ADMINISTRATOR');
                          setActiveTab('LAUNCHPAD');
                          addToast(`⚡ Sesión iniciada como Administrador Universal: ${res.user.email}`, 'success');
                        }
                      }
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 border border-amber-400/40 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Entrar como Administrador Universal</span>
                  </button>
                </div>

                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-lg p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setLocalError(''); if (setAuthError) setAuthError(null); }}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center space-x-1.5 transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-800 text-sap-blue shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Ingresar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setLocalError(''); if (setAuthError) setAuthError(null); }}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center space-x-1.5 transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-800 text-sap-blue shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear Cuenta</span>
                  </button>
                </div>

                {(localError || authError) && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span className="font-medium leading-relaxed">{localError || authError}</span>
                    </div>
                    {(localError || authError)?.includes('Dominio no autorizado') && (
                      <div className="mt-2 pt-2 border-t border-rose-800/80 text-[11px] text-rose-300 space-y-1 font-mono">
                        <p className="font-bold text-amber-300">💡 Pasos para solucionar en Firebase Console:</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-300">
                          <li>Abre la <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-sky-400 font-bold">Firebase Console</a>.</li>
                          <li>Selecciona el proyecto <strong>clon-sap-2026</strong>.</li>
                          <li>Ir a <strong>Authentication ➔ Settings ➔ Authorized Domains</strong>.</li>
                          <li>Haz clic en <strong>Agregar Dominio</strong> e ingresa: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-bold">operam-erp-enterprise.web.app</code>.</li>
                        </ol>
                        <p className="text-slate-400 pt-1">💡 Mientras tanto, puedes usar el botón <strong>"Entrar como Administrador Universal"</strong> para ingresar inmediatamente.</p>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" required placeholder="Ej. Ing. Roberto Gómez" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Empresa / Organización</label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" required placeholder="Ej. Constructora del Norte SpA" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none font-semibold" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" required placeholder="carlos.ruiz@axomira-erp.com" value={email} onChange={handleEmailChange} className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="password" required placeholder="••••••••" value={password} onChange={handlePasswordChange} className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-sap-blue focus:outline-none" />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-900 dark:text-sky-200 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>Comprobación por Correo Electrónico</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          Al crear tu cuenta, enviaremos automáticamente un correo con un enlace de verificación para activar el acceso seguro.
                        </p>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2">
                    {isSubmitting ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        <span>{mode === 'login' ? 'Ingresar al Sistema Enterprise ERP' : 'Registrar Cuenta y Enviar Correo de Verificación'}</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
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
