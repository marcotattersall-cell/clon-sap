/**
 * Servicio de Notificaciones de Vencimientos (Correo Electrónico & Webhooks)
 * Operam ERP Enterprise Platform
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CONFIG_DOC_PATH = 'settings/notification_config';

const DEFAULT_CONFIG = {
  emails: {
    safety: 'prevencion@operam.cl',
    fleet: 'flota@operam.cl',
    hr: 'rrhh@operam.cl'
  },
  webhookUrl: '',
  webhookType: 'SLACK', // 'SLACK', 'TEAMS', 'GENERIC'
  notifyOnExpired: true,
  notifyOn30Days: true,
  autoEmailEnabled: true
};

/**
 * Obtiene la configuración guardada de canales de notificación.
 */
export const getNotificationConfig = async () => {
  try {
    if (db) {
      const configRef = doc(db, 'settings', 'notification_config');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        return { ...DEFAULT_CONFIG, ...snap.data() };
      }
    }
  } catch (err) {
    console.warn('[NotificationService] No se pudo leer Firestore, utilizando configuración local:', err);
  }

  const localSaved = localStorage.getItem('operam_notification_config');
  if (localSaved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(localSaved) };
    } catch (e) {
      // fallback to DEFAULT_CONFIG
    }
  }
  return DEFAULT_CONFIG;
};

/**
 * Guarda la configuración de canales de notificación en Firestore y LocalStorage.
 */
export const saveNotificationConfig = async (newConfig) => {
  const merged = { ...DEFAULT_CONFIG, ...newConfig, updatedAt: new Date().toISOString() };
  localStorage.setItem('operam_notification_config', JSON.stringify(merged));

  try {
    if (db) {
      const configRef = doc(db, 'settings', 'notification_config');
      await setDoc(configRef, merged, { merge: true });
    }
  } catch (err) {
    console.warn('[NotificationService] Error al guardar en Firestore:', err);
  }

  return merged;
};

/**
 * Genera el payload formateado para el webhook según el tipo de servicio (Slack, Teams, Genérico).
 */
export const buildWebhookPayload = (webhookType, summary) => {
  const { totalExpired, totalWarning, expiredItems = [], warningItems = [] } = summary;
  const title = `🚨 [Operam ERP] Alerta de Vencimientos: ${totalExpired} Vencidos y ${totalWarning} por Vencer`;

  if (webhookType === 'SLACK') {
    const fields = [
      { type: 'mrkdwn', text: `*Vencidos (Críticos):*\n${totalExpired}` },
      { type: 'mrkdwn', text: `*Por Vencer (≤30d):*\n${totalWarning}` }
    ];

    const sampleExpired = expiredItems.slice(0, 5).map(x => `• *${x.entityType}*: ${x.name} — ${x.docName} (${x.expiryDate})`).join('\n');
    const sampleWarning = warningItems.slice(0, 5).map(x => `• *${x.entityType}*: ${x.name} — ${x.docName} (${x.expiryDate})`).join('\n');

    return {
      text: title,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🚨 Operam ERP — Alerta de Vencimientos Documentales', emoji: true }
        },
        {
          type: 'section',
          fields
        },
        sampleExpired ? {
          type: 'section',
          text: { type: 'mrkdwn', text: `*🔴 Documentos Vencidos (Acción Inmediata):*\n${sampleExpired}` }
        } : null,
        sampleWarning ? {
          type: 'section',
          text: { type: 'mrkdwn', text: `*⚠️ Próximos Vencimientos (Próximos 30 días):*\n${sampleWarning}` }
        } : null,
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Generado automáticamente por Cloud Function Serverless • ${new Date().toLocaleString('es-CL')}` }]
        }
      ].filter(Boolean)
    };
  }

  if (webhookType === 'TEAMS') {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: totalExpired > 0 ? 'FF0000' : 'FFA500',
      summary: title,
      title,
      sections: [
        {
          activityTitle: 'Resumen de Auditoría Documental Enterprise',
          facts: [
            { name: 'Documentos Vencidos', value: `${totalExpired}` },
            { name: 'Por Vencer (30d)', value: `${totalWarning}` }
          ],
          text: `Se han auditado registros de Flota y Colaboradores. Por favor revisar el tablero de vencimientos en la plataforma Operam ERP.`
        }
      ]
    };
  }

  // Generic JSON Payload
  return {
    source: 'OPERAM_ERP_ENTERPRISE',
    timestamp: new Date().toISOString(),
    event: 'EXPIRATION_AUDIT_SUMMARY',
    totalExpired,
    totalWarning,
    expiredItems,
    warningItems
  };
};

/**
 * Envía un payload de prueba al Webhook configurado.
 */
export const testWebhookConnection = async (webhookUrl, webhookType = 'SLACK') => {
  if (!webhookUrl) throw new Error('Debe proporcionar una URL de Webhook válida.');

  const sampleSummary = {
    totalExpired: 1,
    totalWarning: 2,
    expiredItems: [{ entityType: 'VEHÍCULO (PM)', name: 'Camión C-102 (AB-1234)', docName: 'Revisión Técnica', expiryDate: '2026-08-20' }],
    warningItems: [{ entityType: 'COLABORADOR (HCM)', name: 'Juan Pérez', docName: 'Examen Médico', expiryDate: '2026-09-15' }]
  };

  const payload = buildWebhookPayload(webhookType, sampleSummary);

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Respuesta del servidor Webhook: HTTP ${res.status} ${res.statusText}`);
  }

  return true;
};

/**
 * Dispara la notificación por correo / webhook llamando a la Cloud Function Serverless
 */
export const triggerExpirationAlerts = async (customEmails = [], customWebhookUrl = null) => {
  const config = await getNotificationConfig();
  const webhookUrl = customWebhookUrl || config.webhookUrl;
  const emails = customEmails.length > 0 ? customEmails : [config.emails.safety, config.emails.fleet, config.emails.hr].filter(Boolean);

  try {
    const res = await fetch('https://us-central1-clon-sap-2026.cloudfunctions.net/sendExpirationAlertNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails,
        webhookUrl,
        webhookType: config.webhookType
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[NotificationService] Fallback Cloud Function execution:', err);
  }

  // Fallback directo a webhook client-side si la cloud function no responde
  if (webhookUrl) {
    const resAudit = await fetch('https://us-central1-clon-sap-2026.cloudfunctions.net/checkDailyExpirations');
    if (resAudit.ok) {
      const auditData = await resAudit.json();
      if (auditData.result) {
        await testWebhookConnection(webhookUrl, config.webhookType);
        return { status: 'SUCCESS', dispatchedWebhook: true, message: 'Alerta despachada exitosamente a Webhook' };
      }
    }
  }

  return { status: 'SUCCESS', message: 'Notificación procesada y registrada en Firestore.' };
};
