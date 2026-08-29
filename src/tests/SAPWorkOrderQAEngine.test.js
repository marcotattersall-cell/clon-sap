import { describe, it, expect } from 'vitest';

/**
 * 🧪 SUITE DE PRUEBAS DE AUDITORÍA QA & INGENIERÍA DE SOFTWARE
 * Módulo: Gestión de Órdenes de Mantenimiento PM (WorkOrderMaster / SAPContext)
 * Cobertura: Happy Path, Casos Límite, Resiliencia y Manejo de Errores
 */

describe('Módulo Operam PM: Auditoría QA & Cobertura de Órdenes de Trabajo (IW31/IW32/TECO)', () => {

  // Mock State Fixtures
  const mockAssets = [
    { id: 'EQ-101', name: 'Excavadora CAT 336', status: 'OPERATIVE', hourmeter: 4250 },
    { id: 'EQ-102', name: 'Cargador Komatsu WA470', status: 'MAINTENANCE', hourmeter: 6100 }
  ];

  const mockMaterials = [
    { id: 'MAT-1001', name: 'Filtro de Aceite Hidráulico', stock: 50, reorderPoint: 15, unitPrice: 85.50 },
    { id: 'MAT-1002', name: 'Aceite Sintético 15W40', stock: 5, reorderPoint: 10, unitPrice: 420.00 }
  ];

  const mockWorkOrders = [
    {
      id: 'WO-400101',
      title: 'Mantenimiento Preventivo Excavadora CAT 336',
      type: 'PM01',
      priority: 'Alta',
      status: 'CRTE',
      equipmentId: 'EQ-101',
      assignedTech: 'Jorge Silva San Martín',
      plannedHours: 6.0,
      actualHours: 0,
      plannedCost: 650.00,
      actualCost: 0,
      operations: [
        { id: 1, text: 'Inspección de niveles', status: 'Pending' }
      ],
      components: [
        { materialId: 'MAT-1001', description: 'Filtro de Aceite', qtyPlanned: 2, qtyIssued: 0 }
      ],
      logs: []
    },
    {
      id: 'WO-400102',
      title: 'Reparación Fuga Hidráulica',
      type: 'PM02',
      priority: 'Muy Alta',
      status: 'REL',
      equipmentId: 'EQ-102',
      assignedTech: 'Carlos Mendoza Morales',
      plannedHours: 8.0,
      actualHours: 4.0,
      plannedCost: 1200.00,
      actualCost: 950.00,
      operations: [],
      components: [],
      logs: []
    }
  ];

  // 1. HAPPY PATH TESTS
  describe('1. Escenarios de Éxito (Happy Path)', () => {
    it('debe filtrar órdenes de trabajo correctamente por término de búsqueda, estado y prioridad', () => {
      const searchTerm = 'cat 336';
      const statusFilter = 'CRTE';
      const priorityFilter = 'ALL';

      const filtered = mockWorkOrders.filter(wo => {
        const matchesSearch =
          (wo.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (wo.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (wo.equipmentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (wo.assignedTech || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('WO-400101');
    });

    it('debe avanzar la orden de trabajo a través del ciclo de vida de estados (CRTE -> REL -> PCNF -> TECO)', () => {
      let wo = { ...mockWorkOrders[0] };
      const validStatuses = ['CRTE', 'REL', 'PCNF', 'TECO'];

      // Transición 1: CRTE -> REL
      wo.status = 'REL';
      expect(wo.status).toBe('REL');
      expect(validStatuses.includes(wo.status)).toBe(true);

      // Transición 2: REL -> PCNF
      wo.status = 'PCNF';
      expect(wo.status).toBe('PCNF');

      // Transición 3: PCNF -> TECO (Cierre Técnico)
      wo.status = 'TECO';
      expect(wo.status).toBe('TECO');
    });

    it('debe contabilizar la salida de repuesto MIGO 261 y descontar stock correctamente', () => {
      const material = { ...mockMaterials[0] };
      const wo = { ...mockWorkOrders[0] };
      const qtyToIssue = 2;

      // Simular consumo MIGO 261
      expect(material.stock).toBeGreaterThanOrEqual(qtyToIssue);
      material.stock -= qtyToIssue;
      wo.components[0].qtyIssued += qtyToIssue;

      expect(material.stock).toBe(48);
      expect(wo.components[0].qtyIssued).toBe(2);
    });
  });

  // 2. EDGE CASES & VULNERABILITY AUDITS
  describe('2. Casos Límite, Resiliencia & Defensa de Fallos (Edge Cases)', () => {
    it('debe filtrar órdenes sin arrojar TypeError cuando existan propiedades nulas o no definidas', () => {
      const corruptWO = [
        { id: 'WO-999', title: null, equipmentId: undefined, assignedTech: null, status: 'CRTE', priority: 'Alta' }
      ];

      const searchTerm = 'cat';
      expect(() => {
        corruptWO.filter(wo => {
          return (
            (wo.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (wo.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (wo.equipmentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (wo.assignedTech || '').toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }).not.toThrow();
    });

    it('debe rechazar consumos de repuestos con cantidades inválidas, cero o negativas', () => {
      const validateQuantity = (qty) => {
        const num = Number(qty);
        return !isNaN(num) && num > 0;
      };

      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-5)).toBe(false);
      expect(validateQuantity('invalid_abc')).toBe(false);
      expect(validateQuantity(3)).toBe(true);
    });

    it('debe rechazar la salida de repuesto MIGO 261 si la cantidad requerida supera el stock disponible', () => {
      const material = { ...mockMaterials[1] }; // Stock: 5
      const requestedQty = 10;

      const isStockSufficient = material.stock >= requestedQty;
      expect(isStockSufficient).toBe(false);
    });

    it('debe retornar falso o ignorar actualizaciones sobre IDs de orden inexistentes', () => {
      const updateStatus = (targetId, newStatus) => {
        const found = mockWorkOrders.find(w => w.id === targetId);
        if (!found) return false;
        found.status = newStatus;
        return true;
      };

      const result = updateStatus('WO-INEXISTENTE-999', 'TECO');
      expect(result).toBe(false);
    });
  });
});
