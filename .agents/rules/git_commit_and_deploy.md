# Git Commit & Automated CI/CD Deployment Rule

Al finalizar **cada iteración de desarrollo, corrección de errores o modificación completada** en el proyecto, el asistente DEBE ejecutar AUTOMÁTICAMENTE el flujo completo de commit y despliegue a producción (skill `git-commit-push` + despliegue en Firebase Hosting):

1. **Verificación Previa (QA Pipeline)**:
   - `npm run audit:imports`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
2. **Staging de Cambios**: `git add .`
3. **Commit Descriptivo**: `git commit -m "<tipo>(<alcance>): <descripción concisa de los cambios en español>"`
4. **Push a Repository Remote**: `git push origin main`
5. **Despliegue a Producción (Firebase Hosting)**:
   - `npx -y firebase-tools@latest deploy --only hosting`

*Nota: Si algún comando requiere intervención o credenciales interactivas, notificar inmediatamente al usuario indicando el paso exacto.*

