import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeCollection,
  upsertDocument,
  deleteDocument,
  seedCollectionIfEmpty,
  executeAtomicGoodsMovement,
  recordAuditLog,
  DEFAULT_TENANT_ID
} from '../services/dbService';
import {
  DEFAULT_PLANTS,
  DEFAULT_MATERIALS,
  DEFAULT_ASSETS,
  DEFAULT_WORK_ORDERS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PURCHASE_ORDERS,
  DEFAULT_MIGO_DOCUMENTS,
  DEFAULT_EMPLOYEES,
  DEFAULT_ABSENCES,
  DEFAULT_PAYROLL_RUNS
} from '../fixtures/sapInitialFixtures';

const SAPContext = createContext(null);

export const SAPProvider = ({ children }) => {
  const { user } = useAuth();
  const activeTenantId = user?.tenantId || DEFAULT_TENANT_ID;

  const [plants, setPlants] = useState(DEFAULT_PLANTS);
  const [activePlant, setActivePlant] = useState(DEFAULT_PLANTS[0]);

  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [workOrders, setWorkOrders] = useState(DEFAULT_WORK_ORDERS);
  const [purchaseOrders, setPurchaseOrders] = useState(DEFAULT_PURCHASE_ORDERS);
  const [migoDocuments, setMigoDocuments] = useState(DEFAULT_MIGO_DOCUMENTS);
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [absences, setAbsences] = useState(DEFAULT_ABSENCES);
  const [payrollRuns, setPayrollRuns] = useState(DEFAULT_PAYROLL_RUNS);
  const [auditLogs, setAuditLogs] = useState([]);

  const [currentRole, setCurrentRole] = useState('MAINTENANCE_MGR');
  const [themeMode, setThemeMode] = useState('light');
  const [activeTab, setActiveTab] = useState('LAUNCHPAD');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalToasts, setGlobalToasts] = useState([]);
  const [tecoModalData, setTecoModalData] = useState(null);

  // Generador de Simulación Masiva en Vivo (Transacciones Instantáneas ERP)
  const injectMassiveActionSimulation = () => {
    // 1. Inyectar Órdenes de Trabajo PM
    const newWOs = Array.from({ length: 10 }, (_, i) => ({
      id: `WO-9001${i + 10}`,
      title: `Intervención de Emergencia N° ${i + 1} - Sistema Hidráulico Planta`,
      type: i % 2 === 0 ? 'PM01' : 'PM02',
      priority: i % 3 === 0 ? 'Muy Alta' : 'Alta',
      status: i % 2 === 0 ? 'REL' : 'CRTE',
      equipmentId: `EQ-10${(i % 4) + 1}`,
      costCenter: `CC-4${(i % 3) + 1}00`,
      assignedTech: i % 2 === 0 ? 'Jorge Silva San Martín' : 'Carlos Mendoza Morales',
      plannedHours: 8.0,
      actualHours: 4.0,
      plannedCost: 1500.00,
      actualCost: 950.00,
      hourmeter: 4500 + i * 50,
      startDate: '2026-08-23',
      targetFinishDate: '2026-08-25',
      operations: [
        { id: 1, text: 'Inspección de presión con manómetro J1939', duration: 2.0, assigned: 'Técnico Terreno', status: 'In Progress' }
      ],
      components: [],
      logs: []
    }));

    // 2. Inyectar Movimientos MIGO
    const newMigoDocs = Array.from({ length: 15 }, (_, i) => ({
      documentId: `MIGO-5009${10 + i}`,
      year: '2026',
      movementType: i % 2 === 0 ? '261' : '101',
      typeLabel: i % 2 === 0 ? 'Salida para Orden de Trabajo (261)' : 'Entrada por Pedido PO (101)',
      materialId: `MAT-100${(i % 5) + 1}`,
      materialName: `Material Repuesto Especializado N° ${i + 1}`,
      qty: (i + 1) * 5,
      unit: 'UN',
      storageLocation: 'ALM-01',
      targetStorageLocation: 'N/A',
      refDocument: `WO-9001${i + 10}`,
      timestamp: new Date().toLocaleTimeString(),
      user: 'J. SILVA (PM)',
      costCenter: 'CC-4100'
    }));

    setWorkOrders(prev => [...newWOs, ...prev]);
    setMigoDocuments(prev => [...newMigoDocs, ...prev]);

    addToast('⚡ 25 Transacciones de Mantenimiento (PM) y Almacén (MM) inyectadas en vivo.', 'success');
  };

  // Real-Time Subscriptions & Dynamic Sync per Tenant
  useEffect(() => {
    // Auto-seeding predeterminado
    seedCollectionIfEmpty('plants', DEFAULT_PLANTS, activeTenantId);
    seedCollectionIfEmpty('materials', DEFAULT_MATERIALS, activeTenantId);
    seedCollectionIfEmpty('assets', DEFAULT_ASSETS, activeTenantId);
    seedCollectionIfEmpty('notifications', DEFAULT_NOTIFICATIONS, activeTenantId);
    seedCollectionIfEmpty('workOrders', DEFAULT_WORK_ORDERS, activeTenantId);
    seedCollectionIfEmpty('purchaseOrders', DEFAULT_PURCHASE_ORDERS, activeTenantId);
    seedCollectionIfEmpty('migoDocuments', DEFAULT_MIGO_DOCUMENTS, activeTenantId);
    seedCollectionIfEmpty('employees', DEFAULT_EMPLOYEES, activeTenantId);
    seedCollectionIfEmpty('absences', DEFAULT_ABSENCES, activeTenantId);
    seedCollectionIfEmpty('payrollRuns', DEFAULT_PAYROLL_RUNS, activeTenantId);

    // 2. Real-Time Snapshot Listeners por Tenant
    const unsubPlants = subscribeCollection('plants', (items) => {
      if (Array.isArray(items)) setPlants(items.length > 0 ? items : []);
    }, null, [], activeTenantId);

    const unsubMaterials = subscribeCollection('materials', (items) => {
      if (Array.isArray(items)) setMaterials(items);
    }, null, [], activeTenantId);

    const unsubAssets = subscribeCollection('assets', (items) => {
      if (Array.isArray(items)) setAssets(items);
    }, null, [], activeTenantId);

    const unsubNotifs = subscribeCollection('notifications', (items) => {
      if (Array.isArray(items)) setNotifications(items);
    }, null, [], activeTenantId);

    const unsubWorkOrders = subscribeCollection('workOrders', (items) => {
      if (Array.isArray(items)) {
        const formatted = items.map(wo => ({
          ...wo,
          operations: Array.isArray(wo.operations) ? wo.operations : [],
          components: Array.isArray(wo.components) ? wo.components : [],
          logs: Array.isArray(wo.logs) ? wo.logs : []
        }));
        setWorkOrders(formatted);
      }
    }, null, [], activeTenantId);

    const unsubPO = subscribeCollection('purchaseOrders', (items) => {
      if (Array.isArray(items)) setPurchaseOrders(items);
    }, null, [], activeTenantId);

    const unsubMigo = subscribeCollection('migoDocuments', (items) => {
      if (Array.isArray(items)) setMigoDocuments(items);
    }, null, [], activeTenantId);

    const unsubEmployees = subscribeCollection('employees', (items) => {
      if (Array.isArray(items)) setEmployees(items);
    }, null, [], activeTenantId);

    const unsubAbsences = subscribeCollection('absences', (items) => {
      if (Array.isArray(items)) setAbsences(items);
    }, null, [], activeTenantId);

    const unsubPayroll = subscribeCollection('payrollRuns', (items) => {
      if (Array.isArray(items)) setPayrollRuns(items);
    }, null, [], activeTenantId);

    const unsubAudit = subscribeCollection('auditLogs', (items) => {
      if (Array.isArray(items)) setAuditLogs(items);
    }, null, [], activeTenantId);

    return () => {
      unsubPlants();
      unsubMaterials();
      unsubAssets();
      unsubNotifs();
      unsubWorkOrders();
      unsubPO();
      unsubMigo();
      unsubEmployees();
      unsubAbsences();
      unsubPayroll();
      unsubAudit();
    };
  }, [activeTenantId]);

  // Optimized Toast Helper with useCallback
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setGlobalToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setGlobalToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // MIGO Goods Movement Transaction engine (Types 101, 261, 311)
  const executeGoodsMovement = async ({ movementType, materialId, qty, storageLocation, targetStorageLocation, refDocument, notes }) => {
    const quantity = Number(qty);
    if (!materialId || isNaN(quantity) || quantity <= 0) {
      addToast('Error en MIGO: Debe especificar un material y una cantidad válida.', 'error');
      return false;
    }

    const material = materials.find(m => m.id === materialId);
    if (!material) {
      addToast(`Material ${materialId} no encontrado en Maestro de Materiales.`, 'error');
      return false;
    }

    if ((movementType === '261' || movementType === '311') && material.stock < quantity) {
      addToast(`Stock Insuficiente MIGO! Stock actual: ${material.stock} ${material.unit}, Solicitado: ${quantity}`, 'error');
      return false;
    }

    try {
      const newMigoDoc = await executeAtomicGoodsMovement({
        movementType,
        materialId,
        qty: quantity,
        storageLocation,
        targetStorageLocation,
        refDocument,
        currentUser: null
      });

      if (newMigoDoc) {
        setMigoDocuments(prev => [newMigoDoc, ...prev]);

        // Actualización optimista de Stock en Maestro de Materiales
        setMaterials(prev => prev.map(m => {
          if (m.id === materialId) {
            const newStock = movementType === '101' ? m.stock + quantity : Math.max(0, m.stock - quantity);
            return { ...m, stock: newStock };
          }
          return m;
        }));

        // Actualización de componentes y costos en la Orden de Trabajo si es MIGO 261
        if (movementType === '261' && refDocument) {
          setWorkOrders(prev => prev.map(w => {
            if (w.id === refDocument) {
              const comps = Array.isArray(w.components) ? [...w.components] : [];
              const idx = comps.findIndex(c => c.materialId === materialId);
              if (idx >= 0) {
                comps[idx] = { ...comps[idx], qtyIssued: Number(comps[idx].qtyIssued || 0) + quantity };
              } else {
                comps.push({
                  materialId,
                  description: material.name,
                  qtyPlanned: quantity,
                  qtyIssued: quantity,
                  unit: material.unit,
                  unitPrice: material.unitPrice || 100
                });
              }
              const addCost = quantity * Number(material.unitPrice || 0);
              return { ...w, components: comps, actualCost: Number(w.actualCost || 0) + addCost };
            }
            return w;
          }));
        }

        addToast(`✅ Documento MIGO ${newMigoDoc.documentId} contabilizado atómicamente en Cloud Firestore.`, 'success');
        return true;
      }
    } catch (err) {
      console.error('[MIGO Atomic Execution Error]', err);
      addToast(`Falla Transaccional MIGO: ${err.message || 'Error al procesar la transacción atómica.'}`, 'error');
      return false;
    }
  };

  // Work Order Status Update & Workflow Audit Traceability
  const updateWorkOrderStatus = (woId, newStatus, userName = 'Marco Vidal (Especialista PM)', comment = '') => {
    const wo = workOrders.find(w => w.id === woId);
    if (!wo) return;

    const timestamp = new Date().toLocaleString('es-CL');
    const prevStatus = wo.status;
    const noteText = comment
      ? `Transición de Estado: [${prevStatus}] ➔ [${newStatus}]. Motivo: ${comment}`
      : `Transición de Estado: [${prevStatus}] ➔ [${newStatus}]`;

    const newLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp,
      user: userName,
      previousStatus: prevStatus,
      newStatus: newStatus,
      text: noteText,
      comment: comment || 'Actualización de flujo de trabajo PM'
    };

    const updatedWO = {
      ...wo,
      status: newStatus,
      lastUpdated: timestamp,
      lastUpdatedBy: userName,
      logs: [...(wo.logs || []), newLogEntry]
    };

    setWorkOrders(prev => prev.map(w => w.id === woId ? updatedWO : w));
    upsertDocument('workOrders', woId, updatedWO);

    if (newStatus === 'TECO' || newStatus === 'CLSD') {
      setTecoModalData({
        woId,
        equipmentId: wo.equipmentId || 'EQ-GENERAL',
        title: wo.title || 'Mantenimiento de Equipo',
        user: userName,
        timestamp,
        comment: comment || 'Trabajos técnicos de mantenimiento finalizados con éxito en terreno.',
        status: newStatus,
        plannedCost: wo.plannedCost || 300,
        actualCost: wo.actualCost || wo.plannedCost || 300
      });
      addToast(`🛡️ Cierre Técnico Certificado (TECO): Orden ${woId} auditada con éxito por ${userName}.`, 'success');
    } else {
      addToast(`Estado de OT ${woId} actualizado a [${newStatus}] por ${userName}.`, 'info');
    }
  };

  // Issue Material Component to Work Order
  const issueComponentToWorkOrder = (woId, materialId, qty) => {
    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) {
      addToast(`❌ Cantidad de repuesto a consumir inválida. Debe ser un número mayor a 0.`, 'error');
      return false;
    }
    const wo = workOrders.find(w => w.id === woId);
    if (!wo) return false;

    const success = executeGoodsMovement({
      movementType: '261',
      materialId,
      qty: quantity,
      refDocument: woId
    });
    return success;
  };

  // Create Work Order
  const createWorkOrder = (newWO) => {
    // ⛔ IW31-E001: El equipo debe existir en la base de datos de Activos (IE03)
    const targetAssetExists = (assets || []).some(a => {
      if (!newWO.equipmentId) return false;
      const searchStr = newWO.equipmentId.toLowerCase().trim();
      const idClean = (a.id || '').toLowerCase().trim();
      const nameClean = (a.name || '').toLowerCase().trim();
      const plateClean = (a.plate || '').toLowerCase().trim();
      return idClean === searchStr || nameClean === searchStr || plateClean === searchStr || idClean.includes(searchStr) || searchStr.includes(idClean);
    });
    if (!newWO.equipmentId || !targetAssetExists) {
      addToast(`❌ [IW31-E001] Equipo "${newWO.equipmentId || 'Sin código'}" no existe en IE03.`, 'error');
      return false;
    }

    // ⛔ IW31-E002: El técnico responsable debe existir en el Maestro de Personal HCM (employees)
    const assignedTechName = (newWO.assignedTech || '').trim();
    const targetTechExists = employees.some(e =>
      e.name.toLowerCase().trim() === assignedTechName.toLowerCase() ||
      e.id.toLowerCase().trim() === assignedTechName.toLowerCase() ||
      assignedTechName.toLowerCase().includes(e.name.toLowerCase().trim()) ||
      e.name.toLowerCase().trim().includes(assignedTechName.toLowerCase())
    );
    if (!assignedTechName || !targetTechExists) {
      addToast(`❌ [IW31-E002] Técnico "${assignedTechName || 'Sin asignar'}" no registrado en HCM.`, 'error');
      return false;
    }

    // ⛔ IW31-E005: Reserva obligatoria de repuesto MM
    const hasReservedMaterial =
      (newWO.components && newWO.components.length > 0) ||
      (newWO.plannedComponents && newWO.plannedComponents.length > 0) ||
      newWO.plannedMaterialId;
    if (!hasReservedMaterial) {
      addToast(`❌ [IW31-E005] Reserva de repuestos MM es obligatoria. Seleccione un material para pre-reservar stock.`, 'error');
      return false;
    }

    const prevEqWOs = workOrders.filter(w => w.equipmentId === newWO.equipmentId);
    const lastHourmeter = prevEqWOs.reduce((max, w) => (w.hourmeter && Number(w.hourmeter) > max ? Number(w.hourmeter) : max), 0);
    const lastOdometer = prevEqWOs.reduce((max, w) => (w.odometer && Number(w.odometer) > max ? Number(w.odometer) : max), 0);

    // ⛔ IW31-E004: Horómetro o kilometraje menor a lectura previa
    if (!newWO.isCounterCorrection && newWO.hourmeter && lastHourmeter > 0 && Number(newWO.hourmeter) < lastHourmeter) {
      addToast(`❌ [IW31-E004] Horómetro (${newWO.hourmeter} hrs) menor al registro previo (${lastHourmeter} hrs).`, 'error');
      return false;
    }

    if (!newWO.isCounterCorrection && newWO.odometer && lastOdometer > 0 && Number(newWO.odometer) < lastOdometer) {
      addToast(`❌ [IW31-E004] Kilometraje (${newWO.odometer.toLocaleString()} km) menor al registro previo (${lastOdometer.toLocaleString()} km).`, 'error');
      return false;
    }

    // ⛔ IW31-E003: Orden activa duplicada
    const existingActiveWO = workOrders.find(w =>
      w.equipmentId === newWO.equipmentId &&
      w.type === newWO.type &&
      (w.status === 'CRTE' || w.status === 'REL' || w.status === 'PCNF')
    );

    if (existingActiveWO) {
      addToast(`🚫 [IW31-E003] Orden activa duplicada ${existingActiveWO.id} (${existingActiveWO.status}) para ${newWO.equipmentId}.`, 'error');
      return false;
    }

    const nextId = `WO-400${100 + workOrders.length + 1}`;
    const reservationNum = `RESB-800${100 + workOrders.length + 1}`;

    const formattedWO = {
      id: nextId,
      reservationNumber: reservationNum,
      status: 'CRTE',
      startDate: new Date().toISOString().split('T')[0],
      actualHours: 0,
      actualCost: 0,
      operations: [
        { id: 1, text: 'Inspección previa de seguridad y área de trabajo', duration: 1.0, assigned: newWO.assignedTech, status: 'Pending' },
        { id: 2, text: 'Ejecución de trabajos de mantenimiento', duration: 3.0, assigned: newWO.assignedTech, status: 'Pending' }
      ],
      components: newWO.components || [],
      logs: [
        { timestamp: new Date().toLocaleString('es-CL'), user: 'OPERADOR SISTEMA', text: `Orden ${nextId} creada con Reserva de Almacén ${reservationNum}.` }
      ],
      ...newWO
    };

    setWorkOrders(prev => [formattedWO, ...prev]);
    upsertDocument('workOrders', nextId, formattedWO);

    // Update asset counters & track corrections if applicable
    if (newWO.equipmentId && (newWO.hourmeter || newWO.odometer)) {
      setAssets(prev => prev.map(a => {
        if (a.id === newWO.equipmentId) {
          const currentLogs = Array.isArray(a.counterAuditLogs) ? a.counterAuditLogs : [];
          const currentCount = Number(a.counterCorrectionCount) || 0;
          const isCorrection = newWO.isCounterCorrection;

          const updatedLog = isCorrection ? [{
            id: `LOG-CORR-${Date.now()}`,
            timestamp: new Date().toLocaleString('es-CL'),
            user: newWO.assignedTech || 'Especialista PM',
            reason: newWO.correctionReason || 'Ajuste por error de digitación previo',
            previousHourmeter: lastHourmeter,
            newHourmeter: newWO.hourmeter || a.hourmeter,
            previousOdometer: lastOdometer,
            newOdometer: newWO.odometer || a.odometer,
            orderId: nextId
          }, ...currentLogs] : currentLogs;

          const updatedAsset = {
            ...a,
            hourmeter: newWO.hourmeter || a.hourmeter,
            odometer: newWO.odometer || a.odometer,
            counterCorrectionCount: isCorrection ? currentCount + 1 : currentCount,
            counterAuditLogs: updatedLog
          };
          upsertDocument('assets', a.id, updatedAsset);
          return updatedAsset;
        }
        return a;
      }));
    }

    addToast(`✅ Nueva Orden de Trabajo ${nextId} guardada con éxito con Reserva Almacén ${reservationNum}.`, 'success');
    return true;
  };

  // Delete Work Order
  const deleteWorkOrder = (woId) => {
    const wo = workOrders.find(w => w.id === woId);
    setWorkOrders(prev => prev.filter(w => w.id !== woId));
    deleteDocument('workOrders', woId);
    recordAuditLog({
      entityType: 'WORK_ORDER',
      entityId: woId,
      action: 'DELETE_WORK_ORDER',
      details: `Orden de Trabajo ${woId} (${wo?.title || ''}) eliminada del sistema.`,
      user: 'Especialista PM'
    });
    addToast(`🗑️ Orden de Trabajo ${woId} eliminada correctamente del sistema.`, 'info');
    return true;
  };

  // Add new Material
  const createMaterial = (newMat) => {
    const id = newMat.id || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedMat = {
      ...newMat,
      id,
      stock: Number(newMat.stock) || 0,
      reorderPoint: Number(newMat.reorderPoint) || 10,
      safetyStock: Number(newMat.safetyStock) || 5,
      unitPrice: Number(newMat.unitPrice) || 10.0,
      lastMovement: new Date().toISOString().split('T')[0]
    };
    setMaterials(prev => [formattedMat, ...prev]);
    upsertDocument('materials', id, formattedMat);
    addToast(`✅ Material ${formattedMat.id} (${formattedMat.name}) guardado con éxito en Maestro de Materiales.`, 'success');
    return formattedMat;
  };

  // Update Material
  const updateMaterial = (matId, updatedFields) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return false;
    const updatedMat = { ...mat, ...updatedFields };
    setMaterials(prev => prev.map(m => m.id === matId ? updatedMat : m));
    upsertDocument('materials', matId, updatedMat);
    addToast(`✏️ Material ${matId} (${updatedMat.name}) modificado con éxito.`, 'success');
    return true;
  };

  // Delete Material
  const deleteMaterial = (matId) => {
    const mat = materials.find(m => m.id === matId);
    setMaterials(prev => prev.filter(m => m.id !== matId));
    deleteDocument('materials', matId);
    recordAuditLog({
      entityType: 'MATERIAL_MASTER',
      entityId: matId,
      action: 'DELETE_MATERIAL',
      details: `Material ${matId} (${mat?.name || ''}) eliminado del sistema.`,
      user: 'Especialista MM'
    });
    addToast(`🗑️ Material ${matId} (${mat?.name || ''}) eliminado correctamente del maestro.`, 'info');
    return true;
  };

  // Delete Employee
  const deleteEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId);
    setEmployees(prev => prev.filter(e => e.id !== empId));
    deleteDocument('employees', empId);
    recordAuditLog({
      entityType: 'EMPLOYEE_MASTER',
      entityId: empId,
      action: 'DELETE_EMPLOYEE',
      details: `Ficha de colaborador ${empId} (${emp?.name || ''}) eliminada del sistema.`,
      user: 'Especialista HCM'
    });
    addToast(`🗑️ Ficha de colaborador ${empId} (${emp?.name || ''}) eliminada correctamente.`, 'info');
    return true;
  };

  // Delete Asset / Equipment
  const deleteAsset = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    setAssets(prev => prev.filter(a => a.id !== assetId));
    deleteDocument('assets', assetId);
    recordAuditLog({
      entityType: 'ASSET_MASTER',
      entityId: assetId,
      action: 'DELETE_ASSET',
      details: `Equipo/Vehículo ${assetId} (${asset?.name || ''}) eliminado de la flota.`,
      user: 'Especialista PM/Flota'
    });
    addToast(`🗑️ Equipo/Vehículo ${assetId} (${asset?.name || ''}) eliminado correctamente de la flota.`, 'info');
    return true;
  };

  // Delete Notification
  const deleteNotification = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    deleteDocument('notifications', notifId);
    addToast(`🗑️ Aviso de Mantenimiento ${notifId} eliminado correctamente.`, 'info');
    return true;
  };

  // Add new Notification
  const createNotification = (newNotif) => {
    const nextId = `NOT-2026-00${notifications.length + 1}`;
    const formatted = {
      id: nextId,
      status: 'Nuevo',
      createdDate: new Date().toLocaleString('es-CL'),
      ...newNotif
    };
    setNotifications(prev => [formatted, ...prev]);
    upsertDocument('notifications', nextId, formatted);
    addToast(`✅ Aviso de Mantenimiento ${nextId} guardado con éxito.`, 'success');
  };

  // Convert Notification to Work Order
  const convertNotificationToWO = (notifId) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    const nextWOId = `WO-400${100 + workOrders.length + 1}`;

    createWorkOrder({
      id: nextWOId,
      title: `[OT por Aviso ${notif.id}] ${notif.title}`,
      type: notif.type === 'M1' ? 'PM01' : 'PM02',
      priority: notif.priority,
      equipmentId: notif.equipmentId,
      assignedTech: 'Asignación Automática',
      plannedHours: 4.0,
      plannedCost: 250.00,
      refNotificationId: notifId
    });

    const updatedNotif = { ...notif, status: `Convertido a OT (${nextWOId})`, linkedWOId: nextWOId };
    setNotifications(prev => prev.map(n => n.id === notifId ? updatedNotif : n));
    upsertDocument('notifications', notifId, updatedNotif);
    addToast(`🔗 Aviso ${notifId} vinculado y convertido a la Orden ${nextWOId}.`, 'success');
  };

  // Add new Asset / Fleet Equipment
  const createAsset = (newAsset) => {
    const nextId = newAsset.id || `EQ-${100 + assets.length + 1}`;
    const formattedAsset = {
      id: nextId,
      name: newAsset.name,
      category: newAsset.category || 'Maquinaria Pesada',
      location: newAsset.location || 'Planta Central',
      functionalLocation: newAsset.functionalLocation || 'PLANT-01-SECTOR-A',
      status: newAsset.status || 'OPERATIVE',
      healthScore: Number(newAsset.healthScore || 100),
      healthIndex: Number(newAsset.healthScore || 100),
      hourmeter: Number(newAsset.hourmeter || 0),
      odometer: Number(newAsset.odometer || 0),
      baseHourmeter: Number(newAsset.hourmeter || 0),
      baseOdometer: Number(newAsset.odometer || 0),
      model: newAsset.model || 'Modelo Estándar',
      serialNumber: newAsset.serialNumber || `SN-${Date.now()}`,
      operator: newAsset.operator || 'Operador Asignado',
      plate: newAsset.plate || nextId,
      costCenter: newAsset.costCenter || 'CC-4100'
    };

    setAssets(prev => [formattedAsset, ...prev]);
    upsertDocument('assets', nextId, formattedAsset);
    addToast(`Nuevo equipo ${nextId} (${formattedAsset.name}) ingresado a la flota con éxito!`, 'success');
    return formattedAsset;
  };

  // Update Existing Asset Record (IE02 - Modificación de Equipo)
  const updateAsset = (assetId, updatedFields) => {
    const existing = assets.find(a => a.id === assetId);
    if (!existing) return false;

    const mergedAsset = {
      ...existing,
      ...updatedFields,
      id: assetId,
      name: updatedFields.name !== undefined ? updatedFields.name : existing.name,
      status: updatedFields.status !== undefined ? updatedFields.status : existing.status,
      category: updatedFields.category !== undefined ? updatedFields.category : existing.category,
      location: updatedFields.location !== undefined ? updatedFields.location : existing.location,
      functionalLocation: updatedFields.functionalLocation !== undefined ? updatedFields.functionalLocation : existing.functionalLocation,
      hourmeter: updatedFields.hourmeter !== undefined ? Number(updatedFields.hourmeter) : existing.hourmeter,
      odometer: updatedFields.odometer !== undefined ? Number(updatedFields.odometer) : existing.odometer,
      healthScore: updatedFields.healthScore !== undefined ? Number(updatedFields.healthScore) : (existing.healthScore || 100),
      healthIndex: updatedFields.healthScore !== undefined ? Number(updatedFields.healthScore) : (existing.healthIndex || 100),
      model: updatedFields.model !== undefined ? updatedFields.model : existing.model,
      serialNumber: updatedFields.serialNumber !== undefined ? updatedFields.serialNumber : existing.serialNumber,
      operator: updatedFields.operator !== undefined ? updatedFields.operator : existing.operator,
      plate: updatedFields.plate !== undefined ? updatedFields.plate : existing.plate,
      costCenter: updatedFields.costCenter !== undefined ? updatedFields.costCenter : existing.costCenter
    };

    setAssets(prev => prev.map(a => a.id === assetId ? mergedAsset : a));
    upsertDocument('assets', assetId, mergedAsset);
    recordAuditLog({
      entityType: 'ASSET_MASTER',
      entityId: assetId,
      action: 'UPDATE_ASSET_RECORD_IE02',
      details: `Equipo ${assetId} (${mergedAsset.name}) modificado en Maestro IE02.`,
      user: 'Especialista PM'
    });
    addToast(`✅ Equipo ${assetId} (${mergedAsset.name}) actualizado con éxito en Maestro IE02.`, 'success');
    return mergedAsset;
  };

  // Add new Plant Center
  const createPlant = (newPlant) => {
    const nextCode = newPlant.id || `000${plants.length + 1}`;
    const formattedPlant = {
      id: nextCode,
      name: newPlant.name || `Planta ${nextCode}`,
      address: newPlant.address || 'Av. Industrial Sin Número',
      city: newPlant.city || 'Santiago',
      status: 'Activo'
    };

    setPlants(prev => [...prev, formattedPlant]);
    setActivePlant(formattedPlant);
    upsertDocument('plants', nextCode, formattedPlant);
    addToast(`Nuevo Centro ${formattedPlant.id} (${formattedPlant.name}) creado exitosamente!`, 'success');
  };

  // HCM: Create New Employee (PA30)
  const createEmployee = (newEmp) => {
    const nextId = newEmp.id || `EMP-${1000 + employees.length + 1}`;
    const initialFaenas = newEmp.faenasAccredited && newEmp.faenasAccredited.length > 0 ? newEmp.faenasAccredited : [
      {
        id: `ACC-${nextId}-1`,
        faenaName: newEmp.faena || 'Faena Central',
        medicalExamExpiry: newEmp.medicalExamExpiry || '2027-08-01',
        accreditationExpiry: newEmp.accreditationExpiry || '2027-12-01',
        safetyCourseExpiry: newEmp.safetyCourseExpiry || '2027-10-01'
      }
    ];

    const formatted = {
      id: nextId,
      rut: newEmp.rut || '11.111.111-1',
      name: newEmp.name,
      position: newEmp.position || 'Colaborador General',
      department: newEmp.department || 'Operaciones Mina',
      plantId: newEmp.plantId || '0001',
      faena: newEmp.faena || initialFaenas[0].faenaName,
      baseSalary: Number(newEmp.baseSalary) || 1200000,
      contractType: newEmp.contractType || 'Indefinido',
      hireDate: newEmp.hireDate || new Date().toISOString().split('T')[0],
      contractExpiry: newEmp.contractType === 'Plazo Fijo' ? (newEmp.contractExpiry || '2026-12-31') : null,
      status: 'Activo',
      email: newEmp.email || `${nextId.toLowerCase()}@empresa.cl`,
      phone: newEmp.phone || '+56 9 0000 0000',
      photoUrl: newEmp.photoUrl || '',
      overtimeHours: 0,
      medicalExamExpiry: initialFaenas[0].medicalExamExpiry,
      accreditationExpiry: initialFaenas[0].accreditationExpiry,
      safetyCourseExpiry: initialFaenas[0].safetyCourseExpiry,
      faenasAccredited: initialFaenas
    };

    setEmployees(prev => [formatted, ...prev]);
    upsertDocument('employees', nextId, formatted);
    addToast(`Empleado ${nextId} (${formatted.name}) registrado en el Maestro de Personal HCM (#rrhh-personal).`, 'success');
    return true;
  };

  // HCM: Update Employee Status
  const updateEmployeeStatus = (empId, newStatus) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const updated = { ...emp, status: newStatus };
    setEmployees(prev => prev.map(e => e.id === empId ? updated : e));
    upsertDocument('employees', empId, updated);
    addToast(`Estado de empleado ${emp.name} cambiado a [${newStatus}].`, 'info');
  };

  // HCM: Update / Edit Full Employee Record (PA30)
  const updateEmployee = (empId, updatedFields) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) {
      addToast(`❌ Error: Colaborador ${empId} no encontrado.`, 'error');
      return false;
    }

    let updatedFaenas = Array.isArray(emp.faenasAccredited) && emp.faenasAccredited.length > 0
      ? [...emp.faenasAccredited]
      : [];

    if (updatedFaenas.length > 0) {
      updatedFaenas[0] = {
        ...updatedFaenas[0],
        medicalExamExpiry: updatedFields.medicalExamExpiry || updatedFaenas[0].medicalExamExpiry,
        accreditationExpiry: updatedFields.accreditationExpiry || updatedFaenas[0].accreditationExpiry,
        safetyCourseExpiry: updatedFields.safetyCourseExpiry || updatedFaenas[0].safetyCourseExpiry
      };
    }

    const updatedEmp = {
      ...emp,
      ...updatedFields,
      medicalExamExpiry: updatedFields.medicalExamExpiry || emp.medicalExamExpiry,
      accreditationExpiry: updatedFields.accreditationExpiry || emp.accreditationExpiry,
      safetyCourseExpiry: updatedFields.safetyCourseExpiry || emp.safetyCourseExpiry,
      faenasAccredited: updatedFaenas,
      baseSalary: Number(updatedFields.baseSalary) || emp.baseSalary,
      contractExpiry: updatedFields.contractType === 'Plazo Fijo' ? updatedFields.contractExpiry : null
    };

    setEmployees(prev => prev.map(e => e.id === empId ? updatedEmp : e));
    upsertDocument('employees', empId, updatedEmp);
    recordAuditLog({
      entityType: 'EMPLOYEE_MASTER',
      entityId: empId,
      action: 'UPDATE_EMPLOYEE_RECORD',
      details: `Ficha modificada para ${updatedEmp.name} (${updatedEmp.rut})`,
      user: 'Especialista HCM'
    });
    addToast(`✅ Empleado ${empId} (${updatedEmp.name}) actualizado con éxito en el Maestro HCM (#rrhh-personal).`, 'success');
    return true;
  };

  // HCM: Reseed/Reload Full Master Employees (12 Colaboradores)
  const reseedEmployees = () => {
    setEmployees(DEFAULT_EMPLOYEES);
    DEFAULT_EMPLOYEES.forEach(emp => {
      upsertDocument('employees', emp.id, emp);
    });
    addToast('✅ Se han cargado los 12 colaboradores completos en el Maestro de Personal HCM (#rrhh-personal).', 'success');
  };

  // HCM: Add New Faena Accreditation to Employee
  const addFaenaAccreditation = (employeeId, accreditationData) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return false;
    const currentAccred = emp.faenasAccredited || [];
    const newAccredObj = {
      id: `ACC-${employeeId}-${currentAccred.length + 1}`,
      faenaName: accreditationData.faenaName || 'Nueva Faena',
      medicalExamExpiry: accreditationData.medicalExamExpiry || '2027-08-01',
      accreditationExpiry: accreditationData.accreditationExpiry || '2027-12-01',
      safetyCourseExpiry: accreditationData.safetyCourseExpiry || '2027-10-01'
    };
    const updatedAccredList = [...currentAccred, newAccredObj];
    const updatedEmp = {
      ...emp,
      medicalExamExpiry: accreditationData.medicalExamExpiry || emp.medicalExamExpiry,
      accreditationExpiry: accreditationData.accreditationExpiry || emp.accreditationExpiry,
      safetyCourseExpiry: accreditationData.safetyCourseExpiry || emp.safetyCourseExpiry,
      faenasAccredited: updatedAccredList
    };
    setEmployees(prev => prev.map(e => e.id === employeeId ? updatedEmp : e));
    upsertDocument('employees', employeeId, updatedEmp);
    addToast(`✅ Nueva acreditación en faena [${newAccredObj.faenaName}] asignada a ${emp.name}.`, 'success');
    return true;
  };

  // HCM: Update Compliance / Worksite Expiration Dates
  const updateEmployeeCompliance = (employeeId, newDates, targetFaenaId = null) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return false;

    let updatedFaenas = Array.isArray(emp.faenasAccredited) && emp.faenasAccredited.length > 0
      ? emp.faenasAccredited.map(f => ({ ...f }))
      : [{
          id: 'PRIMARY',
          faenaName: emp.faena || 'Faena Principal',
          medicalExamExpiry: emp.medicalExamExpiry || '',
          accreditationExpiry: emp.accreditationExpiry || '',
          safetyCourseExpiry: emp.safetyCourseExpiry || ''
        }];

    let matched = false;
    updatedFaenas = updatedFaenas.map((f, idx) => {
      const isTarget = targetFaenaId
        ? (f.id === targetFaenaId || f.faenaName === targetFaenaId || targetFaenaId === 'PRIMARY' || targetFaenaId === 'MAIN' || idx === 0)
        : idx === 0;

      if (isTarget && !matched) {
        matched = true;
        return {
          ...f,
          medicalExamExpiry: newDates.medicalExamExpiry !== undefined ? newDates.medicalExamExpiry : f.medicalExamExpiry,
          accreditationExpiry: newDates.accreditationExpiry !== undefined ? newDates.accreditationExpiry : f.accreditationExpiry,
          safetyCourseExpiry: newDates.safetyCourseExpiry !== undefined ? newDates.safetyCourseExpiry : f.safetyCourseExpiry
        };
      }
      return f;
    });

    if (!matched && updatedFaenas.length > 0) {
      updatedFaenas[0] = {
        ...updatedFaenas[0],
        medicalExamExpiry: newDates.medicalExamExpiry !== undefined ? newDates.medicalExamExpiry : updatedFaenas[0].medicalExamExpiry,
        accreditationExpiry: newDates.accreditationExpiry !== undefined ? newDates.accreditationExpiry : updatedFaenas[0].accreditationExpiry,
        safetyCourseExpiry: newDates.safetyCourseExpiry !== undefined ? newDates.safetyCourseExpiry : updatedFaenas[0].safetyCourseExpiry
      };
    }

    const updatedEmp = {
      ...emp,
      ...newDates,
      medicalExamExpiry: newDates.medicalExamExpiry || emp.medicalExamExpiry,
      accreditationExpiry: newDates.accreditationExpiry || emp.accreditationExpiry,
      safetyCourseExpiry: newDates.safetyCourseExpiry || emp.safetyCourseExpiry,
      faenasAccredited: updatedFaenas
    };

    setEmployees(prev => prev.map(e => e.id === employeeId ? updatedEmp : e));
    upsertDocument('employees', employeeId, updatedEmp);
    recordAuditLog({
      entityType: 'EMPLOYEE_COMPLIANCE',
      entityId: employeeId,
      action: 'UPDATE_COMPLIANCE_DATES',
      details: `Acreditaciones y exámenes actualizados para ${emp.name}`,
      user: 'Especialista HCM'
    });
    addToast(`✅ Fechas de acreditación actualizadas con éxito para ${emp.name}. Semáforo actualizado.`, 'success');
    return true;
  };

  // Fleet: Update Vehicle Document Expirations (Acreditación, Permiso de Circulación, SOAP, Personalizados)
  const updateAssetExpirations = (assetId, expirationData) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return false;

    const updatedAsset = {
      ...asset,
      accreditationExpiry: expirationData.accreditationExpiry || asset.accreditationExpiry || '',
      circulationPermitExpiry: expirationData.circulationPermitExpiry || asset.circulationPermitExpiry || '',
      soapExpiry: expirationData.soapExpiry || asset.soapExpiry || '',
      technicalReviewExpiry: expirationData.technicalReviewExpiry || asset.technicalReviewExpiry || '',
      customExpirations: Array.isArray(expirationData.customExpirations) ? expirationData.customExpirations : (asset.customExpirations || [])
    };

    setAssets(prev => prev.map(a => a.id === assetId ? updatedAsset : a));
    upsertDocument('assets', assetId, updatedAsset);
    recordAuditLog({
      entityType: 'FLEET_EXPIRATIONS',
      entityId: assetId,
      action: 'UPDATE_VEHICLE_EXPIRATIONS',
      details: `Vencimientos documentales actualizados para vehículo/equipo ${asset.name} (${asset.plate || assetId})`,
      user: 'Gestor de Flota'
    });
    addToast(`✅ Fechas de vencimiento actualizadas con éxito para ${asset.name}.`, 'success');
    return true;
  };

  // HCM: Absence & Leave Request (PT)
  const createAbsenceRequest = (newAbsence) => {
    const nextId = `ABS-2026-00${absences.length + 1}`;
    const emp = employees.find(e => e.id === newAbsence.employeeId);
    const formatted = {
      id: nextId,
      employeeId: newAbsence.employeeId,
      employeeName: emp ? emp.name : 'Empleado Desconocido',
      type: newAbsence.type || 'Vacaciones',
      startDate: newAbsence.startDate,
      endDate: newAbsence.endDate,
      daysCount: Number(newAbsence.daysCount) || 1,
      status: 'Pendiente Aprobación',
      reason: newAbsence.reason || 'Solicitud de ausentismo',
      requestDate: new Date().toISOString().split('T')[0]
    };
    setAbsences(prev => [formatted, ...prev]);
    upsertDocument('absences', nextId, formatted);
    addToast(`Solicitud de ausentismo ${nextId} registrada correctamente.`, 'info');
    return true;
  };

  // HCM: Update Absence Status (Approve/Reject)
  const updateAbsenceStatus = (absId, newStatus) => {
    const abs = absences.find(a => a.id === absId);
    if (!abs) return;
    const updated = { ...abs, status: newStatus };
    setAbsences(prev => prev.map(a => a.id === absId ? updated : a));
    upsertDocument('absences', absId, updated);
    addToast(`Solicitud ${absId} actualizada a [${newStatus}].`, 'success');
  };

  // HCM: Process Payroll Run (PY)
  const processPayrollRun = (periodStr = 'Agosto 2026') => {
    const activeEmployees = employees.filter(e => e.status !== 'Finiquitado');
    const grossSalaryTotal = activeEmployees.reduce((acc, e) => acc + (Number(e.baseSalary) || 0), 0);
    const totalDeductions = Math.round(grossSalaryTotal * 0.20);
    const netSalaryTotal = grossSalaryTotal - totalDeductions;

    const nextId = `PY-2026-0${payrollRuns.length + 1}`;
    const formattedRun = {
      id: nextId,
      period: periodStr,
      runDate: new Date().toISOString().split('T')[0],
      totalEmployees: activeEmployees.length,
      grossSalaryTotal,
      totalDeductions,
      netSalaryTotal,
      status: 'Pagado',
      processedBy: 'Operador Operam HCM'
    };

    setPayrollRuns(prev => [formattedRun, ...prev]);
    upsertDocument('payrollRuns', nextId, formattedRun);
    addToast(`✨ Liquidación de Nómina ${nextId} (${periodStr}) procesada con éxito para ${activeEmployees.length} colaboradores!`, 'success');
    return true;
  };

  // Reset to Factory Demo State
  const resetData = () => {
    localStorage.removeItem(`nebex_is_wiped_${activeTenantId}`);
    setPlants(DEFAULT_PLANTS);
    setActivePlant(DEFAULT_PLANTS[0]);
    setMaterials(DEFAULT_MATERIALS);
    setAssets(DEFAULT_ASSETS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setWorkOrders(DEFAULT_WORK_ORDERS);
    setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);
    setMigoDocuments(DEFAULT_MIGO_DOCUMENTS);
    setEmployees(DEFAULT_EMPLOYEES);
    setAbsences(DEFAULT_ABSENCES);
    setPayrollRuns(DEFAULT_PAYROLL_RUNS);
    addToast('✨ Datos de demostración de NEBEX restaurados exitosamente.', 'success');
  };

  // Clear All Tenant Data to 0 (Clean Production State)
  const clearAllTenantData = () => {
    localStorage.setItem(`nebex_is_wiped_${activeTenantId}`, 'true');
    setWorkOrders([]);
    setMaterials([]);
    setAssets([]);
    setNotifications([]);
    setPurchaseOrders([]);
    setMigoDocuments([]);
    setEmployees([]);
    setAbsences([]);
    setPayrollRuns([]);
    addToast('🗑️ Base de datos limpiada por completo a 0. Sistema listo para ingresar datos reales.', 'info');
  };

  const contextValue = useMemo(() => ({
    plants,
    activePlant,
    setActivePlant,
    createPlant,
    materials,
    assets,
    createAsset,
    updateAsset,
    notifications,
    workOrders,
    purchaseOrders,
    migoDocuments,
    employees,
    absences,
    payrollRuns,
    createEmployee,
    updateEmployee,
    reseedEmployees,
    updateEmployeeStatus,
    updateEmployeeCompliance,
    updateAssetExpirations,
    addFaenaAccreditation,
    createAbsenceRequest,
    updateAbsenceStatus,
    processPayrollRun,
    auditLogs,
    currentRole,
    setCurrentRole,
    themeMode,
    setThemeMode,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    globalToasts,
    addToast,
    tecoModalData,
    setTecoModalData,
    executeGoodsMovement,
    updateWorkOrderStatus,
    issueComponentToWorkOrder,
    createWorkOrder,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    deleteWorkOrder,
    deleteEmployee,
    deleteAsset,
    deleteNotification,
    createNotification,
    convertNotificationToWO,
    resetData,
    clearAllTenantData,
    injectMassiveActionSimulation
  }), [
    plants,
    activePlant,
    materials,
    assets,
    notifications,
    workOrders,
    purchaseOrders,
    migoDocuments,
    employees,
    absences,
    payrollRuns,
    auditLogs,
    currentRole,
    themeMode,
    activeTab,
    searchTerm,
    globalToasts,
    tecoModalData,
    addToast
  ]);

  return (
    <SAPContext.Provider value={contextValue}>
      <div className={themeMode === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </SAPContext.Provider>
  );
};

export const useSAP = () => {
  const context = useContext(SAPContext);
  if (!context) {
    throw new Error('useSAP debe ser usado dentro de un SAPProvider');
  }
  return context;
};
