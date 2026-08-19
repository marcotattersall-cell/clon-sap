import React, { useState } from 'react';
import { SAPProvider, useSAP } from './context/SAPContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FioriHeader } from './components/shell/FioriHeader';
import { FioriLaunchpad } from './components/shell/FioriLaunchpad';
import { MaterialMasterTable } from './components/inventory/MaterialMasterTable';
import { WarehouseVisualMap } from './components/inventory/WarehouseVisualMap';
import { WorkOrderMaster } from './components/workorders/WorkOrderMaster';
import { GoodsMovementMIGO } from './components/inventory/GoodsMovementMIGO';
import { AssetHierarchyTree } from './components/workorders/AssetHierarchyTree';
import { FleetPlanner } from './components/fleet/FleetPlanner';
import { SAPAnalyticsCockpit } from './components/analytics/SAPAnalyticsCockpit';
import { CreateWOModal } from './components/modals/CreateWOModal';
import { CreateMaterialModal } from './components/modals/CreateMaterialModal';
import { CreatePlantModal } from './components/modals/CreatePlantModal';
import { HRMaster } from './components/hr/HRMaster';
import { CreateEmployeeModal } from './components/modals/CreateEmployeeModal';
import { CreateAbsenceModal } from './components/modals/CreateAbsenceModal';
import { AuthModal } from './components/auth/AuthModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { MobileBottomNav } from './components/shell/MobileBottomNav';
import { AlertCircle, CheckCircle2, Info, X, Loader2, ShieldCheck } from 'lucide-react';

