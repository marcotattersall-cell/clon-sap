import { describe, it, expect, beforeEach } from 'vitest';
import { executeIdempotentTransaction } from '../services/dbService';
import { checkProcessedIdempotencyKey, markIdempotencyKeyProcessed } from '../services/idempotencyService';

describe('Motor de Idempotencia Persistente Multi-Pestaña (IndexedDB / LocalStorage / BroadcastChannel)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });


  it('debe ejecutar una transacción por primera vez y retornar el resultado', async () => {
    let callCount = 0;
    const testKey = `MIGO-TEST-IDEM-${Date.now()}`;

    const result = await executeIdempotentTransaction(testKey, async () => {
      callCount++;
      return { success: true, docId: 'MIGO-99001' };
    });

    expect(callCount).toBe(1);
    expect(result.success).toBe(true);
    expect(result.docId).toBe('MIGO-99001');
  });

  it('debe bloquear la ejecución duplicada y retornar el resultado previo almacenado', async () => {
    let callCount = 0;
    const testKey = `MIGO-DUP-KEY-${Date.now()}`;

    // Primera ejecución
    const firstResult = await executeIdempotentTransaction(testKey, async () => {
      callCount++;
      return { status: 'POSTED', docId: 'MIGO-77002' };
    });

    expect(callCount).toBe(1);
    expect(firstResult.docId).toBe('MIGO-77002');

    // Segunda ejecución (Intento de duplicación)
    const secondResult = await executeIdempotentTransaction(testKey, async () => {
      callCount++;
      return { status: 'POSTED', docId: 'MIGO-77002' };
    });

    // La función interna no debe ser invocada por segunda vez
    expect(callCount).toBe(1);
    expect(secondResult).toEqual(firstResult);
  });

  it('debe persistir claves de idempotencia en localStorage y memory cache', async () => {
    const testKey = `PERSIST-KEY-${Date.now()}`;
    await markIdempotencyKeyProcessed(testKey, { processed: true });

    const check = await checkProcessedIdempotencyKey(testKey);
    expect(check.found).toBe(true);
    expect(check.result).toEqual({ processed: true });
  });
});
