import React from 'react';
import { Calendar, FileCheck2 } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export const HRAbsenceTab = ({
  absences = [],
  onOpenCreateAbsence,
  updateAbsenceStatus
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Control de Asistencias, Ausentismos y Licencias (PT)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Flujo de revisión y aprobación de solicitudes de vacaciones, licencias médicas Achs y horas extra.
          </p>
        </div>

        <button
          onClick={onOpenCreateAbsence}
          className="bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs transition-all"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Solicitar Ausentismo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-800 dark:text-slate-200">
            {absences.map(abs => (
              <tr key={abs.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400">{abs.id}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{abs.employeeName}</td>
                <td className="p-3">
                  <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                    {abs.type}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                  {formatDateDDMMYYYY(abs.startDate)} ➔ {formatDateDDMMYYYY(abs.endDate)}
                </td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{abs.daysCount} días</td>
                <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{abs.reason || 'Sin observación'}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    abs.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                    abs.status === 'Rechazado' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' :
                    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {abs.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-1">
                  {abs.status === 'Pendiente Aprobación' && (
                    <>
                      <button
                        onClick={() => updateAbsenceStatus(abs.id, 'Aprobado')}
                        className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-500 transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => updateAbsenceStatus(abs.id, 'Rechazado')}
                        className="bg-rose-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-rose-500 transition-colors"
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
  );
};

export default HRAbsenceTab;
