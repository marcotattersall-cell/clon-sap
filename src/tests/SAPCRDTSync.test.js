import { describe, it, expect } from 'vitest';
import {
  createInitialVectorClock,
  updateVectorClock,
  mergeCRDTRecords
} from '../services/crdtSyncService';

describe('Engine de Resolución de Conflictos CRDT / Vector Clocks para SAP ERP', () => {

  it('debe inicializar un Vector Clock válido para un nuevo registro', () => {
    const vc = createInitialVectorClock('TECH_SILVA');
    expect(vc).toHaveProperty('clock', 1);
    expect(vc.lastUpdatedBy).toBe('TECH_SILVA');
    expect(vc.vectorMap).toHaveProperty('TECH_SILVA', 1);
  });

  it('debe incrementar el Vector Clock y registrar timestamps por campo al modificar un registro', () => {
    const initialRecord = {
      id: 'WO-400101',
      title: 'Mantenimiento Preventivo CAT 336',
      status: 'REL',
      actualHours: 4.0
    };

    const updatedRecord = updateVectorClock(initialRecord, 'TECH_SILVA', ['actualHours']);

    expect(updatedRecord._versionVector.clock).toBe(2);
    expect(updatedRecord._versionVector.fieldTimestamps).toHaveProperty('actualHours');
    expect(updatedRecord._versionVector.fieldTimestamps.actualHours.updatedBy).toBe('TECH_SILVA');
  });

  it('debe fusionar concurrentemente cambios en campos distintos sin perder datos (LWW Field-Level CRDT)', () => {
    const baseRecord = {
      id: 'WO-400101',
      status: 'REL',
      assignedTech: 'Jorge Silva',
      actualHours: 2.0,
      actualCost: 200,
      _versionVector: createInitialVectorClock('BASE')
    };

    // Técnico A (offline en mina) modifica horas reales a las 10:00 AM
    const recordTechA = updateVectorClock(
      { ...baseRecord, actualHours: 6.5 },
      'TECH_MINA',
      ['actualHours']
    );
    // Simular timestamp 10:00 AM
    recordTechA._versionVector.fieldTimestamps.actualHours.updatedAt = 100000;

    // Técnico B (offline en taller) modifica el estado a TECO a las 10:05 AM
    const recordTechB = updateVectorClock(
      { ...baseRecord, status: 'TECO' },
      'TECH_TALLER',
      ['status']
    );
    // Simular timestamp 10:05 AM
    recordTechB._versionVector.fieldTimestamps.status.updatedAt = 105000;

    // Ejecutar fusión CRDT
    const { mergedRecord, hasConflict } = mergeCRDTRecords(recordTechA, recordTechB);

    // Verificación: Ambos cambios deben preservarse en la orden fusionada
    expect(mergedRecord.actualHours).toBe(6.5); // De Técnico A
    expect(mergedRecord.status).toBe('TECO');     // De Técnico B
    expect(mergedRecord.assignedTech).toBe('Jorge Silva'); // Inalterado
    expect(hasConflict).toBe(true); // Detectó fusión de dos nodos concurrentes
  });

  it('debe preservar registros de auditoría y operaciones agregadas en paralelo mediante OR-Set CRDT', () => {
    const localWO = {
      id: 'WO-400101',
      logs: [
        { id: 'LOG-1', text: 'Orden Liberada' },
        { id: 'LOG-100', text: 'Técnico A inició desmontaje de bomba' }
      ]
    };

    const remoteWO = {
      id: 'WO-400101',
      logs: [
        { id: 'LOG-1', text: 'Orden Liberada' },
        { id: 'LOG-200', text: 'Técnico B midió presión hidráulica 350 bar' }
      ]
    };

    const { mergedRecord } = mergeCRDTRecords(localWO, remoteWO);

    // Debe contener los 3 logs unificados sin duplicados ni borrados
    expect(mergedRecord.logs).toHaveLength(3);
    const logIds = mergedRecord.logs.map(l => l.id);
    expect(logIds).toContain('LOG-1');
    expect(logIds).toContain('LOG-100');
    expect(logIds).toContain('LOG-200');
  });

});
