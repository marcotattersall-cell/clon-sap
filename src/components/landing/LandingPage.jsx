import React, { useState } from 'react';
import AxomiraLogo from '../common/AxomiraLogo';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Wrench, 
  Boxes, 
  Package, 
  Layers, 
  Database, 
  HardHat, 
  Users, 
  CheckCircle2, 
  Star, 
  Building2, 
  Cpu, 
  BarChart3, 
  Lock, 
  Activity,
  ChevronRight,
  Globe,
  Sliders,
  Play
} from 'lucide-react';

export function LandingPage({ onEnterERP }) {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white overflow-x-hidden">
      
      {/* 1. TOP NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onEnterERP}>
            <AxomiraLogo variant="icon" dark className="w-8 h-8" />
            <div className="leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-white font-mono block">AXOMIRA ERP</span>
              <span className="text-[9px] text-sky-400 font-semibold uppercase tracking-wider block">Enterprise Cloud</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#modules" className="hover:text-sky-400 transition-colors">Módulos SAP</a>
            <a href="#pipeline" className="hover:text-sky-400 transition-colors">Flujo Transaccional</a>
            <a href="#ai" className="hover:text-sky-400 transition-colors">Inteligencia IA</a>
            <a href="#pricing" className="hover:text-sky-400 transition-colors">Planes SLA</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onEnterERP}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all hidden sm:block"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onEnterERP}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>SOLICITAR DEMO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SOC 2 & ISO 27001 Certified</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-amber-400">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.9/5 en Operación Minera</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-sky-400">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>50+ Clientes Corporativos</span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            El ERP Cloud de Última Generación para <br />
            <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
              Minería e Industria Pesada
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Gestión unificada de Mantenimiento PM (IW31), Inventarios MM (MIGO 261/101), Flota de Activos (IE03) y RRHH (HCM) con Inteligencia Artificial y aislamiento multi-inquilino.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button
              onClick={onEnterERP}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <span>SOLICITAR DEMO (ACCESO INSTANTÁNEO)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onEnterERP}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm px-6 py-3.5 rounded-2xl border border-slate-800 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-sky-400 fill-sky-400" />
              <span>Ver Flujo Transaccional</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 font-mono mb-12">
            Sin instalación • Sincronización Cloud y Offline en Faena • Puesta en marcha en minutos
          </p>

          {/* ERP Interactive Mockup Preview Card */}
          <div className="max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl shadow-slate-950 backdrop-blur-xl">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden p-4 sm:p-6 text-left space-y-4">
              
              {/* Fake Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="text-xs font-mono text-slate-400 font-bold ml-2">Axomira ERP • Cockpit Operativo BHP / Codelco</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>System Live (60 FPS)</span>
                </div>
              </div>

              {/* Fake Metric Grid inside Cockpit */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">ÓRDENES PM LIBERADAS</div>
                  <div className="text-lg font-black text-sky-400 mt-1">128 OTs</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">↑ 12% vs mes anterior</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">VALES MIGO 261</div>
                  <div className="text-lg font-black text-amber-400 mt-1">$45.2K USD</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">100% Descontado Stock</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">SALUD DE FLOTA IE03</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">98.5% OK</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">0 Fallas Críticas RUL</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">CUMPLIMIENTO HCM</div>
                  <div className="text-lg font-black text-purple-400 mt-1">100% RUT</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Acreditación Al Día</div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 max-w-4xl mx-auto border-t border-slate-800/80 pt-10">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">35%</div>
              <div className="text-xs text-slate-400 mt-1">Ahorro en Costos Mantenimiento PM</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">50%</div>
              <div className="text-xs text-slate-400 mt-1">Reducción de Tiempos en MIGO</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">2.5x</div>
              <div className="text-xs text-slate-400 mt-1">Visibilidad Real del Inventario</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">99.9%</div>
              <div className="text-xs text-slate-400 mt-1">Disponibilidad SLA Garantizada</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TRANSACTIONAL PIPELINE SECTION */}
      <section id="pipeline" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold">
              Flujo Transaccional SAP
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-4">
              Ciclo Completo de Mantenimiento e Inventario
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              Desde la notificación de falla en terreno hasta la contabilización MIGO y el Cierre Técnico (TECO).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            
            {/* Step 1 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">1</span>
                <span className="text-[10px] text-slate-500">Avisos M1/M2</span>
              </div>
              <h3 className="font-bold text-white text-sm">Notificación de Falla</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Captura de avisos en terreno con clasificación NLP de prioridad e inspección IoT de temperatura.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">2</span>
                <span className="text-[10px] text-slate-500">Orden IW31</span>
              </div>
              <h3 className="font-bold text-white text-sm">Liberación de OT (PM02)</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Programación de horas planificadas, asignación de técnicos especialistas y estrategia de firma ME28.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</span>
                <span className="text-[10px] text-slate-500">Movimiento MIGO</span>
              </div>
              <h3 className="font-bold text-white text-sm">Salida de Almacén (261)</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Descuento atómico de repuestos del maestro de materiales y acumulación financiera directa al costo de la OT.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">4</span>
                <span className="text-[10px] text-slate-500">TECO / CLSD</span>
              </div>
              <h3 className="font-bold text-white text-sm">Cierre Técnico TECO</h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Confirmación de tiempos IW41, firma digital de conformidad y actualización de horómetro del activo.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. MODULES FEATURE GRID */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Módulos Integrados SAP
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-4">
              Una Suite Empresarial Completa
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              Todas las transacciones clave que requiere tu equipo de operaciones en una sola plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-sky-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Mantenimiento PM (IW31 / IW32)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gestión de órdenes correctivas y preventivas, acumulación de costos reales y árbol de jerarquía de equipos IE03.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-amber-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gestión de Materiales MM & MIGO</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Catálogo de repuestos con puntos de reorden, salidas 261 para OTs, entradas 101 por pedidos PO y mapa visual de almacén.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-emerald-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Control de Flota (IE01 / IE03)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Monitoreo de horómetros, revisiones técnicas, seguro SOAP y alertas preventivas de vencimiento de documentación.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-purple-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Recursos Humanos HCM</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Fichas de personal con validación de RUT Chileno, alertas de acreditación de faena minera y ausencias.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-cyan-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Executive Analytics CO/FI</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Dashboards gerenciales de costos por centro de beneficio, reportes de disponibilidad técnica y exportación PDF/Excel.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-rose-500/50 transition-all cursor-pointer" onClick={onEnterERP}>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Estrategia de Liberación (ME28)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Motor de aprobaciones jerárquicas para compras y OTs de alto valor con umbrales configurables por el Administrador General.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. AI POWERED SECTION */}
      <section id="ai" className="py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
            
            <div className="space-y-4 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                IA & Mantenimiento Predictivo (PdM)
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                Modelos Predictivos ML e Ingesta de Telemetría IoT
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Nuestra Inteligencia Artificial analiza patrones vibracionales y térmicos para anticipar fallas catastróficas antes de que ocurran.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Cálculo de Vida Útil Remanente (RUL) en horas de motor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Clasificación NLP automática de criticidad de avisos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Pronóstico de demanda de repuestos MM en almacén
                </li>
              </ul>

              <button
                onClick={onEnterERP}
                className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                Probar Copiloto de Inteligencia Artificial
              </button>
            </div>

            <div className="w-full lg:w-96 bg-slate-950 p-5 rounded-2xl border border-purple-500/30 space-y-3 font-mono text-xs shadow-2xl">
              <div className="flex justify-between items-center text-purple-400 font-bold border-b border-slate-800 pb-2">
                <span>INFERENCIA ML EN VIVO</span>
                <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">PdM Engine</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipo:</span>
                  <span className="font-bold text-white">Chancador Metso C160</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RUL Estimado:</span>
                  <span className="font-bold text-amber-400">48 Horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recomendación:</span>
                  <span className="font-bold text-emerald-400">Generar OT PM02</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. SLA TIERS PRICING */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
              Reglas de Respaldo & SLA
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-4">
              Niveles de Servicio para Inquilinos Corporativos
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
              Planes adaptados a la intensidad operativa de cada planta industrial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            
            {/* HIGH SLA */}
            <div className="p-6 bg-slate-900 border border-amber-500/40 rounded-2xl space-y-4 relative">
              <span className="absolute top-4 right-4 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                TIER HIGH
              </span>
              <h3 className="text-base font-bold text-white">Diario (02:00 AM)</h3>
              <p className="text-slate-400 font-sans text-xs">
                Para faenas de gran minería de alto volumen transaccional (Ej. BHP Billiton, CODELCO).
              </p>
              <ul className="space-y-2 text-slate-300 font-sans">
                <li>✓ Respaldo automático diario SHA-256</li>
                <li>✓ Soporte 24/7 en terreno</li>
                <li>✓ Aislamiento multi-tenant 100% verificado</li>
              </ul>
            </div>

            {/* MEDIUM SLA */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold border border-sky-500/30 float-right">
                TIER MEDIUM
              </span>
              <h3 className="text-base font-bold text-white">Semanal (Domingos)</h3>
              <p className="text-slate-400 font-sans text-xs">
                Para medianas mineras y plantas de procesamiento (Ej. Antofagasta Minerals, Collahuasi).
              </p>
              <ul className="space-y-2 text-slate-300 font-sans">
                <li>✓ Respaldo semanal programado</li>
                <li>✓ Soporte técnico prioritaria</li>
                <li>✓ Reportes semanales de KPI</li>
              </ul>
            </div>

            {/* LOW SLA */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold float-right">
                TIER LOW
              </span>
              <h3 className="text-base font-bold text-white">Mensual (Día 1)</h3>
              <p className="text-slate-400 font-sans text-xs">
                Para proyectos piloto, contratos de mantenimiento menores y entornos de prueba.
              </p>
              <ul className="space-y-2 text-slate-300 font-sans">
                <li>✓ Respaldo mensual de catálogo</li>
                <li>✓ Acceso a documentación completa</li>
                <li>✓ Entorno Demo listo</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FINAL CTA & FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex justify-center items-center space-x-2">
            <AxomiraLogo variant="icon" dark className="w-8 h-8" />
            <span className="font-extrabold text-sm text-white font-mono">AXOMIRA CLOUD ERP</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Plataforma Enterprise de Gestión de Mantenimiento PM, Inventario MM y Flotas Mineras.
          </p>
          <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 Axomira ERP Enterprise. Todos los derechos reservados.</span>
            <span>Seguridad ISO 27001 • Aislamiento Multi-Tenant Certificado</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
