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
  ShieldCheck,
  FileCheck,
  FileText,
  Plus,
  RefreshCw,
  XCircle,
  ChevronRight,
  Trash2
} from 'lucide-react';

import { CreateAssetModal } from '../modals/CreateAssetModal';
import { UpdateVehicleExpirationsModal } from '../modals/UpdateVehicleExpirationsModal';
import { GeneralExpirationsDashboard } from './GeneralExpirationsDashboard';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export const FleetPlanner = ({ onOpenCreateWOForVehicle }) => {
  const { assets, workOrders, createWorkOrder, currentRole, addToast, deleteAsset } = useSAP();

  const [activeSubTab, setActiveSubTab] = useState('MAINTENANCE'); // MAINTENANCE or EXPIRATIONS
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expirationsFilter, setExpirationsFilter] = useState('ALL'); // ALL, ALERT_30, EXPIRED, OK

  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [selectedVehicleForExpirations, setSelectedVehicleForExpirations] = useState(null);
  const [isExpirationsModalOpen, setIsExpirationsModalOpen] = useState(false);

  // Helper for computing accreditation/document status and days remaining
  const calculateDaysRemaining = (expiryDateStr) => {
    if (!expiryDateStr) return { days: 999, status: 'OK' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) return { days, status: 'EXPIRED' };
    if (days <= 30) return { days, status: 'ALERT_30' };
    return { days, status: 'OK' };
  };

  const getVehicleExpirationsSummary = (asset) => {
    const acc = calculateDaysRemaining(asset.accreditationExpiry);
    const perm = calculateDaysRemaining(asset.circulationPermitExpiry);
    const soap = calculateDaysRemaining(asset.soapExpiry);
    const tech = calculateDaysRemaining(asset.technicalReviewExpiry);

    let customStatusList = [];
    if (Array.isArray(asset.customExpirations)) {
      customStatusList = asset.customExpirations.map(c => ({
        ...c,
        res: calculateDaysRemaining(c.expiryDate)
      }));
    }

    const allStatuses = [
      acc.status,
      perm.status,
      soap.status,
      tech.status,
      ...customStatusList.map(c => c.res.status)
    ];

    if (allStatuses.includes('EXPIRED')) {
      return { overallStatus: 'EXPIRED', label: 'Documento Vencido', color: 'bg-rose-600 text-white font-bold', acc, perm, soap, tech, customStatusList };
    }
    if (allStatuses.includes('ALERT_30')) {
      const minDays = Math.min(
        acc.status === 'ALERT_30' ? acc.days : 999,
        perm.status === 'ALERT_30' ? perm.days : 999,
        soap.status === 'ALERT_30' ? soap.days : 999,
        tech.status === 'ALERT_30' ? tech.days : 999,
        ...customStatusList.filter(c => c.res.status === 'ALERT_30').map(c => c.res.days)
      );
      return { overallStatus: 'ALERT_30', label: `Vence en ≤${minDays}d`, color: 'bg-amber-500 text-white font-bold', acc, perm, soap, tech, customStatusList };
    }
    return { overallStatus: 'OK', label: 'Documentación al Día', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold', acc, perm, soap, tech, customStatusList };
  };

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
    lastServiceDate: a.lastMaintenance || 'N/A',
    accreditationExpiry: a.accreditationExpiry || '',
    circulationPermitExpiry: a.circulationPermitExpiry || '',
    soapExpiry: a.soapExpiry || '',
    technicalReviewExpiry: a.technicalReviewExpiry || '',
    customExpirations: Array.isArray(a.customExpirations) ? a.customExpirations : []
  }));

  // Merge latest readings from IW31 Work Orders and compute progress against rules
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

    const expirationsSummary = getVehicleExpirationsSummary(veh);

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
      status,
      expirationsSummary
    };
  });

  const filteredFleet = fleetData.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.equipmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesExpirations = expirationsFilter === 'ALL' || v.expirationsSummary.overallStatus === expirationsFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesExpirations;
  });

  // KPI Summary
  const totalFleet = fleetData.length;
  const heavyCount = fleetData.filter(v => v.category === 'HEAVY_MACHINERY').length;
  const roadCount = fleetData.filter(v => v.category === 'ROAD_VEHICLE').length;

  // Maintenance KPIs
  const overdueCount = fleetData.filter(v => v.status === 'OVERDUE').length;
  const warningCount = fleetData.filter(v => v.status === 'WARNING').length;
  const okCount = fleetData.filter(v => v.status === 'OK').length;

  // Expirations KPIs
  const expExpiredCount = fleetData.filter(v => v.expirationsSummary.overallStatus === 'EXPIRED').length;
  const expAlertCount = fleetData.filter(v => v.expirationsSummary.overallStatus === 'ALERT_30').length;
  const expOkCount = fleetData.filter(v => v.expirationsSummary.overallStatus === 'OK').length;

  const handleOpenExpirationsModal = (vehicle) => {
    setSelectedVehicleForExpirations(vehicle);
    setIsExpirationsModalOpen(true);
  };

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
              Gestión de Flota & Control de Vencimientos
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Gestión integral de la flota: Ciclos de Mantenimiento Preventivo (<strong className="text-amber-400">250 hrs / 10.000 km</strong>) y Semáforo de <strong className="text-sky-300">Acreditación en Faena, Permiso de Circulación, SOAP y Vencimientos Personalizados</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentRole === 'FIELD_MECHANIC' ? (
            <span className="bg-orange-100 text-orange-900 border border-orange-300 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm">
              <Wrench className="w-4 h-4 text-orange-600" />
              <span>Modo Mecánico: Control & Registros</span>
            </span>
          ) : (
            <>
              <button
                onClick={() => setIsCreateAssetOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>＋ Alta de Flota (#flota-activos)</span>
              </button>
              <button
                onClick={() => onOpenCreateWOForVehicle && onOpenCreateWOForVehicle()}
                className="bg-sap-blue hover:bg-sap-blue-hover text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear OT (#mnt-ordenes)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Sub-Tab Switcher (Mantenimiento vs Vencimientos Vehículo vs Dashboard General) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('MAINTENANCE')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeSubTab === 'MAINTENANCE'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Pautas de Servicio & Horómetros (250h / 10k km)</span>
          {overdueCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {overdueCount} Vencidos
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('EXPIRATIONS')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeSubTab === 'EXPIRATIONS'
              ? 'bg-sky-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4 text-sky-300" />
          <span>Acreditación & Vencimientos Vehiculares</span>
          {expAlertCount + expExpiredCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {expAlertCount + expExpiredCount} Alertas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('GENERAL_DASHBOARD')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeSubTab === 'GENERAL_DASHBOARD'
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 border border-amber-200/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-200" />
          <span>📊 Dashboard General de Vencimientos (Empresa)</span>
        </button>
      </div>

      {/* KPI Cards based on Active Sub-Tab */}
      {activeSubTab === 'MAINTENANCE' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Flota Registrada</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalFleet} Unidades</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{heavyCount} Maquinarias | {roadCount} Vehículos</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicios al Día</div>
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
              <div className="text-[11px] text-rose-700 mt-0.5">Requiere OT (#mnt-ordenes) Inmediata</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Flota Auditada</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalFleet} Vehículos</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Acreditaciones y Legalidad</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentación al Día</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{expOkCount} Vehículos</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Habilitados para faena</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="fiori-card p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Por Vencer (≤30 Días)</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{expAlertCount} Vehículos</div>
              <div className="text-[11px] text-amber-700 mt-0.5">Requiere renovación cercana</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="fiori-card p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Documentos Vencidos</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{expExpiredCount} Vehículos</div>
              <div className="text-[11px] text-rose-700 mt-0.5">Bloqueado para tránsito/faena</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Category Filters */}
      <div className="fiori-card p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
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
              <span>🚜 Maquinaria Pesada</span>
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
              <span>🚛 Vehículos & Carretera</span>
            </button>
          </div>

          {activeSubTab === 'MAINTENANCE' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-sap-blue"
            >
              <option value="ALL">Todos los Estados de Mantenimiento</option>
              <option value="OK">Al Día (OK)</option>
              <option value="WARNING">Próximo a Mantenimiento</option>
              <option value="OVERDUE">Vencido / OT Requerida</option>
            </select>
          ) : (
            <select
              value={expirationsFilter}
              onChange={(e) => setExpirationsFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-sky-600"
            >
              <option value="ALL">Todos los Estados Documentales</option>
              <option value="OK">Documentación al Día</option>
              <option value="ALERT_30">Vence en ≤30 Días</option>
              <option value="EXPIRED">Documento Vencido</option>
            </select>
          )}
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

      {/* ----------------- SUB-TAB 1: PAUTAS Y MANTENIMIENTO ----------------- */}
      {activeSubTab === 'MAINTENANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredFleet.map(vehicle => {
            const isHeavy = vehicle.category === 'HEAVY_MACHINERY';
            const expSum = vehicle.expirationsSummary;

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
                    <div className="flex flex-wrap items-center gap-1.5">
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
                  <div className="flex flex-col items-end space-y-1">
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

                    {/* Expiration badge preview */}
                    <button
                      onClick={() => handleOpenExpirationsModal(vehicle)}
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold flex items-center space-x-1 ${expSum.color}`}
                      title="Ver vencimientos documentales del vehículo"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>{expSum.label}</span>
                    </button>
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
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenExpirationsModal(vehicle)}
                      className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Vencimientos</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Está seguro de eliminar el equipo ${vehicle.name} (${vehicle.id}) de la flota?`)) {
                          deleteAsset(vehicle.id);
                        }
                      }}
                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar vehículo/equipo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleGeneratePreventiveWO(vehicle)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer ${
                      vehicle.status === 'OVERDUE'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : vehicle.status === 'WARNING'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>⚡ Generar OT (#mnt-ordenes)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- SUB-TAB 2: VENCIMIENTOS & ACREDITACION ----------------- */}
      {activeSubTab === 'EXPIRATIONS' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sky-900 text-sm">
              <FileCheck className="w-5 h-5 text-sky-600" />
              <span>Semáforo de Vencimientos Documentales & Acreditación de Vehículos</span>
            </div>
            <p className="text-sky-800 leading-relaxed">
              Monitoreo continuo de los 3 documentos legales base: <strong>1. Acreditación en Faena</strong>, <strong>2. Permiso de Circulación</strong>, <strong>3. SOAP (Seguro Obligatorio)</strong> y todos los <strong>vencimientos personalizados</strong> agregados por el usuario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleet.map(vehicle => {
              const exp = vehicle.expirationsSummary;

              return (
                <div
                  key={vehicle.id}
                  className={`fiori-card p-5 rounded-2xl border bg-white shadow-sm space-y-4 relative overflow-hidden transition-all ${
                    exp.overallStatus === 'EXPIRED'
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : exp.overallStatus === 'ALERT_30'
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-sap-blue px-2 py-0.5 rounded bg-sky-100/70 border border-sky-200">
                          {vehicle.id}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {vehicle.plate}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {vehicle.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {vehicle.equipmentType} • CC: <strong className="text-slate-700 font-mono">{vehicle.costCenter}</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${exp.color}`}>
                        {exp.label}
                      </span>
                      {Number(vehicle.counterCorrectionCount || 0) > 0 && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          Number(vehicle.counterCorrectionCount) > 2 
                            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`} title="Total de correcciones de lectura acumuladas">
                          🔧 {vehicle.counterCorrectionCount} Ajustes Lectura
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Core Required Expirations Grid */}
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Documentos Legales Obligatorios</span>
                      <span className="text-[10px] text-slate-400 font-mono">Días Restantes</span>
                    </div>

                    {/* 1. Acreditación en Faena */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-slate-800 text-[11px]">1. Acreditación en Faena</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {vehicle.accreditationExpiry ? formatDateDDMMYYYY(vehicle.accreditationExpiry) : 'No Ingresado'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        exp.acc.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        exp.acc.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          exp.acc.status === 'EXPIRED' ? 'bg-rose-500' :
                          exp.acc.status === 'ALERT_30' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span>{exp.acc.status === 'EXPIRED' ? 'Vencido' : exp.acc.status === 'ALERT_30' ? `${exp.acc.days}d` : `${exp.acc.days}d`}</span>
                      </span>
                    </div>

                    {/* 2. Permiso de Circulación */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-slate-800 text-[11px]">2. Permiso de Circulación</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {vehicle.circulationPermitExpiry ? formatDateDDMMYYYY(vehicle.circulationPermitExpiry) : 'No Ingresado'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        exp.perm.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        exp.perm.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          exp.perm.status === 'EXPIRED' ? 'bg-rose-500' :
                          exp.perm.status === 'ALERT_30' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span>{exp.perm.status === 'EXPIRED' ? 'Vencido' : exp.perm.status === 'ALERT_30' ? `${exp.perm.days}d` : `${exp.perm.days}d`}</span>
                      </span>
                    </div>

                    {/* 3. SOAP */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-slate-800 text-[11px]">3. Seguro Obligatorio (SOAP)</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {vehicle.soapExpiry ? formatDateDDMMYYYY(vehicle.soapExpiry) : 'No Ingresado'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        exp.soap.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        exp.soap.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          exp.soap.status === 'EXPIRED' ? 'bg-rose-500' :
                          exp.soap.status === 'ALERT_30' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span>{exp.soap.status === 'EXPIRED' ? 'Vencido' : exp.soap.status === 'ALERT_30' ? `${exp.soap.days}d` : `${exp.soap.days}d`}</span>
                      </span>
                    </div>

                    {/* 4. Revisión Técnica */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-slate-800 text-[11px]">4. Revisión Técnica</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {vehicle.technicalReviewExpiry ? formatDateDDMMYYYY(vehicle.technicalReviewExpiry) : 'No Ingresado'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        exp.tech.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        exp.tech.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          exp.tech.status === 'EXPIRED' ? 'bg-rose-500' :
                          exp.tech.status === 'ALERT_30' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span>{exp.tech.status === 'EXPIRED' ? 'Vencido' : exp.tech.status === 'ALERT_30' ? `${exp.tech.days}d` : `${exp.tech.days}d`}</span>
                      </span>
                    </div>
                  </div>

                  {/* Custom Expirations List Section */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase">
                      <span>Vencimientos Personalizados ({exp.customStatusList.length})</span>
                      <span className="text-[10px] text-amber-700 font-normal">Disponibles</span>
                    </div>

                    {exp.customStatusList.length === 0 ? (
                      <div className="text-[11px] text-amber-800 italic">
                        Sin vencimientos adicionales agregados.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {exp.customStatusList.map(item => (
                          <div key={item.id} className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">{item.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{formatDateDDMMYYYY(item.expiryDate)}</span>
                            </div>
                            <span className={`inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              item.res.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              item.res.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.res.status === 'EXPIRED' ? 'bg-rose-500' :
                                item.res.status === 'ALERT_30' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                              <span>{item.res.status === 'EXPIRED' ? 'Vencido' : item.res.status === 'ALERT_30' ? `${item.res.days}d` : `${item.res.days}d`}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <button
                    onClick={() => handleOpenExpirationsModal(vehicle)}
                    className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualizar y Agregar Vencimientos</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: DASHBOARD GENERAL DE VENCIMIENTOS ----------------- */}
      {activeSubTab === 'GENERAL_DASHBOARD' && (
        <GeneralExpirationsDashboard />
      )}

      {/* Modal Alta de Equipo IE01 */}
      <CreateAssetModal
        isOpen={isCreateAssetOpen}
        onClose={() => setIsCreateAssetOpen(false)}
      />

      {/* Modal Actualización de Vencimientos de Flota */}
      <UpdateVehicleExpirationsModal
        isOpen={isExpirationsModalOpen}
        onClose={() => {
          setIsExpirationsModalOpen(false);
          setSelectedVehicleForExpirations(null);
        }}
        vehicle={selectedVehicleForExpirations}
      />
    </div>
  );
};
