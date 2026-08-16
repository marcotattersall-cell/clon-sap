import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Package, ArrowRightLeft, ArrowDownRight, ArrowUpRight, FileCheck, CheckCircle2, History, Layers } from 'lucide-react';

export const GoodsMovementMIGO = ({ initialMaterialId = '' }) => {
  const { materials, workOrders, migoDocuments, executeGoodsMovement, addToast } = useSAP();

  const [movementType, setMovementType] = useState('261'); // 261, 101, 311
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterialId || (materials[0]?.id || ''));
  const [quantity, setQuantity] = useState(1);
  const [refDoc, setRefDoc] = useState(workOrders[0]?.id || 'WO-400101');
  const [storageLocation, setStorageLocation] = useState('0001');
  const [targetLocation, setTargetLocation] = useState('0002');

  const handleSubmitMIGO = (e) => {
    e.preventDefault();
    const success = executeGoodsMovement({
      movementType,
      materialId: selectedMaterial,
      qty: quantity,
      storageLocation,
      targetStorageLocation: movementType === '311' ? targetLocation : 'N/A',
      refDocument: refDoc
    });

    if (success) {
      setQuantity(1);
    }
  };

  const currentMatObj = materials.find(m => m.id === selectedMaterial);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sap-blue uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Transacción MIGO - Movimiento de Mercancías</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Entradas, Salidas y Traspasos de Almacén
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Procesamiento de documentos de material con actualización simultánea del libro mayor e inventario.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Form */}
        <div className="lg:col-span-1 fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <FileCheck className="w-4 h-4 text-sap-blue" />
            <span>Formulario MIGO Express</span>
          </h3>

          <form onSubmit={handleSubmitMIGO} className="space-y-4 text-xs">
            {/* Movement Type Selector */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Clase de Movimiento SAP</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
              >
                <option value="261">261 - Salida para Orden de Trabajo (PM)</option>
                <option value="101">101 - Entrada de Mercancías por Pedido (PO)</option>
                <option value="311">311 - Traspaso de Stock entre Almacenes</option>
              </select>
            </div>

            {/* Material Selector */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Material (SKU)</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name} (Stock: {m.stock} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Stock indicator info */}
            {currentMatObj && (
              <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Stock Disponible:</span>
                  <span className="text-sap-blue font-mono">{currentMatObj.stock} {currentMatObj.unit}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Ubicación Bin:</span>
                  <span>{currentMatObj.storageLocation} ({currentMatObj.storageBin})</span>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Cantidad a Mover</label>
              <input
                type="number"
                min="1"
                max={movementType === '261' ? currentMatObj?.stock : 99999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Reference Document */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Documento de Referencia (OT / PO)</label>
              <input
                type="text"
                value={refDoc}
                onChange={(e) => setRefDoc(e.target.value)}
                placeholder="Ej. WO-400101 o PO-800901"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white font-bold p-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Contabilizar Documento MIGO</span>
            </button>
          </form>
        </div>

        {/* Right: MIGO Document History Log Table */}
        <div className="lg:col-span-2 fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <History className="w-4 h-4 text-sap-blue" />
            <span>Histórico de Documentos de Material MIGO</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>N° Doc. Material</th>
                  <th>Clase Mov.</th>
                  <th>Material SKU</th>
                  <th>Cant.</th>
                  <th>Almacén</th>
                  <th>Ref. Doc</th>
                  <th>Fecha / Hora</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {migoDocuments.map(doc => (
                  <tr key={doc.documentId} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {doc.documentId}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.movementType === '261' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        doc.movementType === '101' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {doc.movementType}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {doc.materialName}
                    </td>
                    <td className="font-mono font-bold text-sap-blue">
                      {doc.qty} {doc.unit}
                    </td>
                    <td className="font-mono text-xs">
                      {doc.storageLocation}
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {doc.refDocument}
                    </td>
                    <td className="text-xs text-slate-500">
                      {doc.timestamp}
                    </td>
                    <td className="text-xs text-slate-500">
                      {doc.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
