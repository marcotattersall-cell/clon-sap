/**
 * Firebase Cloud Functions - Endpoint Serverless de Ingesta IoT para Clon SAP Edge ERP
 * 
 * Permite que gateways 4G/Satelitales y módems de maquinaria pesada (Teltonika, Advantech, Cat Connect)
 * transmitan ráfagas de telemetría por HTTP POST REST a la base de datos de producción.
 * 
 * Endpoint: POST https://us-central1-clon-sap-2026.cloudfunctions.net/ingestIoTTelemetry
 * Header requerido: X-IoT-Gateway-Key: IOT_SECRET_KEY_CLON_SAP_2026
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const IOT_SECRET_KEY = process.env.IOT_SECRET_KEY || "IOT_SECRET_KEY_CLON_SAP_2026";

exports.ingestIoTTelemetry = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-IoT-Gateway-Key, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método HTTP no permitido. Use POST." });
  }

  // 1. Verificación de Seguridad API Key
  const gatewayKey = req.headers["x-iot-gateway-key"] || req.headers["authorization"];
  if (gatewayKey !== IOT_SECRET_KEY) {
    return res.status(401).json({
      error: "Acceso no autorizado.",
      details: "Se requiere un encabezado X-IoT-Gateway-Key válido."
    });
  }

  // 2. Extraer Payload JSON del equipo
  const { equipmentId, hourmeter, odometer, healthScore, engineTemp, vibrationRms } = req.body || {};

  if (!equipmentId) {
    return res.status(400).json({ error: "Campo requerido 'equipmentId' ausente en el payload JSON." });
  }

  try {
    const assetRef = db.collection("assets").doc(equipmentId);
    const assetSnap = await assetRef.get();

    if (!assetSnap.exists) {
      return res.status(404).json({ error: `El activo '${equipmentId}' no existe en la base de datos Maestro.` });
    }

    const currentAsset = assetSnap.data();

    // 3. Reglas de Negocio Industriales & Alertas Autónomas
    const numTemp = Number(engineTemp || 92);
    const numVib = Number(vibrationRms || 3.8);
    const numHrs = hourmeter !== undefined ? Math.max(Number(currentAsset.hourmeter || 0), Number(hourmeter)) : currentAsset.hourmeter;
    const numOdo = odometer !== undefined ? Math.max(Number(currentAsset.odometer || 0), Number(odometer)) : currentAsset.odometer;

    let newStatus = currentAsset.status || "OPERATIVE";
    let triggeredAlert = false;
    let alertReason = "";

    if (numTemp > 102) {
      newStatus = "MAINTENANCE";
      triggeredAlert = true;
      alertReason = `Alerta Térmica Motor: ${numTemp}°C (Umbral max: 102°C)`;
    } else if (numVib > 6.5) {
      newStatus = "MAINTENANCE";
      triggeredAlert = true;
      alertReason = `Alerta Vibración Rodamiento: ${numVib} mm/s (Umbral max: 6.5 mm/s)`;
    }

    const timestampIso = new Date().toISOString();

    // 4. Actualizar Activo en Firestore
    await assetRef.set(
      {
        hourmeter: numHrs,
        odometer: numOdo,
        status: newStatus,
        lastIoTTelemetry: {
          timestamp: timestampIso,
          engineTemp: numTemp,
          vibrationRms: numVib,
          alertReason
        },
        _versionVector: {
          deviceId: "SERVERLESS_CLOUD_FUNCTION",
          clock: (currentAsset._versionVector?.clock || 0) + 1,
          updatedAt: timestampIso
        }
      },
      { merge: true }
    );

    // 5. Persistir Entrada en Serie de Tiempo (Time-Series Collection)
    const logId = `TLOG-${equipmentId}-${Date.now()}`;
    await db.collection("telemetryLogs").doc(logId).set({
      id: logId,
      equipmentId,
      timestamp: timestampIso,
      engineTemp: numTemp,
      vibrationRms: numVib,
      hourmeter: numHrs,
      odometer: numOdo,
      healthScore: healthScore || currentAsset.healthScore || 90,
      alertReason
    });

    // 6. Generar Orden de Mantenimiento PM02 Urgente si ocurrió una anomalía
    let createdWoId = null;
    if (triggeredAlert) {
      createdWoId = `WO-IOT-${Date.now().toString().slice(-6)}`;
      await db.collection("workOrders").doc(createdWoId).set({
        id: createdWoId,
        title: `[IoT AUTO-TRIGGER] ${alertReason} - ${currentAsset.name || equipmentId}`,
        type: "PM02",
        priority: "Muy Alta",
        status: "CRTE",
        equipmentId,
        costCenter: "CC-4100",
        assignedTech: "Técnico de Guardia IoT Serverless",
        plannedHours: 4.0,
        actualHours: 0,
        plannedCost: 450.00,
        actualCost: 0,
        hourmeter: numHrs,
        startDate: timestampIso.split("T")[0],
        targetFinishDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        logs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString("es-CL"),
            user: "SERVERLESS CLOUD FUNCTION",
            newStatus: "CRTE",
            text: `Orden PM02 creada autónomamente por Webhook Ingesta Serverless. Razon: ${alertReason}`
          }
        ]
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      equipmentId,
      triggeredAlert,
      alertReason: alertReason || "Normal",
      createdWoId,
      processedAt: timestampIso
    });
  } catch (error) {
    console.error("Error en Ingesta IoT Serverless:", error);
    return res.status(500).json({ error: "Error interno del servidor al procesar telemetría.", details: error.message });
  }
});

// ============================================================================
// 🔔 CLOUD FUNCTION: ALERTA DIARIA AUTOMÁTICA DE VENCIMIENTOS (CRON + HTTP)
// ============================================================================

const getDaysToExpiry = (dateStr) => {
  if (!dateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const runExpirationsAudit = async () => {
  const empSnap = await db.collection("employees").get();
  const assetSnap = await db.collection("assets").get();

  const expiredItems = [];
  const warningItems = [];

  // Audit Employees (HCM)
  empSnap.forEach(doc => {
    const emp = doc.data();
    const checks = [
      { name: "Examen Médico Asoex/Mutual", date: emp.medicalExamExpiry },
      { name: "Acreditación Faena / Pase", date: emp.accreditationExpiry },
      { name: "Curso de Seguridad OHSAS", date: emp.safetyCourseExpiry },
      { name: "Contrato Plazo Fijo", date: emp.contractType === 'Plazo Fijo' ? emp.contractExpiry : null }
    ];

    checks.forEach(c => {
      if (c.date) {
        const days = getDaysToExpiry(c.date);
        const item = {
          entityType: "COLABORADOR (HCM)",
          id: emp.id,
          name: emp.fullName,
          rut: emp.rut || "N/A",
          docName: c.name,
          expiryDate: c.date,
          daysToExpiry: days
        };

        if (days <= 0) {
          expiredItems.push(item);
        } else if (days <= 30) {
          warningItems.push(item);
        }
      }
    });
  });

  // Audit Vehicles & Equipment (PM/Fleet)
  assetSnap.forEach(doc => {
    const asset = doc.data();
    const checks = [
      { name: "Permiso de Circulación", date: asset.circPermitExpiry },
      { name: "Seguro Obligatorio SOAP", date: asset.soapExpiry },
      { name: "Revisión Técnica", date: asset.techInspectExpiry },
      { name: "Acreditación Minera Faena", date: asset.miningAccreditationExpiry }
    ];

    if (Array.isArray(asset.customExpirations)) {
      asset.customExpirations.forEach(ce => {
        checks.push({ name: ce.title || "Documento Personalizado", date: ce.expiryDate });
      });
    }

    checks.forEach(c => {
      if (c.date) {
        const days = getDaysToExpiry(c.date);
        const item = {
          entityType: "VEHÍCULO / MAQUINARIA (PM)",
          id: asset.id,
          name: `${asset.name} (${asset.plate || asset.id})`,
          plate: asset.plate || asset.id,
          docName: c.name,
          expiryDate: c.date,
          daysToExpiry: days
        };

        if (days <= 0) {
          expiredItems.push(item);
        } else if (days <= 30) {
          warningItems.push(item);
        }
      }
    });
  });

  const timestampIso = new Date().toISOString();
  const dateStr = timestampIso.split("T")[0];
  const reportId = `AUDIT-REPORT-${dateStr}`;

  const reportSummary = {
    reportId,
    timestamp: timestampIso,
    date: dateStr,
    totalExpired: expiredItems.length,
    totalWarning: warningItems.length,
    expiredItems,
    warningItems,
    status: expiredItems.length > 0 ? "CRITICAL" : warningItems.length > 0 ? "WARNING" : "OK"
  };

  // 1. Persistir Informe en Firestore
  await db.collection("expirationAuditReports").doc(reportId).set(reportSummary);

  // 2. Generar Alerta en Buzón de Notificaciones si hay observaciones
  if (expiredItems.length > 0 || warningItems.length > 0) {
    const notifId = `NOTIF-EXPIRY-${Date.now()}`;
    await db.collection("notifications").doc(notifId).set({
      id: notifId,
      title: `🔴 ALERTA DIARIA: ${expiredItems.length} Documentos Vencidos y ${warningItems.length} por Vencer`,
      message: `Auditoría automática procesada. Se detectaron ${expiredItems.length} documentos vencidos y ${warningItems.length} por vencer en los próximos 30 días.`,
      type: "EXPIRATION_ALERT",
      createdAt: timestampIso,
      read: false,
      reportId
    });
  }

  return reportSummary;
};

/**
 * Trigger Programado Diario (Cron 08:00 AM Chile)
 */
exports.checkDailyExpirationsCron = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("America/Santiago")
  .onRun(async (context) => {
    console.log("[Cron 08:00 AM] Ejecutando Auditoría Diaria Automática de Vencimientos...");
    const result = await runExpirationsAudit();
    console.log("[Cron 08:00 AM] Auditoría finalizada:", JSON.stringify(result));
    return null;
  });

/**
 * Trigger HTTP manual para ejecuciones bajo demanda y pruebas instantáneas desde UI
 */
exports.checkDailyExpirations = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const result = await runExpirationsAudit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Auditoría diaria de vencimientos procesada correctamente.",
      result
    });
  } catch (error) {
    console.error("Error en checkDailyExpirations HTTP:", error);
    return res.status(500).json({ error: "Error al ejecutar la auditoría de vencimientos.", details: error.message });
  }
});

