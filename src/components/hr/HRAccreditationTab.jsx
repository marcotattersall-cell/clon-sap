import React from 'react';
import { HardHat, AlertTriangle, XCircle, CheckCircle2, FileCheck2, Building2, Calendar } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export const HRAccreditationTab = ({
  employees = [],
  complianceFilter,
  setComplianceFilter,
  onOpenComplianceModal,
  calculateDaysRemaining
}) => {
  const filteredComplianceEmployees = employees.filter(emp => {
    const minDays = Math.min(
      calculateDaysRemaining(emp.medicalExamExpiry).days,
      calculateDaysRemaining(emp.faenaAccreditationExpiry).days
    );
    if (complianceFilter === 'ALERT_30') return minDays >= 0 && minDays <= 30;
    if (complianceFilter === 'EXPIRED') return minDays < 0;
    if (complianceFilter === 'OK') return minDays > 30;
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Banner & Alert Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
          <HardHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>Control y Monitor de Acreditaciones por Faena (Regla Alerta 30 Días)</span>
        </div>
        <p className="text-amber-800 dark:text-amber-400">
          El sistema evalúa continuamente la vigencia de los <strong>Exámenes Ocupacionales</strong>, <strong>Pases de Acreditación de Faena</strong> y <strong>Cursos de Prevención</strong>. Si faltan 30 días o menos para el vencimiento, la alerta permanecerá activa <strong>sin cambiar automáticamente hasta que se ingrese la renovación</strong>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setComplianceFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              complianceFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
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
              complianceFilter === 'OK' ? 'bg-sky-700 text-white border-sky-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Vigentes
          </button>
        </div>
      </div>

      {/* Grid de Colaboradores y su Cumplimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComplianceEmployees.map(emp => {
          const medStatus = calculateDaysRemaining(emp.medicalExamExpiry);
          const faenaStatus = calculateDaysRemaining(emp.faenaAccreditationExpiry);

          return (
            <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{emp.rut} | {emp.position}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  {emp.faena || 'Faena General'}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-700 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Examen Médico Ocupacional:
                  </span>
                  <span className={`font-mono font-bold ${
                    medStatus.status === 'EXPIRED' ? 'text-rose-600' :
                    medStatus.status === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {formatDateDDMMYYYY(emp.medicalExamExpiry)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Pase de Faena:
                  </span>
                  <span className={`font-mono font-bold ${
                    faenaStatus.status === 'EXPIRED' ? 'text-rose-600' :
                    faenaStatus.status === 'WARNING' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {formatDateDDMMYYYY(emp.faenaAccreditationExpiry)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenComplianceModal(emp)}
                className="w-full mt-2 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                Actualizar Acreditaciones
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HRAccreditationTab;
