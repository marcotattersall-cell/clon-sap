---
name: sap-full-test-suite
description: >-
  Procedure for executing the complete test suite (Unit, Integration, E2E Workflows, and Multi-Tenant Load Simulation)
  across Operam ERP / Clon SAP.
---

# SAP Full Test Suite Execution Skill

This skill defines the complete protocol for running all Unit, Integration, E2E Workflow, and Multi-Tenant Concurrency tests across **Clon SAP / Operam ERP Enterprise**.

---

## 1. Test Suite Architecture

```mermaid
flowchart TD
    A[Start Full Test Pipeline] --> B[1. Unit & Integration Tests]
    B -->|npm test| C[2. End-to-End Workflow Audit]
    C -->|npm run audit:workflow| D[3. Multi-Tenant Stress Simulation]
    D -->|npm run simulate| E[4. Security & Schema Audit]
    E -->|npm run audit:security| F[✅ All Test Layers Verified (100% Pass)]
```

---

## 2. Test Execution Commands

### Step 1: Unit & Integration Test Suite (Vitest)
Executes 29 test suites and 128 test cases covering UI rules, RUT validation, OTP security, ML models, and SAP context handlers:
```bash
npm test
```

### Step 2: Integrated E2E Workflow Audit
Validates cross-module business processes (Requisitions ➔ Purchase Orders ➔ MIGO 261 Goods Issue ➔ Work Order Cost Accumulation):
```bash
npm run audit:workflow
```

### Step 3: Multi-Tenant Stress & Concurrency Simulation
Spawns 50 corporate clients and 150 virtual users executing 3,000 concurrent ERP operations to measure throughput and data isolation:
```bash
npm run simulate
```

### Step 4: Security, Audit Trail & Schema Validation
Verifies multi-tenant RLS isolation, SU01 permissions, and SAP immutable change logs:
```bash
npm run audit:security && npm run audit:trail && npm run audit:schema
```

---

## 3. Verification Checklist

- [ ] All 29 Vitest test files pass cleanly (`npm test`).
- [ ] Cross-module transactions update stock and cost centers atomically (`npm run audit:workflow`).
- [ ] Multi-tenant isolation confirmed with 0 data leakage (`npm run simulate`).
- [ ] Supabase RLS security rules and SU01 roles verified (`npm run audit:security`).
