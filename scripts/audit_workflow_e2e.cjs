const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * SAP ERP Automated Safeguard: End-to-End Workflow Tester
 * Scans integration test suites in src/tests/ to ensure complete cross-module coverage:
 * 1. PM ➔ MM ➔ FI integrated workflows (IW31 -> MIGO 261 -> Cost Accumulation).
 * 2. Multi-tenant load & stress tests (SAP50Tenants150UsersSimulation, SAPStressTest).
 * 3. Runs Vitest to confirm zero regressions in integrated business flows.
 */

const rootDir = path.join(__dirname, '..');
const testsDir = path.join(rootDir, 'src/tests');

console.log('🔄 [SAP E2E Guard] Auditando Cobertura y Ejecución de Flujos Integrados End-to-End...');

if (!fs.existsSync(testsDir)) {
  console.error('❌ [E2E ERROR] Directorio src/tests/ no encontrado.');
  process.exit(1);
}

const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));

const requiredFlows = [
  { name: 'Flujo Transaccional Integrado MM/PM (MIGO + WO)', pattern: /MIGO|IW31/i },
  { name: 'Simulación Multi-Tenant Masiva', pattern: /50Tenants|MultiTenancy/i },
  { name: 'Reglas de Negocio SAP & Stock Deduction', pattern: /BusinessRules|MassiveScale/i },
  { name: 'Pruebas de Estrés y Carga Concurrente', pattern: /StressTest|WorkOrderQAEngine/i }
];

let missingFlows = 0;

requiredFlows.forEach(flow => {
  const covered = testFiles.some(file => {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf8');
    return flow.pattern.test(file) || flow.pattern.test(content);
  });

  if (covered) {
    console.log(`  ✅ Cobertura E2E verificada: ${flow.name}`);
  } else {
    console.error(`  ❌ [COBERTURA FALTANTE] ${flow.name} no posee suite de pruebas E2E asignada.`);
    missingFlows++;
  }
});

if (missingFlows > 0) {
  console.error(`\n🚨 [FALLO COBERTURA E2E] Se encontraron ${missingFlows} flujos SAP no cubiertos por pruebas integradas.`);
  process.exit(1);
}

console.log('\n🧪 Ejecutando suites de pruebas Vitest para validar flujos integrados...');

try {
  execSync('npx vitest run --silent=false', { cwd: rootDir, stdio: 'inherit' });
  console.log('\n✅ [PASÓ AUDITORÍA E2E] 100% de los flujos integrados SAP pasaron la suite E2E.\n');
  process.exit(0);
} catch (error) {
  console.error('\n🚨 [FALLO EN PRUEBAS E2E] Una o más pruebas integradas fallaron en Vitest.');
  process.exit(1);
}
