import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Package, ArrowRightLeft, ArrowDownRight, ArrowUpRight, FileCheck, CheckCircle2, History, Layers, QrCode } from 'lucide-react';
import { QRScannerModal } from '../modals/QRScannerModal';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

const GoodsMovementMIGOComponent = ({ initialMaterialId = '' }) => {
  const { materials, workOrders, purchaseOrders, migoDocuments, executeGoodsMovement, addToast } = useSAP();

  const [movementType, setMovementType] = useState('261'); // 261, 101, 311
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterialId || (materials[0]?.id || ''));
  const [quantity, setQuantity] = useState(1);
  const [refDoc, setRefDoc] = useState(workOrders[0]?.id || 'WO-400101');
  const [storageLocation, setStorageLocation] = useState('0001');
  const [targetLocation, setTargetLocation] = useState('0002');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(migoDocuments.length / pageSize) || 1;
  const paginatedDocs = migoDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectReference = (e) => {
    const val = e.target.value;
    setRefDoc(val);

    // Auto-fill material or default parameters if PO or WO selected
    if (movementType === '101') {
      const po = purchaseOrders.find(p => p.id === val);
      if (po && materials.length > 0) {
        setSelectedMaterial(materials[0].id);
      }
    } else if (movementType === '261') {
      const wo = workOrders.find(w => w.id === val || w.reservationNumber === val);
      if (wo && wo.components && wo.components.length > 0) {
        setSelectedMaterial(wo.components[0].materialId || materials[0]?.id);
        if (wo.components[0].qtyPlanned) {
          setQuantity(Number(wo.components[0].qtyPlanned));
        }
      }
    }
  };

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
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Clase de Movimiento ERP</label>
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

            {/* Material Selector with QR Scan Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 dark:text-slate-400 font-bold">Material (SKU)</label>
                <button
                  type="button"
                  onClick={() => setIsQRModalOpen(true)}
                  className="px-2.5 py-1 bg-sap-blue/10 hover:bg-sap-blue/20 text-sap-blue font-bold rounded-lg text-xs flex items-center space-x-1 border border-sap-blue/30 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Escanear QR</span>
                </button>
              </div>
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

            {/* Dynamic Reference Document Selector */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                Documento de Referencia ({movementType === '101' ? 'Orden de Compra ME21N' : movementType === '261' ? 'Reserva RESB / Orden PM' : 'Traspaso'})
              </label>

              {movementType === '101' ? (
                <select
                  value={refDoc}
                  onChange={handleSelectReference}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  <option value="">-- Seleccionar Pedido de Compras PO --</option>
                  {purchaseOrders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.vendor} ({p.status})
                    </option>
                  ))}
                  <option value="PO-45008912">PO-45008912 - Caterpillar Finning Chile</option>
                </select>
              ) : movementType === '261' ? (
                <select
                  value={refDoc}
                  onChange={handleSelectReference}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  <option value="">-- Seleccionar Orden PM / Reserva RESB --</option>
                  {workOrders.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.id} ({w.reservationNumber || 'RESB'}) - {w.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={refDoc}
                  onChange={(e) => setRefDoc(e.target.value)}
                  placeholder="Ej. WO-400101 o PO-800901"
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                />
              )}
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
                {paginatedDocs.map(doc => (
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
                      {formatDateDDMMYYYY(doc.timestamp)}
                    </td>
                    <td className="text-xs text-slate-500">
                      {doc.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
              <span>Página {currentPage} de {totalPages} ({migoDocuments.length} documentos MIGO)</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-lg disabled:opacity-50 transition-all"
                >
                  ◀ Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-lg disabled:opacity-50 transition-all"
                >
                  Siguiente ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onScanSuccess={(code) => {
          const matched = materials.find(m => m.id === code || m.id.toLowerCase() === code.toLowerCase());
          if (matched) {
            setSelectedMaterial(matched.id);
            addToast(`📷 QR Detectado: Material ${matched.name} (${matched.id})`, 'success');
          } else {
            setSelectedMaterial(code);
            addToast(`📷 QR Detectado: Código ${code}`, 'info');
          }
        }}
      />
    </div>
  );
};

export const GoodsMovementMIGO = React.memo(GoodsMovementMIGOComponent);
