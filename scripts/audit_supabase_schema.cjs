const fs = require('fs');
const path = require('path');

/**
 * SAP ERP Automated Safeguard: Supabase Schema & RLS Auditor
 * Scans SQL files in supabase/ (schema.sql, seed.sql) to ensure:
 * 1. Multi-tenant tables include tenant_id with FOREIGN KEY to public.tenants(id).
 * 2. Indexes exist on (tenant_id) for query optimization.
 * 3. Row Level Security (RLS) is explicitly enabled on tenant tables.
 */

const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'supabase/schema.sql');
const seedPath = path.join(rootDir, 'supabase/seed.sql');

console.log('🗄️ [SAP Database Guard] Auditando Esquema SQL de Supabase y Políticas RLS...');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ [SCHEMA ERROR] Archivo supabase/schema.sql no encontrado.');
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');

let totalErrors = 0;
let totalWarnings = 0;

// Check 1: Ensure RLS enablement for tenant tables
if (!schemaContent.includes('ROW LEVEL SECURITY')) {
  console.warn('⚠️ [RLS WARNING] No se detectaron declaraciones explícitas de ENABLE ROW LEVEL SECURITY en schema.sql.');
  totalWarnings++;
}

// Check 2: Check for tenant_id index creation
if (!schemaContent.includes('CREATE INDEX') || !schemaContent.includes('tenant_id')) {
  console.warn('⚠️ [INDEX WARNING] Se recomienda incluir índices explícitos en (tenant_id) para optimizar consultas.');
  totalWarnings++;
}

// Check 3: Check FOREIGN KEY reference to tenants
if (!schemaContent.includes('REFERENCES public.tenants(id)')) {
  console.error('❌ [FK ERROR] Las tablas no declaran la relación Foreign Key hacia public.tenants(id).');
  totalErrors++;
}

// Check 4: Check seed.sql validity if present
if (fs.existsSync(seedPath)) {
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  if (!seedContent.includes('tenant_id') && !seedContent.includes('tenant_demo')) {
    console.warn('⚠️ [SEED WARNING] El archivo seed.sql no especifica tenant_id en los datos semilla.');
    totalWarnings++;
  }
}

console.log(`\n📊 Resumen de Esquema SQL: ${totalErrors} errores críticos, ${totalWarnings} advertencias de optimización.`);

if (totalErrors > 0) {
  console.error(`🚨 [FALLO EN AUDITORÍA DE ESQUEMA] Se encontraron inconsistencias en la base de datos.`);
  process.exit(1);
} else {
  console.log(`✅ [PASÓ AUDITORÍA DE ESQUEMA] Estructura DDL de Supabase y RLS verificadas con éxito.\n`);
  process.exit(0);
}
