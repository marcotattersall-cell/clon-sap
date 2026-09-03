/**
 * Servicio de Ingesta de Telemetría IoT y Bus CAN (SAE J1939 / Modbus TCP)
 * Procesa ráfagas de sensores industriales en tiempo real para actualizar horómetros,
 * odómetros, guardar series de tiempo (Time-Series) y desencadenar Avisos/Órdenes PM de forma autónoma.
 * Incorpora un Motor de Ingesta Asíncrono en Lote (Batch Ingestion Engine) para prevenir la sobrecarga de la BD.
 */

import { upsertDocument, getCollectionDocs } from './dbService';
import { updateVectorClock } from './crdtSyncService';

/**
 * Buffer en memoria para encolado asíncrono de lecturas IoT
 */
let telemetryIngestionQueue = [];
let queueFlushTimer = null;
const QUEUE_FLUSH_INTERVAL_MS = 1500;
const MAX_QUEUE_BATCH_SIZE = 20;

/**
 * Procesa una ráfaga o lote de telemetrías IoT (Batch Processing Engine)
 * Consolida múltiples lecturas por equipo y persiste en lote (Bulk Upsert Async).
 *
 * @param {Array<Object>} telemetryBatch Lote de paquetes de telemetría
 * @param {Array<Object>} existingAssets Lista actual de activos
 * @param {boolean} [autoCreateWO=true] Si debe crear automáticamente la Orden PM02 ante anomalías
 * @returns {Promise<{ success: boolean, processedCount: number, updatedAssetsCount: number, alertsTriggered: number, workOrdersCreated: number }>}
 */
