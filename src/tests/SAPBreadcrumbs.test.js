import { describe, it, expect } from 'vitest';
import { TAB_BREADCRUMB_MAP } from '../components/shell/FioriBreadcrumbs';

describe('📌 SAP Fiori Breadcrumbs Navigation System', () => {
  it('debe definir mapeos jerárquicos válidos para todas las pestañas de navegación', () => {
    const requiredTabs = ['LAUNCHPAD', 'WORK_ORDERS', 'ASSETS', 'FLEET', 'INVENTORY', 'MIGO', 'ANALYTICS', 'HR', 'USER_MGMT'];

    requiredTabs.forEach(tabKey => {
      const map = TAB_BREADCRUMB_MAP[tabKey];
      expect(map).toBeDefined();
      expect(map.module).toBeTypeOf('string');
      expect(map.view).toBeTypeOf('string');
      expect(map.tcode).toBeTypeOf('string');
      expect(map.icon).toBeDefined();
    });
  });

  it('debe estructurar los nombres de módulos e íconos SAP correctamente', () => {
    expect(TAB_BREADCRUMB_MAP.WORK_ORDERS.module).toBe('Mantenimiento PM');
    expect(TAB_BREADCRUMB_MAP.MIGO.module).toBe('Gestión Materiales MM');
    expect(TAB_BREADCRUMB_MAP.HR.module).toBe('Recursos Humanos HCM');
    expect(TAB_BREADCRUMB_MAP.USER_MGMT.module).toBe('Administración Global');
  });
});
