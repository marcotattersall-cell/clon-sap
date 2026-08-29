/**
 * Servicio de Ingesta de Telemetría IoT y Bus CAN (SAE J1939 / Modbus TCP)
 * Procesa ráfagas de sensores industriales en tiempo real para actualizar horómetros,
 * odómetros, guardar series de tiempo (Time-Series) y desencadenar Avisos/Órdenes PM de forma autónoma.
 */

import { upsertDocument, getCollectionDocs } from './dbService';
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
  const isTransportVehicle = asset.category?.includes('Transporte') || asset.category?.includes('Flota') || asset.category?.includes('Camión');
  const odometerMilestoneReached = isTransportVehicle && odometer !== undefined && (Math.floor(newOdometer / 10000) > Math.floor((asset.odometer || 0) / 10000));
  const hourmeterMilestoneReached = !isTransportVehicle && hourmeter !== undefined && (Math.floor(newHourmeter / 250) > Math.floor((asset.hourmeter || 0) / 250));

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
    // Vincular Repuestos Planificados desde el Maestro de Materiales según el tipo de anomalía detectada
    let suggestedComponents = [];

    if (engineTemp && Number(engineTemp) > 102) {
      suggestedComponents = [
        {
          materialId: 'MAT-1005',
          description: 'Sensor de Temperatura y Presión Digital M12',
          qtyPlanned: 1,
          qtyIssued: 0,
          unit: 'UN',
          unitPrice: 165.00
        },
        {
          materialId: 'MAT-1002',
          description: 'Aceite Sintético Multigrado 15W40 (Tambor 208L)',
          qtyPlanned: 1,
          qtyIssued: 0,
          unit: 'TBO',
          unitPrice: 420.00
        }
      ];
    } else if (vibrationRms && Number(vibrationRms) > 6.5) {
      suggestedComponents = [
        {
          materialId: 'MAT-1003',
          description: 'Bomba Hidráulica de Pistones Axiales Komatsu',
          qtyPlanned: 1,
          qtyIssued: 0,
          unit: 'UN',
          unitPrice: 3450.00
        },
        {
          materialId: 'MAT-1004',
          description: 'Correa Mecánica Dentada Industrial V-Belt',
          qtyPlanned: 2,
          qtyIssued: 0,
          unit: 'UN',
          unitPrice: 24.90
        }
      ];
    } else {
      suggestedComponents = [
        {
          materialId: 'MAT-1001',
          description: 'Filtro de Aceite Hidráulico CAT H-200',
          qtyPlanned: 2,
          qtyIssued: 0,
          unit: 'UN',
          unitPrice: 85.50
        },
        {
          materialId: 'MAT-1002',
          description: 'Aceite Sintético Multigrado 15W40 (Tambor 208L)',
          qtyPlanned: 1,
          qtyIssued: 0,
          unit: 'TBO',
          unitPrice: 420.00
        }
      ];
    }

    const componentTotalCost = suggestedComponents.reduce((sum, c) => sum + (c.qtyPlanned * (c.unitPrice || 0)), 0);
    const plannedHours = 4.0;
    const laborCost = plannedHours * 65.0; // Rate h/mecanico
    const totalPlannedCost = Number((laborCost + componentTotalCost).toFixed(2));

    const autoWO = {
      id: `WO-IOT-${Date.now().toString().slice(-6)}`,
      title: `[IoT AUTO-TRIGGER] ${alertReason} - ${asset.name}`,
      type: 'PM02',
      priority: 'Muy Alta',
      status: 'CRTE',
      equipmentId: asset.id,
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
        { id: `LOG-${Date.now()}`, timestamp: new Date().toLocaleString('es-CL'), user: 'BOT IOT GATEWAY', previousStatus: 'N/A', newStatus: 'CRTE', text: `Orden generada automáticamente por telemetría IoT con ${suggestedComponents.length} repuestos vinculados del Maestro de Materiales MM. Razón: ${alertReason}`, comment: 'Auto-Trigger IoT con Reserva de Materiales MM' }
      ]
    };

    await upsertDocument('workOrders', autoWO.id, autoWO, 'IOT_AUTO_TRIGGER');
  }

  return {
    success: true,
    updatedAsset,
    triggeredAlert,
    message: triggeredAlert
      ? `📡 Telemetría procesada para ${asset.id}. ⚠️ ¡ALERTA CRÍTICA REGISTRADA! Se generó la Orden PM02 con repuestos MM vinculados automáticamente.`
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

    return assetLogs;
  } catch (err) {
    console.warn("Error leyendo serie de tiempo de telemetría:", err);
    return [];
  }
};
