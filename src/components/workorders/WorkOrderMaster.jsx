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
  MessageSquare
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

  const [viewMode, setViewMode] = useState('KANBAN'); // KANBAN, TABLE, GANTT
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');
  const [activeWOModal, setActiveWOModal] = useState(null);
  const [activeTabWOModal, setActiveTabWOModal] = useState('HEADER'); // HEADER, OPERATIONS, COMPONENTS, COSTS, LOGS
  const [issueQtyInput, setIssueQtyInput] = useState({});

  // 📝 Traceability & Audit Form States
  const [statusChangeUser, setStatusChangeUser] = useState('Marco Vidal (Especialista PM)');
  const [selectedNewStatus, setSelectedNewStatus] = useState('REL');
  const [auditReason, setAuditReason] = useState('');

  // 🔄 Synchronized Active Work Order Data
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
    { status: 'CRTE', label: 'Creada (CRTE)', badgeClass: 'sap-badge-created' },
    { status: 'REL', label: 'Liberada (REL)', badgeClass: 'sap-badge-released' },
    { status: 'PCNF', label: 'En Proceso (PCNF)', badgeClass: 'sap-badge-progress' },
    { status: 'TECO', label: 'Cierre Técnico (TECO)', badgeClass: 'sap-badge-teco' }
  ];

  const handleIssueComponent = (woId, materialId) => {
    const qty = issueQtyInput[materialId] || 1;
    const success = issueComponentToWorkOrder(woId, materialId, qty);
    if (success) {
      setIssueQtyInput(prev => ({ ...prev, [materialId]: 1 }));
      // Refresh modal active WO
      const updatedWO = workOrders.find(w => w.id === woId);
      if (updatedWO) setActiveWOModal(updatedWO);
    }
  };

  const handlePrintJobCard = (wo) => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Módulo PM - Órdenes de Trabajo & Mantenimiento de Planta</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Control de Órdenes de Mantenimiento (IW31 / IW32 / IW33)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión completa de mantenimiento preventivo y correctivo con imputación directa a inventario y centros de coste.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCreateWO}
            className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Trabajo</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Toolbar */}
      <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* View mode toggle */}
        <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('KANBAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'KANBAN' ? 'bg-sap-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tablero Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'TABLE' ? 'bg-sap-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabla Grid Enterprise</span>
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Prioridad:
          </span>
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="Muy Alta">Muy Alta / Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const colWOs = filteredWorkOrders.filter(w => w.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-100/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`sap-badge ${col.badgeClass}`}>{col.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 font-mono">({colWOs.length})</span>
                </div>

                <div className="space-y-3">
                  {colWOs.map(wo => {
                    const asset = assets.find(a => a.id === wo.equipmentId);

                    return (
                      <div
                        key={wo.id}
                        onClick={() => { setActiveWOModal(wo); setActiveTabWOModal('HEADER'); }}
                        className="fiori-glass p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-sap-blue/80 cursor-pointer shadow-sm hover:shadow-fiori-hover transition-all transform hover:-translate-y-0.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-sap-blue">{wo.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            wo.priority === 'Muy Alta' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {wo.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                          {wo.title}
                        </h4>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                          Equipo: <strong className="text-slate-700 dark:text-slate-200">{asset?.name || wo.equipmentId}</strong>
                        </div>

                        {/* 🚜 Vehicle & Machinery Counter Badges (Horómetro & Kilometraje) */}
                        {(wo.hourmeter || wo.odometer) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 font-mono text-[10px]">
                            {wo.hourmeter && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 font-bold">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{wo.hourmeter} hrs</span>
                              </span>
                            )}
                            {wo.odometer && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                                <Truck className="w-3 h-3 text-emerald-500" />
                                <span>{Number(wo.odometer).toLocaleString()} km</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Progress stats */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{wo.assignedTech}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${wo.actualCost}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {colWOs.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400 italic">
                      Sin órdenes en esta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: SAP ENTERPRISE GRID TABLE */}
      {viewMode === 'TABLE' && (
        <div className="fiori-glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>N° Orden ERP</th>
                  <th>Título de la Orden</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Equipo / Activo</th>
                  <th>Centro Coste</th>
                  <th>Técnico Asignado</th>
                  <th>Coste Plan</th>
                  <th>Coste Real</th>
                  <th className="text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredWorkOrders.map(wo => {
                  const asset = assets.find(a => a.id === wo.equipmentId);

                  return (
                    <tr key={wo.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="font-mono font-bold text-sap-blue">
                        {wo.id}
                      </td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {wo.title}
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">
                          {wo.type}
                        </span>
                      </td>
                      <td>
                        <span className={`sap-badge ${
                          wo.status === 'REL' ? 'sap-badge-released' :
                          wo.status === 'TECO' ? 'sap-badge-teco' :
                          wo.status === 'PCNF' ? 'sap-badge-progress' : 'sap-badge-created'
                        }`}>
                          {wo.status}
                        </span>
                      </td>
                      <td className="font-bold text-xs">
                        <span className={wo.priority === 'Muy Alta' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="text-xs truncate max-w-[140px]">
                        {asset?.name || wo.equipmentId}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {wo.costCenter}
                      </td>
                      <td className="text-xs text-slate-700 dark:text-slate-300">
                        {wo.assignedTech}
                      </td>
                      <td className="font-mono text-slate-600 dark:text-slate-400">
                        ${wo.plannedCost.toFixed(2)}
                      </td>
                      <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${wo.actualCost.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => { setActiveWOModal(wo); setActiveTabWOModal('HEADER'); }}
                          className="bg-sap-blue/10 hover:bg-sap-blue text-sap-blue hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                        >
                          Ver / Editar (IW32)
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

      {/* WORK ORDER DETAIL MODAL (IW32 FULL SAP EXPERIENCE) */}
      {activeWO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 text-white w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-base font-black text-sap-blue">{activeWO.id}</span>
                    <span className={`sap-badge ${activeWO.status === 'REL' ? 'sap-badge-released' : 'sap-badge-created'}`}>
                      {activeWO.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Tipo: {activeWO.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">
                    {activeWO.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePrintJobCard(activeWO)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors no-print"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>Imprimir Hoja de Ruta</span>
                  </button>
                  <button
                    onClick={() => setActiveWOModal(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 pt-2 gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTabWOModal('HEADER')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTabWOModal === 'HEADER' ? 'border-sap-blue text-sap-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Cabecera & Datos
                </button>
                <button
                  onClick={() => setActiveTabWOModal('OPERATIONS')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTabWOModal === 'OPERATIONS' ? 'border-sap-blue text-sap-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Operaciones ({operations.length})
                </button>
                <button
                  onClick={() => setActiveTabWOModal('COMPONENTS')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTabWOModal === 'COMPONENTS' ? 'border-sap-blue text-sap-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3. Componentes & Stock ({components.length})
                </button>
                <button
                  onClick={() => setActiveTabWOModal('COSTS')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTabWOModal === 'COSTS' ? 'border-sap-blue text-sap-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4. Costes & Imputación
                </button>
                <button
                  onClick={() => setActiveTabWOModal('LOGS')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                    activeTabWOModal === 'LOGS' ? 'border-sap-blue text-sap-blue' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>5. Trazabilidad & Auditoría ({logs.length})</span>
                </button>
              </div>

            {/* Modal Content Panels */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {/* TAB 1: HEADER & DATA */}
              {activeTabWOModal === 'HEADER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Datos de Planificación</span>
                    <div>Prioridad: <strong className="text-rose-400">{activeWO.priority}</strong></div>
                    <div>Equipo / Activo: <strong className="text-slate-200">{activeWO.equipmentId}</strong></div>
                    <div>Técnico Asignado: <strong className="text-slate-200">{activeWO.assignedTech}</strong></div>
                    <div>Grupo Planificador: <strong className="text-slate-200">{activeWO.plannerGroup}</strong></div>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Fechas & Centros de Coste</span>
                    <div>Fecha Inicio Plan: <strong className="text-slate-200">{formatDateDDMMYYYY(activeWO.startDate)}</strong></div>
                    <div>Fecha Fin Objetivo: <strong className="text-slate-200">{formatDateDDMMYYYY(activeWO.targetFinishDate)}</strong></div>
                    <div>Centro de Coste (CO): <strong className="text-amber-400">{activeWO.costCenter}</strong></div>
                    <div>Cuenta de Liquidación: <strong className="text-slate-200">{activeWO.settlementAccount}</strong></div>
                  </div>

                  {/* 🚜 Heavy Machinery & Vehicle Counter Readings (Kilometraje & Horómetro) */}
                  {(activeWO.hourmeter || activeWO.odometer) && (
                    <div className="col-span-1 md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-5 h-5 text-sky-400 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-200 text-xs">Lectura de Contadores IW31</div>
                          <div className="text-[10px] text-slate-400">Registrado para Maquinarias, Camiones y Vehículos de Flota</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 font-mono text-xs">
                        {activeWO.hourmeter && (
                          <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-300 font-bold flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Horómetro: {activeWO.hourmeter} hrs</span>
                          </div>
                        )}
                        {activeWO.odometer && (
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold flex items-center space-x-1.5">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            <span>Kilometraje: {Number(activeWO.odometer).toLocaleString()} km</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: OPERATIONS */}
              {activeTabWOModal === 'OPERATIONS' && (
                <div className="space-y-3 text-xs">
                  {operations.map(op => (
                    <div key={op.id} className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-sap-blue/20 text-sap-blue flex items-center justify-center font-bold font-mono">
                          {op.id}
                        </span>
                        <div>
                          <div className="font-bold text-slate-100">{op.text}</div>
                          <div className="text-[10px] text-slate-400">Asignado: {op.assigned} • Duración: {op.duration}h</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        op.status === 'Done' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {op.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: COMPONENTS INTEGRATED WITH INVENTORY (MIGO 261) */}
              {activeTabWOModal === 'COMPONENTS' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                    <span>
                      Integración en tiempo real MM ↔ PM: Al registrar el consumo de repuesto, el stock del almacén disminuye mediante documento MIGO 261.
                    </span>
                  </div>

                  <div className="space-y-3">
                    {components.map(comp => (
                      <div key={comp.materialId} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-mono font-bold text-sap-blue">{comp.materialId}</div>
                          <div className="font-bold text-slate-100">{comp.description}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Planificado: <strong>{comp.qtyPlanned} {comp.unit}</strong> | Consumido Real: <strong className="text-emerald-400">{comp.qtyIssued} {comp.unit}</strong>
                          </div>
                        </div>

                        {/* Direct Goods Issue Input */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={issueQtyInput[comp.materialId] || 1}
                            onChange={(e) => setIssueQtyInput({ ...issueQtyInput, [comp.materialId]: Number(e.target.value) })}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold"
                          />
                          <button
                            onClick={() => handleIssueComponent(activeWO.id, comp.materialId)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>MIGO 261 Consumir</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {components.length === 0 && (
                      <div className="text-slate-400 text-center py-6 italic">
                        Esta orden no tiene repuestos asignados en la lista de materiales.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: COSTS */}
              {activeTabWOModal === 'COSTS' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center">
                      <div className="text-slate-400 font-bold">Coste Planificado</div>
                      <div className="text-2xl font-mono font-black text-slate-200 mt-1">${(activeWO.plannedCost || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center">
                      <div className="text-slate-400 font-bold">Coste Real Imputado (CO)</div>
                      <div className="text-2xl font-mono font-black text-emerald-400 mt-1">${(activeWO.actualCost || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TRAZABILIDAD & AUDITORÍA DE CAMBIOS DE ESTADO */}
              {activeTabWOModal === 'LOGS' && (
                <div className="space-y-5 text-xs">
                  {/* Status Change Audit Form */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 text-slate-200 font-bold">
                      <ShieldCheck className="w-4 h-4 text-sap-blue" />
                      <span>Registrar Transición de Estado con Trazabilidad (Auditoría)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Usuario Responsable</label>
                        <input
                          type="text"
                          value={statusChangeUser}
                          onChange={(e) => setStatusChangeUser(e.target.value)}
                          className="w-full bg-slate-800 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nuevo Estado ERP</label>
                        <select
                          value={selectedNewStatus}
                          onChange={(e) => setSelectedNewStatus(e.target.value)}
                          className="w-full bg-slate-800 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                        >
                          <option value="CRTE">CRTE - Creada</option>
                          <option value="REL">REL - Liberada para Ejecución</option>
                          <option value="PCNF">PCNF - Parcialmente Confirmada</option>
                          <option value="TECO">TECO - Cierre Técnico</option>
                          <option value="CLSD">CLSD - Cerrada Definitiva</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const newSt = selectedNewStatus || 'REL';
                            if (!auditReason.trim()) {
                              addToast('Ingresa un motivo o justificación para registrar el cambio en la trazabilidad', 'info');
                            }
                            updateWorkOrderStatus(activeWO.id, newSt, statusChangeUser, auditReason);
                            setAuditReason('');
                          }}
                          className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white font-bold p-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow"
                        >
                          <History className="w-4 h-4" />
                          <span>Guardar Cambio en Auditoría</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Motivo / Justificación del Cambio</label>
                      <input
                        type="text"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Ej. Inspección de seguridad LOTO completada. Liberado para trabajo en terreno."
                        className="w-full bg-slate-800 text-slate-100 p-2 rounded-lg border border-slate-700 focus:ring-1 focus:ring-sap-blue"
                      />
                    </div>
                  </div>

                  {/* Vertical Timeline Traceability Log */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-300 flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5">
                        <History className="w-4 h-4 text-sky-400" />
                        Historial de Auditoría & Trazabilidad ({logs.length} registros)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Orden ID: {activeWO.id}</span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                      {logs.map((log, index) => {
                        const isString = typeof log === 'string';
                        const logUser = isString ? 'OPERADOR SISTEMA' : (log?.user || 'SISTEMA');
                        const logTime = isString ? '' : (log?.timestamp || '');
                        const logText = isString ? log : (log?.text || 'Movimiento registrado');
                        const logComment = isString ? null : log?.comment;
                        const prevSt = isString ? null : log?.previousStatus;
                        const newSt = isString ? null : log?.newStatus;

                        return (
                          <div key={log?.id || index} className="relative flex items-start space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-sm">
                            {/* Timeline Dot */}
                            <div className="absolute -left-6 top-3.5 w-3 h-3 rounded-full bg-sap-blue border-2 border-slate-900" />

                            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold shrink-0">
                              <User className="w-4 h-4 text-sky-400" />
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-100 text-xs">{logUser}</span>
                                {logTime && <span className="text-[10px] font-mono text-slate-400">{logTime}</span>}
                              </div>

                              {prevSt && newSt && (
                                <div className="flex items-center space-x-2 text-[10px] font-mono font-bold pt-0.5">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{prevSt}</span>
                                  <span className="text-slate-400">➔</span>
                                  <span className="px-1.5 py-0.5 rounded bg-sap-blue text-white">{newSt}</span>
                                </div>
                              )}

                              <p className="text-xs text-slate-300 leading-snug">
                                {logText}
                              </p>

                              {logComment && (
                                <div className="text-[11px] text-amber-300 italic pt-0.5 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Nota: "{logComment}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {logs.length === 0 && (
                        <div className="text-center text-slate-500 text-xs italic py-4">
                          Sin historial de auditoría registrado.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                {activeWO.status === 'CRTE' && (
                  <button
                    onClick={() => {
                      updateWorkOrderStatus(activeWO.id, 'REL');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                  >
                    Liberar Orden (REL)
                  </button>
                )}

                {activeWO.status === 'REL' && (
                  <button
                    onClick={() => {
                      updateWorkOrderStatus(activeWO.id, 'TECO');
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                  >
                    Ejecutar Cierre Técnico (TECO)
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveWOModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