export const processIoTTelemetryBatch = async (telemetryBatch = [], existingAssets = [], autoCreateWO = true) => {
  if (!Array.isArray(telemetryBatch) || telemetryBatch.length === 0) {
    return { success: true, processedCount: 0, updatedAssetsCount: 0, alertsTriggered: 0, workOrdersCreated: 0 };
  }

  let alertsTriggered = 0;
  const lastProcessedPerAsset = new Map();
  const logsToPersist = [];
  const workOrdersToCreate = [];

  for (const telemetryPayload of telemetryBatch) {
    const { equipmentId, hourmeter, odometer, healthScore, engineTemp, vibrationRms } = telemetryPayload;
    const baseAsset = lastProcessedPerAsset.get(equipmentId) || existingAssets.find(a => a.id === equipmentId);

    if (!baseAsset) continue;

    const newHourmeter = hourmeter !== undefined ? Math.max(Number(baseAsset.hourmeter || 0), Number(hourmeter)) : baseAsset.hourmeter;
    const newOdometer = odometer !== undefined ? Math.max(Number(baseAsset.odometer || 0), Number(odometer)) : baseAsset.odometer;
    const newHealthScore = healthScore !== undefined ? Number(healthScore) : baseAsset.healthScore;

    let newStatus = baseAsset.status;
    let triggeredAlert = false;
    let alertReason = '';

    const isTransportVehicle = baseAsset.category?.includes('Transporte') || baseAsset.category?.includes('Flota') || baseAsset.category?.includes('Camión');
    const odometerMilestoneReached = isTransportVehicle && odometer !== undefined && (Math.floor(newOdometer / 10000) > Math.floor((baseAsset.odometer || 0) / 10000));
    const hourmeterMilestoneReached = !isTransportVehicle && hourmeter !== undefined && (Math.floor(newHourmeter / 250) > Math.floor((baseAsset.hourmeter || 0) / 250));

    if (engineTemp && Number(engineTemp) > 102) {
      newStatus = 'MAINTENANCE';
      triggeredAlert = true;
      alertReason = `Alerta de Sobrecalentamiento Motor: ${engineTemp}°C (Umbral max: 102°C)`;
    } else if (vibrationRms && Number(vibrationRms) > 6.5) {
      newStatus = 'MAINTENANCE';
      triggeredAlert = true;
      alertReason = `Alerta de Vibración Anormal en Rodamiento: ${vibrationRms} mm/s (Umbral max: 6.5 mm/s)`;
    } else if (newHealthScore < 70) {
      newStatus = 'MAINTENANCE';
      triggeredAlert = true;
      alertReason = `Degradación Crítica de Salud Operativa: ${newHealthScore}%`;
    } else if (odometerMilestoneReached) {
      newStatus = 'OPERATIVE';
      triggeredAlert = true;
      alertReason = `Pauta Preventiva Programada PM01 (Hito 10.000 km alcanzado: ${newOdometer} km)`;
    } else if (hourmeterMilestoneReached) {
      newStatus = 'OPERATIVE';
      triggeredAlert = true;
      alertReason = `Pauta Preventiva Programada PM01 (Hito 250 hrs alcanzado: ${newHourmeter} hrs)`;
    }

    if (triggeredAlert) alertsTriggered++;

    const updatedAsset = updateVectorClock(
      {
        ...baseAsset,
        hourmeter: newHourmeter,
        odometer: newOdometer,
        healthScore: newHealthScore,
        status: newStatus,
        lastIoTTelemetry: {
          timestamp: new Date().toISOString(),
          engineTemp: engineTemp || 92,
          vibrationRms: vibrationRms || 3.8,
          alertReason
        }
      },
      'IOT_GATEWAY_BUS_CAN',
      ['hourmeter', 'odometer', 'healthScore', 'status', 'lastIoTTelemetry']
    );

    lastProcessedPerAsset.set(equipmentId, updatedAsset);

    const logId = `TLOG-${equipmentId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    logsToPersist.push({
      id: logId,
      equipmentId: baseAsset.id,
      timestamp: new Date().toISOString(),
      engineTemp: Number(engineTemp || 92),
      vibrationRms: Number(vibrationRms || 3.8),
      hourmeter: newHourmeter,
      odometer: newOdometer,
      healthScore: newHealthScore,
      alertReason,
      _versionVector: updatedAsset._versionVector
    });

    if (triggeredAlert && autoCreateWO) {
      let suggestedComponents = [];
      if (engineTemp && Number(engineTemp) > 102) {
        suggestedComponents = [
          { materialId: 'MAT-1005', description: 'Sensor de Temperatura y Presión Digital M12', qtyPlanned: 1, qtyIssued: 0, unit: 'UN', unitPrice: 165.00 },
          { materialId: 'MAT-1002', description: 'Aceite Sintético Multigrado 15W40 (Tambor 208L)', qtyPlanned: 1, qtyIssued: 0, unit: 'TBO', unitPrice: 420.00 }
        ];
      } else if (vibrationRms && Number(vibrationRms) > 6.5) {
        suggestedComponents = [
          { materialId: 'MAT-1003', description: 'Bomba Hidráulica de Pistones Axiales Komatsu', qtyPlanned: 1, qtyIssued: 0, unit: 'UN', unitPrice: 3450.00 },
          { materialId: 'MAT-1004', description: 'Correa Mecánica Dentada Industrial V-Belt', qtyPlanned: 2, qtyIssued: 0, unit: 'UN', unitPrice: 24.90 }
        ];
      } else {
        suggestedComponents = [
          { materialId: 'MAT-1001', description: 'Filtro de Aceite Hidráulico CAT H-200', qtyPlanned: 2, qtyIssued: 0, unit: 'UN', unitPrice: 85.50 },
          { materialId: 'MAT-1002', description: 'Aceite Sintético Multigrado 15W40 (Tambor 208L)', qtyPlanned: 1, qtyIssued: 0, unit: 'TBO', unitPrice: 420.00 }
        ];
      }

      const componentTotalCost = suggestedComponents.reduce((sum, c) => sum + (c.qtyPlanned * (c.unitPrice || 0)), 0);
      const plannedHours = 4.0;
      const laborCost = plannedHours * 65.0;
      const totalPlannedCost = Number((laborCost + componentTotalCost).toFixed(2));

      workOrdersToCreate.push({
        id: `WO-IOT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
        title: `[IoT AUTO-TRIGGER] ${alertReason} - ${baseAsset.name}`,
        type: 'PM02',
        priority: 'Muy Alta',
        status: 'CRTE',
        equipmentId: baseAsset.id,
        costCenter: 'CC-4100',
        assignedTech: 'Técnico de Guardia IoT',
        plannedHours,
        actualHours: 0,
        plannedCost: totalPlannedCost,
        actualCost: 0,
        hourmeter: newHourmeter,
        odometer: newOdometer,
        startDate: new Date().toISOString().split('T')[0],
        targetFinishDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        operations: [
          { id: 1, text: `Inspección de sensor y diagnóstico por alerta IoT: ${alertReason}`, duration: 2.0, assigned: 'Técnico de Guardia IoT', status: 'Pending' },
          { id: 2, text: `Reemplazo de componentes y prueba de estanqueidad/operatividad`, duration: 2.0, assigned: 'Técnico de Guardia IoT', status: 'Pending' }
        ],
        components: suggestedComponents,
        logs: [
          { id: `LOG-${Date.now()}`, timestamp: new Date().toLocaleString('es-CL'), user: 'BOT IOT GATEWAY BATCH', previousStatus: 'N/A', newStatus: 'CRTE', text: `Orden generada en lote por telemetría IoT con repuestos MM. Razón: ${alertReason}`, comment: 'Auto-Trigger IoT Batch' }
        ]
      });
    }
  }

  // Persistencia paralela asíncrona en lote
  const assetPromises = Array.from(lastProcessedPerAsset.values()).map(asset => 
    upsertDocument('assets', asset.id, asset, 'IOT_SENSOR_GATEWAY')
  );
  const logPromises = logsToPersist.map(log => 
    upsertDocument('telemetryLogs', log.id, log, 'IOT_SENSOR_GATEWAY')
  );
  const woPromises = workOrdersToCreate.map(wo => 
    upsertDocument('workOrders', wo.id, wo, 'IOT_AUTO_TRIGGER')
  );

  await Promise.all([...assetPromises, ...logPromises, ...woPromises]);

  return {
    success: true,
    processedCount: telemetryBatch.length,
    updatedAssetsCount: lastProcessedPerAsset.size,
    alertsTriggered,
    workOrdersCreated: workOrdersToCreate.length,
    lastUpdatedAssets: Array.from(lastProcessedPerAsset.values())
  };
};

