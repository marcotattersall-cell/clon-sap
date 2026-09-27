import { describe, it, expect } from 'vitest';
import { extractRAGContext } from '../services/ragContextEngine';
import { queryAICopilot } from '../services/aiCopilotService';

describe('RAG Context Engine & AI Copilot Unit Tests', () => {
  const mockERPState = {
    activeTenant: 'tenant_demo',
    workOrders: [
      { id: 'WO-101', title: 'Reparación Chancador', priority: 'Muy Alta', status: 'INPR', assignedTo: 'Juan Pérez' },
      { id: 'WO-102', title: 'Cambio Filtros Motor', priority: 'Media', status: 'TECO', assignedTo: 'Carlos M.' }
    ],
    materials: [
      { id: 'MAT-501', name: 'Correa Transportadora Heavy', stock: 2, reorderPoint: 5, unit: 'MET' },
      { id: 'MAT-502', name: 'Aceite Sintético 20W50', stock: 50, reorderPoint: 10, unit: 'LTS' }
    ],
    employees: [
      { id: 'EMP-01', name: 'Roberto Gómez', position: 'Operador Mina', medicalExamExpiry: '2026-10-05', accreditationExpiry: '2026-10-10' }
    ],
    assets: [
      { id: 'EQ-01', name: 'Chancadora Secundaria C-102', healthScore: 65, status: 'MAINTENANCE' }
    ]
  };

  it('debe extraer el contexto RAG de Órdenes PM adecuadamente', () => {
    const rag = extractRAGContext('¿Cuáles son las órdenes críticas?', mockERPState);
    expect(rag.targetTab).toBe('WORK_ORDERS');
    expect(rag.factCount).toBeGreaterThan(0);
    expect(rag.contextText).toContain('PM_WORK_ORDERS');
    expect(rag.contextText).toContain('Reparación Chancador');
  });

  it('debe extraer el contexto RAG de Inventarios MM en punto de reorden', () => {
    const rag = extractRAGContext('Revisar stock de repuestos y materiales bajo reorden', mockERPState);
    expect(rag.targetTab).toBe('INVENTORY');
    expect(rag.contextText).toContain('Correa Transportadora Heavy');
  });

  it('debe extraer el contexto RAG de Acreditaciones HCM', () => {
    const rag = extractRAGContext('Acreditaciones de personal por vencer', mockERPState);
    expect(rag.targetTab).toBe('HR');
    expect(rag.contextText).toContain('Roberto Gómez');
  });

  it('debe responder consultas con grounding RAG usando queryAICopilot', async () => {
    const result = await queryAICopilot('¿Qué órdenes de trabajo tienen prioridad muy alta?', mockERPState);
    expect(result.text).toContain('Reparación Chancador');
    expect(result.targetTab).toBe('WORK_ORDERS');
    expect(result.ragFactsUsed).toBeGreaterThan(0);
  });
});
