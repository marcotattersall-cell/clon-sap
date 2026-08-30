/**
 * Servicio de Auditoría y Notificaciones para Órdenes de Trabajo Estancadas (>24 Horas)
 * AXOMIRA INTELLIGENT CLOUD ERP Platform
 */


import { getNotificationConfig, testWebhookConnection, buildWebhookPayload } from './expirationNotificationService';

/**
 * Calcula las horas transcurridas desde la creación / inicio de una Orden de Trabajo.
 */
export const getWorkOrderAgeHours = (wo) => {
  if (!wo || !wo.startDate) return 0;
  const now = Date.now();
  const start = new Date(wo.startDate).getTime();
  if (isNaN(start)) return 0;
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60)));
};

/**
 * Evalúa si una Orden de Trabajo está estancada (> 24 horas abierta sin cerrar).
 */
export const isWorkOrderStale = (wo) => {
  if (!wo) return false;
  const closedStatuses = ['TECO', 'CLSD', 'CERRADA', 'COMPLETADA', 'CANCELADA'];
  const isClosed = closedStatuses.includes(String(wo.status || '').toUpperCase());
  if (isClosed) return false;

  const ageHours = getWorkOrderAgeHours(wo);
  return ageHours >= 24;
};

/**
 * Filtra la lista de Órdenes de Trabajo estancadas (> 24 horas).
 */
export const getStaleWorkOrdersList = (workOrders = []) => {
  return workOrders
    .filter(isWorkOrderStale)
    .map(wo => ({
      ...wo,
      ageHours: getWorkOrderAgeHours(wo)
    }))
    .sort((a, b) => b.ageHours - a.ageHours);
};

/**
 * Invoca el despacho de notificaciones a correo y Webhooks para OTs estancadas.
 */
export const triggerStaleWorkOrderAlerts = async (workOrders = []) => {
  const config = await getNotificationConfig();
  const staleWOs = getStaleWorkOrdersList(workOrders);

  try {
    const res = await fetch('https://us-central1-clon-sap-2026.cloudfunctions.net/sendStaleWorkOrderAlertNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: [config.emails?.safety, config.emails?.fleet, config.emails?.hr].filter(Boolean),
        webhookUrl: config.webhookUrl,
        webhookType: config.webhookType,
        staleCount: staleWOs.length
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[StaleWOService] Fallback ejecución local de webhook:', err);
  }

  // Fallback directo a webhook si la cloud function no está desplegada en local
  if (config.webhookUrl && staleWOs.length > 0) {
    const sampleSummary = {
      totalExpired: staleWOs.length,
      totalWarning: 0,
      expiredItems: staleWOs.slice(0, 5).map(wo => ({
        entityType: `OT ${wo.type || 'PM02'} (${wo.priority || 'Alta'})`,
        name: `${wo.id} - ${wo.title || 'Orden de Trabajo'}`,
        docName: `Abierta hace ${wo.ageHours} horas (Asignado: ${wo.assignedTech || 'Técnico'})`,
        expiryDate: wo.startDate || 'N/A'
      }))
    };

    const payload = buildWebhookPayload(config.webhookType, sampleSummary);
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.error('Error fallback webhook:', e));

    return {
      status: 'SUCCESS',
      message: `Alertas enviadas a Webhook corporativo para ${staleWOs.length} Órdenes de Trabajo estancadas (>24h).`
    };
  }

  return {
    status: 'SUCCESS',
    message: `Procesada auditoría de ${staleWOs.length} Órdenes de Trabajo estancadas (>24h).`
  };
};
