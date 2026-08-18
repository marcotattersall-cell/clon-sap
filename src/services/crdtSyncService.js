/**
 * Engine de Resolución de Conflictos Offline mediante Vector Clocks y CRDT (LWW-Element-Set & OR-Set)
 * Permite fusiones deterministas campo por campo de registros SAP (Órdenes PM, Materiales MM, Activos)
 * evitando la pérdida de datos cuando múltiples técnicos editan sin conexión a la red.
 */

/**
 * Genera un nuevo Vector Clock inicial para un registro.
 * @param {string} userId
 * @returns {Object}
 */
export const createInitialVectorClock = (userId = 'SYSTEM') => {
  const now = Date.now();
  return {
    deviceId: typeof window !== 'undefined' ? (window.navigator?.userAgent ? `DEV-${Math.abs(hashString(window.navigator.userAgent)).toString(36)}` : 'DEV-CLIENT') : 'DEV-SERVER',
    clock: 1,
    lastUpdatedBy: userId,
    updatedAt: now,
    vectorMap: {
      [userId]: 1
    },
    fieldTimestamps: {}
  };
};

/**
 * Función Hash auxiliar simple para identificadores de dispositivo.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Incrementa el Vector Clock de un registro para los campos modificados.
 *
 * @param {Object} currentRecord Registro actual
 * @param {string} userId Usuario que realiza la modificación
 * @param {Array<string>} modifiedFields Lista de campos alterados
 * @returns {Object} Registro actualizado con _versionVector mutado
 */
export const updateVectorClock = (currentRecord, userId = 'OPERATOR', modifiedFields = []) => {
  const now = Date.now();
  const existingVector = currentRecord._versionVector || createInitialVectorClock(userId);

  const newClockValue = (existingVector.vectorMap?.[userId] || 0) + 1;
  const updatedVectorMap = {
    ...(existingVector.vectorMap || {}),
    [userId]: newClockValue
  };

  const updatedFieldTimestamps = { ...(existingVector.fieldTimestamps || {}) };
  modifiedFields.forEach(field => {
    updatedFieldTimestamps[field] = {
      updatedAt: now,
      updatedBy: userId,
      clock: newClockValue
    };
  });

  return {
    ...currentRecord,
    _versionVector: {
      deviceId: existingVector.deviceId || 'DEV-CLIENT',
      clock: (existingVector.clock || 0) + 1,
      lastUpdatedBy: userId,
      updatedAt: now,
      vectorMap: updatedVectorMap,
      fieldTimestamps: updatedFieldTimestamps
    }
  };
};

/**
 * Fusiona dos versiones de un mismo registro SAP (Local vs Remoto) usando lógica CRDT campo por campo.
 *
 * Estrategia de Fusión:
 * - Para campos primitivos: Compara el timestamp/clock del campo. El más reciente prevalece.
 * - Para arreglos (logs, operaciones, componentes): Aplica un OR-Set (Observed-Remove Set) uniendo por `id` único
 *   de modo que no se pierda ningún log u operación agregada en paralelo por distintos usuarios.
 *
 * @param {Object} localRecord
 * @param {Object} remoteRecord
 * @returns {{ mergedRecord: Object, hasConflict: boolean, conflictSummary: Array<string> }}
 */
export const mergeCRDTRecords = (localRecord, remoteRecord) => {
  if (!localRecord) return { mergedRecord: remoteRecord, hasConflict: false, conflictSummary: [] };
  if (!remoteRecord) return { mergedRecord: localRecord, hasConflict: false, conflictSummary: [] };

  const localVector = localRecord._versionVector || createInitialVectorClock('LOCAL');
  const remoteVector = remoteRecord._versionVector || createInitialVectorClock('REMOTE');

  const localFields = localVector.fieldTimestamps || {};
  const remoteFields = remoteVector.fieldTimestamps || {};

  const merged = { ...localRecord };
  let hasConflict = false;
  const conflictSummary = [];

  // Obtener la lista unificada de todas las claves
  const allKeys = Array.from(new Set([...Object.keys(localRecord), ...Object.keys(remoteRecord)]));

  for (const key of allKeys) {
    if (key === '_versionVector' || key === 'id') continue;

    const localVal = localRecord[key];
    const remoteVal = remoteRecord[key];

    // 1. Tratamiento para arreglos de registros (OR-Set CRDT)
    if (Array.isArray(localVal) || Array.isArray(remoteVal)) {
      const arrLocal = Array.isArray(localVal) ? localVal : [];
      const arrRemote = Array.isArray(remoteVal) ? remoteVal : [];

      // Fusionar arreglos deduplicando por `id` o por contenido serializado
      const mapById = new Map();
      
      [...arrLocal, ...arrRemote].forEach(item => {
        const itemId = item.id || item.materialId || JSON.stringify(item);
        if (!mapById.has(itemId)) {
          mapById.set(itemId, item);
        } else {
          // Si el elemento ya existe en ambos lados, fusionar propiedades internas
          const existing = mapById.get(itemId);
          mapById.set(itemId, { ...existing, ...item });
        }
      });

      merged[key] = Array.from(mapById.values());
      continue;
    }

    // 2. Tratamiento para campos primitivos (LWW Field-Level CRDT)
    const localTs = localFields[key]?.updatedAt || 0;
    const remoteTs = remoteFields[key]?.updatedAt || 0;

    if (remoteTs > localTs) {
      if (localVal !== undefined && localVal !== remoteVal) {
        hasConflict = true;
        conflictSummary.push(`Campo '${key}': Actualizado remotamente por ${remoteFields[key]?.updatedBy || 'Remoto'} (${remoteVal}) sobre versión local (${localVal}).`);
      }
      merged[key] = remoteVal;
    } else if (localTs > remoteTs) {
      merged[key] = localVal;
    } else {
      // Si ninguno de los dos modificó el campo explícitamente en esta iteración, preferir el valor definido no nulo
      merged[key] = remoteVal !== undefined ? remoteVal : localVal;
    }
  }

  // Fusionar mapas de reloj vectorial
  const mergedVectorMap = {
    ...(localVector.vectorMap || {}),
    ...(remoteVector.vectorMap || {})
  };
  Object.keys(mergedVectorMap).forEach(user => {
    mergedVectorMap[user] = Math.max(
      localVector.vectorMap?.[user] || 0,
      remoteVector.vectorMap?.[user] || 0
    );
  });

  merged._versionVector = {
    deviceId: typeof window !== 'undefined' ? 'DEV-CLIENT' : 'DEV-SERVER',
    clock: Math.max(localVector.clock || 0, remoteVector.clock || 0) + 1,
    lastUpdatedBy: remoteVector.updatedAt > localVector.updatedAt ? remoteVector.lastUpdatedBy : localVector.lastUpdatedBy,
    updatedAt: Math.max(localVector.updatedAt || 0, remoteVector.updatedAt || 0),
    vectorMap: mergedVectorMap,
    fieldTimestamps: { ...localFields, ...remoteFields }
  };

  return { mergedRecord: merged, hasConflict, conflictSummary };
};
