import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Truck, X, Cpu, HardHat, Gauge, Clock, ShieldCheck } from 'lucide-react';

export const CreateAssetModal = ({ isOpen, onClose, assetToEdit = null }) => {
  const { createAsset, updateAsset, addToast } = useSAP();
  const isEdit = !!assetToEdit;

  const [name, setName] = useState('');
  const [status, setStatus] = useState('OPERATIVE');
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

  React.useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name || '');
      setStatus(assetToEdit.status || 'OPERATIVE');
      setCategory(assetToEdit.category || 'Maquinaria Pesada');
      setLocation(assetToEdit.location || 'Mina Norte');
      setFunctionalLocation(assetToEdit.functionalLocation || 'PLANT-01-SECTOR-A');
      setModel(assetToEdit.model || '');
      setSerialNumber(assetToEdit.serialNumber || '');
      setOperator(assetToEdit.operator || '');
      setPlate(assetToEdit.plate || assetToEdit.id || '');
      setCostCenter(assetToEdit.costCenter || 'CC-4100');
      setInitialHourmeter(assetToEdit.hourmeter !== undefined ? String(assetToEdit.hourmeter) : '');
      setInitialOdometer(assetToEdit.odometer !== undefined ? String(assetToEdit.odometer) : '');
    } else {
      setName('');
      setStatus('OPERATIVE');
      setCategory('Maquinaria Pesada');
      setLocation('Mina Norte');
      setFunctionalLocation('PLANT-01-SECTOR-A');
      setModel('');
      setSerialNumber('');
      setOperator('');
      setPlate('');
      setCostCenter('CC-4100');
      setInitialHourmeter('');
      setInitialOdometer('');
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Por favor ingrese la denominación o nombre del equipo.', 'error');
      return;
    }

    if (isEdit) {
      updateAsset(assetToEdit.id, {
        name: name.trim(),
        status,
        category,
        location,
        functionalLocation,
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        operator: operator.trim(),
        plate: plate.trim(),
        costCenter,
        hourmeter: initialHourmeter ? Number(initialHourmeter) : assetToEdit.hourmeter,
        odometer: initialOdometer ? Number(initialOdometer) : assetToEdit.odometer
      });
      onClose();
    } else {
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
        onClose();
      }
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
              <span>Gestión de Activos PM</span>
              <span>/</span>
              <span>Maestro de Equipos</span>
              <span>/</span>
              <span className="text-sky-400 font-bold">{isEdit ? 'IE02' : 'IE01'}</span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>{isEdit ? `Transacción IE02 — Modificación de Equipo [${assetToEdit.id}]` : 'Transacción IE01 — Alta de Nuevo Equipo, Maquinaria o Vehículo'}</span>
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
            form="ie01-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isEdit ? 'Actualizar Registro (IE02)' : 'Guardar Equipo (IE01)'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <form id="ie01-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Datos Principales del Activo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>1. Denominación & Categoría del Activo</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Denominación del Equipo / Vehículo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Excavadora Hidráulica CAT 349 / Camión Aljibe Volvo FMX"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Estado Operativo del Equipo</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="OPERATIVE">OPERATIVO (Disponible en Línea)</option>
                    <option value="MAINTENANCE">MANTENCIÓN (En Taller PM)</option>
                    <option value="DOWN">DETENIDO / AVARIADO (Falla Crítica)</option>
                    <option value="STANDBY">STANDBY / RESERVA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Categoría PM</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="Maquinaria Pesada">Maquinaria Pesada (Mina/Construcción)</option>
                    <option value="Camión de Transporte">Camión de Transporte (Carretera)</option>
                    <option value="Camioneta / Vehículo Liviano">Camioneta / Vehículo Liviano</option>
                    <option value="Planta Procesamiento">Planta / Chancado / Procesamiento</option>
                    <option value="Componente / Agregado">Componente / Agregado Mayor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ubicación Física Operativa</label>
                  <input
                    type="text"
                    placeholder="Ej: Mina Norte / Campamento Central"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Ficha Técnica & Identificadores */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Truck className="w-4 h-4" />
                <span>2. Ficha Técnica, Serie & Asignación</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Modelo / Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: CAT 336 GC"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">N° Serie / Chasis</label>
                    <input
                      type="text"
                      placeholder="Ej: CAT336-X88"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Patente / ID Vehicular</label>
                    <input
                      type="text"
                      placeholder="Ej: HGBX-88 / EQ-205"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-amber-700 dark:text-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Operador Principal</label>
                    <input
                      type="text"
                      placeholder="Ej: Marcelo Rojas"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Centro de Costo (CO)</label>
                  <select
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="CC-4100">CC-4100 - Operaciones Mina</option>
                    <option value="CC-4200">CC-4200 - Planta Chancado</option>
                    <option value="CC-4300">CC-4300 - Logística Flota</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 3: Lecturas Iniciales de Contadores */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Gauge className="w-4 h-4" />
                <span>3. Lecturas Iniciales de Contadores (PM)</span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Horómetro Inicial (Horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 1200"
                    value={initialHourmeter}
                    onChange={(e) => setInitialHourmeter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-mono font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-slate-700 dark:text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Odómetro Inicial (Kilometraje)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 45000"
                    value={initialOdometer}
                    onChange={(e) => setInitialOdometer(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
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
            <span className="text-slate-400 block text-[10px]">Equipo</span>
            <span className="font-bold text-white text-sm">{name || 'Sin Nombre'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Categoría & Ubicación</span>
            <span className="font-bold text-sky-400 text-sm">{category} • {location}</span>
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
            form="ie01-form"
            className="px-5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isEdit ? 'Actualizar Registro (IE02)' : 'Guardar Equipo (IE01)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