const ToastContainer = () => {
  const { globalToasts } = useSAP();

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2.5 max-w-md pointer-events-none">
      {globalToasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl border text-xs font-semibold flex items-start space-x-3 transition-all transform animate-in slide-in-from-bottom-5 backdrop-blur-md ${
            toast.type === 'success' ? 'bg-slate-900/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40 ring-1 ring-emerald-500/20' :
            toast.type === 'error' ? 'bg-slate-900/95 text-rose-100 border-rose-500/50 shadow-rose-950/40' :
            'bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/40'
          }`}
        >
          {toast.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
          <div className="flex-1 leading-relaxed">{toast.message}</div>
        </div>
      ))}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleHardReset = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + '?v=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-rose-800 m-4 space-y-4 shadow-2xl">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
            <AlertCircle className="w-6 h-6" />
            <span>Módulo temporalmente no disponible</span>
          </div>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
            {this.state.error?.toString() || 'Error al renderizar el componente.'}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={this.handleHardReset}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-colors"
            >
              Limpiar Caché y Reiniciar Aplicación
            </button>
            <button
              onClick={this.handleHardReset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Reintentar (Cargar Última Versión)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TECOConfirmationModal = () => {
  const { tecoModalData, setTecoModalData } = useSAP();

  if (!tecoModalData) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 ring-1 ring-emerald-500/30">
        {/* Top Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 border-b border-emerald-800/60 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50 animate-pulse">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Módulo PM • Auditoría ERP</span>
            <h3 className="text-base font-bold text-white leading-tight">Certificado de Cierre Técnico (TECO)</h3>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Orden de Trabajo:</span>
              <span className="font-bold text-sky-400 text-sm">{tecoModalData.woId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Equipo / Activo:</span>
              <span className="font-bold text-slate-200">{tecoModalData.equipmentId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Estado ERP:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-700">
                {tecoModalData.status === 'TECO' ? 'TECO - Cierre Técnico' : 'CLSD - Cierre Definitivo'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Auditor Responsable:</span>
              <span className="font-bold text-slate-200">{tecoModalData.user}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sello de Fecha y Hora:</span>
              <span className="text-slate-300">{tecoModalData.timestamp}</span>
            </div>
          </div>

          {/* Audit Comment Note */}
          {tecoModalData.comment && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Justificación Técnica de Auditoría</span>
              <p className="text-slate-300 italic text-xs leading-relaxed">"{tecoModalData.comment}"</p>
            </div>
          )}

          <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>La orden ha sido sellada. Se ha habilitado la liquidación de costes contables (CO).</span>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setTecoModalData(null)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <span>Aceptar y Confirmar Certificado</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SAPAppContent = () => {
  const { user, loading } = useAuth();
  const { activeTab, setActiveTab } = useSAP();

  const [isCreateWOOpen, setIsCreateWOOpen] = useState(false);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [isCreatePlantOpen, setIsCreatePlantOpen] = useState(false);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateAbsenceOpen, setIsCreateAbsenceOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [migoInitialMat, setMigoInitialMat] = useState('');

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-sap-blue animate-spin mb-3" />
        <div className="text-xs font-bold tracking-widest uppercase text-slate-400">
          Cargando Sistema Operam ERP...
        </div>
      </div>
    );
  }

  // 2. Authentication Gate: If not logged in, force LoginScreen before entering the app
  if (!user) {
    return <LoginScreen />;
  }

  const handleOpenMIGOForMat = (materialId) => {
    setMigoInitialMat(materialId);
    setActiveTab('MIGO');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-sap-blue selection:text-white">
      {/* Header */}
      <FioriHeader
        onOpenCreateWO={() => setIsCreateWOOpen(true)}
        onOpenCreateMaterial={() => setIsCreateMaterialOpen(true)}
        onOpenCreateMIGO={() => setActiveTab('MIGO')}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenCreatePlant={() => setIsCreatePlantOpen(true)}
        onOpenCreateEmployee={() => setIsCreateEmployeeOpen(true)}
      />

      {/* Main Content Area - Full Screen Width with Mobile Bottom Bar Clearance */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-6 space-y-4 sm:space-y-6">
        <ErrorBoundary>
        {activeTab === 'LAUNCHPAD' && (
          <FioriLaunchpad
            onOpenCreateWO={() => setIsCreateWOOpen(true)}
            onOpenCreateMIGO={() => setActiveTab('MIGO')}
          />
        )}

        {activeTab === 'WORK_ORDERS' && (
          <WorkOrderMaster
            onOpenCreateWO={() => setIsCreateWOOpen(true)}
            onOpenMIGOForWO={() => setActiveTab('MIGO')}
          />
        )}

        {activeTab === 'INVENTORY' && (
          <div className="space-y-6">
            <MaterialMasterTable
              onOpenCreateMaterial={() => setIsCreateMaterialOpen(true)}
              onOpenMIGOForMaterial={handleOpenMIGOForMat}
            />
            <WarehouseVisualMap />
          </div>
        )}

        {activeTab === 'MIGO' && (
          <GoodsMovementMIGO initialMaterialId={migoInitialMat} />
        )}

        {activeTab === 'ASSETS' && (
          <AssetHierarchyTree />
        )}

        {activeTab === 'FLEET' && (
          <FleetPlanner onOpenCreateWOForVehicle={() => setIsCreateWOOpen(true)} />
        )}

        {activeTab === 'HR' && (
          <HRMaster
            onOpenCreateEmployee={() => setIsCreateEmployeeOpen(true)}
            onOpenCreateAbsence={() => setIsCreateAbsenceOpen(true)}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <SAPAnalyticsCockpit />
        )}
        </ErrorBoundary>
      </main>

      {/* Footer Ribbon */}
      <footer className="bg-slate-50 border-t border-slate-200 py-4 px-6 mb-14 lg:mb-0 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
        <div>
          <strong>Operam ERP Enterprise Platform</strong> • Módulos Transaccionales: Mantenimiento (PM), Almacén (MM), Recursos Humanos (HCM), Flota y Analítica Integrados
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-slate-500">
          <span>Executive Horizon UI 4.0</span>
          <span>•</span>
          <span>Firebase Auth Protected</span>
          <span>•</span>
          <span>System Status: OK</span>
        </div>
      </footer>

      {/* Mobile Thumb Navigation Bar */}
      <MobileBottomNav />

      {/* Global Modals */}
      <CreateWOModal
        isOpen={isCreateWOOpen}
        onClose={() => setIsCreateWOOpen(false)}
      />

      <CreateMaterialModal
        isOpen={isCreateMaterialOpen}
        onClose={() => setIsCreateMaterialOpen(false)}
      />

      <CreatePlantModal
        isOpen={isCreatePlantOpen}
        onClose={() => setIsCreatePlantOpen(false)}
      />

      <CreateEmployeeModal
        isOpen={isCreateEmployeeOpen}
        onClose={() => setIsCreateEmployeeOpen(false)}
      />

      <CreateAbsenceModal
        isOpen={isCreateAbsenceOpen}
        onClose={() => setIsCreateAbsenceOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Centered TECO Certificate Modal */}
      <TECOConfirmationModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SAPProvider>
        <SAPAppContent />
      </SAPProvider>
    </AuthProvider>
  );
}


