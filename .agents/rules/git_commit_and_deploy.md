# Git Commit & Automated CI/CD Deployment Rule

Al finalizar cada iteración de desarrollo, corrección de errores o nueva funcionalidad completada y verificada en el proyecto, el asistente DEBE realizar automáticamente el flujo completo de control de versiones y despliegue:

1. **Verificación Previa**: Asegurarse de que el build (`npm run build`) y las pruebas (`npm test` y `npm run audit:imports`) pasen sin errores.
2. **Staging de Cambios**:
   ```bash
   git add .
   ```
3. **Commit Descriptivo**:
   ```bash
   git commit -m "feat/fix/refactor: <descripción concisa de los cambios en español>"
   ```
4. **Push a Main para CI/CD**:
   ```bash
   git push origin main
   ```
   *Nota: Si el push requiere autenticación interactiva de credenciales en la terminal del usuario, notificar inmediatamente al usuario para que ejecute el `git push origin main` o proporcione las credenciales.*
