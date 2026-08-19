import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, HardHat, Calendar, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export const UpdateComplianceModal = ({ isOpen, onClose, employee }) => {
  const { updateEmployeeCompliance, addFaenaAccreditation } = useSAP();

  const [selectedFaenaId, setSelectedFaenaId] = useState('PRIMARY');
  const [isAddingNewFaena, setIsAddingNewFaena] = useState(false);
  const [newFaenaName, setNewFaenaName] = useState('');

  const [dates, setDates] = useState({
    medicalExamExpiry: '',
    accreditationExpiry: '',
    safetyCourseExpiry: ''
  });

  const faenasList = employee?.faenasAccredited || [
    {
      id: 'PRIMARY',
      faenaName: employee?.faena || 'Faena Principal',
      medicalExamExpiry: employee?.medicalExamExpiry,
      accreditationExpiry: employee?.accreditationExpiry,
      safetyCourseExpiry: employee?.safetyCourseExpiry
    }
  ];

  useEffect(() => {
    if (employee) {
      const selectedObj = faenasList.find(f => f.id === selectedFaenaId) || faenasList[0];
      setDates({
        medicalExamExpiry: selectedObj?.medicalExamExpiry || employee.medicalExamExpiry || '',
        accreditationExpiry: selectedObj?.accreditationExpiry || employee.accreditationExpiry || '',
        safetyCourseExpiry: selectedObj?.safetyCourseExpiry || employee.safetyCourseExpiry || '',
        contractType: employee.contractType || 'Indefinido',
        contractExpiry: employee.contractExpiry || ''
      });
    }
  }, [employee, selectedFaenaId]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAddingNewFaena) {
      if (!newFaenaName.trim()) return;
      addFaenaAccreditation(employee.id, {
        faenaName: newFaenaName.trim(),
        medicalExamExpiry: dates.medicalExamExpiry,
        accreditationExpiry: dates.accreditationExpiry,
        safetyCourseExpiry: dates.safetyCourseExpiry
      });
    } else {
      updateEmployeeCompliance(employee.id, dates, selectedFaenaId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">Acreditación de Faenas & Contratos • Operam HCM</span>
              <h3 className="text-base font-black leading-tight">Renovar Acreditación o Extender Contrato</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Info Header */}
        <div className="bg-amber-50 p-4 border-b border-amber-200/80 text-xs flex items-center space-x-3">
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center border border-amber-300 shrink-0 text-base">
              {employee.name ? employee.name.charAt(0) : 'U'}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{employee.name}</span>
              <span className="font-mono text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                {employee.rut}
              </span>
            </div>
            <div className="text-slate-600 flex items-center justify-between mt-0.5">
              <span>Cargo: <strong>{employee.position}</strong></span>
              <span className="text-amber-800 font-bold">Faena: {employee.faena}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Contratado el: <strong>{employee.hireDate || 'N/A'}</strong> ({employee.contractType})
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Al ingresar y guardar las nuevas fechas de vigencia a futuro, las alertas de <strong>30 días de anticipación</strong> se actualizarán automáticamente.
            </span>
          </div>

          {/* Faena Selection for Multi-Faena Accreditation */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 font-bold text-xs">
                Seleccionar Faena a Actualizar / Acreditar:
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewFaena(!isAddingNewFaena);
                  setNewFaenaName('');
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
              >
                {isAddingNewFaena ? '← Volver a Faenas Registradas' : '➕ Nueva Faena'}
              </button>
            </div>

            {isAddingNewFaena ? (
              <div>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mina Sur - Sector C, Planta Concentradora..."
                  value={newFaenaName}
                  onChange={(e) => setNewFaenaName(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>
            ) : (
              <select
                value={selectedFaenaId}
                onChange={(e) => setSelectedFaenaId(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
              >
                {faenasList.map(f => (
                  <option key={f.id} value={f.id}>
                    📍 {f.faenaName} (Acreditación Vigente)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                1. Examen Médico / Salud Ocupacional (Sensotec)
              </label>
              <input
                type="date"
                required
                value={dates.medicalExamExpiry}
                onChange={(e) => setDates({ ...dates, medicalExamExpiry: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                2. Pase de Acreditación de Faena / Identificación
              </label>
              <input
                type="date"
                required
                value={dates.accreditationExpiry}
                onChange={(e) => setDates({ ...dates, accreditationExpiry: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                3. Curso de Inducción de Seguridad / Prevención
              </label>
              <input
                type="date"
                required
                value={dates.safetyCourseExpiry}
                onChange={(e) => setDates({ ...dates, safetyCourseExpiry: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Contract Type & Expiry Renewal */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-slate-800 font-bold mb-1">Tipo de Contrato</label>
              <select
                value={dates.contractType}
                onChange={(e) => setDates({ ...dates, contractType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Indefinido">Indefinido (Sin vencimiento)</option>
                <option value="Plazo Fijo">Plazo Fijo (Con Vencimiento)</option>
                <option value="Honorarios">Honorarios / Servicios</option>
              </select>
            </div>

            {dates.contractType === 'Plazo Fijo' && (
              <div>
                <label className="block text-amber-900 font-bold mb-1">
                  Vencimiento Contrato Plazo Fijo (Renovación)
                </label>
                <input
                  type="date"
                  required
                  value={dates.contractExpiry}
                  onChange={(e) => setDates({ ...dates, contractExpiry: e.target.value })}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>
            )}
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
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar y Limpiar Alertas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
