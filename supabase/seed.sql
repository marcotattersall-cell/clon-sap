-- ====================================================================
-- SCRIPT DE SEMBRADO (SEED DATA) PARA CLON SAP EN SUPABASE (POSTGRESQL)
-- Inserta los datos iniciales para el Tenant 'tenant_demo'
-- ====================================================================

-- 1. Tenant Demo
INSERT INTO public.tenants (id, name)
VALUES ('tenant_demo', 'Empresa Demo Operam ERP')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Centros de Emplazamiento (Plants)
INSERT INTO public.plants (id, tenant_id, name, address, city, status, data) VALUES
('0001', 'tenant_demo', 'Planta Central Santiago', 'Av. Las Condes 12345', 'Santiago', 'Activo',
 '{"id": "0001", "name": "Planta Central Santiago", "address": "Av. Las Condes 12345", "city": "Santiago", "status": "Activo", "tenantId": "tenant_demo"}'::jsonb),
('0002', 'tenant_demo', 'Centro Logístico Antofagasta', 'Panamericana Norte Km 15', 'Antofagasta', 'Activo',
 '{"id": "0002", "name": "Centro Logístico Antofagasta", "address": "Panamericana Norte Km 15", "city": "Antofagasta", "status": "Activo", "tenantId": "tenant_demo"}'::jsonb),
