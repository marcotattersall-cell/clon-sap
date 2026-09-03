import * as firestoreService from './firestoreService';
import * as supabaseService from './supabaseService';
import { isSupabaseConfigured, isUseSupabaseActive } from '../supabase/config';

import { hasPermission } from '../utils/rbacRules';

export const DEFAULT_TENANT_ID = firestoreService.DEFAULT_TENANT_ID;

/**
 * Validar autorización RBAC en capa de servicio (Zero-Trust)
 */
export const validateServiceRBACPermission = (userRole, permissionKey) => {
  if (!userRole) return true; // Si no se especifica rol explícito en cliente ligero, permite compatibilidad
  const allowed = hasPermission(userRole, permissionKey);
  if (!allowed) {
    console.error(`[RBAC Guard] Acceso denegado en servicio para rol '${userRole}' al solicitar '${permissionKey}'`);
    throw new Error(`[RBAC_DENIED] El rol '${userRole}' no cuenta con autorización para la acción '${permissionKey}'.`);
  }
  return true;
};

/**
 * Determina dinámicamente si se debe usar el servicio de Supabase o el de Firestore/Local
 */
export const getActiveDbService = () => {
  return supabaseService;
};

export const subscribeCollection = (collectionName, onUpdate, onError, constraints = [], tenantId = DEFAULT_TENANT_ID) => {
  return getActiveDbService().subscribeCollection(collectionName, onUpdate, onError, constraints, tenantId);
};

export const upsertDocument = async (collectionName, docId, data, userId = 'OPERATOR', tenantId = DEFAULT_TENANT_ID, userRole = null) => {
  if (userRole && collectionName === 'materials') {
    validateServiceRBACPermission(userRole, 'MM_CREATE_MATERIAL');
  } else if (userRole && collectionName === 'assets') {
    validateServiceRBACPermission(userRole, 'PM_CREATE_ASSET');
  }
  return await getActiveDbService().upsertDocument(collectionName, docId, data, userId, tenantId);
};

export const deleteDocument = async (collectionName, docId, tenantId = DEFAULT_TENANT_ID, userRole = null) => {
  if (userRole) {
    validateServiceRBACPermission(userRole, 'SU01_GLOBAL_USER_MGMT');
  }
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

export const getPagedCollectionDocs = async (collectionName, page = 1, pageSize = 50, filters = {}, tenantId = DEFAULT_TENANT_ID) => {
  return await getActiveDbService().getPagedCollectionDocs(collectionName, page, pageSize, filters, tenantId);
};

export const getTenantDocRef = (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantDocRef(collectionName, docId, tenantId);
};

export const getTenantCollectionRef = (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantCollectionRef(collectionName, tenantId);
};

