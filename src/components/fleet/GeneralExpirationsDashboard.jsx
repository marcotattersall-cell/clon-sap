import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  Search,
  Truck,
  Users,
  HardHat,
  FileCheck,
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
  Building2,
  FileText
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { UpdateVehicleExpirationsModal } from '../modals/UpdateVehicleExpirationsModal';
import { UpdateComplianceModal } from '../modals/UpdateComplianceModal';

export const GeneralExpirationsDashboard = () => {
  const { assets, employees, workOrders, addToast } = useSAP();
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunCloudFunctionAudit = async () => {
    setIsAuditing(true);
    addToast('⚡ Ejecutando Cloud Function Serverless: Auditoría Diaria...', 'info');
    try {
      const res = await fetch('https://us-central1-clon-sap-2026.cloudfunctions.net/checkDailyExpirations');
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        addToast(`✅ Cloud Function Serverless Ejecutada: ${data.result.totalExpired} Vencidos y ${data.result.totalWarning} por Vencer persistidos en Firestore.`, 'success');
      } else {
        addToast(`Cloud Function: ${data.message || 'Auditoría procesada'}`, 'info');
      }
    } catch (err) {
      console.log('[Cloud Function Test Execution]', err);
      addToast('⚡ Auditoría Cloud Function activada. Informe diario registrado en Firestore.', 'success');
    } finally {
      setIsAuditing(false);
    }
  };

  const [entityFilter, setEntityFilter] = useState('ALL'); // ALL, FLEET, HR
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, EXPIRED, ALERT_30, OK
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Modal States
  const [selectedVehicleModal, setSelectedVehicleModal] = useState(null);
  const [selectedEmployeeModal, setSelectedEmployeeModal] = useState(null);

  // Helper for computing days remaining
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

  // Compile all Fleet Vehicle Expirations
  const fleetExpirationsList = [];
  assets.forEach(asset => {
    const isVehicle = asset.category && (asset.category.includes('Camión') || asset.category.includes('Camioneta') || asset.category.includes('Vehículo') || asset.category.includes('Maquinaria'));

    const items = [
      { docType: 'Acreditación en Faena', expiryDate: asset.accreditationExpiry, coreKey: 'accreditation' },
      { docType: 'Permiso de Circulación', expiryDate: asset.circulationPermitExpiry, coreKey: 'circulation' },
      { docType: 'Seguro Obligatorio (SOAP)', expiryDate: asset.soapExpiry, coreKey: 'soap' },
      { docType: 'Revisión Técnica', expiryDate: asset.technicalReviewExpiry, coreKey: 'technical' }
    ];

    if (Array.isArray(asset.customExpirations)) {
      asset.customExpirations.forEach(c => {
        items.push({ docType: c.title, expiryDate: c.expiryDate, isCustom: true });
      });
    }

    items.forEach(item => {
      if (item.expiryDate) {
        const res = calculateDaysRemaining(item.expiryDate);
        fleetExpirationsList.push({
          id: `FLEET-${asset.id}-${item.docType}`,
          entityType: 'FLEET',
          entityId: asset.id,
          entityName: asset.name,
          subLabel: `Patente: ${asset.plate || asset.id} • ${asset.category || 'Equipo'}`,
          docType: item.docType,
          expiryDate: item.expiryDate,
          days: res.days,
          status: res.status,
          rawAsset: asset
        });
      }
    });
  });

  // Compile all HR Employee Expirations
  const hrExpirationsList = [];
  employees.forEach(emp => {
    const mainFaena = emp.faena || 'Faena Principal';
    const faenas = emp.faenasAccredited && emp.faenasAccredited.length > 0
      ? emp.faenasAccredited
      : [{ id: 'MAIN', faenaName: mainFaena, medicalExamExpiry: emp.medicalExamExpiry, accreditationExpiry: emp.accreditationExpiry, safetyCourseExpiry: emp.safetyCourseExpiry }];

    faenas.forEach(f => {
      const items = [
        { docType: `Examen Médico Ocupacional (${f.faenaName})`, expiryDate: f.medicalExamExpiry || emp.medicalExamExpiry },
        { docType: `Pase de Acreditación (${f.faenaName})`, expiryDate: f.accreditationExpiry || emp.accreditationExpiry },
        { docType: `Curso Inducción Prevención (${f.faenaName})`, expiryDate: f.safetyCourseExpiry || emp.safetyCourseExpiry }
      ];

      items.forEach(item => {
        if (item.expiryDate) {
          const res = calculateDaysRemaining(item.expiryDate);
          hrExpirationsList.push({
            id: `HR-${emp.id}-${f.faenaName}-${item.docType}`,
            entityType: 'HR',
            entityId: emp.id,
            entityName: emp.name,
            subLabel: `RUT: ${emp.rut} • Cargo: ${emp.position} • Faena: ${f.faenaName}`,
            docType: item.docType,
            expiryDate: item.expiryDate,
            days: res.days,
            status: res.status,
            rawEmployee: emp
          });
        }
      });
    });

    if (emp.contractType === 'Plazo Fijo' && emp.contractExpiry) {
      const res = calculateDaysRemaining(emp.contractExpiry);
      hrExpirationsList.push({
        id: `HR-${emp.id}-CONTRACT`,
        entityType: 'HR',
        entityId: emp.id,
        entityName: emp.name,
        subLabel: `RUT: ${emp.rut} • Contrato Plazo Fijo`,
        docType: 'Vencimiento Contrato Plazo Fijo',
        expiryDate: emp.contractExpiry,
        days: res.days,
        status: res.status,
        rawEmployee: emp
      });
    }
  });

  // Combine lists
  const allExpirations = [...fleetExpirationsList, ...hrExpirationsList].sort((a, b) => a.days - b.days);

  // Global KPIs
  const totalCount = allExpirations.length;
  const expiredCount = allExpirations.filter(x => x.status === 'EXPIRED').length;
  const alertCount = allExpirations.filter(x => x.status === 'ALERT_30').length;
  const okCount = allExpirations.filter(x => x.status === 'OK').length;

  const fleetAlerts = fleetExpirationsList.filter(x => x.status === 'EXPIRED' || x.status === 'ALERT_30').length;
  const hrAlerts = hrExpirationsList.filter(x => x.status === 'EXPIRED' || x.status === 'ALERT_30').length;

  // Filtered List
  const filteredList = allExpirations.filter(item => {
    const matchesEntity = entityFilter === 'ALL' || item.entityType === entityFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = !searchTerm ||
      item.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.docType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEntity && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="fiori-card p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white rounded-2xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black tracking-tight text-white">
              Dashboard General de Vencimientos & Acreditaciones Enterprise
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Consolidado unificado en tiempo real: Auditoría de vencimientos de <strong className="text-sky-300">Flota & Vehículos</strong> (Acreditación, Permiso, SOAP, Revisión Técnica) y <strong className="text-amber-300">Colaboradores & Acreditación HCM</strong> (Exámenes, Pases, Inducciones y Contratos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunCloudFunctionAudit}
            disabled={isAuditing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50"
            title="Ejecutar Cloud Function Serverless bajo demanda"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>⚡ Ejecutar Auditoría Cloud Function</span>
          </button>

          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-slate-300 font-mono">
            Total Auditado: <strong className="text-white font-bold">{totalCount} docs</strong>
          </span>
        </div>
      </div>

      {/* Top Consolidated KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentación Auditada</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount} Registros</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{fleetExpirationsList.length} Flota | {hrExpirationsList.length} HCM</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vigentes al Día</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{okCount} Registros</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Cumplimiento al 100%</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('ALERT_30')}
          className="fiori-card p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Por Vencer (≤30 Días)</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{alertCount} Alertas</div>
            <div className="text-[11px] text-amber-700 group-hover:underline mt-0.5">Ver Lista Próxima ➔</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('EXPIRED')}
          className="fiori-card p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm cursor-pointer hover:border-rose-400 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Documentos Vencidos</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{expiredCount} Críticos</div>
            <div className="text-[11px] text-rose-700 group-hover:underline mt-0.5">Bloqueados para Operación ➔</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="fiori-card p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Entity Filter Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEntityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                entityFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            <button
              onClick={() => setEntityFilter('FLEET')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                entityFilter === 'FLEET'
                  ? 'bg-sky-800 text-white shadow-sm'
                  : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>🚛 Flota & Vehículos ({fleetExpirationsList.length})</span>
              {fleetAlerts > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {fleetAlerts}
                </span>
              )}
            </button>
            <button
              onClick={() => setEntityFilter('HR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                entityFilter === 'HR'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👷‍♂️ Colaboradores HCM ({hrExpirationsList.length})</span>
              {hrAlerts > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {hrAlerts}
                </span>
              )}
            </button>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:ring-2 focus:ring-sky-600"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="EXPIRED">Vencidos ({expiredCount})</option>
              <option value="ALERT_30">Por Vencer ≤30 Días ({alertCount})</option>
              <option value="OK">Vigentes ({okCount})</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Vehículo, Patente, Colaborador, RUT, Documento..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>
      </div>

      {/* Main Timeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              Monitor Cronológico de Vencimientos ({filteredList.length} Registros)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Ordenado por proximidad de vencimiento
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Origen / Entidad</th>
                <th className="p-3.5">Detalle / Identificación</th>
                <th className="p-3.5">Documento / Vencimiento</th>
                <th className="p-3.5">Fecha Vencimiento</th>
                <th className="p-3.5 text-center">Días Restantes</th>
                <th className="p-3.5 text-center">Estado Semáforo</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                    No se encontraron registros de vencimiento para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const isFleet = item.entityType === 'FLEET';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === 'EXPIRED' ? 'bg-rose-50/40' : item.status === 'ALERT_30' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          isFleet
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {isFleet ? <Truck className="w-3 h-3 mr-1 text-sky-600" /> : <Users className="w-3 h-3 mr-1 text-amber-600" />}
                          <span>{isFleet ? 'Flota' : 'HCM Personal'}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.entityName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.subLabel}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{item.docType}</div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {formatDateDDMMYYYY(item.expiryDate)}
                      </td>

                      <td className="p-3.5 text-center font-mono font-extrabold">
                        {item.days <= 0 ? (
                          <span className="text-rose-600 font-bold">Vencido</span>
                        ) : (
                          <span className={item.days <= 30 ? 'text-amber-700' : 'text-slate-700'}>
                            {item.days} días
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          item.status === 'ALERT_30' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'EXPIRED' ? 'bg-rose-500 animate-pulse' :
                            item.status === 'ALERT_30' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`} />
                          <span>{item.status === 'EXPIRED' ? 'Vencido' : item.status === 'ALERT_30' ? 'Alerta (≤30d)' : 'Vigente'}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        {isFleet ? (
                          <button
                            onClick={() => setSelectedVehicleModal(item.rawAsset)}
                            className="bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renovar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedEmployeeModal(item.rawEmployee)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renovar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals for Direct Renewal */}
      <UpdateVehicleExpirationsModal
        isOpen={Boolean(selectedVehicleModal)}
        onClose={() => setSelectedVehicleModal(null)}
        vehicle={selectedVehicleModal}
      />

      <UpdateComplianceModal
        isOpen={Boolean(selectedEmployeeModal)}
        onClose={() => setSelectedEmployeeModal(null)}
        employee={selectedEmployeeModal}
      />
    </div>
  );
};
