---
name: sap-module-generator
description: >-
  Procedure for scaffolding new SAP ERP modules, tables, modal dialogs, and service layer methods
  following Fiori Stealth UI design rules, multi-tenant isolation, TanStack Virtualization, and RBAC security.
---

# SAP ERP Module & Component Scaffolding Skill

This skill provides a standardized, multi-step procedure for adding new SAP modules, transaction tables, modal forms, or backend service handlers to **Clon SAP / Operam ERP Enterprise**.

---

## Step 1: Data Model & Multi-Tenant Service Layer Definition

When adding a new SAP entity (e.g., Equipment, Purchase Orders, Materials, Work Orders):

1. **Location**: Create or update the relevant service in [`src/services/`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/src/services/).
2. **Multi-Tenant Isolation**: Enforce `tenant_id` on all CRUD operations:
   ```javascript
   const tenantId = user?.tenantId || 'tenant_demo';
   const { data, error } = await supabase
     .from('work_orders')
     .select('*')
     .eq('tenant_id', tenantId);
   ```
3. **Unique ID Generation**: Ensure document IDs follow SAP conventions and UUID safeguards (e.g., `WO-400101-BHP`, `MIGO-87672464`, or `crypto.randomUUID()`). Never use plain sequential integers.

---

## Step 2: Virtualized Table Component (`src/components/`)

For list views and master data tables (e.g. `MaterialMasterTable.jsx`):

1. **Virtualization Requirement**: Use `@tanstack/react-virtual` (`useVirtualizer`) for dataset rendering to maintain low memory usage and high FPS.
2. **Fiori UI Styling**: Use SAP Fiori design tokens:
   - Header style: Dark slate / Fiori stealth header with active column sorting indicators.
   - Status Badges:
     - 🟢 `RELEASED` / `OPERATIVE` / `OK`
     - 🟡 `IN_PROGRESS` / `WARNING`
     - 🔴 `BLOCKED` / `EXPIRED` / `CRITICAL`
3. **Action Triggers**: Bind rows to detail drawers, edit modals, or transactional operations (e.g. MIGO stock movement).

---

## Step 3: Modal Dialog Implementation (`src/components/modals/`)

For transactional entries (e.g., `CreateMaterialModal.jsx`):

1. **State Isolation**: Reset modal form state on close.
2. **Validation**: Validate stock limits, positive quantities, and required relational IDs before dispatching transactions.
3. **Business Rules**: Apply transaction logic according to [`sap_business_rules.md`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/.agents/rules/sap_business_rules.md):
   - MIGO 261: Atomic stock deduction and work order cost accumulation (`actualCost`).
   - Document Expiry: Auto-calculate 30-day alert windows for vehicle and personnel certifications.

---

## Step 4: Role-Based Access Control (RBAC) Check

1. Wrap restricted actions (Delete, Price Edit, Stock Adjustment) with RBAC checks from [`service_layer_rbac_security.md`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/.agents/rules/service_layer_rbac_security.md).
2. Render disabled state or hide UI buttons for unauthorized roles (e.g., `OPERATOR` vs `ADMIN`).

---

## Step 5: Pre-Flight Integrity Verification

Before concluding component creation:

1. Run the import auditor to ensure all Lucide icons and subcomponents are properly imported:
   ```bash
   npm run audit:imports
   ```
2. Verify formatting and linting:
   ```bash
   npm run lint
   ```
3. Execute unit tests:
   ```bash
   npm run test
   ```
