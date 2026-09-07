# Localización Minera Chilena y Cumplimiento Normativo (RUT, CLP, SERNAGEOMIN)

## 1. Validación de RUT Chileno (Módulo 11)
- Todo ingreso de Identificación de Persona (HCM), Proveedor o Cliente debe validarse mediante el algoritmo Módulo 11 (RUT Chileno).
- Formato estándar de presentación: `XX.XXX.XXX-K` (con puntos y guion).

## 2. Formato Moneda Pesos Chilenos (CLP) e Impuestos (IVA 19%)
- Los valores monetarios presentados en tablas Fiori y reportes financieros deben formatearse en Pesos Chilenos (CLP) usando `Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })`.
- El IVA estándar aplicado a compras y facturación corporativa debe ser del 19%.

## 3. Zona Horaria y Acreditaciones de Minería (SERNAGEOMIN)
- La zona horaria por defecto para marcas de tiempo corporativas y logs MIGO es `America/Santiago`.
- El módulo de Flota (IE03) y Recursos Humanos (HCM) debe incluir control de vencimiento automático (30 días de aviso) para:
  - Pase de Acreditación de Faena Minera (Gran Minería).
  - Examen Médico de Gran Altura Geográfica.
  - Revisión Técnica y Permiso de Circulación de Maquinaria Pesada.
