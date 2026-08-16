# Reglas de Seguridad y Resguardo del Código

## 1. Verificación Obligatoria de Compilación (Zero Blank Screen Policy)
- Después de **CADA** modificación de código en cualquier archivo `.jsx` o `.js`, se DEBE ejecutar `npm run build`.
- No se declarará ningún cambio finalizado ni desplegado sin antes verificar que `npm run build` haya finalizado con código de salida `0`.

## 2. Auditoría de Variables de Estado en JSX
- Antes de guardar cualquier archivo `.jsx`, auditar que todas las variables y funciones utilizadas en el JSX (ej: `useState`, `useContext`, `props`, `handlers`) estén explícitamente declaradas dentro del scope del componente.
- Prevenir absolutamente errores de tipo `ReferenceError: Can't find variable: XYZ`.

## 3. Resguardo de Control de Versiones (Git Checkpoints)
- Tras implementar y verificar cada nueva funcionalidad aprobada por el usuario, realizar un `git commit` automático para mantener un historial de puntos de restauración estables.

## 4. Contención de Errores React (ErrorBoundary)
- Mantener la barrera `<ErrorBoundary>` en `App.jsx` para evitar pantallas blancas en el navegador y ofrecer recuperación de 1 clic.
