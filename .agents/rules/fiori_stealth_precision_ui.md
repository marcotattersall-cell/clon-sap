# Regla: Estándar de Diseño SAP Fiori Horizon Stealth & Precision (UX/UI)

Toda interfaz gráfica y componente visual de la plataforma Operam ERP DEBE adherirse a las siguientes normas estricta de arquitectura cromática y jerarquía visual para evitar fatiga cognitiva:

1. **Base Monocromática Neutral (90%)**:
   - Usar superficies `slate-950` / `slate-900` / `slate-50` con tipografía neutra (`text-slate-900` o `text-slate-100`).
   - Los registros en estado **OK / Vigente / Normal** NO deben llevar insignias ni badges de color verde deslumbrantes; se presentan en estilo neutro monocromático.
2. **Acento Único de Navegación y Acción (7%)**:
   - Todos los botones primarios (CTA), bordes de enfoque e indicadores de pestaña activa DEBEN usar un único tono azul corporativo **SAP Cobalt (`sky-700` / `#0284C7`)**.
   - Los botones secundarios y acciones de cancelación deben usar estilos neutros sobrios (`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`).
3. **Dúo Semántico de Alerta (3%)**:
   - El uso de colores vivos en la interfaz queda estrictamente limitado a dos estados de atención urgente mediante micro-pills o micro-LEDs de 8px:
     - 🟡 **Amarillo / Amber (`amber-500`)**: Alerta por Vencer (≤30 días) / En Proceso / Advertencia.
     - 🔴 **Rojo / Rose (`rose-500`)**: Vencido / En Falla Crítica / Error Transaccional.
