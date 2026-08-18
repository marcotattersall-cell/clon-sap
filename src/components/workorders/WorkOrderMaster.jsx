import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  Wrench,
  Plus,
  Filter,
  Kanban,
  Table as TableIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Printer,
  ChevronRight,
  UserCheck,
  Building,
  CheckSquare,
  Play,
  Check,
  X,
  FileText,
  Gauge,
  Truck,
  History,
  ShieldCheck,
  User,
  MessageSquare,
  Search,
  RefreshCw
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export const WorkOrderMaster = ({ onOpenCreateWO, onOpenMIGOForWO }) => {
  const {
    workOrders,
    assets,
    materials,
    searchTerm,
    updateWorkOrderStatus,
    issueComponentToWorkOrder,
    addToast
  } = useSAP();

  const [viewMode, setViewMode] = useState('KANBAN'); // KANBAN or TABLE
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');

  // Modal State for inspecting order (IW32/IW33)
  const [activeWOModal, setActiveWOModal] = useState(null);
  const [activeTabWOModal, setActiveTabWOModal] = useState('HEADER'); // HEADER, OPERATIONS, COMPONENTS, LOGS
  const [issueQtyInput, setIssueQtyInput] = useState({});

  // Traceability & Status Transition Form State
  const [statusChangeUser, setStatusChangeUser] = useState('Especialista Mantenimiento PM');
  const [auditReason, setAuditReason] = useState('');

  // Active synchronized order data
  const activeWO = activeWOModal ? (workOrders.find(w => w.id === activeWOModal.id) || activeWOModal) : null;
  const operations = Array.isArray(activeWO?.operations) ? activeWO.operations : [];
  const components = Array.isArray(activeWO?.components) ? activeWO.components : [];
  const logs = Array.isArray(activeWO?.logs) ? activeWO.logs : [];

  // Filtered WOs
  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch =
      wo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.assignedTech.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatusFilter === 'ALL' || wo.status === selectedStatusFilter;
    const matchesPriority = selectedPriorityFilter === 'ALL' || wo.priority === selectedPriorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const kanbanColumns = [
    { status: 'CRTE', label: 'Creada (CRTE)', borderClass: 'border-t-sky-500', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' },
    { status: 'REL', label: 'Liberada (REL)', borderClass: 'border-t-amber-500', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
    { status: 'PCNF', label: 'En Proceso (PCNF)', borderClass: 'border-t-purple-500', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300' },
    { status: 'TECO', label: 'Cierre Técnico (TECO)', borderClass: 'border-t-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
  ];

  const handleIssueComponent = (woId, materialId) => {
    const qty = issueQtyInput[materialId] || 1;
    const success = issueComponentToWorkOrder(woId, materialId, qty);
    if (success) {
      setIssueQtyInput(prev => ({ ...prev, [materialId]: 1 }));
      const updatedWO = workOrders.find(w => w.id === woId);
      if (updatedWO) setActiveWOModal(updatedWO);
    }
  };

  const handleQuickStatusChange = (wo, newStatus) => {
    const reasonText = auditReason.trim() || `Transición de estado a [${newStatus}] desde panel limpio`;
    const success = updateWorkOrderStatus(wo.id, newStatus, statusChangeUser, reasonText);
    if (success && activeWOModal?.id === wo.id) {
      const updated = workOrders.find(w => w.id === wo.id);
      setActiveWOModal(updated || null);
      setAuditReason('');
    }
  };

  // KPIs
  const totalCount = workOrders.length;
  const crteCount = workOrders.filter(w => w.status === 'CRTE').length;
  const relCount = workOrders.filter(w => w.status === 'REL').length;
  const pcnfCount = workOrders.filter(w => w.status === 'PCNF').length;
  const tecoCount = workOrders.filter(w => w.status === 'TECO' || w.status === 'CLSD').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 border-l-4 border-l-sap-blue shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sap-blue mb-1">
            <Wrench className="w-4 h-4 text-sap-blue" />
            <span>Módulo SAP PM • Gestión de Mantenimiento Industrial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Control & Ejecución de Órdenes de Trabajo (IW31 / IW32)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Gestión simplificada del flujo de mantenimiento: Liberación, asignación de repuestos MIGO 261, control de horas y Certificado de Cierre Técnico TECO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onOpenCreateWO}
            className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>＋ Crear Orden IW31</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className="fiori-card p-4 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-sap-blue transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Órdenes Registradas</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount} Órdenes</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{crteCount} Creadas | {relCount} Liberadas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('REL')}
          className="fiori-card p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Liberadas para Ejecución</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{relCount} Órdenes</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Listas para inicio de trabajo</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('PCNF')}
          className="fiori-card p-4 bg-white rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm cursor-pointer hover:border-purple-400 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">En Proceso Técnico</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{pcnfCount} Órdenes</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Mecánicos en faena</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Play className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('TECO')}
          className="fiori-card p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm cursor-pointer hover:border-emerald-400 transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cierre Técnico (TECO)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{tecoCount} Órdenes</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Certificado emitido</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* View Mode Switcher */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center space-x-1 shadow-xs">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'KANBAN' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Tablero Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Lista Tabular</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-bold">Estado:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sap-blue"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="CRTE">CRTE - Creada</option>
              <option value="REL">REL - Liberada</option>
              <option value="PCNF">PCNF - En Proceso</option>
              <option value="TECO">TECO - Cierre Técnico</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-bold">Prioridad:</span>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sap-blue"
            >
              <option value="ALL">Todas las Prioridades</option>
              <option value="Muy Alta">🔴 Muy Alta</option>
              <option value="Alta">🟡 Alta</option>
              <option value="Media">🔵 Media</option>
              <option value="Baja">🟢 Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* ----------------- VIEW MODE 1: KANBAN MINIMALISTA ----------------- */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const columnOrders = filteredWorkOrders.filter(w => {
              if (col.status === 'TECO') return w.status === 'TECO' || w.status === 'CLSD';
              return w.status === col.status;
            });

            return (
              <div
                key={col.status}
                className={`bg-slate-50/80 rounded-2xl border border-slate-200 border-t-4 ${col.borderClass} p-3.5 space-y-3 min-h-[500px] flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${col.badgeClass}`}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-3">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs italic bg-white/50 rounded-xl border border-dashed border-slate-200">
                        Sin órdenes en esta etapa
                      </div>
                    ) : (
                      columnOrders.map(wo => {
                        const matchingAsset = assets.find(a => a.id === wo.equipmentId);
                        const equipmentName = matchingAsset ? matchingAsset.name : wo.equipmentId;
                        const plate = matchingAsset?.plate || wo.equipmentId;

                        return (
                          <div
                            key={wo.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-sap-blue/60 shadow-xs hover:shadow-md transition-all space-y-3 group"
                          >
                            {/* Card Top Strip */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-sap-blue bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                {wo.id}
                              </span>

                              {/* Priority badge only if high/very high */}
                              {(wo.priority === 'Muy Alta' || wo.priority === 'Alta') && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  wo.priority === 'Muy Alta' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {wo.priority}
                                </span>
                              )}
                            </div>

                            {/* Title & Equipment */}
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-sap-blue transition-colors">
                                {wo.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                                <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-700">{equipmentName}</span>
                                <span className="font-mono text-slate-400">({plate})</span>
                              </p>
                            </div>

                            {/* Technician & Target Date */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="font-medium text-slate-700">{wo.assignedTech}</span>
                              </span>
                              <span className="font-mono text-slate-500">
                                {formatDateDDMMYYYY(wo.targetFinishDate || wo.startDate)}
                              </span>
                            </div>

                            {/* Single Action Button */}
                            <button
                              onClick={() => {
                                setActiveWOModal(wo);
                                setActiveTabWOModal('HEADER');
                              }}
                              className="w-full bg-slate-100 group-hover:bg-sap-blue group-hover:text-white text-slate-800 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                            >
                              <span>Ver / Procesar Orden (IW32)</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- VIEW MODE 2: LISTA TABULAR ----------------- */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Folio Orden</th>
                  <th className="p-3.5">Título / Descripción</th>
                  <th className="p-3.5">Equipo Asignado</th>
                  <th className="p-3.5">Técnico Resp.</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Fecha Término</th>
                  <th className="p-3.5 text-center">Estado SAP</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredWorkOrders.map(wo => {
                  const matchingAsset = assets.find(a => a.id === wo.equipmentId);
                  const equipmentName = matchingAsset ? matchingAsset.name : wo.equipmentId;

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sap-blue">
                        {wo.id}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {wo.title}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {equipmentName}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {wo.assignedTech}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          wo.priority === 'Muy Alta' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          wo.priority === 'Alta' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {formatDateDDMMYYYY(wo.targetFinishDate || wo.startDate)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          wo.status === 'TECO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          wo.status === 'PCNF' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                          wo.status === 'REL' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-sky-100 text-sky-800 border-sky-300'
                        }`}>
                          {wo.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setActiveWOModal(wo);
                            setActiveTabWOModal('HEADER');
                          }}
                          className="bg-sap-blue hover:bg-sap-blue-hover text-white px-3 py-1 rounded-lg font-bold text-xs shadow-xs transition-all"
                        >
                          Abrir (IW32)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- MODAL DETALLE DE ORDEN IW32 / IW33 ----------------- */}
      {activeWO && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-900 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      {activeWO.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">Transacción SAP IW32</span>
                  </div>
                  <h3 className="text-base font-black leading-tight mt-0.5">
                    {activeWO.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveWOModal(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap gap-1 text-xs">
              <button
                onClick={() => setActiveTabWOModal('HEADER')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeTabWOModal === 'HEADER' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                1. Cabecera & Datos Generales
              </button>
              <button
                onClick={() => setActiveTabWOModal('OPERATIONS')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeTabWOModal === 'OPERATIONS' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                2. Operaciones & Tareas ({operations.length})
              </button>
              <button
                onClick={() => setActiveTabWOModal('COMPONENTS')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeTabWOModal === 'COMPONENTS' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                3. Componentes MIGO ({components.length})
              </button>
              <button
                onClick={() => setActiveTabWOModal('LOGS')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  activeTabWOModal === 'LOGS' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                4. Historial & Trazabilidad ({logs.length})
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
              {/* TAB 1: CABECERA */}
              {activeTabWOModal === 'HEADER' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Equipo Afectado</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {assets.find(a => a.id === activeWO.equipmentId)?.name || activeWO.equipmentId}
                      </div>
                      <div className="text-slate-500">ID: <strong className="font-mono text-slate-700">{activeWO.equipmentId}</strong></div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Responsable & Asignación</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {activeWO.assignedTech}
                      </div>
                      <div className="text-slate-500">Centro Costo: <strong className="font-mono text-amber-700">{activeWO.costCenter}</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold">Tipo Orden</span>
                      <div className="font-bold text-slate-800">{activeWO.type || 'PM01'} (Mantenimiento)</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold">Prioridad</span>
                      <div className="font-bold text-slate-800">{activeWO.priority}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold">Fecha Límite</span>
                      <div className="font-mono font-bold text-slate-800">{formatDateDDMMYYYY(activeWO.targetFinishDate || activeWO.startDate)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPERACIONES */}
              {activeTabWOModal === 'OPERATIONS' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Pauta de Operaciones & Tareas a Ejecutar
                  </h4>
                  {operations.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-6">Sin operaciones individuales registradas.</div>
                  ) : (
                    <div className="space-y-2">
                      {operations.map((op, idx) => (
                        <div key={op.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900">{op.text}</div>
                            <div className="text-[11px] text-slate-500">Asignado: {op.assigned} • Duración estim.: {op.duration} hrs</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            op.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {op.status === 'Completed' ? '✔ Completado' : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPONENTES MIGO */}
              {activeTabWOModal === 'COMPONENTS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Repuestos & Materiales Planificados (MIGO 261)
                    </h4>
                    <button
                      onClick={() => {
                        setActiveWOModal(null);
                        if (onOpenMIGOForWO) onOpenMIGOForWO(activeWO);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1 shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Ir a MIGO Completo</span>
                    </button>
                  </div>

                  {components.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-6">Sin repuestos o materiales asignados.</div>
                  ) : (
                    <div className="space-y-2">
                      {components.map((comp, idx) => (
                        <div key={comp.materialId || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{comp.description || comp.materialId}</div>
                            <div className="text-[11px] text-slate-500">
                              Planificado: {comp.qtyPlanned} {comp.unit} • Consumido (MIGO 261): <strong className="text-amber-700">{comp.qtyIssued || 0} {comp.unit}</strong>
                            </div>
                          </div>

                          <button
                            onClick={() => handleIssueComponent(activeWO.id, comp.materialId)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-xs"
                          >
                            + Reclamar 1 UN
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HISTORIAL & LOGS */}
              {activeTabWOModal === 'LOGS' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Historial de Trazabilidad & Cambios de Estado
                  </h4>
                  {logs.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-6">Sin registros de trazabilidad.</div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, idx) => (
                        <div key={log.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                            <span>{log.timestamp}</span>
                            <span className="font-bold text-slate-800">{log.user}</span>
                          </div>
                          <div className="font-bold text-slate-900">{log.text}</div>
                          {log.comment && <p className="text-slate-600 italic">"{log.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Action Footer: Quick Transition Bar */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Estado Actual:</span>
                <span className="font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                  {activeWO.status}
                </span>
              </div>

              {/* Transition Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {activeWO.status === 'CRTE' && (
                  <button
                    onClick={() => handleQuickStatusChange(activeWO, 'REL')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    ⚡ Liberar Orden (REL)
                  </button>
                )}

                {activeWO.status === 'REL' && (
                  <button
                    onClick={() => handleQuickStatusChange(activeWO, 'PCNF')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    ▶ Iniciar Trabajos (PCNF)
                  </button>
                )}

                {(activeWO.status === 'REL' || activeWO.status === 'PCNF') && (
                  <button
                    onClick={() => handleQuickStatusChange(activeWO, 'TECO')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Emitir Cierre TECO</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveWOModal(null)}
                  className="bg-white border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
