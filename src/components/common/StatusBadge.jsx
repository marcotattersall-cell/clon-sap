import React from 'react';

/**
 * StatusBadge - Insignia de estado estandarizada Fiori / SAP ERP
 * 
 * @param {string} status - Código de estado (ej: REL, CRTE, TECO, ACTIVO, ALTA, CRÍTICO)
 * @param {string} [className] - Clases adicionales opcionales
 */
export const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toString().toUpperCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  switch (normalized) {
    case 'REL':
    case 'LIBERADA':
    case 'ACTIVO':
    case 'ALTA':
    case 'APROBADO':
    case 'VIGENTE':
      colorClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      break;

    case 'CRTE':
    case 'CREADA':
    case 'PENDIENTE':
    case 'EN REVISIÓN':
    case 'MEDIA':
      colorClasses = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      break;

    case 'TECO':
    case 'CERRADA':
    case 'COMPLETADA':
    case 'FINALIZADA':
      colorClasses = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      break;

    case 'CRÍTICO':
    case 'MUY ALTA':
    case 'VENCIDO':
    case 'INACTIVO':
    case 'RECHAZADO':
    case 'RECHAZADA':
    case 'INCAPACIDAD':
      colorClasses = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      break;

    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}>
      {status || 'N/A'}
    </span>
  );
};

export default StatusBadge;
