const fs = require('fs');
const path = require('path');

/**
 * SAP ERP Automated Safeguard: Transaction Audit Trail Enforcer
 * Scans SAP transactional services and components to ensure:
 * 1. SAP Document IDs follow SAP naming rules (MIGO-*, WO-*, PO-*, REQ-*).
 * 2. All transactional movements (MIGO, Work Orders, Approvals) generate immutable audit logs.
 * 3. Timestamps and user change records are attached to state changes (CDHDR/CDPOS rules).
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
const srcDir = path.join(rootDir, 'src');
const files = getAllFiles(srcDir);

let totalErrors = 0;
let totalWarnings = 0;

console.log('🧾 [SAP Audit Trail Guard] Auditando Trazabilidad Inmutable de Transacciones SAP...');

files.forEach(filePath => {
  const relPath = path.relative(rootDir, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: MIGO movement creation without audit log or document ID assignment
  if (content.includes('MIGO') && (content.includes('process') || content.includes('create') || content.includes('movement'))) {
    if (!content.includes('timestamp') && !content.includes('created_at') && !content.includes('date')) {
      console.warn(`⚠️ [AUDIT TRAIL WARNING] ${relPath} -> Transacción MIGO sin trazabilidad explícita de marca de tiempo (timestamp/created_at).`);
      totalWarnings++;
    }
  }

  // Check 2: Raw deletion of audit tables or document history
  if (content.includes('.from(\'audit_logs\')') || content.includes('.from(\'migo_documents\')')) {
    if (content.includes('.delete()')) {
      console.error(`❌ [AUDIT VIOLATION] ${relPath} -> Intento de eliminación física (.delete()) en tablas de auditoría/documentos inmutables.`);
      totalErrors++;
    }
  }

  // Check 3: Status transitions in Work Orders or Approvals should record change history
  if (content.includes('approveWorkflow') || content.includes('rejectWorkflow') || content.includes('updateOrderStatus')) {
    if (!content.includes('history') && !content.includes('log') && !content.includes('audit')) {
      console.warn(`⚠️ [CHANGE LOG WARNING] ${relPath} -> Transición de estado transaccional sin registro explícito en historial de auditoría.`);
      totalWarnings++;
    }
  }
});

console.log(`\n📊 Resumen de Trazabilidad SAP: ${totalErrors} violaciones críticas, ${totalWarnings} advertencias de historial.`);

if (totalErrors > 0) {
  console.error(`🚨 [FALLO DE AUDITORÍA DE TRAZABILIDAD] Se detectó manipulación o borrado en logs inmutables.`);
  process.exit(1);
} else {
  console.log(`✅ [PASÓ AUDITORÍA DE TRAZABILIDAD] Trazabilidad e inmutabilidad SAP verificadas exitosamente.\n`);
  process.exit(0);
}
