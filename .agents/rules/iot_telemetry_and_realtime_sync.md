# Ingesta de Telemetría IoT Masiva y Sincronización en Tiempo Real

## 1. Ingesta Asíncrona en Lote (Batching Engine & Queue)
- Lecturas masivas de sensores IoT de Maquinaria Pesada (Camiones CAT 797F, Palas P&H 4100XPC, Chancadores Metso) deben procesarse en ráfagas mediante la cola asíncrona (`processIoTTelemetryBatch`).
- Prohibido realizar llamadas individuales síncronas a la base de datos por cada lectura de sensor para evitar saturación de red.

## 2. Generación Automática de Órdenes PM02 ante Alertas Críticas
- Cuando la telemetría reporte parámetros fuera de rango (temperatura de motor > 105°C, presión hidráulica < 150 PSI, o vibración anómala), el servicio **DEBE generar automáticamente una Orden de Mantenimiento Preventivo/Correctivo (PM02)**.
- Notificar la alerta al centro de control mediante WebSockets / suscripción en tiempo real.

## 3. Tolerancia a Fallos y Compatibilidad de Esquema Dinámico (Schema Guard)
- La ingesta IoT debe tolerar variaciones en el esquema JSONB de los logs (`telemetry_logs`), usando resguardo dinámico ante columnas ausentes en tiempo de ejecución.
