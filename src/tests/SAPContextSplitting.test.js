import { describe, it, expect } from 'vitest';
import React from 'react';
import { UIContext, MMContext, PMContext, HCMContext, useUI, useMM, usePM, useHCM, useSAP } from '../context/SAPContext';

describe('Arquitectura de Descomposición de Contexto (Context Splitting)', () => {
  it('debe exportar correctamente los sub-contextos de dominio y los hooks dedicados', () => {
    expect(UIContext).toBeDefined();
    expect(MMContext).toBeDefined();
    expect(PMContext).toBeDefined();
    expect(HCMContext).toBeDefined();
    expect(typeof useUI).toBe('function');
    expect(typeof useMM).toBe('function');
    expect(typeof usePM).toBe('function');
    expect(typeof useHCM).toBe('function');
    expect(typeof useSAP).toBe('function');
  });
});
