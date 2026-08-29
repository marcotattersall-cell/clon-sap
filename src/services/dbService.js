import * as firestoreService from './firestoreService';
import * as supabaseService from './supabaseService';
import { isSupabaseConfigured, isUseSupabaseActive } from '../supabase/config';

export const DEFAULT_TENANT_ID = firestoreService.DEFAULT_TENANT_ID;

/**
 * Determina dinámicamente si se debe usar el servicio de Supabase o el de Firestore/Local
 */
export const getActiveDbService = () => {
  return supabaseService;
};

export const subscribeCollection = (collectionName, onUpdate, onError, constraints = [], tenantId = DEFAULT_TENANT_ID) => {
  return getActiveDbService().subscribeCollection(collectionName, onUpdate, onError, constraints, tenantId);
};

export const upsertDocument = async (collectionName, docId, data, userId = 'OPERATOR', tenantId = DEFAULT_TENANT_ID) => {
  return await getActiveDbService().upsertDocument(collectionName, docId, data, userId, tenantId);
};

export const deleteDocument = async (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  return await getActiveDbService().deleteDocument(collectionName, docId, tenantId);
};

export const seedCollectionIfEmpty = async (collectionName, defaultItems = [], tenantId = DEFAULT_TENANT_ID) => {
  return await getActiveDbService().seedCollectionIfEmpty(collectionName, defaultItems, tenantId);
};

const processedIdempotencyKeys = new Map();

/**
 * Ejecuta una transacción asegurando idempotencia. Si la clave ya fue procesada,
 * previene la duplicación y retorna la respuesta previa.
 */
export const executeIdempotentTransaction = async (idempotencyKey, transactionFn) => {
  if (!idempotencyKey) {
    return await transactionFn();
  }

  if (processedIdempotencyKeys.has(idempotencyKey)) {
    const existing = processedIdempotencyKeys.get(idempotencyKey);
    console.warn(`[IdempotencyGuard] Transacción duplicada bloqueada. Key: ${idempotencyKey}`);
    return existing;
  }

  const result = await transactionFn();
  processedIdempotencyKeys.set(idempotencyKey, result);

  // Expira automáticamente la clave tras 15 minutos (900,000 ms)
  setTimeout(() => {
    processedIdempotencyKeys.delete(idempotencyKey);
  }, 15 * 60 * 1000);

  return result;
};

export const executeAtomicGoodsMovement = async (params) => {
  const idempotencyKey = params?.idempotencyKey || params?.migoDocumentId;
  return await executeIdempotentTransaction(idempotencyKey, () =>
    getActiveDbService().executeAtomicGoodsMovement(params)
  );
};

export const recordAuditLog = async (params) => {
  return await getActiveDbService().recordAuditLog(params);
};

export const getCollectionDocs = async (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  return await getActiveDbService().getCollectionDocs(collectionName, tenantId);
};

export const getTenantDocRef = (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantDocRef(collectionName, docId, tenantId);
};

export const getTenantCollectionRef = (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantCollectionRef(collectionName, tenantId);
};

