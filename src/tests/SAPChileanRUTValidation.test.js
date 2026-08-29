import { describe, it, expect } from 'vitest';
import { validateChileanRUT, formatChileanRUT, cleanRUT } from '../utils/rutUtils';

describe('🇨🇱 Módulo 11 - Validación y Formateo de RUT Chileno', () => {
  it('debe limpiar adecuadamente un RUT quitando puntos, guiones y espacios', () => {
    expect(cleanRUT(' 6.000.000-k ')).toBe('6000000K');
    expect(cleanRUT('18-310-450-0')).toBe('183104500');
  });

  it('debe formatear dinámicamente un RUT al formato XX.XXX.XXX-Y', () => {
    expect(formatChileanRUT('6000000k')).toBe('6.000.000-K');
    expect(formatChileanRUT('183104500')).toBe('18.310.450-0');
    expect(formatChileanRUT('111111111')).toBe('11.111.111-1');
  });

  it('debe validar RUTs chilenos matemáticamente válidos según Módulo 11', () => {
    expect(validateChileanRUT('6.000.000-K').isValid).toBe(true);
    expect(validateChileanRUT('18.310.450-0').isValid).toBe(true);
    expect(validateChileanRUT('11.111.111-1').isValid).toBe(true);
  });

  it('debe rechazar RUTs chilenos matemáticamente inválidos', () => {
    const invalidRUT = validateChileanRUT('6.000.000-5');
    expect(invalidRUT.isValid).toBe(false);
    expect(invalidRUT.error).toContain('no es válido');
  });

  it('debe rechazar RUTs con longitud incorrecta', () => {
    expect(validateChileanRUT('123').isValid).toBe(false);
    expect(validateChileanRUT('12345678901').isValid).toBe(false);
  });
});
