# Regla 2: Control de Acceso RBAC Estricto en Capa de Servicios (Zero-Trust)

Toda mutación de datos (creación, edición, eliminación o transacción masiva) procesada en la capa de servicios de la plataforma Operam ERP DEBE cumplir los siguientes principios de seguridad Zero-Trust:

1. **Validación Autónoma en Servicios**:
   - Ocultar o deshabilitar elementos en la interfaz React NO constituye una barrera de seguridad suficiente.
   - Toda función expuesta en `dbService.js` / `supabaseService.js` DEBE verificar el rol activo del usuario contra la matriz central de permisos (`utils/rbacRules.js`) antes de enviar consultas `INSERT`, `UPDATE` o `DELETE` a PostgreSQL / Firestore.
2. **Principio de Menor Privilegio**:
   - Roles operativos (ej. `FIELD_MECHANIC` o `INVENTORY_CLERK`) solo tienen autorización para sus transacciones específicas (ej. confirmación de OT o contabilización MIGO). Intentos de eliminar activos, modificar empleados o alterar precios sin permisos deben ser bloqueados en el servicio lanzando una excepción `RBAC_PERMISSION_DENIED`.
3. **Registro Auditado en Logs de Seguridad**:
   - Cualquier intento de violación de permisos en la capa de servicios debe registrarse inmediatamente en la tabla `audit_logs` con el tipo de evento `SECURITY_VIOLATION`.
