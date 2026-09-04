---
name: tenant-backup-runbook
description: >-
  Operational runbook for executing, filtering, verifying, and auditing multi-tenant ERP backups
  across SLA activity tiers (HIGH, MEDIUM, LOW) using the automated backup engine.
---

# Multi-Tenant Data Backup & Recovery Runbook

This skill provides step-by-step operational guidance for managing automated multi-tenant backups for **Operam ERP Enterprise / Clon SAP**.

---

## 1. SLA Backup Tier Definitions

Backup schedules are governed by customer SLA tiers:

| Tier | Frequency | Scheduled Time | Example Tenants | Command |
| :--- | :--- | :--- | :--- | :--- |
| **HIGH** | Daily | 02:00 AM | BHP Billiton, CODELCO | `npm run backup:daily` |
| **MEDIUM** | Weekly | Sundays 03:00 AM | Antofagasta Minerals, Collahuasi | `npm run backup:weekly` |
| **LOW** | Monthly | Day 1 04:00 AM | Demo Operam Enterprise | `npm run backup:monthly` |
| **ALL** | On-Demand | Manual Trigger | Full Catalog Backup | `npm run backup` |

---

## 2. Backup Execution Procedure

### Option A: Run Full Backup (All Registered Tenants)

```bash
npm run backup
```

### Option B: Run Tier-Filtered Backup

To run backups for specific SLA tiers:

```bash
# High SLA (Daily)
npm run backup:daily

# Medium SLA (Weekly)
npm run backup:weekly

# Low SLA (Monthly)
npm run backup:monthly
```

Or via direct flag execution:
```bash
node scripts/backup_tenant_data.cjs --tier=HIGH
```

---

## 3. Verification & SHA-256 Checksum Audit

After backup completion, verify the snapshot directory:

1. **Location**: Check [`backups/`](file:///Users/marcovidallobos/Desktop/Clon%20SAP/backups/) under the tenant ID:
   `backups/<tenant_id>/<timestamp_iso>/`
2. **Generated Files**:
   - `plants.json`
   - `assets.json`
   - `workOrders.json`
   - `materials.json`
   - `migoDocuments.json`
   - `employees.json`
   - `purchaseOrders.json`
   - `MANIFEST.json`
3. **Integrity Validation**: Open `MANIFEST.json` and confirm:
   - `integrityStatus`: `"VERIFIED_OK"`
   - `checksumAlgorithm`: `"SHA-256"`
   - Every collection file has a valid `sha256Checksum` and `recordsCount`.

---

## 4. Multi-Tenant Isolation Audit Safeguard

Verify that data in `backups/<tenant_id>/` contains **only** records matching that `tenant_id`:

```javascript
// Verification Rule: Zero Cross-Tenant Data Leakage
const records = JSON.parse(fs.readFileSync('backups/tenant_bhp/.../assets.json'));
const leaked = records.filter(r => r.tenantId !== 'tenant_bhp');
if (leaked.length > 0) {
  throw new Error("🚨 SECURITY ALERT: Cross-tenant data leakage detected in backup!");
}
```

---

## 5. Recovery & Restoration Quick Steps

To restore a tenant snapshot:
1. Locate target timestamp folder in `backups/<tenant_id>/<timestamp>/`.
2. Verify `MANIFEST.json` SHA-256 checksums match JSON file contents.
3. Import collections into Supabase / Firestore filtered by target `tenant_id`.
