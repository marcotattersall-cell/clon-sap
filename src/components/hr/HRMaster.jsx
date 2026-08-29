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
  FileCheck2,
  Briefcase,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  XCircle,
  FileText,
  Award,
  Layers,
  MapPin,
  Mail,
  Edit,
  Cpu,
  Sparkles,
  Zap,
  Activity,
  Trash2
} from 'lucide-react';
import { UpdateComplianceModal } from '../modals/UpdateComplianceModal';
import { EditEmployeeModal } from '../modals/EditEmployeeModal';
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
    updateEmployeeStatus,
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
    return { overallStatus: 'OK', label: 'Vigente en Faenas', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', med, acc, saf, ctr };
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
            <span>Módulo Operam HCM • Gestión de Capital Humano</span>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
            title="Cargar catálogo completo de 12 colaboradores mineros e industriales"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nómina Completa (12)</span>
          </button>
          <button
            onClick={onOpenCreateEmployee}
            className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Alta Empleado (#rrhh-personal)</span>
          </button>
          <button
            onClick={onOpenCreateAbsence}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-200 flex items-center space-x-2 transition-all"
          >
            <Calendar className="w-4 h-4 text-sky-700" />
            <span>Registrar Licencia</span>
          </button>
        </div>
      </div>

      {/* Top HCM KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Empleados */}
        <div
          onClick={() => { setActiveSubTab('PA20_PA30'); resetAllFilters(); }}
          className="fiori-glass p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-sky-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dotación Activa</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{activeEmployees.length} Colaboradores</div>
            <div className="text-[11px] text-sky-700 font-medium group-hover:underline mt-1">Ver Listado General ➔</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Masa Salarial Mensual */}
        <div className="fiori-glass p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Salarial Bruta</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              ${totalGrossPayroll.toLocaleString('es-CL')} CLP
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Presupuesto Mensual HCM</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Alertas de Acreditación (30 Días) */}
        <div
          onClick={() => { setActiveSubTab('ACCREDITATION'); setComplianceFilter('ALERT_30'); }}
          className="fiori-glass p-4 rounded-xl border border-amber-200 bg-amber-50/40 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Alertas Acreditación (≤30d)
            </div>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{alert30Employees.length} Alertas</div>
            <div className="text-[11px] text-amber-700 font-medium group-hover:underline">
              Ver Semáforo de Faenas ➔
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Licencias y Ausentismo */}
        <div className="fiori-glass p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ausentismo / Licencias</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{activeLeavesCount} Ausentes</div>
            <div className="text-[11px] text-slate-500 mt-1">Vacaciones y Médicas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => {
            setActiveSubTab('PA20_PA30');
            resetAllFilters();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PA20_PA30' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Maestro de Personal (#rrhh-personal)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ACCREDITATION')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'ACCREDITATION' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
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
            activeSubTab === 'PT_TIME' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gestión de Tiempos y Licencias (PT)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PY_PAYROLL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'PY_PAYROLL' ? 'bg-sap-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Nómina y Liquidaciones (PY)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PY01_ML_AUDIT')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 border transition-all ${
            activeSubTab === 'PY01_ML_AUDIT'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/40'
              : 'bg-purple-900/95 text-purple-100 border-purple-700/60 hover:bg-purple-800 shadow-xs'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>🤖 Auditoría ML de Nóminas (PY01)</span>
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
                            emp.status === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            emp.status === 'Licencia Médica' ? 'bg-purple-50 text-purple-700 border-purple-200' :
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
        <div className="space-y-4">
          {/* Header Banner & Alert Notice */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
              <HardHat className="w-5 h-5 text-amber-600" />
              <span>Control y Monitor de Acreditaciones por Faena (Regla Alerta 30 Días)</span>
            </div>
            <p className="text-amber-800">
              El sistema evalúa continuamente la vigencia de los <strong>Exámenes Ocupacionales</strong>, <strong>Pases de Acreditación de Faena</strong> y <strong>Cursos de Prevención</strong>. Si faltan 30 días o menos para el vencimiento, la alerta permanecerá activa <strong>sin cambiar automáticamente hasta que se ingrese la renovación</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setComplianceFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  complianceFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Todos ({employees.length})
              </button>
              <button
                onClick={() => setComplianceFilter('ALERT_30')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                  complianceFilter === 'ALERT_30' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Por Vencer (≤30 Días)
              </button>
              <button
                onClick={() => setComplianceFilter('EXPIRED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                  complianceFilter === 'EXPIRED' ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Vencidos
              </button>
              <button
                onClick={() => setComplianceFilter('OK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                  complianceFilter === 'OK' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vigentes
              </button>
            </div>
          </div>

          {/* Compliance Semáforo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => {
              const comp = getEmployeeComplianceSummary(emp);
              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs space-y-3 relative overflow-hidden transition-all ${
                    comp.overallStatus === 'EXPIRED' ? 'border-rose-300 ring-1 ring-rose-200' :
                    comp.overallStatus === 'ALERT_30' ? 'border-amber-300 ring-1 ring-amber-200' :
                    'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-xs shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 shrink-0 text-base">
                          {emp.name ? emp.name.charAt(0) : 'U'}
                        </div>
                      )}
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">{emp.id} • {emp.rut}</span>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{emp.name}</h4>
                        <p className="text-xs text-slate-600">{emp.position}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${comp.color}`}>
                      {comp.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Faenas Acreditadas ({emp.faenasAccredited ? emp.faenasAccredited.length : 1}):</span>
                      <span className="text-[10px] text-slate-500 font-normal">Estado Operativo</span>
                    </div>

                    {(emp.faenasAccredited && emp.faenasAccredited.length > 0 ? emp.faenasAccredited : [
                      { id: '1', faenaName: emp.faena, medicalExamExpiry: emp.medicalExamExpiry, accreditationExpiry: emp.accreditationExpiry, safetyCourseExpiry: emp.safetyCourseExpiry }
                    ]).map(f => {
                      const fMed = calculateDaysRemaining(f.medicalExamExpiry);
                      const fAcc = calculateDaysRemaining(f.accreditationExpiry);
                      const fSaf = calculateDaysRemaining(f.safetyCourseExpiry);
                      const isFBlocked = fMed.status === 'EXPIRED' || fAcc.status === 'EXPIRED' || fSaf.status === 'EXPIRED';
                      const isFAlert = !isFBlocked && (fMed.status === 'ALERT_30' || fAcc.status === 'ALERT_30' || fSaf.status === 'ALERT_30');

                      return (
                        <div key={f.id || f.faenaName} className="bg-white p-2 rounded border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                              {f.faenaName}
                            </span>
                            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              isFBlocked ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              isFAlert ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isFBlocked ? 'bg-rose-500' : isFAlert ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span>{isFBlocked ? 'Bloqueado' : isFAlert ? 'Alerta (≤30d)' : 'Habilitado'}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1 font-mono">
                            <div className="bg-slate-50 p-1 rounded">
                              <span className="block text-[9px] text-slate-400 font-sans">Examen</span>
                              <span className={fMed.status === 'EXPIRED' ? 'text-rose-600 font-bold' : fMed.status === 'ALERT_30' ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                                {fMed.days}d ({formatDateDDMMYYYY(f.medicalExamExpiry)})
                              </span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded">
                              <span className="block text-[9px] text-slate-400 font-sans">Pase</span>
                              <span className={fAcc.status === 'EXPIRED' ? 'text-rose-600 font-bold' : fAcc.status === 'ALERT_30' ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                                {fAcc.days}d ({formatDateDDMMYYYY(f.accreditationExpiry)})
                              </span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded">
                              <span className="block text-[9px] text-slate-400 font-sans">Inducción</span>
                              <span className={fSaf.status === 'EXPIRED' ? 'text-rose-600 font-bold' : fSaf.status === 'ALERT_30' ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                                {fSaf.days}d ({formatDateDDMMYYYY(f.safetyCourseExpiry)})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-xs">
                      <span className="text-slate-600">Vigencia Contrato:</span>
                      {emp.contractType === 'Plazo Fijo' ? (
                        <span className={`font-mono font-bold ${comp.ctr.status === 'EXPIRED' ? 'text-rose-600' : comp.ctr.status === 'ALERT_30' ? 'text-amber-700' : 'text-slate-700'}`}>
                          Plazo Fijo: {formatDateDDMMYYYY(emp.contractExpiry)} ({comp.ctr.days}d)
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          {emp.contractType || 'Indefinido'} ({formatDateDDMMYYYY(emp.hireDate)})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenComplianceModal(emp)}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ingresar Nuevas Fechas (Renovar)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: GESTIÓN DE TIEMPOS Y LICENCIAS (PT) ----------------- */}
      {activeSubTab === 'PT_TIME' && (
        <div className="space-y-4">
          <div className="fiori-glass p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>Control de Asistencias, Ausentismos y Licencias (PT)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Flujo de revisión y aprobación de solicitudes de vacaciones, licencias médicas Achs y horas extra.
              </p>
            </div>

            <button
              onClick={onOpenCreateAbsence}
              className="bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Solicitar Ausentismo</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Código Folio</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Tipo de Ausencia</th>
                  <th className="p-3">Fechas Vigencia</th>
                  <th className="p-3">Días Total</th>
                  <th className="p-3">Motivo / Justificación</th>
                  <th className="p-3 text-center">Estado Solicitud</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {absences.map(abs => (
                  <tr key={abs.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-700">{abs.id}</td>
                    <td className="p-3 font-bold text-slate-900">{abs.employeeName}</td>
                    <td className="p-3">
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {abs.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {formatDateDDMMYYYY(abs.startDate)} ➔ {formatDateDDMMYYYY(abs.endDate)}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{abs.daysCount} días</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{abs.reason || 'Sin observación'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        abs.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        abs.status === 'Rechazado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {abs.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {abs.status === 'Pendiente Aprobación' && (
                        <>
                          <button
                            onClick={() => updateAbsenceStatus(abs.id, 'Aprobado')}
                            className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-500"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => updateAbsenceStatus(abs.id, 'Rechazado')}
                            className="bg-rose-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-rose-500"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 4: NÓMINA Y LIQUIDACIONES (PY) ----------------- */}
      {activeSubTab === 'PY_PAYROLL' && (
        <div className="space-y-4">
          <div className="fiori-glass p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Liquidación de Nómina y Remuneraciones (PY)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático de haberes, descuentos previsionales (AFP/Salud 17%) y liquidaciones líquidas.
                </p>
              </div>

              <button
                onClick={() => processPayrollRun('Agosto 2026')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center space-x-2 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>Ejecutar Proceso de Nómina Agosto 2026</span>
              </button>
            </div>

            {/* Payroll Runs History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Histórico de Procesos de Nómina</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payrollRuns.map(run => (
                  <div key={run.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900 text-sm">{run.id} • {run.period}</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                        {run.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                      <div>Colaboradores: <strong className="text-slate-900">{run.totalEmployees}</strong></div>
                      <div>Fecha Proceso: <strong>{run.runDate}</strong></div>
                      <div>Total Bruto: <strong className="text-slate-900">${run.grossSalaryTotal.toLocaleString('es-CL')}</strong></div>
                      <div>Total Líquido: <strong className="text-emerald-700">${run.netSalaryTotal.toLocaleString('es-CL')}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-1">
              <div className="text-xs text-emerald-800 font-bold flex items-center justify-between">
                <span>Parámetros Normales (🟢)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900 font-mono">{mlNormalCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Validados dentro del rango estadístico</div>
            </div>
          </div>

          {/* ML Audit Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Resultados de Auditoría de Nómina en Tiempo Real</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Ordenado por Índice de Riesgo de Anomalía (ML Score)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {mlAuditedPayrolls
                    .sort((a, b) => b.anomalyScore - a.anomalyScore)
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-sap-blue">{item.id}</div>
                          <div className="font-bold text-slate-900">{item.employeeName}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.department}</div>
                          <div className="text-[11px] text-slate-500">{item.position}</div>
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700">
                          ${Number(item.baseSalary || 0).toLocaleString('es-CL')}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 font-mono">{item.overtimeHours} hrs</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Z-Score: <strong className={item.zOvertimeScore >= 1.5 ? 'text-rose-600' : 'text-slate-700'}>
                              {item.zOvertimeScore > 0 ? `+${item.zOvertimeScore}σ` : `${item.zOvertimeScore}σ`}
                            </strong>
                          </div>
                        </td>

                        <td className="p-3 font-mono font-black text-slate-900">
                          ${Number(item.totalNet || item.baseSalary || 0).toLocaleString('es-CL')}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black border ${
                              item.anomalyLevel === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-400/40'
                                : item.anomalyLevel === 'WARNING'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
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
                            <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
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
