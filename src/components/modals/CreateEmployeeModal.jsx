import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, UserPlus, ShieldCheck, Building2, Calendar, FileText, DollarSign, Mail, Phone, HardHat } from 'lucide-react';
import { formatChileanRUT, validateChileanRUT } from '../../utils/rutUtils';

export const CreateEmployeeModal = ({ isOpen, onClose }) => {
  const { plants, createEmployee, addToast } = useSAP();

  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    position: '',
    department: 'Mantenimiento de Planta',
    plantId: plants[0]?.id || '0001',
    faena: 'Mina Norte - Sector A',
    baseSalary: '1500000',
    contractType: 'Indefinido',
    hireDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    photoUrl: '',
    medicalExamExpiry: '2027-08-01',
    accreditationExpiry: '2027-12-01',
    safetyCourseExpiry: '2027-10-01'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rut) {
      alert('Por favor ingrese el nombre completo y RUT del colaborador.');
      return;
    }

    const rutVal = validateChileanRUT(formData.rut);
    if (!rutVal.isValid) {
      alert(rutVal.error);
      return;
    }

    if (Number(formData.baseSalary || 0) <= 0) {
      alert('❌ El sueldo base del trabajador debe ser mayor a $0.');
      return;
    }

    const success = createEmployee(formData);

    if (success) {
      onClose();
      setFormData({
        rut: '',
        name: '',
        position: '',
        department: 'Mantenimiento de Planta',
        plantId: plants[0]?.id || '0001',
        faena: 'Mina Norte - Sector A',
        baseSalary: '1500000',
        contractType: 'Indefinido',
        hireDate: new Date().toISOString().split('T')[0],
        email: '',
        phone: '',
        photoUrl: '',
        medicalExamExpiry: '2027-08-01',
        accreditationExpiry: '2027-12-01',
        safetyCourseExpiry: '2027-10-01'
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
              <span>Maestro de Personal</span>
              <span>/</span>
              <span className="text-sky-400 font-bold">#rrhh-personal</span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Alta de Personal & Ficha HCM (operam:rrhh:personal)</span>

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
            form="pa30-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-700 hover:bg-sky-800 text-white shadow-lg shadow-sky-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Colaborador (#rrhh-personal)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <form id="pa30-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Identificación Personal y Fotografía */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sky-700 dark:text-sky-400 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>1. Identificación Personal & Fotografía</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Vista previa"
                      className="w-14 h-14 rounded-full object-cover border-2 border-sky-600 shadow-md shrink-0"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center border-2 border-sky-300 shrink-0 text-xl shadow-xs">
                      {formData.name ? formData.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">URL Fotografía de Acreditación</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">RUT del Trabajador <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="15.482.910-3"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: formatChileanRUT(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />

                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Jorge Silva San Martín"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-sky-600" /> Correo
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="usuario@empresa.cl"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> Teléfono
                    </label>
                    <input
                      type="text"
                      placeholder="+56 9 8765 4321"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Organización, Cargo y Contrato */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sky-700 dark:text-sky-400 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span>2. Estructura Organizacional & Contrato</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo / Función</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mecánico Specialist PM / Operador Mina"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Área / Departamento</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="Mantenimiento de Planta">Mantenimiento de Planta</option>
                    <option value="Mantenimiento de Flota">Mantenimiento de Flota</option>
                    <option value="Operaciones Mina">Operaciones Mina</option>
                    <option value="Logística & Almacenes">Logística & Almacenes</option>
                    <option value="Prevención de Riesgos">Prevención de Riesgos</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Planta Base</label>
                    <select
                      value={formData.plantId}
                      onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    >
                      {plants.map(p => (
                        <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Faena Principal</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Mina Norte - Sector A"
                      value={formData.faena}
                      onChange={(e) => setFormData({ ...formData, faena: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-amber-800 dark:text-amber-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo Contrato</label>
                    <select
                      value={formData.contractType}
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                    >
                      <option value="Indefinido">Indefinido</option>
                      <option value="Plazo Fijo">Plazo Fijo</option>
                      <option value="Faena / Obra">Por Faena / Obra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sueldo Base ($)</label>
                    <input
                      type="number"
                      required
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Exámenes Médicos, Acreditaciones y Seguridad */}
            <div className="bg-amber-50/60 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-amber-200 dark:border-slate-800 pb-3 text-amber-900 dark:text-amber-400 font-bold text-xs">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>3. Exámenes Médicos & Acreditaciones</span>
              </div>

              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-amber-200 dark:border-slate-800 space-y-1">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">Vencimiento Examen Médico Ocupacional</label>
                  <input
                    type="date"
                    required
                    value={formData.medicalExamExpiry}
                    onChange={(e) => setFormData({ ...formData, medicalExamExpiry: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-amber-200 dark:border-slate-800 space-y-1">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">Vencimiento Pase de Acreditación Faena</label>
                  <input
                    type="date"
                    required
                    value={formData.accreditationExpiry}
                    onChange={(e) => setFormData({ ...formData, accreditationExpiry: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-amber-200 dark:border-slate-800 space-y-1">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">Vencimiento Inducción / Seguridad</label>
                  <input
                    type="date"
                    required
                    value={formData.safetyCourseExpiry}
                    onChange={(e) => setFormData({ ...formData, safetyCourseExpiry: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
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
            <span className="text-slate-400 block text-[10px]">Colaborador</span>
            <span className="font-bold text-white text-sm">{formData.name || 'Sin Nombre'} ({formData.rut || 'Sin RUT'})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Cargo & Faena</span>
            <span className="font-bold text-sky-400 text-sm">{formData.position || 'Sin Cargo'} • {formData.faena}</span>
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
            form="pa30-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-700 hover:bg-sky-800 text-white shadow-lg shadow-sky-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Colaborador (#rrhh-personal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
