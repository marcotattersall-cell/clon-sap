import React, { useState, useMemo } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  Ticket,
  Bot,
  HardDrive,
  Clock,
  DollarSign,
  ShieldAlert,
  PieChart,
  Database,
  CheckCircle2,
  Eye,
  RefreshCw,
  LogIn,
  Search,
  Grid,
  List,
  Sparkles,
  Server,
  Download,
  X
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const GlobalTenantDashboard = () => {
  const { workOrders = [], employees = [], materials = [], addToast } = useSAP();
  const { switchTenant } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [detailClientModal, setDetailClientModal] = useState(null);

  // Datos Enriquecidos de los Clientes Corporativos Multi-Tenant (11 Métricas por Cliente)
  const clientsData = useMemo(() => [
    {
      id: 'tenant_demo',
      name: 'Demo Axomira Enterprise',
      sector: 'Planta Central Santiago',
      location: 'Santiago, Chile',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      contactPerson: 'Marco Vidal Tattersall (Super Admin)',
      healthStatus: 'OPTIMO',
      healthScore: 98,
      usersTotal: 12,
      usersActive: 10,
      actionsTotal: 450210,
      errorsTotal: 2,
      supportTickets: { open: 1, inProgress: 0, resolved: 5, total: 6 },
      copilotQueries: { total: 520, pm: 45, mm: 25, hcm: 20, reports: 10 },
      storageUsedGB: 45.2,
      storageQuotaGB: 100,
      avgLatencyMs: 12.4,
      uptimePct: 99.98,
      monetaryProcessedCLP: 1850000000, // $1.850.000.000 CLP
      failedLoginAttempts: 0,
      moduleAdoption: { pm: 100, mm: 95, hcm: 90, fleet: 80 },
      lastBackup: '2026-08-23 02:00:00',
      checksum: 'a8f5c9e2b1049c3d8e7a6f5b4c3d2e1f0a9b8c7d',
      workOrdersCount: workOrders.length || 340,
      employeesCount: employees.length || 450,
      materialsCount: materials.length || 1200
    },
    {
      id: 'tenant_codelco',
      name: 'CODELCO Chile',
      sector: 'Gran Minería del Cobre',
      location: 'El Teniente / Chuquicamata',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      contactPerson: 'Jorge Silva San Martín',
      healthStatus: 'OPTIMO',
      healthScore: 96,
      usersTotal: 18,
      usersActive: 15,
      actionsTotal: 680450,
      errorsTotal: 4,
      supportTickets: { open: 2, inProgress: 1, resolved: 12, total: 15 },
      copilotQueries: { total: 840, pm: 50, mm: 20, hcm: 20, reports: 10 },
      storageUsedGB: 78.5,
      storageQuotaGB: 200,
      avgLatencyMs: 14.1,
      uptimePct: 99.95,
      monetaryProcessedCLP: 4200000000, // $4.200.000.000 CLP
      failedLoginAttempts: 1,
      moduleAdoption: { pm: 100, mm: 90, hcm: 95, fleet: 85 },
      lastBackup: '2026-08-23 02:00:00',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workOrdersCount: 520,
      employeesCount: 680,
      materialsCount: 2400
    },
    {
      id: 'tenant_bhp',
      name: 'BHP Billiton',
      sector: 'Explotación Minera & Cobre',
      location: 'Minera Escondida, Antofagasta',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      contactPerson: 'Carlos Mendoza Vidal',
      healthStatus: 'PREVENTIVA',
      healthScore: 85,
      usersTotal: 8,
      usersActive: 6,
      actionsTotal: 280150,
      errorsTotal: 5,
      supportTickets: { open: 1, inProgress: 1, resolved: 8, total: 10 },
      copilotQueries: { total: 340, pm: 40, mm: 30, hcm: 15, reports: 15 },
      storageUsedGB: 38.1,
      storageQuotaGB: 100,
      avgLatencyMs: 18.2,
      uptimePct: 99.90,
      monetaryProcessedCLP: 2900000000,
      failedLoginAttempts: 3,
      moduleAdoption: { pm: 95, mm: 85, hcm: 70, fleet: 60 },
      lastBackup: '2026-08-23 02:00:00',
      checksum: '7d8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
      workOrdersCount: 290,
      employeesCount: 310,
      materialsCount: 1100
    },
    {
      id: 'tenant_antofagasta_minerals',
      name: 'Antofagasta Minerals',
      sector: 'Grupo Minero Multiyacimiento',
      location: 'Los Pelambres / Centinela',
      slaTier: 'MEDIUM',
      slaName: 'SLA Semanal (Dom 03:00 AM)',
      contactPerson: 'Luis Paredes Ugarte',
      healthStatus: 'OPTIMO',
      healthScore: 92,
      usersTotal: 10,
      usersActive: 8,
      actionsTotal: 340900,
      errorsTotal: 1,
      supportTickets: { open: 0, inProgress: 1, resolved: 7, total: 8 },
      copilotQueries: { total: 410, pm: 45, mm: 25, hcm: 20, reports: 10 },
      storageUsedGB: 52.0,
      storageQuotaGB: 150,
      avgLatencyMs: 15.0,
      uptimePct: 99.96,
      monetaryProcessedCLP: 3100000000,
      failedLoginAttempts: 0,
      moduleAdoption: { pm: 90, mm: 90, hcm: 85, fleet: 70 },
      lastBackup: '2026-08-17 03:00:00',
      checksum: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
      workOrdersCount: 310,
      employeesCount: 420,
      materialsCount: 1600
    },
    {
      id: 'tenant_collahuasi',
      name: 'Collahuasi Minera',
      sector: 'Extracción & Concentrado de Cobre',
      location: 'Pica / Iquique, Tarapacá',
      slaTier: 'LOW',
      slaName: 'SLA Mensual (1ro 04:00 AM)',
      contactPerson: 'Patricia Morales Soto',
      healthStatus: 'OPTIMO',
      healthScore: 94,
      usersTotal: 6,
      usersActive: 5,
      actionsTotal: 190800,
      errorsTotal: 2,
      supportTickets: { open: 0, inProgress: 0, resolved: 4, total: 4 },
      copilotQueries: { total: 290, pm: 50, mm: 20, hcm: 20, reports: 10 },
      storageUsedGB: 29.4,
      storageQuotaGB: 100,
      avgLatencyMs: 16.8,
      uptimePct: 99.94,
      monetaryProcessedCLP: 1650000000,
      failedLoginAttempts: 0,
      moduleAdoption: { pm: 85, mm: 80, hcm: 80, fleet: 50 },
      lastBackup: '2026-08-01 04:00:00',
      checksum: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      workOrdersCount: 210,
      employeesCount: 250,
      materialsCount: 950
    }
  ], [workOrders.length, employees.length, materials.length]);

  // Filtrado de clientes por búsqueda y sector
  const filteredClients = useMemo(() => {
    return clientsData.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = selectedSector === 'ALL' || c.slaTier === selectedSector;
      return matchSearch && matchSector;
    });
  }, [clientsData, searchQuery, selectedSector]);

  // Totales Globales Consolidados para la Barra KPI Superior
  const globalSummary = useMemo(() => {
    return clientsData.reduce((acc, c) => ({
      clientsCount: acc.clientsCount + 1,
      usersTotal: acc.usersTotal + c.usersTotal,
      usersActive: acc.usersActive + c.usersActive,
      actionsTotal: acc.actionsTotal + c.actionsTotal,
      errorsTotal: acc.errorsTotal + c.errorsTotal,
      openTickets: acc.openTickets + c.supportTickets.open + c.supportTickets.inProgress,
      copilotQueries: acc.copilotQueries + c.copilotQueries.total,
      monetaryTotal: acc.monetaryTotal + c.monetaryProcessedCLP
    }), {
      clientsCount: 0,
      usersTotal: 0,
      usersActive: 0,
      actionsTotal: 0,
      errorsTotal: 0,
      openTickets: 0,
      copilotQueries: 0,
      monetaryTotal: 0
    });
  }, [clientsData]);

  // Handler para simular / forzar Backup SLA
  const handleForceBackup = (client) => {
    addToast(`⚡ Respaldo SLA ejecutado con éxito para ${client.name}. Checksum SHA-256 verificado.`, 'success');
  };

  // Handler para switch seguro de tenant
  const handleSwitchTenant = (client) => {
    switchTenant(client.id, client.name);
    addToast(`🚀 Contexto cambiado a ${client.name} (Tenant ID: ${client.id}). Modo SuperAdmin Activo.`, 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ----------------- BARRA KPI SUPERIOR CONSOLIDADA ----------------- */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                SU01 - Dashboard Global de Clientes Corporativos (Multi-Tenant Cockpit)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Consola Central de Supervisión de Clientes, Usuarios, Transacciones, Seguridad y SLA
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Salud BDD: 100% OK</span>
            </span>
          </div>
        </div>

        {/* Malla de KPIs Consolidados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="w-3 h-3 text-sky-400" /> Clientes Corporativos
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {globalSummary.clientsCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% Activos</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> Usuarios Totales
            </span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {globalSummary.usersTotal}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">{globalSummary.usersActive} en sesión</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-400" /> Acciones Totales
            </span>
            <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
              {(globalSummary.actionsTotal / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Transacciones</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Errores Capturados
            </span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
              {globalSummary.errorsTotal}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Bajo Control</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Ticket className="w-3 h-3 text-rose-400" /> Tickets Soporte
            </span>
            <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">
              {globalSummary.openTickets}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Abiertos / En Proceso</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Bot className="w-3 h-3 text-sky-400" /> Consultas IA Copilot
            </span>
            <span className="text-xl font-bold font-mono text-sky-300 mt-1 block">
              {globalSummary.copilotQueries.toLocaleString('es-CL')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Preguntas IA</span>
          </div>
        </div>
      </div>

      {/* ----------------- BARRA DE BÚSQUEDA Y FILTROS DE CLIENTES ----------------- */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, sector o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sap-blue"
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sap-blue"
          >
            <option value="ALL">Todos los Niveles SLA</option>
            <option value="HIGH">SLA High (Diario)</option>
            <option value="MEDIUM">SLA Medium (Semanal)</option>
            <option value="LOW">SLA Low (Mensual)</option>
          </select>
        </div>

        {/* Toggle de Vista Grid vs Tabla */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-bold flex items-center space-x-1 transition-all ${
              viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-sap-blue shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Tarjetas Ejecutivas"
          >
            <Grid className="w-4 h-4" />
            <span>Tarjetas</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-bold flex items-center space-x-1 transition-all ${
              viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-sap-blue shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista Matriz Tabular"
          >
            <List className="w-4 h-4" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* ----------------- VISTA DE TARJETAS EJECUTIVAS ----------------- */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Header de Tarjeta Cliente */}
              <div className="p-5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase text-slate-500 dark:text-slate-400">
                      ID: {client.id} • SLA: {client.slaTier}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sap-blue shrink-0" />
                      <span>{client.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {client.sector} • <span className="font-semibold text-slate-700 dark:text-slate-300">{client.location}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <StatusBadge status={client.healthStatus === 'OPTIMO' ? 'REL' : 'CRTE'} />
                    <span className="text-[10px] font-mono font-bold block text-slate-500 mt-1">
                      Puntaje: {client.healthScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Matriz de las 11 Métricas */}
              <div className="p-5 space-y-4">
                {/* Fila 1: Usuarios & Acciones */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Usuarios del Client:
                    </span>
                    <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {client.usersTotal} Registrados <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">({client.usersActive} activos)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Acciones Generadas:
                    </span>
                    <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {client.actionsTotal.toLocaleString('es-CL')} <span className="text-[11px] text-slate-500 font-normal">op</span>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Errores, Tickets & Copilot IA */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">⚠️ Errores</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{client.errorsTotal} logs</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">🎫 Tickets Soporte</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {client.supportTickets.open} Abiertos ({client.supportTickets.total} tot)
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 font-bold block">🤖 Copilot IA</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {client.copilotQueries.total} consultas
                    </span>
                  </div>
                </div>

                {/* Fila 3: Almacenamiento, Latencia & Masa Monetaria Procesada */}
                <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" /> BDD Quota:
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      {client.storageUsedGB} GB / {client.storageQuotaGB} GB
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Latencia / Uptime:
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      {client.avgLatencyMs}ms ({client.uptimePct}%)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" /> Valor Procesado:
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                      ${(client.monetaryProcessedCLP / 1000000000).toFixed(2)}B CLP
                    </span>
                  </div>
                </div>

                {/* Fila 4: Adopción Módulos & Auditoría de Seguridad */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <PieChart className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Adopción de Módulos SAP:
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      Intentos Fallidos Login: {client.failedLoginAttempts}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block">PM</span>
                      <strong className="text-sky-600 dark:text-sky-400">{client.moduleAdoption.pm}%</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block">MM</span>
                      <strong className="text-purple-600 dark:text-purple-400">{client.moduleAdoption.mm}%</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block">HCM</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{client.moduleAdoption.hcm}%</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block">Flota</span>
                      <strong className="text-amber-600 dark:text-amber-400">{client.moduleAdoption.fleet}%</strong>
                    </div>
                  </div>
                </div>

                {/* Respaldo BDD Hash Checksum */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                  <span>Último Backup: {client.lastBackup}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SHA-256 Validado
                  </span>
                </div>
              </div>

              {/* Botones de Acción SuperAdmin */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => setDetailClientModal(client)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>Inspeccionar</span>
                </button>

                <button
                  onClick={() => handleForceBackup(client)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Backup SLA</span>
                </button>

                <button
                  onClick={() => handleSwitchTenant(client)}
                  className="px-4 py-1.5 bg-sap-blue hover:bg-sap-blue-hover text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar a Tenant</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ----------------- VISTA DE MATRIZ TABULAR ----------------- */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Cliente / Tenant ID</th>
                  <th className="p-3">Salud</th>
                  <th className="p-3">Usuarios</th>
                  <th className="p-3">Acciones</th>
                  <th className="p-3">Errores</th>
                  <th className="p-3">Tickets</th>
                  <th className="p-3">Copilot IA</th>
                  <th className="p-3">Quota BDD</th>
                  <th className="p-3">Masa CLP</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-800 dark:text-slate-200">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{c.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{c.id} • {c.location}</div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.healthStatus === 'OPTIMO' ? 'REL' : 'CRTE'} />
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {c.usersTotal} <span className="text-[10px] text-emerald-600 font-normal">({c.usersActive} act)</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-700 dark:text-purple-400">
                      {c.actionsTotal.toLocaleString('es-CL')}
                    </td>
                    <td className="p-3 font-mono text-amber-600 font-bold">{c.errorsTotal}</td>
                    <td className="p-3 font-mono text-rose-600 font-bold">{c.supportTickets.open} open</td>
                    <td className="p-3 font-mono text-sky-600 font-bold">{c.copilotQueries.total}</td>
                    <td className="p-3 font-mono text-slate-600">{c.storageUsedGB} / {c.storageQuotaGB} GB</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">
                      ${(c.monetaryProcessedCLP / 1000000000).toFixed(2)}B
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleSwitchTenant(c)}
                        className="bg-sap-blue hover:bg-sap-blue-hover text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-xs transition-colors"
                      >
                        Ingresar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- MODAL DE INSPECCIÓN DETALLADA DE CLIENTE ----------------- */}
      {detailClientModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-700 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inspección Detallada: {detailClientModal.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID Tenant: {detailClientModal.id} • SLA: {detailClientModal.slaName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailClientModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Desglose de Consultas Copilot IA por Categoría */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-sky-600" />
                Categorización de Consultas al Chatbox IA ({detailClientModal.copilotQueries.total} Total)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800">
                  <span className="text-sky-900 dark:text-sky-300 font-bold block">PM Mantenimiento</span>
                  <span className="text-lg font-mono font-bold text-sky-700 dark:text-sky-400">
                    {detailClientModal.copilotQueries.pm}%
                  </span>
                  <span className="text-[10px] text-sky-600 block">Órdenes & RUL</span>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-900 dark:text-purple-300 font-bold block">MM Inventarios</span>
                  <span className="text-lg font-mono font-bold text-purple-700 dark:text-purple-400">
                    {detailClientModal.copilotQueries.mm}%
                  </span>
                  <span className="text-[10px] text-purple-600 block">Stock & MIGO</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-900 dark:text-emerald-300 font-bold block">HCM Personal</span>
                  <span className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {detailClientModal.copilotQueries.hcm}%
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Acreditaciones</span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-900 dark:text-amber-300 font-bold block">Reportes IA</span>
                  <span className="text-lg font-mono font-bold text-amber-700 dark:text-amber-400">
                    {detailClientModal.copilotQueries.reports}%
                  </span>
                  <span className="text-[10px] text-amber-600 block">Informes PDF/JSON</span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setDetailClientModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const client = detailClientModal;
                  setDetailClientModal(null);
                  handleSwitchTenant(client);
                }}
                className="bg-sap-blue hover:bg-sap-blue-hover text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar a Tenant ({detailClientModal.name})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalTenantDashboard;
