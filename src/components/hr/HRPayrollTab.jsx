import React from 'react';
import { DollarSign } from 'lucide-react';

export const HRPayrollTab = ({ payrollRuns = [], processPayrollRun }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="fiori-glass p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Liquidación de Nómina y Remuneraciones (PY)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Histórico de Procesos de Nómina</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollRuns.map(run => (
              <div key={run.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{run.id} • {run.period}</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                    {run.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  <div>Colaboradores: <strong className="text-slate-900 dark:text-white">{run.totalEmployees}</strong></div>
                  <div>Fecha Proceso: <strong className="text-slate-900 dark:text-white">{run.runDate}</strong></div>
                  <div>Total Bruto: <strong className="text-slate-900 dark:text-white">${run.grossSalaryTotal.toLocaleString('es-CL')}</strong></div>
                  <div>Total Líquido: <strong className="text-emerald-700 dark:text-emerald-400">${run.netSalaryTotal.toLocaleString('es-CL')}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPayrollTab;
