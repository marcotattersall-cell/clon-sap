/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sap: {
          blue: '#0284c7',
          'blue-hover': '#0369a1',
          'blue-light': '#f0f9ff',
          dark: '#0f172a',
          'dark-surface': '#1e293b',
          'dark-card': '#1e293b',
          'dark-border': '#334155',
          gold: '#d97706',
          green: '#059669',
          'green-light': '#ecfdf5',
          red: '#dc2626',
          'red-light': '#fef2f2',
          purple: '#7c3aed',
          gray: '#64748b',
          'light-bg': '#f8fafc',
          'light-card': '#ffffff',
          'light-border': '#e2e8f0',
          header: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        heading: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'fiori': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'fiori-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'fiori-glow': '0 0 12px rgba(2, 132, 199, 0.2)',
      }
    },
  },
  plugins: [],
}
