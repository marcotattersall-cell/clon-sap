# Reglas de Negocio Transaccionales e Integridad ERP (SAP PM / MM / HCM)

## 1. Validación y Consistencia en Movimientos MIGO (MM/PM)
- **Validación de Stock MIGO 261**: Toda contabilización MIGO tipo 261 (Salida para Orden de Trabajo) debe validar atómicamente la disponibilidad de stock en el Maestro de Materiales. Si la cantidad solicitada supera el stock actual, se debe abortar la transacción y notificar un error explícito de "Stock Insuficiente".
- **Acumulación Automática de Costos en OT**: Cada salida de repuestos/lubricantes mediante MIGO 261 vinculada a una Orden de Trabajo (WO) debe actualizar el arreglo de componentes de la OT y acumular automáticamente el valor financiero en su costo real (`actualCost`).
- **Actualización de Estado de Pedidos MIGO 101**: Cada entrada de mercancías MIGO 101 vinculada a un Pedido de Compra (PO) debe actualizar el estado del Pedido a "Recibido / Entregado".

## 2. Aislamiento Multi-Empresa Obligatorio (`tenant_id`)
- **Campo Obligatorio**: Todo nuevo registro, documento, activo, material, empleado u orden de trabajo generado por el usuario o por sensores IoT debe incluir obligatoriamente el campo `tenant_id` (`user?.tenantId || 'tenant_demo'`).
- **Filtrado en Consultas**: Todas las consultas y suscripciones en tiempo real a Supabase deben filtrar por `tenant_id` para garantizar cero fuga de información entre empresas.

## 3. Alertas de Vencimiento de Documentación (Flota y Recursos Humanos)
- **Umbral de Alertas Visuales**: En los paneles de Flota (IE03) y Recursos Humanos (HCM), todo vencimiento de acreditación de faena, revisión técnica, seguro SOAP o examen médico laboral debe ser clasificado automáticamente:
  - 🟢 **Verde (OK)**: Más de 30 días para vencer.
  - 🟡 **Amarillo (Por Vencer)**: 30 días o menos para vencer.
  - 🔴 **Rojo (Vencido)**: Fecha actual mayor a la fecha de vencimiento.
