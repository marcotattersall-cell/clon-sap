import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SAP ERP Automated Safeguard: JSX Import & Icon Integrity Guard', () => {
  it('debe verificar que el 100% de los componentes e íconos JSX están importados en todos los archivos', () => {
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

    const srcDir = path.join(process.cwd(), 'src');
    const files = getAllFiles(srcDir);
    const unimportedTags = [];

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      const jsxTagMatches = content.match(/<([A-Z][a-zA-Z0-9_]*)/g) || [];
      const uniqueTags = Array.from(new Set(jsxTagMatches.map(t => t.substring(1))));

      uniqueTags.forEach(tag => {
        const importRegex = new RegExp(`(?:import|const|let|var|function|class)\\s+[^;]*\\b${tag}\\b`, 'm');
        const destructureRegex = new RegExp(`\\{\\s*[^}]*\\b${tag}\\b[^}]*\\}`, 'm');

        const isDeclared = importRegex.test(content) || destructureRegex.test(content);

        if (!isDeclared) {
          const lineIndex = lines.findIndex(line => line.includes(`<${tag}`));
          unimportedTags.push({
            file: path.relative(srcDir, filePath),
            line: lineIndex !== -1 ? lineIndex + 1 : 'N/A',
            tag
          });
        }
      });
    });

    if (unimportedTags.length > 0) {
      console.error('🚨 Tags no declarados encontrados:', unimportedTags);
    }

    expect(unimportedTags).toHaveLength(0);
  });
});
