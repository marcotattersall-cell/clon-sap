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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-200">Gestión de Tiempos • PT (SAP HCM)</span>
              <h3 className="text-base font-black leading-tight">Solicitud de Licencia / Ausentismo</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-800 font-bold mb-1">Colaborador / Empleado *</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white font-medium"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.id} - {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Tipo de Ausentismo / Permiso *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white font-medium"
            >
              <option value="Vacaciones">Vacaciones Legales</option>
              <option value="Licencia Médica">Licencia Médica (Achs / Fonasa / Isapre)</option>
              <option value="Permiso Administrativo">Permiso Administrativo Con Goce</option>
              <option value="Hora Extra">Autorización Horas Extra</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">Fecha Término</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Total Días Solicitados</label>
            <input
              type="number"
              min="1"
              required
              value={formData.daysCount}
              onChange={(e) => setFormData({ ...formData, daysCount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Motivo / Justificación Médica o Legal</label>
            <textarea
              rows="3"
              placeholder="Detalle los motivos de la solicitud o número de folio de la licencia..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-700 hover:bg-sky-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Registrar Ausentismo HCM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
