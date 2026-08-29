/**
 * Servicio de Machine Learning (ML):
 * Clasificador NLP y Auto-Priorización de Avisos de Avería (SAP PM / IW31)
 *
 * Analiza descripciones en texto libre ingresadas por los operadores de campo y determina
 * automáticamente la prioridad (Muy Alta, Alta, Media, Baja) y el componente afectado.
 */

// Diccionario de Pesos semánticos y palabras clave industriales
const NLP_DICTIONARY = {
  VERY_HIGH: ['humo', 'fuego', 'fuga masiva', 'parada critica', 'detenido', 'colision', 'vuelco', 'explosión', 'rotura perno reina', 'corte cadena', 'sin frenos', 'emergencia', 'fuga aceite caliente'],
  HIGH: ['vibracion fuerte', 'ruido metalico', 'temperatura alta', 'perdida potencia', 'alarma motor', 'presion baja', 'sobrecalentamiento', 'falla hidraulica', 'golpe neumático'],
  MEDIUM: ['filtro sucio', 'desgaste', 'ruido leve', 'sensor parpadea', 'nivel bajo', 'fuga menor', 'revisión', 'mantenimiento'],
  LOW: ['limpieza', 'pintura', 'luces', 'espejo', 'asiento', 'aire acondicionado', 'puerta', 'bocina']
};

const COMPONENT_PATTERNS = {
  'Sistema Hidráulico': ['manguera', 'fuga aceite', 'cilindro', 'presion hidraulica', 'bomba', 'valvula'],
  'Motor & Propulsión': ['temperatura motor', 'humo', 'refrigerante', 'potencia', 'invector', 'turbo', 'aceite motor'],
  'Transmisión & Rodajes': ['oruga', 'ruido metalico', 'caja cambios', 'diferencial', 'mando final', 'rodamiento'],
  'Sistema Eléctrico & IoT': ['sensor', 'bateria', 'falla electrica', 'alarma', 'alternador', 'luces', 'arnes'],
  'Estructura & Balde': ['chasis', 'fisura', 'soldadura', 'balde', 'dientes', 'placa desgaste', 'perno']
};

/**
 * Clasifica una nota/descripción de falla utilizando Procesamiento de Lenguaje Natural (NLP).
 * @param {string} text Descripción en texto libre ingresada por el operario
 * @returns {Object} Resultado de la clasificación NLP con sugerencias de prioridad y componente
 */
export const classifyNotificationText = (text = '') => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      suggestedPriority: 'Alta',
      suggestedComponent: 'Sistema General',
      confidenceScore: 50,
      keywordsDetected: [],
      mlEngineVersion: 'NLP-Classifier-v3.0'
    };
  }

  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const detectedKeywords = [];

  let veryHighHits = 0;
  let highHits = 0;
  let mediumHits = 0;
  let lowHits = 0;

  NLP_DICTIONARY.VERY_HIGH.forEach(kw => {
    if (normalized.includes(kw)) {
      veryHighHits += 3;
      detectedKeywords.push(kw);
    }
  });

  NLP_DICTIONARY.HIGH.forEach(kw => {
    if (normalized.includes(kw)) {
      highHits += 2;
      detectedKeywords.push(kw);
    }
  });

  NLP_DICTIONARY.MEDIUM.forEach(kw => {
    if (normalized.includes(kw)) {
      mediumHits += 1;
      detectedKeywords.push(kw);
    }
  });

  NLP_DICTIONARY.LOW.forEach(kw => {
    if (normalized.includes(kw)) {
      lowHits += 1;
      detectedKeywords.push(kw);
    }
  });

  // Determinar Prioridad Sugerida por NLP
  let suggestedPriority = 'Alta'; // Valor por defecto
  if (veryHighHits > 0 || (normalized.includes('urgente') && highHits > 0)) {
    suggestedPriority = 'Muy Alta';
  } else if (highHits >= 2 || veryHighHits > 0) {
    suggestedPriority = 'Alta';
  } else if (mediumHits > 0 || lowHits === 0) {
    suggestedPriority = 'Media';
  } else if (lowHits > 0) {
    suggestedPriority = 'Baja';
  }

  // Determinar Componente Afectado por NLP
  let suggestedComponent = 'Sistema General';
  let maxCompHits = 0;

  Object.keys(COMPONENT_PATTERNS).forEach(comp => {
    let hits = 0;
    COMPONENT_PATTERNS[comp].forEach(kw => {
      if (normalized.includes(kw)) hits++;
    });
    if (hits > maxCompHits) {
      maxCompHits = hits;
      suggestedComponent = comp;
    }
  });

  const confidenceScore = Math.min(65 + (detectedKeywords.length * 10), 98);

  return {
    suggestedPriority,
    suggestedComponent,
    confidenceScore,
    keywordsDetected: [...new Set(detectedKeywords)],
    mlEngineVersion: 'NLP-Classifier-v3.0'
  };
};
