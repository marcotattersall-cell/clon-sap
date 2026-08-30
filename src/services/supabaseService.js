import { supabase } from '../supabase/config';
import { updateVectorClock } from './crdtSyncService';

export const DEFAULT_TENANT_ID = 'tenant_demo';

/**
 * Mapeo entre nombres de colecciones en la App y nombres de tablas en Supabase PostgreSQL
 */
export const tableNameMap = {
  plants: 'plants',
  materials: 'materials',
  assets: 'assets',
  notifications: 'notifications',
  workOrders: 'work_orders',
  purchaseOrders: 'purchase_orders',
  migoDocuments: 'migo_documents',
  employees: 'employees',
  absences: 'absences',
  payrollRuns: 'payroll_runs',
  auditLogs: 'audit_logs',
  telemetryLogs: 'telemetry_logs',
  users: 'users',
  tenants: 'tenants'
};

export const getTableName = (collectionName) => {
  return tableNameMap[collectionName] || collectionName.toLowerCase();
};

/**
 * Mapeador de campos planos de objetos JS a columnas relacionales de PostgreSQL
 */
export const mapDataToRelationalColumns = (data) => {
  const rel = {};
  if (!data || typeof data !== 'object') return rel;

  // Foreign keys
  if (data.equipmentId) rel.equipment_id = data.equipmentId;
  if (data.materialId) rel.material_id = data.materialId;
  if (data.plantId) rel.plant_id = data.plantId;
  if (data.employeeId) rel.employee_id = data.employeeId;

  // General fields
  if (data.name) rel.name = data.name;
  if (data.title) rel.title = data.title;
  if (data.status) rel.status = data.status;
  if (data.type) rel.type = data.type;
  if (data.category) rel.category = data.category;
  if (data.location) rel.location = data.location;

  // Assets
  if (data.healthScore !== undefined) rel.health_score = Number(data.healthScore);
  if (data.hourmeter !== undefined) rel.hourmeter = Number(data.hourmeter);
  if (data.odometer !== undefined) rel.odometer = Number(data.odometer);
  if (data.model) rel.model = data.model;
  if (data.serialNumber) rel.serial_number = data.serialNumber;

  // Materials & Quantities
  if (data.stock !== undefined) rel.stock = Number(data.stock);
  if (data.unitPrice !== undefined) rel.unit_price = Number(data.unitPrice);
  if (data.unit) rel.unit = data.unit;
  if (data.storageLocation) rel.storage_location = data.storageLocation;
  if (data.qty !== undefined) rel.qty = Number(data.qty);
  if (data.movementType) rel.movement_type = data.movementType;
  if (data.refDocument) rel.ref_document = data.refDocument;

  // Financials & Work Orders
  if (data.plannedCost !== undefined) rel.planned_cost = Number(data.plannedCost);
  if (data.actualCost !== undefined) rel.actual_cost = Number(data.actualCost);
  if (data.plannedHours !== undefined) rel.planned_hours = Number(data.plannedHours);
  if (data.actualHours !== undefined) rel.actual_hours = Number(data.actualHours);
  if (data.totalAmount !== undefined || data.totalCost !== undefined) {
    rel.total_cost = Number(data.totalAmount || data.totalCost || 0);
  }
  if (data.vendor) rel.vendor = data.vendor;

  // Employees & HCM
  if (data.rut) rel.rut = data.rut;
  if (data.days !== undefined) rel.days = Number(data.days);
  if (data.period) rel.period = data.period;
  if (data.baseSalary !== undefined) rel.base_salary = Number(data.baseSalary);
  if (data.totalNet !== undefined) rel.total_net = Number(data.totalNet);

  // Telemetry & Audit
  if (data.engineTemp !== undefined) rel.engine_temp = Number(data.engineTemp);
  if (data.vibrationRms !== undefined) rel.vibration_rms = Number(data.vibrationRms);
  if (data.entityType) rel.entity_type = data.entityType;
  if (data.entityId) rel.entity_id = data.entityId;
  if (data.action) rel.action = data.action;
  if (data.user) rel.user_name = data.user;

  return rel;
};

/**
 * Suscribe a una colección de Supabase con cambios en tiempo real filtrada por Tenant.
 */
