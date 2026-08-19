# Reglas de Seguridad y Resguardo del Código

## 1. Protocolo Obligatorio de Post-Iteración (Zero Regression Policy)
Después de **CADA** iteración o modificación de código en la aplicación, se DEBEN ejecutar los siguientes pasos sin excepción antes de dar por finalizado el trabajo:
1. **Ejecutar Pruebas Automatizadas (`npm test`):** Verificar que el suite de pruebas (`vitest run`) ejecute con 100% de éxito (reglas PM/MM, sincronización CRDT y pruebas de estrés).
2. **Verificar Compilación de Producción (`npm run build`):** Confirmar que la compilación finalize con código de salida `0` sin errores de transpilación o pantalla en blanco.
3. **Ejecutar Auditoría Estática (`npm run lint`):** Correr `oxlint` para asegurar cero errores sintácticos.
4. **Generar Documento Walkthrough (`walkthrough.md`):** Actualizar o crear el resumen de la iteración con los cambios realizados y los resultados de las pruebas.

## 2. Auditoría de Variables de Estado en JSX
- Antes de guardar cualquier archivo `.jsx`, auditar que todas las variables y funciones utilizadas en el JSX (ej: `useState`, `useContext`, `props`, `handlers`) estén explícitamente declaradas dentro del scope del componente.
- Prevenir absolutamente errores de tipo `ReferenceError: Can't find variable: XYZ`.

## 3. Resguardo de Control de Versiones (Git Checkpoints)
- Tras implementar y verificar cada nueva funcionalidad aprobada por el usuario, realizar un `git commit` automático para mantener un historial de puntos de restauración estables.

## 4. Contención de Errores React (ErrorBoundary)
- Mantener la barrera `<ErrorBoundary>` en `App.jsx` para evitar pantallas blancas en el navegador y ofrecer recuperación de 1 clic.
