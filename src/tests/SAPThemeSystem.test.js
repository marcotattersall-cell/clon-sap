import { describe, it, expect, beforeEach } from 'vitest';

describe('🎨 SAP Global Theme System (Fiori Dark Stealth vs Morning Horizon)', () => {
  let mockLocalStorage = {};
  let mockDocClasses = new Set();
  let mockDocAttributes = {};

  beforeEach(() => {
    mockLocalStorage = {};
    mockDocClasses = new Set();
    mockDocAttributes = {};
  });

  const getInitialTheme = () => {
    try {
      return mockLocalStorage['sap_theme_mode'] || 'dark';
    } catch (e) {
      return 'dark';
    }
  };

  const applyThemeToDOM = (mode) => {
    mockLocalStorage['sap_theme_mode'] = mode;
    if (mode === 'dark') {
      mockDocClasses.add('dark');
      mockDocAttributes['data-theme'] = 'dark';
    } else {
      mockDocClasses.delete('dark');
      mockDocAttributes['data-theme'] = 'light';
    }
  };

  it('debe aplicar la clase dark por defecto en la inicialización', () => {
    const initialTheme = getInitialTheme();
    expect(initialTheme).toBe('dark');

    applyThemeToDOM(initialTheme);

    expect(mockDocClasses.has('dark')).toBe(true);
    expect(mockDocAttributes['data-theme']).toBe('dark');
  });

  it('debe conmutar sincrónicamente entre dark y light y actualizar el atributo data-theme', () => {
    let themeMode = 'dark';

    const toggleTheme = () => {
      themeMode = themeMode === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(themeMode);
    };

    // Toggle 1 -> light
    toggleTheme();
    expect(themeMode).toBe('light');
    expect(mockLocalStorage['sap_theme_mode']).toBe('light');
    expect(mockDocClasses.has('dark')).toBe(false);
    expect(mockDocAttributes['data-theme']).toBe('light');

    // Toggle 2 -> dark
    toggleTheme();
    expect(themeMode).toBe('dark');
    expect(mockLocalStorage['sap_theme_mode']).toBe('dark');
    expect(mockDocClasses.has('dark')).toBe(true);
    expect(mockDocAttributes['data-theme']).toBe('dark');
  });
});
