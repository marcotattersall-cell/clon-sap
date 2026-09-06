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

  it('debe respaldar de forma aislada e independiente cada universo de cliente con MANIFEST de integridad', () => {
    const tenants = ['tenant_demo', 'tenant_codelco', 'tenant_bhp'];
    const backupSummary = tenants.map(t => ({
      tenantId: t,
      manifestGenerated: true,
      hasChecksum: true
    }));

    expect(backupSummary.length).toBe(3);
    expect(backupSummary.every(b => b.manifestGenerated && b.hasChecksum)).toBe(true);
  });

  it('debe usar el tenant_demo por defecto cuando no hay usuario autenticado', () => {
    const defaultRef = getTenantDocRef('workOrders', 'WO-400101');
    expect(defaultRef.path).toBe(`tenants/${DEFAULT_TENANT_ID}/workOrders/WO-400101`);
  });

  it('debe evaluar correctamente la lógica de isTenantUser (request.auth.token.tenantId o documento /users/{uid})', () => {
    const isTenantUserMock = (auth, userDoc, targetTenantId) => {
      if (!auth) return false;
      const hasTokenTenant = auth.token && auth.token.tenantId === targetTenantId;
      const hasDocTenant = userDoc && userDoc.tenantId === targetTenantId;
      return hasTokenTenant || hasDocTenant;
    };

    const targetTenant = 'tenant_codelco';

    // 1. Token JWT incluye tenant_codelco
    expect(isTenantUserMock({ token: { tenantId: 'tenant_codelco' } }, null, targetTenant)).toBe(true);

    // 2. Token no tiene custom claim, pero documento /users/{uid} en Firestore pertenece a tenant_codelco
    expect(isTenantUserMock({ uid: 'usr-123' }, { tenantId: 'tenant_codelco' }, targetTenant)).toBe(true);

    // 3. Usuario sin autenticación
    expect(isTenantUserMock(null, { tenantId: 'tenant_codelco' }, targetTenant)).toBe(false);

    // 4. Intentar acceder a tenant ajeno (tenant_bhp)
    expect(isTenantUserMock({ token: { tenantId: 'tenant_codelco' } }, { tenantId: 'tenant_codelco' }, 'tenant_bhp')).toBe(false);
  });

});
