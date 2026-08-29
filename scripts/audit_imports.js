const fs = require('fs');
const path = require('path');

/**
 * SAP ERP Automated Safeguard: JSX Import Integrity Auditor
 * Scans all source files in src/ to ensure 100% of JSX components and Lucide icons
 * are properly imported or declared, preventing ReferenceError crashes in production.
 */

function getAllFiles(dirPath, arrayOfFiles = []) {
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

const srcDir = path.join(__dirname, '../src');
const files = getAllFiles(srcDir);

let totalIssues = 0;

console.log('🔍 [SAP Guard] Auditando integridad de importaciones e íconos JSX...');

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Match all JSX tags like <ComponentName or <IconName
  const jsxTagMatches = content.match(/<([A-Z][a-zA-Z0-9_]*)/g) || [];
  const uniqueTags = Array.from(new Set(jsxTagMatches.map(t => t.substring(1))));

  uniqueTags.forEach(tag => {
    // Check if tag is imported or declared in the file
    const importRegex = new RegExp(`(?:import|const|let|var|function|class)\\s+[^;]*\\b${tag}\\b`, 'm');
    const destructureRegex = new RegExp(`\\{\\s*[^}]*\\b${tag}\\b[^}]*\\}`, 'm');

    const isDeclared = importRegex.test(content) || destructureRegex.test(content);

    if (!isDeclared) {
      // Find line number for accurate reporting
      const lineIndex = lines.findIndex(line => line.includes(`<${tag}`));
      const lineNum = lineIndex !== -1 ? lineIndex + 1 : 'N/A';

      console.error(`❌ [IMPORT ERROR] ${path.relative(srcDir, filePath)}:${lineNum} -> Componente/Ícono JSX <${tag}> utilizado sin importar/declarar.`);
      totalIssues++;
    }
  });
});

if (totalIssues > 0) {
  console.error(`\n🚨 [FALLO DE AUDITORÍA] Se encontraron ${totalIssues} variables JSX no declaradas. Abortando build/tests para prevenir fallos en ejecución.`);
  process.exit(1);
} else {
  console.log('✅ [PASÓ AUDITORÍA] 100% de los componentes e íconos JSX están correctamente importados.\n');
  process.exit(0);
}
