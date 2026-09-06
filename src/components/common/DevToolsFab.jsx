import React, { useState } from 'react';
import { Zap, RefreshCw, Terminal, X, ChevronUp } from 'lucide-react';
import { useSAP } from '../../context/SAPContext';

export function DevToolsFab() {
  const [isOpen, setIsOpen] = useState(false);
  const { injectMassiveActionSimulation, resetData } = useSAP();

  return (
    <div className="fixed bottom-5 left-5 z-40 font-sans">
      {/* Popover Panel */}
      {isOpen && (
        <div className="mb-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 w-64 text-slate-100 animate-in slide-in-from-bottom-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white tracking-wide">Consola Dev & Simulación</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                injectMassiveActionSimulation();
                setIsOpen(false);
              }}
              className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold px-3 py-2 rounded-xl text-xs border border-amber-500/30 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                +25 Transacciones Demo
              </span>
              <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded font-mono">SIM</span>
            </button>

            <button
              onClick={() => {
                resetData();
                setIsOpen(false);
              }}
              className="w-full bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 hover:border-rose-500/40 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                Limpiar Todos los Datos
              </span>
              <span className="text-[10px] text-slate-500 font-mono">RESET</span>
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            Herramientas de depuración ERP
          </div>
        </div>
      )}

      {/* FAB Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-full shadow-2xl border transition-all ${
          isOpen
            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold scale-105'
            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white backdrop-blur-md'
        }`}
        title="Herramientas de desarrollo y pruebas"
      >
        <Terminal className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold font-mono">DEV</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
