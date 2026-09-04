import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Sliders, 
  FileText, 
  AlertTriangle, 
  History,
  Lock,
  Boxes,
  Wrench,
  ShoppingBag
} from 'lucide-react';
import { 
  getPendingApprovals, 
  approveTransaction, 
  rejectTransaction, 
  getApprovalThresholds, 
  updateApprovalThresholds,
  getThresholdAuditLogs 
} from '../../services/approvalWorkflowService';
import { hasPermission } from '../../utils/rbacRules';

export default function ApprovalInboxModal({ isOpen, onClose, user, tenantId = 'tenant_demo', onWorkflowUpdated }) {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'thresholds' | 'audit'
  const [comment, setComment] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Estado local para configuración de umbrales
  const currentThresholds = getApprovalThresholds(tenantId);
  const [thresholdForm, setThresholdForm] = useState({
    migo: currentThresholds.migo,
    workOrder: currentThresholds.workOrder,
    purchaseOrder: currentThresholds.purchaseOrder
  });

  if (!isOpen) return null;

  const userRole = user?.role || 'ADMINISTRATOR';
  const pendingList = getPendingApprovals(tenantId);
  const auditLogs = getThresholdAuditLogs(tenantId);
  const canConfigThresholds = hasPermission(userRole, 'WORKFLOW_CONFIG_THRESHOLDS') || userRole === 'ADMINISTRATOR';
  const canApprove = hasPermission(userRole, 'WORKFLOW_APPROVE_HIGH_VALUE');

  const handleApprove = (reqId) => {
    try {
      approveTransaction(reqId, user, comment || 'Aprobación autorizada desde Fiori Inbox ME28');
      setComment('');
      setSelectedRequestId(null);
      setFeedbackMsg({ type: 'success', text: `✅ Solicitud ${reqId} aprobada y liberada exitosamente.` });
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleReject = (reqId) => {
    try {
      rejectTransaction(reqId, user, comment || 'Rechazado por exceso de presupuesto');
      setComment('');
      setSelectedRequestId(null);
      setFeedbackMsg({ type: 'error', text: `⛔ Solicitud ${reqId} rechazada.` });
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    try {
      updateApprovalThresholds(tenantId, thresholdForm, user);
      setFeedbackMsg({ type: 'success', text: '⚡ Umbrales financieros actualizados correctamente por el Administrador General.' });
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'MIGO': return <Boxes className="w-5 h-5 text-amber-500" />;
      case 'WORK_ORDER': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'PURCHASE_ORDER': return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Fiori Stealth */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Centro de Liberación y Aprobaciones ERP (ME28)
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {tenantId}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Control de Estrategia de Liberación de Órdenes, Salidas de Almacén MIGO y Compras
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className={`px-6 py-2 text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="underline hover:text-white">Cerrar</button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'inbox' 
                ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Solicitudes Pendientes
            {pendingList.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('thresholds')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'thresholds' 
                ? 'border-purple-500 text-purple-400 bg-purple-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Umbrales Financieros
            {!canConfigThresholds && <Lock className="w-3.5 h-3.5 text-slate-500 ml-1" />}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'audit' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Bitácora de Auditoría ({auditLogs.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: PENDING INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              {pendingList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto" />
                  <p className="text-sm font-medium">No hay solicitudes de liberación pendientes en este momento.</p>
                  <p className="text-xs text-slate-500">Todas las transacciones de alto valor han sido procesadas o están dentro de los umbrales autorizados.</p>
                </div>
              ) : (
                pendingList.map(req => (
                  <div 
                    key={req.id}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedRequestId === req.id 
                        ? 'bg-slate-800/90 border-blue-500/50 ring-1 ring-blue-500/30' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                          {getTypeIcon(req.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-blue-400">{req.id}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                              {req.type}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Ref: {req.referenceId}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{req.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Solicitado por: <span className="text-slate-200 font-medium">{req.requestedBy}</span> • {new Date(req.requestedAt).toLocaleString('es-CL')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-400 font-mono">
                          ${req.totalCost.toLocaleString('es-CL')} USD
                        </div>
                        <div className="text-[11px] text-amber-400/90 flex items-center justify-end gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          Excede Umbral (${req.thresholdLimit.toLocaleString('es-CL')} USD)
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    {canApprove ? (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Comentario o justificación de aprobación/rechazo..."
                          value={selectedRequestId === req.id ? comment : ''}
                          onChange={(e) => {
                            setSelectedRequestId(req.id);
                            setComment(e.target.value);
                          }}
                          className="w-full sm:flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />

                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobar / Liberar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-amber-400/80 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                        🔒 Tu rol actual ({userRole}) no posee atribución para liberar esta transacción. Requiere aprobación de Jefe de Mantenimiento o Administrador General.
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: THRESHOLDS CONFIGURATION (ADMIN ONLY) */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              {!canConfigThresholds ? (
                <div className="p-6 bg-slate-950 border border-rose-900/50 rounded-xl text-center space-y-3">
                  <Lock className="w-10 h-10 text-rose-500 mx-auto" />
                  <h3 className="text-base font-bold text-rose-300">Acceso Restringido por RBAC</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    La modificación de umbrales financieros de estrategia de liberación es un privilegio exclusivo del 
                    <span className="font-bold text-white"> Administrador General (SU01 / ADMINISTRATOR)</span>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveThresholds} className="space-y-5 bg-slate-950 p-5 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-purple-400" />
                        Configuración Dinámica de Umbrales Financieros
                      </h3>
                      <p className="text-xs text-slate-400">
                        Define los límites a partir de los cuales una transacción requerirá aprobación jerárquica.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
                      Rol: {userRole}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* MIGO Threshold */}
                    <div className="space-y-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4" />
                        Salidas MIGO (261 / 101)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={thresholdForm.migo}
                          onChange={(e) => setThresholdForm({ ...thresholdForm, migo: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">Monto máx. sin requerir liberación de almacén.</p>
                    </div>

                    {/* Work Order Threshold */}
                    <div className="space-y-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4" />
                        Órdenes de Trabajo (IW31)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={thresholdForm.workOrder}
                          onChange={(e) => setThresholdForm({ ...thresholdForm, workOrder: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">Costo planificado máx. sin retención PM.</p>
                    </div>

                    {/* Purchase Order Threshold */}
                    <div className="space-y-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
                      <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        Pedidos de Compra (PO)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={thresholdForm.purchaseOrder}
                          onChange={(e) => setThresholdForm({ ...thresholdForm, purchaseOrder: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">Total compra máx. sin firma directiva.</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/30 transition-all flex items-center gap-2"
                    >
                      <Sliders className="w-4 h-4" />
                      Guardar Nuevos Umbrales Financieros
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No se registran cambios de umbrales recientes para este tenant.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                      <span className="font-mono text-purple-400 font-bold">{log.id}</span>
                      <span>{new Date(log.timestamp).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="text-slate-300">
                      Modificado por: <span className="font-semibold text-white">{log.modifiedBy}</span> ({log.userRole})
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800/60">
                      <div>MIGO: <span className="text-emerald-400">${log.newThresholds.migo}</span> <span className="text-slate-500">(${log.previousThresholds.migo})</span></div>
                      <div>OT: <span className="text-emerald-400">${log.newThresholds.workOrder}</span> <span className="text-slate-500">(${log.previousThresholds.workOrder})</span></div>
                      <div>PO: <span className="text-emerald-400">${log.newThresholds.purchaseOrder}</span> <span className="text-slate-500">(${log.previousThresholds.purchaseOrder})</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Axomira Cloud ERP • Control de Liberaciones SAP ME28</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
}
