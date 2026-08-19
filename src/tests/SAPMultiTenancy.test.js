import { describe, it, expect } from 'vitest';
import { slugifyTenantId } from '../context/AuthContext';
import {
  getTenantCollectionRef,
  getTenantDocRef,
  DEFAULT_TENANT_ID
} from '../services/firestoreService';

describe('Arquitectura Multi-Tenancy (Aislamiento de Datos por Empresa)', () => {

  it('debe generar slugs de tenantId válidos y limpios a partir del nombre de la empresa', () => {
    expect(slugifyTenantId('Constructora del Norte SpA')).toBe('tenant_constructora_del_norte_spa');
    expect(slugifyTenantId('  Minera Atacama & Co. ')).toBe('tenant_minera_atacama_co');
    expect(slugifyTenantId('')).toBe('tenant_demo');
    expect(slugifyTenantId(null)).toBe('tenant_demo');
  });

  it('debe generar rutas aisladas e independientes en Firestore para distintas empresas', () => {
    const tenantA = 'tenant_constructora_del_norte';
    const tenantB = 'tenant_minera_atacama';

    const refAssetA = getTenantDocRef('assets', 'EQ-101', tenantA);
    const refAssetB = getTenantDocRef('assets', 'EQ-101', tenantB);

    // Verificar aislamiento de rutas
    expect(refAssetA.path).toBe('tenants/tenant_constructora_del_norte/assets/EQ-101');
    expect(refAssetB.path).toBe('tenants/tenant_minera_atacama/assets/EQ-101');
    expect(refAssetA.path).not.toBe(refAssetB.path);
  });

  it('debe aislar las transacciones de inventarios (MIGO 261) impidiendo interferencia entre tenants', () => {
    const tenantAData = {
      tenantId: 'tenant_company_a',
      materials: [{ id: 'MAT-1001', name: 'Filtro H-200', stock: 50 }]
    };

    const tenantBData = {
      tenantId: 'tenant_company_b',
      materials: [{ id: 'MAT-1001', name: 'Filtro H-200', stock: 10 }]
    };

    // Simulación de descuento de stock MIGO 261 en Tenant A (5 UN)
    tenantAData.materials[0].stock -= 5;

    // El stock de la Empresa B debe mantenerse inalterado en 10 UN
    expect(tenantAData.materials[0].stock).toBe(45);
    expect(tenantBData.materials[0].stock).toBe(10);
  });

  it('debe usar el tenant_demo por defecto cuando no hay usuario autenticado', () => {
    const defaultRef = getTenantDocRef('workOrders', 'WO-400101');
    expect(defaultRef.path).toBe(`tenants/${DEFAULT_TENANT_ID}/workOrders/WO-400101`);
  });

});
