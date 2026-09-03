import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import AxomiraLogo from '../common/AxomiraLogo';
import {
  Mail,
  Search,
  Bell,
  RefreshCw,
  PlusCircle,
  FileText,
  Package,
  Wrench,
  ChevronDown,
  Layers,
  ShieldAlert,
  Database,
  Building2,
  CheckCircle2,
  LogIn,
  LogOut,
  Users,
  HardHat,
  Star,
  Check,
  X,
  Boxes,
  Activity,
  Zap,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';

export const FioriHeader = ({ onOpenCreateWO, onOpenCreateMaterial, onOpenCreateMIGO, onOpenAuthModal, onOpenCreatePlant, onOpenCreateEmployee, onOpenReportModal }) => {
  const {
    currentRole,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    resetData,
    addToast,
    plants,
    activePlant,
    setActivePlant,
    materials = [],
    workOrders = [],
    employees = [],
    injectMassiveActionSimulation
  } = useSAP();
  const { user, logout, switchTenant, sendVerificationEmail, reloadUser } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isResendingHeaderEmail, setIsResendingHeaderEmail] = useState(false);
  const [isCheckingHeaderEmail, setIsCheckingHeaderEmail] = useState(false);

  // 📡 Network & Offline Queue Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  // 🚀 Lanzador de Apps Cuadrícula (Estilo Odoo + Fiori Launchpad)
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState('');

  const APPS_GRID_ITEMS = [
    {
      key: 'LAUNCHPAD',
      title: 'Home Launchpad',
      subtitle: 'Cockpit Principal ERP',
      slug: 'axomira:home:cockpit',
      alias: '#home',
      tcode: 'SMSM',
      icon: Activity,
      gradient: 'from-slate-700 to-slate-900',
      badge: '#home'
    },
    {
      key: 'WORK_ORDERS',
      title: 'Mantenimiento PM',
      subtitle: 'Órdenes de Trabajo & TECO',
      slug: 'axomira:mantenimiento:ordenes',
      alias: '#mnt-ordenes',
      tcode: 'IW31 / IW32',
      icon: Wrench,
      colorClasses: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: '#mnt-ordenes'
    },
    {
      key: 'INVENTORY',
      title: 'Inventario & Stock',
      subtitle: 'Maestro de Materiales',
      slug: 'axomira:inventario:materiales',
      alias: '#inv-materiales',
      tcode: 'MM01 / MM03',
      icon: Boxes,
      colorClasses: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      badge: '#inv-materiales'
    },
    {
      key: 'MIGO',
      title: 'Movimientos de Stock',
      subtitle: 'Salidas 261 y Entradas 101',
      slug: 'axomira:inventario:movimientos',
      alias: '#inv-mov',
      tcode: 'MIGO',
      icon: Package,
      colorClasses: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badge: '#inv-mov'
    },
    {
      key: 'ASSETS',
      title: 'Maestro Activos',
      subtitle: 'Jerarquía & IoT Telemetría',
      slug: 'axomira:flota:activos',
      alias: '#flota-activos',
      tcode: 'IE01 / IE03',
      icon: Layers,
      colorClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: '#flota-activos'
    },
    {
      key: 'FLEET',
      title: 'Gestión de Flota',
      subtitle: 'Maquinaria & Vencimientos',
      slug: 'axomira:flota:vencimientos',
      alias: '#flota-vencimientos',
      tcode: 'FLEET',
      icon: Building2,
      colorClasses: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      badge: '#flota-vencimientos'
    },
    {
      key: 'ANALYTICS',
      title: 'Executive Analytics',
      subtitle: 'Costos CO/FI & KPIs Planta',
      slug: 'axomira:analitica:costos',
      alias: '#analitica-costos',
      tcode: 'S_ALR',
      icon: Database,
      colorClasses: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      badge: '#analitica-costos'
    },
    {
      key: 'HR',
      title: 'Recursos Humanos',
      subtitle: 'Ficha de Personal & HCM',
      slug: 'axomira:rrhh:personal',
      alias: '#rrhh-personal',
      tcode: 'PA30 / PA20',
      icon: HardHat,
      colorClasses: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      badge: '#rrhh-personal'
    },
    {
      key: 'USER_MGMT',
      title: 'Usuarios & Tenants',
      subtitle: 'Gestión & Matriz RBAC',
      slug: 'axomira:admin:usuarios',
      alias: '#admin-usuarios',
      tcode: 'SU01 / SU10',
      icon: Users,
      colorClasses: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badge: '#admin-usuarios'
    }
  ];

  // Global Cmd+K / Ctrl+K Listener
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAppLauncherOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ⭐ Mis Accesos Favoritos (Personalización Directa en la Barra Principal)
  const FAVORITES_STORAGE_KEY = 'sap_user_favorite_tabs';

  const ALL_TAB_CONFIG = {
    LAUNCHPAD: { title: 'Launchpad', icon: Activity, desc: 'Cockpit principal (axomira:home:cockpit)', slug: 'axomira:home:cockpit', alias: '#home' },
    WORK_ORDERS: { title: 'Órdenes (#mnt-ordenes)', icon: Wrench, desc: 'Órdenes PM (axomira:mantenimiento:ordenes)', slug: 'axomira:mantenimiento:ordenes', alias: '#mnt-ordenes' },
    ASSETS: { title: 'Activos (#flota-activos)', icon: Layers, desc: 'Jerarquía de equipos (axomira:flota:activos)', slug: 'axomira:flota:activos', alias: '#flota-activos' },
    FLEET: { title: 'Flota (#flota-vencimientos)', icon: Building2, desc: 'Maquinaria (axomira:flota:vencimientos)', slug: 'axomira:flota:vencimientos', alias: '#flota-vencimientos' },
    INVENTORY: { title: 'Inventario (#inv-materiales)', icon: Boxes, desc: 'Materiales (axomira:inventario:materiales)', slug: 'axomira:inventario:materiales', alias: '#inv-materiales' },
    MIGO: { title: 'Movimientos (#inv-mov)', icon: Package, desc: 'Entradas/Salidas (axomira:inventario:movimientos)', slug: 'axomira:inventario:movimientos', alias: '#inv-mov' },
    ANALYTICS: { title: 'Analytics (#analitica-costos)', icon: Database, desc: 'Executive Analytics (axomira:analitica:costos)', slug: 'axomira:analitica:costos', alias: '#analitica-costos' },
    HR: { title: 'Recursos Humanos (#rrhh-personal)', icon: HardHat, desc: 'Ficha personal (axomira:rrhh:personal)', slug: 'axomira:rrhh:personal', alias: '#rrhh-personal' },
    USER_MGMT: { title: '🏢 Dashboard Clientes', icon: Building2, desc: 'Dashboard Global de Clientes & Usuarios', slug: 'axomira:admin:usuarios', alias: '#admin-usuarios' }
  };


  const [favoriteTabs, setFavoriteTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error al cargar favoritos:', e);
    }
    return ['LAUNCHPAD', 'WORK_ORDERS', 'ASSETS', 'FLEET', 'MIGO', 'USER_MGMT'];
  });

  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [draftFavorites, setDraftFavorites] = useState(favoriteTabs);

  const handleToggleDraftFavorite = (tabKey) => {
    setDraftFavorites(prev => {
      if (prev.includes(tabKey)) {
        if (prev.length <= 1) {
          addToast('Debes mantener al menos 1 acceso directo en la barra.', 'warning');
          return prev;
        }
        return prev.filter(k => k !== tabKey);
      } else {
        return [...prev, tabKey];
      }
    });
  };

  const handleSaveFavorites = () => {
    setFavoriteTabs(draftFavorites);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(draftFavorites));
    } catch (e) {
      console.warn('Error guardando favoritos:', e);
    }
    setIsFavModalOpen(false);
    addToast('⭐ Barra de accesos principales personalizada exitosamente.', 'success');
  };

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setPendingQueueCount(0);
      addToast('🌐 Conexión Cloud restablecida. Transacciones sincronizadas.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setPendingQueueCount(4);
      addToast('📡 Modo Offline Activado: Transacciones en cola local (IndexedDB).', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = () => {
    if (navigator.onLine) {
      setIsOnline(true);
      setPendingQueueCount(0);
      addToast('⚡ Sincronización Cloud realizada con éxito. Todos los datos están en línea.', 'success');
    } else {
      addToast('📡 Sigues en modo offline. Los datos se enviarán cuando retorne la conexión.', 'warning');
    }
  };

  React.useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        addToast('¡App Nativa instalada con éxito en tu dispositivo!', 'success');
      }
      setDeferredPrompt(null);
    } else {
      addToast('💡 Para instalar la App Nativa: En Mac abre Safari/Chrome y selecciona "Instalar Aplicación". En Android selecciona "Añadir a Pantalla de Inicio".', 'info');
    }
  };

  // Helper for computing days to expiration
  const getDaysToExpiry = (dateStr) => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Compute urgent alerts for notification panel
  const lowStockItems = materials.filter(m => m.stock <= m.reorderPoint);
  const criticalWorkOrders = workOrders.filter(w => w.priority === 'Muy Alta' && w.status !== 'TECO' && w.status !== 'CLSD');
  const complianceAlertEmployees = employees.filter(e => {
    const medDays = getDaysToExpiry(e.medicalExamExpiry);
    const accDays = getDaysToExpiry(e.accreditationExpiry);
    const safDays = getDaysToExpiry(e.safetyCourseExpiry);
    const ctrDays = (e.contractType === 'Plazo Fijo' && e.contractExpiry) ? getDaysToExpiry(e.contractExpiry) : 999;
    return medDays <= 30 || accDays <= 30 || safDays <= 30 || ctrDays <= 30;
  });

  const totalAlertsCount = lowStockItems.length + criticalWorkOrders.length + complianceAlertEmployees.length;

  const filteredAppsGrid = APPS_GRID_ITEMS.filter(app => {
    if (!launcherSearch.trim()) return true;
    const q = launcherSearch.toLowerCase();
    return (
      app.title.toLowerCase().includes(q) ||
      app.subtitle.toLowerCase().includes(q) ||
      (app.slug && app.slug.toLowerCase().includes(q)) ||
      (app.alias && app.alias.toLowerCase().includes(q)) ||
      app.tcode.toLowerCase().includes(q)
    );
  });

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200 shadow-sm w-full">
      {/* 📧 Unverified Email Warning Banner */}
      {user && !user.emailVerified && user.provider === 'firebase-password' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-amber-600 shadow-inner">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
            <span>
              ⚠️ Tu correo electrónico (<strong>{user.email}</strong>) aún no ha sido verificado. Por favor revisa tu bandeja de entrada o spam.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={async () => {
                setIsCheckingHeaderEmail(true);
                const res = await reloadUser();
                setIsCheckingHeaderEmail(false);
                if (res.emailVerified) {
                  addToast('🎉 ¡Correo electrónico verificado con éxito!', 'success');
                } else {
                  addToast('El correo electrónico aún no aparece como verificado.', 'info');
                }
              }}
              disabled={isCheckingHeaderEmail}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 text-[11px] font-extrabold px-3 py-1 rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              {isCheckingHeaderEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Comprobar Estado</span>
            </button>

            <button
              onClick={async () => {
                setIsResendingHeaderEmail(true);
                const res = await sendVerificationEmail();
                setIsResendingHeaderEmail(false);
                if (res.success) {
                  addToast(`✉️ Enlace de comprobación enviado nuevamente a ${user.email}`, 'success');
                } else {
                  addToast(res.error || 'No se pudo enviar el correo de verificación.', 'error');
                }
              }}
              disabled={isResendingHeaderEmail}
              className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-extrabold px-3 py-1 rounded-lg shadow transition-all"
            >
              {isResendingHeaderEmail ? 'Enviando...' : 'Reenviar Enlace'}
            </button>
          </div>
        </div>
      )}

      {/* Top System Status Ribbon */}
      <div className="bg-slate-100 px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs text-slate-600 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-emerald-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">Enterprise Cloud ERP 2026</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="hidden md:flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Centro Operativo:</span>
            <select
              value={activePlant?.id || ''}
              onChange={(e) => {
                const found = plants.find(p => p.id === e.target.value);
                if (found) {
                  setActivePlant(found);
                  addToast(`Centro activo cambiado a ${found.id} - ${found.name}`, 'info');
                }
              }}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sap-blue cursor-pointer"
            >
              {plants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} ({p.name})
                </option>
              ))}
            </select>
            <button
              onClick={onOpenCreatePlant}
              className="bg-sap-blue/10 hover:bg-sap-blue text-sap-blue hover:text-white font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all"
              title="Crear nuevo centro de operaciones"
            >
              + Crear Centro
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* 📡 Network & Offline Sync Status Indicator */}
          {isOnline && pendingQueueCount === 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              <span>En Línea (Sincronizado)</span>
            </span>
          ) : (
            <div className="inline-flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                <span>Modo Offline: {pendingQueueCount} pendientes</span>
              </span>
              <button
                onClick={handleManualSync}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded text-[11px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                title="Forzar sincronización de datos con Cloud Firestore"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sincronizar</span>
              </button>
            </div>
          )}

          <button
            onClick={injectMassiveActionSimulation}
            title="Inyectar 25 transacciones masivas de prueba en vivo"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm animate-pulse"
          >
            <Zap className="w-3 h-3 text-white" />
            <span>+25 Transacciones</span>
          </button>

          <button
            onClick={resetData}
            title="Limpiar todos los datos de la aplicación"
            className="hover:text-amber-600 flex items-center gap-1 transition-colors text-xs text-slate-500 font-medium"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Limpiar Datos</span>
          </button>
        </div>
      </div>

      {/* Main Fiori Header (Single Unified Navigation Bar) */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: SAP Shell Brand, App Grid Launcher & Personalized Nav Bar */}
        <div className="flex items-center space-x-3">
          
          {/* ⠿ BOTÓN LANZADOR DE APPS ESTILO ODOO (Cmd+K) */}
          <button
            onClick={() => setIsAppLauncherOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-sap-blue hover:text-white text-slate-700 transition-all border border-slate-200 shadow-sm flex items-center space-x-1.5 cursor-pointer group"
            title="Abrir Lanzador de Aplicaciones (Atajo: Cmd+K / Ctrl+K)"
          >
            <LayoutGrid className="w-5 h-5 text-sap-blue group-hover:text-white transition-colors" />
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider bg-slate-200 group-hover:bg-white/20 group-hover:text-white text-slate-700 px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LAUNCHPAD')}
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <AxomiraLogo variant="icon" className="w-8 h-8 text-slate-900 group-hover:scale-105 transition-transform" />
            <div className="text-left leading-tight hidden xs:block">
              <div className="font-extrabold text-sm tracking-tight text-slate-900 group-hover:text-sap-blue transition-colors font-mono">
                AXOMIRA ERP
              </div>
              <div className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                {activeTab === 'LAUNCHPAD' ? 'Cloud Platform' : `Módulo: ${activeTab}`}
              </div>
            </div>
          </button>

          {/* ⭐ Unified Custom Favorites Navigation Bar */}
          <nav className="hidden lg:flex items-center space-x-1 pl-2 xl:pl-4 border-l border-slate-200">
            {favoriteTabs.map(tabKey => {
              const config = ALL_TAB_CONFIG[tabKey];
              if (!config) return null;

              if (currentRole === 'FIELD_MECHANIC' && ['INVENTORY', 'MIGO', 'ANALYTICS', 'HR', 'USER_MGMT'].includes(tabKey)) {
                return null;
              }

              const isActive = activeTab === tabKey;

              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all flex items-center space-x-1 ${
                    isActive
                      ? 'bg-sap-blue text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold'

                  }`}
                  title={config.desc}
                >
                  <span>{config.title}</span>
                  {tabKey === 'HR' && complianceAlertEmployees.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                      {complianceAlertEmployees.length}
                    </span>
                  )}
                </button>
              );
            })}

            {/* ⭐ Customizer Button at the end of Nav */}
            <button
              onClick={() => {
                setDraftFavorites(favoriteTabs);
                setIsFavModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all cursor-pointer ml-1"
              title="⭐ Personalizar Accesos Favoritos de la Barra Superior"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </button>
          </nav>
        </div>

        {/* Middle: Universal Search Bar */}
        <div className="flex-1 max-w-xs xl:max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el Sistema (N° OT, SKU Material, Empleado, RUT, Pedido PO...)"
              className="w-full bg-slate-100 text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sap-blue focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Actions, Firebase User & Auth Controls */}
        <div className="flex items-center space-x-2">

          {/* Quick Action Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Acción</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showQuickActions && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setShowQuickActions(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Crear Registro Rápido
                </div>
                <button
                  onClick={() => { setShowQuickActions(false); if (onOpenReportModal) onOpenReportModal(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-semibold border-b border-slate-100 text-sky-700 bg-sky-50/50"
                >
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Generar Reporte BI (PDF / Excel)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateEmployee(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Alta Colaborador (#rrhh-personal)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateWO(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Nueva Orden de Trabajo (#mnt-ordenes)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateMIGO(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Package className="w-4 h-4 text-sky-600" />
                  <span>Registrar Movimiento (#inv-mov)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateMaterial(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Crear Material (#inv-materiales)</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 relative transition-colors border border-slate-200"
            >
              <Bell className="w-4 h-4" />
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Alertas del Sistema ({totalAlertsCount})
                  </span>
                  <span className="text-[10px] text-slate-500">En Vivo</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {complianceAlertEmployees.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => { setActiveTab('HR'); setShowNotifications(false); }}
                      className="p-3 hover:bg-amber-50/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <HardHat className="w-3.5 h-3.5 text-amber-600" />
                          ACREDITACIÓN FAENA
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                          {emp.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{emp.name}</p>
                      <p className="text-[10px] text-amber-700 mt-0.5 font-mono">
                        Vencimientos próximos en exámenes médicos o acreditaciones.
                      </p>
                    </div>
                  ))}

                  {lowStockItems.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setActiveTab('INVENTORY'); setShowNotifications(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-900 font-bold mb-1">
                        <span>STOCK CRÍTICO REORDEN</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">
                          {m.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{m.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Stock Actual: <strong className="text-rose-600">{m.stock} UN</strong></span>
                        <span>Punto Reorden: {m.reorderPoint} UN</span>
                      </div>
                    </div>
                  ))}

                  {criticalWorkOrders.map(w => (
                    <div
                      key={w.id}
                      onClick={() => { setActiveTab('WORK_ORDERS'); setShowNotifications(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-900 font-bold mb-1">
                        <span className="text-rose-600 font-extrabold">ORDEN MUY ALTA PRIORIDAD</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                          {w.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{w.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Controls */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="w-7 h-7 rounded-full bg-sap-blue text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden xl:inline max-w-[120px] truncate">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar / Registrar</span>
              </button>
            )}

            {showUserMenu && user && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.displayName || 'Usuario ERP'}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-800 rounded font-mono">
                      {user.isUniversalAdmin ? 'ADMINISTRATOR (SAP_ALL)' : (user.role || 'Usuario Corporativo')}
                    </span>
                  </div>
                </div>

                {/* Conmutador de Tenant Contextual (Multi-Tenancy) */}
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                    <span>🏢 Tenant Activo:</span>
                    <span className="font-mono text-sap-blue font-bold">{user.tenantId || 'tenant_demo'}</span>
                  </div>
                  <select
                    value={user.tenantId || 'tenant_demo'}
                    onChange={(e) => {
                      if (typeof switchTenant === 'function') {
                        switchTenant(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sap-blue cursor-pointer"
                  >
                    <option value="tenant_demo">Demo Enterprise (DEMO)</option>
                    <option value="tenant_codelco">CODELCO Chile (El Teniente / Chuqui)</option>
                    <option value="tenant_bhp">BHP Billiton (Escondida)</option>
                    <option value="tenant_collahuasi">Minera Collahuasi</option>
                    <option value="tenant_antofagasta_minerals">Antofagasta Minerals (AMSA)</option>
                  </select>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ⠿ MODAL LANZADOR DE APPS CUADRÍCULA (ESTILO ODOO + FIORI LAUNCHPAD) */}
      {isAppLauncherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-hidden">
            {/* Header Modal & Search */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sap-blue/20 text-sap-blue border border-sap-blue/30">
                  <LayoutGrid className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Lanzador de Módulos & Transacciones (App Launcher)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Atajo global de teclado: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-mono text-[10px]">Cmd+K</kbd>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAppLauncherOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={launcherSearch}
                onChange={(e) => setLauncherSearch(e.target.value)}
                placeholder="Buscar comando, slug o hashtag (ej. axomira:inventario:movimientos, #inv-mov, MIGO)..."


                className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-xl pl-10 pr-9 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sap-blue focus:border-transparent transition-all"
              />
              {launcherSearch && (
                <button
                  onClick={() => setLauncherSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Grid of Colorful App Tiles (Odoo Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredAppsGrid.map(app => {
                const IconComp = app.icon;
                const isActive = activeTab === app.key;

                return (
                  <button
                    key={app.key}
                    onClick={() => {
                      setActiveTab(app.key);
                      setIsAppLauncherOpen(false);
                      addToast(`🚀 Módulo ${app.title} (${app.slug}) activado.`, 'info');
                    }}
                    className={`group relative p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between h-34 ${
                      isActive
                        ? 'ring-2 ring-sky-400 border-sky-400 scale-[1.02] bg-slate-800'
                        : 'border-slate-800 hover:border-slate-700 hover:scale-[1.02] bg-slate-900/90'
                    } shadow-md`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-xl border ${app.colorClasses}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-sky-950 text-sky-300 px-2 py-0.5 rounded-md border border-sky-800/50">
                        {app.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-slate-100 group-hover:text-sky-400 transition-colors flex items-center justify-between">
                        <span>{app.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                        {app.subtitle}
                      </p>
                      <span className="inline-block mt-1 text-[9px] text-sky-400/90 font-mono">
                        {app.slug}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-3">
              <span>9 Módulos Enterprise Activos</span>
              <span>Presiona <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">ESC</kbd> para cerrar</span>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ MODAL PERSONALIZADOR DE FAVORITOS */}
      {isFavModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-base font-black text-slate-900">
                  Personalizar Barra de Accesos Directos (Fiori Bar)
                </h3>
              </div>
              <button
                onClick={() => setIsFavModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Selecciona los módulos a los que accedes habitualmente para mantener la barra superior limpia, rápida y personalizada:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-h-80 overflow-y-auto">
              {Object.entries(ALL_TAB_CONFIG).map(([tabKey, config]) => {
                const isSelected = draftFavorites.includes(tabKey);
                const IconComp = config.icon;

                return (
                  <div
                    key={tabKey}
                    onClick={() => handleToggleDraftFavorite(tabKey)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-sap-blue/60 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-sap-blue text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{config.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-sap-blue stroke-[3]" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {config.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFavModalOpen(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFavorites}
                className="w-1/2 bg-sap-blue hover:bg-sap-blue-hover text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Accesos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
