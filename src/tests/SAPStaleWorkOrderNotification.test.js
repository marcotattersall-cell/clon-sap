import { describe, it, expect } from 'vitest';
import {
  getWorkOrderAgeHours,
  isWorkOrderStale,
  getStaleWorkOrdersList
} from '../services/workOrderNotificationService';

describe('SAP ERP - Auditoría de Órdenes de Trabajo Estancadas (>24h)', () => {
  it('debe calcular correctamente la antigüedad en horas de una Orden de Trabajo', () => {
    const yesterday = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(); // hace 30 horas
    const wo = { id: 'WO-101', startDate: yesterday, status: 'CRTE' };

    const hours = getWorkOrderAgeHours(wo);
    expect(hours).toBeGreaterThanOrEqual(29);
  });

  it('debe identificar una Orden de Trabajo como estancada si lleva más de 24h abierta', () => {
    const hours26Ago = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    const staleWO = { id: 'WO-102', startDate: hours26Ago, status: 'LIB' };

    expect(isWorkOrderStale(staleWO)).toBe(true);
  });

  it('NO debe marcar como estancada una OT con menos de 24h o que ya esté cerrada (TECO/CLSD)', () => {
    const recentWO = { id: 'WO-103', startDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'CRTE' };
    const closedWO = { id: 'WO-104', startDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), status: 'TECO' };

    expect(isWorkOrderStale(recentWO)).toBe(false);
    expect(isWorkOrderStale(closedWO)).toBe(false);
  });

  it('debe filtrar y ordenar correctamente la lista de OTs estancadas por antigüedad descendente', () => {
    const list = [
      { id: 'WO-RECENT', startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'CRTE' },
      { id: 'WO-STALE-28H', startDate: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), status: 'LIB' },
      { id: 'WO-STALE-50H', startDate: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), status: 'PCNF' },
      { id: 'WO-TECO-OLD', startDate: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(), status: 'TECO' }
    ];

    const staleList = getStaleWorkOrdersList(list);

    expect(staleList.length).toBe(2);
    expect(staleList[0].id).toBe('WO-STALE-50H');
    expect(staleList[1].id).toBe('WO-STALE-28H');
  });
});
