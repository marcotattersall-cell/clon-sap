import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary SAP ERP] Excepción no controlada capturada:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin + '?v=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center justify-center space-x-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Excepción de Renderizado ERP</span>
              </span>
              <h2 className="text-2xl font-black text-white">
                Servicio Interrumpido Temporalmente
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema capturó un error inesperado en la interfaz. La sesión y los datos guardados en Cloud Firestore permanecen seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-sap-blue hover:bg-sap-blue-hover text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar Sesión ERP & Recargar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
