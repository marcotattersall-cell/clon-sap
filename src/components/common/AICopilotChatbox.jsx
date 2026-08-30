import React, { useState, useRef, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import {
  MessageSquare,
  Bot,
  Send,
  X,
  Sparkles,
  Wrench,
  Package,
  HardHat,
  Layers,
  ChevronRight,
  RefreshCw,
  Zap,
  ShieldAlert,
  FileText,
  Printer,
  Download
} from 'lucide-react';
const ExecutiveReportGeneratorModal = React.lazy(() => import('../modals/ExecutiveReportGeneratorModal').then(m => ({ default: m.ExecutiveReportGeneratorModal })));

export const AICopilotChatbox = () => {
  const {
    workOrders = [],
    materials = [],
    employees = [],
    assets = [],
    setActiveTab,
    addToast
  } = useSAP();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: '¡Hola! Soy tu Copiloto Axomira AI. Estoy conectado en tiempo real al sistema ERP. ¿En qué puedo ayudarte hoy?',
      quickActions: [
        { label: '📊 Generar Reporte BI', query: 'Genera el informe ejecutivo de mantenimiento y presupuesto' },
        { label: '🚨 Órdenes Críticas', query: '¿Cuáles son las órdenes PM de prioridad Alta?' },
        { label: '📦 Stock de Repuestos', query: '¿Qué materiales están bajo el punto de reorden?' },
        { label: '👷 Acreditaciones RRHH', query: '¿Hay vencimientos de acreditación en los próximos 30 días?' }
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Intelligent Context-Aware AI Response Engine
  const generateAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase();

    // 0. Consultas sobre Reportes / Informes / PDF / BI
    if (q.includes('reporte') || q.includes('informe') || q.includes('pdf') || q.includes('excel') || q.includes('bi') || q.includes('exportar')) {
      return {
        text: `📄 **Motor de Reportes Ejecutivos BI Activado:**\nPuedo sintetizar automáticamente los indicadores de Mantenimiento PM, Inventario MM, Salud de Flota PdM o Acreditaciones HCM en un informe auditable listo para imprimir o exportar a Excel.`,
        actionType: 'OPEN_REPORT_MODAL',
        actionLabel: '📄 Abrir Generador de Reportes BI'
      };
    }

    // 1. Consultas sobre Órdenes de Trabajo (PM)
    if (q.includes('orden') || q.includes('ot') || q.includes('pm') || q.includes('mantenimiento') || q.includes('crítica')) {
      const highPriorityWO = workOrders.filter(w => w.priority === 'Muy Alta' || w.priority === 'Alta');
      const openWO = workOrders.filter(w => w.status !== 'TECO' && w.status !== 'CLSD');

      return {
        text: `📊 **Informe de Mantenimiento PM (En Vivo):**\nActualmente tienes **${openWO.length} órdenes abiertas**, de las cuales **${highPriorityWO.length} son de alta prioridad**.\n\nÓrdenes más relevantes:\n${highPriorityWO.slice(0, 3).map(w => `• **${w.id}**: ${w.title} (${w.priority})`).join('\n')}`,
        targetTab: 'WORK_ORDERS',
        tabLabel: 'Ir al Módulo de Órdenes (#mnt-ordenes)'
      };
    }

    // 2. Consultas sobre Inventario / Stock (MM / MIGO)
    if (q.includes('stock') || q.includes('material') || q.includes('migo') || q.includes('reorden') || q.includes('repuesto')) {
      const lowStock = materials.filter(m => m.stock <= m.reorderPoint);

      return {
        text: `📦 **Auditoría de Almacén:**\nHay **${lowStock.length} materiales en punto de reorden crítico**.\n\nItems críticos:\n${lowStock.slice(0, 3).map(m => `• **${m.id}**: ${m.name} (Stock: ${m.stock} ${m.unit} | Mín: ${m.reorderPoint})`).join('\n')}`,
        targetTab: 'INVENTORY',
        tabLabel: 'Ver Maestro de Materiales (#inv-materiales)'
      };
    }

    // 3. Consultas sobre Personal / RRHH / Acreditaciones (HCM)
    if (q.includes('acreditacion') || q.includes('personal') || q.includes('empleado') || q.includes('rrhh') || q.includes('vencimiento')) {
      const getDays = (dateStr) => {
        if (!dateStr) return 999;
        const target = new Date(dateStr);
        return Math.ceil((target.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      };

      const alerts = employees.filter(e => {
        const m = getDays(e.medicalExamExpiry);
        const a = getDays(e.accreditationExpiry);
        return m <= 30 || a <= 30;
      });

      return {
        text: `👷 **Auditoría de Cumplimiento HCM:**\nDetecté **${alerts.length} colaboradores con acreditaciones o exámenes médicos por vencer** en los próximos 30 días.\n\nCasos prioritarios:\n${alerts.slice(0, 3).map(e => `• **${e.name}** (${e.position})`).join('\n')}`,
        targetTab: 'HR',
        tabLabel: 'Ir a Fichas de Personal (#rrhh-personal)'
      };
    }

    // 4. Consultas sobre Equipos / Flota / Activos (IE03)
    if (q.includes('equipo') || q.includes('activo') || q.includes('flota') || q.includes('maquinaria') || q.includes('chancador')) {
      const maintenanceAssets = assets.filter(a => a.status === 'MAINTENANCE');
      const operativeAssets = assets.filter(a => a.status === 'OPERATIVE');

      return {
        text: `🚜 **Resumen de Parque de Equipos (#flota-activos):**\nDisponibilidad de Flota: **${operativeAssets.length} Operativos** vs **${maintenanceAssets.length} en Mantenimiento**.\n\nEquipos en taller:\n${maintenanceAssets.length > 0 ? maintenanceAssets.map(a => `• **${a.id}**: ${a.name} (Salud: ${a.healthScore}%)`).join('\n') : '• Todos los equipos clave están operativos.'}`,
        targetTab: 'ASSETS',
        tabLabel: 'Ver Jerarquía de Activos (#flota-activos)'
      };
    }

    // Response generico inteligente
    return {
      text: `🤖 Comprendo tu consulta sobre *"${userQuery}"*. Puedo realizar análisis transaccionales de **Órdenes PM**, **Movimientos MIGO 261/101**, **Acreditaciones de Faenas Mineras** o **Telemetría de Maquinaria**.\n\nPrueba seleccionando una de las sugerencias rápidas abajo.`,
      targetTab: null
    };
  };

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResult = generateAIResponse(query);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: aiResult.text,
        targetTab: aiResult.targetTab,
        tabLabel: aiResult.tabLabel
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Drawer Panel del Chatbox */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-5 fade-in backdrop-blur-xl ring-1 ring-white/10 text-slate-100">
          
          {/* Header del Chatbox */}
          <div className="bg-gradient-to-r from-sap-blue via-blue-700 to-indigo-900 px-4 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                  Copiloto Axomira AI
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-sky-200 font-medium">Asistente Inteligente ERP 2026</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes del Chat */}
          <div className="p-4 h-80 overflow-y-auto space-y-3.5 bg-slate-950/60 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-sap-blue text-white rounded-br-none shadow-md font-medium'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none shadow'
                  }`}
                >
                  {msg.text}

                  {/* Acciones Rápidas del Bot */}
                  {msg.actionType === 'OPEN_REPORT_MODAL' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => {
                          setIsReportModalOpen(true);
                          addToast('Abriendo Generador de Reportes Ejecutivos BI...', 'success');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-between transition-colors shadow cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{msg.actionLabel || 'Generar Reporte BI'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {msg.targetTab && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => {
                          setActiveTab(msg.targetTab);
                          addToast(`Navegando a ${msg.tabLabel}`, 'info');
                        }}
                        className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white font-bold py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-between transition-colors shadow"
                      >
                        <span>{msg.tabLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>

                {/* Sugerencias iniciales si existen */}
                {msg.quickActions && (
                  <div className="grid grid-cols-1 gap-1.5 mt-3 w-full">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(qa.query)}
                        className="text-left text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all flex items-center justify-between group"
                      >
                        <span>{qa.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic bg-slate-800/60 p-2.5 rounded-xl max-w-xs border border-slate-700/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Copiloto AI analizando base de datos ERP...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta o pide un diagnóstico ERP..."
              className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sap-blue transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-sap-blue hover:bg-sap-blue-hover disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Action Button (FAB) Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative p-3.5 bg-gradient-to-r from-sap-blue via-blue-600 to-indigo-700 hover:scale-105 text-white rounded-full shadow-2xl transition-all duration-200 cursor-pointer border border-white/20 flex items-center justify-center ring-4 ring-sap-blue/20"
        title="Abrir Copiloto Axomira AI"
      >
        <div className="relative">
          <Bot className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900"></span>
        </div>

        {/* Floating Tooltip Label */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Copiloto Axomira AI
        </span>
      </button>

      {/* Modal de Generación de Reportes BI */}
      <ExecutiveReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
