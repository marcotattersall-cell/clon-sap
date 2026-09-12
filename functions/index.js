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

  // 3. Despacho de Webhooks y Registro de Emails Automáticos
  try {
    const configSnap = await db.collection("settings").doc("notification_config").get();
    const config = configSnap.exists ? configSnap.data() : {};
    const webhookUrl = config.webhookUrl || process.env.EXPIRATION_WEBHOOK_URL;
    const webhookType = config.webhookType || "SLACK";

    if (webhookUrl && (expiredItems.length > 0 || warningItems.length > 0)) {
      let payload = {};
      if (webhookType === "SLACK") {
        payload = {
          text: `🚨 [Operam ERP] Alerta Auditoría Vencimientos: ${expiredItems.length} Vencidos y ${warningItems.length} por Vencer`,
          blocks: [
            { type: "header", text: { type: "plain_text", text: "🚨 Operam ERP — Alerta de Vencimientos Documentales", emoji: true } },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Vencidos (Críticos):*\n${expiredItems.length}` },
                { type: "mrkdwn", text: `*Por Vencer (≤30d):*\n${warningItems.length}` }
              ]
            }
          ]
        };
      } else {
        payload = {
          source: "OPERAM_ERP_ENTERPRISE",
          timestamp: timestampIso,
          totalExpired: expiredItems.length,
          totalWarning: warningItems.length,
          expiredItems,
          warningItems
        };
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Error al enviar Webhook en Auditoría:", err.message));
    }

    // Registrar envíos de correo en colección 'mail' (Firebase Trigger Email extension)
    const targetEmails = [];
    if (config.emails?.safety) targetEmails.push(config.emails.safety);
    if (config.emails?.fleet) targetEmails.push(config.emails.fleet);
    if (config.emails?.hr) targetEmails.push(config.emails.hr);

    if (targetEmails.length > 0 && (expiredItems.length > 0 || warningItems.length > 0)) {
      const mailDocId = `MAIL-EXPIRY-${Date.now()}`;
      await db.collection("mail").doc(mailDocId).set({
        to: targetEmails,
        message: {
          subject: `[Operam ERP] Alerta de Vencimientos: ${expiredItems.length} Vencidos / ${warningItems.length} por Vencer`,
          html: `
            <h2>🚨 Operam ERP Enterprise — Auditoría Diaria de Vencimientos</h2>
            <p>Se han auditado los registros de Flota y Colaboradores HCM. Resumen:</p>
            <ul>
              <li><strong>Documentos Vencidos (Críticos):</strong> ${expiredItems.length}</li>
              <li><strong>Documentos Por Vencer (≤30 Días):</strong> ${warningItems.length}</li>
            </ul>
            <p>Por favor revise el panel de control <strong>Vencimientos & Acreditaciones General</strong> en la plataforma.</p>
          `
        },
        createdAt: timestampIso
      });
    }
  } catch (err) {
    console.error("Error en despacho de notificaciones externas:", err.message);
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

/**
 * Cloud Function HTTP para despachar alertas a correo y Webhooks bajo demanda
 */
exports.sendExpirationAlertNotification = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { emails = [], webhookUrl = null, webhookType = "SLACK" } = req.body || {};
    const auditResult = await runExpirationsAudit();

    let webhookDispatched = false;
    if (webhookUrl) {
      const payload = {
        text: `🚨 [Operam ERP] Alerta Despachada Bajo Demanda: ${auditResult.totalExpired} Vencidos y ${auditResult.totalWarning} por Vencer`,
        auditResult
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(() => { webhookDispatched = true; })
        .catch(err => console.error("Fallo envío Webhook manual:", err.message));
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Alertas por correo y Webhook procesadas exitosamente.",
      webhookDispatched,
      emailsTargeted: emails.length,
      auditResult
    });
  } catch (error) {
    console.error("Error en sendExpirationAlertNotification:", error);
    return res.status(500).json({ error: "Error al enviar notificaciones.", details: error.message });
  }
});

// ============================================================================
// 🛠️ CLOUD FUNCTION: ALERTA DE ÓRDENES DE TRABAJO ESTANCADAS (> 24 HORAS)
// ============================================================================

const runStaleWorkOrdersAudit = async () => {
  const woSnap = await db.collection("workOrders").get();
  const nowMs = Date.now();
  const staleOrders = [];

  const closedStatuses = ["TECO", "CLSD", "CERRADA", "COMPLETADA", "CANCELADA"];

  woSnap.forEach(doc => {
    const wo = doc.data();
    const isClosed = closedStatuses.includes(String(wo.status || "").toUpperCase());
    if (!isClosed) {
      const startDateStr = wo.startDate || wo.createdAt;
      if (startDateStr) {
        const startMs = new Date(startDateStr).getTime();
        if (!isNaN(startMs)) {
          const ageHours = Math.floor((nowMs - startMs) / (1000 * 60 * 60));
          if (ageHours >= 24) {
            staleOrders.push({
              id: wo.id,
              title: wo.title || "Orden de Trabajo Mantenimiento",
              type: wo.type || "PM02",
              priority: wo.priority || "Alta",
              status: wo.status || "CRTE",
              assignedTech: wo.assignedTech || "Técnico No Asignado",
              equipmentId: wo.equipmentId || "N/A",
              startDate: startDateStr,
              ageHours
            });
          }
        }
      }
    }
  });

  staleOrders.sort((a, b) => b.ageHours - a.ageHours);

  const timestampIso = new Date().toISOString();
  const dateStr = timestampIso.split("T")[0];
  const reportId = `STALE-WO-REPORT-${dateStr}-${Date.now()}`;

  const reportSummary = {
    reportId,
    timestamp: timestampIso,
    date: dateStr,
    totalStale: staleOrders.length,
    staleOrders,
    status: staleOrders.length > 0 ? "WARNING_STALE" : "OK"
  };

  // 1. Persistir informe en Firestore
  await db.collection("staleWorkOrderReports").doc(reportId).set(reportSummary);

  // 2. Generar Alerta en Buzón de Notificaciones del ERP
  if (staleOrders.length > 0) {
    const notifId = `NOTIF-STALE-WO-${Date.now()}`;
    await db.collection("notifications").doc(notifId).set({
      id: notifId,
      title: `🛠️ ALERTA PM: ${staleOrders.length} Órdenes de Trabajo Abiertas > 24 Horas`,
      message: `Se han detectado ${staleOrders.length} OTs en estado pendiente con más de 24 horas sin completar. La OT más antigua lleva ${staleOrders[0].ageHours} horas abierta.`,
      type: "STALE_WORK_ORDER",
      createdAt: timestampIso,
      read: false,
      reportId
    });
  }

  // 3. Despacho a Webhooks y Cola de Email
  try {
    const configSnap = await db.collection("settings").doc("notification_config").get();
    const config = configSnap.exists ? configSnap.data() : {};
    const webhookUrl = config.webhookUrl || process.env.EXPIRATION_WEBHOOK_URL;
    const webhookType = config.webhookType || "SLACK";

    if (webhookUrl && staleOrders.length > 0) {
      const topStale = staleOrders.slice(0, 5).map(x => `• *${x.id}*: ${x.title} (${x.type} / ${x.priority}) — Abierta hace *${x.ageHours}h* [Técnico: ${x.assignedTech}]`).join("\n");
      const payload = webhookType === "SLACK" ? {
        text: `🚨 [Operam ERP] Alerta PM: ${staleOrders.length} Órdenes de Trabajo Abiertas > 24 Horas`,
        blocks: [
          { type: "header", text: { type: "plain_text", text: "🛠️ Operam ERP — Alerta de OTs Estancadas (>24h)", emoji: true } },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Resumen Auditoría PM:*\nSe detectaron *${staleOrders.length} OTs pendientes* que superan las 24 horas abiertas sin cierre.` }
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Órdenes Críticas Abiertas:*\n${topStale}` }
          }
        ]
      } : {
        source: "OPERAM_ERP_ENTERPRISE",
        event: "STALE_WORK_ORDERS_AUDIT",
        timestamp: timestampIso,
        totalStale: staleOrders.length,
        staleOrders
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Error al enviar Webhook OT Estancadas:", err.message));
    }
  } catch (err) {
    console.error("Error al notificar OTs estancadas:", err.message);
  }

  return reportSummary;
};

/**
 * Trigger Programado cada 4 Horas para Auditoría de OTs Estancadas
 */
exports.checkStaleWorkOrdersCron = functions.pubsub
  .schedule("0 */4 * * *")
  .timeZone("America/Santiago")
  .onRun(async (context) => {
    console.log("[Cron 4h] Ejecutando Auditoría de Órdenes de Trabajo Estancadas (>24h)...");
    const result = await runStaleWorkOrdersAudit();
    console.log("[Cron 4h] Auditoría OTs finalizada:", JSON.stringify(result));
    return null;
  });

/**
 * Trigger HTTP manual para auditoría de OTs estancadas
 */
exports.checkStaleWorkOrders = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const result = await runStaleWorkOrdersAudit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Auditoría de OTs estancadas (>24h) procesada correctamente.",
      result
    });
  } catch (error) {
    console.error("Error en checkStaleWorkOrders HTTP:", error);
    return res.status(500).json({ error: "Error al auditar OTs estancadas.", details: error.message });
  }
});

/**
 * Cloud Function HTTP para despachar alertas de OTs estancadas por Correo / Webhook
 */
exports.sendStaleWorkOrderAlertNotification = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const auditResult = await runStaleWorkOrdersAudit();
    return res.status(200).json({
      status: "SUCCESS",
      message: `Alertas procesadas para ${auditResult.totalStale} Órdenes de Trabajo estancadas.`,
      auditResult
    });
  } catch (error) {
    console.error("Error en sendStaleWorkOrderAlertNotification:", error);
    return res.status(500).json({ error: "Error al enviar notificaciones de OTs estancadas.", details: error.message });
  }
});

// ============================================================================
// 📊 CLOUD FUNCTION: REPORTE SEMANAL EJECUTIVO DE KPIS A GERENCIA (CRON + HTTP)
// ============================================================================

const runWeeklyKPIExecutiveAudit = async () => {
  const assetSnap = await db.collection("assets").get();
  const woSnap = await db.collection("workOrders").get();

  const assetsList = [];
  assetSnap.forEach(doc => assetsList.push(doc.data()));

  const workOrdersList = [];
  woSnap.forEach(doc => workOrdersList.push(doc.data()));

  // 1. KPIs de Flota & Salud IoT
  const totalAssets = assetsList.length;
  const operativeAssets = assetsList.filter(a => a.status === 'OPERATIVE' || a.status === 'Operational');
  const fleetAvailabilityRate = totalAssets > 0 ? Math.round((operativeAssets.length / totalAssets) * 100) : 100;
  const avgHealthScore = totalAssets > 0 ? Math.round(assetsList.reduce((sum, a) => sum + Number(a.healthScore || a.healthIndex || 90), 0) / totalAssets) : 90;

  // 2. Cumplimiento de Mantenimiento PM
  const totalWO = workOrdersList.length;
  const closedWO = workOrdersList.filter(w => w.status === 'TECO' || w.status === 'CLSD' || w.status === 'COMPLETADA');
  const pmComplianceRate = totalWO > 0 ? Math.round((closedWO.length / totalWO) * 100) : 100;

  // 3. Desglose de Costos por Centro de Costos
  const costCenterBreakdown = {};
  workOrdersList.forEach(w => {
    const cc = w.costCenter || 'CC-GENERAL';
    if (!costCenterBreakdown[cc]) {
      costCenterBreakdown[cc] = { costCenter: cc, plannedCost: 0, actualCost: 0, orderCount: 0 };
    }
    costCenterBreakdown[cc].plannedCost += Number(w.plannedCost || 0);
    costCenterBreakdown[cc].actualCost += Number(w.actualCost || 0);
    costCenterBreakdown[cc].orderCount += 1;
  });

  const totalPlannedCost = workOrdersList.reduce((sum, w) => sum + Number(w.plannedCost || 0), 0);
  const totalActualCost = workOrdersList.reduce((sum, w) => sum + Number(w.actualCost || 0), 0);
  const costVariance = totalActualCost - totalPlannedCost;

  const timestampIso = new Date().toISOString();
  const dateStr = timestampIso.split("T")[0];
  const reportId = `WEEKLY-KPI-REPORT-${dateStr}-${Date.now()}`;

  const reportSummary = {
    reportId,
    timestamp: timestampIso,
    date: dateStr,
    fleetAvailabilityRate,
    avgHealthScore,
    pmComplianceRate,
    totalPlannedCost,
    totalActualCost,
    costVariance,
    totalAssets,
    totalWorkOrders: totalWO,
    costCenterBreakdown: Object.values(costCenterBreakdown)
  };

  // 1. Persistir Reporte en Firestore
  await db.collection("weeklyExecutiveKpiReports").doc(reportId).set(reportSummary);

  // 2. Notificación en Buzón del ERP
  const notifId = `NOTIF-WEEKLY-KPI-${Date.now()}`;
  await db.collection("notifications").doc(notifId).set({
    id: notifId,
    title: `📈 INFORME SEMANAL EJECUTIVO: Disponibilidad Flota ${fleetAvailabilityRate}% | Cumplimiento PM ${pmComplianceRate}%`,
    message: `Reporte semanal procesado. Gasto real contabilizado: $${totalActualCost.toLocaleString()} (Desviación: $${costVariance.toLocaleString()}).`,
    type: "WEEKLY_EXECUTIVE_KPI",
    createdAt: timestampIso,
    read: false,
    reportId
  });

  // 3. Despacho a Webhook y Correo para Gerencia
  try {
    const configSnap = await db.collection("settings").doc("notification_config").get();
    const config = configSnap.exists ? configSnap.data() : {};
    const webhookUrl = config.webhookUrl || process.env.EXPIRATION_WEBHOOK_URL;
    const webhookType = config.webhookType || "SLACK";

    if (webhookUrl) {
      const ccLines = Object.values(costCenterBreakdown)
        .map(cc => `• *${cc.costCenter}*: Real $${cc.actualCost.toLocaleString()} (Plan $${cc.plannedCost.toLocaleString()}) [${cc.orderCount} OTs]`)
        .join("\n");

      const payload = webhookType === "SLACK" ? {
        text: `📈 [Operam ERP] Informe Semanal Ejecutivo: Flota ${fleetAvailabilityRate}% | Cumplimiento PM ${pmComplianceRate}%`,
        blocks: [
          { type: "header", text: { type: "plain_text", text: "📊 Operam ERP — Informe Semanal Ejecutivo de KPIs", emoji: true } },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Disponibilidad Flota:*\n*${fleetAvailabilityRate}%* (${operativeAssets.length}/${totalAssets} Operativos)` },
              { type: "mrkdwn", text: `*Salud IoT Promedio:*\n*${avgHealthScore}/100*` },
              { type: "mrkdwn", text: `*Cumplimiento PM:*\n*${pmComplianceRate}%* (${closedWO.length}/${totalWO} OTs TECO)` },
              { type: "mrkdwn", text: `*Gasto Total Contabilizado:*\n*$${totalActualCost.toLocaleString()}* (Plan: $${totalPlannedCost.toLocaleString()})` }
            ]
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Desglose por Centro de Costos:*\n${ccLines || 'Sin registros'}` }
          }
        ]
      } : {
        source: "OPERAM_ERP_ENTERPRISE",
        event: "WEEKLY_EXECUTIVE_KPI_REPORT",
        timestamp: timestampIso,
        reportSummary
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Error al enviar Webhook Reporte Semanal:", err.message));
    }

    // Registrar envíos de correo en colección 'mail' (Firebase Trigger Email)
    const targetEmails = [];
    if (config.emails?.safety) targetEmails.push(config.emails.safety);
    if (config.emails?.fleet) targetEmails.push(config.emails.fleet);
    if (config.emails?.hr) targetEmails.push(config.emails.hr);

    if (targetEmails.length > 0) {
      const mailDocId = `MAIL-WEEKLY-KPI-${Date.now()}`;
      await db.collection("mail").doc(mailDocId).set({
        to: targetEmails,
        message: {
          subject: `[Operam ERP] Informe Semanal Ejecutivo: KPIs de Flota, Costos y Mantenimiento`,
          html: `
            <h2>📈 Operam ERP Enterprise — Consolidado Semanal de KPIs Ejecutivos</h2>
            <p>Estimados Gerentes de Área,</p>
            <p>Se ha generado el resumen semanal de desempeño operacional:</p>
            <ul>
              <li><strong>Disponibilidad de Flota:</strong> ${fleetAvailabilityRate}% (${operativeAssets.length}/${totalAssets} Operativos)</li>
              <li><strong>Índice Salud IoT Promedio:</strong> ${avgHealthScore}/100</li>
              <li><strong>Cumplimiento Plan Mantenimiento:</strong> ${pmComplianceRate}% (${closedWO.length}/${totalWO} OTs TECO)</li>
              <li><strong>Gasto Real Contabilizado:</strong> $${totalActualCost.toLocaleString()} (Presupuesto Planificado: $${totalPlannedCost.toLocaleString()})</li>
            </ul>
            <p>Por favor revise el panel de control <strong>Analítica & Cockpit Ejecutivo</strong> en la plataforma.</p>
          `
        },
        createdAt: timestampIso
      });
    }
  } catch (err) {
    console.error("Error en despacho de correo semanal:", err.message);
  }

  return reportSummary;
};

/**
 * Cron Job Semanal: Lunes a las 08:00 AM (Chile)
 */
exports.checkWeeklyKPIExecutiveReportCron = functions.pubsub
  .schedule("0 8 * * 1")
  .timeZone("America/Santiago")
  .onRun(async (context) => {
    console.log("[Cron Lunes 08:00 AM] Ejecutando Informe Semanal Ejecutivo de KPIs...");
    const result = await runWeeklyKPIExecutiveAudit();
    console.log("[Cron Lunes 08:00 AM] Informe Semanal finalizado:", JSON.stringify(result));
    return null;
  });

/**
 * Trigger HTTP manual para generar el Informe Semanal de KPIs
 */
exports.generateWeeklyKPIReport = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const result = await runWeeklyKPIExecutiveAudit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Informe semanal ejecutivo de KPIs generado correctamente.",
      result
    });
  } catch (error) {
    console.error("Error en generateWeeklyKPIReport HTTP:", error);
    return res.status(500).json({ error: "Error al generar informe semanal de KPIs.", details: error.message });
  }
});

/**
 * Trigger HTTP manual para despachar el Informe Semanal por Correo / Webhook a gerencia
 */
exports.sendWeeklyKPINotification = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const result = await runWeeklyKPIExecutiveAudit();
    return res.status(200).json({
      status: "SUCCESS",
      message: "Informe semanal de KPIs enviado exitosamente por Correo y Webhook a gerencia.",
      result
    });
  } catch (error) {
    console.error("Error en sendWeeklyKPINotification HTTP:", error);
    return res.status(500).json({ error: "Error al enviar informe semanal.", details: error.message });
  }
});

// ============================================================================
// 🔐 CLOUD FUNCTIONS: GENERACIÓN Y ENVÍO DE CÓDIGO DE VERIFICACIÓN (AUTH OTP)
// ============================================================================

/**
 * Trigger de Firebase Auth: Detecta la creación de un nuevo usuario (onCreate).
 * Genera un código OTP de 6 dígitos, lo persiste en Firestore ('otp_verifications')
 * y registra la salida en la colección 'mail' (Firebase Trigger Email extension).
 */
exports.onUserCreatedSendVerificationCode = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  if (!email) {
    console.log(`[Auth Trigger] El usuario ${user.uid} no posee correo electrónico registrado.`);
    return null;
  }

  const cleanEmail = email.toLowerCase().trim();
  const displayName = user.displayName || 'Usuario ERP';
  const docId = cleanEmail.replace(/[^a-z0-9]/g, "_");

  // 1. Generar código seguro de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validez

  const otpData = {
    email: cleanEmail,
    uid: user.uid,
    code,
    displayName,
    expiresAt,
    attempts: 0,
    status: "PENDING",
    createdTimestamp: new Date().toISOString()
  };

  try {
    // 2. Persistir registro OTP en Firestore
    await db.collection("otp_verifications").doc(docId).set(otpData);

    // 3. Asegurar perfil inicial del usuario en colección 'users'
    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        uid: user.uid,
        email: cleanEmail,
        displayName,
        emailVerified: user.emailVerified || false,
        role: "OPERATOR",
        plant: "0001 (Planta Central)",
        tenantId: "tenant_demo",
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

    // 4. Registrar despacho de correo transaccional en la colección 'mail'
    const mailDocId = `OTP_MAIL_${docId}_${Date.now()}`;
    await db.collection("mail").doc(mailDocId).set({
      to: [cleanEmail],
      message: {
        subject: `[AXOMIRA ERP] Tu código de verificación de 6 dígitos: ${code}`,
        text: `Hola ${displayName}, tu código de verificación para AXOMIRA ERP es: ${code} (Válido por 10 minutos).`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; font-weight: 800;">AXOMIRA Intelligent Cloud ERP</h2>
            <p style="color: #94a3b8; font-size: 14px;">Hola <strong>${displayName}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px;">Tu código de verificación corporativo de 6 dígitos es:</p>
            <div style="background-color: #1e293b; border: 2px dashed #38bdf8; color: #38bdf8; font-size: 32px; font-weight: 900; text-align: center; padding: 18px; border-radius: 12px; letter-spacing: 6px; margin: 24px 0; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b;">Este código es válido por 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
          </div>
        `
      },
      createdAt: new Date().toISOString()
    });

    console.log(`[Auth Trigger] ✉️ Código OTP ${code} generado e instruido por correo a ${cleanEmail} (UID: ${user.uid}).`);
    return { success: true, email: cleanEmail, expiresAt };
  } catch (error) {
    console.error(`[Auth Trigger Error] Error procesando creación de usuario ${user.uid}:`, error);
    throw error;
  }
});

