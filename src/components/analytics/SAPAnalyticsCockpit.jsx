import React from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Activity, DollarSign, TrendingUp, ShieldCheck, Wrench, Package, PieChart as PieChartIcon } from 'lucide-react';

export const SAPAnalyticsCockpit = () => {
  const { materials, workOrders, assets, purchaseOrders } = useSAP();

  // 1. Cost breakdown by Cost Center (FI/CO) dynamically calculated
  const costCenterMap = {};
  workOrders.forEach(w => {
    const cc = w.costCenter || 'CC-GENERAL';
    if (!costCenterMap[cc]) costCenterMap[cc] = { name: cc, planned: 0, actual: 0 };
    costCenterMap[cc].planned += Number(w.plannedCost || 0);
    costCenterMap[cc].actual += Number(w.actualCost || 0);
  });
  const costCenterData = Object.values(costCenterMap);

  // 2. Work Order Status Distribution
  const statusCounts = {
    CRTE: workOrders.filter(w => w.status === 'CRTE').length,
    REL: workOrders.filter(w => w.status === 'REL').length,
    PCNF: workOrders.filter(w => w.status === 'PCNF').length,
    TECO: workOrders.filter(w => w.status === 'TECO').length
  };

  const statusPieData = [
    { name: 'Creada (CRTE)', value: statusCounts.CRTE, color: '#0a6ed1' },
    { name: 'Liberada (REL)', value: statusCounts.REL, color: '#107e3e' },
    { name: 'En Proceso (PCNF)', value: statusCounts.PCNF, color: '#e69d00' },
    { name: 'Técnico TECO', value: statusCounts.TECO, color: '#8d29b3' }
  ];

  // 3. Equipment Health Index Score Data
  const equipmentHealthData = assets.map(a => ({
    name: a.name.split(' ')[0] + ' ' + a.id,
    health: a.healthIndex,
    criticality: a.criticality
  }));

  // 4. Monthly Spend Trend dynamically calculated
  const monthlySpendData = purchaseOrders.length > 0 ? purchaseOrders.map(p => ({
    month: p.createdDate || 'Agosto',
    planned: Number(p.totalAmount || 0),
    actual: p.status === 'Recibido' ? Number(p.totalAmount || 0) : 0
  })) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Executive Analytics Cloud Cockpit</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Cockpit de Inteligencia de Negocio & Control Financiero
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas analíticas consolidadas de desempeño operacional, desviación presupuestaria y salud de activos.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Cumplimiento PM Preventivo</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">92.4%</div>
          <div className="text-[11px] text-slate-400">+3.2% vs mes anterior</div>
        </div>

        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">MTBF (Tiempo Medio Entre Fallos)</div>
          <div className="text-3xl font-black text-sap-blue">485 hrs</div>
          <div className="text-[11px] text-slate-400">Meta Planta: 450 hrs</div>
        </div>

        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">MTTR (Tiempo Medio Reparación)</div>
          <div className="text-3xl font-black text-amber-500">2.4 hrs</div>
          <div className="text-[11px] text-slate-400">Reducción del 15%</div>
        </div>

        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Rotación de Inventario</div>
          <div className="text-3xl font-black text-purple-500">4.8 x</div>
          <div className="text-[11px] text-slate-400">Eficiencia Óptima</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Desviación Presupuestaria por Centro de Coste */}
        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Coste Planificado vs Real por Centro de Coste (FI/CO)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costCenterData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1d232a', border: '1px solid #323d4a', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="planned" name="Coste Planificado ($)" fill="#0a6ed1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Coste Real Imputado ($)" fill="#107e3e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Estado de Órdenes de Trabajo (Pie Chart) */}
        <div className="fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-sap-blue" />
            <span>Distribución de Órdenes de Trabajo por Estado</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1d232a', border: '1px solid #323d4a', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Tendencia Mensual de Gasto en Mantenimiento */}
        <div className="lg:col-span-2 fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Evolución Histórica de Gastos Operacionales (6 Meses)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1d232a', border: '1px solid #323d4a', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="planned" name="Presupuesto Plan ($)" stroke="#0a6ed1" strokeWidth={3} />
                <Line type="monotone" dataKey="actual" name="Gasto Real Executed ($)" stroke="#e69d00" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
