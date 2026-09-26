import { describe, it, expect, beforeEach } from 'vitest';
import {
  getApprovalThresholds,
  updateApprovalThresholds,
  evaluateApprovalStrategy,
  createApprovalRequest,
  getPendingApprovals,
  approveTransaction,
  rejectTransaction,
  resetApprovalWorkflowState
} from '../services/approvalWorkflowService';

import {
  processIoTTelemetry
} from '../services/iotIngestionService';

import {
  predictMaterialDemand
} from '../services/materialDemandForecastingService';

import {
  validateChileanRUT,
  formatChileanRUT
} from '../utils/rutUtils';

describe('⚡ Pruebas de Integración Sin Mocks — Motor de Negocio ERP Real (Zero Mocks)', () => {
  const TENANT_ID = 'tenant_antofagasta_minera';

  beforeEach(() => {
    // Reiniciar estado real en memoria sin reemplazar funciones por mocks
    resetApprovalWorkflowState();
  });

  it('1. Debe ejecutar la configuración de umbrales financieros evaluando reglas RBAC reales', () => {
    // Usuario con rol FIELD_MECHANIC intenta modificar umbrales (RBAC real sin mocks)
    const mechanicUser = { userName: 'juan_tecnico', role: 'FIELD_MECHANIC' };
    expect(() => {
      updateApprovalThresholds(TENANT_ID, { workOrder: 8000 }, mechanicUser);
    }).toThrow(/Acceso denegado/);

    // Usuario con rol ADMINISTRATOR autoriza la actualización real de umbrales
    const adminUser = { userName: 'admin_su01', role: 'ADMINISTRATOR' };
    const result = updateApprovalThresholds(
      TENANT_ID,
      { migo: 3000, workOrder: 12000, purchaseOrder: 20000 },
      adminUser
    );

    expect(result.success).toBe(true);
    expect(result.thresholds).toEqual({ migo: 3000, workOrder: 12000, purchaseOrder: 20000 });
    expect(result.auditEntry.modifiedBy).toBe('admin_su01');

    // Verificar que la memoria en vivo del motor de aprobaciones refleja los nuevos valores
    const liveThresholds = getApprovalThresholds(TENANT_ID);
    expect(liveThresholds.workOrder).toBe(12000);
    expect(liveThresholds.migo).toBe(3000);
  });

  it('2. Debe procesar el ciclo de vida completo de una Orden de Trabajo (IW31) con estrategia de aprobación real', () => {
    // 1. Configurar umbrales con Administrador
    const adminUser = { userName: 'jefe_sistema', role: 'ADMINISTRATOR' };
    updateApprovalThresholds(TENANT_ID, { workOrder: 15000 }, adminUser);

    // 2. Evaluar costo de Orden de Trabajo ($25,000 USD)
    const woCost = 25000;
    const strategy = evaluateApprovalStrategy({
      type: 'WORK_ORDER',
      totalCost: woCost,
      tenantId: TENANT_ID
    });

    expect(strategy.requiresApproval).toBe(true);
    expect(strategy.status).toBe('PENDING_APPROVAL');

    // 3. Crear solicitud de aprobación en vivo
    const req = createApprovalRequest({
      type: 'WORK_ORDER',
      referenceId: 'OT-2026-9912',
      title: 'Mantenimiento Mayor Chancador Secundario',
      totalCost: woCost,
      requestedBy: 'Jefe Mantenimiento PM',
      tenantId: TENANT_ID,
      details: { component: 'CHANCADOR_SEC_01' }
    });

    expect(req.id).toMatch(/^REQ-APP-/);
    expect(req.status).toBe('PENDING_APPROVAL');

    // 4. Comprobar presencia en la bandeja de aprobación del tenant
    const pendingList = getPendingApprovals(TENANT_ID);
    expect(pendingList.length).toBe(1);
    expect(pendingList[0].referenceId).toBe('OT-2026-9912');

    // 5. Intento de aprobación por rol sin permisos suficientes (FIELD_MECHANIC)
    const mechanic = { userName: 'pedro_tecnico', role: 'FIELD_MECHANIC' };
    expect(() => {
      approveTransaction(req.id, mechanic, 'Aprobación no autorizada');
    }).toThrow(/Acceso denegado/);

    // 6. Aprobación exitosa por Gerente de Mantenimiento (MAINTENANCE_MGR)
    const manager = { userName: 'gerente_pm', role: 'MAINTENANCE_MGR' };
    const approvedReq = approveTransaction(req.id, manager, 'Aprobación presupuestaria verificada en SAP');

    expect(approvedReq.status).toBe('APPROVED');
    expect(approvedReq.approvedBy).toBe('gerente_pm');

    // 7. La cola de pendientes del tenant debe quedar vacía
    expect(getPendingApprovals(TENANT_ID).length).toBe(0);
  });

  it('3. Debe procesar rechazos de transacciones y almacenar el motivo en la auditoría', () => {
    const req = createApprovalRequest({
      type: 'PURCHASE_ORDER',
      referenceId: 'PO-88301',
      title: 'Compra de Motores Eléctricos 500HP',
      totalCost: 50000,
      requestedBy: 'Encargado Adquisiciones',
      tenantId: TENANT_ID
    });

    expect(req.status).toBe('PENDING_APPROVAL');

    const manager = { userName: 'gerente_ops', role: 'MAINTENANCE_MGR' };
    const rejectedReq = rejectTransaction(req.id, manager, 'Monto excede presupuesto asignado al Q3');

    expect(rejectedReq.status).toBe('REJECTED');
    expect(rejectedReq.rejectedBy).toBe('gerente_ops');
    expect(rejectedReq.rejectionReason).toBe('Monto excede presupuesto asignado al Q3');
  });

  it('4. Debe procesar la ingesta de telemetría IoT y recalcular pronóstico de demanda de repuestos sin mocks', async () => {
    // Activo industrial registrado en el maestro
    const existingAsset = {
      id: 'EQUIP-CH-01',
      name: 'Chancador Primario de Quijada',
      hourmeter: 1000,
      odometer: 5000,
      healthScore: 95,
      status: 'OPERATIVE'
    };

    // Telemetría con sobrecalentamiento (105°C) y vibración crítica (8.5 mm/s)
    const telemetryPayload = {
      equipmentId: 'EQUIP-CH-01',
      hourmeter: 1008,
      engineTemp: 105,
      vibrationRms: 8.5,
      healthScore: 65
    };

    const iotResult = await processIoTTelemetry(telemetryPayload, [existingAsset], true);

    expect(iotResult.success).toBe(true);
    expect(iotResult.triggeredAlert).toBe(true);
    expect(iotResult.updatedAsset.status).toBe('MAINTENANCE');
    expect(iotResult.updatedAsset.hourmeter).toBe(1008);

    // Integrar consumo histórico MIGO 261 para el material
    const materialData = {
      id: 'MAT-1002',
      name: 'Aceite Sintético Multigrado 15W40',
      stock: 15,
      reorderPoint: 20,
      leadTimeDays: 14
    };

    const migoDocs = [
      { materialId: 'MAT-1002', movementType: '261', quantity: 10 },
      { materialId: 'MAT-1002', movementType: '261', quantity: 15 },
      { materialId: 'MAT-1002', movementType: '261', quantity: 12 }
    ];

    const forecast = predictMaterialDemand(materialData, migoDocs);
    expect(forecast.projectedDemand30d).toBeGreaterThan(0);
    expect(forecast.suggestedSafetyStock).toBeGreaterThan(0);
    expect(forecast.suggestedReorderPoint).toBeGreaterThan(forecast.suggestedSafetyStock);
    expect(forecast.confidenceScore).toBe(94);
  });

  it('5. Debe ejecutar la validación real del algoritmo Módulo 11 para RUT chileno', () => {
    // Validar RUT real válido (76.192.140-1)
    const rutCheck = validateChileanRUT('76.192.140-1');
    expect(rutCheck.isValid).toBe(true);
    expect(rutCheck.formattedRUT).toBe('76.192.140-1');

    // Probar formateo dinámico desde texto sin puntos
    const formatted = formatChileanRUT('761921401');
    expect(formatted).toBe('76.192.140-1');

    // Probar rechazo de RUT inválido
    const invalidCheck = validateChileanRUT('12.345.678-0');
    expect(invalidCheck.isValid).toBe(false);
    expect(invalidCheck.error).toBe('RUT Inválido');
  });
});
