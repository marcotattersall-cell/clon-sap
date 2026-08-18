import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { MapPin, Box, Layers, ShieldCheck, AlertCircle, Info, Package } from 'lucide-react';

export const WarehouseVisualMap = () => {
  const { materials } = useSAP();
  const [selectedBin, setSelectedBin] = useState(null);

  // Generate rack bin positions (Bins A1-A4, B1-B4, C1-C4, D1-D4)
  const racks = [
    { rack: 'A', name: 'Pasillo A - Repuestos Mecánicos (Almacén 0001)' },
    { rack: 'B', name: 'Pasillo B - Fluidos & Químicos (Almacén 0002)' },
    { rack: 'C', name: 'Pasillo C - Empaques & Sellos (Almacén 0003)' },
    { rack: 'D', name: 'Pasillo D - Instrumentación & Electrónica' }
  ];

  const binsList = [];
  racks.forEach(r => {
    for (let i = 1; i <= 4; i++) {
      const binCode = `${r.rack}${i}`;
      // Find materials stored in this bin (with defensive fallback if storageBin is missing)
      const matInBin = materials.filter(m => m?.storageBin && String(m.storageBin).startsWith(binCode));
      const totalStock = matInBin.reduce((acc, m) => acc + m.stock, 0);

      let status = 'empty'; // empty, normal, full, warning
      if (totalStock > 0 && totalStock < 50) status = 'normal';
      if (totalStock >= 50) status = 'full';
      if (matInBin.some(m => m.stock <= m.reorderPoint)) status = 'warning';

      binsList.push({
        binCode,
        rack: r.rack,
        number: i,
        materials: matInBin,
        totalStock,
        status
      });
    }
  });

  return (
    <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sap-blue" />
            <span>Mapa Visual de Distribución de Almacén (Rack Bins Map)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Visualización interactiva de estanterías, pasillos y bins de almacenamiento con indicadores de capacidad en tiempo real.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500"></span> Ocupado (Normal)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500"></span> Capacidad Alta
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-500"></span> Alerta Stock Bajo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700"></span> Desocupado
          </span>
        </div>
      </div>

      {/* Racks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {racks.map(r => (
          <div key={r.rack} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>RACK {r.rack}</span>
              <span className="text-[10px] text-slate-400 font-normal">Pasillo {r.rack}</span>
            </div>

            {/* Racks Bins stacked vertically */}
            <div className="grid grid-cols-2 gap-2">
              {binsList.filter(b => b.rack === r.rack).map(bin => {
                let colorClasses = 'bg-slate-200 dark:bg-slate-700 text-slate-600 border-slate-300';
                if (bin.status === 'normal') colorClasses = 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30';
                if (bin.status === 'full') colorClasses = 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/50 hover:bg-blue-500/30';
                if (bin.status === 'warning') colorClasses = 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/50 hover:bg-rose-500/30 animate-pulse';

                return (
                  <button
                    key={bin.binCode}
                    onClick={() => setSelectedBin(bin)}
                    className={`p-3 rounded-lg border text-left transition-all ${colorClasses} ${
                      selectedBin?.binCode === bin.binCode ? 'ring-2 ring-sap-blue shadow-lg scale-105' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-xs">
                      <span>BIN {bin.binCode}</span>
                      <Box className="w-3.5 h-3.5 opacity-80" />
                    </div>
                    <div className="text-[11px] mt-1 font-semibold truncate">
                      {bin.materials.length > 0 ? `${bin.materials.length} SKUs` : 'Vacio'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {bin.totalStock} unidades
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Bin Detail Modal / Drawer Panel */}
      {selectedBin && (
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-700 animate-in fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-sap-blue" />
              <h4 className="text-sm font-bold">Detalle del Bin {selectedBin.binCode}</h4>
            </div>
            <button
              onClick={() => setSelectedBin(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cerrar ✕
            </button>
          </div>

          {selectedBin.materials.length > 0 ? (
            <div className="space-y-2">
              {selectedBin.materials.map(m => (
                <div key={m.id} className="flex items-center justify-between text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div>
                    <span className="font-mono font-bold text-sap-blue">{m.id}</span> - <span className="font-semibold text-slate-200">{m.name}</span>
                  </div>
                  <div className="font-mono text-emerald-400 font-bold">
                    {m.stock} {m.unit} (${m.unitPrice}/u)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No hay materiales asignados físicamente a este casillero de estantería.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
