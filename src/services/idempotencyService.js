/**
 * Servicio Persistente de Idempotencia Multi-Pestaña (IndexedDB + BroadcastChannel)
 * Evita la duplicación de transacciones MIGO y operaciones financieras entre pestañas del navegador o tras reinicios.
 */

const DB_NAME = 'sap_idempotency_db';
const DB_VERSION = 1;
const STORE_NAME = 'idempotency_keys';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

// Cache en memoria para respuestas ultra-rápidas en el mismo hilo
const inMemoryCache = new Map();

// Canal de comunicación en tiempo real entre pestañas (BroadcastChannel)
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('sap_idempotency_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.key) {
        inMemoryCache.set(event.data.key, {
          result: event.data.result,
          timestamp: event.data.timestamp || Date.now()
        });
      }
    };
  } catch (e) {
    console.warn('[IdempotencyService] BroadcastChannel no soportado o deshabilitado:', e);
  }
}

/**
 * Inicializa y retorna la base de datos de IndexedDB.
 */
const openIDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (err) => {
        console.warn('[IdempotencyService IndexedDB] Error al abrir base de datos:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[IdempotencyService IndexedDB] Excepción al inicializar:', e);
      resolve(null);
    }
  });
};

/**
 * Busca un registro de idempotencia por clave (en Memoria -> IndexedDB -> LocalStorage).
 * @param {string} key Clave de idempotencia
 * @returns {Promise<{ found: boolean, result: any }>}
 */
export const checkProcessedIdempotencyKey = async (key) => {
  if (!key) return { found: false, result: null };

  const now = Date.now();

  // 1. Verificación rápida en Memoria
  if (inMemoryCache.has(key)) {
    const record = inMemoryCache.get(key);
    if (now - record.timestamp < DEFAULT_TTL_MS) {
      console.warn(`[IdempotencyGuard Memoria] Transacción duplicada interceptada. Key: ${key}`);
      return { found: true, result: record.result };
    } else {
      inMemoryCache.delete(key);
    }
  }

  // 2. Verificación en LocalStorage (Fallback ultrarrápido)
  try {
    if (typeof localStorage !== 'undefined') {
      const lsItem = localStorage.getItem(`sap_idempotency_${key}`);
      if (lsItem) {
        const parsed = JSON.parse(lsItem);
        if (now - parsed.timestamp < DEFAULT_TTL_MS) {
          inMemoryCache.set(key, parsed);
          console.warn(`[IdempotencyGuard LocalStorage] Transacción duplicada interceptada. Key: ${key}`);
          return { found: true, result: parsed.result };
        } else {
          localStorage.removeItem(`sap_idempotency_${key}`);
        }
      }
    }
  } catch (e) {
    // Ignorar excepciones de lectura de localStorage
  }


  // 3. Verificación Persistente en IndexedDB
  const db = await openIDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(key);

        getReq.onsuccess = () => {
          const rec = getReq.result;
          if (rec && (now - rec.timestamp < DEFAULT_TTL_MS)) {
            inMemoryCache.set(key, { result: rec.result, timestamp: rec.timestamp });
            console.warn(`[IdempotencyGuard IndexedDB] Transacción duplicada interceptada. Key: ${key}`);
            resolve({ found: true, result: rec.result });
          } else {
            resolve({ found: false, result: null });
          }
        };

        getReq.onerror = () => {
          resolve({ found: false, result: null });
        };
      } catch (e) {
        resolve({ found: false, result: null });
      }
    });
  }

  return { found: false, result: null };
};

/**
 * Guarda una clave de idempotencia procesada en Memoria, IndexedDB, LocalStorage y notifica a otras pestañas via BroadcastChannel.
 * @param {string} key Clave de idempotencia
 * @param {any} result Resultado devuelto por la transacción
 */
export const markIdempotencyKeyProcessed = async (key, result) => {
  if (!key) return;

  const timestamp = Date.now();
  const payload = { key, result, timestamp };

  // 1. Guardar en caché local de memoria
  inMemoryCache.set(key, payload);

  // 2. Transmitir a otras pestañas activas
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {
      // Ignorar fallo de difusión
    }
  }

  // 3. Guardar en LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`sap_idempotency_${key}`, JSON.stringify({ result, timestamp }));
    }
  } catch (e) {
    // Ignorar QuotaExceededError en localStorage
  }


  // 4. Guardar en IndexedDB
  const db = await openIDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(payload);
    } catch (e) {
      console.warn('[IdempotencyService IndexedDB] Error al guardar clave:', e);
    }
  }
};
