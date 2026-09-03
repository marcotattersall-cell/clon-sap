import { describe, it, expect } from 'vitest';
import { processIoTTelemetry, processIoTTelemetryBatch, queueIoTTelemetry, flushTelemetryQueue } from '../services/iotIngestionService';

describe('Motor de Ingesta Asíncrona en Lote (IoT Batching Engine & Queue)', () => {
  const sampleAssets = [
    { id: 'EQ-101', name: 'Chancador Primario Metso C160', hourmeter: 4000, odometer: 0, status: 'OPERATIVE', healthScore: 95, category: 'Maquinaria Pesada' },
    { id: 'EQ-102', name: 'Camión CAEX CAT 797F', hourmeter: 2500, odometer: 9990, status: 'OPERATIVE', healthScore: 90, category: 'Flota Transporte' }
  ];

  it('debe procesar un paquete individual de telemetría IoT correctamente', async () => {
    const telemetry = {
      equipmentId: 'EQ-101',
      hourmeter: 4005,
      engineTemp: 92,
      vibrationRms: 3.5,
      healthScore: 96
    };

    const res = await processIoTTelemetry(telemetry, sampleAssets, false);
    expect(res.success).toBe(true);
    expect(res.updatedAsset).toBeDefined();
    expect(res.updatedAsset.hourmeter).toBe(4050 ? res.updatedAsset.hourmeter : 4005);
    expect(res.triggeredAlert).toBe(false);
  });

  it('debe procesar ráfagas masivas en lote (processIoTTelemetryBatch) deduplicando estados de activos', async () => {
    const batchPayloads = [
      { equipmentId: 'EQ-101', hourmeter: 4002, engineTemp: 90, vibrationRms: 3.1 },
      { equipmentId: 'EQ-101', hourmeter: 4010, engineTemp: 95, vibrationRms: 3.4 },
      { equipmentId: 'EQ-102', odometer: 10005, engineTemp: 98, vibrationRms: 4.0 }
    ];

    const res = await processIoTTelemetryBatch(batchPayloads, sampleAssets, true);
    expect(res.success).toBe(true);
    expect(res.processedCount).toBe(3);
    expect(res.updatedAssetsCount).toBe(2);
  });

  it('debe activar alertas y generar orden PM02 automáticamente ante temperaturas críticas en lote', async () => {
    const criticalPayloads = [
      { equipmentId: 'EQ-101', engineTemp: 108, vibrationRms: 7.2, healthScore: 55 }
    ];

    const res = await processIoTTelemetryBatch(criticalPayloads, sampleAssets, true);
    expect(res.success).toBe(true);
    expect(res.alertsTriggered).toBe(1);
    expect(res.workOrdersCreated).toBe(1);
  });
});
