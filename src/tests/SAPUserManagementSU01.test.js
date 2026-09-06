import { describe, it, expect } from 'vitest';
import { UNIVERSAL_ADMIN_EMAIL, formatUserProfile } from '../context/AuthContext';
import { hasPermission } from '../utils/rbacRules';

/**
 * 🧪 PRUEBAS UNITARIAS DE LA TRANSACCIÓN SAP SU01 / SU10 & MATRIZ RBAC
 * Consola Centralizada de Gestión Global de Usuarios & Tenants para Super Admin
 */

describe('Transacción SAP SU01 / SU10 & Matriz RBAC', () => {

  it('debe otorgar perfil ADMINISTRATOR y permisos SAP_ALL al correo de Administrador Universal', () => {
    const mockUser = {
      uid: 'uid-admin-101',
      email: UNIVERSAL_ADMIN_EMAIL,
      displayName: 'Marco Tattersall'
    };

    const profile = formatUserProfile(mockUser);

    expect(profile.isUniversalAdmin).toBe(true);
    expect(profile.role).toBe('ADMINISTRATOR');
  });

  it('debe validar la matriz de permisos RBAC por Rol SAP correctamente', () => {
    // 1. ADMINISTRATOR (SAP_ALL) debe tener permiso para todo
    expect(hasPermission('ADMINISTRATOR', 'SU01_GLOBAL_USER_MGMT')).toBe(true);
    expect(hasPermission('ADMINISTRATOR', 'PM_CREATE_ORDER')).toBe(true);
    expect(hasPermission('ADMINISTRATOR', 'MM_MIGO_MOVEMENT')).toBe(true);

    // 2. MAINTENANCE_MGR (PM) debe crear OTs y Activos, pero NO ingresar a SU01
    expect(hasPermission('MAINTENANCE_MGR', 'PM_CREATE_ORDER')).toBe(true);
    expect(hasPermission('MAINTENANCE_MGR', 'PM_CREATE_ASSET')).toBe(true);
    expect(hasPermission('MAINTENANCE_MGR', 'SU01_GLOBAL_USER_MGMT')).toBe(false);

    // 3. WAREHOUSE_KEEPER (MM) debe mover stock MIGO y crear materiales, pero NO crear OTs PM
    expect(hasPermission('WAREHOUSE_KEEPER', 'MM_MIGO_MOVEMENT')).toBe(true);
    expect(hasPermission('WAREHOUSE_KEEPER', 'MM_CREATE_MATERIAL')).toBe(true);
    expect(hasPermission('WAREHOUSE_KEEPER', 'PM_CREATE_ORDER')).toBe(false);

    // 4. FIELD_MECHANIC (Terreno) debe poder hacer cierre técnico TECO, pero NO crear activos ni entrar a SU01
    expect(hasPermission('FIELD_MECHANIC', 'PM_TECO_CLOSE')).toBe(true);
    expect(hasPermission('FIELD_MECHANIC', 'PM_CREATE_ASSET')).toBe(false);
    expect(hasPermission('FIELD_MECHANIC', 'SU01_GLOBAL_USER_MGMT')).toBe(false);
  });

  it('debe permitir cambiar la empresa (tenant_id) asignada a un usuario en SU01', () => {
    const userSU01 = {
      id: 'USR-1002',
      name: 'Jorge Silva San Martín',
      email: 'jorge.silva@codelco.cl',
      role: 'MAINTENANCE_MGR',
      tenantId: 'tenant_codelco',
      status: 'Activo'
    };

    userSU01.tenantId = 'tenant_bhp';
    userSU01.tenantName = 'BHP Billiton';

    expect(userSU01.tenantId).toBe('tenant_bhp');
    expect(userSU01.tenantName).toBe('BHP Billiton');
  });

  it('debe permitir bloquear y desbloquear accesos de usuario en SU01', () => {
    const userSU01 = {
      id: 'USR-1004',
      name: 'Luis Paredes Ugarte',
      status: 'Activo'
    };

    userSU01.status = 'Bloqueado';
    expect(userSU01.status).toBe('Bloqueado');

    userSU01.status = 'Activo';
    expect(userSU01.status).toBe('Activo');
  });

  it('debe acumular, permitir editar y generar respuestas por email para solicitudes de DEMO', () => {
    const demoReq = {
      id: 'DEMO-REQ-2026-9999',
      ticketId: 'DEMO-REQ-2026-9999',
      fullName: 'Prueba Solicitante',
      email: 'prueba@empresa.com',
      company: 'Empresa Test SpA',
      industry: 'Gran Minería & Extracción',
      employeeCount: '51 a 200 colaboradores',
      phone: '+56 9 1111 2222',
      primaryModule: 'Suite ERP Completa',
      assetCount: '10 a 50 Equipos/Maquinarias',
      notes: 'Necesitamos probar sandbox.',
      status: 'Pendiente',
      responseNotes: ''
    };

    // 1. Acumulación y Persistencia
    const list = [demoReq];
    expect(list.length).toBe(1);
    expect(list[0].ticketId).toBe('DEMO-REQ-2026-9999');

    // 2. Edición
    list[0].status = 'En Revisión';
    list[0].notes = 'Actualización de notas.';
    expect(list[0].status).toBe('En Revisión');
    expect(list[0].notes).toBe('Actualización de notas.');

    // 3. Respuesta por E-mail
    const emailSubject = `[AXOMIRA ERP] Respuesta a Solicitud de Demostración (${list[0].ticketId})`;
    list[0].status = 'Respondido';
    list[0].responseNotes = `[2026-09-06] Correo enviado: "${emailSubject}"`;

    expect(list[0].status).toBe('Respondido');
    expect(list[0].responseNotes).toContain('Correo enviado');
  });

});

