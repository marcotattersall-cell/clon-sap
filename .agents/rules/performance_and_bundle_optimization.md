# Optimización de Rendimiento, Bundle Size y Memoización React 19

## 1. Carga Perezosa (Lazy Loading) y Code-Splitting
- Modales pesados, dashboards gráficos (`recharts`) y vistas secundarias deben importarse de forma perezosa mediante `React.lazy` y `Suspense`:
  ```javascript
  const ExecutiveReportGeneratorModal = React.lazy(() => import('./modals/ExecutiveReportGeneratorModal'));
  ```
- Mantener la carga inicial del Launchpad liviana para asegurar que el primer renderizado (FCP/LCP) tome menos de 1 segundo.

## 2. Virtualización Obligatoria de Listas Transaccionales
- Toda vista o listado que renderice más de 50 filas (ej. Maestro de Materiales MMBE, Registros de Órdenes IW38, Historial de MIGO) **DEBE usar `@tanstack/react-virtual`** (`useVirtualizer`).
- Queda estrictamente prohibido usar `.map()` directo sobre colecciones de datos masivas sin virtualización para evitar fugas de memoria y degradación del DOM.

## 3. Memoización Estricta y Evitar Re-renders Innecesarios
- Props de callbacks pasados a componentes virtualizados o elementos de lista deben envolverse con `useCallback`.
- Cálculos pesados (como pronósticos de demanda ML o agregaciones financieras) deben envolverse con `useMemo` para evitar su re-evaluación en cada ciclo de render.
- Utilizar `useTransition` de React 19 para actualizaciones de UI no urgentes (como filtrado dinámico o búsqueda en vivo de repuestos).
