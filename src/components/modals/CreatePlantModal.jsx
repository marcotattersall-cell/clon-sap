import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Building2, X, Plus, MapPin, CheckCircle } from 'lucide-react';

export const CreatePlantModal = ({ isOpen, onClose }) => {
  const { createPlant, plants } = useSAP();

  const defaultId = `000${plants.length + 1}`;
  const [formData, setFormData] = useState({
    id: defaultId,
    name: '',
    address: '',
    city: 'Santiago, Chile'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createPlant({
      id: formData.id.trim() || defaultId,
      name: formData.name.trim(),
      address: formData.address.trim() || 'Av. Industrial Sin Número',
      city: formData.city.trim() || 'Chile'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sap-blue/10 text-sap-blue flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Crear Nuevo Centro de Operaciones
              </h3>
              <p className="text-xs text-slate-500">
                Alta de nuevo Centro de Operaciones en Estructura Organizativa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Código Centro *
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="0004"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sap-blue"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Centro *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Planta Bío-Bío / Almacén Sur"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sap-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dirección Física
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. Costanera 4500, Parque Industrial"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sap-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ciudad / Región
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Concepción, VIII Región"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sap-blue"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-sap-blue shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Estructura Integrada:</strong> Al registrar este nuevo Centro, se activará en el selector global del sistema para vincular Almacenes (WM), Maestro de Materiales (MM) y Órdenes de Mantenimiento (PM).
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-sap-blue hover:bg-sap-blue-hover text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Centro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
