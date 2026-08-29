import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, Calendar, Clock, FileCheck2, User, AlertCircle } from 'lucide-react';

export const CreateAbsenceModal = ({ isOpen, onClose }) => {
  const { employees, createAbsenceRequest } = useSAP();

  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    type: 'Vacaciones',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysCount: '1',
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert('Seleccione un colaborador.');
      return;
    }

    const success = createAbsenceRequest(formData);
    if (success) {
      onClose();
      setFormData({
        employeeId: employees[0]?.id || '',
        type: 'Vacaciones',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        daysCount: '1',
        reason: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-y-auto flex flex-col animate-in fade-in duration-200">
      {/* Sticky Top Fiori Navigation Header */}
      <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shadow-2xl shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <span>Recursos Humanos HCM</span>
              <span>/</span>
              <span>Gestión de Tiempos PT</span>
              <span>/</span>
              <span className="text-sky-400 font-bold">PT20</span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Transacción PT20 — Registro de Ausentismo, Vacaciones y Licencias</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="pt20-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-700 hover:bg-sky-600 text-white shadow-lg shadow-sky-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Registrar Ausentismo (PT20)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <form id="pt20-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Selección de Trabajador y Tipo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sky-700 dark:text-sky-400 font-bold text-xs">
                <User className="w-4 h-4" />
                <span>1. Colaborador y Tipo de Ausencia</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Colaborador / Empleado <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.id} - {emp.name} ({emp.department} • {emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tipo de Ausentismo / Permiso <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Vacaciones">Vacaciones Legales</option>
                    <option value="Licencia Médica">Licencia Médica (Achs / Fonasa / Isapre)</option>
                    <option value="Permiso Administrativo">Permiso Administrativo Con Goce</option>
                    <option value="Hora Extra">Autorización Horas Extra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Motivo / Justificación o Folio Licencia</label>
                  <textarea
                    rows="4"
                    placeholder="Detalle los motivos de la solicitud, número de folio de la licencia médica o acuerdos con la jefatura..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>
            </div>

            {/* Right Card: Período y Fechas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>2. Período, Fechas y Duración</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Fecha Inicio</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Fecha Término</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Total Días Solicitados</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.daysCount}
                    onChange={(e) => setFormData({ ...formData, daysCount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-lg text-sky-600 dark:text-sky-400 font-mono font-black text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="sticky bottom-0 z-30 bg-slate-900 text-white px-6 py-3.5 border-t border-slate-800 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Tipo de Permiso</span>
            <span className="font-bold text-white text-sm">{formData.type} ({formData.daysCount} días)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Vigencia</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{formData.startDate} al {formData.endDate}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="pt20-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-700 hover:bg-sky-600 text-white shadow-lg shadow-sky-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Registrar Ausentismo (PT20)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
