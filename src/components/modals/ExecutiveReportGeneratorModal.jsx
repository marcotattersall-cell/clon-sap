import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  FileText,
  Printer,
  Download,
  X,
  Sparkles,
  Wrench,
  Boxes,
  Activity,
  Users,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import {
  generatePMClosureReport,
  generateMMInventoryAuditReport,
  generateFleetPdMReport,
  generateHCMAuditReport,
  exportToCSV,
  printReportHTML
} from '../../services/reportingService';

export const ExecutiveReportGeneratorModal = ({ isOpen, onClose }) => {
  const { workOrders = [], materials = [], assets = [], employees = [], activePlant, addToast } = useSAP();

  const [reportType, setReportType] = useState('PM_CLOSURE');
  const plantName = activePlant?.name || 'Planta Central Antofagasta';

  if (!isOpen) return null;

  let currentReportData;
  if (reportType === 'PM_CLOSURE') {
    currentReportData = generatePMClosureReport({ workOrders, assets, plantName });
  } else if (reportType === 'MM_INVENTORY') {
    currentReportData = generateMMInventoryAuditReport({ materials, plantName });
  } else if (reportType === 'FLEET_PDM') {
    currentReportData = generateFleetPdMReport({ assets, workOrders, plantName });
  } else if (reportType === 'HCM_AUDIT') {
    currentReportData = generateHCMAuditReport({ employees, plantName });
  }

  const handlePrint = () => {
    printReportHTML(currentReportData);
    addToast('🖨️ Generando documento de impresión / PDF corporativo...', 'success');
  };

  const handleCSVExport = () => {
    if (!currentReportData || !currentReportData.items.length) return;
    const keys = Object.keys(currentReportData.items[0]);
    const cols = keys.map(k => ({ key: k, label: k.toUpperCase() }));
    exportToCSV(`${currentReportData.folio}_${currentReportData.reportType}`, cols, currentReportData.items);
    addToast('📊 Reporte exportado en formato CSV / Excel auditable.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col font-sans animate-in fade-in duration-200">
      
      {/* 🚀 Top Navigation Sticky Header (Estándar Consistente de Modales OPERAM) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl text-slate-100">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span>Inteligencia de Negocios</span>
              <span>/</span>
              <span>Reportes Ejecutivos BI</span>
              <span>/</span>
              <span className="text-sky-400 font-bold">#analitica-costos</span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Motor de Generación de Reportes Ejecutivos BI (axomira:analitica:reportes)</span>
            </h2>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleCSVExport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* 🖥️ Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Banner Informativo Superior */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AXOMIRA BI REPORTING ENGINE • AUDIT-READY</span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Sintetizador Oficial de Desempeño Operacional & Presupuestario
            </h3>
            <p className="text-xs text-slate-400">
              Selecciona el tipo de informe corporativo para visualizar la vista previa y descargar el documento sellado digitalmente.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-slate-300 font-mono shrink-0">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>Planta: <strong>{plantName}</strong></span>
          </div>
        </div>

        {/* 1. Selector de Tipo de Reporte (Estilo Cards Fiori Glass) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => setReportType('PM_CLOSURE')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              reportType === 'PM_CLOSURE'
                ? 'bg-sky-500/10 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                <Wrench className="w-5 h-5" />
              </div>
              {reportType === 'PM_CLOSURE' && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              )}
            </div>
            <div className="text-sm font-bold text-white">1. Cierre PM Mantenimiento</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Costo planificado vs real, variaciones ($) y tasa MTBF.
            </div>
          </button>

          <button
            onClick={() => setReportType('MM_INVENTORY')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              reportType === 'MM_INVENTORY'
                ? 'bg-sky-500/10 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                <Boxes className="w-5 h-5" />
              </div>
              {reportType === 'MM_INVENTORY' && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              )}
            </div>
            <div className="text-sm font-bold text-white">2. Auditoría MM Inventario</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Valoración total de existencias y reabastecimiento crítico.
            </div>
          </button>

          <button
            onClick={() => setReportType('FLEET_PDM')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              reportType === 'FLEET_PDM'
                ? 'bg-sky-500/10 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                <Activity className="w-5 h-5" />
              </div>
              {reportType === 'FLEET_PDM' && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              )}
            </div>
            <div className="text-sm font-bold text-white">3. Salud Flota & PdM</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Telemetría IoT, disponibilidad y vida útil restante (RUL).
            </div>
          </button>

          <button
            onClick={() => setReportType('HCM_AUDIT')}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              reportType === 'HCM_AUDIT'
                ? 'bg-sky-500/10 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
                <Users className="w-5 h-5" />
              </div>
              {reportType === 'HCM_AUDIT' && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              )}
            </div>
            <div className="text-sm font-bold text-white">4. Auditoría HCM Personal</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Cumplimiento legal, acreditaciones y pases faena.
            </div>
          </button>

        </div>

        {/* 2. Hoja de Vista Previa Corporativa Auditable (Canvas Paper Layout) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          
          {/* Header Hoja Corporativa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>DOCUMENTO OFICIAL AXOMIRA INTELLIGENT CLOUD ERP • SELLO AUDITADO</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">{currentReportData.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentReportData.subtitle}</p>
            </div>

            <div className="text-right shrink-0 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
              <div className="text-xs font-mono font-bold text-emerald-400">{currentReportData.folio}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentReportData.generatedAt}</div>
            </div>
          </div>

          {/* KPI Strip en Vista Previa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentReportData.kpis.map((kpi, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{kpi.label}</div>
                <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
                <div className="text-[11px] text-slate-400">{kpi.desc}</div>
              </div>
            ))}
          </div>

          {/* Tabla Auditable de Registros */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-400" />
                <span>Detalle de Registros del Informe ({currentReportData.items.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Formato CSV / Print Ready</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    {Object.keys(currentReportData.items[0] || {}).map((colKey, i) => (
                      <th key={i} className="px-4 py-3 font-bold">{colKey}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {currentReportData.items.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 whitespace-nowrap">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer de la Hoja */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
            <div>Firma Digital de Auditoría: <strong>AXOMIRA-ENGINE-AUTH-2026</strong></div>
            <div>Página 1 de 1 • Confidencial Corporativo</div>
          </div>

        </div>

      </div>

    </div>
  );
};
