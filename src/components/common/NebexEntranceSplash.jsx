import React, { useEffect, useState } from 'react';
import AxomiraLogo from './AxomiraLogo';
import { Sparkles } from 'lucide-react';

export const NebexEntranceSplash = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('Autenticando Permisos & Tenant Corporativo...');
  const [progressWidth, setProgressWidth] = useState('20%');

  useEffect(() => {
    // Secuencia de mensajes y progreso en los 4.2 segundos
    const step1 = setTimeout(() => {
      setStatusText('Cargando Módulos AXOMIRA Cloud Platform...');
      setProgressWidth('65%');
    }, 1400);

    const step2 = setTimeout(() => {
      setStatusText('Acceso Concedido • Bienvenido a AXOMIRA');
      setProgressWidth('100%');
    }, 2800);

    // Inicia el desvanecimiento a los 3800ms (3.8s) y finaliza a los 4200ms (4.2s)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3800);

    const doneTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4200);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-400 pointer-events-none ${
        isFadingOut ? 'opacity-0 scale-105 blur-xs' : 'opacity-100 scale-100'
      }`}
    >
      {/* Glow de fondo difuminado de alta gama con pulsación continua */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-sky-500/25 via-blue-600/30 to-indigo-500/25 blur-3xl animate-pulse" />

      {/* Contenedor del Logo de NEBEX con animación sutil de escala e iluminación */}
      <div className="relative z-10 flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-sm px-4 text-center">
        <AxomiraLogo
          variant="full"
          dark
          className="w-64 sm:w-72 h-auto filter drop-shadow-[0_12px_30px_rgba(56,189,248,0.3)] transition-transform duration-1000 hover:scale-105"
        />

        {/* Badge con Mensaje Secuencial Dinámico */}
        <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider text-sky-400 uppercase bg-slate-900/90 px-4 py-2 rounded-full border border-sky-500/30 shadow-xl backdrop-blur-md transition-all duration-300">
          <Sparkles className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          <span className="truncate">{statusText}</span>
        </div>

        {/* Barra de Progreso Neomórfica Sutil */}
        <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: progressWidth }}
          />
        </div>
      </div>
    </div>
  );
};
