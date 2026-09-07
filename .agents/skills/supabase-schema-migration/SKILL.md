---
name: supabase-schema-migration
description: >-
  Procedure for managing Supabase PostgreSQL schema migrations, DDL scripts, RLS policies,
  and foreign key integrity checks across multi-tenant environments.
---

# Supabase Schema Migration & RLS Auditor Skill

This skill defines the mandatory protocol for maintaining DDL schemas, Row Level Security (RLS) policies, and foreign key relations in **Clon SAP / Operam ERP Enterprise**.

---

## Schema Migration Assurance Workflow

```mermaid
flowchart TD
    A[Start Schema Inspection] --> B[1. Check DDL Multi-Tenancy]
    B -->|Fail: Missing FK to tenants| B1[Add FOREIGN KEY to public.tenants(id)]
    B1 --> B
    B -->|Pass| C[2. Audit RLS Security Policies]
    C -->|Fail: RLS Disabled| C1[Add ALTER TABLE ENABLE ROW LEVEL SECURITY]
    C1 --> C
    C -->|Pass| D[3. Audit Indexing & Seed SQL]
    D -->|Pass| E[✅ Supabase Database Schema Verified]
```

---

## Step-by-Step Execution Protocol

### Step 1: Automated Database Schema Audit

Run the automated DDL and RLS inspection script:

```bash
npm run audit:schema
```

* **What it checks**:
  - Scans [`supabase/schema.sql`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/supabase/schema.sql) to ensure all tables declare `tenant_id` linked to `public.tenants(id)`.
  - Verifies RLS policies and index definitions on high-traffic tables.
  - Inspects seed fixture data in [`supabase/seed.sql`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/supabase/seed.sql).
* **If it fails**: Add missing foreign key constraints or RLS statements before committing.

---

## Step-by-Step DDL Standard for Multi-Tenant Tables

All new PostgreSQL tables created in `supabase/schema.sql` must adhere to this structure:

```sql
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    title TEXT NOT NULL,
    status TEXT DEFAULT 'CREATED',
    actual_cost NUMERIC DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-speed multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON public.work_orders(tenant_id);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
```

---

## Step 3: Verification Checklist

- [ ] `npm run audit:schema` returned code 0.
- [ ] Every multi-tenant table includes `tenant_id TEXT NOT NULL REFERENCES public.tenants(id)`.
- [ ] `idx_<table_name>_tenant` index is declared for fast querying under high concurrency.
- [ ] Row Level Security (RLS) is explicitly enabled for production deployment.
