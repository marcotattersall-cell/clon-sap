# Manejo de Errores, Fallback Gracioso y Resiliencia UI

## 1. Captura de Excepciones y Feedback al Usuario (Fiori Stealth Toasts)
- Toda operación asíncrona (mutaciones en Supabase, Firebase, o llamadas a servicios) **DEBE** incluir un bloque `try/catch`.
- **Prohibido la supresión silenciosa**: Nunca dejar un bloque `catch` vacío ni retornar valores nulos silenciosos si la operación afecta la consistencia transaccional del ERP.
- Notificar al usuario mediante el sistema de Toasts Fiori Stealth UI cuando ocurra un error de red, base de datos o permisos RBAC:
  ```javascript
  try {
    await dbService.executeGoodsMovement(migoPayload);
    addToast('🟢 Documento MIGO contabilizado con éxito', 'success');
  } catch (error) {
    console.error('[MIGO Error]', error);
    addToast(`🔴 Error al contabilizar MIGO: ${error.message}`, 'error');
  }
  ```

## 2. Aislamiento con React Error Boundaries
- Los componentes de alto nivel (Launchpad, Tablas Virtualizadas, Dashboards) deben estar protegidos por un `ErrorBoundary` para evitar la pantalla blanca global ante fallos no capturados de renderizado.
- Al capturar una excepción de renderizado, mostrar un componente de respaldo (Fallback UI) que permita recargar el módulo sin reiniciar toda la sesión del usuario.

## 3. Estrategia de Reintento Asíncrono (Retry with Exponential Backoff)
- En operaciones críticas de lectura/escritura propensas a intermitencias de red (como ingesta IoT o sincronización de fondo), utilizar lógica de reintento exponencial (máximo 3 reintentos) antes de declarar fallo definitivo.
