/**
 * 🛡️ AXOMIRA INTELLIGENT CLOUD ERP — MATRIZ DE CONTROL DE ACCESO BASADO EN ROLES (RBAC MATRIX)

 * 
 * Define las autorizaciones por módulo, transacción y rol de usuario en la plataforma ERP.
 */

export const SAP_ROLES = {
  ADMINISTRATOR: {
    id: 'ADMINISTRATOR',
    title: 'Administrador Universal (SAP_ALL)',
    description: 'Acceso total sin restricciones a todos los módulos, tenants, auditoría y consola SU01.',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
  },
  MAINTENANCE_MGR: {
    id: 'MAINTENANCE_MGR',
    title: 'Jefe / Supervisor de Mantenimiento (PM)',
    description: 'Gestión completa de activos IE03, creación IW31, programación de flota y control de costos PM.',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
  },
  WAREHOUSE_KEEPER: {
    id: 'WAREHOUSE_KEEPER',
    title: 'Encargado de Almacén e Inventarios (MM)',
    description: 'Gestión del maestro de materiales MM03, salidas/entradas MIGO (261/101/311) y pedidos PO.',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  },
  FIELD_MECHANIC: {
    id: 'FIELD_MECHANIC',
    title: 'Técnico Especialista de Campo',
    description: 'Ejecución operativa en terreno, confirmación de tiempos IW41, cierre técnico TECO y checklist.',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
  }
};

export const RBAC_PERMISSIONS = {
  // 🛠️ Módulo Mantenimiento PM
  PM_CREATE_ORDER: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  PM_EDIT_ORDER: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  PM_VIEW_ORDERS: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER', 'FIELD_MECHANIC'],
  PM_TECO_CLOSE: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'FIELD_MECHANIC'],
  PM_CREATE_ASSET: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  PM_VIEW_ASSETS: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER', 'FIELD_MECHANIC'],

  // 📦 Módulo Almacén MM
  MM_CREATE_MATERIAL: ['ADMINISTRATOR', 'WAREHOUSE_KEEPER'],
  MM_EDIT_MATERIAL: ['ADMINISTRATOR', 'WAREHOUSE_KEEPER'],
  MM_VIEW_INVENTORY: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER'],
  MM_MIGO_MOVEMENT: ['ADMINISTRATOR', 'WAREHOUSE_KEEPER', 'MAINTENANCE_MGR'],

  // 👥 Módulo Recursos Humanos HCM
  HCM_MANAGE_EMPLOYEES: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  HCM_VIEW_EMPLOYEES: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER'],

  // 📊 Analítica y Finanzas
  ANALYTICS_VIEW_FULL: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  ANALYTICS_VIEW_OPERATIONAL: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER'],

  // 🔑 Administración Global y Tenants (SU01)
  SU01_GLOBAL_USER_MGMT: ['ADMINISTRATOR'],
  SU01_SWITCH_TENANTS: ['ADMINISTRATOR'],
  BACKUP_EXECUTE: ['ADMINISTRATOR'],

  // ⚡ Motor de Aprobaciones y Estrategias de Liberación (ME51N/ME21N/MIGO)
  WORKFLOW_APPROVE_HIGH_VALUE: ['ADMINISTRATOR', 'MAINTENANCE_MGR'],
  WORKFLOW_VIEW_INBOX: ['ADMINISTRATOR', 'MAINTENANCE_MGR', 'WAREHOUSE_KEEPER'],
  WORKFLOW_CONFIG_THRESHOLDS: ['ADMINISTRATOR']
};

/**
 * Verifica si un rol tiene autorización para realizar una acción específica.
 */
export const hasPermission = (role, permissionKey) => {
  if (role === 'ADMINISTRATOR') return true; // Super Admin siempre tiene acceso total
  const allowedRoles = RBAC_PERMISSIONS[permissionKey];
  return Array.isArray(allowedRoles) && allowedRoles.includes(role);
};
