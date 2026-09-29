import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Trash2, X, Lock, ShieldCheck, FileText } from 'lucide-react';

export const MassDeleteValidationModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalOrdersCount = 0,
  crteCount = 0,
  protectedCount = 0,
  isSelectionOnly = false,
  selectedCount = 0
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [forceProtected, setForceProtected] = useState(false);

  if (!isOpen) return null;

  const countToEvaluate = isSelectionOnly ? selectedCount : totalOrdersCount;
  const isKeywordValid = confirmText.trim().toUpperCase() === 'ELIMINAR';

  const handleConfirm = () => {
    if (!isKeywordValid) return;
    onConfirm({ forceProtected });
    setConfirmText('');
    setForceProtected(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isSelectionOnly ? 'Validación de Borrado en Lote' : 'Validación de Borrado Masivo Total'}
              </h3>
              <p className="text-xs text-rose-100 mt-0.5 font-mono">
                Control de Seguridad & Reglas SAP PM
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setConfirmText('');
              setForceProtected(false);
              onClose();
            }}
            className="text-rose-100 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">
                ¡Esta es una acción crítica irreversible!
              </p>
              <p>
                Se evaluará la eliminación de <strong className="font-mono font-bold text-rose-700 dark:text-rose-300">{countToEvaluate}</strong> Órdenes de Trabajo de la base de datos de mantenimiento.
              </p>
            </div>
          </div>

          {/* SAP Protection Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Diagnóstico de Reglas SAP PM:</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">OTs Creadas (CRTE):</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{crteCount}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Eliminables</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block">En Proceso / TECO:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{protectedCount}</span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">🛡️ Protegidas SAP</span>
              </div>
            </div>
          </div>

          {/* Optional Checkbox for Force Protected (Admins) */}
          {protectedCount > 0 && (
            <label className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={forceProtected}
                onChange={(e) => setForceProtected(e.target.checked)}
                className="rounded border-amber-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                Forzar eliminación de OTs protegidas (REL, PCNF, TECO)
              </span>
            </label>
          )}

          {/* Verification Code Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Para confirmar, escriba la palabra <strong className="text-rose-600 dark:text-rose-400 uppercase">"ELIMINAR"</strong>:</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escriba ELIMINAR para autorizar"
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={() => {
              setConfirmText('');
              setForceProtected(false);
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!isKeywordValid}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Borrado Masivo</span>
          </button>
        </div>

      </div>
    </div>
  );
};
