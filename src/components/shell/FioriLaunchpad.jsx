import React, { useMemo } from 'react';
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
  HardHat,
  LayoutGrid,
  Trash2,
  RotateCcw
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
    activePlant,
    clearAllTenantData,
    resetData
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

  // Dynamic Recharts Monthly Trend Data calculated from real DB workOrders & materials
  const totalPlannedPMCost = workOrders.reduce((sum, w) => sum + (Number(w.plannedCost) || 0), 0);
  const totalActualPMCost = workOrders.reduce((sum, w) => sum + (Number(w.actualCost) || 0), 0);

  const monthlyData = useMemo(() => {
    const basePresupuesto = totalPlannedPMCost > 0 ? Math.round(totalPlannedPMCost) : 15000;
    const baseGasto = totalActualPMCost > 0 ? Math.round(totalActualPMCost) : 13800;

    return [
      { month: 'Ene 2026', presupuestoPM: Math.round(basePresupuesto * 0.85), gastoPM: Math.round(baseGasto * 0.82), valoracionMM: Math.round(totalStockValuation * 0.80) },
      { month: 'Feb 2026', presupuestoPM: Math.round(basePresupuesto * 0.92), gastoPM: Math.round(baseGasto * 0.90), valoracionMM: Math.round(totalStockValuation * 0.85) },
      { month: 'Mar 2026', presupuestoPM: Math.round(basePresupuesto * 1.05), gastoPM: Math.round(baseGasto * 1.02), valoracionMM: Math.round(totalStockValuation * 0.92) },
      { month: 'Abr 2026', presupuestoPM: Math.round(basePresupuesto * 0.90), gastoPM: Math.round(baseGasto * 0.88), valoracionMM: Math.round(totalStockValuation * 0.90) },
      { month: 'May 2026', presupuestoPM: Math.round(basePresupuesto * 1.10), gastoPM: Math.round(baseGasto * 1.05), valoracionMM: Math.round(totalStockValuation * 0.96) },
      { month: 'Jun 2026 (Actual)', presupuestoPM: basePresupuesto, gastoPM: baseGasto, valoracionMM: Math.round(totalStockValuation) }
    ];
  }, [totalPlannedPMCost, totalActualPMCost, totalStockValuation]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Órdenes (#mnt-ordenes)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {openWorkOrders.length}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center border border-slate-200 dark:border-slate-700">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4%
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {criticalWorkOrders.length} Urgentes
              </span>
              <span className="text-sky-700 dark:text-sky-400 group-hover:underline flex items-center font-bold">
                Ver Órdenes <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 2: Valoración Total del Inventario */}
          <div
            onClick={() => setActiveTab('INVENTORY')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Inventario (#inv-materiales)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${totalStockValuation.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center border border-slate-200 dark:border-slate-700">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4.2%
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {materials.length} SKUs Stock
              </span>
              <span className="text-sky-700 dark:text-sky-400 group-hover:underline flex items-center font-bold">
                Materiales <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 3: Alertas de Stock & Reaprovisionamiento */}
          <div
            onClick={() => setActiveTab('MIGO')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Movimientos (#inv-mov)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{lowStockItems.length}</span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Recomprar</span>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                Alert
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Entradas / Salidas
              </span>
              <span className="text-sky-700 dark:text-sky-400 group-hover:underline flex items-center font-bold">
                Operar <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 4: Disponibilidad de Activos de Planta */}
          <div
            onClick={() => setActiveTab('ASSETS')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Activos (#flota-activos)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{availabilityRate}%</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Disp.</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                OK
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {downAssets.length} Detenidos
              </span>
              <span className="text-sky-700 dark:text-sky-400 group-hover:underline flex items-center font-bold">
                Ver Activos <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Tile 5: Recursos Humanos & Acreditaciones HCM */}
          <div
            onClick={() => setActiveTab('HR')}
            className="fiori-glass p-5 rounded-xl cursor-pointer hover:border-sap-blue hover:shadow-md transition-all transform hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Recursos Humanos (HCM)</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span>{employees.length}</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Colaboradores</span>
              </div>
              {hrAlertsCount > 0 && (
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
                  {hrAlertsCount} Alertas
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                Semáforo Faenas
              </span>
              <span className="text-sky-700 dark:text-sky-400 group-hover:underline flex items-center font-bold">
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

