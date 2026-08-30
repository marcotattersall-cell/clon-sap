import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Package, X } from 'lucide-react';

export const CreateMaterialModal = ({ isOpen, onClose }) => {
  const { createMaterial, materials } = useSAP();

  const [id, setId] = useState(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [type, setType] = useState('SPARE');
  const [stock, setStock] = useState(20);
  const [unit, setUnit] = useState('EA');
  const [storageLocation, setStorageLocation] = useState('0001');
  const [storageBin, setStorageBin] = useState('A1-05');
  const [reorderPoint, setReorderPoint] = useState(10);
  const [unitPrice, setUnitPrice] = useState(50.00);
  const [supplier, setSupplier] = useState('Proveedor Industrial SA');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;

    const parsedStock = Number(stock);
    const parsedUnitPrice = Number(unitPrice);
    const parsedReorderPoint = Number(reorderPoint);

    if (isNaN(parsedStock) || parsedStock < 0) {
      alert('❌ El stock inicial no puede ser negativo.');
      return;
    }
    if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      alert('❌ El precio unitario no puede ser negativo.');
      return;
    }
    if (isNaN(parsedReorderPoint) || parsedReorderPoint < 0) {
      alert('❌ El punto de reorden no puede ser negativo.');
      return;
    }

    createMaterial({
      id,
      name,
      type,
      stock: parsedStock,
      unit,
      storageLocation,
      storageBin,
      reorderPoint: parsedReorderPoint,
      safetyStock: Math.floor(parsedReorderPoint / 2),
      unitPrice: parsedUnitPrice,
      supplier
    });

    onClose();
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
              <span>Gestión de Materiales</span>
              <span>/</span>
              <span>Maestro de Almacén</span>
              <span>/</span>
              <span className="text-emerald-400 font-bold">#inv-materiales</span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Alta de Nuevo Material (axomira:inventario:materiales)</span>


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
            form="mm01-form"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"

          >
            <Package className="w-4 h-4" />
            <span>Guardar Material (#inv-materiales)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <form id="mm01-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Identificación y Clasificación del Material */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Package className="w-4 h-4" />
                <span>1. Datos Maestros e Identificación SKU</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Código SKU Material</label>
                    <input
                      type="text"
                      required
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tipo de Material</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="SPARE">SPARE - Repuesto de Mantenimiento</option>
                      <option value="RAW">RAW - Materia Prima / Insumo</option>
                      <option value="FIN">FIN - Producto Terminado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Descripción Completa del Material</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Correa de Transmisión Sincrónica V-Belt 5V1200 / Filtro de Aceite Caterpillar 1R-1808"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Proveedor Principal Homologado</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ej. SKF Chile SpA / Komatsu Reman Center"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Right Card: Control de Stock, Ubicación y Valoración */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <Package className="w-4 h-4" />
                <span>2. Parámetros de Almacén, Stock y Valoración</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Unidad Medida</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono uppercase text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Precio Unit. ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Almacén (Storage Location)</label>
                    <select
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      <option value="0001">0001 - Repuestos Mecánicos & Componentes</option>
                      <option value="0002">0002 - Fluidos, Aceites & Lubricantes</option>
                      <option value="0003">0003 - Empaque Sanitario & Filtros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ubicación / Casillero Bin</label>
                    <input
                      type="text"
                      value={storageBin}
                      onChange={(e) => setStorageBin(e.target.value)}
                      placeholder="Ej. RACK-B2-04"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Punto de Reorden (MRP)</label>
                    <input
                      type="number"
                      value={reorderPoint}
                      onChange={(e) => setReorderPoint(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-mono font-bold p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Stock de Seguridad</label>
                    <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                      {Math.floor(Number(reorderPoint) / 2)} {unit}
                    </div>
                  </div>
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
            <span className="text-slate-400 block text-[10px]">SKU Material</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Valoración Inventario</span>
            <span className="font-mono font-bold text-sky-400 text-sm">${(Number(stock) * Number(unitPrice)).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Casillero Bin</span>
            <span className="font-mono font-bold text-slate-200">{storageBin} (Almacén {storageLocation})</span>
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
            form="mm01-form"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"

          >
            <Package className="w-4 h-4" />
            <span>Guardar Material (#inv-materiales)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
