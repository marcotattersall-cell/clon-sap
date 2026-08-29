import React, { useState, useEffect } from 'react';
import {
  X,
  BellRing,
  Mail,
  Webhook,
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
  Truck,
  Users,
  Save,
  HelpCircle
} from 'lucide-react';
import {
  getNotificationConfig,
  saveNotificationConfig,
  testWebhookConnection
} from '../../services/expirationNotificationService';

export const NotificationConfigModal = ({ isOpen, onClose, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const [emails, setEmails] = useState({
    safety: '',
    fleet: '',
    hr: ''
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState('SLACK');
  const [notifyOnExpired, setNotifyOnExpired] = useState(true);
  const [notifyOn30Days, setNotifyOn30Days] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await getNotificationConfig();
      setEmails(cfg.emails || { safety: '', fleet: '', hr: '' });
      setWebhookUrl(cfg.webhookUrl || '');
      setWebhookType(cfg.webhookType || 'SLACK');
      setNotifyOnExpired(cfg.notifyOnExpired ?? true);
      setNotifyOn30Days(cfg.notifyOn30Days ?? true);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveNotificationConfig({
        emails,
        webhookUrl,
        webhookType,
        notifyOnExpired,
        notifyOn30Days
      });
      if (addToast) addToast('✅ Configuración de notificaciones guardada correctamente.', 'success');
      onClose();
    } catch (err) {
      if (addToast) addToast('❌ Error al guardar configuración: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      if (addToast) addToast('⚠️ Ingrese una URL de Webhook antes de probar.', 'warning');
      return;
    }
    setTestingWebhook(true);
    try {
      await testWebhookConnection(webhookUrl, webhookType);
      if (addToast) addToast('✅ ¡Prueba de Webhook Exitosa! Mensaje enviado correctamente.', 'success');
    } catch (err) {
      if (addToast) addToast('❌ Fallo al probar Webhook: ' + err.message, 'error');
    } finally {
      setTestingWebhook(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Canales & Alertas de Vencimiento</h3>
              <p className="text-xs text-slate-400">Configuración de notificaciones automáticas por correo y webhooks corporativos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Email Receivers */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Mail className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                1. Destinatarios de Correo Corporativo
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center">
                  <Shield className="w-3 h-3 mr-1 text-emerald-600" /> Prevención & Seguridad
                </label>
                <input
                  type="email"
                  value={emails.safety}
                  onChange={(e) => setEmails({ ...emails, safety: e.target.value })}
                  placeholder="prevencion@empresa.cl"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center">
                  <Truck className="w-3 h-3 mr-1 text-sky-600" /> Encargado de Flota
                </label>
                <input
                  type="email"
                  value={emails.fleet}
                  onChange={(e) => setEmails({ ...emails, fleet: e.target.value })}
                  placeholder="flota@empresa.cl"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center">
                  <Users className="w-3 h-3 mr-1 text-amber-600" /> Jefatura HCM / Personal
                </label>
                <input
                  type="email"
                  value={emails.hr}
                  onChange={(e) => setEmails({ ...emails, hr: e.target.value })}
                  placeholder="rrhh@empresa.cl"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Webhook Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Webhook className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Webhook Corporativo (Slack, Teams, Discord, Zapier)
              </h4>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Tipo de Servicio</label>
                  <select
                    value={webhookType}
                    onChange={(e) => setWebhookType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="SLACK">Slack Incoming Webhook</option>
                    <option value="TEAMS">Microsoft Teams Connector</option>
                    <option value="GENERIC">JSON Standard HTTP POST</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">URL Endpoint de Webhook</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T00/B00/XXXXX"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-600 focus:bg-white transition-all font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Pruebe la integración de Webhook antes de guardar las notificaciones automáticas.</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-bounce' : ''}`} />
                  <span>{testingWebhook ? 'Probando...' : 'Probar Webhook'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Rules & Thresholds */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                3. Reglas de Despacho & Umbrales
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 bg-rose-50/50 border border-rose-200 rounded-2xl cursor-pointer hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyOnExpired}
                  onChange={(e) => setNotifyOnExpired(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500"
                />
                <div className="text-xs">
                  <div className="font-extrabold text-rose-900">Notificar Documentos Vencidos (Críticos)</div>
                  <div className="text-[11px] text-rose-700">Envío prioritario cuando existan licencias, SOAP o exámene vencidos.</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyOn30Days}
                  onChange={(e) => setNotifyOn30Days(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-extrabold text-amber-900">Notificar Alertas Próximas (≤30 Días)</div>
                  <div className="text-[11px] text-amber-700">Aviso preventivo para gestión de renovación a tiempo.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
