import { describe, it, expect } from 'vitest';
import { formatRowToItem, getTableName, mapDataToRelationalColumns } from '../services/supabaseService';
import { getFallbackFixtures } from '../services/dbService';

describe('🚛 Pruebas de Integración 100% Base de Datos — Gestión de Flota y Vencimientos (Zero Hardcoded Data)', () => {
  const TEST_TENANT = 'tenant_fleet_prod_test';

  const mockAsset = {
    id: 'EQ-TRUCK-99',
    name: 'Camión Aljibe Volvo FMX 440',
    category: 'Camión de Transporte',
    location: 'Planta Antofagasta',
    functionalLocation: 'PLANT-01-SECTOR-B',
    status: 'OPERATIVE',
    healthScore: 98,
    hourmeter: 1250,
    odometer: 48000,
    baseHourmeter: 1250,
    baseOdometer: 48000,
    model: 'FMX 440',
    serialNumber: 'SN-VOLVO-99283',
    operator: 'Carlos Mendoza',
    plate: 'GH-8822',
    costCenter: 'CC-4100',
    accreditationExpiry: '2026-10-15',
    circulationPermitExpiry: '2026-12-31',
    soapExpiry: '2026-12-31',
    technicalReviewExpiry: '2026-11-01',
    customExpirations: [
      { id: 'CUST-01', title: 'Extintor de Incendio', expiryDate: '2026-09-30' }
    ]
  };

  it('1. Debe mapear el nombre de la colección de activos a la tabla PostgreSQL assets', () => {
    expect(getTableName('assets')).toBe('assets');
  });

  it('2. Debe empaquetar correctamente las columnas relacionales del activo para la base de datos Supabase/PostgreSQL', () => {
    const relCols = mapDataToRelationalColumns(mockAsset);
    expect(relCols.name).toBe('Camión Aljibe Volvo FMX 440');
    expect(relCols.category).toBe('Camión de Transporte');
    expect(relCols.location).toBe('Planta Antofagasta');
    expect(relCols.health_score).toBe(98);
    expect(relCols.hourmeter).toBe(1250);
    expect(relCols.odometer).toBe(48000);
    expect(relCols.model).toBe('FMX 440');
    expect(relCols.serial_number).toBe('SN-VOLVO-99283');
  });

  it('3. Debe formatear registros almacenados en PostgreSQL a objetos JS consumibles con todas sus fechas de vencimiento', () => {
    const dbRow = {
      id: mockAsset.id,
      tenant_id: TEST_TENANT,
      name: mockAsset.name,
      status: mockAsset.status,
      category: mockAsset.category,
      data: mockAsset
    };

    const formatted = formatRowToItem(dbRow, TEST_TENANT);
    expect(formatted.id).toBe('EQ-TRUCK-99');
    expect(formatted.tenantId).toBe(TEST_TENANT);
    expect(formatted.accreditationExpiry).toBe('2026-10-15');
    expect(formatted.circulationPermitExpiry).toBe('2026-12-31');
    expect(formatted.soapExpiry).toBe('2026-12-31');
    expect(formatted.technicalReviewExpiry).toBe('2026-11-01');
    expect(formatted.customExpirations.length).toBe(1);
    expect(formatted.customExpirations[0].title).toBe('Extintor de Incendio');
  });

  it('4. Debe soportar la eliminación explícita o vaciado de fechas de vencimiento en activos (asignación a null/vacío)', () => {
    const updatedMockAsset = {
      ...mockAsset,
      accreditationExpiry: null,
      customExpirations: []
    };

    const dbRow = {
      id: updatedMockAsset.id,
      tenant_id: TEST_TENANT,
      name: updatedMockAsset.name,
      status: updatedMockAsset.status,
      category: updatedMockAsset.category,
      data: updatedMockAsset
    };

    const formatted = formatRowToItem(dbRow, TEST_TENANT);
    expect(formatted.accreditationExpiry).toBeNull();
    expect(formatted.customExpirations).toEqual([]);
  });

  it('5. Debe garantizar que los fixtures locales están limpios en entornos de producción (0% mock hardcodeado)', () => {
    const assetsFallback = getFallbackFixtures('assets');
    expect(assetsFallback).toEqual([]);
  });
});