/**
 * Recibe y procesa un paquete de telemetría IoT de un equipo industrial.
 *
 * @param {Object} telemetryPayload
 * @param {Array<Object>} existingAssets Lista actual de activos
 * @param {boolean} [autoCreateWO=true] Si debe crear automáticamente la Orden PM02 ante anomalías
 * @returns {Promise<{ success: boolean, updatedAsset: Object, triggeredAlert: boolean, message: string }>}
 */
export const processIoTTelemetry = async (telemetryPayload, existingAssets = [], autoCreateWO = true) => {
  const result = await processIoTTelemetryBatch([telemetryPayload], existingAssets, autoCreateWO);
  const updatedAsset = result.lastUpdatedAssets?.[0] || null;
  const triggeredAlert = result.alertsTriggered > 0;

  if (!updatedAsset) {
    return { success: false, updatedAsset: null, triggeredAlert: false, message: `Equipo ${telemetryPayload.equipmentId} no registrado en el Maestro.` };
  }

  return {
    success: true,
    updatedAsset,
    triggeredAlert,
    message: triggeredAlert
      ? `📡 Telemetría procesada para ${updatedAsset.id}. ⚠️ ¡ALERTA CRÍTICA REGISTRADA! Se generó la Orden PM02 con repuestos MM vinculados automáticamente.`
      : `📡 Telemetría procesada para ${updatedAsset.id}. Horómetro: ${updatedAsset.hourmeter} hrs, Salud: ${updatedAsset.healthScore}%.`
  };
};

/**
 * Encola un paquete de telemetría IoT para procesamiento asíncrono en lote (Buffer Queueing)
 */
export const queueIoTTelemetry = (telemetryPayload, existingAssets = [], autoCreateWO = true) => {
  telemetryIngestionQueue.push({ telemetryPayload, existingAssets, autoCreateWO });

  if (telemetryIngestionQueue.length >= MAX_QUEUE_BATCH_SIZE) {
    flushTelemetryQueue();
  } else if (!queueFlushTimer) {
    queueFlushTimer = setTimeout(() => {
      flushTelemetryQueue();
    }, QUEUE_FLUSH_INTERVAL_MS);
  }
};

/**
 * Vacía la cola en memoria y ejecuta el procesamiento asíncrono en lote
 */
export const flushTelemetryQueue = async () => {
  if (queueFlushTimer) {
    clearTimeout(queueFlushTimer);
    queueFlushTimer = null;
  }

  if (telemetryIngestionQueue.length === 0) return;

  const currentBatch = [...telemetryIngestionQueue];
  telemetryIngestionQueue = [];

  const payloads = currentBatch.map(b => b.telemetryPayload);
  const assetsMap = new Map();
  currentBatch.forEach(b => {
    (b.existingAssets || []).forEach(a => assetsMap.set(a.id, a));
  });

  try {
    await processIoTTelemetryBatch(payloads, Array.from(assetsMap.values()), true);
  } catch (err) {
    console.error("[IoT Queue Flush Error]", err);
  }
};

/**
 * Obtiene el historial de series de tiempo (Time-Series) para un activo específico.
 * @param {string} equipmentId
 * @returns {Promise<Array<Object>>}
 */
export const getTelemetryHistory = async (equipmentId) => {
  try {
    const logs = await getCollectionDocs('telemetryLogs');
    const assetLogs = logs
      .filter(l => String(l.equipmentId) === String(equipmentId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return assetLogs;
  } catch (err) {
    console.warn("Error leyendo serie de tiempo de telemetría:", err);
    return [];
  }
};
