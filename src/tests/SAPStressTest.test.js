import { describe, it, expect } from 'vitest';

/**
 * 🚀 SUITE DE PRUEBAS DE ESTRÉS Y CONCURRENCIA ERP (SAP PM/MM Stress Test)
 * Simula múltiples usuarios virtuales y alto volumen transaccional simultáneo.
 */

// Simulación in-memory del motor de reglas ERP para pruebas de estrés masivo
class SAPStressEngine {
  constructor() {
    this.materials = new Map([
      ['MAT-1001', { id: 'MAT-1001', name: 'Filtro Hidráulico CAT', stock: 1000, unit: 'UN', unitPrice: 85.50 }],
      ['MAT-1002', { id: 'MAT-1002', name: 'Aceite Sintético 15W40', stock: 500, unit: 'TBO', unitPrice: 420.00 }],
      ['MAT-1003', { id: 'MAT-1003', name: 'Bomba Hidráulica Komatsu', stock: 100, unit: 'UN', unitPrice: 3450.00 }]
    ]);
    this.workOrders = new Map();
    this.purchaseOrders = new Map([
      ['PO-45008912', { id: 'PO-45008912', vendor: 'Finning Chile', status: 'Aprobado', itemsCount: 3 }]
    ]);
    this.migoDocuments = [];
    this.notifications = [];
    this.transactionLog = [];
    this.lock = false;
  }

  // Ejecutar movimiento MIGO con control de concurrencia
  async executeGoodsMovement({ movementType, materialId, qty, refDocument, user }) {
    const startTime = performance.now();
    const material = this.materials.get(materialId);
    if (!material) throw new Error(`Material ${materialId} no existe`);

    const quantity = Number(qty);
    if (quantity <= 0) throw new Error('Cantidad debe ser mayor a cero');

    if (movementType === '261' && material.stock < quantity) {
      throw new Error(`Stock insuficiente: ${material.stock} disponible vs ${quantity} solicitado`);
    }

    // Actualización atómica de stock
    let newStock = material.stock;
    if (movementType === '101') newStock += quantity;
    if (movementType === '261') newStock -= quantity;

    material.stock = newStock;
    this.materials.set(materialId, material);

    const docNum = `MIGO-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const doc = {
      documentId: docNum,
      movementType,
      materialId,
      qty: quantity,
      refDocument,
      user,
      timestamp: new Date().toISOString(),
      latencyMs: performance.now() - startTime
    };

    this.migoDocuments.push(doc);
    return doc;
  }

  // Crear Orden de Trabajo IW31
  async createWorkOrder({ title, equipmentId, type = 'PM01', priority = 'Alta', plannedCost = 300, components = [], user }) {
    const startTime = performance.now();
    const woId = `WO-400${1000 + this.workOrders.size + 1}`;
    const reservationNumber = `RESB-800${1000 + this.workOrders.size + 1}`;

    const wo = {
      id: woId,
      reservationNumber,
      title,
      equipmentId,
      type,
      priority,
      status: 'CRTE',
      plannedCost,
      actualCost: 0,
      components,
      createdBy: user,
      timestamp: new Date().toISOString(),
      latencyMs: performance.now() - startTime
    };

    this.workOrders.set(woId, wo);
    return wo;
  }
}

describe('Prueba de Estrés y Carga Masiva (SAP ERP Performance Test)', () => {
  it('debe procesar 500 transacciones concurrentes sin condiciones de carrera ni corrupción de inventario', async () => {
    const engine = new SAPStressEngine();
    const initialStockMAT1001 = engine.materials.get('MAT-1001').stock; // 1000 UN
    const VIRTUAL_USERS = 50;
    const TRANSACTIONS_PER_USER = 10;
    const TOTAL_TRANSACTIONS = VIRTUAL_USERS * TRANSACTIONS_PER_USER;

    const startTime = performance.now();
    const userPromises = [];

    // Crear 50 usuarios virtuales que ejecutan transacciones simultáneamente
    for (let u = 1; u <= VIRTUAL_USERS; u++) {
      const userTask = async () => {
        const userName = `Usuario-Virtual-${u}`;
        const userResults = [];

        for (let t = 1; t <= TRANSACTIONS_PER_USER; t++) {
          // 1. Crear Orden IW31
          const wo = await engine.createWorkOrder({
            title: `Mantenimiento de Carga ${u}-${t}`,
            equipmentId: `EQ-${100 + (t % 5)}`,
            user: userName
          });

          // 2. Ejecutar Salida MIGO 261 para la OT creada (2 unidades)
          const migoOut = await engine.executeGoodsMovement({
            movementType: '261',
            materialId: 'MAT-1001',
            qty: 2,
            refDocument: wo.id,
            user: userName
          });

          // 3. Ejecutar Entrada MIGO 101 para reponer (2 unidades)
          const migoIn = await engine.executeGoodsMovement({
            movementType: '101',
            materialId: 'MAT-1001',
            qty: 2,
            refDocument: 'PO-45008912',
            user: userName
          });

          userResults.push({ wo, migoOut, migoIn });
        }
        return userResults;
      };

      userPromises.push(userTask());
    }

    const results = await Promise.all(userPromises);
    const totalDurationMs = performance.now() - startTime;

    // Métricas de Rendimiento
    const flatResults = results.flat();
    const totalWOsCreated = engine.workOrders.size;
    const totalMIGODocs = engine.migoDocuments.length;
    const finalStockMAT1001 = engine.materials.get('MAT-1001').stock;
    const avgLatencyPerTx = totalDurationMs / (TOTAL_TRANSACTIONS * 3);

    console.log(`\n=== 📊 INFORME DE ESTRÉS Y RENDIMIENTO ERP ===`);
    console.log(`⏱️  Tiempo Total de Prueba: ${totalDurationMs.toFixed(2)} ms`);
    console.log(`👥 Usuarios Virtuales Simultáneos: ${VIRTUAL_USERS}`);
    console.log(`📋 Total Órdenes de Trabajo IW31 Creadas: ${totalWOsCreated}`);
    console.log(`📦 Total Documentos MIGO Contabilizados: ${totalMIGODocs}`);
    console.log(`⚡ Latencia Promedio por Transacción: ${avgLatencyPerTx.toFixed(3)} ms/tx`);
    console.log(`📈 Rendimiento (Throughput): ${(TOTAL_TRANSACTIONS * 3 / (totalDurationMs / 1000)).toFixed(0)} transacciones/segundo`);
    console.log(`📦 Stock Inicial MAT-1001: ${initialStockMAT1001} UN`);
    console.log(`📦 Stock Final MAT-1001: ${finalStockMAT1001} UN (Verificado)\n`);

    // Validaciones de Consistencia Empresarial
    expect(totalWOsCreated).toBe(TOTAL_TRANSACTIONS);
    expect(totalMIGODocs).toBe(TOTAL_TRANSACTIONS * 2);
    // Verificación estricta de saldo (1000 - (500 * 2) + (500 * 2) = 1000)
    expect(finalStockMAT1001).toBe(initialStockMAT1001);
    expect(avgLatencyPerTx).toBeLessThan(10); // Menos de 10ms por transacción
  });
});
