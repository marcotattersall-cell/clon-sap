import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateApprovalStrategy,
  createApprovalRequest,
  getPendingApprovals,
  approveTransaction,
  rejectTransaction,
  getApprovalThresholds,
  updateApprovalThresholds,
  getThresholdAuditLogs,
  resetApprovalWorkflowState,
  DEFAULT_APPROVAL_THRESHOLDS
} from '../services/approvalWorkflowService';

describe('⚡ SAP Approval Strategy & Workflow Engine (ME51N / ME21N / MIGO Release)', () => {
  beforeEach(() => {
    resetApprovalWorkflowState();
  });

  describe('1. Dynamic Threshold Evaluation & Default Fallbacks', () => {
    it('debe retornar los umbrales por defecto correctamente', () => {
      const thresholds = getApprovalThresholds('tenant_demo');
      expect(thresholds).toEqual(DEFAULT_APPROVAL_THRESHOLDS);
    });

    it('debe aprobar automáticamente transacciones bajo el umbral financiero', () => {
      const result = evaluateApprovalStrategy({
        type: 'WORK_ORDER',
        totalCost: 8000,
        tenantId: 'tenant_demo'
      });

      expect(result.requiresApproval).toBe(false);
      expect(result.status).toBe('APPROVED');
    });

    it('debe requerir aprobación para transacciones sobre el umbral financiero', () => {
      const result = evaluateApprovalStrategy({
        type: 'WORK_ORDER',
        totalCost: 15000,
        tenantId: 'tenant_demo'
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(result.thresholdLimit).toBe(DEFAULT_APPROVAL_THRESHOLDS.workOrder);
    });
  });

  describe('2. Configuración Dinámica de Umbrales por Administrador General (SU01)', () => {
    it('debe denegar la modificación de umbrales a usuarios no administradores', () => {
      const nonAdminUser = { userName: 'Técnico Campo', role: 'FIELD_MECHANIC' };

      expect(() => {
        updateApprovalThresholds('tenant_demo', { workOrder: 2000 }, nonAdminUser);
      }).toThrow(/Acceso denegado/);
    });

    it('debe permitir al Administrador General modificar los umbrales y registrar la auditoría', () => {
      const adminUser = { userName: 'Marco Vidal', role: 'ADMINISTRATOR' };

      const updateResult = updateApprovalThresholds(
        'tenant_demo',
        { workOrder: 2500, migo: 1000 },
        adminUser
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.thresholds.workOrder).toBe(2500);

      // Verificar que las subsiguientes evaluaciones usen el nuevo umbral
      const evalResult = evaluateApprovalStrategy({
        type: 'WORK_ORDER',
        totalCost: 3000,
        tenantId: 'tenant_demo'
      });
      expect(evalResult.requiresApproval).toBe(true);

      // Verificar bitácora de auditoría
      const auditLogs = getThresholdAuditLogs('tenant_demo');
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].modifiedBy).toBe('Marco Vidal');
      expect(auditLogs[0].newThresholds.workOrder).toBe(2500);
    });
  });

  describe('3. Flujo de Solicitud, Aprobación y Rechazo por Rol autorizado', () => {
    it('debe crear una solicitud de aprobación en cola para transacciones retenidas', () => {
      const req = createApprovalRequest({
        type: 'MIGO',
        referenceId: 'MIGO-887766',
        title: 'Salida Repuestos Críticos Chancador',
        totalCost: 7500,
        requestedBy: 'Operador Almacén',
        tenantId: 'tenant_bhp'
      });

      expect(req.status).toBe('PENDING_APPROVAL');

      const pending = getPendingApprovals('tenant_bhp');
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(req.id);
    });

    it('debe permitir la aprobación a usuarios autorizados (MAINTENANCE_MGR / ADMINISTRATOR)', () => {
      const req = createApprovalRequest({
        type: 'WORK_ORDER',
        referenceId: 'WO-990011',
        title: 'Mantención Mayor Caex CAT 797F',
        totalCost: 25000,
        tenantId: 'tenant_codelco'
      });

      const manager = { userName: 'Supervisión PM', role: 'MAINTENANCE_MGR' };
      const approved = approveTransaction(req.id, manager, 'Liberación autorizada según presupuesto Q3');

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('Supervisión PM');

      const pending = getPendingApprovals('tenant_codelco');
      expect(pending.length).toBe(0);
    });

    it('debe denegar la aprobación a roles no autorizados', () => {
      const req = createApprovalRequest({
        type: 'PURCHASE_ORDER',
        referenceId: 'PO-332211',
        title: 'Compra Neumáticos Mineros',
        totalCost: 45000,
        tenantId: 'tenant_collahuasi'
      });

      const mechanic = { userName: 'Mecánico 1', role: 'FIELD_MECHANIC' };

      expect(() => {
        approveTransaction(req.id, mechanic);
      }).toThrow(/Acceso denegado/);
    });

    it('debe rechazar solicitudes correctamente registrando el motivo', () => {
      const req = createApprovalRequest({
        type: 'WORK_ORDER',
        referenceId: 'WO-554433',
        title: 'Reparación Imprevista Motor',
        totalCost: 18000,
        tenantId: 'tenant_bhp'
      });

      const admin = { userName: 'Administrador', role: 'ADMINISTRATOR' };
      const rejected = rejectTransaction(req.id, admin, 'Excede presupuesto disponible para la planta');

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('Excede presupuesto disponible para la planta');
    });
  });

  describe('4. Aislamiento Multi-Tenant de Solicitudes de Aprobación', () => {
    it('no debe mezclar solicitudes entre distintas empresas mineras', () => {
      createApprovalRequest({
        type: 'MIGO',
        referenceId: 'MIGO-BHP-01',
        title: 'Salida BHP',
        totalCost: 9000,
        tenantId: 'tenant_bhp'
      });

      createApprovalRequest({
        type: 'WORK_ORDER',
        referenceId: 'WO-CODELCO-01',
        title: 'OT Codelco',
        totalCost: 15000,
        tenantId: 'tenant_codelco'
      });

      const bhpPending = getPendingApprovals('tenant_bhp');
      const codelcoPending = getPendingApprovals('tenant_codelco');

      expect(bhpPending.length).toBe(1);
      expect(bhpPending[0].referenceId).toBe('MIGO-BHP-01');

      expect(codelcoPending.length).toBe(1);
      expect(codelcoPending[0].referenceId).toBe('WO-CODELCO-01');
    });
  });
});
