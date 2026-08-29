import { describe, it, expect } from 'vitest';
import { detectPayrollAnomalies } from '../services/hcmAnomalyDetectionService';
import { predictAssetRUL } from '../services/pdmPredictiveMaintenanceService';
import { predictMaterialDemand } from '../services/materialDemandForecastingService';
import { classifyNotificationText } from '../services/notificationNLPClassifierService';

describe('TestSprite Autonomous QA & End-to-End System Audit (TestSprite Engine)', () => {
  it('E2E TestSprite Case 1: Flujo Transaccional Integrado (IE01 -> IW31 -> MIGO 261 -> ML Audit)', () => {
    const startTime = performance.now();

    // 1. Simulación de Registro de Activo (IE01)
    const newAsset = {
      id: 'EQ-QA-99',
      name: 'Chancador Primario Metso C160',
      category: 'Maquinaria Pesada',
      status: 'OPERATIVE',
      hourmeter: 5200,
      healthScore: 88
    };

    // 2. Inferencia Predictiva ML (Módulo 1 PdM)
    const pdmPrediction = predictAssetRUL(newAsset, [{ equipmentId: newAsset.id, engineTemp: 94, vibrationRms: 3.8 }]);
    expect(pdmPrediction.predictedRulHours).toBeGreaterThan(0);
    expect(pdmPrediction.diagnosis.severity).toBe('NORMAL');

    // 3. Simulación de Orden de Trabajo (IW31)
    const workOrder = {
      id: 'WO-QA-1001',
      equipmentId: newAsset.id,
      type: 'PM01',
      priority: 'Alta',
      status: 'CRTE',
      plannedCost: 450000,
      actualCost: 0
    };

    // 4. Inferencia NLP sobre Falla (Módulo 3 NLP)
    const nlpClassification = classifyNotificationText('Fuga masiva de aceite caliente en cilindro principal con humo');
    expect(nlpClassification.suggestedPriority).toBe('Muy Alta');
    expect(nlpClassification.suggestedComponent).toBe('Sistema Hidráulico');

    // 5. Simulación de Consumo MIGO 261
    const material = { id: 'MAT-QA-10', name: 'Aceite Hidráulico ISO VG 68', stock: 100, reorderPoint: 20, unitPrice: 15000 };
    const demandForecast = predictMaterialDemand(material, [{ materialId: material.id, movementType: '261', quantity: 15 }]);
    expect(demandForecast.projectedDemand30d).toBeGreaterThan(0);

    const endTime = performance.now();
    const durationMs = Number((endTime - startTime).toFixed(3));

    console.log(`\n=== 🧪 TESTSPRITE AUTONOMOUS QA REPORT ===`);
    console.log(`⏱️ Execution Time: ${durationMs} ms`);
    console.log(`✅ Asset Registered: ${newAsset.id} (${newAsset.name})`);
    console.log(`🔮 PdM Inferred RUL: ${pdmPrediction.predictedRulHours} hrs`);
    console.log(`🏷️ NLP Classification: Priority=${nlpClassification.suggestedPriority}, Component=${nlpClassification.suggestedComponent}`);
    console.log(`📦 MM Forecast Demand: ${demandForecast.projectedDemand30d} UN (Lead Time: 14d)`);
    console.log(`===========================================\n`);

    expect(durationMs).toBeLessThan(100);
  });

  it('TestSprite Case 2: Detección Invariante de Anomalías en Liquidaciones HCM (Z-Score > 1.5)', () => {
    const payrollRuns = [
      { id: 'PY-1', employeeId: 'E1', department: 'Operaciones', overtimeHours: 4, baseSalary: 1000000, totalNet: 920000 },
      { id: 'PY-2', employeeId: 'E2', department: 'Operaciones', overtimeHours: 3, baseSalary: 1000000, totalNet: 900000 },
      { id: 'PY-3', employeeId: 'E3', department: 'Operaciones', overtimeHours: 40, baseSalary: 1000000, totalNet: 2100000 }
    ];

    const auditResults = detectPayrollAnomalies(payrollRuns, []);
    const criticalAnomaly = auditResults.find(r => r.id === 'PY-3');

    expect(criticalAnomaly).toBeDefined();
    expect(criticalAnomaly.anomalyLevel).toBe('CRITICAL');
    expect(criticalAnomaly.anomalyScore).toBeGreaterThanOrEqual(50);
  });
});
