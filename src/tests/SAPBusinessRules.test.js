import { describe, it, expect } from 'vitest';

/**
 * Suite de pruebas unitarias para validar las Reglas de Negocio Industriales SAP PM/MM
 */

// 1. Regla de Negocio IW31: Horómetros e Indicadores no decrecientes
const validateCounterReadings = (lastHourmeter, newHourmeter, lastOdometer, newOdometer) => {
  if (newHourmeter !== null && newHourmeter !== undefined && lastHourmeter > 0 && newHourmeter < lastHourmeter) {
    return { valid: false, reason: 'HOROMETER_LESS_THAN_PREVIOUS' };
  }
  if (newOdometer !== null && newOdometer !== undefined && lastOdometer > 0 && newOdometer < lastOdometer) {
    return { valid: false, reason: 'ODOMETER_LESS_THAN_PREVIOUS' };
  }
  return { valid: true };
};

// 2. Regla de Negocio IW31: Bloqueo de Órdenes de Trabajo duplicadas activas
const isDuplicateActiveWorkOrder = (existingWorkOrders, targetEquipmentId, targetType) => {
  return existingWorkOrders.some(w =>
    w.equipmentId === targetEquipmentId &&
    w.type === targetType &&
    (w.status === 'CRTE' || w.status === 'REL' || w.status === 'PCNF')
  );
};

// 3. Regla MIGO Engine: Cálculo de stock resultante
const calculateMIGOStockUpdate = (currentStock, movementType, quantity) => {
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) throw new Error('CANTIDAD_INVALIDA');

  if (movementType === '101') {
    return currentStock + qty;
  }
  if (movementType === '261') {
    if (currentStock < qty) throw new Error('STOCK_INSUFICIENTE');
    return currentStock - qty;
  }
  return currentStock;
};

