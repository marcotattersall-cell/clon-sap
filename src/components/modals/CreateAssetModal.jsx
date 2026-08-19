import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Truck, X, Cpu, HardHat, Gauge, Clock, ShieldCheck } from 'lucide-react';

export const CreateAssetModal = ({ isOpen, onClose }) => {
  const { createAsset, addToast } = useSAP();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Maquinaria Pesada');
  const [location, setLocation] = useState('Mina Norte');
  const [functionalLocation, setFunctionalLocation] = useState('PLANT-01-SECTOR-A');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [plate, setPlate] = useState('');
  const [costCenter, setCostCenter] = useState('CC-4100');
  const [initialHourmeter, setInitialHourmeter] = useState('');
  const [initialOdometer, setInitialOdometer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Por favor ingrese la denominación o nombre del equipo.', 'error');
      return;
    }

    const success = createAsset({
      name: name.trim(),
      category,
      location,
      functionalLocation,
      model: model.trim() || 'Modelo Industrial 2026',
      serialNumber: serialNumber.trim() || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      operator: operator.trim() || 'Operador Asignado',
      plate: plate.trim() || undefined,
      costCenter,
      hourmeter: initialHourmeter ? Number(initialHourmeter) : 0,
      odometer: initialOdometer ? Number(initialOdometer) : 0,
      status: 'OPERATIVE',
      healthScore: 100
    });

    if (success) {
      setName('');
      setModel('');
      setSerialNumber('');
      setOperator('');
      setPlate('');
      setInitialHourmeter('');
      setInitialOdometer('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 text-white w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Transacción IE01 - Crear Equipo / Alta de Flota</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Nombre / Denominación */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">
              Denominación del Equipo / Vehículo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Excavadora Hidráulica CAT 349 / Camión Aljibe Volvo FMX"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Categoría y Ubicación Técnica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Categoría PM</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="Maquinaria Pesada">🚜 Maquinaria Pesada (Mina/Construcción)</option>
                <option value="Camión de Transporte">🚛 Camión de Transporte (Carretera)</option>
                <option value="Camioneta / Vehículo Liviano">🛻 Camioneta / Vehículo Liviano</option>
                <option value="Planta Procesamiento">🏭 Planta / Chancado / Procesamiento</option>
                <option value="Componente / Agregado">⚙️ Componente / Agregado Mayor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Ubicación Física</label>
              <input
                type="text"
                placeholder="Ej: Mina Norte / Campamento Central"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Modelo & N° Serie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Modelo / Marca</label>
              <input
                type="text"
                placeholder="Ej: Caterpillar 336 GC / Komatsu WA470"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">N° de Serie Chasis/Motor</label>
              <input
                type="text"
                placeholder="Ej: CAT336-2026-X88"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Operador, Patente & Centro de Costo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Operador Asignado</label>
              <input
                type="text"
                placeholder="Ej: Marcelo Rojas"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Patente / ID Identificador</label>
              <input
                type="text"
                placeholder="Ej: HGBX-88 / EQ-205"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Centro de Costo</label>
              <select
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="CC-4100">CC-4100 (Operaciones Mina)</option>
                <option value="CC-4200">CC-4200 (Planta Chancado)</option>
                <option value="CC-4300">CC-4300 (Logística Flota)</option>
              </select>
            </div>
          </div>

          {/* Horómetro Inicial & Kilometraje Inicial */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-sky-400 flex items-center space-x-1">
              <Gauge className="w-4 h-4" />
              <span>Lecturas Iniciales de Contadores (Pautas 250 hrs / 10.000 km)</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-slate-400">Horómetro Inicial (Horas)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 1200"
                  value={initialHourmeter}
                  onChange={(e) => setInitialHourmeter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Kilometraje Inicial (Km)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 45000"
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg transition-colors flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Alta de Equipo IE01</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
