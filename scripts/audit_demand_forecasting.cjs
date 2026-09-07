const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * SAP ERP Automated Safeguard: Material Demand Forecasting & ML Validator
 * Scans material forecasting services to ensure:
 * 1. Safe handling of zero, negative, or invalid stock/demand parameters.
 * 2. Mathematical accuracy of safety stock & reorder point calculations.
 * 3. Runs SAPPredictiveML test suite to ensure ML model reliability.
 */

const rootDir = path.join(__dirname, '..');
const servicePath = path.join(rootDir, 'src/services/materialDemandForecastingService.js');

console.log('📈 [SAP Forecasting Guard] Auditando Algoritmos de Pronóstico de Demanda e Inventario ML...');

if (!fs.existsSync(servicePath)) {
  console.error('❌ [FORECASTING ERROR] Servicio materialDemandForecastingService.js no encontrado.');
  process.exit(1);
}

const content = fs.readFileSync(servicePath, 'utf8');

let totalErrors = 0;

// Check 1: Ensure safe handling of undefined/empty parameters
if (!content.includes('Number(material.stock || 0)') && !content.includes('Math.max')) {
  console.error('❌ [MATH RISK] El servicio no normaliza valores de stock a números válidos (Number/Math.max).');
  totalErrors++;
}

// Check 2: Safety stock calculation check
if (!content.includes('suggestedSafetyStock') || !content.includes('suggestedReorderPoint')) {
  console.error('❌ [ML MISSING] Falta el cálculo de Stock de Seguridad o Punto de Reorden sugerido.');
  totalErrors++;
}

if (totalErrors > 0) {
  console.error(`\n🚨 [FALLO EN PRONÓSTICO DE DEMANDA] Se encontraron ${totalErrors} problemas de cálculo en el motor ML.`);
  process.exit(1);
}

console.log('✅ Cobertura matemática de Stock de Seguridad y Punto de Reorden verificada.');
console.log('🧪 Ejecutando suite de pruebas de ML Predictivo (SAPPredictiveML.test.js)...');

try {
  execSync('npx vitest run src/tests/SAPPredictiveML.test.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('\n✅ [PASÓ AUDITORÍA DE PRONÓSTICO] Motor de IA/ML de Inventario verificado exitosamente.\n');
  process.exit(0);
} catch (error) {
  console.error('\n🚨 [FALLO EN TESTS DE ML] Las pruebas del motor de pronóstico fallaron.');
  process.exit(1);
}
