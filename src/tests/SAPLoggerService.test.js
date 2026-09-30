import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger, { setLogLevel, getLogLevel, LOG_LEVELS, debug, info, warn, error } from '../services/loggerService';

describe('Servicio Centralizado de Logging (loggerService.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setLogLevel('INFO'); // Reset to default level before each test
  });

  it('debe permitir consultar y cambiar dinámicamente los niveles de log', () => {
    expect(getLogLevel()).toBe('INFO');

    setLogLevel('DEBUG');
    expect(getLogLevel()).toBe('DEBUG');

    setLogLevel('WARN');
    expect(getLogLevel()).toBe('WARN');

    setLogLevel('ERROR');
    expect(getLogLevel()).toBe('ERROR');

    setLogLevel('NONE');
    expect(getLogLevel()).toBe('NONE');
  });

  it('debe emitir logs de nivel INFO cuando el nivel está configurado en INFO', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    setLogLevel('INFO');

    info('Mensaje de prueba informativo');
    debug('Mensaje de prueba de debug');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('debe emitir logs de nivel DEBUG únicamente cuando el nivel se establece en DEBUG', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    setLogLevel('DEBUG');
    debug('Mensaje de prueba de depuración detallada');

    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it('debe filtrar logs de INFO y WARN cuando el nivel está configurado en ERROR', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    setLogLevel('ERROR');

    info('Info ignorado');
    warn('Warn ignorado');
    error('Error crítico visible');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('debe silenciar todos los logs cuando el nivel se establece en NONE', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    setLogLevel('NONE');

    debug('Silencio');
    info('Silencio');
    warn('Silencio');
    error('Silencio');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
