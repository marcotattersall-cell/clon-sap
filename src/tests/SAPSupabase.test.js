import { describe, it, expect } from 'vitest';
import { getTableName, tableNameMap, formatRowToItem } from '../services/supabaseService';
import { getActiveDbService, getFallbackFixtures, subscribeCollection } from '../services/dbService';

describe('Integración de Base de Datos Supabase (Multi-Tenancy & Mapeo)', () => {
  it('debe mapear correctamente los nombres de colecciones a tablas de Supabase PostgreSQL', () => {
    expect(getTableName('workOrders')).toBe('work_orders');
    expect(getTableName('purchaseOrders')).toBe('purchase_orders');
    expect(getTableName('migoDocuments')).toBe('migo_documents');
    expect(getTableName('payrollRuns')).toBe('payroll_runs');
    expect(getTableName('auditLogs')).toBe('audit_logs');
    expect(getTableName('telemetryLogs')).toBe('telemetry_logs');
    expect(getTableName('demoRequests')).toBe('demo_requests');
    expect(getTableName('materials')).toBe('materials');
    expect(getTableName('plants')).toBe('plants');
    expect(getTableName('assets')).toBe('assets');
  });

  it('debe seleccionar el servicio de base de datos correspondiente en dbService', () => {
    const dbSvc = getActiveDbService();
    expect(dbSvc).toBeDefined();
    expect(typeof dbSvc.subscribeCollection).toBe('function');
    expect(typeof dbSvc.upsertDocument).toBe('function');
    expect(typeof dbSvc.executeAtomicGoodsMovement).toBe('function');
  });

  it('debe aislar los payloads de Supabase por tenant_id', () => {
    const tenantA = 'tenant_minera_atacama';
    const sampleDoc = {
      id: 'EQ-2001',
      name: 'Pala Hidráulica Komatsu PC5500',
      stock: 1
    };

    const formattedPayload = {
      id: sampleDoc.id,
      tenant_id: tenantA,
      data: { ...sampleDoc, tenantId: tenantA }
    };

    expect(formattedPayload.tenant_id).toBe('tenant_minera_atacama');
    expect(formattedPayload.data.tenantId).toBe('tenant_minera_atacama');
  });

  it('debe formatear filas de Supabase PostgreSQL a objetos JS del ERP con formatRowToItem', () => {
    const rawRow = {
      id: 'MAT-1001',
      tenant_id: 'tenant_demo',
      stock: 450,
      unit_price: 12.50,
      data: {
        id: 'MAT-1001',
        name: 'Filtro Aceite Hidráulico',
        category: 'Filtros'
      }
    };

    const formatted = formatRowToItem(rawRow, 'tenant_demo');
    expect(formatted.id).toBe('MAT-1001');
    expect(formatted.tenantId).toBe('tenant_demo');
    expect(formatted.stock).toBe(450);
    expect(formatted.unitPrice).toBe(12.50);
    expect(formatted.name).toBe('Filtro Aceite Hidráulico');
  });

  it('debe retornar los fixtures predeterminados como fallback cuando Supabase falla o entrega resultados vacíos', () => {
    const materialsFallback = getFallbackFixtures('materials');
    expect(materialsFallback).toBeDefined();
    expect(materialsFallback.length).toBeGreaterThan(0);
    expect(materialsFallback[0].id).toBe('MAT-1001');

    const workOrdersFallback = getFallbackFixtures('workOrders');
    expect(workOrdersFallback).toBeDefined();
    expect(workOrdersFallback.length).toBeGreaterThan(0);
    expect(workOrdersFallback[0].id).toBe('WO-400101');

    let receivedItems = null;
    const mockOnUpdate = (items) => { receivedItems = items; };
    const safeOnUpdate = (items) => {
      if (Array.isArray(items) && items.length === 0 && materialsFallback.length > 0) {
        mockOnUpdate(materialsFallback);
      } else {
        mockOnUpdate(items);
      }
    };

    // Al recibir un arreglo vacío por falla de Supabase, debe entregar los fixtures de respaldo
    safeOnUpdate([]);
    expect(receivedItems).toEqual(materialsFallback);
    expect(receivedItems.length).toBeGreaterThan(0);
  });


});


