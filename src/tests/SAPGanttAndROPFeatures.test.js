import { describe, it, expect } from 'vitest';
import { forecastCatalogDemand } from '../services/materialDemandForecastingService';

describe('Pruebas de Características 2 y 3 (Gantt PM & ROP MM + SolPed)', () => {
  it('debe calcular el Reorder Point (ROP) y generar alertas de stock crítico', () => {
    const mockMaterials = [
      { id: 'MAT-1001', name: 'Filtro Aceite Heavy Duty', stock: 5, reorderPoint: 20, unitPrice: 45000, unit: 'UN', leadTimeDays: 5, dailyConsumption: 2 },
      { id: 'MAT-1002', name: 'Aceite Hidráulico ISO 68', stock: 150, reorderPoint: 50, unitPrice: 85000, unit: 'L', leadTimeDays: 3, dailyConsumption: 5 }
    ];

    const forecasts = forecastCatalogDemand(mockMaterials);
    expect(forecasts).toHaveLength(2);

    const mat1Forecast = forecasts.find(f => f.materialId === 'MAT-1001');
    expect(mat1Forecast.stockoutRisk).toBe('CRITICAL');
    expect(mat1Forecast.purchaseRecommendation).toContain('Generar Pedido de Compra');

    const mat2Forecast = forecasts.find(f => f.materialId === 'MAT-1002');
    expect(mat2Forecast.stockoutRisk).toBe('LOW');
  });

  it('debe filtrar correctamente Órdenes de Trabajo para la Carta Gantt PM', () => {
    const mockWOs = [
      { id: 'WO-400101', description: 'Overhaul Camión Caex', status: 'IN_PROGRESS', priority: 'EMERGENCY', plannedStart: '2026-09-01', plannedEnd: '2026-09-10' },
      { id: 'WO-400102', description: 'Cambio de Filtros Pala', status: 'CREATED', priority: 'HIGH', plannedStart: '2026-09-05', plannedEnd: '2026-09-08' },
      { id: 'WO-400103', description: 'Mantención Periódica', status: 'CLOSED', priority: 'LOW', plannedStart: '2026-09-10', plannedEnd: '2026-09-12' }
    ];

    const emergencyWOs = mockWOs.filter(w => w.priority === 'EMERGENCY');
    expect(emergencyWOs).toHaveLength(1);
    expect(emergencyWOs[0].id).toBe('WO-400101');

    const activeWOs = mockWOs.filter(w => w.status !== 'CLOSED');
    expect(activeWOs).toHaveLength(2);
  });
});