('0003', 'tenant_demo', 'Planta Industrial Concepción', 'Av. Gran Bretaña 890', 'Concepción', 'Activo',
 '{"id": "0003", "name": "Planta Industrial Concepción", "address": "Av. Gran Bretaña 890", "city": "Concepción", "status": "Activo", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 3. Maestro de Materiales (Materials)
INSERT INTO public.materials (id, tenant_id, plant_id, name, type, category, stock, unit, unit_price, storage_location, data) VALUES
('MAT-1001', 'tenant_demo', '0001', 'Filtro de Aceite Hidráulico CAT H-200', 'SPARE', 'Filtros y Lubricantes', 45, 'UN', 85.50, 'ALM-01',
 '{"id": "MAT-1001", "name": "Filtro de Aceite Hidráulico CAT H-200", "type": "SPARE", "category": "Filtros y Lubricantes", "stock": 45, "unit": "UN", "unitPrice": 85.50, "storageLocation": "ALM-01", "storageBin": "A1-01", "plantId": "0001", "reorderPoint": 15, "safetyStock": 10, "lastMovement": "2026-08-10", "tenantId": "tenant_demo"}'::jsonb),
('MAT-1002', 'tenant_demo', '0001', 'Aceite Sintético Multigrado 15W40 (Tambor 208L)', 'RAW', 'Lubricantes', 12, 'TBO', 420.00, 'ALM-02',
 '{"id": "MAT-1002", "name": "Aceite Sintético Multigrado 15W40 (Tambor 208L)", "type": "RAW", "category": "Lubricantes", "stock": 12, "unit": "TBO", "unitPrice": 420.00, "storageLocation": "ALM-02", "storageBin": "B1-02", "plantId": "0001", "reorderPoint": 5, "safetyStock": 2, "lastMovement": "2026-08-12", "tenantId": "tenant_demo"}'::jsonb),
('MAT-1003', 'tenant_demo', '0001', 'Bomba Hidráulica de Pistones Axiales Komatsu', 'SPARE', 'Componentes Hidráulicos', 3, 'UN', 3450.00, 'ALM-01',
 '{"id": "MAT-1003", "name": "Bomba Hidráulica de Pistones Axiales Komatsu", "type": "SPARE", "category": "Componentes Hidráulicos", "stock": 3, "unit": "UN", "unitPrice": 3450.00, "storageLocation": "ALM-01", "storageBin": "A2-05", "plantId": "0001", "reorderPoint": 2, "safetyStock": 1, "lastMovement": "2026-08-05", "tenantId": "tenant_demo"}'::jsonb),
('MAT-1004', 'tenant_demo', '0001', 'Correa Mecánica Dentada Industrial V-Belt', 'SPARE', 'Transmisión', 80, 'UN', 24.90, 'ALM-01',
 '{"id": "MAT-1004", "name": "Correa Mecánica Dentada Industrial V-Belt", "type": "SPARE", "category": "Transmisión", "stock": 80, "unit": "UN", "unitPrice": 24.90, "storageLocation": "ALM-01", "storageBin": "C1-03", "plantId": "0001", "reorderPoint": 20, "safetyStock": 10, "lastMovement": "2026-08-14", "tenantId": "tenant_demo"}'::jsonb),
('MAT-1005', 'tenant_demo', '0001', 'Sensor de Temperatura y Presión Digital M12', 'SPARE', 'Instrumentación', 18, 'UN', 165.00, 'ALM-03',
 '{"id": "MAT-1005", "name": "Sensor de Temperatura y Presión Digital M12", "type": "SPARE", "category": "Instrumentación", "stock": 18, "unit": "UN", "unitPrice": 165.00, "storageLocation": "ALM-03", "storageBin": "D1-04", "plantId": "0001", "reorderPoint": 5, "safetyStock": 3, "lastMovement": "2026-08-11", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 4. Maestro de Activos / Equipos (Assets)
INSERT INTO public.assets (id, tenant_id, name, category, location, status, health_score, hourmeter, odometer, model, serial_number, data) VALUES
('EQ-101', 'tenant_demo', 'Excavadora Hidráulica CAT 336 GC', 'Maquinaria Pesada', 'Mina Norte', 'OPERATIVE', 94, 4250, 185000, 'CAT 336 GC 2024', 'CAT336GC-2024-99',
 '{"id": "EQ-101", "name": "Excavadora Hidráulica CAT 336 GC", "category": "Maquinaria Pesada", "location": "Mina Norte", "status": "OPERATIVE", "healthScore": 94, "hourmeter": 4250, "odometer": 185000, "model": "CAT 336 GC 2024", "serialNumber": "CAT336GC-2024-99", "tenantId": "tenant_demo"}'::jsonb),
('EQ-102', 'tenant_demo', 'Cargador Frontal Komatsu WA470', 'Maquinaria Pesada', 'Planta Chancado', 'MAINTENANCE', 78, 6100, 210000, 'Komatsu WA470-8', 'KOMWA470-881',
 '{"id": "EQ-102", "name": "Cargador Frontal Komatsu WA470", "category": "Maquinaria Pesada", "location": "Planta Chancado", "status": "MAINTENANCE", "healthScore": 78, "hourmeter": 6100, "odometer": 210000, "model": "Komatsu WA470-8", "serialNumber": "KOMWA470-881", "tenantId": "tenant_demo"}'::jsonb),
('EQ-103', 'tenant_demo', 'Camión Aljibe Mercedes-Benz Atego 1726', 'Flota Transporte', 'Campamento Central', 'OPERATIVE', 98, 1890, 95400, 'Atego 1726 4x2', 'MBAT1726-2023-41',
 '{"id": "EQ-103", "name": "Camión Aljibe Mercedes-Benz Atego 1726", "category": "Flota Transporte", "location": "Campamento Central", "status": "OPERATIVE", "healthScore": 98, "hourmeter": 1890, "odometer": 95400, "model": "Atego 1726 4x2", "serialNumber": "MBAT1726-2023-41", "tenantId": "tenant_demo"}'::jsonb),
('EQ-104', 'tenant_demo', 'Chancador Primario de Quijada Metso C125', 'Planta Procesamiento', 'Línea de Molienda 1', 'OPERATIVE', 89, 12400, 0, 'Nordberg C125', 'METC125-9921',
 '{"id": "EQ-104", "name": "Chancador Primario de Quijada Metso C125", "category": "Planta Procesamiento", "location": "Línea de Molienda 1", "status": "OPERATIVE", "healthScore": 89, "hourmeter": 12400, "odometer": 0, "model": "Nordberg C125", "serialNumber": "METC125-9921", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 5. Órdenes de Trabajo PM (Work Orders)
INSERT INTO public.work_orders (id, tenant_id, equipment_id, title, type, priority, status, planned_cost, actual_cost, planned_hours, actual_hours, data) VALUES
('WO-400101', 'tenant_demo', 'EQ-101', 'Mantenimiento Preventivo 500 hrs - Excavadora CAT 336', 'PM01', 'Alta', 'REL', 650.00, 480.00, 6.0, 4.5,
 '{"id": "WO-400101", "title": "Mantenimiento Preventivo 500 hrs - Excavadora CAT 336", "type": "PM01", "priority": "Alta", "status": "REL", "equipmentId": "EQ-101", "costCenter": "CC-4100", "assignedTech": "Jorge Silva", "plannedHours": 6.0, "actualHours": 4.5, "plannedCost": 650.00, "actualCost": 480.00, "hourmeter": 4250, "odometer": 185000, "startDate": "2026-08-15", "targetFinishDate": "2026-08-18", "tenantId": "tenant_demo"}'::jsonb),
('WO-400102', 'tenant_demo', 'EQ-102', 'Reparación de Fuga Hidráulica en Cilindro Principal WA470', 'PM02', 'Muy Alta', 'CRTE', 1200.00, 0.00, 8.0, 0.0,
 '{"id": "WO-400102", "title": "Reparación de Fuga Hidráulica en Cilindro Principal WA470", "type": "PM02", "priority": "Muy Alta", "status": "CRTE", "equipmentId": "EQ-102", "costCenter": "CC-4200", "assignedTech": "Carlos Mendoza", "plannedHours": 8.0, "actualHours": 0.0, "plannedCost": 1200.00, "actualCost": 0.00, "hourmeter": 6100, "odometer": 210000, "startDate": "2026-08-16", "targetFinishDate": "2026-08-19", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 6. Avisos de Mantenimiento (Notifications)
INSERT INTO public.notifications (id, tenant_id, equipment_id, title, type, priority, status, data) VALUES
('NOT-2026-001', 'tenant_demo', 'EQ-104', 'Ruido inusual en chancador primario Metso', 'M1', 'Alta', 'Nuevo',
 '{"id": "NOT-2026-001", "title": "Ruido inusual en chancador primario Metso", "type": "M1", "priority": "Alta", "equipmentId": "EQ-104", "reporter": "Roberto Araya", "status": "Nuevo", "createdDate": "16/08/2026 14:20:00", "description": "Vibración y ruido metálico detectado en el rodamiento lado mando.", "tenantId": "tenant_demo"}'::jsonb),
('NOT-2026-002', 'tenant_demo', 'EQ-103', 'Fuga de refrigerante en camión aljibe', 'M2', 'Media', 'En Proceso',
 '{"id": "NOT-2026-002", "title": "Fuga de refrigerante en camión aljibe", "type": "M2", "priority": "Media", "equipmentId": "EQ-103", "reporter": "Luis Paredes", "status": "En Proceso", "createdDate": "17/08/2026 08:15:00", "description": "Goteo leve en manguera radiador superior.", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 7. Pedidos de Compra MM (Purchase Orders)
INSERT INTO public.purchase_orders (id, tenant_id, material_id, vendor, status, qty, total_cost, data) VALUES
('PO-45008912', 'tenant_demo', 'MAT-1001', 'Caterpillar Finning Chile', 'Aprobado', 3, 4250.00,
 '{"id": "PO-45008912", "vendor": "Caterpillar Finning Chile", "date": "2026-08-10", "totalAmount": 4250.00, "status": "Aprobado", "itemsCount": 3, "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 8. Documentos MIGO (MIGO Documents)
INSERT INTO public.migo_documents (id, tenant_id, material_id, movement_type, qty, unit, storage_location, ref_document, data) VALUES
('MIGO-50019283', 'tenant_demo', 'MAT-1001', '261', 2, 'UN', 'ALM-01', 'WO-400101',
 '{"id": "MIGO-50019283", "documentId": "MIGO-50019283", "year": "2026", "movementType": "261", "typeLabel": "Salida para Orden de Trabajo (261)", "materialId": "MAT-1001", "materialName": "Filtro de Aceite Hidráulico CAT H-200", "qty": 2, "unit": "UN", "storageLocation": "ALM-01", "targetStorageLocation": "N/A", "refDocument": "WO-400101", "timestamp": "15/08/2026 10:15:00", "user": "M. ALMACEN", "costCenter": "CC-4100", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- 9. Empleados HCM (Employees)
INSERT INTO public.employees (id, tenant_id, plant_id, first_name, last_name, rut, role, data) VALUES
('EMP-1001', 'tenant_demo', '0001', 'Jorge', 'Silva San Martín', '15.482.910-3', 'Técnico Senior de Mantenimiento',
 '{"id": "EMP-1001", "rut": "15.482.910-3", "name": "Jorge Silva San Martín", "position": "Técnico Senior de Mantenimiento", "department": "Mantenimiento de Planta", "plantId": "0001", "baseSalary": 1850000, "status": "Activo", "email": "jorge.silva@empresa.cl", "tenantId": "tenant_demo"}'::jsonb),
('EMP-1002', 'tenant_demo', '0001', 'Carlos', 'Mendoza Morales', '17.320.145-K', 'Especialista Mecánico Hidráulico',
 '{"id": "EMP-1002", "rut": "17.320.145-K", "name": "Carlos Mendoza Morales", "position": "Especialista Mecánico Hidráulico", "department": "Mantenimiento de Planta", "plantId": "0001", "baseSalary": 1950000, "status": "Activo", "email": "carlos.mendoza@empresa.cl", "tenantId": "tenant_demo"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
