-- ====================================================================
-- SCRIPT DE SEMBRADO (SEED DATA) PARA CLON SAP EN SUPABASE (POSTGRESQL)
-- Entorno 100% Limpio de Producción (Colecciones Vacías Sin Mocks)
-- ====================================================================

-- 1. Tenant Demo (Requerido para la estructura Multi-Tenant)
INSERT INTO public.tenants (id, name)
VALUES ('tenant_demo', 'Empresa Demo Operam ERP')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
