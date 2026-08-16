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

    createMaterial({
      id,
      name,
      type,
      stock: Number(stock),
      unit,
      storageLocation,
      storageBin,
      reorderPoint: Number(reorderPoint),
      safetyStock: Math.floor(Number(reorderPoint) / 2),
      unitPrice: Number(unitPrice),
      supplier
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 text-white w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-8">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Transacción MM01 - Crear Material en Almacén</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Código SKU Material</label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipo de Material</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-bold"
              >
                <option value="SPARE">SPARE - Repuesto de Mantenimiento</option>
                <option value="RAW">RAW - Materia Prima / Insumo</option>
                <option value="FIN">FIN - Producto Terminado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Descripción Breve del Material</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Correa de Transmisión Sincrónica V-Belt 5V1200"
              className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Stock Inicial</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Unidad Medida</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Precio Unit. ($)</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Almacén (Storage Loc)</label>
              <select
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700"
              >
                <option value="0001">0001 - Repuestos Mecánicos</option>
                <option value="0002">0002 - Fluidos & Lubricantes</option>
                <option value="0003">0003 - Empaque Sanitario</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Casillero Bin Estantería</label>
              <input
                type="text"
                value={storageBin}
                onChange={(e) => setStorageBin(e.target.value)}
                placeholder="Ej. A1-05"
                className="w-full bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold shadow"
            >
              Guardar Material (MM01)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
