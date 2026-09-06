import { describe, it, expect } from 'vitest';
import { LandingPage } from '../components/landing/LandingPage';
import { TAB_BREADCRUMB_MAP } from '../components/shell/FioriBreadcrumbs';

describe('🚀 AXOMIRA ERP Enterprise Landing Page', () => {
  it('debe tener definido el mapeo de la Landing Page en TAB_BREADCRUMB_MAP', () => {
    const landingMap = TAB_BREADCRUMB_MAP.LANDING;
    expect(landingMap).toBeDefined();
    expect(landingMap.module).toBe('Axomira Portal');
    expect(landingMap.view).toBe('Landing Page Corporativa');
    expect(landingMap.tcode).toBe('PORTAL');
    expect(landingMap.icon).toBeDefined();
  });

  it('debe exportar el componente LandingPage correctamente como una función React', () => {
    expect(LandingPage).toBeDefined();
    expect(typeof LandingPage).toBe('function');
  });
});
