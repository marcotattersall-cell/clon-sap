import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import { X, Calendar, ShieldCheck, Plus, Trash2, AlertTriangle, FileCheck, Truck, RefreshCw } from 'lucide-react';

export const UpdateVehicleExpirationsModal = ({ isOpen, onClose, vehicle }) => {
  const { updateAssetExpirations, addToast } = useSAP();

  const [accreditationExpiry, setAccreditationExpiry] = useState('');
  const [circulationPermitExpiry, setCirculationPermitExpiry] = useState('');
  const [soapExpiry, setSoapExpiry] = useState('');
  const [technicalReviewExpiry, setTechnicalReviewExpiry] = useState('');
  const [customExpirations, setCustomExpirations] = useState([]);

  // New Custom Expiration Input State
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomDate, setNewCustomDate] = useState('');
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setAccreditationExpiry(vehicle.accreditationExpiry || '');
      setCirculationPermitExpiry(vehicle.circulationPermitExpiry || '');
      setSoapExpiry(vehicle.soapExpiry || '');
      setTechnicalReviewExpiry(vehicle.technicalReviewExpiry || '');
      setCustomExpirations(Array.isArray(vehicle.customExpirations) ? vehicle.customExpirations : []);
      setNewCustomTitle('');
      setNewCustomDate('');
      setShowAddCustomForm(false);
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleAddCustomExpiration = (e) => {
    e.preventDefault();
    if (!newCustomTitle.trim() || !newCustomDate) {
      addToast('Por favor ingrese el nombre del vencimiento y la fecha.', 'error');
      return;
    }

    const newItem = {
      id: `CUST-${Date.now()}`,
      title: newCustomTitle.trim(),
      expiryDate: newCustomDate
    };

    setCustomExpirations(prev => [...prev, newItem]);
    setNewCustomTitle('');
    setNewCustomDate('');
    setShowAddCustomForm(false);
    addToast(`Vencimiento "${newItem.title}" agregado a la lista.`, 'info');
  };

  const handleRemoveCustom = (id) => {
    setCustomExpirations(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = updateAssetExpirations(vehicle.id, {
      accreditationExpiry,
      circulationPermitExpiry,
      soapExpiry,
      technicalReviewExpiry,
      customExpirations
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-800 via-slate-900 to-sky-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
                Planificación de Flota & Acreditación Vehicular
              </span>
              <h3 className="text-base font-black leading-tight">
                Vencimientos Documentales - {vehicle.plate || vehicle.id}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Summary Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200/80 text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span>{vehicle.name}</span>
              <span className="font-mono text-xs font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                {vehicle.plate || vehicle.id}
              </span>
            </div>
            <p className="text-slate-500 mt-0.5">
              Tipo: <strong className="text-slate-700">{vehicle.equipmentType}</strong> • Operador: <strong className="text-slate-700">{vehicle.operator}</strong>
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            {vehicle.costCenter}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-200 text-sky-900 text-[11px] leading-relaxed flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              Ingresa las fechas de renovación de los documentos obligatorios del vehículo. El sistema actualizará automáticamente el <strong>semáforo de alerta previa a 30 días</strong>.
            </span>
          </div>

          {/* Core Required Expirations */}
          <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-2">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <span>Documentos Legales & Acreditación Base</span>
            </h4>

            {/* 1. Acreditación en Faena */}
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">
                1. Fecha de Vencimiento de Acreditación en Faena <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={accreditationExpiry}
                onChange={(e) => setAccreditationExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              />
            </div>

            {/* 2. Permiso de Circulación */}
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">
                2. Fecha de Vencimiento del Permiso de Circulación <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={circulationPermitExpiry}
                onChange={(e) => setCirculationPermitExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              />
            </div>

            {/* 3. SOAP */}
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">
                3. Fecha de Vencimiento del Seguro Obligatorio (SOAP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={soapExpiry}
                onChange={(e) => setSoapExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              />
            </div>

            {/* 4. Revisión Técnica */}
            <div className="space-y-1">
              <label className="block text-slate-800 font-bold">
                4. Fecha de Vencimiento de la Revisión Técnica <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={technicalReviewExpiry}
                onChange={(e) => setTechnicalReviewExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Custom Expirations Section */}
          <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div>
                <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Otros Vencimientos Personalizados</span>
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Agrega otros documentos específicos (ej: Certificado de Gases, Póliza de Seguro, Extintor, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomForm(!showAddCustomForm)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCustomForm ? 'Cancelar' : '＋ Agregar Otro Vencimiento'}</span>
              </button>
            </div>

            {/* Form to add a new custom expiration item */}
            {showAddCustomForm && (
              <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-sm space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold text-[11px]">
                      Nombre del Documento / Certificado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Certificado de Gases / Póliza de Seguro"
                      value={newCustomTitle}
                      onChange={(e) => setNewCustomTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold text-[11px]">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={newCustomDate}
                      onChange={(e) => setNewCustomDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomExpiration}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Vencimiento Adicional</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of existing custom expirations */}
            {customExpirations.length === 0 ? (
              <div className="text-slate-500 italic text-[11px] py-1 text-center">
                No se han agregado vencimientos adicionales para este vehículo.
              </div>
            ) : (
              <div className="space-y-2">
                {customExpirations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-bold text-slate-800">{item.title}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.expiryDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(item.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Eliminar vencimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Guardar Vencimientos de Flota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