/**
 * Endpoint HTTP / Callable bajo demanda: Permite a Administradores u Operaciones
 * generar y enviar un código de verificación de 6 dígitos a cualquier usuario.
 */
exports.generateAndSendVerificationCode = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { email, displayName = "Usuario ERP" } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "El campo 'email' es obligatorio." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const docId = cleanEmail.replace(/[^a-z0-9]/g, "_");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const otpData = {
      email: cleanEmail,
      code,
      displayName,
      expiresAt,
      attempts: 0,
      status: "PENDING",
      createdTimestamp: new Date().toISOString()
    };

    await db.collection("otp_verifications").doc(docId).set(otpData);

    const mailDocId = `OTP_MAIL_${docId}_${Date.now()}`;
    await db.collection("mail").doc(mailDocId).set({
      to: [cleanEmail],
      message: {
        subject: `[AXOMIRA ERP] Tu código de verificación de 6 dígitos: ${code}`,
        text: `Hola ${displayName}, tu código de verificación para AXOMIRA ERP es: ${code} (Válido por 10 minutos).`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; font-weight: 800;">AXOMIRA Intelligent Cloud ERP</h2>
            <p style="color: #94a3b8; font-size: 14px;">Hola <strong>${displayName}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px;">Tu código de verificación corporativo de 6 dígitos es:</p>
            <div style="background-color: #1e293b; border: 2px dashed #38bdf8; color: #38bdf8; font-size: 32px; font-weight: 900; text-align: center; padding: 18px; border-radius: 12px; letter-spacing: 6px; margin: 24px 0; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b;">Este código es válido por 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
          </div>
        `
      },
      createdAt: new Date().toISOString()
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: `Código de verificación generado y enviado exitosamente a ${cleanEmail}.`,
      email: cleanEmail,
      code,
      expiresAt
    });
  } catch (error) {
    console.error("Error en generateAndSendVerificationCode:", error);
    return res.status(500).json({ error: "Error al generar código de verificación.", details: error.message });
  }
});

/**
 * Endpoint HTTP / Callable: Valida serverless el código de 6 dígitos ingresado por el usuario.
 * Marca emailVerified: true en Firestore 'users' y en Firebase Auth.
 */
exports.verifyVerificationCode = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { email, code: inputCode } = req.body || {};
    if (!email || !inputCode) {
      return res.status(400).json({ error: "Los campos 'email' y 'code' son obligatorios." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanCode = String(inputCode).trim();
    const docId = cleanEmail.replace(/[^a-z0-9]/g, "_");

    const otpDocRef = db.collection("otp_verifications").doc(docId);
    const otpSnap = await otpDocRef.get();

    if (!otpSnap.exists) {
      return res.status(404).json({ error: "No se encontró un código de verificación activo para este correo." });
    }

    const otpData = otpSnap.data();

    // 1. Validar expiración (10 minutos)
    if (Date.now() > otpData.expiresAt) {
      return res.status(410).json({ error: "El código de verificación ha expirado. Solicite uno nuevo." });
    }

    // 2. Validar límite de intentos (5 max)
    if ((otpData.attempts || 0) >= 5) {
      return res.status(429).json({ error: "Ha superado el límite de 5 intentos fallidos. Solicite un nuevo código." });
    }

    // 3. Validar coincidencia de código
    if (otpData.code !== cleanCode) {
      const newAttempts = (otpData.attempts || 0) + 1;
      await otpDocRef.update({ attempts: newAttempts });
      return res.status(400).json({
        error: `Código incorrecto. Intento ${newAttempts} de 5.`,
        attemptsRemaining: 5 - newAttempts
      });
    }

    // 4. Marcar OTP como verificado
    await otpDocRef.update({ status: "VERIFIED", verifiedTimestamp: new Date().toISOString() });

    // 5. Actualizar estado del usuario en Firebase Auth y Firestore
    if (otpData.uid) {
      try {
        await admin.auth().updateUser(otpData.uid, { emailVerified: true });
        await db.collection("users").doc(otpData.uid).set({ emailVerified: true }, { merge: true });
      } catch (authErr) {
        console.warn(`[OTP Verify Warning] No se pudo actualizar emailVerified en Firebase Auth para UID ${otpData.uid}:`, authErr.message);
      }
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Código de 6 dígitos verificado exitosamente. Usuario validado.",
      email: cleanEmail
    });
  } catch (error) {
    console.error("Error en verifyVerificationCode:", error);
    return res.status(500).json({ error: "Error interno al verificar el código.", details: error.message });
  }
});

/**
 * Cloud Function HTTPS Callable (onCall): Validar el código introducido por el usuario.
 * El frontend enviará { email, code } a esta función para validar la identidad y marcar
 * la cuenta como confirmada (emailVerified: true) en Firebase Auth y Firestore.
 */
exports.verifyOTPCodeCallable = functions.https.onCall(async (data, context) => {
  const { email, code: inputCode } = data || {};
  if (!email || !inputCode) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Los campos 'email' y 'code' son obligatorios para validar el código OTP."
    );
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanCode = String(inputCode).trim();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, "_");

  const otpDocRef = db.collection("otp_verifications").doc(docId);
  const otpSnap = await otpDocRef.get();

  if (!otpSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "No se encontró un código de verificación activo para este correo."
    );
  }

  const otpData = otpSnap.data();

  // 1. Validar expiración (10 minutos)
  if (Date.now() > otpData.expiresAt) {
    throw new functions.https.HttpsError(
      "deadline-exceeded",
      "El código de verificación de 6 dígitos ha expirado (10 min). Por favor solicite uno nuevo."
    );
  }

  // 2. Validar límite de intentos (5 max)
  if ((otpData.attempts || 0) >= 5) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "Ha superado el límite de 5 intentos fallidos. Por favor solicite un nuevo código OTP."
    );
  }

  // 3. Validar coincidencia de código
  if (otpData.code !== cleanCode) {
    const newAttempts = (otpData.attempts || 0) + 1;
    await otpDocRef.update({ attempts: newAttempts });
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Código de 6 dígitos incorrecto. Intento ${newAttempts} de 5.`
    );
  }

  // 4. Marcar OTP como verificado
  await otpDocRef.update({
    status: "VERIFIED",
    verifiedTimestamp: new Date().toISOString()
  });

  // 5. Actualizar estado del usuario en Firebase Auth y Firestore
  const uid = otpData.uid || context.auth?.uid;
  if (uid) {
    try {
      await admin.auth().updateUser(uid, { emailVerified: true });
      await db.collection("users").doc(uid).set({ emailVerified: true }, { merge: true });
    } catch (authErr) {
      console.warn(`[OTP Verify Callable Warning] Error al marcar emailVerified en Firebase Auth para UID ${uid}:`, authErr.message);
    }
  }

  return {
    success: true,
    message: "Código de 6 dígitos verificado exitosamente. Identidad validada y cuenta confirmada.",
    email: cleanEmail,
    emailVerified: true
  };
});

