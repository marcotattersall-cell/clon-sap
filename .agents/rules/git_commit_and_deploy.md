# Git Commit & Automated CI/CD Deployment Rule

Al finalizar **cada iteración de desarrollo, corrección de errores o modificación completada** en el proyecto, el asistente DEBE ejecutar AUTOMÁTICAMENTE la skill **`git-commit-push`** para realizar la auditoría, staging, commit convencional y despliegue:

1. **Verificación Previa**: Ejecutar `npm run audit:imports` y `npm run test` (Vitest).
2. **Staging de Cambios**: `git add .`
3. **Commit Descriptivo**: `git commit -m "<tipo>(<alcance>): <descripción concisa de los cambios en español>"`
4. **Push a Remote**: `git push origin main`

*Nota: Si el push requiere autenticación interactiva de credenciales en la terminal del usuario, notificar inmediatamente al usuario para que proporcione credenciales.*
