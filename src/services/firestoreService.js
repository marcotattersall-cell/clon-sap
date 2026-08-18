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

/**
 * Suscribe a una colección de Firestore con retroalimentación en tiempo real.
 * Soporta restricciones de consulta (limit, orderBy) para paginación de alto rendimiento.
 *
 * @param {string} collectionName
 * @param {function(Array):void} onUpdate
 * @param {function(Error):void} [onError]
 * @param {Array} [constraints]
 * @returns {function():void} función para cancelar la suscripción
 */
export const subscribeCollection = (collectionName, onUpdate, onError, constraints = []) => {
  if (!db) {
    if (onError) onError(new Error('Firestore no está configurado'));
    return () => {};
  }

  const colRef = collection(db, collectionName);
  const targetRef = Array.isArray(constraints) && constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  
  const unsubscribe = onSnapshot(
    targetRef,
    (snapshot) => {
      const items = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      onUpdate(items);
    },
    (err) => {
      console.warn(`[Firestore Sync] Error al suscribir a ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
};

/**
 * Ejecuta un movimiento de mercancía MIGO (101, 261, 311) de forma ATÓMICA en Cloud Firestore.
 * Garantiza que la lectura de stock, el descuento/incremento, la actualización de la WO/PO y la creación de la MIGO
 * se ejecuten como una única transacción indivisible (all-or-nothing).
 */
export const executeAtomicGoodsMovement = async ({
  movementType,
  materialId,
  qty,
  storageLocation,
  targetStorageLocation,
  refDocument,
  currentUser
}) => {
  if (!db) return false;
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Leer el documento del material dentro de la transacción atómica
      const matRef = doc(db, 'materials', String(materialId));
      const matSnap = await transaction.get(matRef);
      if (!matSnap.exists()) {
        throw new Error(`El material SKU ${materialId} no existe en el maestro.`);
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
      const migoRef = doc(db, 'migoDocuments', migoId);
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
        user: currentUser?.displayName || currentUser?.email || 'Operador SAP'
      };

      transaction.set(migoRef, newMigoDoc);

      // 4. Actualizar el stock del material de forma atómica
      transaction.update(matRef, { stock: newStock, updatedAt: new Date().toISOString() });

      // 5. Si es MIGO 101 con referencia a PO, actualizar el estado del Pedido a 'Recibido / Entregado'
      if (movementType === '101' && refDocument) {
        const poRef = doc(db, 'purchaseOrders', String(refDocument));
        const poSnap = await transaction.get(poRef);
        if (poSnap.exists()) {
          transaction.update(poRef, { status: 'Recibido / Entregado', updatedAt: new Date().toISOString() });
        }
      }

      // 6. Si es MIGO 261 con referencia a WO, actualizar componentes y costo acumulado atómicamente
      if (movementType === '261' && refDocument) {
        const woRef = doc(db, 'workOrders', String(refDocument));
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

      // 7. Auditoría Inmutable SAP: Registrar entrada en auditLogs
      const auditId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const auditRef = doc(db, 'auditLogs', auditId);
      transaction.set(auditRef, {
        id: auditId,
        entityType: 'MIGO_DOCUMENT',
        entityId: migoId,
        action: `CONTABILIZAR_MIGO_${movementType}`,
        details: `Movimiento ${movementType} de ${quantity} ${matData.unit} de ${matData.name} (Ref: ${refDocument || 'N/A'})`,
        user: currentUser?.displayName || currentUser?.email || 'Operador MIGO',
        timestamp: new Date().toISOString()
      });

      return newMigoDoc;
    });
  } catch (err) {
    console.error('[Firestore Atomic Transaction] Error en transacción MIGO:', err);
    throw err;
  }
};

/**
 * Guarda o actualiza un documento en una colección.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 */
export const upsertDocument = async (collectionName, docId, data, userId = 'OPERATOR') => {
  if (!db) return false;
  try {
    const id = docId || data.id || `doc-${Date.now()}`;
    const docRef = doc(db, collectionName, String(id));
    const modifiedFields = Object.keys(data);
    const enrichedData = updateVectorClock({ ...data, id: String(id) }, userId, modifiedFields);
    await setDoc(docRef, { ...enrichedData, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore Service] Error al guardar documento en ${collectionName}:`, err);
    return false;
  }
};

/**
 * Elimina un documento de una colección.
 *
 * @param {string} collectionName
 * @param {string} docId
 */
export const deleteDocument = async (collectionName, docId) => {
  if (!db) return false;
  try {
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`[Firestore Service] Error al eliminar documento en ${collectionName}:`, err);
    return false;
  }
};

/**
 * Si la colección en Firestore está vacía, la puebla de manera inicial con datos por defecto.
 *
 * @param {string} collectionName
 * @param {Array<Object>} defaultItems
 */
export const seedCollectionIfEmpty = async (collectionName, defaultItems = []) => {
  if (!db || !Array.isArray(defaultItems) || defaultItems.length === 0) return;
  
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log(`[Firestore Seed] Sembrando colección inicial '${collectionName}' (${defaultItems.length} registros)...`);
      const batch = writeBatch(db);
      defaultItems.forEach(item => {
        const id = String(item.id || item.documentId || `seed-${Date.now()}-${Math.random()}`);
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, { ...item, id });
      });
    }
  } catch (err) {
    console.warn(`[Firestore Seed] No se pudo verificar o sembrar datos en ${collectionName}:`, err);
  }
};

/**
 * Registra un evento inmutable de auditoría SAP (Audit Log) en Cloud Firestore.
 */
export const recordAuditLog = async ({ entityType, entityId, action, details, user }) => {
  if (!db) return false;
  try {
    const logId = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = doc(db, 'auditLogs', logId);
    await setDoc(docRef, {
      id: logId,
      entityType,
      entityId: String(entityId),
      action,
      details: details || '',
      user: user || 'SISTEMA_SAP',
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('[Firestore Audit Service] Error al registrar log de auditoría:', err);
    return false;
  }
};

export const getCollectionDocs = async (collectionName) => {
  if (!db) return [];
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.warn(`[Firestore Service] Error leyendo colección ${collectionName}:`, err);
    return [];
  }
};