export const subscribeCollection = (collectionName, onUpdate, onError, constraints = [], tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  const tableName = getTableName(collectionName);

  // 1. Obtener datos iniciales de la tabla para este tenant
  const fetchInitialData = async () => {
    try {
      let query = supabase
        .from(tableName)
        .select('*');

      if (tableName !== 'users') {
        query = query.eq('tenant_id', activeTenant);
      }

      const { data, error } = await query;
      if (error) {
        console.warn(`[Supabase fetchInitialData] Error consultando ${tableName}:`, error.message);
        onUpdate([]);
        if (onError) onError(error);
        return;
      }

      const items = (data || []).map(row => ({
        ...(row.data || {}),
        id: row.id,
        tenantId: row.tenant_id || activeTenant
      }));

      onUpdate(items);
    } catch (err) {
      console.warn(`[Supabase Multi-Tenant] Error leyendo ${tableName} (${activeTenant}):`, err);
      onUpdate([]);
      if (onError) onError(err);
    }
  };

  fetchInitialData();

  // 2. Crear canal de tiempo real para escuchar eventos INSERT, UPDATE y DELETE
  const channelName = `realtime_${tableName}_${activeTenant}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: tableName !== 'users' ? `tenant_id=eq.${activeTenant}` : undefined
      },
      () => {
        fetchInitialData();
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIPTION_ERROR' && onError) {
        onError(err || new Error(`Error suscribiendo a ${tableName}`));
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Interceptor de Seguridad de Esquema (Schema Guard Protection - Error 42703 / 42P01)
 * Maneja desviaciones de esquema en Supabase PostgreSQL limpiando columnas no existentes
 * y respaldando los datos en la columna data (JSONB).
 */
const safeUpsertWithSchemaGuard = async (tableName, payload, options = { onConflict: 'id' }) => {
  const { error } = await supabase.from(tableName).upsert(payload, options);

  if (error) {
    // Error 42703: undefined_column | Error 42P01: undefined_table
    if (error.code === '42703' || error.message?.includes('column') || error.code === 'PGRST204') {
      console.warn(`[Schema Guard Protection] Columna no existente en ${tableName} (${error.message}). Reejecutando con respaldo en data (JSONB)...`);
      
      // Fallback seguro: Usar únicamente el contrato base (id, tenant_id, data, updated_at)
      const safeFallbackPayload = {
        id: payload.id,
        tenant_id: payload.tenant_id,
        data: payload.data,
        updated_at: payload.updated_at || new Date().toISOString()
      };

      const { error: fallbackError } = await supabase
        .from(tableName)
        .upsert(safeFallbackPayload, options);

      if (fallbackError) {
        console.error(`[Schema Guard Fallback Error en ${tableName}]`, fallbackError);
        throw fallbackError;
      }
      return true;
    }
    throw error;
  }
  return true;
};

/**
 * Guarda o actualiza un documento en Supabase aislado por Tenant con Schema Guard Protection.
 */
export const upsertDocument = async (collectionName, docId, data, userId = 'OPERATOR', tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || data.tenantId || DEFAULT_TENANT_ID;
  const tableName = getTableName(collectionName);
  const id = String(docId || data.id || `doc-${Date.now()}`);

  try {
    const modifiedFields = Object.keys(data);
    const enrichedData = updateVectorClock({ ...data, id, tenantId: activeTenant }, userId, modifiedFields);

    const relColumns = mapDataToRelationalColumns(data);

    const payload = {
      id,
      tenant_id: activeTenant,
      data: enrichedData,
      updated_at: new Date().toISOString(),
      ...relColumns
    };

    if (tableName === 'users') {
      delete payload.tenant_id;
      payload.email = data.email || '';
      payload.display_name = data.displayName || '';
      payload.company_name = data.companyName || '';
      payload.tenant_id = activeTenant;
      payload.role = data.role || 'MAINTENANCE_MGR';
      payload.plant = data.plant || '0001 (Planta Central)';
    }

    return await safeUpsertWithSchemaGuard(tableName, payload, { onConflict: 'id' });
  } catch (err) {
    console.error(`[Supabase Service Multi-Tenant] Error guardando en ${tableName} (${activeTenant}):`, err);
    return false;
  }
};

/**
 * Elimina un documento de Supabase para un Tenant específico.
 */
export const deleteDocument = async (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  const tableName = getTableName(collectionName);

  try {
    let query = supabase.from(tableName).delete().eq('id', String(docId));
    if (tableName !== 'users') {
      query = query.eq('tenant_id', activeTenant);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`[Supabase Service Multi-Tenant] Error eliminando en ${tableName} (${activeTenant}):`, err);
    return false;
  }
};

/**
 * Puebla la tabla con datos iniciales si está vacía para el Tenant especificado.
 */
export const seedCollectionIfEmpty = async (collectionName, defaultItems = [], tenantId = DEFAULT_TENANT_ID) => {
  if (!Array.isArray(defaultItems) || defaultItems.length === 0) return;
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  const tableName = getTableName(collectionName);

  try {
    let query = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    if (tableName !== 'users') {
      query = query.eq('tenant_id', activeTenant);
    }

    const { count, error } = await query;

    if (!error && (count === 0 || count === null)) {
      console.log(`[Supabase Tenant Seed] Sembrando '${tableName}' para Tenant '${activeTenant}' (${defaultItems.length} registros)...`);
      
      const rowsToInsert = defaultItems.map(item => {
        const id = String(item.id || item.documentId || `seed-${Date.now()}-${Math.random()}`);
        const relColumns = mapDataToRelationalColumns(item);
        return {
          id,
          tenant_id: activeTenant,
          data: { ...item, id, tenantId: activeTenant },
          updated_at: new Date().toISOString(),
          ...relColumns
        };
      });

      const { error: seedErr } = await supabase
        .from(tableName)
        .upsert(rowsToInsert, { onConflict: 'id' });

      if (seedErr) {
        console.warn(`[Supabase Seed Warning ${tableName}]`, seedErr.message);
      }
    }
  } catch (err) {
    console.warn(`[Supabase Tenant Seed] No se pudo verificar o sembrar datos en ${collectionName} (${activeTenant}):`, err);
  }
};

/**
 * Ejecuta una transacción atómica MIGO de movimiento de mercancías en Supabase.
 */
export const executeAtomicGoodsMovement = async ({
  movementType,
  materialId,
  qty,
  storageLocation,
  targetStorageLocation,
  refDocument,
  currentUser,
  tenantId = DEFAULT_TENANT_ID
}) => {
  const activeTenant = tenantId || currentUser?.tenantId || DEFAULT_TENANT_ID;
  const quantity = Number(qty);

  try {
    // 1. Obtener documento del material
    const { data: matRow, error: matErr } = await supabase
      .from('materials')
      .select('*')
      .eq('id', String(materialId))
      .eq('tenant_id', activeTenant)
      .single();

    if (matErr || !matRow) {
      throw new Error(`El material SKU ${materialId} no existe en el maestro de Supabase (${activeTenant}).`);
    }

    const matData = matRow.data || {};
    const currentStock = Number(matRow.stock !== undefined ? matRow.stock : (matData.stock || 0));

    if (quantity <= 0 || !isFinite(quantity) || isNaN(quantity)) {
      throw new Error('La cantidad ingresada debe ser un número entero positivo válido.');
    }

    if (movementType === '261' && currentStock < quantity) {
      throw new Error(`STOCK INSUFICIENTE MIGO: ${currentStock} ${matData.unit || 'UN'} disponibles vs ${quantity} solicitadas.`);
    }

    // 2. Calcular nuevo stock y aplicar salvaguarda de no-negatividad
    let newStock = currentStock;
    if (movementType === '101') newStock += quantity;
    if (movementType === '261') newStock -= quantity;

    if (newStock < 0) {
      throw new Error(`VIOLACIÓN DE INTEGRIDAD SAP: El movimiento MIGO dejaría el stock en negativo (${newStock}). Transacción abortada.`);
    }

    // 3. Actualizar material con Bloqueo de Concurrencia Optimista (Conditional Atomic Update)
    const updatedMatData = { ...matData, stock: newStock, updatedAt: new Date().toISOString() };
    
    let updateQuery = supabase
      .from('materials')
      .update({
        stock: newStock,
        data: updatedMatData,
        updated_at: new Date().toISOString()
      })
      .eq('id', String(materialId))
      .eq('tenant_id', activeTenant);

    // Para salidas (MIGO 261), exigir atómicamente que el stock actual siga siendo >= quantity
    if (movementType === '261') {
      updateQuery = updateQuery.gte('stock', quantity);
    }

    const { data: updatedRows, error: updateErr } = await updateQuery.select();

    if (updateErr || !updatedRows || updatedRows.length === 0) {
      throw new Error(`CONDICIÓN DE CARRERA PREVENIDA: El stock de ${materialId} fue modificado por otra transacción en paralelo. Transacción MIGO abortada para proteger el balance.`);
    }
    const migoId = `MIGO-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newMigoDoc = {
      id: migoId,
      documentId: migoId,
      movementType,
      materialId,
      materialName: matData.name || matRow.name,
      qty: quantity,
      unit: matData.unit || matRow.unit || 'UN',
      storageLocation: storageLocation || '0001',
      targetStorageLocation: targetStorageLocation || null,
      refDocument: refDocument || 'N/A',
      timestamp: new Date().toISOString(),
      user: currentUser?.displayName || currentUser?.email || 'Operador Axomira ERP',
      tenantId: activeTenant
    };

    await upsertDocument('migoDocuments', migoId, newMigoDoc, 'MIGO_ENGINE', activeTenant);

    // 5. Actualizar Pedido de Compra si es MIGO 101
    if (movementType === '101' && refDocument) {
      const { data: poRow } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', String(refDocument))
        .eq('tenant_id', activeTenant)
        .single();

      if (poRow) {
        const poData = poRow.data || {};
        await upsertDocument('purchaseOrders', refDocument, {
          ...poData,
          status: 'Recibido / Entregado',
          updatedAt: new Date().toISOString()
        }, 'MIGO_ENGINE', activeTenant);
      }
    }

    // 6. Actualizar Orden de Trabajo si es MIGO 261
    if (movementType === '261' && refDocument) {
      const { data: woRow } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', String(refDocument))
        .eq('tenant_id', activeTenant)
        .single();

      if (woRow) {
        const woData = woRow.data || {};
        const components = Array.isArray(woData.components) ? [...woData.components] : [];
        const matchedIndex = components.findIndex(c => c.materialId === materialId);

        if (matchedIndex >= 0) {
          components[matchedIndex] = {
            ...components[matchedIndex],
            qtyIssued: Number(components[matchedIndex].qtyIssued || 0) + quantity
          };
        } else {
          components.push({
            materialId,
            description: matData.name || matRow.name,
            qtyPlanned: quantity,
            qtyIssued: quantity,
            unit: matData.unit || 'UN',
            unitPrice: matData.unitPrice || 100
          });
        }

        const totalCost = Number(woData.actualCost || 0) + (quantity * Number(matData.unitPrice || 100));
        await upsertDocument('workOrders', refDocument, {
          ...woData,
          components,
          actualCost: totalCost,
          updatedAt: new Date().toISOString()
        }, 'MIGO_ENGINE', activeTenant);
      }
    }

    // 7. Auditoría
    await recordAuditLog({
      entityType: 'MIGO_DOCUMENT',
      entityId: migoId,
      action: `CONTABILIZAR_MIGO_${movementType}`,
      details: `Movimiento ${movementType} de ${quantity} ${matData.unit || 'UN'} de ${matData.name || matRow.name} (Ref: ${refDocument || 'N/A'})`,
      user: currentUser?.displayName || currentUser?.email || 'Operador MIGO',
      tenantId: activeTenant
    });

    return newMigoDoc;
  } catch (err) {
    console.error(`[Supabase Multi-Tenant Transaction] Error en MIGO para ${activeTenant}:`, err);
    throw err;
  }
};