describe('Reglas de Negocio SAP PM/MM (Suite de Calidad ERP)', () => {
  describe('IW31: Lectura de Contadores e Indicadores', () => {
    it('debe rechazar un horómetro menor a la última lectura registrada (4250 hrs vs 4100 hrs)', () => {
      const result = validateCounterReadings(4250, 4100, 185000, 190000);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('HOROMETER_LESS_THAN_PREVIOUS');
    });

    it('debe permitir una lectura de horómetro válida o superior (4250 hrs vs 4300 hrs)', () => {
      const result = validateCounterReadings(4250, 4300, 185000, 190000);
      expect(result.valid).toBe(true);
    });

    it('debe rechazar un kilometraje menor al último registrado (185000 km vs 180000 km)', () => {
      const result = validateCounterReadings(4250, 4300, 185000, 180000);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('ODOMETER_LESS_THAN_PREVIOUS');
    });
  });

  describe('IW31: Validaciones de Existencia de Equipo en Maestro de Activos', () => {
    const assetMaster = [
      { id: 'EQ-101', name: 'Chancador Primario' },
      { id: 'EQ-102', name: 'Camión CAEX 797F' }
    ];

    const validateEquipmentExists = (targetId) => {
      return assetMaster.some(a => a.id === targetId);
    };

    it('debe aprobar la creación de OT para un equipo existente (EQ-101)', () => {
      expect(validateEquipmentExists('EQ-101')).toBe(true);
    });

    it('debe rechazar la creación de OT para un equipo inexistente (EQ-999)', () => {
      expect(validateEquipmentExists('EQ-999')).toBe(false);
    });
  });

  describe('IW31: Validaciones de Existencia del Técnico Responsable en HCM', () => {
    const employeeMaster = [
      { id: 'EMP-1001', name: 'Jorge Silva San Martín', position: 'Técnico Senior' },
      { id: 'EMP-1002', name: 'Carlos Mendoza Morales', position: 'Especialista Mecánico' }
    ];

    const validateTechnicianExists = (techName) => {
      const nameClean = (techName || '').trim().toLowerCase();
      return employeeMaster.some(e =>
        e.name.toLowerCase().includes(nameClean) ||
        e.id.toLowerCase() === nameClean ||
        nameClean.includes(e.name.toLowerCase())
      );
    };

    it('debe aprobar la asignación de un técnico registrado en HCM (Jorge Silva)', () => {
      expect(validateTechnicianExists('Jorge Silva San Martín')).toBe(true);
    });

    it('debe rechazar la asignación de un técnico no registrado en HCM (Pedro Fantasma)', () => {
      expect(validateTechnicianExists('Pedro Fantasma')).toBe(false);
    });
  });

  describe('IW31: Sistema Estandarizado de Códigos de Error SAP PM', () => {
    const getErrorCode = ({ targetAssetExists, targetTechExists, duplicateActiveWO, isLowerValueDetected, isCounterCorrection, hasReservedMaterial }) => {
      if (!targetAssetExists) return 'IW31-E001';
      if (!targetTechExists) return 'IW31-E002';
      if (duplicateActiveWO) return 'IW31-E003';
      if (isLowerValueDetected && !isCounterCorrection) return 'IW31-E004';
      if (!hasReservedMaterial) return 'IW31-E005';
      return null;
    };

    it('debe retornar IW31-E001 si el equipo no existe', () => {
      const code = getErrorCode({ targetAssetExists: false, targetTechExists: true, hasReservedMaterial: true });
      expect(code).toBe('IW31-E001');
    });

    it('debe retornar IW31-E002 si el técnico no existe en HCM', () => {
      const code = getErrorCode({ targetAssetExists: true, targetTechExists: false, hasReservedMaterial: true });
      expect(code).toBe('IW31-E002');
    });

    it('debe retornar IW31-E003 si existe una orden activa duplicada', () => {
      const code = getErrorCode({ targetAssetExists: true, targetTechExists: true, duplicateActiveWO: true, hasReservedMaterial: true });
      expect(code).toBe('IW31-E003');
    });

    it('debe retornar IW31-E004 si la lectura del contador es menor sin autorización', () => {
      const code = getErrorCode({ targetAssetExists: true, targetTechExists: true, isLowerValueDetected: true, isCounterCorrection: false, hasReservedMaterial: true });
      expect(code).toBe('IW31-E004');
    });

    it('debe retornar IW31-E005 si no se seleccionó un repuesto MM obligatorio', () => {
      const code = getErrorCode({ targetAssetExists: true, targetTechExists: true, hasReservedMaterial: false });
      expect(code).toBe('IW31-E005');
    });
  });

  describe('IW31: Prevención de Órdenes Duplicadas', () => {
    const existingWOs = [
      { id: 'WO-400101', equipmentId: 'EQ-101', type: 'PM01', status: 'REL' },
      { id: 'WO-400102', equipmentId: 'EQ-102', type: 'PM02', status: 'CRTE' },
      { id: 'WO-400103', equipmentId: 'EQ-101', type: 'PM03', status: 'TECO' }
    ];

    it('debe bloquear una nueva OT PM01 para EQ-101 mientras exista WO-400101 en estado REL', () => {
      const isDuplicate = isDuplicateActiveWorkOrder(existingWOs, 'EQ-101', 'PM01');
      expect(isDuplicate).toBe(true);
    });

    it('debe permitir crear una nueva OT PM03 para EQ-101 ya que la anterior está en TECO (Cierre Técnico)', () => {
      const isDuplicate = isDuplicateActiveWorkOrder(existingWOs, 'EQ-101', 'PM03');
      expect(isDuplicate).toBe(false);
    });
  });

  describe('MIGO Engine: Actualización de Inventario', () => {
    it('debe incrementar el stock correctamente en una entrada MIGO 101 (45 + 10 = 55)', () => {
      const newStock = calculateMIGOStockUpdate(45, '101', 10);
      expect(newStock).toBe(55);
    });

    it('debe descontar el stock correctamente en una salida MIGO 261 (45 - 5 = 40)', () => {
      const newStock = calculateMIGOStockUpdate(45, '261', 5);
      expect(newStock).toBe(40);
    });

    it('debe lanzar excepción al intentar salida MIGO 261 con stock insuficiente (10 disponibles vs 15 solicitadas)', () => {
      expect(() => calculateMIGOStockUpdate(10, '261', 15)).toThrow('STOCK_INSUFICIENTE');
    });
  });

  describe('SAP HCM: Acreditación por Faenas y Regla de Alerta 30 Días', () => {
    const calculateHRExpiryStatus = (targetDateStr, referenceDate = new Date('2026-08-17')) => {
      const today = new Date(referenceDate);
      today.setHours(0,0,0,0);
      const target = new Date(targetDateStr);
      target.setHours(0,0,0,0);
      const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (days <= 0) return { days, status: 'EXPIRED' };
      if (days <= 30) return { days, status: 'ALERT_30' };
      return { days, status: 'OK' };
    };

    it('debe marcar "ALERT_30" (Por Vencer) cuando falten 15 días para el vencimiento del examen ocupacional', () => {
      const result = calculateHRExpiryStatus('2026-09-01', new Date('2026-08-17'));
      expect(result.status).toBe('ALERT_30');
      expect(result.days).toBe(15);
    });

    it('debe marcar "EXPIRED" (Vencido) cuando la fecha limite fue superada', () => {
      const result = calculateHRExpiryStatus('2026-08-01', new Date('2026-08-17'));
      expect(result.status).toBe('EXPIRED');
      expect(result.days).toBeLessThanOrEqual(0);
    });

    it('debe mantener estatus "OK" cuando el vencimiento sea superior a 30 días', () => {
      const result = calculateHRExpiryStatus('2026-10-30', new Date('2026-08-17'));
      expect(result.status).toBe('OK');
      expect(result.days).toBeGreaterThan(30);
    });

    it('debe activar alerta de 30 días cuando un contrato a plazo fijo esté por vencer en 11 días', () => {
      const fixedTermContractExpiry = '2026-08-28';
      const result = calculateHRExpiryStatus(fixedTermContractExpiry, new Date('2026-08-17'));
      expect(result.status).toBe('ALERT_30');
      expect(result.days).toBe(11);
    });

    it('debe eximir de alertas de vencimiento a contratos con estatus Indefinido', () => {
      const contractType = 'Indefinido';
      const contractExpiry = null;
      const status = contractType === 'Plazo Fijo' && contractExpiry ? calculateHRExpiryStatus(contractExpiry, new Date('2026-08-17')).status : 'OK';
      expect(status).toBe('OK');
    });

    it('debe limpiar la alerta únicamente tras ingresar una nueva fecha renovada a futuro', () => {
      let currentExpiry = '2026-08-25'; // 8 días -> Alerta activa
      let statusBefore = calculateHRExpiryStatus(currentExpiry, new Date('2026-08-17')).status;
      expect(statusBefore).toBe('ALERT_30');

      // Actualización manual de fecha realizada por el usuario
      currentExpiry = '2027-08-25'; // Renovación a 1 año
      let statusAfter = calculateHRExpiryStatus(currentExpiry, new Date('2026-08-17')).status;
      expect(statusAfter).toBe('OK');
    });

    it('debe evaluar el estado de operación independientemente para múltiples faenas acreditadas', () => {
      const empMultiFaena = {
        id: 'EMP-TEST-MULTI',
        name: 'Prueba Multi Faena',
        faenasAccredited: [
          { faenaName: 'Mina Norte', medicalExamExpiry: '2027-08-01', accreditationExpiry: '2027-10-01', safetyCourseExpiry: '2027-09-01' },
          { faenaName: 'Planta Chancado', medicalExamExpiry: '2026-08-01', accreditationExpiry: '2027-10-01', safetyCourseExpiry: '2027-09-01' } // Examen vencido en Planta Chancado
        ]
      };

      const minaStatus = calculateHRExpiryStatus(empMultiFaena.faenasAccredited[0].medicalExamExpiry, new Date('2026-08-17')).status;
      const plantaStatus = calculateHRExpiryStatus(empMultiFaena.faenasAccredited[1].medicalExamExpiry, new Date('2026-08-17')).status;

      expect(minaStatus).toBe('OK'); // Habilitado en Mina Norte
      expect(plantaStatus).toBe('EXPIRED'); // Bloqueado en Planta Chancado
    });
  });

  describe('Formateo Estándar de Fechas dd-MM-yyyy', () => {
    it('debe transformar una fecha YYYY-MM-DD a formato dd-MM-yyyy', () => {
      const { formatDateDDMMYYYY } = require('../utils/dateUtils');
      expect(formatDateDDMMYYYY('2026-08-30')).toBe('30-08-2026');
      expect(formatDateDDMMYYYY('2021-03-15')).toBe('15-03-2021');
    });

    it('debe manejar correctamente valores nulos o no definidos', () => {
      const { formatDateDDMMYYYY } = require('../utils/dateUtils');
      expect(formatDateDDMMYYYY(null)).toBe('N/A');
      expect(formatDateDDMMYYYY(undefined)).toBe('N/A');
    });
  });

  describe('Validaciones de Edición de Ficha de Colaborador (PA30)', () => {
    it('debe validar correctamente el formato de RUT chileno (XX.XXX.XXX-X o XXXXXXXX-X)', () => {
      const rutRegex = /^(\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\d{7,8}-[\dkK])$/;
      expect(rutRegex.test('15.482.910-3')).toBe(true);
      expect(rutRegex.test('17320145-K')).toBe(true);
      expect(rutRegex.test('12345')).toBe(false); // Invalido
      expect(rutRegex.test('texto-invalido')).toBe(false); // Invalido
    });

    it('debe validar el formato de correo electrónico obligatorio', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('jorge.silva@empresa.cl')).toBe(true);
      expect(emailRegex.test('correo-sin-arroba.cl')).toBe(false);
    });

    it('debe exigir fecha de vencimiento si el tipo de contrato cambia a Plazo Fijo', () => {
      const validateContractExpiry = (type, expiry) => type === 'Plazo Fijo' ? Boolean(expiry) : true;
      expect(validateContractExpiry('Plazo Fijo', '')).toBe(false);
      expect(validateContractExpiry('Plazo Fijo', '2026-12-31')).toBe(true);
      expect(validateContractExpiry('Indefinido', '')).toBe(true);
    });

    it('debe actualizar sincronizadamente la fecha de examen médico en la ficha y en faenas acreditadas', () => {
      const emp = {
        id: 'EMP-1001',
        name: 'Jorge Silva',
        medicalExamExpiry: '2026-05-01',
        faenasAccredited: [
          { id: 'ACC-1', faenaName: 'Planta Central', medicalExamExpiry: '2026-05-01' }
        ]
      };

      const newDate = '2027-08-15';
      const updatedFaenas = emp.faenasAccredited.map(f => ({ ...f, medicalExamExpiry: newDate }));
      const updatedEmp = { ...emp, medicalExamExpiry: newDate, faenasAccredited: updatedFaenas };

      expect(updatedEmp.medicalExamExpiry).toBe('2027-08-15');
      expect(updatedEmp.faenasAccredited[0].medicalExamExpiry).toBe('2027-08-15');
    });
  });

  describe('MM: Reglas de Validación para Eliminación/Desincorporación de Materiales', () => {
    const validateMaterialDeletion = (material, activeWorkOrders) => {
      if (!material) return { canDelete: false, reason: 'NOT_FOUND' };
      if (Number(material.stock || 0) > 0) return { canDelete: false, reason: 'ACTIVE_STOCK' };
      const hasActiveReservation = activeWorkOrders.some(wo =>
        ['CRTE', 'REL', 'PCNF'].includes(wo.status) && (
          wo.plannedMaterialId === material.id ||
          (Array.isArray(wo.components) && wo.components.some(c => c.materialId === material.id))
        )
      );
      if (hasActiveReservation) return { canDelete: false, reason: 'ACTIVE_RESERVATION' };
      return { canDelete: true };
    };

    it('debe bloquear la eliminación si el material tiene stock físico activo (>0 UN)', () => {
      const mat = { id: 'MAT-1001', name: 'Filtro de Aceite', stock: 15, unit: 'UN' };
      const res = validateMaterialDeletion(mat, []);
      expect(res.canDelete).toBe(false);
      expect(res.reason).toBe('ACTIVE_STOCK');
    });

    it('debe bloquear la eliminación si el material está reservado en una Orden de Trabajo activa', () => {
      const mat = { id: 'MAT-2002', name: 'Correa de Transmisión', stock: 0, unit: 'UN' };
      const wos = [{ id: 'WO-1001', status: 'REL', plannedMaterialId: 'MAT-2002' }];
      const res = validateMaterialDeletion(mat, wos);
      expect(res.canDelete).toBe(false);
      expect(res.reason).toBe('ACTIVE_RESERVATION');
    });

    it('debe permitir la eliminación si el stock es 0 y no existen reservas activas en OTs', () => {
      const mat = { id: 'MAT-3003', name: 'Empaquetadura Obsoleta', stock: 0, unit: 'UN' };
      const res = validateMaterialDeletion(mat, []);
      expect(res.canDelete).toBe(true);
    });
  });
});



