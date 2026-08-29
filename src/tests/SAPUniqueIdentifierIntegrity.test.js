import { describe, it, expect } from 'vitest';

describe('SAP ERP - Regla 9: Unicidad Estricta de RUT de Personal y Patentes de Flota', () => {
  it('debe detectar RUTs duplicados en la lista de colaboradores', () => {
    const employees = [
      { id: 'EMP-1001', rut: '15.420.890-K', name: 'Carlos Mendoza' },
      { id: 'EMP-1002', rut: '18.310.450-4', name: 'Ana Torres' }
    ];

    const isDuplicateRUT = (newRUT) => {
      const clean = newRUT.replaceAll('.', '').replaceAll('-', '').toLowerCase().trim();
      return employees.some(e => e.rut.replaceAll('.', '').replaceAll('-', '').toLowerCase().trim() === clean);
    };

    expect(isDuplicateRUT('15.420.890-K')).toBe(true);
    expect(isDuplicateRUT('15420890k')).toBe(true);
    expect(isDuplicateRUT('19.888.777-6')).toBe(false);
  });

  it('debe detectar Patentes / IDs duplicados en el Maestro de Equipos y Flota', () => {
    const assets = [
      { id: 'EQ-C101', plate: 'AB-1234', name: 'Camión Aljibe' },
      { id: 'EQ-C102', plate: 'CD-5678', name: 'Chancador Primario' }
    ];

    const isDuplicatePlateOrID = (newPlateOrId) => {
      const clean = newPlateOrId.replaceAll('-', '').toLowerCase().trim();
      return assets.some(a =>
        a.plate.replaceAll('-', '').toLowerCase().trim() === clean ||
        a.id.replaceAll('-', '').toLowerCase().trim() === clean
      );
    };

    expect(isDuplicatePlateOrID('AB-1234')).toBe(true);
    expect(isDuplicatePlateOrID('ab1234')).toBe(true);
    expect(isDuplicatePlateOrID('EQ-C101')).toBe(true);
    expect(isDuplicatePlateOrID('XY-9999')).toBe(false);
  });
});
