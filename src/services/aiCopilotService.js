/**
 * Servicio de Copiloto Axomira AI con integración RAG & Gemini API
 * 
 * Gestiona el razonamiento sintético, la llamada a Gemini LLM y la inyección
 * de hechos de negocio recuperados en tiempo real desde el ERP.
 */

import { extractRAGContext } from './ragContextEngine';

const GEMINI_API_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY || '') : '';
const GEMINI_MODEL = 'gemini-1.5-flash';

const SYSTEM_INSTRUCTION = `
Eres el Copiloto Axomira AI de Operam ERP (Sistema de Gestión Minera e Industrial SAP Clone 2026).
Tu objetivo es responder las consultas del usuario de forma profesional, concisa, precisa y estructurada en formato Markdown.

Reglas del sistema:
1. Grounding RAG: Basa tus afirmaciones cuantitativas únicamente en el CONTEXTO ERP RAG RECUPERADO adjunto.
2. Si el contexto contiene números exactos (órdenes críticas, materiales bajo reorden, vencimientos HCM, horas de equipos), menciónalos explícitamente.
3. Sugiere soluciones transaccionales prácticas (ej. liberar MIGO 261, programar mantención preventiva en PM, renovar acreditaciones HCM en faena).
4. Mantén un tono técnico pero accesible, orientado a gerentes de operaciones, Jefes de Mantención y Bodegueros ERP.
5. Utiliza listas con viñetas y negritas para resaltar indicadores clave.
`.trim();

export const queryAICopilot = async (userQuery = '', erpState = {}, conversationHistory = []) => {
  const ragResult = extractRAGContext(userQuery, erpState);

  // Intentar llamada a Gemini API si existe API Key configurada
  if (GEMINI_API_KEY) {
    try {
      const contents = [
        {
          role: 'user',
          parts: [
            { text: `${SYSTEM_INSTRUCTION}\n\n${ragResult.contextText}\n\nPregunta del Usuario: ${userQuery}` }
          ]
        }
      ];

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          return {
            text: responseText,
            targetTab: ragResult.targetTab,
            tabLabel: ragResult.tabLabel,
            actionType: ragResult.actionType,
            actionLabel: ragResult.actionLabel,
            ragFactsUsed: ragResult.factCount,
            intentSummary: ragResult.intentSummary,
            isGeminiPowered: true
          };
        }
      }
    } catch (err) {
      console.warn('[AICopilotService] Fallback a motor sintético RAG por error de conexión Gemini:', err.message);
    }
  }

  // Motor Sintético RAG (Fallback Inteligente de Alta Fidelidad sin API Key)
  const q = userQuery.toLowerCase();
  let text = '';

  if (ragResult.actionType === 'OPEN_REPORT_MODAL') {
    text = `📄 **Motor de Reportes Ejecutivos BI Activado (RAG Grounded):**\n\nHay datos procesables recuperados del sistema ERP:\n• **Contexto Recuperado:** ${ragResult.intentSummary.join(', ')}\n• **KPIs Auditoría:** Se han condensado los módulos transaccionales en un reporte imprimible y exportable en Excel/PDF.`;
  } else if (ragResult.targetTab === 'WORK_ORDERS') {
    const pmFact = ragResult.retrievedFacts.find(f => f.category === 'PM_WORK_ORDERS');
    const details = pmFact?.details || [];
    text = `📊 **Diagnóstico RAG - Mantenimiento PM (En Vivo):**\n\n${pmFact?.summary || 'Analizando estado de órdenes PM'}.\n\nÓrdenes prioritarias detectadas:\n${details.length > 0 ? details.map(w => `• **${w.id}**: ${w.title} (Prioridad: *${w.priority}* | Asignado: *${w.assignedTo}*)`).join('\n') : '• No hay órdenes críticas en estado abierto.'}`;
  } else if (ragResult.targetTab === 'INVENTORY') {
    const mmFact = ragResult.retrievedFacts.find(f => f.category === 'MM_INVENTORY');
    const details = mmFact?.details || [];
    text = `📦 **Diagnóstico RAG - Auditoría de Almacén MM (MIGO):**\n\n${mmFact?.summary || 'Analizando stock de repuestos'}.\n\nMateriales bajo el punto de reorden:\n${details.length > 0 ? details.map(m => `• **${m.id}**: ${m.name} — Stock: **${m.stock} ${m.unit}** (Mínimo: ${m.reorderPoint} ${m.unit})`).join('\n') : '• Todo el inventario se encuentra sobre el stock de seguridad.'}`;
  } else if (ragResult.targetTab === 'HR') {
    const hcmFact = ragResult.retrievedFacts.find(f => f.category === 'HCM_CREDENTIALS');
    const details = hcmFact?.details || [];
    text = `👷 **Diagnóstico RAG - Cumplimiento HCM & Acreditaciones Faena:**\n\n${hcmFact?.summary || 'Analizando personal y acreditaciones'}.\n\nColaboradores con vencimiento crítico (<30 días):\n${details.length > 0 ? details.map(e => `• **${e.name}** (${e.position}) — Vence Acreditación/Examen: *${e.accreditationExpiry || e.medicalExpiry}*`).join('\n') : '• Todo el personal cuenta con acreditaciones al día.'}`;
  } else if (ragResult.targetTab === 'ASSETS') {
    const assetFact = ragResult.retrievedFacts.find(f => f.category === 'ASSET_HEALTH');
    const details = assetFact?.details || [];
    text = `🚜 **Diagnóstico RAG - Telemetría & Disponibilidad de Flota:**\n\n${assetFact?.summary || 'Analizando parque de activos'}.\n\nEstado de la flota principal:\n${details.length > 0 ? details.map(a => `• **${a.id}**: ${a.name} — Salud: **${a.healthScore}%** (Estado: *${a.status}*)`).join('\n') : '• Todos los equipos clave están operativos.'}`;
  } else {
    text = `🤖 **Respuesta Asistida por RAG (ERP Axomira AI):**\n\nAnalicé los registros transaccionales del tenant activo. No detecté anomalías críticas específicas para *"${userQuery}"*, pero puedo asistirte en:\n\n• **PM**: Monitoreo de Mantenimiento Preventivo y Correctivo\n• **MM**: MIGO 261 / 101 y Control de Stock Mínimo\n• **HCM**: Acreditaciones de Minería y Control de Exámenes\n• **Flota**: Telemetría de Maquinaria y MTBF/MTTR`;
  }

  return {
    text,
    targetTab: ragResult.targetTab,
    tabLabel: ragResult.tabLabel,
    actionType: ragResult.actionType,
    actionLabel: ragResult.actionLabel,
    ragFactsUsed: ragResult.factCount,
    intentSummary: ragResult.intentSummary,
    isGeminiPowered: false
  };
};
