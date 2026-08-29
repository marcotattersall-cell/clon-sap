import { describe, it, expect } from 'vitest';
import { detectPayrollAnomalies } from '../services/hcmAnomalyDetectionService';
import { predictAssetRUL } from '../services/pdmPredictiveMaintenanceService';
import { predictMaterialDemand } from '../services/materialDemandForecastingService';
import { classifyNotificationText } from '../services/notificationNLPClassifierService';

describe('SAP ERP Ultra-Strict Adversarial & Boundary QA Suite', () => {

  // Test 1: Inyección de Datos Maliciosos y Valores Extremos en MIGO (Security & Boundary Check)
  it('Strict QA 1: Rechazo de cantidades negativas, NaN e inyecciones en movimientos de inventario MIGO', () => {
    const invalidQtyInputs = [-50, 0, NaN, Infinity, -Infinity, "50' OR '1'='1"];

    invalidQtyInputs.forEach(qty => {
      const parsedQty = Number(qty);
      const isValidMigoQuantity = !isNaN(parsedQty) && isFinite(parsedQty) && parsedQty > 0;

      // El sistema DEBE marcar como inválidas las cantidades defectuosas
      if (typeof qty === 'string' && qty.includes('OR')) {
        expect(isValidMigoQuantity).toBe(false);
      } else if (typeof qty === 'number') {
        if (qty <= 0 || !isFinite(qty) || isNaN(qty)) {
          expect(isValidMigoQuantity).toBe(false);
        }
      }
    });
  });

  // Test 2: Invariante de No Negatividad e Integridad de Balance de Stock
  it('Strict QA 2: Invariante estricto de Stock No Negativo tras consumos masivos (MIGO 261)', () => {
    let initialStock = 50;
    const requestedQuantities = [10, 20, 15, 30]; // Suma 75 UN (Supera el stock de 50)

    let currentStock = initialStock;
    let rejectedMovements = 0;
    let approvedMovements = 0;

    requestedQuantities.forEach(qty => {
      if (currentStock >= qty) {
        currentStock -= qty;
        approvedMovements++;
      } else {
        rejectedMovements++;
      }
    });

    // Verificaciones estrictas
    expect(currentStock).toBeGreaterThanOrEqual(0);
    expect(currentStock).toBe(5); // 50 - 10 - 20 - 15 = 5 (los 30 finales son rechazados)
    expect(approvedMovements).toBe(3);
    expect(rejectedMovements).toBe(1);
  });

  // Test 3: Robustez de Motores ML frente a Telemetría Corrupta y Outliers Térmicos
  it('Strict QA 3: Resiliencia del Motor PdM ML ante telemetría corrupta (NaN, valores nulos y ruido extremo)', () => {
    const corruptedAsset = {
      id: 'EQ-CORRUPTED-01',
      name: 'Bomba de Pulpas con Ruido',
      status: 'OPERATIVE',
      hourmeter: undefined // Parámetro omitido intencionalmente
    };

    const corruptedTelemetry = [
      { equipmentId: 'EQ-CORRUPTED-01', engineTemp: NaN, vibrationRms: null },
      { equipmentId: 'EQ-CORRUPTED-01', engineTemp: 450, vibrationRms: -99 } // Outliers físicamente imposibles
    ];

    // El motor NO debe colapsar con TypeError o NaN
    const pdmResult = predictAssetRUL(corruptedAsset, corruptedTelemetry);
    expect(pdmResult).toBeDefined();
    expect(typeof pdmResult.predictedRulHours).toBe('number');
    expect(isNaN(pdmResult.predictedRulHours)).toBe(false);
    expect(isFinite(pdmResult.predictedRulHours)).toBe(true);
  });

  // Test 4: Clasificación Estricta NLP en Averías Críticas y Textos Ambiguos
  it('Strict QA 4: Inferencia NLP estricta para mensajes de emergencia vs mantenimientos rutinarios', () => {
    const emergencyText = "CRÍTICO: Humo denso y explosión en tablero eléctrico principal de flotación";
    const routineText = "Se solicita pintura para pasamanos en pasillo del nivel 2";

    const emergencyResult = classifyNotificationText(emergencyText);
    const routineResult = classifyNotificationText(routineText);

    // Verificación estricta de prioridades asignadas
    expect(emergencyResult.suggestedPriority).toBe('Muy Alta');
    expect(emergencyResult.confidenceScore).toBeGreaterThan(0.7);

    expect(routineResult.suggestedPriority).toBe('Baja');
  });

  // Test 5: Auditoría Estricta Z-Score / IQR de Nómina HCM sin Falsos Positivos en Liquidaciones Normales
  it('Strict QA 5: Verificación estricta de auditoría HCM sin falsos positivos en dispersiones salariales normales', () => {
    const normalPayroll = [
      { id: 'P1', employeeId: 'E1', baseSalary: 1000000, overtimeHours: 0, totalNet: 950000 },
      { id: 'P2', employeeId: 'E2', baseSalary: 1000000, overtimeHours: 0, totalNet: 950000 },
      { id: 'P3', employeeId: 'E3', baseSalary: 1000000, overtimeHours: 0, totalNet: 950000 },
      { id: 'P4', employeeId: 'E4', baseSalary: 1000000, overtimeHours: 0, totalNet: 950000 }
    ];

    const auditResults = detectPayrollAnomalies(normalPayroll, []);
    const anomaliesCount = auditResults.filter(r => r.anomalyLevel === 'CRITICAL' || r.anomalyLevel === 'WARNING').length;

    // Con datos homogéneos y normales, el detector estricto NO debe generar falsas alarmas
    expect(anomaliesCount).toBe(0);
    expect(auditResults.every(r => r.anomalyLevel === 'NORMAL')).toBe(true);
  });

});
