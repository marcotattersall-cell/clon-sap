# Reglas de Arquitectura Híbrida: Firebase Frontend + Supabase Backend

## 1. División de Capas (Stack Tecnológico)
- **Frontend, Autenticación y Hosting**: **Firebase**
  - Autenticación: Firebase Auth (`AuthContext.jsx` + `firebase/config.js`).
  - Hosting público: Firebase Hosting (`clon-sap-2026.web.app`).
- **Backend, Base de Datos Relacional y Tiempo Real**: **Supabase**
  - Proyecto: `https://ynrmojauyplqebiaqyqd.supabase.co`
  - Motor de Base de Datos: PostgreSQL con 14 tablas relacionales (`tenants`, `users`, `plants`, `materials`, `assets`, `notifications`, `work_orders`, `purchase_orders`, `migo_documents`, `employees`, `absences`, `payroll_runs`, `audit_logs`, `telemetry_logs`).
  - Capa de datos: `dbService.js` DEBE dirigir **siempre** todas las operaciones de persistencia hacia `supabaseService.js`.

## 2. Reglas Estrictas de Supabase y Claves Foráneas
- **Clave Primaria (`onConflict`)**: En `upsertDocument` y `seedCollectionIfEmpty` dentro de `supabaseService.js`, la opción `onConflict` debe ser **siempre `'id'`** (no `'id,tenant_id'`), ya que `id` es la clave primaria estricta de las tablas de PostgreSQL.
- **Mapeo de Columnas Relacionales**: Toda inserción/actualización en Supabase debe poblar tanto la columna `data` (JSONB) como las columnas relacionales normalizadas (`equipment_id`, `material_id`, `plant_id`, `employee_id`, `name`, `status`, `type`, `stock`, `unit_price`, etc.).
- **Persistencia de Sesiones de Auth**: Al autenticar un usuario en el Frontend vía Firebase Auth, el perfil se sincroniza y actualiza automáticamente en la tabla `users` de Supabase (`upsertDocument('users', ...)`).

## 3. Estado Inicial Vacío y Sincronización
- Los estados de React en `SAPContext.jsx` arrancan vacíos (`[]`) por defecto a menos que `VITE_ENABLE_DEMO_SEEDING === 'true'`.
- En `iotIngestionService.js`, `getTelemetryHistory` retorna `assetLogs` (`[]` cuando la tabla está limpia) en lugar de arreglos mock rígidos.

## 4. Flujo de Despliegue a Producción
- Siempre que se agreguen nuevas funciones o iteraciones al sistema, para actualizar el sitio publicado en Firebase Hosting (`clon-sap-2026.web.app`), se debe ejecutar:
  1. `npm test` (para garantizar que todas las 33 pruebas de vitest pasen)
  2. `npm run build`
  3. `npx -y firebase-tools deploy --only hosting`
