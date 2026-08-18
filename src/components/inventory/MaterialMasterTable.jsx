import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Filter,
  DollarSign,
  MapPin,
  RefreshCw,
  Box,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';

export const MaterialMasterTable = ({ onOpenCreateMaterial, onOpenMIGOForMaterial }) => {
  const { materials, searchTerm, setSearchTerm, addToast } = useSAP();
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, SPARE, RAW, FIN
  const [selectedLocation, setSelectedLocation] = useState('ALL'); // ALL, 0001, 0002, 0003
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Filter materials based on global search & filters
  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      (m.id && m.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.storageBin && m.storageBin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'ALL' || m.type === selectedType;
    const matchesLocation = selectedLocation === 'ALL' || m.storageLocation === selectedLocation;
    const matchesLowStock = !onlyLowStock || m.stock <= m.reorderPoint;

    return matchesSearch && matchesType && matchesLocation && matchesLowStock;
  });

  const totalStockValuation = filteredMaterials.reduce((acc, m) => acc + (m.stock * m.unitPrice), 0);
  const totalLowStockCount = filteredMaterials.filter(m => m.stock <= m.reorderPoint).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sap-blue uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Módulo MM / WM - Maestro de Materiales</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Gestión de Stock & Catálogo de Repuestos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transacción MM03 / MMBE - Control de inventario en tiempo real y valoración de stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCreateMaterial}
            className="bg-sap-blue hover:bg-sap-blue-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Material (MM01)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Materiales Filtrados</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredMaterials.length} SKUs</div>
          </div>
          <Box className="w-8 h-8 text-sap-blue opacity-80" />
        </div>

        <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Valoración del Stock</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ${totalStockValuation.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Alertas de Stock Bajo</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {totalLowStockCount} SKUs Críticos
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500 opacity-80" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros:
          </span>

          {/* Type Filter Buttons */}
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'ALL'
                ? 'bg-sap-blue text-white shadow'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            Todos los Tipos
          </button>
          <button
            onClick={() => setSelectedType('SPARE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'SPARE'
                ? 'bg-sap-blue text-white shadow'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            Repuestos (SPARE)
          </button>
          <button
            onClick={() => setSelectedType('RAW')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'RAW'
                ? 'bg-sap-blue text-white shadow'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            Materia Prima (RAW)
          </button>

          {/* Storage Location Selector */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">Almacenes: Todos (0001, 0002, 0003)</option>
            <option value="0001">Almacén 0001 - Repuestos Mecánicos</option>
            <option value="0002">Almacén 0002 - Fluidos & Químicos</option>
            <option value="0003">Almacén 0003 - Empaque Sanitario</option>
          </select>
        </div>

        {/* Low Stock Checkbox Toggle */}
        <label className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
            className="w-4 h-4 text-sap-blue rounded focus:ring-sap-blue"
          />
          <span>Mostrar solo bajo Reorder Point</span>
        </label>
      </div>

      {/* Main Material Master SAP Grid Table */}
      <div className="fiori-glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="sap-table">
            <thead>
              <tr>
                <th>Código SKU</th>
                <th>Descripción del Material</th>
                <th>Tipo</th>
                <th>Ubicación Almacén</th>
                <th>Stock Actual</th>
                <th>Pt. Pedido</th>
                <th>Precio Unit.</th>
                <th>Valor Stock</th>
                <th>Proveedor Principal</th>
                <th className="text-right">Acción Quick MIGO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMaterials.map(mat => {
                const isCriticalStock = mat.stock <= mat.reorderPoint;
                const matTotalValue = mat.stock * mat.unitPrice;

                return (
                  <tr key={mat.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="font-mono font-bold text-sap-blue">
                      {mat.id}
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {mat.name}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mat.type === 'SPARE'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                      }`}>
                        {mat.type}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {mat.storageLocation} ({mat.storageBin})
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-extrabold text-sm ${isCriticalStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {mat.stock} {mat.unit}
                        </span>
                        {isCriticalStock && (
                          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" title="Stock Bajo del Punto de Pedido" />
                        )}
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs font-mono">
                      {mat.reorderPoint} {mat.unit}
                    </td>
                    <td className="font-mono text-slate-700 dark:text-slate-300">
                      ${mat.unitPrice.toFixed(2)}
                    </td>
                    <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${matTotalValue.toFixed(2)}
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {mat.supplier}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => onOpenMIGOForMaterial(mat.id)}
                        className="bg-sap-blue/10 hover:bg-sap-blue text-sap-blue hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-sap-blue/30 transition-all"
                      >
                        MIGO 261/101
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400 text-sm">
                    No se encontraron materiales que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
