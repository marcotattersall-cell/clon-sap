/**
 * ⚡ OPERAM ERP ENTERPRISE — MOTOR DE ESTRATEGIA DE APROBACIONES & WORKFLOWS
 * (SAP Approval Strategy Engine — ME51N / ME21N / MIGO / OT Release)
 * 
 * Gestiona la evaluación dinámica de umbrales financieros, solicitudes de liberación,
 * firma digital por rol y configuración exclusiva por el Administrador General (SU01).
 */

import { hasPermission } from '../utils/rbacRules';

// Umbrales Financieros por Defecto ($ USD)
export const DEFAULT_APPROVAL_THRESHOLDS = {
  migo: 5000,          // Salidas de Almacén MIGO (261 / 101) > $5,000 USD
  workOrder: 10000,    // Órdenes de Trabajo (IW31 / PM02) > $10,000 USD
  purchaseOrder: 15000 // Pedidos de Compra (PO / ME21N) > $15,000 USD
};

// Almacén en Memoria / Estado Local por Tenant
let tenantThresholdsStore = {};
let approvalRequestsQueue = [];
let thresholdAuditLogs = [];

/**
 * Obtiene los umbrales financieros vigentes para un tenant específico.
 */
export const getApprovalThresholds = (tenantId = 'tenant_demo') => {
  if (!tenantThresholdsStore[tenantId]) {
    tenantThresholdsStore[tenantId] = { ...DEFAULT_APPROVAL_THRESHOLDS };
  }
  return { ...tenantThresholdsStore[tenantId] };
};

/**
 * Actualiza los umbrales financieros de un tenant.
 * ⚠️ EXCLUSIVO PARA ADMINISTRADOR GENERAL (SU01 / ADMINISTRATOR)
 */
export const updateApprovalThresholds = (tenantId, newThresholds, user) => {
  const userRole = user?.role || user;
  
  if (!hasPermission(userRole, 'WORKFLOW_CONFIG_THRESHOLDS') && userRole !== 'ADMINISTRATOR') {
    throw new Error('⛔ Acceso denegado: Únicamente el Administrador General (SU01 / ADMINISTRATOR) puede modificar los umbrales financieros.');
  }

  const current = getApprovalThresholds(tenantId);
  const updated = {
    migo: Number(newThresholds.migo ?? current.migo),
    workOrder: Number(newThresholds.workOrder ?? current.workOrder),
    purchaseOrder: Number(newThresholds.purchaseOrder ?? current.purchaseOrder)
  };

  tenantThresholdsStore[tenantId] = updated;

  // Registrar auditoría inmutable
  const auditEntry = {
    id: `AUD-THRESH-${Date.now()}`,
    tenantId,
    modifiedBy: user?.userName || user?.name || userRole || 'ADMINISTRATOR',
    userRole,
    previousThresholds: current,
    newThresholds: updated,
    timestamp: new Date().toISOString()
  };

  thresholdAuditLogs.push(auditEntry);

  return { success: true, thresholds: updated, auditEntry };
};

/**
 * Evalúa si una transacción requiere estrategia de aprobación previa según el monto y tipo.
 */
export const evaluateApprovalStrategy = ({ type, totalCost, tenantId = 'tenant_demo' }) => {
  const thresholds = getApprovalThresholds(tenantId);
  const cost = Number(totalCost) || 0;
  let thresholdLimit = 0;

  switch (type) {
    case 'MIGO':
    case 'migo':
      thresholdLimit = thresholds.migo;
      break;
    case 'WORK_ORDER':
    case 'workOrder':
    case 'IW31':
      thresholdLimit = thresholds.workOrder;
      break;
    case 'PURCHASE_ORDER':
    case 'purchaseOrder':
    case 'PO':
      thresholdLimit = thresholds.purchaseOrder;
      break;
    default:
      thresholdLimit = thresholds.migo;
  }

  const requiresApproval = cost > thresholdLimit;

  return {
    requiresApproval,
    thresholdLimit,
    amount: cost,
    status: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED'
  };
};

/**
 * Registra una nueva solicitud de aprobación en la cola de trabajo (Worklist ME28).
 */
export const createApprovalRequest = ({
  type,
  referenceId,
  title,
  totalCost,
  requestedBy = 'Operador ERP',
  tenantId = 'tenant_demo',
  details = {}
}) => {
  const evaluation = evaluateApprovalStrategy({ type, totalCost, tenantId });

  const newRequest = {
    id: `REQ-APP-${Math.floor(100000 + Math.random() * 900000)}`,
    type,
    referenceId,
    title,
    totalCost: Number(totalCost) || 0,
    thresholdLimit: evaluation.thresholdLimit,
    requestedBy,
    tenantId,
    status: evaluation.status,
    requestedAt: new Date().toISOString(),
    details
  };

  if (evaluation.requiresApproval) {
    approvalRequestsQueue.push(newRequest);
  }

  return newRequest;
};

/**
 * Obtiene todas las solicitudes pendientes de liberación filtradas por tenant.
 */
export const getPendingApprovals = (tenantId = 'tenant_demo') => {
  return approvalRequestsQueue.filter(
    req => req.tenantId === tenantId && req.status === 'PENDING_APPROVAL'
  );
};

/**
 * Aprueba y libera una transacción retenida.
 */
export const approveTransaction = (requestId, user, comments = 'Aprobado según norma SAP') => {
  const userRole = user?.role || user;
  
  if (!hasPermission(userRole, 'WORKFLOW_APPROVE_HIGH_VALUE')) {
    throw new Error('⛔ Acceso denegado: El rol actual no tiene atribución para aprobar transacciones de alto valor.');
  }

  const req = approvalRequestsQueue.find(r => r.id === requestId);
  if (!req) {
    throw new Error(`Solicitud de aprobación no encontrada: ${requestId}`);
  }

  req.status = 'APPROVED';
  req.approvedBy = user?.userName || user?.name || userRole;
  req.approvedRole = userRole;
  req.approvedAt = new Date().toISOString();
  req.approvalComments = comments;

  return req;
};

/**
 * Rechaza una solicitud de transacción de alto valor.
 */
export const rejectTransaction = (requestId, user, reason = 'Monto no autorizado') => {
  const userRole = user?.role || user;
  
  if (!hasPermission(userRole, 'WORKFLOW_APPROVE_HIGH_VALUE')) {
    throw new Error('⛔ Acceso denegado: El rol actual no tiene atribución para rechazar solicitudes de aprobación.');
  }

  const req = approvalRequestsQueue.find(r => r.id === requestId);
  if (!req) {
    throw new Error(`Solicitud de aprobación no encontrada: ${requestId}`);
  }

  req.status = 'REJECTED';
  req.rejectedBy = user?.userName || user?.name || userRole;
  req.rejectedRole = userRole;
  req.rejectedAt = new Date().toISOString();
  req.rejectionReason = reason;

  return req;
};

/**
 * Obtiene el historial de auditoría de modificaciones de umbrales.
 */
export const getThresholdAuditLogs = (tenantId = null) => {
  if (tenantId) {
    return thresholdAuditLogs.filter(l => l.tenantId === tenantId);
  }
  return [...thresholdAuditLogs];
};

/**
 * Helper para reiniciar estado (útil en pruebas unitarias).
 */
export const resetApprovalWorkflowState = () => {
  tenantThresholdsStore = {};
  approvalRequestsQueue = [];
  thresholdAuditLogs = [];
};