/**
 * Registra evento de auditoría en Supabase.
 */
export const recordAuditLog = async ({ entityType, entityId, action, details, user, tenantId = DEFAULT_TENANT_ID }) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  try {
    const logId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logDoc = {
      id: logId,
      entityType,
      entityId: String(entityId),
      action,
      details: details || '',
      user: user || 'SISTEMA_AXOMIRA',
      timestamp: new Date().toISOString(),
      tenantId: activeTenant
    };

    return await upsertDocument('auditLogs', logId, logDoc, 'AUDIT_SERVICE', activeTenant);
  } catch (err) {
    console.error(`[Supabase Audit Service] Error en audit log (${activeTenant}):`, err);
    return false;
  }
};

/**
 * Obtiene todos los documentos de una colección para un tenant.
 */
export const getCollectionDocs = async (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  const tableName = getTableName(collectionName);

  try {
    let query = supabase.from(tableName).select('*');
    if (tableName !== 'users') {
      query = query.eq('tenant_id', activeTenant);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(row => ({
      ...(row.data || {}),
      id: row.id,
      tenantId: row.tenant_id || activeTenant
    }));
  } catch (err) {
    console.warn(`[Supabase Service Multi-Tenant] Error leyendo colección ${tableName} (${activeTenant}):`, err);
    return [];
  }
};
