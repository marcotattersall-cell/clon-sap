import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Building,
  DollarSign,
  Package,
  Layers,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export const WorkOrderGanttChart = ({ workOrders = [], assets = [], onSelectWorkOrder, onOpenCreateWO }) => {
  const [zoomLevel, setZoomLevel] = useState('WEEK'); // 'DAY', 'WEEK', 'MONTH'
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentStartDate, setCurrentStartDate] = useState(new Date('2026-09-01'));

  // Filter Work Orders
  const filteredWOs = useMemo(() => {
    return workOrders.filter(wo => {
      const matchPriority = selectedPriority === 'ALL' || wo.priority === selectedPriority;
      const matchStatus = selectedStatus === 'ALL' || wo.status === selectedStatus;
      return matchPriority && matchStatus;
    });
  }, [workOrders, selectedPriority, selectedStatus]);

  // Generate Date Columns based on Zoom Level
  const dateColumns = useMemo(() => {
    const daysCount = zoomLevel === 'DAY' ? 14 : zoomLevel === 'WEEK' ? 30 : 60;
    const columns = [];
    const base = new Date(currentStartDate);

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      columns.push({
        date: d,
        isoString: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('es-CL', { weekday: 'narrow' }),
        monthName: d.toLocaleDateString('es-CL', { month: 'short' }),
        isWeekend
      });
    }
    return columns;
  }, [currentStartDate, zoomLevel]);

  // Navigation controls
  const handleShiftDate = (days) => {
    const next = new Date(currentStartDate);
    next.setDate(next.getDate() + days);
    setCurrentStartDate(next);
  };

  // Helper to calculate position and width of Gantt Bar
  const getGanttBarStyle = (plannedStart, plannedEnd) => {
    const gridStart = dateColumns[0].date.getTime();
    const gridEnd = dateColumns[dateColumns.length - 1].date.getTime() + 86400000;
    const totalDuration = gridEnd - gridStart;

    const startDate = plannedStart ? new Date(plannedStart).getTime() : gridStart;
    const endDate = plannedEnd ? new Date(plannedEnd).getTime() + 86400000 : startDate + 86400000 * 3;

    const leftPercent = Math.max(0, Math.min(100, ((startDate - gridStart) / totalDuration) * 100));
    const rightPercent = Math.max(0, Math.min(100, ((endDate - gridStart) / totalDuration) * 100));
    const widthPercent = Math.max(3, rightPercent - leftPercent);

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CLOSED':
      case 'TECHNICAL_COMPLETION':
        return 'bg-emerald-500/90 text-white border-emerald-400 shadow-emerald-500/20';
      case 'IN_PROGRESS':
        return 'bg-sky-500/90 text-white border-sky-400 shadow-sky-500/20';
      case 'RELEASED':
        return 'bg-amber-500/90 text-white border-amber-400 shadow-amber-500/20';
      case 'CREATED':
      default:
        return 'bg-slate-600/90 text-white border-slate-500 shadow-slate-500/20';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">EMERGENCIA</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">ALTA</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30">MEDIA</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">BAJA</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Controls & Filter Bar */}
      <div className="fiori-glass p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZoomLevel('DAY')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${zoomLevel === 'DAY' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              14 Días
            </button>
            <button
              onClick={() => setZoomLevel('WEEK')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${zoomLevel === 'WEEK' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              30 Días
            </button>
            <button
              onClick={() => setZoomLevel('MONTH')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${zoomLevel === 'MONTH' ? 'bg-sap-blue text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              60 Días
            </button>
          </div>

          {/* Date Shift Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleShiftDate(-7)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Semana Ant.</span>
            </button>
            <button
              onClick={() => setCurrentStartDate(new Date('2026-09-01'))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold"
            >
              Hoy
            </button>
            <button
              onClick={() => handleShiftDate(7)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center space-x-1"
            >
              <span>Semana Sig.</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Priority & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="EMERGENCY">🔴 Emergencia</option>
            <option value="HIGH">🟧 Alta</option>
            <option value="MEDIUM">🟨 Media</option>
            <option value="LOW">🟦 Baja</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="CREATED">Creada (CREATED)</option>
            <option value="RELEASED">Liberada (RELEASED)</option>
            <option value="IN_PROGRESS">En Proceso (IN_PROGRESS)</option>
            <option value="TECHNICAL_COMPLETION">Cierre Técnico (TECO)</option>
            <option value="CLOSED">Cerrada (CLOSED)</option>
          </select>
        </div>
      </div>

      {/* Gantt Timeline Container */}
      <div className="fiori-glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row: Left OT Details Header + Right Calendar Timeline */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 sticky top-0 z-10 font-mono text-xs text-slate-600 dark:text-slate-400">
            {/* Left Header Column */}
            <div className="w-80 shrink-0 p-3.5 border-r border-slate-200 dark:border-slate-800 font-bold flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-900 dark:text-white">
                <Wrench className="w-4 h-4 text-sap-blue" />
                <span>Orden de Trabajo PM (`#pm-ot`)</span>
              </span>
              <span className="text-[11px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                {filteredWOs.length} OTs
              </span>
            </div>

            {/* Timeline Days Header */}
            <div className="flex-1 flex">
              {dateColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center py-2 px-1 border-r border-slate-200 dark:border-slate-800/60 flex flex-col justify-center items-center ${col.isWeekend ? 'bg-slate-100/70 dark:bg-slate-900/60' : ''}`}
                >
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{col.dayName}</span>
                  <span className={`text-xs font-bold ${col.dayNum === new Date().getDate() ? 'bg-sap-blue text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
                    {col.dayNum}
                  </span>
                  <span className="text-[9px] text-slate-400">{col.monthName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gantt Body Rows */}
          {filteredWOs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
              <p className="font-bold text-sm">No se encontraron Órdenes de Trabajo para el período o filtros seleccionados.</p>
              <button
                onClick={onOpenCreateWO}
                className="px-4 py-2 bg-sap-blue hover:bg-sap-blue-hover text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center space-x-2"
              >
                <span>+ Crear Nueva Orden PM (#pm-ot)</span>
              </button>
            </div>
          ) : (
            filteredWOs.map((wo) => {
              const barStyle = getGanttBarStyle(wo.plannedStart || '2026-09-02', wo.plannedEnd || '2026-09-10');
              const statusClass = getStatusColor(wo.status);

              return (
                <div
                  key={wo.id}
                  className="flex border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Left Column: OT Meta Info */}
                  <div className="w-80 shrink-0 p-3 border-r border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSelectWorkOrder && onSelectWorkOrder(wo)}
                        className="font-mono text-xs font-bold text-sap-blue hover:underline tracking-tight flex items-center space-x-1 text-left"
                      >
                        <span>{wo.id}</span>
                      </button>
                      {getPriorityBadge(wo.priority)}
                    </div>

                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={wo.description}>
                      {wo.description || 'Mantenimiento Preventivo Faena'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1 truncate max-w-[140px]" title={wo.assetName}>
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{wo.assetName || wo.assetId || 'Equipo EQ-101'}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        <DollarSign className="w-3 h-3" />
                        <span>${(wo.actualCost || wo.estimatedCost || 0).toLocaleString('es-CL')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Timeline Bar Area */}
                  <div className="flex-1 relative min-h-[64px] flex items-center px-1">
                    {/* Background Grid Guidelines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {dateColumns.map((col, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 border-r border-slate-100 dark:border-slate-800/40 ${col.isWeekend ? 'bg-slate-100/40 dark:bg-slate-950/40' : ''}`}
                        ></div>
                      ))}
                    </div>

                    {/* Interactive Gantt Bar */}
                    <div
                      onClick={() => onSelectWorkOrder && onSelectWorkOrder(wo)}
                      style={barStyle}
                      className={`absolute h-9 rounded-xl border p-2 shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:z-20 flex items-center justify-between overflow-hidden ${statusClass}`}
                      title={`[${wo.id}] ${wo.description} | Avance: ${wo.progress || 50}% | Técnico: ${wo.technician || 'Por Asignar'}`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono text-[10px] font-bold opacity-90">{wo.id}</span>
                        <span className="text-xs font-bold truncate hidden sm:inline">{wo.description}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 text-[11px] font-bold">
                        <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">
                          {wo.progress || (wo.status === 'CLOSED' ? 100 : 50)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Gantt Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-slate-700 dark:text-slate-300">Estados PM (`#pm-ot`):</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500"></span>
            <span>Creada (CREATED)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Liberada (RELEASED)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500"></span>
            <span>En Proceso (IN_PROGRESS)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Cierre Técnico (TECO / CLOSED)</span>
          </span>
        </div>
        <div className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
          Axomira PM Gantt Engine v2.0 • Integrado a Costos MIGO 261
        </div>
      </div>
    </div>
  );
};
