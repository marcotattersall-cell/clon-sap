import React, { useState, useEffect, useMemo } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeCollection, getCollectionDocs, recordAuditLog } from '../../services/dbService';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileText,
  Calendar,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Package,
  Wrench,
  Users,
  Shield,
  FileCheck,
  Server
} from 'lucide-react';

const FALLBACK_AUDIT_LOGS = [];

export const AuditLogsViewerSLG1 = () => {
  const { user } = useAuth();
  const { activeTenant, addToast, themeMode } = useSAP();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const isDark = themeMode === 'dark';

  // Real-time listener for audit_logs
  useEffect(() => {
    let unsubscribe = () => {};

    const loadLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await getCollectionDocs('auditLogs', activeTenant || 'tenant_demo');
        const sorted = (Array.isArray(fetchedLogs) ? fetchedLogs : []).sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        setLogs(sorted);
      } catch (err) {
        console.warn('[SLG1 Audit Viewer] Error cargando logs:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    // Subscribe for live stream updates
    try {
      unsubscribe = subscribeCollection(
        'auditLogs',
        (updatedLogs) => {
          const sorted = (Array.isArray(updatedLogs) ? updatedLogs : []).sort(
            (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
          );
          setLogs(sorted);
        },
        (err) => console.warn('[SLG1 Audit Viewer] Error en sub:', err),
        [],
        activeTenant || 'tenant_demo'
      );
    } catch (e) {
      console.warn('Realtime subscription not active:', e);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeTenant]);

  // Extract unique users and actions for drop-down filters
  const uniqueUsers = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.user) set.add(l.user); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueActions = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueEntityTypes = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.entityType) set.add(l.entityType); });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        const matchesUser = (log.user || '').toLowerCase().includes(q);
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesEntity = (log.entityId || '').toLowerCase().includes(q);
        const matchesId = (log.id || '').toLowerCase().includes(q);
        const matchesType = (log.entityType || '').toLowerCase().includes(q);
        if (!matchesDetails && !matchesUser && !matchesAction && !matchesEntity && !matchesId && !matchesType) {
          return false;
        }
      }

      // 2. Entity Type Filter
      if (selectedEntityType !== 'ALL' && log.entityType !== selectedEntityType) {
        return false;
      }

      // 3. Action Filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      // 4. User Filter
      if (selectedUser !== 'ALL' && log.user !== selectedUser) {
        return false;
      }

      // 5. Date Range Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const logDate = new Date(log.timestamp);
        if (logDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const logDate = new Date(log.timestamp);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedEntityType, selectedAction, selectedUser, startDate, endDate]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEntityType('ALL');
    setSelectedAction('ALL');
    setSelectedUser('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    if (addToast) addToast('Filtros de auditoría restablecidos.', 'info');
  };

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Formatters
  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  const getEntityTypeBadge = (type) => {
    switch (type) {
      case 'MIGO_DOCUMENT':
        return { label: 'MIGO Inventario', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', icon: Package };
      case 'WORK_ORDER':
        return { label: 'PM Orden Trabajo', bg: 'bg-sky-950/80 text-sky-300 border-sky-700/60', icon: Wrench };
      case 'WORKFLOW':
        return { label: 'Flujo Aprobación', bg: 'bg-purple-950/80 text-purple-300 border-purple-700/60', icon: FileCheck };
      case 'USER':
        return { label: 'Seguridad SU01', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60', icon: Users };
      case 'MATERIAL':
        return { label: 'Maestro Materiales', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60', icon: Layers };
      case 'SYSTEM':
        return { label: 'Sistema & OTP', bg: 'bg-rose-950/80 text-rose-300 border-rose-700/60', icon: ShieldCheck };
      default:
        return { label: type || 'General', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Database };
    }
  };

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('LOCK') || act.includes('REJECT')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (act.includes('TECO') || act.includes('SUCCESS') || act.includes('MIGO_101') || act.includes('APPROVE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (act.includes('UPDATE') || act.includes('THRESHOLD') || act.includes('MIGO_261')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Export CSV Functionality (Excel-Compatible with UTF-8 BOM)
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      if (addToast) addToast('No hay registros de auditoría para exportar.', 'error');
      return;
    }

    const headers = ['ID Log', 'Marca de Tiempo (ISO)', 'Tenant ID', 'Modulo/Entidad', 'ID Entidad', 'Tipo de Acción', 'Usuario Responsable', 'Detalle Operacional'];
    
    const csvRows = [
      headers.join(';'),
      ...filteredLogs.map(l => [
        `"${l.id || ''}"`,
        `"${l.timestamp || ''}"`,
        `"${l.tenantId || activeTenant || ''}"`,
        `"${l.entityType || ''}"`,
        `"${l.entityId || ''}"`,
        `"${l.action || ''}"`,
        `"${l.user || ''}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`
      ].join(';'))
    ];

    // UTF-8 BOM to open correctly in Microsoft Excel
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Axomira_SAP_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (addToast) addToast(`Exportados ${filteredLogs.length} registros a CSV exitosamente.`, 'success');
  };

  // Export JSON Functionality
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      if (addToast) addToast('No hay registros de auditoría para exportar.', 'error');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.setAttribute('download', `Axomira_SAP_Audit_Logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (addToast) addToast(`Exportado archivo JSON con ${filteredLogs.length} registros.`, 'success');
  };

  // Print Summary Report
  const handlePrintReport = () => {
    window.print();
  };

  // Copy JSON snippet
  const handleCopyJSON = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(obj.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (addToast) addToast('Registro copiado al portapapeles en formato JSON CDHDR/CDPOS.', 'success');
  };

  // Metrics for Cards
  const totalCount = logs.length;
  const migoCount = logs.filter(l => l.entityType === 'MIGO_DOCUMENT').length;
  const woCount = logs.filter(l => l.entityType === 'WORK_ORDER').length;
  const securityCount = logs.filter(l => l.entityType === 'USER' || l.entityType === 'SYSTEM' || (l.action || '').includes('OTP')).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 rounded-2xl border border-sky-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold border border-sky-500/40 uppercase tracking-widest flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Transacción SAP SLG1 / ST03N</span>
              </span>

              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Realtime Log Sync</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <span>Log de Aplicación & Auditoría Transaccional</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Monitoreo centralizado e inmutable de movimientos MIGO, cierres técnicos PM, matriz de roles SU01 y trazas de seguridad CDHDR/CDPOS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Exportar a CSV compatible con MS Excel"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Exportar JSON estructurado para SIEM"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer no-print active:scale-95"
              title="Imprimir Informe de Auditoría"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Audit Logs</span>
              <span className="text-base font-extrabold text-white font-mono">{totalCount}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Movimientos MM (MIGO)</span>
              <span className="text-base font-extrabold text-white font-mono">{migoCount}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eventos PM (Work Orders)</span>
              <span className="text-base font-extrabold text-white font-mono">{woCount}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seguridad & Auth</span>
              <span className="text-base font-extrabold text-white font-mono">{securityCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por ID, acción, detalle u operador..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border transition-colors outline-none ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-sky-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sap-blue'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 flex-1">
            {/* Entity Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Módulo / Entidad</label>
              <select
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="ALL">Todos los Módulos</option>
                {uniqueEntityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Acción</label>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="ALL">Todas las Acciones</option>
                {uniqueActions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Usuario Exec</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="ALL">Todos los Usuarios</option>
                {uniqueUsers.map(usr => (
                  <option key={usr} value={usr}>{usr}</option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Desde Fecha</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-2.5 py-1 rounded-lg text-xs font-medium border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex items-end shrink-0">
            <button
              onClick={handleResetFilters}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Restablecer todos los filtros"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Limpiar Filtros</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Table Content */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Registros Encontrados: <strong className="text-sky-400 font-mono">{filteredLogs.length}</strong>
            </span>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Mostrar por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold border outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-mono uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3 px-4">Sello de Tiempo</th>
                <th className="py-3 px-4">ID Log / Tenant</th>
                <th className="py-3 px-4">Módulo / Entidad</th>
                <th className="py-3 px-4">Acción Transaccional</th>
                <th className="py-3 px-4">Usuario Operador</th>
                <th className="py-3 px-4">Detalle Operacional</th>
                <th className="py-3 px-4 text-right">Firma / Inspeccionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                      <span className="text-xs font-mono font-bold text-slate-400">Cargando Trazas de Auditoría SLG1...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                      <span className="font-bold text-slate-300">No se encontraron registros de auditoría</span>
                      <p className="text-xs text-slate-500">Intenta ajustar los criterios de búsqueda o limpiar los filtros activos.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 text-xs text-sky-400 hover:underline font-bold"
                      >
                        Restablecer Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const entityBadge = getEntityTypeBadge(log.entityType);
                  const EntityIcon = entityBadge.icon;
                  const actionColorClass = getActionBadgeColor(log.action);

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors group hover:bg-sky-500/5 cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Log ID & Tenant */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-sky-400 text-xs">{log.id}</div>
                        <div className="text-[10px] text-slate-500">{log.tenantId || activeTenant || 'tenant_demo'}</div>
                      </td>

                      {/* Module Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${entityBadge.bg}`}>
                          <EntityIcon className="w-3 h-3 shrink-0" />
                          <span>{entityBadge.label}</span>
                        </span>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Ref: <strong className="text-slate-300">{log.entityId}</strong>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md border font-mono text-[11px] font-bold ${actionColorClass}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium">{log.user || 'SISTEMA_AXOMIRA'}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 max-w-md truncate text-slate-300">
                        {log.details || 'Sin observaciones'}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>Inspeccionar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">
              Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Modal (SAP CDHDR / CDPOS Change Record) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 ring-1 ring-sky-500/20">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">SAP CDHDR / CDPOS Auditoría Inmutable</span>
                  <h3 className="text-base font-bold text-white">Detalle de Registro Transaccional</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">ID de Registro Log:</span>
                  <span className="font-bold text-sky-400">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tenant Activo:</span>
                  <span className="font-bold text-emerald-400">{selectedLog.tenantId || activeTenant || 'tenant_demo'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Marca de Tiempo:</span>
                  <span className="text-slate-200">{formatDate(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Usuario Operador:</span>
                  <span className="text-slate-200 font-bold">{selectedLog.user || 'SISTEMA_AXOMIRA'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Módulo / Entidad:</span>
                  <span className="text-purple-300 font-bold">{selectedLog.entityType} ({selectedLog.entityId || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Acción Transaccional:</span>
                  <span className="text-amber-300 font-bold">{selectedLog.action}</span>
                </div>
              </div>

              {/* Detalle Text */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observaciones y Detalle Operacional</span>
                <p className="text-slate-200 text-xs leading-relaxed font-mono whitespace-pre-wrap">{selectedLog.details}</p>
              </div>

              {/* Raw JSON Structure */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objeto JSON Auditable (Soft-Log Verified)</span>
                  <button
                    onClick={() => handleCopyJSON(selectedLog)}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedId === selectedLog.id ? 'Copiado!' : 'Copiar JSON'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-44 leading-relaxed">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Firma de Inmutabilidad Garantizada:</strong> Este evento ha sido sellado con soft-log estricto y no admite borrado físico (DELETE) en la base de datos PostgreSQL/Firestore.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsViewerSLG1;
