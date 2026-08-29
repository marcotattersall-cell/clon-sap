-- ====================================================================
-- ESQUEMA RELACIONAL Y DDL COMPLETO PARA CLON SAP EN SUPABASE (POSTGRESQL)
-- Con Claves Foráneas (Foreign Keys), Normalización y Multi-Tenancy Aislado
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Tenants (Empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tenant_demo por defecto para compatibilidad
INSERT INTO public.tenants (id, name)
VALUES ('tenant_demo', 'Empresa Demo Operam ERP')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    company_name TEXT,
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'MAINTENANCE_MGR',
    plant TEXT DEFAULT '0001 (Planta Central)',
    provider TEXT DEFAULT 'supabase',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Centros de Emplazamiento (Plants)
CREATE TABLE IF NOT EXISTS public.plants (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    status TEXT DEFAULT 'Activo',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla del Maestro de Materiales (Materials)
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    plant_id TEXT REFERENCES public.plants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'SPARE',
    category TEXT,
    stock NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'UN',
    unit_price NUMERIC DEFAULT 0.00,
    storage_location TEXT DEFAULT '0001',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla del Maestro de Activos / Equipos (Assets)
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    plant_id TEXT REFERENCES public.plants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    status TEXT DEFAULT 'OPERATIVE',
    health_score NUMERIC DEFAULT 100,
    hourmeter NUMERIC DEFAULT 0,
    odometer NUMERIC DEFAULT 0,
    model TEXT,
    serial_number TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Avisos de Mantenimiento (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    equipment_id TEXT REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'M1',
    priority TEXT DEFAULT 'Media',
    status TEXT DEFAULT 'NOPR',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de Órdenes de Trabajo PM (Work Orders)
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    equipment_id TEXT REFERENCES public.assets(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'PM01',
    priority TEXT DEFAULT 'Media',
    status TEXT DEFAULT 'CRTE',
    planned_cost NUMERIC DEFAULT 0.00,
    actual_cost NUMERIC DEFAULT 0.00,
    planned_hours NUMERIC DEFAULT 0.00,
    actual_hours NUMERIC DEFAULT 0.00,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla de Pedidos de Compra MM (Purchase Orders)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    vendor TEXT,
    status TEXT DEFAULT 'Pendiente Aprobación',
    qty NUMERIC DEFAULT 1,
    total_cost NUMERIC DEFAULT 0.00,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabla de Documentos MIGO de Movimiento de Mercancías (MIGO Documents)
CREATE TABLE IF NOT EXISTS public.migo_documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'UN',
    storage_location TEXT DEFAULT '0001',
    ref_document TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabla de Empleados HCM (Employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    plant_id TEXT REFERENCES public.plants(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    rut TEXT,
    role TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabla de Ausencias y Vacaciones HCM (Absences)
CREATE TABLE IF NOT EXISTS public.absences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'Vacaciones',
    status TEXT DEFAULT 'Pendiente',
    days INTEGER DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabla de Liquidaciones / Nómina HCM (Payroll Runs)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    period TEXT,
    base_salary NUMERIC DEFAULT 0.00,
    total_net NUMERIC DEFAULT 0.00,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabla de Logs de Auditoría (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    entity_type TEXT,
    entity_id TEXT,
    action TEXT,
    user_name TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Tabla de Telemetría e Ingesta IoT (Telemetry Logs)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT 'tenant_demo',
    equipment_id TEXT REFERENCES public.assets(id) ON DELETE CASCADE,
    engine_temp NUMERIC,
    vibration_rms NUMERIC,
    hourmeter NUMERIC,
    health_score NUMERIC,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- CREAR ÍNDICES DE CLAVE FORÁNEA Y RENDIMIENTO MULTI-TENANT
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_plants_tenant ON public.plants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_tenant ON public.materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materials_plant ON public.materials(plant_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON public.assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_plant ON public.assets(plant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_equipment ON public.notifications(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON public.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON public.work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_material ON public.purchase_orders(material_id);
CREATE INDEX IF NOT EXISTS idx_migo_documents_tenant ON public.migo_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_migo_documents_material ON public.migo_documents(material_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_plant ON public.employees(plant_id);
CREATE INDEX IF NOT EXISTS idx_absences_tenant ON public.absences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_absences_employee ON public.absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON public.payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee ON public.payroll_runs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_tenant ON public.telemetry_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_equipment ON public.telemetry_logs(equipment_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) PARA ACCESO PÚBLICO/ANON (O AUTENTICADO)
-- ====================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migo_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total a tenants" ON public.tenants FOR ALL USING (true);
CREATE POLICY "Acceso total a users" ON public.users FOR ALL USING (true);
CREATE POLICY "Acceso total a plants" ON public.plants FOR ALL USING (true);
CREATE POLICY "Acceso total a materials" ON public.materials FOR ALL USING (true);
CREATE POLICY "Acceso total a assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Acceso total a notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Acceso total a work_orders" ON public.work_orders FOR ALL USING (true);
CREATE POLICY "Acceso total a purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Acceso total a migo_documents" ON public.migo_documents FOR ALL USING (true);
CREATE POLICY "Acceso total a employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Acceso total a absences" ON public.absences FOR ALL USING (true);
CREATE POLICY "Acceso total a payroll_runs" ON public.payroll_runs FOR ALL USING (true);
CREATE POLICY "Acceso total a audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Acceso total a telemetry_logs" ON public.telemetry_logs FOR ALL USING (true);

-- ====================================================================
-- ACTIVAR SUPABASE REALTIME EN LAS TABLAS DE CLON SAP
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.plants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.migo_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payroll_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_logs;
