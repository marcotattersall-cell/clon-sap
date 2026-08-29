import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, Edit, ShieldCheck, Building2, Calendar, FileText, DollarSign, Mail, Phone, HardHat, AlertCircle, Save } from 'lucide-react';

export const EditEmployeeModal = ({ isOpen, onClose, employee }) => {
  const { plants, updateEmployee, addToast } = useSAP();

  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    position: '',
    department: '',
    plantId: '',
    faena: '',
    baseSalary: '',
    contractType: 'Indefinido',
    hireDate: '',
    contractExpiry: '',
    status: 'Activo',
    email: '',
    phone: '',
    photoUrl: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        rut: employee.rut || '',
        name: employee.name || '',
        position: employee.position || '',
        department: employee.department || 'Mantenimiento de Planta',
        plantId: employee.plantId || (plants[0]?.id || '0001'),
        faena: employee.faena || 'Mina Norte - Sector A',
        baseSalary: String(employee.baseSalary || 1500000),
        contractType: employee.contractType || 'Indefinido',
        hireDate: employee.hireDate || new Date().toISOString().split('T')[0],
        contractExpiry: employee.contractExpiry || '',
        status: employee.status || 'Activo',
        email: employee.email || '',
        phone: employee.phone || '',
        photoUrl: employee.photoUrl || ''
      });
      setValidationErrors({});
    }
  }, [employee, plants]);

  if (!isOpen || !employee) return null;

  // Validation function
  const validateForm = () => {
    const errors = {};

    // 1. Validar Nombre Completo
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'El nombre completo debe tener al menos 3 caracteres.';
    }

    // 2. Validar RUT (Formato XX.XXX.XXX-X o XXXXXXXX-X)
    const rutClean = formData.rut.trim();
    const rutRegex = /^(\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\d{7,8}-[\dkK])$/;
    if (!rutClean) {
      errors.rut = 'El RUT es obligatorio.';
    } else if (!rutRegex.test(rutClean)) {
      errors.rut = 'Formato de RUT inválido. Ejemplo: 15.482.910-3';
    }

    // 3. Validar Correo Electrónico
    const emailClean = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(emailClean)) {
      errors.email = 'Formato de correo electrónico inválido. Ejemplo: usuario@empresa.cl';
    }

    // 4. Validar Sueldo Base
    const salaryNum = Number(formData.baseSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      errors.baseSalary = 'El sueldo base debe ser un monto numérico mayor a $0.';
    }

    // 5. Validar Contrato Plazo Fijo
    if (formData.contractType === 'Plazo Fijo' && !formData.contractExpiry) {
      errors.contractExpiry = 'Para contratos a Plazo Fijo es obligatoria la fecha de vencimiento.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('❌ Corrija los errores de validación antes de guardar los cambios.', 'error');
      return;
    }

    const success = updateEmployee(employee.id, formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 my-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sap-blue to-sky-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Edit className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-200">Maestro de Personal • Operam HCM (#rrhh-personal)</span>
              <h3 className="text-base font-black leading-tight">Modificar Ficha de Colaborador [{employee.id}]</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Photo & Avatar Preview Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 text-xs flex items-center space-x-4">
          {formData.photoUrl ? (
            <img
              src={formData.photoUrl}
              alt="Vista previa"
              className="w-14 h-14 rounded-full object-cover border-2 border-sap-blue shadow-md shrink-0"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center border-2 border-slate-300 shrink-0 text-xl shadow-xs">
              {formData.name ? formData.name.charAt(0) : 'U'}
            </div>
          )}
          <div className="flex-1 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {formData.name || 'Nombre del Colaborador'}
            </div>
            <div className="text-slate-500 font-mono text-[11px] flex items-center space-x-2">
              <span>RUT: <strong>{formData.rut || 'Pendiente'}</strong></span>
              <span>•</span>
              <span>Cargo: <strong>{formData.position || 'No Asignado'}</strong></span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RUT */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                RUT del Trabajador <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="15.482.910-3"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                className={`w-full border rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 ${
                  validationErrors.rut ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500' : 'border-slate-300 focus:ring-sap-blue'
                }`}
              />
              {validationErrors.rut && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.rut}
                </p>
              )}
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Jorge Silva San Martín"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full border rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 ${
                  validationErrors.name ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500' : 'border-slate-300 focus:ring-sap-blue'
                }`}
              />
              {validationErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.name}
                </p>
              )}
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Cargo / Función</label>
              <input
                type="text"
                required
                placeholder="Ej: Técnico Senior Mantenimiento"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue"
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Departamento HCM</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue"
              >
                <option value="Mantenimiento de Planta">Mantenimiento de Planta</option>
                <option value="Operaciones Mina">Operaciones Mina</option>
                <option value="Gestión de Flota">Gestión de Flota</option>
                <option value="Almacén e Inventarios">Almacén e Inventarios</option>
                <option value="Prevención de Riesgos">Prevención de Riesgos</option>
              </select>
            </div>

            {/* Centro / Planta SAP */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Centro Operativo (Plant)</label>
              <select
                value={formData.plantId}
                onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue font-mono"
              >
                {plants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Faena Asignada */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Faena Principal</label>
              <input
                type="text"
                required
                placeholder="Ej: Mina Norte - Sector A"
                value={formData.faena}
                onChange={(e) => setFormData({ ...formData, faena: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue"
              />
            </div>

            {/* Sueldo Base */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Sueldo Base Mensual (CLP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="1500000"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                className={`w-full border rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 ${
                  validationErrors.baseSalary ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500' : 'border-slate-300 focus:ring-sap-blue'
                }`}
              />
              {validationErrors.baseSalary && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.baseSalary}
                </p>
              )}
            </div>

            {/* Estado Laboral */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Estado Laboral</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue font-bold"
              >
                <option value="Activo">Activo</option>
                <option value="Licencia Médica">Licencia Médica</option>
                <option value="Suspendido">Suspendido</option>
                <option value="Finiquitado">Finiquitado</option>
              </select>
            </div>

            {/* Tipo de Contrato */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tipo de Contrato</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue font-bold"
              >
                <option value="Indefinido">Indefinido</option>
                <option value="Plazo Fijo">Plazo Fijo</option>
                <option value="Honorarios">Honorarios / Servicios</option>
              </select>
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Fecha de Ingreso (Contratación)</label>
              <input
                type="date"
                required
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sap-blue"
              />
            </div>

            {/* Vencimiento Plazo Fijo */}
            {formData.contractType === 'Plazo Fijo' && (
              <div className="col-span-1 md:col-span-2 bg-amber-50 p-3 rounded-xl border border-amber-300">
                <label className="block text-amber-900 font-bold mb-1">
                  Fecha de Vencimiento de Contrato Plazo Fijo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.contractExpiry}
                  onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                  className={`w-full bg-white border rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 ${
                    validationErrors.contractExpiry ? 'border-rose-500 focus:ring-rose-500' : 'border-amber-400 focus:ring-amber-500'
                  }`}
                />
                {validationErrors.contractExpiry && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> {validationErrors.contractExpiry}
                  </p>
                )}
              </div>
            )}

            {/* Correo Electrónico */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Correo Electrónico <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="colaborador@empresa.cl"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 ${
                  validationErrors.email ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500' : 'border-slate-300 focus:ring-sap-blue'
                }`}
              />
              {validationErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.email}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Teléfono Móvil</label>
              <input
                type="text"
                placeholder="+56 9 8765 4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sap-blue"
              />
            </div>

            {/* Photo URL */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">URL Fotografía de Perfil</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-sap-blue"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sap-blue hover:bg-sap-blue-hover text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios (#rrhh-personal)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
