# Estándar de Diseño y Experiencia de Usuario SAP Fiori (UX/UI)

## 1. Estructura y Paleta de Colores
- **Modo Oscuro Predeterminado**: La aplicación utiliza una paleta de colores empresarial basada en Slate de Tailwind CSS (`bg-slate-900`/`bg-slate-950` para fondos principales, `border-slate-800` para divisiones y `text-slate-100` para tipografía).
- **Acentos Funcionales SAP**:
  - `sky-500` / `sky-400` para acentos principales de Mantenimiento PM y navegación.
  - `emerald-500` / `emerald-400` para estados operativos, confirmaciones de éxito e inventario disponible.
  - `amber-500` / `amber-400` para contadores de horómetros/odómetros y alertas de advertencia.
  - `rose-500` / `rose-400` para equipos en falla/mantenimiento, errores transaccionales y documentos vencidos.

## 2. Componentes y Layouts SAP Fiori
- **Shell Header**: La barra superior debe mostrar el logo de Operam ERP, selector de Centro de Emplazamiento (Planta), rol activo (Jefe PM, Especialista MM, Compras, HCM), barra de búsqueda universal y perfil del usuario autenticado.
- **Tarjetas KPI Cockpit**: Cada panel (Analytics, PM, MM, HCM) debe incluir en la parte superior tarjetas de resumen con indicadores clave de rendimiento (OEE, Disponibilidad %, Índice de Salud %, Gastos Reales vs Planificados).
- **Modales de Transacción de Pantalla Completa**: Transacciones complejas como Alta de Equipo (IE01), Creación de OT (IW31), Contabilización MIGO o Fichas de Empleados deben utilizar vistas tipo modal de pantalla completa con encabezado Fiori fijo y barra inferior de acciones fija (Sticky Footer).
