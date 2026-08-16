import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { Cpu, AlertTriangle, CheckCircle, ShieldAlert, ChevronRight, ChevronDown, Activity, Settings, Wrench } from 'lucide-react';

export const AssetHierarchyTree = () => {
  const { assets, workOrders } = useSAP();
  const [selectedAsset, setSelectedAsset] = useState(assets[0] || null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Módulo PM - Árbol de Activos & Ubicaciones Técnicas</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Jerarquía de Equipos & Salud Operativa de Planta
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transacción IE03 / IL03 - Catálogo estructurado de activos, criticidad y ciclo de vida de maquinaria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Asset Tree Navigation List */}
        <div className="lg:col-span-1 fiori-glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Planta Central Santiago (PLANT-01)
          </h3>

          <div className="space-y-2">
            {assets.map(asset => {
              const isSelected = selectedAsset?.id === asset.id;
              const relatedWOs = workOrders.filter(w => w.equipmentId === asset.id);

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sap-blue text-white border-sap-blue shadow-lg scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-sap-blue/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono">{asset.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      asset.status === 'Operational' ? 'bg-emerald-500/20 text-emerald-300' :
                      asset.status === 'Warning' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm mt-1 truncate">
                    {asset.name}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[11px] opacity-90">
                    <span>Health Index: <strong>{asset.healthIndex}%</strong></span>
                    <span>{relatedWOs.length} Órdenes PM</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Asset Detail View */}
        <div className="lg:col-span-2 fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          {selectedAsset ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-sap-blue">{selectedAsset.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">{selectedAsset.functionalLocation}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedAsset.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Índice de Salud OEE</span>
                  <div className="text-2xl font-black text-emerald-500 font-mono">
                    {selectedAsset.healthIndex}%
                  </div>
                </div>
              </div>

              {/* Asset Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 font-semibold">Categoría Técnica</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAsset.category}</div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 font-semibold">Criticidad Operativa</div>
                  <div className="font-bold text-rose-500 mt-1">{selectedAsset.criticality}</div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 font-semibold">Centro de Coste (CO)</div>
                  <div className="font-bold text-amber-500 font-mono mt-1">{selectedAsset.costCenter}</div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 font-semibold">Último Mantenimiento</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedAsset.lastMaintenance}</div>
                </div>
              </div>

              {/* Maintenance History list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-sap-blue" />
                  Historial de Órdenes de Mantenimiento Vinculadas
                </h4>

                <div className="space-y-2">
                  {workOrders.filter(w => w.equipmentId === selectedAsset.id).map(wo => (
                    <div key={wo.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sap-blue mr-2">{wo.id}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{wo.title}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-500">${wo.actualCost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Seleccione un activo de la lista para ver su expediente técnico completo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
