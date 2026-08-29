import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  X,
  Sparkles,
  Layers,
  Wrench,
  Package,
  Users,
  Building2,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Volume2
} from 'lucide-react';

export const TOUR_STEPS = [
  {
    id: 'INTRO',
    title: 'Bienvenido a NEBEX Cloud Platform',
    subtitle: 'El ERP de Próxima Generación para la Industria & Minería',
    tab: 'LAUNCHPAD',
    narration: 'Bienvenido a la era de la gestión empresarial inteligente. Descubre NEBEX Cloud Platform: la arquitectura ERP cloud-native diseñada para transformar la operativa de mantenimiento, inventarios y recursos humanos en tiempo real.',
    icon: Sparkles,
    badge: 'Paso 1 de 7 • Introducción'
  },
  {
    id: 'HORIZON_KPIS',
    title: 'Cockpit Ejecutivo & Mosaicos Horizon',
    subtitle: 'Indicadores Clave de Desempeño en Tiempo Real',
    tab: 'LAUNCHPAD',
    narration: 'Con una interfaz nórdica minimalista y sin saturación visual, el Cockpit Ejecutivo integra indicadores clave en tiempo real: desde el estado operacional de tus activos hasta la valoración contable acumulada de tus inventarios.',
    icon: Layers,
    badge: 'Paso 2 de 7 • Métricas Ejecutivas'
  },
  {
    id: 'PM_MODULE',
    title: 'Mantenimiento (#mnt-ordenes)',
    subtitle: 'Gestión de Órdenes de Trabajo (nebex:mantenimiento:ordenes)',
    tab: 'WORK_ORDERS',
    narration: 'Optimiza la disponibilidad operacional de tu maquinaria. Asigna órdenes de trabajo preventivas y correctivas, monitorea la salud estructural de tus equipos y reduce el tiempo de parada no programada con el slug nebex:mantenimiento:ordenes.',
    icon: Wrench,
    badge: 'Paso 3 de 7 • #mnt-ordenes'
  },
  {
    id: 'MM_MODULE',
    title: 'Inventario & Movimientos (#inv-mov)',
    subtitle: 'Control de Stock & Movimientos (nebex:inventario:movimientos)',
    tab: 'INVENTORY',
    narration: 'Gestiona tu cadena de suministro sin fricción. Registra salidas y entradas de mercancía con el flujo nebex:inventario:movimientos (#inv-mov) de forma atómica, automatiza reaprovisionamientos y mantiene trazado exacto de stock.',
    icon: Package,
    badge: 'Paso 4 de 7 • #inv-mov'
  },
  {
    id: 'HCM_MODULE',
    title: 'Recursos Humanos & Semáforo de Faenas (HCM)',
    subtitle: 'Acreditaciones, Exámenes Médicos & Control de Personal',
    tab: 'HR',
    narration: 'Protege a tu equipo y asegura el cumplimiento en terreno. El módulo HCM monitorea licencias, certificaciones y exámenes médicos con alertas automáticas antes de ingresar a cada faena.',
    icon: Users,
    badge: 'Paso 5 de 7 • Recursos Humanos HCM'
  },
  {
    id: 'MULTI_TENANT',
    title: 'Arquitectura Multi-Tenant Corporativa',
    subtitle: 'Aislamiento de Datos por Cliente & Conmutación Instantánea',
    tab: 'LAUNCHPAD',
    tenant: 'tenant_codelco',
    narration: 'Seguridad y escalabilidad garantizadas. Nuestra arquitectura Multi-Tenant permite operar múltiples empresas o divisiones mineras con un aislamiento de datos 100% estricto.',
    icon: Building2,
    badge: 'Paso 6 de 7 • Multi-Tenancy'
  },
  {
    id: 'ANALYTICS_OUTRO',
    title: 'Analytics Cloud & Cierre Promocional',
    subtitle: 'NEBEX ERP • Enterprise ERP for Mining & Heavy Industry',
    tab: 'ANALYTICS',
    narration: 'NEBEX Cloud Platform: El poder de un ERP Enterprise con la agilidad de la nube. Pruébalo hoy en clon-sap-2026.web.app',
    icon: BarChart3,
    badge: 'Paso 7 de 7 • Resumen & Demo'
  }
];

export const AppTourEngine = ({ isOpen, onClose }) => {
  const { setActiveTab } = useSAP();
  const { switchTenant, user } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(6000); // 6 segundos por paso

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Aplicar cambios de vista por cada paso del recorrido
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep.tab) {
      setActiveTab(currentStep.tab);
    }

    if (currentStep.tenant && typeof switchTenant === 'function') {
      switchTenant(currentStep.tenant);
    }
  }, [currentStepIndex, isOpen]);

  // Temporizador de Auto-Play
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= TOUR_STEPS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentStepIndex, speed]);

  if (!isOpen) return null;

  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom duration-300">
      {/* Banner de Recorrido Promocional Estilo Fiori Glass */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 text-white rounded-2xl shadow-2xl p-5 space-y-3 relative overflow-hidden">
        {/* Glow Superior Ambient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-purple-500 animate-pulse" />

        {/* Encabezado del Paso */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <IconComponent className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800 font-mono">
                {currentStep.badge}
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-tight mt-0.5 flex items-center gap-2">
                <span>{currentStep.title}</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar Recorrido"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtítulo y Locución Narrada */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{currentStep.subtitle}</span>
          </p>
          <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
            "{currentStep.narration}"
          </p>
        </div>

        {/* Barra de Progreso y Controles */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-7 bg-sky-400'
                    : idx < currentStepIndex
                    ? 'w-3 bg-sky-600/60'
                    : 'w-2 bg-slate-700'
                }`}
                title={st.title}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRestart}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Reiniciar Recorrido"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold transition-colors"
            >
              Anterior
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === TOUR_STEPS.length - 1}
              className="px-3 py-1 bg-sap-blue text-white hover:bg-sky-600 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
