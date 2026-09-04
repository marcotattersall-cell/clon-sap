---
name: multi-tenant-simulation
description: >-
  Procedure for running multi-tenant load and concurrency simulations (50 tenants, 150 users, 1500 operations)
  to measure ERP throughput, stock movement locks, and data isolation under high load.
---

# Multi-Tenant Stress & Concurrency Simulation Skill

This skill guides the execution and analysis of high-concurrency load tests on **Operam ERP Enterprise / Clon SAP**.

---

## 1. Simulation Architecture

The simulation engine spawns a virtual multi-tenant environment:
* **50 Corporate Clients** (`tenant_empresa_01` to `tenant_empresa_50`), grouped into SLA Tiers (`HIGH`, `MEDIUM`, `LOW`).
* **150 Virtual Users** (3 users per company: PM Maintenance Lead, MM Warehouse Officer, Field Technician).
* **1,500 High-Speed Concurrent Operations**:
  - Reading Assets (IE03) and Inventory Stock (MM).
  - Creating Work Orders (IW31).
  - Registering Goods Issue Stock Movements (MIGO 261).

---

## 2. Running the Simulation

Execute the simulation CLI script:

```bash
npm run simulate
```

Alternatively, invoke directly with Node:

```bash
node scripts/simulate_50_tenants_150_users.cjs
```

---

## 3. Metrics Analysis & Performance Criteria

When the simulation completes, inspect the output summary:

1. **Total Reads / Writes**: Verify balanced read/write distribution (~50% query, ~50% transaction write).
2. **Transactional Throughput (`op/seg`)**: Measure total ERP operations per second. Target benchmark is **> 5,000 op/sec**.
3. **MIGO 261 & Inventory Stock Integrity**: Verify stock deduction consistency (e.g., initial 1000 LT reduced by 5 LT per MIGO 261 call down to remaining stock without negative values).
4. **Data Isolation Verdict**: Verify zero data leakage message:
   `🛡️ Verificación Multi-Tenant: 100% Aislamiento Confirmado (0 Fuga de Datos entre Clientes)`

---

## 4. Troubleshooting & Bottleneck Resolution

If simulation performance degrades or errors occur:

* **Negative Stock Error**: Check race conditions in `migoDocs` stock deduction logic in service layer (`src/services/`).
* **Cross-Tenant Data Leakage**: Audit `tenantId` query filters across all in-memory mock handlers and Supabase subscribers.
* **Low Throughput (< 1,000 op/sec)**: Check for synchronous blocking file I/O or missing index lookup structures.
