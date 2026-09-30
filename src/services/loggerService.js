/**
 * Servicio Centralizado de Logging y Diagnóstico (AXOMIRA Enterprise Logger)
 * Permite controlar el nivel de verbosidad (DEBUG, INFO, WARN, ERROR, NONE)
 * en desarrollo y producción para mantener limpios los logs de la consola del navegador.
 */

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'NONE'
};

// Determinar el nivel predeterminado según el entorno
const getDefaultLevel = () => {
  try {
    // 1. Preferencia en localStorage (si existe)
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLevel = window.localStorage.getItem('axomira_log_level');
      if (savedLevel && LOG_LEVELS[savedLevel.toUpperCase()] !== undefined) {
        return LOG_LEVELS[savedLevel.toUpperCase()];
      }
    }

    // 2. Variable de entorno Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envLevel = import.meta.env.VITE_LOG_LEVEL;
      if (envLevel && LOG_LEVELS[envLevel.toUpperCase()] !== undefined) {
        return LOG_LEVELS[envLevel.toUpperCase()];
      }
      if (import.meta.env.PROD) {
        return LOG_LEVELS.WARN; // En producción por defecto solo advertencias y errores
      }
    }
  } catch (e) {
    // Fallback seguro
  }

  return LOG_LEVELS.INFO; // Por defecto en desarrollo
};

let currentLevel = getDefaultLevel();

/**
 * Cambia el nivel de log activo dinámicamente en tiempo de ejecución.
 * @param {string|number} level Nivel ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE' o 0-4)
 */
export const setLogLevel = (level) => {
  if (typeof level === 'string') {
    const uppercaseLevel = level.toUpperCase();
    if (LOG_LEVELS[uppercaseLevel] !== undefined) {
      currentLevel = LOG_LEVELS[uppercaseLevel];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('axomira_log_level', uppercaseLevel);
      }
      return currentLevel;
    }
  } else if (typeof level === 'number' && level >= 0 && level <= 4) {
    currentLevel = level;
    if (typeof window !== 'undefined' && window.localStorage) {
      const name = LOG_LEVEL_NAMES[level] || 'INFO';
      window.localStorage.setItem('axomira_log_level', name);
    }
    return currentLevel;
  }
  return currentLevel;
};

/**
 * Obtiene el nivel de log actualmente configurado.
 * @returns {string} Nombre del nivel activo ('DEBUG', 'INFO', etc.)
 */
export const getLogLevel = () => {
  return LOG_LEVEL_NAMES[currentLevel] || 'INFO';
};

/**
 * Obtiene la marca de tiempo legible para el prefijo del log.
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Emite un mensaje de depuración (DEBUG).
 */
export const debug = (...args) => {
  if (currentLevel <= LOG_LEVELS.DEBUG) {
    console.debug(`[AXOMIRA DEBUG ${getTimestamp()}]`, ...args);
  }
};

/**
 * Emite un mensaje informativo (INFO).
 */
export const info = (...args) => {
  if (currentLevel <= LOG_LEVELS.INFO) {
    console.info(`[AXOMIRA INFO ${getTimestamp()}]`, ...args);
  }
};

/**
 * Emite una advertencia (WARN).
 */
export const warn = (...args) => {
  if (currentLevel <= LOG_LEVELS.WARN) {
    console.warn(`[AXOMIRA WARN ${getTimestamp()}]`, ...args);
  }
};

/**
 * Emite un error (ERROR).
 */
export const error = (...args) => {
  if (currentLevel <= LOG_LEVELS.ERROR) {
    console.error(`[AXOMIRA ERROR ${getTimestamp()}]`, ...args);
  }
};

/**
 * Alias para info(...)
 */
export const log = (...args) => {
  info(...args);
};

export const logger = {
  debug,
  info,
  warn,
  error,
  log,
  setLogLevel,
  getLogLevel,
  LOG_LEVELS
};

export default logger;
