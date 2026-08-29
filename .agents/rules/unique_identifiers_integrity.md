# Regla 9: Unicidad Estricta de Identificadores Únicos (RUT de Colaboradores y Patentes de Flota)

Para mantener la integridad referencial y evitar duplicidad de registros en la plataforma Operam ERP, todo nuevo alta o modificación de datos en la base de datos DEBE cumplir las siguientes reglas estrictas de unicidad:

1. **Unicidad de RUT en HCM Personal**:
   - Todo colaborador registrado o modificado debe contar con un **RUT único** por empresa (`tenant_id`).
   - Si se intenta registrar un empleado con un RUT que ya existe en la colección de la empresa, el sistema DEBE abortar la transacción y mostrar un error explícito: `"El RUT ya se encuentra registrado en el sistema HCM"`.
2. **Unicidad de Patentes e Identificadores de Vehículos/Maquinaria (PM/Flota)**:
   - Todo vehículo o maquinaria pesada registrado en el Maestro de Activos (IE01) debe poseer una **Patente (`plate`) o ID único** por empresa (`tenant_id`).
   - Si se intenta ingresar un activo con una patente o identificador duplicado, la transacción debe ser cancelada retornando el mensaje: `"La patente o ID del vehículo ya existe en la flota"`.
3. **Validación Dual (UI + Capa de Servicios)**:
   - La validación debe realizarse tanto en los formularios modales de creación (`CreateEmployeeModal`, `EditEmployeeModal`, `CreateAssetModal`) como en las funciones de persistencia de `dbService.js` / `supabaseService.js`.
