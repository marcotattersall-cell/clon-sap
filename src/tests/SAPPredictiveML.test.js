import { describe, it, expect } from 'vitest';
import { detectTelemetryAnomalies, predictAssetRUL } from '../services/pdmPredictiveMaintenanceService';
import { predictMaterialDemand, forecastCatalogDemand } from '../services/materialDemandForecastingService';
import { classifyNotificationText } from '../services/notificationNLPClassifierService';

describe('Suite de Machine Learning: Módulos 1, 2 y 3 (PM, MM, IW31)', () => {
  describe('Módulo 1: Mantenimiento Predictivo RUL IoT (pdmPredictiveMaintenanceService)', () => {
    it('debe detectar anomalías térmicas y de vibración críticas', () => {
      const criticalLog = { engineTemp: 105, vibrationRms: 6.8 };
      const diag = detectTelemetryAnomalies(criticalLog);
      expect(diag.severity).toBe('CRITICAL');
      expect(diag.issue).toContain('ANOMALÍA CRÍTICA COMBINADA');
    });

    it('debe predecir un RUL menor cuando hay anomalías críticas en el activo', () => {
      const asset = { id: 'EQ-101', name: 'CAT 336', hourmeter: 4250, healthScore: 94 };
      const criticalLogs = [{ equipmentId: 'EQ-101', engineTemp: 104, vibrationRms: 6.5 }];

      const prediction = predictAssetRUL(asset, criticalLogs);
      expect(prediction.diagnosis.severity).toBe('CRITICAL');
      expect(prediction.predictedRulHours).toBeLessThan(100);
      expect(prediction.recommendedAction).toContain('EMITIR ORDEN DE TRABAJO CORRECTIVA');
    });
  });

  describe('Módulo 2: Pronóstico Inteligente de Demanda MM (materialDemandForecastingService)', () => {
    it('debe predecir el consumo a 30, 60 y 90 días y ajustar el stock de seguridad', () => {
      const material = { id: 'MAT-1001', name: 'Filtro de Aceite', stock: 8, reorderPoint: 15, unitPrice: 25000 };
      const migoExits = [
        { materialId: 'MAT-1001', movementType: '261', quantity: 5 },
        { materialId: 'MAT-1001', movementType: '261', quantity: 6 }
      ];

      const forecast = predictMaterialDemand(material, migoExits);
      expect(forecast.projectedDemand30d).toBeGreaterThan(10);
      expect(forecast.suggestedReorderPoint).toBeGreaterThan(0);
      expect(forecast.stockoutRisk).toBe('HIGH');
      expect(forecast.purchaseRecommendation).toContain('ADVERTENCIA: Stock bajo Punto de Reorden');
    });
  });

  describe('Módulo 3: Auto-Priorización NLP de Avisos IW31 (notificationNLPClassifierService)', () => {
    it('debe auto-clasificar la prioridad como Muy Alta cuando detecta humo o fuego', () => {
      const text = "El motor presenta humo negro y fuga masiva de aceite caliente en el turbo";
      const result = classifyNotificationText(text);

      expect(result.suggestedPriority).toBe('Muy Alta');
      expect(result.suggestedComponent).toBe('Motor & Propulsión');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(75);
    });

    it('debe auto-clasificar problemas de orugas como Transmisión & Rodajes', () => {
      const text = "Ruido metalico fuerte en la caja cambios y desgaste en la oruga";
      const result = classifyNotificationText(text);

      expect(result.suggestedComponent).toBe('Transmisión & Rodajes');
    });
  });
});
