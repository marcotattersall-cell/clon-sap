import { describe, it, expect } from 'vitest';
import { generateWeeklyExecutiveKPISummary } from '../services/reportingService';

describe('SAP ERP - Consolidado Semanal de KPIs Ejecutivos para Gerencia', () => {
  it('debe calcular la disponibilidad de flota e índice de salud promedio correctamente', () => {
    const mockAssets = [
      { id: 'EQ-01', name: 'Camión C-101', status: 'OPERATIVE', healthScore: 95 },
      { id: 'EQ-02', name: 'Chancador P-02', status: 'OPERATIVE', healthScore: 85 },
      { id: 'EQ-03', name: 'Cargador C-03', status: 'MAINTENANCE', healthScore: 60 }
    ];

    const report = generateWeeklyExecutiveKPISummary({ workOrders: [], assets: mockAssets });

    // 2 de 3 activos operativos -> 67%
    expect(report.kpis[0].value).toBe('67%');
    // Promedio salud -> (95+85+60)/3 = 80
    expect(report.kpis[1].value).toBe('80/100');
  });

  it('debe calcular el porcentaje de cumplimiento PM y el desglose de costos por Centro de Costos', () => {
    const mockWOs = [
      { id: 'WO-1', status: 'TECO', costCenter: 'CC-4100', plannedCost: 1000, actualCost: 1200 },
      { id: 'WO-2', status: 'CLSD', costCenter: 'CC-4100', plannedCost: 500, actualCost: 500 },
      { id: 'WO-3', status: 'CRTE', costCenter: 'CC-3200', plannedCost: 2000, actualCost: 0 }
    ];

    const report = generateWeeklyExecutiveKPISummary({ workOrders: mockWOs, assets: [] });

    // 2 de 3 OTs cerradas -> 67% cumplimiento
    expect(report.kpis[2].value).toBe('67%');

    // Desglose Centro de Costos
    expect(report.costCenterBreakdown.length).toBe(2);

    const cc4100 = report.costCenterBreakdown.find(c => c.costCenter === 'CC-4100');
    expect(cc4100).toBeDefined();
    expect(cc4100.plannedCost).toBe(1500);
    expect(cc4100.actualCost).toBe(1700);
    expect(cc4100.orderCount).toBe(2);
  });
});
