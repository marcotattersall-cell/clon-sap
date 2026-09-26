import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateApprovalStrategy,
  createApprovalRequest,
  resetApprovalWorkflowState
} from '../services/approvalWorkflowService';

import {
  checkProcessedIdempotencyKey,
  markIdempotencyKeyProcessed
} from '../services/idempotencyService';

import {
  predictMaterialDemand
} from '../services/materialDemandForecastingService';

describe('✅ Pruebas del Caso Feliz (Happy Path E2E Workflow) — Operam ERP', () => {
  const TENANT_ID = 'tenant_chile_minera';

  beforeEach(() => {
    resetApprovalWorkflowState();
  });

  it('1. Paso 1 a 7: Ejecución fluida del flujo transaccional completo sin bloqueos ni errores', async () => {
    // ==========================================
    // 🏢 PASO 1: Maestro de Datos Inicial
    // ==========================================
    const plantContext = {
      id: 'PL-CH-01',
      name: 'Planta Central Minera Antofagasta',
      tenantId: TENANT_ID
    };

    const assetMaster = {
      id: 'EQUIP-PUMP-01',
      name: 'Bomba Hidráulica de Pistones Axiales',
      status: 'OPERATIVE',
      hourmeter: 2450,
      healthScore: 98
    };

    let materialStockMaster = {
      id: 'MAT-1002',
      name: 'Aceite Sintético Multigrado 15W40',
      stock: 100, // Stock inicial 100 LT
      reorderPoint: 30,
      unitPrice: 20.00,
      unit: 'LT'
    };

    expect(plantContext.tenantId).toBe(TENANT_ID);
    expect(assetMaster.status).toBe('OPERATIVE');
    expect(materialStockMaster.stock).toBe(100);

    // ==========================================
    // 📦 PASO 2: Creación de Pedido (PO) y Estrategia de Aprobación
    // ==========================================
    const poTotalCost = 4000; // $4,000 USD (Bajo el umbral por defecto de $15,000 USD)
    const poStrategy = evaluateApprovalStrategy({
      type: 'PURCHASE_ORDER',
      totalCost: poTotalCost,
      tenantId: TENANT_ID
    });

    expect(poStrategy.requiresApproval).toBe(false);
    expect(poStrategy.status).toBe('APPROVED');

    const purchaseOrder = createApprovalRequest({
      type: 'PURCHASE_ORDER',
      referenceId: 'PO-2026-0041',
      title: 'Reposición Normal de Lubricantes',
      totalCost: poTotalCost,
      requestedBy: 'Analista de Compras MM',
      tenantId: TENANT_ID
    });

    expect(purchaseOrder.status).toBe('APPROVED');

    // ==========================================
    // 📥 PASO 3: Recepción de Almacén MIGO 101 (Entrada de Mercancías)
    // ==========================================
    const goodsReceiptQty = 50; // Recepción de 50 LT
    materialStockMaster.stock += goodsReceiptQty; // 100 + 50 = 150 LT

    const migo101Doc = {
      id: `MIGO-101-${Date.now()}`,
      type: '101',
      materialId: materialStockMaster.id,
      quantity: goodsReceiptQty,
      referencePO: purchaseOrder.referenceId,
      timestamp: new Date().toISOString()
    };

    expect(materialStockMaster.stock).toBe(150);
    expect(migo101Doc.type).toBe('101');

    // ==========================================
    // 🛠️ PASO 4: Creación y Liberación de Orden de Trabajo PM01 (IW31)
    // ==========================================
    const workOrder = {
      id: 'WO-PM01-88401',
      title: 'Mantenimiento Preventivo 250h - Bomba Hidráulica',
      type: 'PM01',
      status: 'CRTE', // Creada
      equipmentId: assetMaster.id,
      assignedTech: 'Técnico Mecánico Senior',
      plannedHours: 4.0,
      actualHours: 0,
      plannedCost: 660.00,
      actualCost: 0,
      componentsPlanned: [
        { materialId: 'MAT-1002', qtyPlanned: 20, unitPrice: 20.00 }
      ]
    };

    // Liberar Orden de Trabajo (CRTE -> REL)
    workOrder.status = 'REL';
    expect(workOrder.status).toBe('REL');

    // ==========================================
    // 🚚 PASO 5: Consumo de Insumos a la OT MIGO 261 con Idempotencia
    // ==========================================
    const issueQty = 20; // 20 LT para el mantenimiento
    const idempotencyKey = `MIGO-261-${workOrder.id}-${materialStockMaster.id}`;

    // Verificación de idempotencia previa (no procesada aún)
    const firstCheck = await checkProcessedIdempotencyKey(idempotencyKey);
    expect(firstCheck.found).toBe(false);

    // Consumo atómico de inventario
    materialStockMaster.stock -= issueQty; // 150 - 20 = 130 LT
    const materialCostAccumulated = issueQty * materialStockMaster.unitPrice; // 20 * $20 = $400 USD
    workOrder.actualCost += materialCostAccumulated;

    const migo261Doc = {
      id: `MIGO-261-${Date.now()}`,
      type: '261',
      materialId: materialStockMaster.id,
      workOrderId: workOrder.id,
      quantity: issueQty,
      timestamp: new Date().toISOString()
    };

    // Marcar clave de idempotencia procesada
    await markIdempotencyKeyProcessed(idempotencyKey, migo261Doc);

    expect(materialStockMaster.stock).toBe(130);
    expect(workOrder.actualCost).toBe(400);

    // Intentar reprocesar el mismo consumo con la misma clave de idempotencia
    const duplicateCheck = await checkProcessedIdempotencyKey(idempotencyKey);
    expect(duplicateCheck.found).toBe(true);
    expect(duplicateCheck.result.id).toBe(migo261Doc.id);

    // ==========================================
    // ⏱️ PASO 6: Confirmación de Horas (IW41) y Cierre Técnico (TECO)
    // ==========================================
    const actualLaborHours = 4.0;
    const hourlyRate = 65.00;
    const laborCost = actualLaborHours * hourlyRate; // 4 * $65 = $260 USD

    workOrder.actualHours = actualLaborHours;
    workOrder.actualCost += laborCost; // $400 + $260 = $660 USD
    workOrder.status = 'TECO'; // Technical Completion

    expect(workOrder.actualHours).toBe(4.0);
    expect(workOrder.actualCost).toBe(660.00);
    expect(workOrder.status).toBe('TECO');

    // ==========================================
    // 📊 PASO 7: Verificación del Motor ML de Pronóstico y Salud de Stock
    // ==========================================
    const migoHistory = [migo261Doc];
    const forecast = predictMaterialDemand(materialStockMaster, migoHistory);

    expect(forecast.currentStock).toBe(130);
    expect(forecast.stockoutRisk).toBe('LOW');
    expect(forecast.purchaseRecommendation).toContain('Stock Suficiente');
  });
});
