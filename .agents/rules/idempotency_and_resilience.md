# Regla 1: Idempotencia Transaccional y Resiliencia en Conexiones Inestables

Toda operación transaccional crítica en la plataforma Operam ERP (movimientos de inventario MIGO, creación de Órdenes de Trabajo IW31, actualizaciones de salud de activos y aprobaciones financieras) DEBE cumplir los siguientes estándares de idempotencia y resiliencia:

1. **Generación de Idempotency Key en el Cliente**:
   - Antes de enviar una mutación crítica al backend (`supabaseService.js` / `firestoreService.js`), el cliente debe generar o adjuntar una clave única de idempotencia `idempotencyKey` (`UUIDv4` o `TRANSACTION_HASH`).
2. **Detección y Prevención de Transacciones Duplicadas**:
   - La capa de persistencia debe verificar si una clave de idempotencia ya fue procesada en la ventana de tiempo activa (15 minutos). Si la clave ya existe, se devuelve el resultado previamente procesado sin duplicar registros ni volver a descontar inventario.
3. **Mecanismo de Rollback Optimista**:
   - Si la red falla o el servidor rechaza la transacción durante un refresco offline, el estado optimista en el cliente React debe revertir automáticamente el cambio y notificar un error explícito.
