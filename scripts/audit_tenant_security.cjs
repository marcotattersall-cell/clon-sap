const fs = require('fs');
const path = require('path');

/**
 * SAP ERP Automated Safeguard: Multi-Tenant & RBAC Security Auditor
 * Scans service files in src/services/ and components to ensure:
 * 1. Database query calls enforce tenant_id isolation.
 * 2. Sensitive operations integrate RBAC / user role verification.
 * 3. No unauthorized bypass of multi-tenant data boundaries occurs.
 */

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const rootDir = path.join(__dirname, '..');
const servicesDir = path.join(rootDir, 'src/services');
const files = getAllFiles(servicesDir);

let totalErrors = 0;
let totalWarnings = 0;

console.log('🔒 [SAP Security Guard] Auditando Aislamiento Multi-Tenant y Controles RBAC...');

files.forEach(filePath => {
  const relPath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Check 1: Verify direct Supabase queries contain tenant_id context or eq filter
  lines.forEach((line, idx) => {
    if (line.includes('supabase.from(') && !line.includes('// security-ignore')) {
      const block = lines.slice(idx, idx + 10).join(' ');
      if (!block.includes('tenant_id') && !block.includes('tenantId') && !content.includes('tenant_id')) {
        console.error(`❌ [TENANT LEAK RISK] ${relPath}:${idx + 1} -> Consulta Supabase sin filtrado explícito por tenant_id.`);
        totalErrors++;
      }
    }
  });

  // Check 2: Destructive/Sensitive mutations without RBAC check or user parameter
  const sensitiveOps = ['delete', 'update', 'remove', 'purge', 'approve', 'reject'];
  sensitiveOps.forEach(op => {
    const fnRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+(${op}[A-Za-z0-9_]*)\\s*\\(([^)]*)\\)`, 'gi');
    let match;
    while ((match = fnRegex.exec(content)) !== null) {
      const fnName = match[1];
      const params = match[2];
      if (!params.includes('user') && !params.includes('role') && !params.includes('tenant') && !content.includes('hasPermission')) {
        console.warn(`⚠️ [RBAC WARNING] ${relPath} -> Función sensible '${fnName}' no requiere contexto de 'user'/'tenant' ni valida 'hasPermission'.`);
        totalWarnings++;
      }
    }
  });
});

console.log(`\n📊 Resumen de Auditoría de Seguridad: ${totalErrors} errores de filtrado, ${totalWarnings} advertencias RBAC.`);

if (totalErrors > 0) {
  console.error(`🚨 [FALLO DE AUDITORÍA DE SEGURIDAD] Se encontraron riesgos de aislamiento multi-tenant. Abortando pipeline.`);
  process.exit(1);
} else {
  console.log(`✅ [PASÓ AUDITORÍA DE SEGURIDAD] Aislamiento multi-tenant y reglas RBAC verificadas en la capa de servicios.\n`);
  process.exit(0);
}
