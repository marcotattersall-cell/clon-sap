import { describe, it, expect } from 'vitest';
import {
  calculateMean,
  calculateStdDev,
  calculateZScore,
  detectPayrollAnomalies
} from '../services/hcmAnomalyDetectionService';

describe('Motor de Machine Learning: Auditoría de Anomalías HCM', () => {
  it('debe calcular la media y desviación estándar correctamente', () => {
    const values = [10, 20, 30, 40, 50];
    const mean = calculateMean(values);
    expect(mean).toBe(30);

    const stdDev = calculateStdDev(values, mean);
    expect(stdDev).toBeCloseTo(15.81, 1);
  });

  it('debe calcular el Z-Score de un valor atípico', () => {
    const mean = 100;
    const stdDev = 10;
    const zScore = calculateZScore(130, mean, stdDev);
    expect(zScore).toBe(3.0);
  });

  it('debe detectar anomalía CRÍTICA cuando hay horas extras desproporcionadas', () => {
    const mockPayrollRuns = [
      { id: '1', employeeId: 'E1', department: 'Mina', overtimeHours: 5, baseSalary: 1000000, totalNet: 900000 },
      { id: '2', employeeId: 'E2', department: 'Mina', overtimeHours: 4, baseSalary: 1000000, totalNet: 880000 },
      { id: '3', employeeId: 'E3', department: 'Mina', overtimeHours: 6, baseSalary: 1000000, totalNet: 910000 },
      { id: '4', employeeId: 'E4', department: 'Mina', overtimeHours: 5, baseSalary: 1000000, totalNet: 890000 },
      // Registro anómalo con 45 horas extras y neto inflado
      { id: '5', employeeId: 'E5', department: 'Mina', overtimeHours: 45, baseSalary: 1000000, totalNet: 2100000 }
    ];

    const audited = detectPayrollAnomalies(mockPayrollRuns, []);
    expect(audited.length).toBe(5);

    const anomalyRecord = audited.find(a => a.id === '5');
    expect(anomalyRecord).toBeDefined();
    expect(anomalyRecord.anomalyLevel).toBe('CRITICAL');
    expect(anomalyRecord.anomalyScore).toBeGreaterThanOrEqual(60);
    expect(anomalyRecord.zOvertimeScore).toBeGreaterThan(1.5);
    expect(anomalyRecord.reasons[0]).toContain('Horas Extras');
  });

  it('debe clasificar como NORMAL las liquidaciones dentro del rango estadístico', () => {
    const mockPayrollRuns = [
      { id: '1', employeeId: 'E1', department: 'Planta', overtimeHours: 2, baseSalary: 1200000, totalNet: 1000000 },
      { id: '2', employeeId: 'E2', department: 'Planta', overtimeHours: 3, baseSalary: 1200000, totalNet: 1020000 },
      { id: '3', employeeId: 'E3', department: 'Planta', overtimeHours: 2, baseSalary: 1200000, totalNet: 990000 }
    ];

    const audited = detectPayrollAnomalies(mockPayrollRuns, []);
    const normalRecord = audited[0];
    expect(normalRecord.anomalyLevel).toBe('NORMAL');
    expect(normalRecord.anomalyScore).toBeLessThan(30);
  });
});
