import { describe, it, expect } from 'vitest';
import { getPagedCollectionDocs } from '../services/supabaseService';

describe('Motor de Paginación en Servidor y Consultas Basadas en Cursores (Server-Side Pagination)', () => {
  it('debe exponer la función getPagedCollectionDocs con firma correcta', () => {
    expect(typeof getPagedCollectionDocs).toBe('function');
  });

  it('debe calcular metadatos de paginación de forma segura ante colecciones vacías o consultas simuladas', async () => {
    const res = await getPagedCollectionDocs('materials', 1, 20, {}, 'tenant_demo');
    expect(res).toBeDefined();
    expect(Array.isArray(res.data)).toBe(true);
    expect(typeof res.totalCount).toBe('number');
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(20);
    expect(typeof res.totalPages).toBe('number');
  });

  it('debe normalizar números de página negativos o no válidos a valores seguros (Math.max)', async () => {
    const res = await getPagedCollectionDocs('workOrders', -5, 0, {}, 'tenant_demo');
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(50);
  });
});
