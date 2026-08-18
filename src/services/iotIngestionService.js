/**
 * Servicio de Ingesta de Telemetría IoT y Bus CAN (SAE J1939 / Modbus TCP)
 * Procesa ráfagas de sensores industriales en tiempo real para actualizar horómetros,
 * odómetros, guardar series de tiempo (Time-Series) y desencadenar Avisos/Órdenes PM de forma autónoma.
 */

import { upsertDocument, getCollectionDocs } from './firestoreService';
import { updateVectorClock } from './crdtSyncService';

/**
 * Recibe y procesa un paquete de telemetría IoT de un equipo industrial.
 *
 * @param {Object} telemetryPayload
 * @param {string} telemetryPayload.equipmentId ID del activo (ej: 'EQ-101')
 * @param {number} [telemetryPayload.hourmeter] Lectura actual de horómetro
 * @param {number} [telemetryPayload.odometer] Lectura actual de odómetro
 * @param {number} [telemetryPayload.healthScore] Índice de salud (0-100)
 * @param {number} [telemetryPayload.engineTemp] Temperatura de motor (°C)
 * @param {number} [telemetryPayload.vibrationRms] Nivel de vibración RMS (mm/s)
 * @param {Array<Object>} existingAssets Lista actual de activos
 * @param {boolean} [autoCreateWO=true] Si debe crear automáticamente la Orden PM02 ante anomalías
 * @returns {Promise<{ success: boolean, updatedAsset: Object, triggeredAlert: boolean, message: string }>}
 */
export const processIoTTelemetry = async (telemetryPayload, existingAssets = [], autoCreateWO = true) => {
  const { equipmentId, hourmeter, odometer, healthScore, engineTemp, vibrationRms } = telemetryPayload;

  const asset = existingAssets.find(a => a.id === equipmentId);
  if (!asset) {
    return { success: false, updatedAsset: null, triggeredAlert: false, message: `Equipo ${equipmentId} no registrado en el Maestro.` };
  }

  // 1. Calcular nuevos valores del activo
  const newHourmeter = hourmeter !== undefined ? Math.max(Number(asset.hourmeter || 0), Number(hourmeter)) : asset.hourmeter;
  const newOdometer = odometer !== undefined ? Math.max(Number(asset.odometer || 0), Number(odometer)) : asset.odometer;
  const newHealthScore = healthScore !== undefined ? Number(healthScore) : asset.healthScore;

  let newStatus = asset.status;
  let triggeredAlert = false;
  let alertReason = '';

  // 2. Reglas de Negocio Industriales Autónomas (Preventivas / Correctivas)
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
  }

  // 3. Crear registro de lectura IoT enriquecido con Vector Clock
  const updatedAsset = updateVectorClock(
    {
      ...asset,
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

  // 4. Persistir actualización atómica en Cloud Firestore / IndexedDB
  await upsertDocument('assets', asset.id, updatedAsset, 'IOT_SENSOR_GATEWAY');

  // 5. Persistir entrada en Serie de Tiempo (Time-Series Telemetry History)
  const logId = `TLOG-${equipmentId}-${Date.now()}`;
  const telemetryLogEntry = {
    id: logId,
    equipmentId: asset.id,
    timestamp: new Date().toISOString(),
    engineTemp: Number(engineTemp || 92),
    vibrationRms: Number(vibrationRms || 3.8),
    hourmeter: newHourmeter,
    odometer: newOdometer,
    healthScore: newHealthScore,
    alertReason,
    _versionVector: updatedAsset._versionVector
  };
  await upsertDocument('telemetryLogs', logId, telemetryLogEntry, 'IOT_SENSOR_GATEWAY');

  // 6. Si se gatilló una condición anómala, crear Orden de Mantenimiento Preventivo/Correctivo autónoma
  if (triggeredAlert && autoCreateWO) {
    const autoWO = {
      id: `WO-IOT-${Date.now().toString().slice(-6)}`,
      title: `[IoT AUTO-TRIGGER] ${alertReason} - ${asset.name}`,
      type: 'PM02',
      priority: 'Muy Alta',
      status: 'CRTE',
      equipmentId: asset.id,
      costCenter: 'CC-4100',
      assignedTech: 'Técnico de Guardia IoT',
      plannedHours: 4.0,
      actualHours: 0,
      plannedCost: 450.00,
      actualCost: 0,
      hourmeter: newHourmeter,
      odometer: newOdometer,
      startDate: new Date().toISOString().split('T')[0],
      targetFinishDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      operations: [
        { id: 1, text: `Inspección de sensor por alerta IoT: ${alertReason}`, duration: 2.0, assigned: 'Técnico de Guardia IoT', status: 'Pending' }
      ],
      components: [],
      logs: [
        { id: `LOG-${Date.now()}`, timestamp: new Date().toLocaleString('es-CL'), user: 'BOT IOT GATEWAY', previousStatus: 'N/A', newStatus: 'CRTE', text: `Orden generada automáticamente por telemetría IoT. Razon: ${alertReason}`, comment: 'Auto-Trigger IoT' }
      ]
    };

    await upsertDocument('workOrders', autoWO.id, autoWO, 'IOT_AUTO_TRIGGER');
  }

  return {
    success: true,
    updatedAsset,
    triggeredAlert,
    message: triggeredAlert
      ? `📡 Telemetría procesada para ${asset.id}. ⚠️ ¡ALERTA CRÍTICA REGISTRADA! Se generó una Orden de Trabajo PM02 automáticamente.`
      : `📡 Telemetría procesada para ${asset.id}. Horómetro: ${newHourmeter} hrs, Salud: ${newHealthScore}%.`
  };
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
      .filter(l => l.equipmentId === equipmentId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (assetLogs.length > 0) return assetLogs;

    // Default mock historical trend if empty
    const now = Date.now();
    return [
      { id: '1', equipmentId, timestamp: new Date(now - 14400000).toISOString(), engineTemp: 91, vibrationRms: 3.5, hourmeter: 4240, healthScore: 95 },
      { id: '2', equipmentId, timestamp: new Date(now - 10800000).toISOString(), engineTemp: 93, vibrationRms: 3.7, hourmeter: 4243, healthScore: 95 },
      { id: '3', equipmentId, timestamp: new Date(now - 7200000).toISOString(), engineTemp: 96, vibrationRms: 4.2, hourmeter: 4246, healthScore: 92 },
      { id: '4', equipmentId, timestamp: new Date(now - 3600000).toISOString(), engineTemp: 99, vibrationRms: 5.1, hourmeter: 4248, healthScore: 88 },
      { id: '5', equipmentId, timestamp: new Date(now).toISOString(), engineTemp: 94, vibrationRms: 3.8, hourmeter: 4250, healthScore: 94 }
    ];
  } catch (err) {
    console.warn("Error leyendo serie de tiempo de telemetría:", err);
    return [];
  }
};
