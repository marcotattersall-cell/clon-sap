import * as firestoreService from './firestoreService';
import * as supabaseService from './supabaseService';
import { isSupabaseConfigured, isUseSupabaseActive } from '../supabase/config';
import { hasPermission } from '../utils/rbacRules';
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

export const DEFAULT_DEMO_REQUESTS = [
  {
    id: 'DEMO-REQ-2026-4160',
    ticketId: 'DEMO-REQ-2026-4160',
    timestamp: '2026-09-06 14:30',
    fullName: 'Juan Pablo Bennett',
    email: 'jbennett@mineradelnorte.cl',
    company: 'Minera del Norte SpA',
    industry: 'Gran Minería & Extracción',
    employeeCount: 'Más de 500 colaboradores (Gran Minería)',
    phone: '+56 9 8765 4321',
    primaryModule: 'Mantenimiento PM (IW31/IW32)',
    assetCount: 'Más de 200 Equipos (Gran Minería)',
    notes: 'Requerimos migración urgente de flota de camiones CAT 797F y palas hidráulicas P&H 4100XPC.',
    status: 'Pendiente',
    responseNotes: ''
  },
  {
    id: 'DEMO-REQ-2026-3892',
    ticketId: 'DEMO-REQ-2026-3892',
    timestamp: '2026-09-05 09:15',
    fullName: 'Camila Torres Valenzuela',
    email: 'camila.torres@constructoralatitud.cl',
    company: 'Constructora Latitud Sur',
    industry: 'Construcción & Obras Civiles',
    employeeCount: '201 a 500 colaboradores',
    phone: '+56 9 9123 8877',
    primaryModule: 'Gestión de Materiales MM (MIGO 261/101)',
    assetCount: '51 a 200 Equipos/Maquinarias',
    notes: 'Interesados en trazabilidad en tiempo real de bodega central y despacho de repuestos a faenas.',
    status: 'En Revisión',
    responseNotes: 'Reunión agendada con equipo técnico para el jueves 10 AM.'
  }
];

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
  const fallback = getFallbackFixtures(collectionName);

  const safeOnUpdate = (items) => {
    // Si Supabase está configurado con credenciales reales de Producción,
    // se respetan los datos reales de la base de datos (incluso si está limpia/vacía).
    if (isSupabaseConfigured) {
      onUpdate(Array.isArray(items) ? items : []);
    } else if (Array.isArray(items) && items.length === 0 && fallback.length > 0) {
      console.warn(`[dbService Protection] Supabase no configurado o sin conexión para '${collectionName}'. Activando datos de respaldo (fixtures demo).`);
      onUpdate(fallback);
    } else {
      onUpdate(items);
    }
  };

  const safeOnError = (err) => {
    console.warn(`[dbService Protection] Error en suscripción Supabase para '${collectionName}':`, err);
    if (!isSupabaseConfigured && fallback.length > 0) {
      onUpdate(fallback);
    } else if (isSupabaseConfigured) {
      onUpdate([]);
    }
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
    console.warn(`[IdempotencyGuard Persistente] Transacción duplicada bloqueada. Key: ${idempotencyKey}`);
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
  const fallback = getFallbackFixtures(collectionName);
  try {
    const docs = await getActiveDbService().getCollectionDocs(collectionName, tenantId);
    if (Array.isArray(docs) && docs.length === 0 && fallback.length > 0) {
      console.warn(`[dbService Protection] getCollectionDocs para '${collectionName}' retornó 0 elementos. Usando fixtures de respaldo.`);
      return fallback;
    }
    return docs;
  } catch (err) {
    console.warn(`[dbService Protection] Error en getCollectionDocs para '${collectionName}':`, err);
    return fallback;
  }
};

export const getPagedCollectionDocs = async (collectionName, page = 1, pageSize = 50, filters = {}, tenantId = DEFAULT_TENANT_ID) => {
  const fallback = getFallbackFixtures(collectionName);
  try {
    const res = await getActiveDbService().getPagedCollectionDocs(collectionName, page, pageSize, filters, tenantId);
    if (res && Array.isArray(res.data) && res.data.length === 0 && fallback.length > 0) {
      const safePage = Math.max(1, Number(page) || 1);
      const safePageSize = Math.max(1, Math.min(500, Number(pageSize) || 50));
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize;
      const sliced = fallback.slice(from, to);
      return {
        data: sliced,
        totalCount: fallback.length,
        page: safePage,
        pageSize: safePageSize,
        totalPages: Math.ceil(fallback.length / safePageSize) || 1
      };
    }
    return res;
  } catch (err) {
    console.warn(`[dbService Protection] Error en getPagedCollectionDocs para '${collectionName}':`, err);
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(500, Number(pageSize) || 50));
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize;
    const sliced = fallback.slice(from, to);
    return {
      data: sliced,
      totalCount: fallback.length,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(fallback.length / safePageSize) || 1
    };
  }
};

export const getTenantDocRef = (collectionName, docId, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantDocRef(collectionName, docId, tenantId);
};

export const getTenantCollectionRef = (collectionName, tenantId = DEFAULT_TENANT_ID) => {
  return firestoreService.getTenantCollectionRef(collectionName, tenantId);
};
