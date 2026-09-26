import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateApprovalThresholds,
  evaluateApprovalStrategy,
  approveTransaction,
  rejectTransaction,
  resetApprovalWorkflowState
} from '../services/approvalWorkflowService';

import {
  processIoTTelemetry,
  processIoTTelemetryBatch
} from '../services/iotIngestionService';

import {
  predictMaterialDemand,
  forecastCatalogDemand
} from '../services/materialDemandForecastingService';

import {
  validateChileanRUT,
  cleanRUT
} from '../utils/rutUtils';

import {
  hasPermission
} from '../utils/rbacRules';

describe('🛑 Suite de Casos Erróneos y Adversarios (Negative & Edge Cases Test Suite)', () => {
  const TENANT_ID = 'tenant_adversarial_test';

  beforeEach(() => {
    resetApprovalWorkflowState();
  });

  describe('1. Errores de Permisos y Violaciones de Matriz RBAC', () => {
    it('debe rechazar a roles no autorizados al intentar modificar umbrales financieros', () => {
      const unauthorizedRoles = ['FIELD_MECHANIC', 'WAREHOUSE_KEEPER', 'TECHNICIAN', 'OPERATOR'];

      unauthorizedRoles.forEach(role => {
        const user = { userName: `user_${role}`, role };
        expect(() => {
          updateApprovalThresholds(TENANT_ID, { workOrder: 5000 }, user);
        }, `El rol ${role} no debería tener permiso para cambiar umbrales`).toThrow(/Acceso denegado/);
      });
    });

    it('debe denegar la aprobación de transacciones de alto valor a usuarios sin permiso WORKFLOW_APPROVE_HIGH_VALUE', () => {
      const mechanicUser = { userName: 'mecanico_01', role: 'FIELD_MECHANIC' };
      
      expect(() => {
        approveTransaction('REQ-APP-999999', mechanicUser, 'Intento de aprobación');
      }).toThrow(/Acceso denegado/);
    });

    it('debe denegar el rechazo de transacciones a usuarios no autorizados', () => {
      const mechanicUser = { userName: 'mecanico_01', role: 'FIELD_MECHANIC' };

      expect(() => {
        rejectTransaction('REQ-APP-999999', mechanicUser, 'Intento de rechazo');
      }).toThrow(/Acceso denegado/);
    });

    it('debe retornar false al consultar permisos inexistentes o roles nulos en hasPermission', () => {
      expect(hasPermission(null, 'PM_CREATE_ORDER')).toBe(false);
      expect(hasPermission('UNKNOWN_ROLE', 'PM_CREATE_ORDER')).toBe(false);
      expect(hasPermission('FIELD_MECHANIC', 'NON_EXISTENT_PERMISSION')).toBe(false);
    });
  });

  describe('2. Identificadores Inexistentes y Transacciones Malformadas', () => {
    it('debe lanzar error al intentar aprobar una solicitud con ID inexistente', () => {
      const managerUser = { userName: 'gerente_pm', role: 'MAINTENANCE_MGR' };

      expect(() => {
        approveTransaction('REQ-NON-EXISTENT-ID', managerUser);
      }).toThrow(/Solicitud de aprobación no encontrada/);
    });

    it('debe lanzar error al intentar rechazar una solicitud con ID inexistente', () => {
      const managerUser = { userName: 'gerente_pm', role: 'MAINTENANCE_MGR' };

      expect(() => {
        rejectTransaction('REQ-NON-EXISTENT-ID', managerUser);
      }).toThrow(/Solicitud de aprobación no encontrada/);
    });

    it('debe manejar costos negativos o alfanuméricos en la evaluación de estrategias financieras', () => {
      const negativeResult = evaluateApprovalStrategy({ type: 'WORK_ORDER', totalCost: -5000, tenantId: TENANT_ID });
      expect(negativeResult.amount).toBe(-5000);
      expect(negativeResult.requiresApproval).toBe(false);

      const invalidCostResult = evaluateApprovalStrategy({ type: 'WORK_ORDER', totalCost: 'INVALID_COST', tenantId: TENANT_ID });
      expect(invalidCostResult.amount).toBe(0);
      expect(invalidCostResult.requiresApproval).toBe(false);
    });
  });

  describe('3. Entrada de Datos Malformados en RUT Chileno y Validaciones', () => {
    it('debe rechazar cadenas de RUT nulas, vacías o con formato incorrecto', () => {
      expect(validateChileanRUT('').isValid).toBe(false);
      expect(validateChileanRUT(null).isValid).toBe(false);
      expect(validateChileanRUT(undefined).isValid).toBe(false);
      expect(validateChileanRUT('123').isValid).toBe(false);
      expect(validateChileanRUT('12.345.678-0').isValid).toBe(false); // DV matemáticamente incorrecto
      expect(validateChileanRUT('ABCDEFGH-K').isValid).toBe(false);
    });

    it('debe retornar cadena vacía al limpiar RUTs no válidos', () => {
      expect(cleanRUT(null)).toBe('');
      expect(cleanRUT(undefined)).toBe('');
      expect(cleanRUT(12345678)).toBe('');
    });
  });

  describe('4. Excepciones en Ingesta de Telemetría IoT y Dispositivos Desconocidos', () => {
    it('debe retornar respuesta de error amigable cuando se envía telemetría para un activo inexistente', async () => {
      const unknownPayload = {
        equipmentId: 'EQUIP-DESCONOCIDO-99',
        hourmeter: 500,
        engineTemp: 110
      };

      const result = await processIoTTelemetry(unknownPayload, [], true);

      expect(result.success).toBe(false);
      expect(result.updatedAsset).toBeNull();
      expect(result.message).toContain('no registrado en el Maestro');
    });

    it('debe manejar lotes de telemetría IoT vacíos o nulos sin lanzar excepciones', async () => {
      const emptyResult = await processIoTTelemetryBatch([], [], true);
      expect(emptyResult.success).toBe(true);
      expect(emptyResult.processedCount).toBe(0);

      const nullResult = await processIoTTelemetryBatch(null, null, true);
      expect(nullResult.success).toBe(true);
      expect(nullResult.processedCount).toBe(0);
    });
  });

  describe('5. Quiebres de Stock e Inconsistencias en Pronóstico de Demanda ML', () => {
    it('debe clasificar el riesgo como CRITICAL cuando el stock actual está bajo el stock de seguridad', () => {
      const depletedMaterial = {
        id: 'MAT-CRITICAL-01',
        name: 'Filtro Hidráulico Agotado',
        stock: 2, // Stock 2 UN (Bajo el stock de seguridad de 7 UN)
        reorderPoint: 20,
        leadTimeDays: 14
      };

      const forecast = predictMaterialDemand(depletedMaterial, []);

      expect(forecast.stockoutRisk).toBe('CRITICAL');
      expect(forecast.purchaseRecommendation).toContain('RIESGO DE QUIEBRE INMINENTE');
    });

    it('debe manejar catálogos vacíos en forecastCatalogDemand sin fallar', () => {
      expect(forecastCatalogDemand([], [])).toEqual([]);
      expect(forecastCatalogDemand(null, null)).toEqual([]);
    });
  });
});
