import React from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  Wrench,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  ClipboardList,
  CheckCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Activity,
  Layers,
  MapPin,
  Cpu,
  FileCheck,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Users,
  HardHat
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const FioriLaunchpad = ({ onOpenCreateWO, onOpenCreateMIGO }) => {
  const {
    materials,
    workOrders,
    assets,
    notifications,
    purchaseOrders,
    migoDocuments,
    employees = [],
    setActiveTab,
    currentRole,
    plants,
    activePlant
  } = useSAP();

  // Metrics calculations
  const openWorkOrders = workOrders.filter(w => w.status !== 'TECO' && w.status !== 'CLSD');
  const criticalWorkOrders = workOrders.filter(w => w.priority === 'Muy Alta' && w.status !== 'TECO');
  const totalStockValuation = materials.reduce((acc, m) => acc + (m.stock * m.unitPrice), 0);
  const lowStockItems = materials.filter(m => m.stock <= m.reorderPoint);
  const downAssets = assets.filter(a => a.status === 'Down');
  const availabilityRate = Math.round(((assets.length - downAssets.length) / (assets.length || 1)) * 100);

  const today = new Date();
  today.setHours(0,0,0,0);
  const hrAlertsCount = employees.filter(e => {
    const medDays = Math.ceil((new Date(e.medicalExamExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    const accDays = Math.ceil((new Date(e.accreditationExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    const safDays = Math.ceil((new Date(e.safetyCourseExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return medDays <= 30 || accDays <= 30 || safDays <= 30;
  }).length;

  // Recharts Monthly Trend Data
  const monthlyData = [
    { month: 'Ene 2026', presupuestoPM: 12500, gastoPM: 11200, valoracionMM: 45000 },
    { month: 'Feb 2026', presupuestoPM: 14000, gastoPM: 13800, valoracionMM: 48200 },
    { month: 'Mar 2026', presupuestoPM: 15000, gastoPM: 14200, valoracionMM: 51000 },
    { month: 'Abr 2026', presupuestoPM: 13500, gastoPM: 12900, valoracionMM: 49500 },
    { month: 'May 2026', presupuestoPM: 16000, gastoPM: 15400, valoracionMM: 53800 },
    { month: 'Jun 2026 (Proy.)', presupuestoPM: 17000, gastoPM: 16100, valoracionMM: 56400 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner - Nordic Clean White Corporate Banner with SAP Blue Border Accent */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-sap-blue shadow-sm text-slate-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sap-blue mb-1">
              <Activity className="w-4 h-4 text-sap-blue" />
              <span>Enterprise Cockpit & Executive Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Bienvenido al Sistema de Gestión Integrado
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Supervisión en tiempo real de Mantenimiento de Planta (PM), Almacén e Inventario (MM), Gestión de Flota y Maquinaria, y Cockpit Analítico.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenCreateWO}
              className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>Crear Orden (IW31)</span>
            </button>
            <button
              onClick={onOpenCreateMIGO}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-200 flex items-center space-x-2 transition-all"
            >
              <Package className="w-4 h-4 text-slate-700" />
              <span>Movimiento MIGO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Plant Status Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-sap-blue" />
            <span>Centro Activo:</span>
            <span className="bg-sap-blue text-white px-2 py-0.5 rounded font-mono font-bold">
              {activePlant?.id || '0001'} - {activePlant?.name || 'Planta Central'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {activePlant?.address || 'Av. Industrial 4500'}, {activePlant?.city || 'Santiago'}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Estado Operativo: <strong className="text-emerald-700">100% Online</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>Equipos Asignados: <strong className="text-slate-800">{assets.length}</strong></span>
        </div>
      </div>

      {/* Executive Horizon KPI Tiles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sap-blue" />
            <span>Mosaicos Principales (Executive Horizon Tiles)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Actualización Automática Vía WebSocket Mock
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Tile 1: Órdenes de Trabajo Activas */}
          <div
            onClick={() => setActiveTab('WORK_ORDERS')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Órdenes PM Activas</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {openWorkOrders.length}
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4%
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticalWorkOrders.length} Urgentes
              </span>
              <span className="text-sap-blue group-hover:underline flex items-center font-bold">
                Ver PM <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 2: Valoración Total del Inventario */}
          <div
            onClick={() => setActiveTab('INVENTORY')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Valoración MM</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                ${totalStockValuation.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4.2%
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">
                {materials.length} SKUs MM
              </span>
              <span className="text-sap-blue group-hover:underline flex items-center font-bold">
                Maestro MM <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 3: Alertas de Stock & Reaprovisionamiento */}
          <div
            onClick={() => setActiveTab('INVENTORY')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Stock Crítico</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{lowStockItems.length}</span>
                <span className="text-xs font-semibold text-rose-600">Recomprar</span>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Alert
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-amber-700 font-medium">
                MIGO / PO
              </span>
              <span className="text-sap-blue group-hover:underline flex items-center font-bold">
                Gestión <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 4: Disponibilidad de Activos de Planta */}
          <div
            onClick={() => setActiveTab('ASSETS')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Salud Activos</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{availabilityRate}%</span>
                <span className="text-xs font-semibold text-emerald-600">Disp.</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                OK
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-rose-600 font-semibold">
                {downAssets.length} Detenidos
              </span>
              <span className="text-sap-blue group-hover:underline flex items-center font-bold">
                Activos <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 5: Recursos Humanos & Acreditaciones HCM */}
          <div
            onClick={() => setActiveTab('HR')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden border-sky-200 bg-sky-50/30"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Recursos Humanos (HCM)</span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>{employees.length}</span>
                <span className="text-xs font-semibold text-sky-700">Colaboradores</span>
              </div>
              {hrAlertsCount > 0 && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded animate-pulse">
                  {hrAlertsCount} Alertas
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/80 text-xs">
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                Semáforo Faenas
              </span>
              <span className="text-sap-blue group-hover:underline flex items-center font-bold">
                Ver HCM <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SAP Analytics Dashboard Chart Section */}
      <div className="fiori-glass p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sap-blue" />
              <span>Analytics Cloud Cockpit • Presupuesto vs Gasto Real Mantenimiento & Inventario</span>
            </h3>
            <p className="text-xs text-slate-500">
              Seguimiento comparativo de Costes PM/FI-CO y valoración de almacén acumulada 2026
            </p>
          </div>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className="text-xs font-bold text-sap-blue hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Abrir Analytics Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `$${val / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`$${Number(value).toLocaleString('es-CL')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="presupuestoPM" name="Presupuesto PM ($)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastoPM" name="Gasto Real PM ($)" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Dashboard: Quick Status & Live Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders In Execution Feed */}
        <div className="lg:col-span-2 fiori-glass p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Órdenes de Trabajo en Ejecución Inmediata</span>
              </h3>
              <p className="text-xs text-slate-500">
                Últimas órdenes en estado Liberada (REL) o En Proceso
              </p>
            </div>
            <button
              onClick={() => setActiveTab('WORK_ORDERS')}
              className="text-xs font-bold text-sap-blue hover:underline"
            >
              Ver Todas ({workOrders.length})
            </button>
          </div>

          <div className="space-y-3">
            {openWorkOrders.slice(0, 3).map(wo => {
              const asset = assets.find(a => a.id === wo.equipmentId);
              return (
                <div
                  key={wo.id}
                  onClick={() => setActiveTab('WORK_ORDERS')}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-sap-blue cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-sap-blue">{wo.id}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {asset?.name || wo.equipmentId}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                        {wo.title}
                      </h4>
                    </div>
                    <span className={`sap-badge ${wo.priority === 'Muy Alta' ? 'sap-badge-danger' : 'sap-badge-progress'}`}>
                      {wo.priority}
                    </span>
                  </div>

                  {/* Operations checklist mini bar */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center space-x-4">
                      <span>Técnico: <strong className="text-slate-800">{wo.assignedTech}</strong></span>
                      <span>Plan: <strong className="text-slate-800">{wo.plannedHours}h</strong></span>
                    </div>
                    <span className="font-semibold text-amber-700">
                      Coste: ${wo.actualCost} / ${wo.plannedCost}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications & Recent MIGO Movements */}
        <div className="fiori-glass p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-sap-blue" />
              <span>Últimos Movimientos MIGO</span>
            </h3>
            <button
              onClick={() => setActiveTab('MIGO')}
              className="text-xs font-bold text-sap-blue hover:underline"
            >
              Ver MIGO
            </button>
          </div>

          <div className="space-y-3">
            {migoDocuments.slice(0, 4).map(doc => (
              <div
                key={doc.documentId}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900">{doc.documentId}</span>
                  <span className="text-[10px] text-sky-800 font-bold px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200">
                    Tipo {doc.movementType}
                  </span>
                </div>
                <div className="text-slate-800 font-semibold truncate">
                  {doc.materialName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cant: <strong>{doc.qty} {doc.unit}</strong></span>
                  <span>Ref: <strong className="text-slate-600">{doc.refDocument}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

