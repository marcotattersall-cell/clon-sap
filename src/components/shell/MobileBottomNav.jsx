import React from 'react';
import { useSAP } from '../../context/SAPContext';
import { LayoutGrid, Wrench, Cpu, Package, Truck, BarChart3, Users } from 'lucide-react';

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab } = useSAP();

  const navItems = [
    { id: 'LAUNCHPAD', label: 'Inicio', icon: LayoutGrid, slug: 'operam:home:cockpit' },
    { id: 'WORK_ORDERS', label: 'Órdenes', icon: Wrench, slug: 'operam:mantenimiento:ordenes' },
    { id: 'HR', label: 'Personal', icon: Users, slug: 'operam:rrhh:personal' },
    { id: 'ASSETS', label: 'Activos', icon: Cpu, slug: 'operam:flota:activos' },
    { id: 'INVENTORY', label: 'Stock', icon: Package, slug: 'operam:inventario:materiales' },
    { id: 'ANALYTICS', label: 'Analítica', icon: BarChart3, slug: 'operam:analitica:costos' }

  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex items-center justify-around lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] no-print">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-1.5 px-1 min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all ${
              isActive
                ? 'text-sap-blue font-bold bg-sky-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110 text-sap-blue' : ''}`} />
            <span className="text-[10px] tracking-tight leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
