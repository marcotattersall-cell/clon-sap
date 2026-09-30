import * as firestoreService from './firestoreService';
import * as supabaseService from './supabaseService';
import { isSupabaseConfigured, isUseSupabaseActive } from '../supabase/config';
import { hasPermission } from '../utils/rbacRules';
import logger from './loggerService';
import {
  DEFAULT_PLANTS,
  DEFAULT_MATERIALS,
  DEFAULT_ASSETS,
  DEFAULT_WORK_ORDERS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PURCHASE_ORDERS,
  DEFAULT_MIGO_DOCUMENTS,
  DEFAULT_EMPLOYEES,
  DEFAULT_ABSENCES,
  DEFAULT_PAYROLL_RUNS
} from '../fixtures/sapInitialFixtures';

export const DEFAULT_TENANT_ID = firestoreService.DEFAULT_TENANT_ID;

export const DEFAULT_DEMO_REQUESTS = [];

/**
 * Mapeo centralizado de fixtures de datos locales por colección
 */
export const FIXTURES_MAP = {
  plants: DEFAULT_PLANTS,
  materials: DEFAULT_MATERIALS,
  assets: DEFAULT_ASSETS,
  workOrders: DEFAULT_WORK_ORDERS,
  notifications: DEFAULT_NOTIFICATIONS,
  purchaseOrders: DEFAULT_PURCHASE_ORDERS,
  migoDocuments: DEFAULT_MIGO_DOCUMENTS,
  employees: DEFAULT_EMPLOYEES,
  absences: DEFAULT_ABSENCES,
  payrollRuns: DEFAULT_PAYROLL_RUNS,
  demoRequests: DEFAULT_DEMO_REQUESTS
};

/**
 * Obtiene fixtures predeterminados para una colección como mecanismo de respaldo (fallback).
 */
export const getFallbackFixtures = (collectionName) => {
  return FIXTURES_MAP[collectionName] || [];
};

/**
 * Validar autorización RBAC en capa de servicio (Zero-Trust)
 */
export const validateServiceRBACPermission = (userRole, permissionKey) => {
  if (!userRole) return true; // Si no se especifica rol explícito en cliente ligero, permite compatibilidad
  const allowed = hasPermission(userRole, permissionKey);
  if (!allowed) {
    logger.error(`[RBAC Guard] Acceso denegado en servicio para rol '${userRole}' al solicitar '${permissionKey}'`);
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
  const safeOnUpdate = (items) => {
    onUpdate(Array.isArray(items) ? items : []);
  };

  const safeOnError = (err) => {
    logger.warn(`[dbService Protection] Error en suscripción Supabase para '${collectionName}':`, err);
    onUpdate([]);
    if (onError) onError(err);
  };

  return getActiveDbService().subscribeCollection(collectionName, safeOnUpdate, safeOnError, constraints, tenantId);
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
  // En producción con Supabase real no se inyectan automáticamente los datos de prueba (mock data)
  if (isSupabaseConfigured) {
    return;
  }
  const itemsToSeed = (Array.isArray(defaultItems) && defaultItems.length > 0)
    ? defaultItems
    : getFallbackFixtures(collectionName);
  return await getActiveDbService().seedCollectionIfEmpty(collectionName, itemsToSeed, tenantId);
};

import { checkProcessedIdempotencyKey, markIdempotencyKeyProcessed } from './idempotencyService';

/**
 * Ejecuta una transacción asegurando idempotencia persistente y sincronizada entre pestañas.
 * Si la clave ya fue procesada (en Memoria, IndexedDB, LocalStorage o en otra pestaña),
 * previene la duplicación y retorna la respuesta previa.
 */
export const executeIdempotentTransaction = async (idempotencyKey, transactionFn) => {
  if (!idempotencyKey) {
    return await transactionFn();
  }

  const { found, result: existingResult } = await checkProcessedIdempotencyKey(idempotencyKey);
  if (found) {
    logger.warn(`[IdempotencyGuard Persistente] Transacción duplicada bloqueada. Key: ${idempotencyKey}`);
    return existingResult;
  }

  const result = await transactionFn();
  await markIdempotencyKeyProcessed(idempotencyKey, result);

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
  try {
    const docs = await getActiveDbService().getCollectionDocs(collectionName, tenantId);
    return Array.isArray(docs) ? docs : [];
  } catch (err) {
    logger.warn(`[dbService Protection] Error en getCollectionDocs para '${collectionName}':`, err);
    return [];
  }
};

export const getPagedCollectionDocs = async (collectionName, page = 1, pageSize = 50, filters = {}, tenantId = DEFAULT_TENANT_ID) => {
  try {
    const res = await getActiveDbService().getPagedCollectionDocs(collectionName, page, pageSize, filters, tenantId);
    return res || { data: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };
  } catch (err) {
    logger.warn(`[dbService Protection] Error en getPagedCollectionDocs para '${collectionName}':`, err);
    return { data: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };
  }
};

export const getTenantDocRef = (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantDocRef(collectionName, docId, tenantId);
};

export const getTenantCollectionRef = (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantCollectionRef(collectionName, tenantId);
};
