import React, { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSAP } from '../../context/SAPContext';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  HardHat,
  Calendar,
  DollarSign,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  XCircle,
  MapPin,
  Mail,
  Edit,
  Cpu,
  Sparkles,
  Trash2
} from 'lucide-react';
import { UpdateComplianceModal } from '../modals/UpdateComplianceModal';
import { EditEmployeeModal } from '../modals/EditEmployeeModal';
import { HRAccreditationTab } from './HRAccreditationTab';
import { HRAbsenceTab } from './HRAbsenceTab';
import { HRPayrollTab } from './HRPayrollTab';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { detectPayrollAnomalies } from '../../services/hcmAnomalyDetectionService';

export const HRMaster = ({ onOpenCreateEmployee, onOpenCreateAbsence }) => {
  const {
    employees = [],
    absences = [],
    payrollRuns = [],
    plants = [],
    reseedEmployees,
    deleteEmployee,
    updateAbsenceStatus,
    processPayrollRun,
    searchTerm,
    setSearchTerm
  } = useSAP();

  const [activeSubTab, setActiveSubTab] = useState('PA20_PA30');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedContractType, setSelectedContractType] = useState('ALL');
  const [complianceFilter, setComplianceFilter] = useState('ALL'); // ALL, ALERT_30, EXPIRED, OK

  // Modal State for updating compliance
  const [complianceEmployee, setComplianceEmployee] = useState(null);
  const [isUpdateComplianceOpen, setIsUpdateComplianceOpen] = useState(false);

  // Modal State for editing employee (PA30)
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);

  const isAnyFilterActive = selectedDept !== 'ALL' || selectedPlant !== 'ALL' || selectedContractType !== 'ALL' || complianceFilter !== 'ALL' || Boolean(searchTerm);

  const resetAllFilters = () => {
    setSelectedDept('ALL');
    setSelectedPlant('ALL');
    setSelectedContractType('ALL');
    setComplianceFilter('ALL');
    setSearchTerm('');
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setIsEditEmployeeOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditEmployeeOpen(false);
    resetAllFilters(); // Restablece los filtros automáticamente para mostrar el listado completo con los cambios
  };

  const handleCloseComplianceModal = () => {
    setIsUpdateComplianceOpen(false);
    resetAllFilters(); // Restablece los filtros para mantener el colaborador visible
  };

  // Helper for computing accreditation status and days remaining
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

  const getEmployeeComplianceSummary = (emp) => {
    let med = calculateDaysRemaining(emp.medicalExamExpiry);
    let acc = calculateDaysRemaining(emp.accreditationExpiry);
    let saf = calculateDaysRemaining(emp.safetyCourseExpiry);
    let ctr = (emp.contractType === 'Plazo Fijo' && emp.contractExpiry)
      ? calculateDaysRemaining(emp.contractExpiry)
      : { days: 999, status: 'OK' };

    let blockedFaenaName = null;
    let alertFaenaName = null;

    if (emp.faenasAccredited && emp.faenasAccredited.length > 0) {
      emp.faenasAccredited.forEach(f => {
        const m = calculateDaysRemaining(f.medicalExamExpiry);
        const a = calculateDaysRemaining(f.accreditationExpiry);
        const s = calculateDaysRemaining(f.safetyCourseExpiry);

        if (m.status === 'EXPIRED' || a.status === 'EXPIRED' || s.status === 'EXPIRED') {
          blockedFaenaName = f.faenaName;
        } else if (m.status === 'ALERT_30' || a.status === 'ALERT_30' || s.status === 'ALERT_30') {
          alertFaenaName = f.faenaName;
        }

        if (m.days < med.days) med = m;
        if (a.days < acc.days) acc = a;
        if (s.days < saf.days) saf = s;
      });
    }

    if (med.status === 'EXPIRED' || acc.status === 'EXPIRED' || saf.status === 'EXPIRED' || ctr.status === 'EXPIRED') {
      const blockedLabel = blockedFaenaName ? `Bloqueado en ${blockedFaenaName}` : 'Vencido';
      return { overallStatus: 'EXPIRED', label: blockedLabel, color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', med, acc, saf, ctr };
    }
    if (med.status === 'ALERT_30' || acc.status === 'ALERT_30' || saf.status === 'ALERT_30' || ctr.status === 'ALERT_30') {
      const minDays = Math.min(
        med.status === 'ALERT_30' ? med.days : 999,
        acc.status === 'ALERT_30' ? acc.days : 999,
        saf.status === 'ALERT_30' ? saf.days : 999,
        ctr.status === 'ALERT_30' ? ctr.days : 999
      );
      const alertLabel = alertFaenaName ? `Alerta en ${alertFaenaName} (${minDays}d)` : `Por Vencer (${minDays}d)`;
      return { overallStatus: 'ALERT_30', label: alertLabel, color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold', med, acc, saf, ctr };
    }
    return { overallStatus: 'OK', label: 'Vigente en Faenas', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium', med, acc, saf, ctr };
  };



  // KPIs Calculations
  const activeEmployees = employees.filter(e => e.status !== 'Finiquitado');
  const alert30Employees = employees.filter(e => {
    const sum = getEmployeeComplianceSummary(e);
    return sum.overallStatus === 'ALERT_30' || sum.overallStatus === 'EXPIRED';
  });
  const totalGrossPayroll = activeEmployees.reduce((acc, e) => acc + (Number(e.baseSalary) || 0), 0);
  const activeLeavesCount = absences.filter(a => a.status === 'Aprobado' || a.status === 'En Proceso').length;

  // Filtered employees list  // Calculo de Filtros
  const filteredEmployees = employees.filter(emp => {
    const summary = getEmployeeComplianceSummary(emp);
    const matchesSearch = !searchTerm ||
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.assignedFaena?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    const matchesPlant = selectedPlant === 'ALL' || emp.assignedPlantId === selectedPlant;
    const matchesContract = selectedContractType === 'ALL' || emp.contractType === selectedContractType;

    let matchesCompliance = true;
    if (complianceFilter === 'ALERT_30') matchesCompliance = summary.overallStatus === 'ALERT_30';
    if (complianceFilter === 'EXPIRED') matchesCompliance = summary.overallStatus === 'EXPIRED';
    if (complianceFilter === 'OK') matchesCompliance = summary.overallStatus === 'OK';

    return matchesSearch && matchesDept && matchesPlant && matchesContract && matchesCompliance;
  });

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredEmployees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  // Ejecución autónoma del motor de Machine Learning de Auditoría HCM

  const mlAuditedPayrolls = detectPayrollAnomalies(payrollRuns, employees);
  const mlCriticalCount = mlAuditedPayrolls.filter(a => a.anomalyLevel === 'CRITICAL').length;
  const mlWarningCount = mlAuditedPayrolls.filter(a => a.anomalyLevel === 'WARNING').length;
  const mlNormalCount = mlAuditedPayrolls.filter(a => a.anomalyLevel === 'NORMAL').length;
  const mlAvgConfidence = mlAuditedPayrolls.length > 0
    ? Math.round(mlAuditedPayrolls.reduce((acc, a) => acc + a.confidenceScore, 0) / mlAuditedPayrolls.length)
    : 95;;

  const handleOpenComplianceModal = (emp) => {
    setComplianceEmployee(emp);
    setIsUpdateComplianceOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 border-l-4 border-l-sky-600 shadow-sm text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Módulo Axomira HCM • Gestión de Capital Humano</span>

          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Recursos Humanos & Control de Acreditación de Faenas
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Administración del maestro de personal (`#rrhh-personal`), semáforo de acreditación y exámenes en faena, gestión de licencias y liquidaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              reseedEmployees();
              resetAllFilters();
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs flex items-center space-x-1.5 transition-all"
            title="Cargar catálogo completo de 12 colaboradores mineros e industriales"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nómina Completa (12)</span>
          </button>
          <button
            onClick={onOpenCreateEmployee}
            className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Alta Empleado (#rrhh-personal)</span>
          </button>
          <button
            onClick={onOpenCreateAbsence}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Registrar Licencia</span>
          </button>
        </div>
      </div>

      {/* Top HCM KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Empleados */}
        <div
          onClick={() => { setActiveSubTab('PA20_PA30'); resetAllFilters(); }}
          className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-sky-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dotación Activa</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeEmployees.length} Colaboradores</div>
            <div className="text-[11px] text-sky-700 dark:text-sky-400 font-medium group-hover:underline mt-1">Ver Listado General ➔</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Masa Salarial Mensual */}
        <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Masa Salarial Bruta</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              ${totalGrossPayroll.toLocaleString('es-CL')} CLP
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Presupuesto Mensual HCM</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Alertas de Acreditación (30 Días) */}
        <div
          onClick={() => { setActiveSubTab('ACCREDITATION'); setComplianceFilter('ALERT_30'); }}
          className="fiori-glass p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Alertas Acreditación (≤30d)
            </div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-0.5">{alert30Employees.length} Alertas</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium group-hover:underline">
              Ver Semáforo de Faenas ➔
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Licencias y Ausentismo */}
        <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ausentismo / Licencias</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeLeavesCount} Ausentes</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Vacaciones y Médicas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1.5 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => {
            setActiveSubTab('PA20_PA30');
            resetAllFilters();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PA20_PA30' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Maestro de Personal (#rrhh-personal)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ACCREDITATION')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'ACCREDITATION' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Acreditación y Control de Faenas</span>
          {alert30Employees.length > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
              {alert30Employees.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('PT_TIME')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PT_TIME' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gestión de Tiempos y Licencias (PT)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PY_PAYROLL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PY_PAYROLL' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Nómina y Liquidaciones (PY)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PY01_ML_AUDIT')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PY01_ML_AUDIT'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Auditoría ML de Nóminas (PY01)</span>
          {mlCriticalCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold animate-bounce shadow-xs">
              {mlCriticalCount}
            </span>
          )}
        </button>


        <button
          onClick={() => setActiveSubTab('OM_ORGANIZATION')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'OM_ORGANIZATION' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Estructura Organizacional (OM)</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: MAESTRO DE PERSONAL (PA20/PA30) ----------------- */}
      {activeSubTab === 'PA20_PA30' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="fiori-glass p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar colaborador (Nombre, RUT, Cargo, Faena)..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-bold">Departamento:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Todos los Departamentos</option>
                  <option value="Mantenimiento de Planta">Mantenimiento de Planta</option>
                  <option value="Operaciones Mina">Operaciones Mina</option>
                  <option value="Almacén e Inventarios">Almacén e Inventarios</option>
                  <option value="Gestión de Flota">Gestión de Flota</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-bold">Centro Operativo:</span>
                <select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Todos los Centros</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.id} ({p.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-bold">Tipo Contrato:</span>
                <select
                  value={selectedContractType}
                  onChange={(e) => setSelectedContractType(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Todos los Contratos</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Plazo Fijo">Plazo Fijo</option>
                  <option value="Honorarios">Honorarios</option>
                </select>
              </div>

              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
                  title="Mostrar todos los colaboradores sin filtros"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ver Listado Completo ({employees.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={onOpenCreateEmployee}
              className="bg-sap-blue hover:bg-sap-blue-hover text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Registro (#rrhh-personal)</span>
            </button>
          </div>

          {/* Active Filter Notice Banner */}
          {isAnyFilterActive && (
            <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-xs flex items-center justify-between text-sky-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-sky-600" />
                <span>Filtro activo: Mostrando <strong>{filteredEmployees.length}</strong> de <strong>{employees.length}</strong> colaboradores en el maestro.</span>
              </span>
              <button
                onClick={resetAllFilters}
                className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs"
              >
                Ver Listado Completo
              </button>
            </div>
          )}

          {/* Employee Master Table (Virtualizada) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div ref={parentRef} className="overflow-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider shadow-xs">
                  <tr>
                    <th className="p-3">ID / RUT</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Cargo y Departamento</th>
                    <th className="p-3">Contrato e Ingreso</th>
                    <th className="p-3">Faena Asignada</th>
                    <th className="p-3">Sueldo Base</th>
                    <th className="p-3">Estado Acreditación</th>
                    <th className="p-3 text-center">Estado Laboral</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paddingTop > 0 && (
                    <tr>
                      <td colSpan={9} style={{ height: `${paddingTop}px` }} />
                    </tr>
                  )}
                  {virtualItems.map(virtualRow => {
                    const emp = filteredEmployees[virtualRow.index];
                    if (!emp) return null;
                    const comp = getEmployeeComplianceSummary(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-sap-blue">{emp.id}</div>
                          <div className="font-mono text-[11px] text-slate-500">{emp.rut}</div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border-2 border-sap-blue shadow-xs shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 shrink-0 text-sm">
                                {emp.name ? emp.name.charAt(0) : 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{emp.name}</div>
                              <a
                                href={`mailto:${emp.email}`}
                                className="text-[11px] text-slate-500 hover:text-sap-blue hover:underline inline-flex items-center space-x-1 font-mono transition-colors group"
                                title={`Enviar correo a ${emp.name}`}
                              >
                                <Mail className="w-3 h-3 text-slate-400 group-hover:text-sap-blue transition-colors shrink-0" />
                                <span>{emp.email}</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{emp.position}</div>
                          <div className="text-[11px] text-slate-500">{emp.department}</div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              emp.contractType === 'Plazo Fijo' ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {emp.contractType || 'Indefinido'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Ingreso: {formatDateDDMMYYYY(emp.hireDate)}</div>
                          {emp.contractType === 'Plazo Fijo' && emp.contractExpiry && (
                            <div className="mt-1">
                              {comp.ctr.status === 'EXPIRED' && (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Contrato Vencido ({formatDateDDMMYYYY(emp.contractExpiry)})
                                </span>
                              )}
                              {comp.ctr.status === 'ALERT_30' && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Vence en {comp.ctr.days}d ({formatDateDDMMYYYY(emp.contractExpiry)})
                                </span>
                              )}
                              {comp.ctr.status === 'OK' && (
                                <span className="text-[10px] text-slate-500 font-mono block">Vence: {formatDateDDMMYYYY(emp.contractExpiry)}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col space-y-1">
                            {(emp.faenasAccredited && emp.faenasAccredited.length > 0 ? emp.faenasAccredited : [{ id: '1', faenaName: emp.faena }]).map(f => (
                              <span key={f.id || f.faenaName} className="inline-flex items-center text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200 w-max">
                                <MapPin className="w-3 h-3 mr-1 text-sky-600 shrink-0" />
                                <span>{f.faenaName}</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-900">
                          ${Number(emp.baseSalary).toLocaleString('es-CL')}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${comp.color}`}>
                            {comp.overallStatus === 'ALERT_30' && <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />}
                            {comp.overallStatus === 'EXPIRED' && <XCircle className="w-3 h-3 mr-1 text-rose-600" />}
                            {comp.overallStatus === 'OK' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
                            {comp.label}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            emp.status === 'Activo' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' :
                            emp.status === 'Licencia Médica' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {emp.status}
                          </span>
                        </td>


                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            title="Editar ficha completa del colaborador (#rrhh-personal)"
                            className="bg-sap-blue hover:bg-sap-blue-hover text-white px-2 py-1 rounded text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleOpenComplianceModal(emp)}
                            title="Renovar fechas de acreditación y exámenes"
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Acreditaciones
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar la ficha de ${emp.name} (${emp.id})?`)) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            title="Eliminar colaborador"
                            className="bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 p-1 rounded text-[11px] font-bold transition-all inline-flex items-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr>
                      <td colSpan={9} style={{ height: `${paddingBottom}px` }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: ACREDITACIÓN Y CONTROL DE FAENAS ----------------- */}
      {activeSubTab === 'ACCREDITATION' && (
        <HRAccreditationTab
          employees={employees}
          complianceFilter={complianceFilter}
          setComplianceFilter={setComplianceFilter}
          onOpenComplianceModal={(emp) => {
            setComplianceEmployee(emp);
            setIsUpdateComplianceOpen(true);
          }}
          calculateDaysRemaining={calculateDaysRemaining}
        />
      )}

      {/* ----------------- SUB-TAB 3: GESTIÓN DE TIEMPOS Y LICENCIAS (PT) ----------------- */}
      {activeSubTab === 'PT_TIME' && (
        <HRAbsenceTab
          absences={absences}
          onOpenCreateAbsence={onOpenCreateAbsence}
          updateAbsenceStatus={updateAbsenceStatus}
        />
      )}

      {/* ----------------- SUB-TAB 4: NÓMINA Y LIQUIDACIONES (PY) ----------------- */}
      {activeSubTab === 'PY_PAYROLL' && (
        <HRPayrollTab
          payrollRuns={payrollRuns}
          processPayrollRun={processPayrollRun}
        />
      )}

      {/* ----------------- SUB-TAB 5: ESTRUCTURA ORGANIZACIONAL (OM) ----------------- */}
      {activeSubTab === 'OM_ORGANIZATION' && (
        <div className="space-y-4">
          <div className="fiori-glass p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Estructura Organizacional & Unidades de Planta (OM)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de personal por unidades organizativas y dotaciones operativas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Mantenimiento de Planta', 'Operaciones Mina', 'Almacén e Inventarios', 'Gestión de Flota', 'Recursos Humanos', 'Administración y Finanzas'].map(dept => {
              const deptEmp = employees.filter(e => e.department === dept);
              const activeCount = deptEmp.filter(e => e.status === 'Activo').length;
              return (
                <div key={dept} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{dept}</h4>
                    <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded text-xs">
                      {deptEmp.length} Personas
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Dotación Activa:</span>
                      <strong className="text-emerald-700">{activeCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Licencias / Ausentes:</span>
                      <strong className="text-purple-700">{deptEmp.length - activeCount}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 5: AUDITORÍA ML DE NÓMINAS (PY01) ----------------- */}
      {activeSubTab === 'PY01_ML_AUDIT' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-purple-800/50 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Módulo HCM — Machine Learning Infe-Engine v2.4</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <span>Auditoría Autónoma de Anomalías en Liquidaciones de Sueldo (PY01)</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl">
                  Inferencia estadística multivariable en tiempo real (Z-Score & IQR). Identifica descalces en horas extras, distorsiones de haberes y desviaciones respecto a la media del departamento antes del pago bancario masivo.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-950/80 border border-purple-700/60 px-4 py-2 rounded-xl text-right font-mono">
                  <div className="text-[10px] text-purple-300 font-bold">Confianza Inferencia ML</div>
                  <div className="text-lg font-black text-amber-300">{mlAvgConfidence}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* ML KPI Metrics Cockpit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
                <span>Nóminas Auditadas</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{mlAuditedPayrolls.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">100% analizadas por el modelo</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 shadow-xs space-y-1">
              <div className="text-xs text-rose-700 font-bold flex items-center justify-between">
                <span>Anomalías Críticas (🔴)</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-900 font-mono">{mlCriticalCount}</div>
              <div className="text-[11px] text-rose-700 font-medium">Requieren revisión previa al pago</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-xs space-y-1">
              <div className="text-xs text-amber-800 font-bold flex items-center justify-between">
                <span>Advertencias Moderadas (🟡)</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">{mlWarningCount}</div>
              <div className="text-[11px] text-amber-700 font-medium">Ligeras variaciones sobre la media</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
                <span>Parámetros Normales (🟢)</span>
                <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{mlNormalCount}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Validados dentro del rango estadístico</div>
            </div>
          </div>

          {/* ML Audit Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Resultados de Auditoría de Nómina en Tiempo Real</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                Ordenado por Índice de Riesgo de Anomalía (ML Score)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">ID Nómina / Colaborador</th>
                    <th className="p-3">Departamento / Cargo</th>
                    <th className="p-3">Sueldo Base</th>
                    <th className="p-3">Horas Extras (Z-Score)</th>
                    <th className="p-3">Sueldo Líquido</th>
                    <th className="p-3 text-center">Índice Riesgo ML</th>
                    <th className="p-3">Hallazgos y Razones Inferencia</th>
                    <th className="p-3 text-center">Estado Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {mlAuditedPayrolls
                    .sort((a, b) => b.anomalyScore - a.anomalyScore)
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-sky-700 dark:text-sky-400">{item.id}</div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.employeeName}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.department}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.position}</div>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          ${Number(item.baseSalary || 0).toLocaleString('es-CL')}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white font-mono">{item.overtimeHours} hrs</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Z-Score: <strong className={item.zOvertimeScore >= 1.5 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}>
                              {item.zOvertimeScore > 0 ? `+${item.zOvertimeScore}σ` : `${item.zOvertimeScore}σ`}
                            </strong>
                          </div>
                        </td>

                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          ${Number(item.totalNet || item.baseSalary || 0).toLocaleString('es-CL')}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black border ${
                              item.anomalyLevel === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                                : item.anomalyLevel === 'WARNING'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                            }`}>
                              {item.anomalyScore}% Riesgo
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {item.anomalyLevel}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            {item.reasons.map((r, idx) => (
                              <div key={idx} className="text-[11px] font-medium leading-tight">
                                {r}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          {item.anomalyLevel === 'CRITICAL' ? (
                            <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Retenido p/ Revisión</span>
                            </span>
                          ) : item.anomalyLevel === 'WARNING' ? (
                            <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Revisión Sugerida</span>
                            </span>
                          ) : (
                            <span className="bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-300" />
                              <span>Aprobado por ML</span>
                            </span>
                          )}

                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <UpdateComplianceModal
        isOpen={isUpdateComplianceOpen}
        onClose={handleCloseComplianceModal}
        employee={complianceEmployee}
      />

      {/* Edit Employee Record Modal (PA30) */}
      <EditEmployeeModal
        isOpen={isEditEmployeeOpen}
        onClose={handleCloseEditModal}
        employee={editingEmployee}
      />
    </div>
  );
};
