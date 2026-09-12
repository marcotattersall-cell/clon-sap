import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { AxomiraLogo } from './common/AxomiraLogo';

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Instagram = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function FooterCard({ onEnterERP }) {
  const socials = [
    { name: 'LinkedIn', icon: Linkedin },
    { name: 'Twitter', icon: Twitter },
    { name: 'Instagram', icon: Instagram },
  ];

  const productLinks = ['Mantenimiento (PM)', 'Almacén (MM)', 'Recursos Humanos (HCM)', 'Gestión de Flota'];
  const scienceLinks = ['Analítica & BI', 'Seguridad RBAC', 'Auditoría SAP', 'Multi-Inquilino'];
  const companyLinks = ['Sobre Synapse', 'Partners', 'Centro de Soporte'];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-[#E9EBEE] rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-white rounded-[40px] m-2 shadow-sm">
          <div className="p-8 md:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <AxomiraLogo variant="mark" className="w-9 h-9" />
                <div className="flex flex-col">
                  <span className="text-[26px] font-black tracking-tight text-[#0F172A] leading-none">synapse</span>
                  <span className="text-[9px] font-extrabold tracking-[0.22em] text-blue-600 uppercase mt-1">
                    Enterprise Operating System
                  </span>
                </div>
              </div>
              <p className="text-[#64748B] leading-relaxed text-[15px] font-normal max-w-[340px]">
                Sistema Operativo Empresarial Autónomo de alta precisión. Integración inmutable de Mantenimiento PM, Inventarios MM, Gestión de Flotas y Recursos Humanos (HCM).
              </p>

              {/* Botón de Ingreso a Synapse ERP */}
              {onEnterERP && (
                <div className="pt-2">
                  <button
                    onClick={onEnterERP}
                    type="button"
                    className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar a SYNAPSE ERP</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={social.name}
                      type="button"
                      aria-label={social.name}
                      className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-all active:scale-95 group"
                    >
                      <Icon className="w-5 h-5 text-slate-800" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Módulos ERP */}
            <div className="space-y-6">
              <h4 className="text-[14px] font-medium text-[#94A3B8]">Módulos ERP</h4>
              <ul className="space-y-4">
                {productLinks.map((link) => (
                  <li key={link}>
                    <button onClick={onEnterERP} className="text-[15px] font-medium text-[#1E293B] hover:text-[#2563EB] transition-colors text-left">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Plataforma */}
            <div className="space-y-6">
              <h4 className="text-[14px] font-medium text-[#94A3B8]">Plataforma</h4>
              <ul className="space-y-4">
                {scienceLinks.map((link) => (
                  <li key={link}>
                    <button onClick={onEnterERP} className="text-[15px] font-medium text-[#1E293B] hover:text-[#2563EB] transition-colors text-left">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div className="space-y-6">
              <h4 className="text-[14px] font-medium text-[#94A3B8]">Empresa</h4>
              <ul className="space-y-4">
                {companyLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[15px] font-medium text-[#1E293B] hover:text-[#2563EB] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="px-6 sm:px-12 md:px-16 lg:px-20 py-5 flex flex-col md:flex-row justify-between items-center gap-6 text-[15px]">
          <p className="text-[#64748B] font-medium">© 2026 SYNAPSE Enterprise ERP. Todos los derechos reservados.</p>
          <div className="flex flex-row gap-6 text-[#64748B] font-medium items-center">
            {onEnterERP && (
              <button
                onClick={onEnterERP}
                className="text-[#2563EB] font-bold hover:underline transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Acceso Clientes / Login</span>
              </button>
            )}
            <div className="w-[1px] h-4 bg-slate-300" />
            <a href="#" className="hover:text-[#1E293B] transition-colors">
              Centro Legal
            </a>
            <div className="w-[1px] h-4 bg-slate-300" />
            <a href="#" className="hover:text-[#1E293B] transition-colors">
              Acuerdo de Usuario
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassText({ onEnterERP }) {
  return (
    <div
      onClick={onEnterERP}
      className="relative w-full flex items-center justify-center select-none pt-0 cursor-pointer"
      title="Hacer clic para ingresar a SYNAPSE ERP"
    >
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" result="outer-shadow" />
            <feComponentTransfer in="SourceAlpha" result="alpha">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
            <feOffset in="alpha" dx="0" dy="4" result="offset-white" />
            <feGaussianBlur in="offset-white" stdDeviation="4" result="blur-white" />
            <feComposite in="alpha" in2="blur-white" operator="out" result="inner-white-mask" />
            <feFlood floodColor="#ffffff" floodOpacity="0.25" result="white-fill" />
            <feComposite in="white-fill" in2="inner-white-mask" operator="in" result="inner-white-final" />
            <feGaussianBlur in="alpha" stdDeviation="6" result="blur-black" />
            <feComposite in="alpha" in2="blur-black" operator="out" result="inner-black-mask" />
            <feFlood floodColor="#000000" floodOpacity="0.25" result="black-fill" />
            <feComposite in="black-fill" in2="inner-black-mask" operator="in" result="inner-black-final" />
            <feMerge>
              <feMergeNode in="outer-shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="inner-white-final" />
              <feMergeNode in="inner-black-final" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <h1
          className="text-[min(18vw,300px)] font-black tracking-tighter leading-none select-none text-white px-4 uppercase"
          style={{ filter: 'url(#glass-effect)' }}
        >
          synapse
        </h1>
      </motion.div>
    </div>
  );
}

export default function Footer({ onEnterERP }) {
  return (
    <footer className="w-full flex flex-col items-center gap-0">
      <FooterCard onEnterERP={onEnterERP} />
      <GlassText onEnterERP={onEnterERP} />
    </footer>
  );
}
