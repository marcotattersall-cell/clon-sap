/**
 * RAG Context Engine para Operam ERP / Axomira AI
 * 
 * Recupera e inyecta dinámicamente contexto en tiempo real desde el estado y la base de datos
 * del ERP (PM, MM, HCM, Flota, Compras) filtrado por el tenant activo.
 */

export const extractRAGContext = (query = '', erpState = {}) => {
  // Normalizar acentos y minúsculas para matching perfecto (ej: órdenes -> ordenes)
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const {
    workOrders = [],
    materials = [],
    employees = [],
    assets = [],
    purchaseOrders = [],
    activeTenant = 'tenant_demo'
  } = erpState;

  const retrievedFacts = [];
  const intentSummary = [];
  let targetTab = null;
  let tabLabel = null;
  let actionType = null;
  let actionLabel = null;

  const now = new Date();

  // Helper para días hasta fecha
  const daysUntil = (dateStr) => {
    if (!dateStr) return 999;
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // 1. MÓDULO PM: Órdenes de Trabajo y Mantenimiento
  const highPriorityWO = workOrders.filter(w => w.priority === 'Muy Alta' || w.priority === 'Alta');
  const openWO = workOrders.filter(w => w.status !== 'TECO' && w.status !== 'CLSD');
  const pendingAssign = workOrders.filter(w => !w.assignedTo || w.assignedTo === 'Sin Asignar');

  if (q.includes('orden') || q.includes('ot') || q.includes('pm') || q.includes('mantenimiento') || q.includes('crítica') || q.includes('falla') || q.includes('taller')) {
    intentSummary.push('Mantenimiento PM & Órdenes de Trabajo');
    targetTab = 'WORK_ORDERS';
    tabLabel = 'Ir al Módulo de Órdenes PM (#mnt-ordenes)';

    retrievedFacts.push({
      category: 'PM_WORK_ORDERS',
      summary: `Total órdenes abiertas: ${openWO.length} | Órdenes prioridad Alta/Muy Alta: ${highPriorityWO.length} | Sin Asignar: ${pendingAssign.length}`,
      details: highPriorityWO.slice(0, 5).map(w => ({
        id: w.id,
        title: w.title,
        priority: w.priority,
        status: w.status,
        equipmentId: w.equipmentId || 'General',
        assignedTo: w.assignedTo || 'Sin Asignar'
      }))
    });
  }

  // 2. MÓDULO MM: Materiales, Stock & MIGO
  const lowStockMaterials = materials.filter(m => Number(m.stock) <= Number(m.reorderPoint));
  const totalMaterialValuation = materials.reduce((acc, m) => acc + (Number(m.stock || 0) * Number(m.price || 0)), 0);

  if (q.includes('stock') || q.includes('material') || q.includes('migo') || q.includes('reorden') || q.includes('repuesto') || q.includes('inventario') || q.includes('almacen')) {
    intentSummary.push('Gestión de Materiales MM & Almacén');
    targetTab = 'INVENTORY';
    tabLabel = 'Ver Maestro de Materiales MM (#inv-materiales)';

    retrievedFacts.push({
      category: 'MM_INVENTORY',
      summary: `Materiales bajo punto de reorden: ${lowStockMaterials.length} de ${materials.length} SKUs | Valorización total de stock: $${totalMaterialValuation.toLocaleString('es-CL')} CLP`,
      details: lowStockMaterials.slice(0, 5).map(m => ({
        id: m.id,
        name: m.name,
        stock: m.stock,
        reorderPoint: m.reorderPoint,
        unit: m.unit || 'UND',
        location: m.location || 'Bodega Principal'
      }))
    });
  }

  // 3. MÓDULO HCM: Personal, Acreditaciones & Exámenes
  const expiringEmployees = employees.filter(e => {
    const medDays = daysUntil(e.medicalExamExpiry);
    const accDays = daysUntil(e.accreditationExpiry);
    return medDays <= 30 || accDays <= 30;
  });

  if (q.includes('acreditacion') || q.includes('personal') || q.includes('empleado') || q.includes('rrhh') || q.includes('vencimiento') || q.includes('examen') || q.includes('hcm')) {
    intentSummary.push('Recursos Humanos HCM & Acreditaciones');
    targetTab = 'HR';
    tabLabel = 'Ir a Fichas de Personal (#rrhh-personal)';

    retrievedFacts.push({
      category: 'HCM_CREDENTIALS',
      summary: `Colaboradores con acreditaciones/exámenes por vencer (<30 días): ${expiringEmployees.length} de ${employees.length}`,
      details: expiringEmployees.slice(0, 5).map(e => ({
        id: e.id,
        name: e.name,
        position: e.position || 'Técnico',
        medicalExpiry: e.medicalExamExpiry,
        accreditationExpiry: e.accreditationExpiry
      }))
    });
  }

  // 4. MÓDULO FLOTA / ACTIVOS: Telemetría & Salud de Maquinaria
  const maintenanceAssets = assets.filter(a => a.status === 'MAINTENANCE' || a.status === 'DOWN');
  const criticalHealthAssets = assets.filter(a => Number(a.healthScore) < 70);

  if (q.includes('equipo') || q.includes('activo') || q.includes('flota') || q.includes('maquinaria') || q.includes('chancador') || q.includes('salud') || q.includes('pdm')) {
    intentSummary.push('Gestión de Activos Flota & Telemetría PdM');
    targetTab = 'ASSETS';
    tabLabel = 'Ver Jerarquía de Activos (#flota-activos)';

    retrievedFacts.push({
      category: 'ASSET_HEALTH',
      summary: `Equipos en mantenimiento/detenidos: ${maintenanceAssets.length} | Equipos con score de salud crítico (<70%): ${criticalHealthAssets.length}`,
      details: assets.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        healthScore: a.healthScore ?? 100,
        type: a.type || 'Maquinaria Pesada'
      }))
    });
  }

  // 5. REPORTES & BI / EXPORTACIÓN
  if (q.includes('reporte') || q.includes('informe') || q.includes('pdf') || q.includes('excel') || q.includes('bi') || q.includes('exportar')) {
    intentSummary.push('Generación de Reportes Ejecutivos BI');
    actionType = 'OPEN_REPORT_MODAL';
    actionLabel = '📄 Abrir Generador de Reportes BI';
  }

  // 6. RAG FALLBACK AMPLIO (Si la consulta no hizo match exacto con palabras clave)
  if (retrievedFacts.length === 0) {
    intentSummary.push('Resumen General ERP Multi-Tenant');
    retrievedFacts.push({
      category: 'ERP_GENERAL_SNAPSHOT',
      summary: `Tenant: ${activeTenant} | Órdenes Abiertas: ${openWO.length} (${highPriorityWO.length} Críticas) | SKUs bajo Reorden: ${lowStockMaterials.length} | Acreditaciones RIESGO: ${expiringEmployees.length} | Equipos en Taller: ${maintenanceAssets.length}`
    });
  }

  // Formatear payload final de contexto RAG
  const contextText = `
=== CONTEXTO ERP RAG RECUPERADO [Tenant: ${activeTenant}] ===
Sub-Sistemas Analizados: ${intentSummary.join(', ')}

${retrievedFacts.map(fact => `
[${fact.category}]
Resumen: ${fact.summary}
${fact.details ? `Detalles Relevantes:\n${JSON.stringify(fact.details, null, 2)}` : ''}
`).join('\n')}
===========================================================
`.trim();

  return {
    contextText,
    intentSummary,
    retrievedFacts,
    targetTab,
    tabLabel,
    actionType,
    actionLabel,
    factCount: retrievedFacts.length
  };
};
