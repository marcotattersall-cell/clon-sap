import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, UserPlus, ShieldCheck, Building2, Calendar, FileText, DollarSign, Mail, Phone, HardHat } from 'lucide-react';

export const CreateEmployeeModal = ({ isOpen, onClose }) => {
  const { plants, createEmployee } = useSAP();

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sap-blue to-sky-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-200">SAP HCM • Transacción PA30</span>
              <h3 className="text-lg font-black leading-tight">Alta de Personal y Ficha HCM</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Section 1: Datos Personales & Foto */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sap-blue" />
              1. Identificación y Fotografía de Acreditación
            </h4>

            {/* Avatar Photo Preview Row */}
            <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-sap-blue overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500 text-lg shadow-sm">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  formData.name ? formData.name.charAt(0) : '📷'
                )}
              </div>
              <div className="flex-1">
                <label className="block text-slate-700 font-bold mb-1">URL de la Foto de Perfil / Acreditación</label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto-colaborador.jpg"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Opcional: Si se omite, se generará un avatar institucional basado en las iniciales del colaborador.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Pablo Pérez Morales"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">RUT / Identificación *</label>
                <input
                  type="text"
                  required
                  placeholder="12.345.678-9"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="ejemplo@empresa.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Datos Contractuales y Ubicación */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sap-blue" />
              2. Asignación de Cargo, Centro y Faena
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Cargo / Puesto</label>
                <input
                  type="text"
                  placeholder="ej. Especialista Mecánico"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Departamento HCM</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                >
                  <option value="Mantenimiento de Planta">Mantenimiento de Planta</option>
                  <option value="Operaciones Mina">Operaciones Mina</option>
                  <option value="Almacén e Inventarios">Almacén e Inventarios</option>
                  <option value="Gestión de Flota">Gestión de Flota</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Administración y Finanzas">Administración y Finanzas</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Centro Operativo SAP</label>
                <select
                  value={formData.plantId}
                  onChange={(e) => setFormData({ ...formData, plantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                >
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Faena Operativa Asignada</label>
                <input
                  type="text"
                  placeholder="ej. Mina Norte - Sector A"
                  value={formData.faena}
                  onChange={(e) => setFormData({ ...formData, faena: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sueldo Base Mensual ($ CLP)</label>
                <input
                  type="number"
                  placeholder="1500000"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tipo de Contrato *</label>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue focus:bg-white transition-all font-bold"
                >
                  <option value="Indefinido">Indefinido</option>
                  <option value="Plazo Fijo">Plazo Fijo (Con Vencimiento)</option>
                  <option value="Honorarios">Honorarios / Servicios</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fecha de Contratación</label>
                <input
                  type="date"
                  required
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sap-blue font-mono"
                />
              </div>

              {formData.contractType === 'Plazo Fijo' && (
                <div>
                  <label className="block text-amber-900 font-bold mb-1">Vencimiento Contrato Plazo Fijo *</label>
                  <input
                    type="date"
                    required
                    value={formData.contractExpiry || '2026-12-31'}
                    onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                  <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                    Alerta automática activa 30 días antes del término del contrato.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Control de Fechas de Acreditación y Exámenes de Faena */}
          <div className="space-y-3 pt-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200/70">
            <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider border-b border-amber-200 pb-1.5 flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-600" />
              3. Control de Vencimiento de Exámenes y Acreditación de Faena
            </h4>
            <p className="text-[11px] text-amber-800">
              Ingrese las fechas límite de vigencia. El sistema generará <strong>alertas de 30 días de anticipación</strong> que permanecerán hasta ingresar la renovación.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-amber-900 font-bold mb-1">Vencimiento Examen Ocupacional</label>
                <input
                  type="date"
                  required
                  value={formData.medicalExamExpiry}
                  onChange={(e) => setFormData({ ...formData, medicalExamExpiry: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-amber-900 font-bold mb-1">Vencimiento Pase / Acreditación Faena</label>
                <input
                  type="date"
                  required
                  value={formData.accreditationExpiry}
                  onChange={(e) => setFormData({ ...formData, accreditationExpiry: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-amber-900 font-bold mb-1">Vencimiento Curso Prevención / Seguridad</label>
                <input
                  type="date"
                  required
                  value={formData.safetyCourseExpiry}
                  onChange={(e) => setFormData({ ...formData, safetyCourseExpiry: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>
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
              className="bg-sap-blue hover:bg-sap-blue-hover text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center space-x-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Colaborador en SAP HCM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
