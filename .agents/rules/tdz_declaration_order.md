# Prevención de Temporal Dead Zone (TDZ) y Orden de Declaración

## 1. Orden Estricto Top-Down de Declaración de Helpers
- Cualquier función auxiliar, helper o callback (ej: `addToast`, `recordAuditLog`, `formatCurrency`) que sea consumida en la matriz de dependencias (`[deps]`) o en el cuerpo de otros hooks (`useCallback`, `useMemo`, `useEffect`) **DEBE ser declarada físicamente ANTES** de las funciones que la utilicen.
- En JavaScript, las declaraciones con `const` y `let` no se pueden evaluar antes de su línea de ejecución. Intentar evaluarlas en la lista de dependencias de un `useCallback` situado más arriba provocará un error fatal en tiempo de ejecución:
  `ReferenceError: Cannot access 'variableName' before initialization` (o `Cannot access 'y' before initialization` en bundles minificados).

## 2. Protocolo de Reestructuración de Contextos y Components
- Al refactorizar o envolver funciones en `useCallback` o `useMemo`, auditar el orden de definición de arriba hacia abajo (Top-Down):
  1. Hooks de estado primario (`useState`, `useRef`, `useContext`).
  2. Helpers utilitarios atómicos de nivel base (ej. `addToast`, `toggleTheme`).
  3. Transacciones y operaciones compuestas (ej. `executeGoodsMovement`, `createWorkOrder`).
  4. Flujos transaccionales de alto nivel o simulaciones (ej. `injectMassiveActionSimulation`, `convertNotificationToWO`).
  5. Valores memoizados del contexto (`uiValue`, `mmValue`, `pmValue`, `hcmValue`, `contextValue`).

## 3. Verificación Post-Refactor de Hooks
- Tras realizar envoltorios masivos de `useCallback` en Providers de React Context, verificar la compilación y ejecución en navegador para descartar cualquier excepción de renderizado por inicialización de variables.