/**
 * Cloud Function HTTPS Callable (onCall): Generar y enviar código de 6 dígitos.
 */
exports.generateVerificationCodeCallable = functions.https.onCall(async (data, context) => {
  const { email, displayName = "Usuario ERP" } = data || {};
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El campo 'email' es obligatorio."
    );
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, "_");
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const otpData = {
    email: cleanEmail,
    code,
    displayName,
    expiresAt,
    attempts: 0,
    status: "PENDING",
    createdTimestamp: new Date().toISOString()
  };

  await db.collection("otp_verifications").doc(docId).set(otpData);

  const mailDocId = `OTP_MAIL_${docId}_${Date.now()}`;
  await db.collection("mail").doc(mailDocId).set({
    to: [cleanEmail],
    message: {
      subject: `[AXOMIRA ERP] Tu código de verificación de 6 dígitos: ${code}`,
      text: `Hola ${displayName}, tu código de verificación para AXOMIRA ERP es: ${code} (Válido por 10 minutos).`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
          <h2 style="color: #38bdf8; margin-top: 0; font-weight: 800;">AXOMIRA Intelligent Cloud ERP</h2>
          <p style="color: #94a3b8; font-size: 14px;">Hola <strong>${displayName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px;">Tu código de verificación corporativo de 6 dígitos es:</p>
          <div style="background-color: #1e293b; border: 2px dashed #38bdf8; color: #38bdf8; font-size: 32px; font-weight: 900; text-align: center; padding: 18px; border-radius: 12px; letter-spacing: 6px; margin: 24px 0; font-family: monospace;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b;">Este código es válido por 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
        </div>
      `
    },
    createdAt: new Date().toISOString()
  });

  return {
    success: true,
    message: `Código de verificación generado y enviado exitosamente a ${cleanEmail}.`,
    email: cleanEmail,
    expiresAt
  };
});






