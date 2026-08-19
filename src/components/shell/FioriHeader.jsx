import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  UserCheck,
  RefreshCw,
  PlusCircle,
  Package,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Layers,
  ShieldAlert,
  Database,
  Building2,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  KeyRound,
  Download,
  Smartphone,
  Users,
  HardHat
} from 'lucide-react';

export const FioriHeader = ({ onOpenCreateWO, onOpenCreateMaterial, onOpenCreateMIGO, onOpenAuthModal, onOpenCreatePlant, onOpenCreateEmployee }) => {
  const {
    currentRole,
    setCurrentRole,
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
    employees = []
  } = useSAP();
  const { user, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 📡 Network & Offline Queue Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

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

  const roleLabels = {
    FIELD_MECHANIC: { title: 'Mecánico de Terreno (Operativo)', icon: Wrench, color: 'text-orange-500' },
    MAINTENANCE_MGR: { title: 'Jefe de Mantenimiento (PM)', icon: Wrench, color: 'text-amber-500' },
    WAREHOUSE_SPEC: { title: 'Especialista de Almacén (MM)', icon: Package, color: 'text-blue-500' },
    FLEET_MGR: { title: 'Encargado de Flota y Maquinaria', icon: Building2, color: 'text-purple-500' },
    ANALYTICS_DIR: { title: 'Analista de Operaciones y Planta', icon: Database, color: 'text-emerald-500' }
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200 shadow-sm w-full">
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              <span>🌐 En Línea (Sincronizado)</span>
            </span>
          ) : (
            <div className="inline-flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-sm animate-pulse">
                <span>📡 Modo Offline: {pendingQueueCount} Transacciones en Cola de Subida</span>
              </span>
              <button
                onClick={handleManualSync}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[11px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                title="Forzar sincronización de datos con Cloud Firestore"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sincronizar</span>
              </button>
            </div>
          )}

          <span className="text-[11px] text-slate-500 font-mono hidden lg:inline">
            Firebase Auth: <strong className="text-sky-700">{user ? user.email : 'Sin autenticar'}</strong>
          </span>
          <button
            onClick={resetData}
            title="Limpiar todos los datos de la aplicación"
            className="hover:text-amber-600 flex items-center gap-1 transition-colors text-xs text-slate-600 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Limpiar Datos</span>
          </button>
        </div>
      </div>

      {/* Main Fiori Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: SAP Shell Brand & App Selector */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('LAUNCHPAD')}
            className="flex items-center space-x-2.5 group focus:outline-none"
          >
            <img
              src="/sap_logo.jpg"
              alt="Enterprise ERP Logo"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="text-left leading-tight hidden xs:block">
              <div className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-sap-blue transition-colors">
                Operam ERP
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {activeTab === 'LAUNCHPAD' ? 'Home Launchpad' : `Módulo: ${activeTab}`}
              </div>
            </div>
          </button>

          {/* Quick Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 pl-2 xl:pl-4 border-l border-slate-200">
            <button
              onClick={() => setActiveTab('LAUNCHPAD')}
              className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                activeTab === 'LAUNCHPAD' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Launchpad
            </button>
            <button
              onClick={() => setActiveTab('WORK_ORDERS')}
              className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                activeTab === 'WORK_ORDERS' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Órdenes (PM)
            </button>
            <button
              onClick={() => setActiveTab('ASSETS')}
              className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                activeTab === 'ASSETS' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Activos (IE03)
            </button>
            <button
              onClick={() => setActiveTab('FLEET')}
              className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                activeTab === 'FLEET' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Flota & Vencimientos
            </button>

            {/* Admin/Management Only Tabs */}
            {currentRole !== 'FIELD_MECHANIC' && (
              <>
                <button
                  onClick={() => setActiveTab('INVENTORY')}
                  className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                    activeTab === 'INVENTORY' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Inventario (MM)
                </button>
                <button
                  onClick={() => setActiveTab('MIGO')}
                  className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                    activeTab === 'MIGO' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Movimientos MIGO
                </button>
                <button
                  onClick={() => setActiveTab('ANALYTICS')}
                  className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all ${
                    activeTab === 'ANALYTICS' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="hidden xl:inline">Executive Analytics</span>
                  <span className="xl:hidden">Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab('HR')}
                  className={`px-2 py-1 xl:px-3 xl:py-1.5 rounded-md text-[11px] xl:text-xs font-semibold transition-all flex items-center space-x-1 ${
                    activeTab === 'HR' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="hidden xl:inline">Recursos Humanos (HCM)</span>
                  <span className="xl:hidden">RRHH (HCM)</span>
                  {complianceAlertEmployees.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] px-1 rounded-full font-bold">
                      {complianceAlertEmployees.length}
                    </span>
                  )}
                </button>
              </>
            )}
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
                  onClick={() => { setShowQuickActions(false); onOpenCreateEmployee(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Alta Colaborador (PA30)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateWO(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Nueva Orden de Trabajo (IW31)</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateMIGO(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Package className="w-4 h-4 text-sky-600" />
                  <span>Registrar Movimiento MIGO</span>
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); onOpenCreateMaterial(); }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Crear Material (MM01)</span>
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
                      <div className="text-xs text-slate-900 font-bold truncate">{emp.name}</div>
                      <div className="text-[10px] text-amber-800 mt-0.5">Faena: {emp.faena} • Revisar Vencimientos (≤30d)</div>
                    </div>
                  ))}

                  {criticalWorkOrders.map(wo => (
                    <div
                      key={wo.id}
                      onClick={() => { setActiveTab('WORK_ORDERS'); setShowNotifications(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-rose-700 font-bold mb-1">
                        <span>OT URGENTE {wo.id}</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                          {wo.priority}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-medium truncate">{wo.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Equipo: {wo.equipmentId}</div>
                    </div>
                  ))}

                  {lowStockItems.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setActiveTab('INVENTORY'); setShowNotifications(false); }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
                        <span>STOCK CRÍTICO {m.id}</span>
                        <span className="text-[10px] text-amber-800">
                          {m.stock} {m.unit} (Min: {m.reorderPoint})
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-medium truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Ubicación: Bin {m.storageBin}</div>
                    </div>
                  ))}

                  {totalAlertsCount === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                      Sin alertas pendientes. Operación normal en planta.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Firebase Authentication User Profile / Login Button */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-sap-blue text-white flex items-center justify-center font-bold text-[10px]">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left text-xs hidden md:block">
                  <div className="font-bold text-slate-800 leading-none truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar Sesión / Registro</span>
              </button>
            )}

            {showUserMenu && user && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      Firebase Authenticated
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-700 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Seleccionar Rol Activo
                    </label>
                    <select
                      value={currentRole}
                      onChange={(e) => {
                        setCurrentRole(e.target.value);
                        addToast(`Modo cambiado a: ${roleLabels[e.target.value]?.title}`, 'info');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sap-blue"
                    >
                      {Object.entries(roleLabels).map(([key, val]) => (
                        <option key={key} value={key}>{val.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Planta:</span>
                    <span className="font-semibold text-slate-800">{user.plant || '0001 (Planta Central)'}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setShowUserMenu(false); handleInstallPWA(); }}
                  className="w-full px-4 py-2 text-xs text-left text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Instalar App Nativa (PWA)</span>
                </button>

                <button
                  onClick={() => { setShowUserMenu(false); onOpenAuthModal(); }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  <span>Cambiar de Cuenta / Registro</span>
                </button>

                <button
                  onClick={() => { setShowUserMenu(false); logout(); addToast('Sesión de Firebase cerrada', 'info'); }}
                  className="w-full px-4 py-2 text-xs text-left text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

