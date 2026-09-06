import React from 'react';
import { 
  ChevronRight, 
  Building2, 
  Wrench, 
  Boxes, 
  Package, 
  Layers, 
  Database, 
  HardHat, 
  Users, 
  Activity, 
  Home,
  Globe
} from 'lucide-react';
import { useSAP } from '../../context/SAPContext';

export const TAB_BREADCRUMB_MAP = {
  LANDING: { module: 'Axomira Portal', view: 'Landing Page Corporativa', tcode: 'PORTAL', icon: Globe },
  LAUNCHPAD: { module: 'Cockpit ERP', view: 'Home Launchpad', tcode: 'SMSM', icon: Activity },
  WORK_ORDERS: { module: 'Mantenimiento PM', view: 'Órdenes de Trabajo', tcode: 'IW31 / IW32', icon: Wrench },
  ASSETS: { module: 'Mantenimiento PM', view: 'Jerarquía de Activos', tcode: 'IE01 / IE03', icon: Layers },
  FLEET: { module: 'Gestión de Flota', view: 'Control de Maquinaria & Vencimientos', tcode: 'FLEET', icon: Building2 },
  INVENTORY: { module: 'Gestión Materiales MM', view: 'Maestro de Inventario & Stock', tcode: 'MM01 / MM03', icon: Boxes },
  MIGO: { module: 'Gestión Materiales MM', view: 'Movimientos de Stock', tcode: 'MIGO 261/101', icon: Package },
  ANALYTICS: { module: 'Executive Analytics', view: 'Control de Costos CO/FI', tcode: 'S_ALR', icon: Database },
  HR: { module: 'Recursos Humanos HCM', view: 'Ficha de Personal', tcode: 'PA20 / PA30', icon: HardHat },
  USER_MGMT: { module: 'Administración Global', view: 'Usuarios & Multi-Tenancy', tcode: 'SU01', icon: Users }
};

export function FioriBreadcrumbs() {
  const { activePlant, activeTab, setActiveTab, themeMode } = useSAP();

  const currentMap = TAB_BREADCRUMB_MAP[activeTab] || TAB_BREADCRUMB_MAP.LAUNCHPAD;
  const ViewIcon = currentMap.icon;

  const isDark = themeMode === 'dark';

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={`px-4 sm:px-6 lg:px-8 py-2 border-b transition-colors text-xs font-medium font-sans flex items-center justify-between overflow-x-auto whitespace-nowrap ${
        isDark 
          ? 'bg-slate-950/80 text-slate-300 border-slate-800/80 backdrop-blur-md' 
          : 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Node 1: Plant / Operational Center */}
        <button
          onClick={() => setActiveTab('LAUNCHPAD')}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-800'
          }`}
          title="Ir al Launchpad Principal"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-bold">
            {activePlant?.name ? `${activePlant.id} (${activePlant.name.split(' ')[0]})` : 'Planta Central'}
          </span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

        {/* Node 2: SAP Module */}
        <span className={`px-1.5 py-0.5 rounded font-medium ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {currentMap.module}
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

        {/* Node 3: Active View & T-Code */}
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md font-bold ${
          isDark 
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
            : 'bg-sap-blue/10 text-sap-blue border border-sap-blue/20'
        }`}>
          <ViewIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{currentMap.view}</span>
          <span className="text-[10px] opacity-75 font-mono px-1 py-0.2 rounded bg-black/20">
            {currentMap.tcode}
          </span>
        </div>
      </div>

      {/* Right Indicator: Active Context Tag */}
      <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
        <Home className="w-3 h-3 text-slate-500" />
        <span>Ruta: Root &gt; {currentMap.module} &gt; {currentMap.view}</span>
      </div>
    </nav>
  );
}
