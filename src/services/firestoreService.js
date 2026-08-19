import {
  collection,
  query,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateVectorClock } from './crdtSyncService';

export const DEFAULT_TENANT_ID = 'tenant_demo';

/**
 * Obtiene la referencia aislada de Firestore por Tenant (Multi-Tenancy).
 * Genera la ruta: /tenants/{tenantId}/{collectionName}
 */
export const getTenantCollectionRef = (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  if (collectionName === 'users') {
    return collection(db, 'users');
  }
  return collection(db, 'tenants', activeTenant, collectionName);
};

/**
 * Obtiene la referencia aislada a un documento específico por Tenant (Multi-Tenancy).
 * Genera la ruta: /tenants/{tenantId}/{collectionName}/{docId}
 */
export const getTenantDocRef = (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  if (collectionName === 'users') {
    return doc(db, 'users', String(docId));
  }
  return doc(db, 'tenants', activeTenant, collectionName, String(docId));
};

/**
 * Suscribe a una colección de Firestore aislada por Tenant con retroalimentación en tiempo real.
 */
export const subscribeCollection = (collectionName, onUpdate, onError, constraints = [], tenantId = DEFAULT_TENANT_ID) => {
  if (!db) {
    if (onError) onError(new Error('Firestore no está configurado'));
    return () => {};
  }

  const colRef = getTenantCollectionRef(collectionName, tenantId);
  const targetRef = Array.isArray(constraints) && constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  
  const unsubscribe = onSnapshot(
    targetRef,
    (snapshot) => {
      const items = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id,
        tenantId: tenantId || DEFAULT_TENANT_ID
      }));
      onUpdate(items);
    },
    (err) => {
      console.warn(`[Firestore Multi-Tenant Sync] Error al suscribir a ${collectionName} (${tenantId}):`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
};

/**
 * Ejecuta un movimiento de mercancía MIGO de forma ATÓMICA e aislada por Tenant.
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
  if (!db) return false;
  const activeTenant = tenantId || currentUser?.tenantId || DEFAULT_TENANT_ID;
  
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Leer el documento del material dentro de la transacción atómica del tenant
      const matRef = getTenantDocRef('materials', String(materialId), activeTenant);
      const matSnap = await transaction.get(matRef);
      if (!matSnap.exists()) {
        throw new Error(`El material SKU ${materialId} no existe en el maestro de ${activeTenant}.`);
      }

      const matData = matSnap.data();
      const currentStock = Number(matData.stock || 0);
      const quantity = Number(qty);

      if (quantity <= 0) {
        throw new Error('La cantidad ingresada debe ser mayor a cero.');
      }

      if (movementType === '261' && currentStock < quantity) {
        throw new Error(`Stock insuficiente: ${currentStock} ${matData.unit} disponibles vs ${quantity} solicitadas.`);
      }

      // 2. Calcular nuevo stock
      let newStock = currentStock;
      if (movementType === '101') newStock += quantity;
      if (movementType === '261') newStock -= quantity;

      // 3. Crear el documento MIGO
      const migoId = `MIGO-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const migoRef = getTenantDocRef('migoDocuments', migoId, activeTenant);
      const newMigoDoc = {
        id: migoId,
        documentId: migoId,
        movementType,
        materialId,
        materialName: matData.name,
        qty: quantity,
        unit: matData.unit,
        storageLocation: storageLocation || '0001',
        targetStorageLocation: targetStorageLocation || null,
        refDocument: refDocument || 'N/A',
        timestamp: new Date().toISOString(),
        user: currentUser?.displayName || currentUser?.email || 'Operador Operam ERP',
        tenantId: activeTenant
      };

      transaction.set(migoRef, newMigoDoc);

      // 4. Actualizar el stock del material de forma atómica
      transaction.update(matRef, { stock: newStock, updatedAt: new Date().toISOString() });

      // 5. Si es MIGO 101 con referencia a PO, actualizar el estado del Pedido
      if (movementType === '101' && refDocument) {
        const poRef = getTenantDocRef('purchaseOrders', String(refDocument), activeTenant);
        const poSnap = await transaction.get(poRef);
        if (poSnap.exists()) {
          transaction.update(poRef, { status: 'Recibido / Entregado', updatedAt: new Date().toISOString() });
        }
      }

      // 6. Si es MIGO 261 con referencia a WO, actualizar componentes y costo acumulado
      if (movementType === '261' && refDocument) {
        const woRef = getTenantDocRef('workOrders', String(refDocument), activeTenant);
        const woSnap = await transaction.get(woRef);
        if (woSnap.exists()) {
          const woData = woSnap.data();
          const components = Array.isArray(woData.components) ? [...woData.components] : [];
          const matchedCompIndex = components.findIndex(c => c.materialId === materialId);
          
          if (matchedCompIndex >= 0) {
            components[matchedCompIndex] = {
              ...components[matchedCompIndex],
              qtyIssued: Number(components[matchedCompIndex].qtyIssued || 0) + quantity
            };
          } else {
            components.push({
              materialId,
              description: matData.name,
              qtyPlanned: quantity,
              qtyIssued: quantity,
              unit: matData.unit,
              unitPrice: matData.unitPrice || 100
            });
          }

          const totalCost = Number(woData.actualCost || 0) + (quantity * Number(matData.unitPrice || 100));
          transaction.update(woRef, {
            components,
            actualCost: totalCost,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // 7. Auditoría Inmutable: Registrar entrada en auditLogs del Tenant
      const auditId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const auditRef = getTenantDocRef('auditLogs', auditId, activeTenant);
      transaction.set(auditRef, {
        id: auditId,
        entityType: 'MIGO_DOCUMENT',
        entityId: migoId,
        action: `CONTABILIZAR_MIGO_${movementType}`,
        details: `Movimiento ${movementType} de ${quantity} ${matData.unit} de ${matData.name} (Ref: ${refDocument || 'N/A'})`,
        user: currentUser?.displayName || currentUser?.email || 'Operador MIGO',
        timestamp: new Date().toISOString(),
        tenantId: activeTenant
      });

      return newMigoDoc;
    });
  } catch (err) {
    console.error(`[Firestore Multi-Tenant Transaction] Error en MIGO para ${activeTenant}:`, err);
    throw err;
  }
};

/**
 * Guarda o actualiza un documento en una colección aislada por Tenant.
 */
export const upsertDocument = async (collectionName, docId, data, userId = 'OPERATOR', tenantId = DEFAULT_TENANT_ID) => {
  if (!db) return false;
  const activeTenant = tenantId || data.tenantId || DEFAULT_TENANT_ID;
  
  try {
    const id = docId || data.id || `doc-${Date.now()}`;
    const docRef = getTenantDocRef(collectionName, String(id), activeTenant);
    const modifiedFields = Object.keys(data);
    const enrichedData = updateVectorClock({ ...data, id: String(id), tenantId: activeTenant }, userId, modifiedFields);
    await setDoc(docRef, { ...enrichedData, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore Service Multi-Tenant] Error guardando en ${collectionName} (${activeTenant}):`, err);
    return false;
  }
};

/**
 * Elimina un documento de una colección aislada por Tenant.
 */
export const deleteDocument = async (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  if (!db) return false;
  try {
    const docRef = getTenantDocRef(collectionName, String(docId), tenantId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`[Firestore Service Multi-Tenant] Error eliminando en ${collectionName} (${tenantId}):`, err);
    return false;
  }
};

/**
 * Si la colección en Firestore está vacía para el Tenant específico, la puebla con los datos iniciales por defecto.
 */
export const seedCollectionIfEmpty = async (collectionName, defaultItems = [], tenantId = DEFAULT_TENANT_ID) => {
  if (!db || !Array.isArray(defaultItems) || defaultItems.length === 0) return;
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  
  try {
    const colRef = getTenantCollectionRef(collectionName, activeTenant);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log(`[Firestore Tenant Seed] Sembrando '${collectionName}' para Tenant '${activeTenant}' (${defaultItems.length} registros)...`);
      const batch = writeBatch(db);
      defaultItems.forEach(item => {
        const id = String(item.id || item.documentId || `seed-${Date.now()}-${Math.random()}`);
        const docRef = getTenantDocRef(collectionName, id, activeTenant);
        batch.set(docRef, { ...item, id, tenantId: activeTenant });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn(`[Firestore Tenant Seed] No se pudo verificar o sembrar datos en ${collectionName} (${activeTenant}):`, err);
  }
};

/**
 * Registra un evento inmutable de auditoría (Audit Log) en Cloud Firestore aislado por Tenant.
 */
export const recordAuditLog = async ({ entityType, entityId, action, details, user, tenantId = DEFAULT_TENANT_ID }) => {
  if (!db) return false;
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  
  try {
    const logId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = getTenantDocRef('auditLogs', logId, activeTenant);
    await setDoc(docRef, {
      id: logId,
      entityType,
      entityId: String(entityId),
      action,
      details: details || '',
      user: user || 'SISTEMA_OPERAM',
      timestamp: new Date().toISOString(),
      tenantId: activeTenant
    });
    return true;
  } catch (err) {
    console.error(`[Firestore Audit Service] Error registrando audit log en ${activeTenant}:`, err);
    return false;
  }
};

export const getCollectionDocs = async (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  if (!db) return [];
  const activeTenant = tenantId || DEFAULT_TENANT_ID;
  
  try {
    const colRef = getTenantCollectionRef(collectionName, activeTenant);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id, tenantId: activeTenant }));
  } catch (err) {
    console.warn(`[Firestore Service Multi-Tenant] Error leyendo colección ${collectionName} (${activeTenant}):`, err);
    return [];
  }
};
