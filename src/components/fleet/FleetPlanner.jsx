import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  Truck,
  Gauge,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  PlusCircle,
  HardHat,
  ShieldAlert,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

import { CreateAssetModal } from '../modals/CreateAssetModal';

export const FleetPlanner = ({ onOpenCreateWOForVehicle }) => {
  const { assets, workOrders, createWorkOrder, addToast } = useSAP();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);

  // Master Fleet Assets dynamically derived from context assets
  const masterFleet = assets.map(a => ({
    id: a.id,
    name: a.name,
    category: (a.category && (a.category.includes('Camión') || a.category.includes('Camioneta') || a.category.includes('Vehículo'))) ? 'ROAD_VEHICLE' : 'HEAVY_MACHINERY',
    equipmentType: a.category || 'Equipo',
    costCenter: a.costCenter || 'CC-4100',
    baseHourmeter: Number(a.baseHourmeter || a.hourmeter || 0),
    hourmeterInterval: Number(a.hourmeterInterval || 250),
    baseOdometer: Number(a.baseOdometer || a.odometer || 0),
    odometerInterval: Number(a.odometerInterval || 10000),
    operator: a.operator || 'Operador Asignado',
    plate: a.plate || a.id,
    lastServiceDate: a.lastMaintenance || 'N/A'
  }));

  // Merge latest readings from IW31 Work Orders and compute progress against the 250 hr / 10,000 km rules
  const fleetData = masterFleet.map(veh => {
    const matchingWOs = workOrders.filter(w => w.equipmentId === veh.id);
    const currentHourmeter = matchingWOs.reduce((max, w) => (w.hourmeter && Number(w.hourmeter) > max ? Number(w.hourmeter) : max), veh.baseHourmeter);
    const currentOdometer = matchingWOs.reduce((max, w) => (w.odometer && Number(w.odometer) > max ? Number(w.odometer) : max), veh.baseOdometer);

    let progressPct = 0;
    let targetValue = 0;
    let currentValue = 0;
    let unitLabel = '';
    let remainingValue = 0;
    let cycleLabel = '';

    if (veh.category === 'HEAVY_MACHINERY') {
      // 🚜 RULE 1: Heavy Machinery -> Service every 250 Hours
      const interval = veh.hourmeterInterval; // 250
      const hoursInCurrentCycle = currentHourmeter % interval;
      currentValue = currentHourmeter;
      targetValue = Math.ceil(currentHourmeter / interval) * interval;
      if (targetValue === currentHourmeter) targetValue += interval;

      remainingValue = targetValue - currentHourmeter;
      progressPct = Math.min(100, Math.max(0, Math.round((hoursInCurrentCycle / interval) * 100)));
      unitLabel = 'hrs';
      cycleLabel = 'Ciclo 250 Horas (Horómetro)';
    } else {
      // 🚛 RULE 2: Road Vehicles & Pickups -> Service every 10,000 km
      const interval = veh.odometerInterval; // 10000
      const kmInCurrentCycle = currentOdometer % interval;
      currentValue = currentOdometer;
      targetValue = Math.ceil(currentOdometer / interval) * interval;
      if (targetValue === currentOdometer) targetValue += interval;

      remainingValue = targetValue - currentOdometer;
      progressPct = Math.min(100, Math.max(0, Math.round((kmInCurrentCycle / interval) * 100)));
      unitLabel = 'km';
      cycleLabel = 'Ciclo 10.000 km (Kilometraje)';
    }

    // Determine Maintenance Status
    let status = 'OK';
    if (remainingValue <= 0 || progressPct >= 100) {
      status = 'OVERDUE';
    } else if (progressPct >= 80 || (veh.category === 'ROAD_VEHICLE' && remainingValue <= 1500) || (veh.category === 'HEAVY_MACHINERY' && remainingValue <= 40)) {
      status = 'WARNING';
    }

    return {
      ...veh,
      currentHourmeter,
      currentOdometer,
      currentValue,
      targetValue,
      remainingValue,
      progressPct,
      unitLabel,
      cycleLabel,
      status
    };
  });

  const filteredFleet = fleetData.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.equipmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI Summary
  const totalFleet = fleetData.length;
  const heavyCount = fleetData.filter(v => v.category === 'HEAVY_MACHINERY').length;
  const roadCount = fleetData.filter(v => v.category === 'ROAD_VEHICLE').length;
  const overdueCount = fleetData.filter(v => v.status === 'OVERDUE').length;
  const warningCount = fleetData.filter(v => v.status === 'WARNING').length;
  const okCount = fleetData.filter(v => v.status === 'OK').length;

  const handleGeneratePreventiveWO = (vehicle) => {
    const pautaLabel = vehicle.category === 'HEAVY_MACHINERY' ? `${vehicle.targetValue} hrs` : `${vehicle.targetValue.toLocaleString()} km`;
    const title = `[PAUTA FLOTA - ${vehicle.equipmentType.toUpperCase()}] Servicio Preventivo ${pautaLabel} - ${vehicle.name}`;
    
    createWorkOrder({
      title,
      type: 'PM02',
      priority: vehicle.status === 'OVERDUE' ? 'Muy Alta' : 'Alta',
      equipmentId: vehicle.id,
      costCenter: vehicle.costCenter,
      assignedTech: vehicle.operator || 'Mecánico Flota',
      plannedHours: vehicle.category === 'HEAVY_MACHINERY' ? 6.0 : 4.0,
      plannedCost: vehicle.category === 'HEAVY_MACHINERY' ? 650.00 : 380.00,
      hourmeter: vehicle.category === 'HEAVY_MACHINERY' ? vehicle.currentHourmeter : null,
      odometer: vehicle.category === 'ROAD_VEHICLE' ? vehicle.currentOdometer : null,
      startDate: new Date().toISOString().split('T')[0],
      targetFinishDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    });

    addToast(`⚡ Orden IW31 generada para pauta ${pautaLabel} (${vehicle.plate})`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="fiori-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-black tracking-tight text-white">
              Planificación de Mantenimiento de Flota & Maquinaria
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Esquema industrial parametrizado: <strong className="text-amber-400">Maquinaria Pesada</strong> (Excavadora, Rodillo, Cargador, Retroexcavadora) con ciclo de <strong className="text-amber-400">250 Horas</strong> • <strong className="text-emerald-400">Vehículos de Carretera</strong> (Camiones, Camionetas) con ciclo de <strong className="text-emerald-400">10.000 KM</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCreateAssetOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>＋ Alta de Flota (IE01)</span>
          </button>
          <button
            onClick={() => onOpenCreateWOForVehicle && onOpenCreateWOForVehicle()}
            className="bg-sap-blue hover:bg-sap-blue-hover text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear OT Flota IW31</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Flota Registrada</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalFleet} Unidades</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{heavyCount} Maquinarias ({'250 hrs'}) | {roadCount} Vehículos ({'10k km'})</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flota Al Día</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{okCount} Unidades</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Dentro del intervalo preventivo</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Mantenimiento Próximo</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{warningCount} Unidades</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Próximo a cumplir pauta</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Servicio Vencido</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{overdueCount} Unidades</div>
            <div className="text-[11px] text-rose-700 mt-0.5">Requiere OT IW31 Inmediata</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Category Filters */}
      <div className="fiori-card p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Toda la Flota ({totalFleet})
            </button>
            <button
              onClick={() => setCategoryFilter('HEAVY_MACHINERY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                categoryFilter === 'HEAVY_MACHINERY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>🚜 Maquinaria Pesada (Ciclo c/250 hrs)</span>
            </button>
            <button
              onClick={() => setCategoryFilter('ROAD_VEHICLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                categoryFilter === 'ROAD_VEHICLE'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>🚛 Vehículos Carretera & Flota (Ciclo c/10.000 km)</span>
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-sap-blue"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OK">🟢 Al Día (OK)</option>
            <option value="WARNING">🟡 Próximo a Mantenimiento</option>
            <option value="OVERDUE">🔴 Vencido / OT Requerida</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Excavadora, Rodillo, Cargador, Camión, Patente..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sap-blue"
          />
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredFleet.map(vehicle => {
          const isHeavy = vehicle.category === 'HEAVY_MACHINERY';

          return (
            <div
              key={vehicle.id}
              className={`fiori-card p-5 rounded-2xl border transition-all ${
                vehicle.status === 'OVERDUE'
                  ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400 shadow-sm'
                  : vehicle.status === 'WARNING'
                  ? 'bg-amber-50/30 border-amber-300 hover:border-amber-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-sap-blue/60 shadow-sm'
              }`}
            >
              {/* Header of Vehicle Card */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-sap-blue px-2 py-0.5 rounded bg-sky-100/70 border border-sky-200">
                      {vehicle.id}
                    </span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                      isHeavy ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {isHeavy ? '🚜 Maquinaria (250 hrs)' : '🚛 Vehículo (10.000 km)'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Patente: {vehicle.plate}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                    {vehicle.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Operador: <strong className="text-slate-700">{vehicle.operator}</strong> • Centro Costo: <strong className="text-amber-700 font-mono">{vehicle.costCenter}</strong>
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  {vehicle.status === 'OVERDUE' && (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-sm animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pauta Vencida</span>
                    </span>
                  )}
                  {vehicle.status === 'WARNING' && (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Próximo a Pauta</span>
                    </span>
                  )}
                  {vehicle.status === 'OK' && (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Al Día</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Maintenance Cycle Bar & Counter Readings */}
              <div className="py-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      {isHeavy ? <Clock className="w-4 h-4 text-amber-600" /> : <Truck className="w-4 h-4 text-emerald-600" />}
                      <span>Lectura Actual ({isHeavy ? 'Horómetro' : 'Kilometraje'}):</span>
                      <strong className={`font-mono text-sm ${isHeavy ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {vehicle.currentValue.toLocaleString()} {vehicle.unitLabel}
                      </strong>
                    </span>
                    <span className="text-slate-600 font-mono text-[11px] font-bold">
                      Meta Pauta: <span className="underline">{vehicle.targetValue.toLocaleString()} {vehicle.unitLabel}</span>
                    </span>
                  </div>

                  {/* Progress Bar for Current Cycle */}
                  <div className="space-y-1">
                    <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          vehicle.progressPct >= 100
                            ? 'bg-rose-600'
                            : vehicle.progressPct >= 80
                            ? 'bg-amber-500'
                            : isHeavy
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${vehicle.progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{vehicle.cycleLabel}</span>
                      <span className="font-mono font-bold">
                        {vehicle.remainingValue <= 0 ? (
                          <strong className="text-rose-600">¡Vencido por {Math.abs(vehicle.remainingValue).toLocaleString()} {vehicle.unitLabel}!</strong>
                        ) : (
                          <span>Quedan {vehicle.remainingValue.toLocaleString()} {vehicle.unitLabel} para el servicio</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Último Servicio: {vehicle.lastServiceDate}</span>
                </div>

                <button
                  onClick={() => handleGeneratePreventiveWO(vehicle)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition-all ${
                    vehicle.status === 'OVERDUE'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : vehicle.status === 'WARNING'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>⚡ Generar OT IW31</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CreateAssetModal
        isOpen={isCreateAssetOpen}
        onClose={() => setIsCreateAssetOpen(false)}
      />
    </div>
  );
};
