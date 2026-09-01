# 🚀 AXOMIRA INTELLIGENT CLOUD ERP

Sistema de Gestión Empresarial de Nueva Generación (**ERP**) diseñado bajo el estándar visual **SAP Fiori Horizon Stealth**, ofreciendo una experiencia moderna, dinámica e intuitiva con arquitectura Multi-Tenant de alto rendimiento.

---

## 🏛️ Módulos del Sistema

### 📦 MM (Materials Management & Logistics)
- **Maestro de Materiales:** Control exhaustivo de repuestos, materias primas y productos terminados.
- **Movimientos de Mercancía (MIGO):** Entradas, salidas y traspasos entre almacenes con validación de stock y reservas.
- **Integración QR:** Escaneo e identificación rápida de insumos y documentos de inventario.
- **Mapa Visual de Almacén:** Representación gráfica interactiva de ubicaciones y niveles de stock.

### 👥 HCM (Human Capital Management)
- **Gestión de Personal:** Expediente digital de colaboradores y estructura organizacional.
- **Validación Estricta:** Algoritmo integrado para validación de RUT chileno de 7 y 8 dígitos con dígito verificador.
- **Control Operativo:** Gestión de cargos, turnos, departamentos y métricas de desempeño.

### 🚜 PM & Fleet Planner (Mantenimiento & Gestión de Flotas)
- **Planificación de Flota:** Monitoreo y asignación de maquinaria pesada y vehículos operativos.
- **Órdenes de Trabajo (OT):** Seguimiento de mantenimientos preventivos y correctivos vinculados a repuestos MM.

### 📊 Analytics & Executive Cockpit
- **Tableros BI en Tiempo Real:** Gráficos dinámicos con `Recharts` para monitoreo de KPIS operativos y financieros.
- **Auditoría de Datos:** Herramientas de verificación de dependencias e integridad de datos multi-tenant.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite |
| **Estilos & UI** | Tailwind CSS + Framer Motion + Lucide Icons |
| **Diseño** | SAP Fiori Horizon Stealth Dark Theme |
| **Base de Datos** | Supabase (PostgreSQL) + Cloud Firestore |
| **Autenticación** | Firebase Auth |
| **Hosting & CI/CD** | Firebase Hosting + GitHub Actions |
| **Herramientas QA** | Oxlint + Vitest |

---

## ⚙️ Comandos del Proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar el analizador de código (Linter)
npm run lint

# Ejecutar pruebas unitarias
npm run test

# Auditar importaciones y compilar para producción
npm run build

# Simulación de datos Multi-Tenant (50 empresas / 150 usuarios)
npm run simulate

# Ejecutar respaldo de datos de inquilinos
npm run backup
```

---

## 🔄 Integración y Despliegue Continuo (CI/CD)

El proyecto cuenta con integración continua automatizada mediante **GitHub Actions** (`.github/workflows/firebase-hosting-deploy.yml`):

1. **Push a `main`:** Desencadena el flujo de trabajo.
2. **Lint & QA:** Verifica la calidad del código mediante `oxlint`.
3. **Build:** Ejecuta la auditoría de dependencias e importaciones antes de compilar con Vite.
4. **Deploy:** Despliega automáticamente en **Firebase Hosting** (Canal *live*).

---

© 2026 AXOMIRA Cloud Systems. Todos los derechos reservados.
