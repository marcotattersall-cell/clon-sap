# Regla 3: Virtualización de DOM y Limpieza Estricta de Suscripciones (Higiene de Memoria)

Para mantener la fluidez a 60 FPS y prevenir fugas de memoria (*Memory Leaks*) en la plataforma Operam ERP al manejar grandes volúmenes de datos industriales, todos los componentes React DEBEN seguir estos estándares:

1. **Virtualización Obligatoria de Listas Grandes**:
   - Cualquier componente que presente listados o tablas con potencial de superar los 50 registros (ej. Maestro de Materiales, Fichas de Empleados, Tableros de Vencimientos, Transacciones MIGO) DEBE utilizar virtualización de DOM con `@tanstack/react-virtual` o paginación server-side.
   - Prohibido iterar arreglos masivos en el JSX sin limitar los nodos activos en el árbol DOM.
2. **Higiene de Suscripciones en Tiempo Real**:
   - Todo hook `useEffect` que inicie una suscripción en tiempo real a Supabase (`supabase.channel().subscribe()`) o listener de Firestore (`onSnapshot()`) DEBE retornar explícitamente su función de limpieza para cancelar la suscripción al desmontarse el componente.
3. **Liberación de Objetos y Timers**:
   - Todo temporizador (`setInterval`, `setTimeout`) o creador de URLs de descargas (`URL.createObjectURL()`) debe cancelarse o revocarse (`URL.revokeObjectURL()`) al destruirse el componente.
