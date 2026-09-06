import React, { useState } from 'react';
import AxomiraLogo from '../common/AxomiraLogo';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Building2, 
  Users, 
  Briefcase, 
  Mail, 
  Phone, 
  Wrench, 
  Sparkles, 
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

export function RequestDemoModal({ isOpen, onClose, onEnterERP }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    industry: 'Gran Minería & Extracción',
    employeeCount: '51 a 200 colaboradores',
    phone: '',
    primaryModule: 'Suite ERP Completa',
    assetCount: '10 a 50 Equipos/Maquinarias',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.company.trim()) {
      setErrorMessage('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (!formData.email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico corporativo válido.');
      return;
    }

    setIsSubmitting(true);

    // Simular registro en base de datos de solicitudes de Demo
    setTimeout(() => {
      const ticketId = `DEMO-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedTicket(ticketId);
      setIsSubmitting(false);
    }, 700);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setFormData({
      fullName: '',
      email: '',
      company: '',
      industry: 'Gran Minería & Extracción',
      employeeCount: '51 a 200 colaboradores',
      phone: '',
      primaryModule: 'Suite ERP Completa',
      assetCount: '10 a 50 Equipos/Maquinarias',
      notes: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 ring-1 ring-sky-500/20 my-8">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AxomiraLogo variant="icon" dark className="w-8 h-8" />
            <div>
              <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">AXOMIRA CLOUD ERP</span>
              <h3 className="text-lg font-black text-white">Solicitud de Demostración Corporativa</h3>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submittedTicket ? (
          <div className="p-8 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/50">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                Ticket Registrado: {submittedTicket}
              </span>
              <h4 className="text-2xl font-black text-white">¡Solicitud de Demo Recibida con Éxito!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Gracias, <strong className="text-white">{formData.fullName}</strong>. Un especialista técnico de <strong>AXOMIRA ERP</strong> se pondrá en contacto con tu equipo en <strong>{formData.company}</strong> para coordinar la presentación personalizada.
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-500">Empresa:</span>
                <span className="font-bold text-slate-200">{formData.company} ({formData.industry})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-500">Dotación:</span>
                <span className="font-bold text-slate-200">{formData.employeeCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-500">Módulo Clave:</span>
                <span className="font-bold text-sky-400">{formData.primaryModule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Correo Confirmación:</span>
                <span className="font-bold text-emerald-400">{formData.email}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { handleResetAndClose(); onEnterERP(); }}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Probar Sandbox ERP Interactivo Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetAndClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-3 rounded-xl transition-all"
              >
                Cerrar Confirmación
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <p className="text-xs text-slate-400 leading-relaxed">
              Completa el siguiente formulario corporativo para recibir una propuesta personalizada y acceso al Sandbox de Pruebas de <strong>AXOMIRA Cloud ERP</strong>.
            </p>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Ej. Ing. Roberto Gómez"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Correo Corporativo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Correo Electrónico Corporativo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="roberto.gomez@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de la Empresa / Organización <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="company"
                    required
                    placeholder="Ej. Minera del Norte SpA"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Teléfono de Contacto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Rubro de la Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Rubro / Sector Industrial
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Gran Minería & Extracción" className="bg-slate-900 text-slate-100">Gran Minería & Extracción</option>
                  <option value="Mediana & Pequeña Minería" className="bg-slate-900 text-slate-100">Mediana & Pequeña Minería</option>
                  <option value="Construcción & Obras Civiles" className="bg-slate-900 text-slate-100">Construcción & Obras Civiles</option>
                  <option value="Transporte & Logística de Flota" className="bg-slate-900 text-slate-100">Transporte & Logística de Flota</option>
                  <option value="Manufactura & Planta Industrial" className="bg-slate-900 text-slate-100">Manufactura & Planta Industrial</option>
                  <option value="Energía, Gas & Petróleo" className="bg-slate-900 text-slate-100">Energía, Gas & Petróleo</option>
                  <option value="Servicios de Mantenimiento / Tercerizado" className="bg-slate-900 text-slate-100">Servicios de Mantenimiento / Tercerizado</option>
                  <option value="Otro Sector Industrial" className="bg-slate-900 text-slate-100">Otro Sector Industrial</option>
                </select>
              </div>

              {/* Cantidad de Trabajadores */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dotación de Trabajadores
                </label>
                <select
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="1 a 20 colaboradores" className="bg-slate-900 text-slate-100">1 a 20 colaboradores</option>
                  <option value="21 a 50 colaboradores" className="bg-slate-900 text-slate-100">21 a 50 colaboradores</option>
                  <option value="51 a 200 colaboradores" className="bg-slate-900 text-slate-100">51 a 200 colaboradores</option>
                  <option value="201 a 500 colaboradores" className="bg-slate-900 text-slate-100">201 a 500 colaboradores</option>
                  <option value="Más de 500 colaboradores (Gran Minería)" className="bg-slate-900 text-slate-100">Más de 500 colaboradores (Gran Minería)</option>
                </select>
              </div>

              {/* Módulo Principal de Interés (Full width span para evitar recortes) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-sky-400 mb-1 flex items-center justify-between">
                  <span>Módulo Principal de Interés</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Selecciona el módulo clave para tu empresa</span>
                </label>
                <select
                  name="primaryModule"
                  value={formData.primaryModule}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-sky-500/40 rounded-xl px-3 py-2.5 text-xs text-sky-300 font-semibold focus:outline-none focus:border-sky-400 cursor-pointer shadow-sm"
                >
                  <option value="Suite ERP Completa" className="bg-slate-900 text-slate-100 font-semibold">Suite ERP Completa (PM + MM + Flota + HCM)</option>
                  <option value="Mantenimiento PM (IW31/IW32)" className="bg-slate-900 text-slate-100">Mantenimiento PM & TECO (IW31 / IW32)</option>
                  <option value="Gestión de Materiales MM (MIGO 261/101)" className="bg-slate-900 text-slate-100">Gestión de Materiales MM & MIGO (261 / 101)</option>
                  <option value="Control de Flotas & Maquinarias (IE03)" className="bg-slate-900 text-slate-100">Control de Flotas & Maquinarias (IE03)</option>
                  <option value="Recursos Humanos HCM & Faenas" className="bg-slate-900 text-slate-100">Recursos Humanos HCM & Faenas</option>
                  <option value="Executive Analytics CO/FI" className="bg-slate-900 text-slate-100">Executive Analytics CO/FI</option>
                </select>
              </div>

              {/* Volumen Estimado de Activos */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Volumen de Activos / Maquinarias
                </label>
                <select
                  name="assetCount"
                  value={formData.assetCount}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="1 a 10 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">1 a 10 Equipos / Maquinarias</option>
                  <option value="10 a 50 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">10 a 50 Equipos / Maquinarias</option>
                  <option value="51 a 200 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">51 a 200 Equipos / Maquinarias</option>
                  <option value="Más de 200 Equipos (Gran Minería)" className="bg-slate-900 text-slate-100">Más de 200 Equipos (Gran Minería)</option>
                </select>
              </div>

            </div>

            {/* Mensaje Adicional */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Requerimiento Específico o Comentarios (Opcional)
              </label>
              <textarea
                name="notes"
                rows="2"
                placeholder="Describe brevemente tus desafíos operativos actuales (ej. control de repuestos, mantenciones preventivas, ausentismo en faena...)"
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Registrando Solicitud...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud de Demo</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
