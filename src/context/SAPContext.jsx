import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeCollection,
  upsertDocument,
  seedCollectionIfEmpty,
  executeAtomicGoodsMovement,
  recordAuditLog,
  DEFAULT_TENANT_ID
} from '../services/firestoreService';
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

  // Firestore Real-Time Subscriptions & Auto-Seeding per Tenant
  useEffect(() => {
    // 1. Seed demo data to Firestore if tenant collections are empty
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

    // 2. Real-Time Snapshot Listeners per Tenant
    const unsubPlants = subscribeCollection('plants', (items) => {
      if (items && items.length > 0) setPlants(items);
    }, null, [], activeTenantId);

    const unsubMaterials = subscribeCollection('materials', (items) => {
      if (items && items.length > 0) setMaterials(items);
    }, null, [], activeTenantId);

    const unsubAssets = subscribeCollection('assets', (items) => {
      if (items && items.length > 0) setAssets(items);
    }, null, [], activeTenantId);

    const unsubNotifs = subscribeCollection('notifications', (items) => {
      if (items && items.length > 0) setNotifications(items);
    }, null, [], activeTenantId);

    const unsubWorkOrders = subscribeCollection('workOrders', (items) => {
      if (items && items.length > 0) {
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
      if (items && items.length > 0) setPurchaseOrders(items);
    }, null, [], activeTenantId);

    const unsubMigo = subscribeCollection('migoDocuments', (items) => {
      if (items && items.length > 0) setMigoDocuments(items);
    }, null, [], activeTenantId);

    const unsubEmployees = subscribeCollection('employees', (items) => {
      if (items && items.length > 0) setEmployees(items);
    }, null, [], activeTenantId);

    const unsubAbsences = subscribeCollection('absences', (items) => {
      if (items && items.length > 0) setAbsences(items);
    }, null, [], activeTenantId);

    const unsubPayroll = subscribeCollection('payrollRuns', (items) => {
      if (items && items.length > 0) setPayrollRuns(items);
    }, null, [], activeTenantId);

    const unsubAudit = subscribeCollection('auditLogs', (items) => {
      if (items && items.length > 0) setAuditLogs(items);
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

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setGlobalToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setGlobalToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

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
    const prevEqWOs = workOrders.filter(w => w.equipmentId === newWO.equipmentId);
    const lastHourmeter = prevEqWOs.reduce((max, w) => (w.hourmeter && Number(w.hourmeter) > max ? Number(w.hourmeter) : max), 0);
    const lastOdometer = prevEqWOs.reduce((max, w) => (w.odometer && Number(w.odometer) > max ? Number(w.odometer) : max), 0);

    if (!newWO.isCounterCorrection && newWO.hourmeter && lastHourmeter > 0 && Number(newWO.hourmeter) < lastHourmeter) {
      addToast(`❌ Error de Validación IW31: Horómetro (${newWO.hourmeter} hrs) menor al último registro (${lastHourmeter} hrs). Active "Corrección por Error de Digitador" para autorizar.`, 'error');
      return false;
    }

    if (!newWO.isCounterCorrection && newWO.odometer && lastOdometer > 0 && Number(newWO.odometer) < lastOdometer) {
      addToast(`❌ Error de Validación IW31: Kilometraje (${newWO.odometer.toLocaleString()} km) menor al último registro (${lastOdometer.toLocaleString()} km). Active "Corrección por Error de Digitador" para autorizar.`, 'error');
      return false;
    }

    const existingActiveWO = workOrders.find(w =>
      w.equipmentId === newWO.equipmentId &&
      w.type === newWO.type &&
      (w.status === 'CRTE' || w.status === 'REL' || w.status === 'PCNF')
    );

    if (existingActiveWO) {
      addToast(`🚫 Regla de Negocio IW31: Ya existe la Orden de Trabajo activa ${existingActiveWO.id} (${existingActiveWO.status}) para el equipo ${newWO.equipmentId} con el tipo ${newWO.type}.`, 'error');
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

    addToast(`Nueva OT ${nextId} registrada con Reserva Almacén ${reservationNum}.`, 'success');
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
    addToast(`Material ${formattedMat.id} registrado en el Maestro de Materiales.`, 'success');
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
    addToast(`Aviso de Mantenimiento ${nextId} registrado en el sistema.`, 'info');
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
    return true;
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
    addToast(`Empleado ${nextId} (${formatted.name}) registrado en el Maestro de Personal HCM (PA30).`, 'success');
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
    addToast(`✅ Empleado ${empId} (${updatedEmp.name}) actualizado con éxito en el Maestro HCM (PA30).`, 'success');
    return true;
  };

  // HCM: Reseed/Reload Full Master Employees (12 Colaboradores)
  const reseedEmployees = () => {
    setEmployees(DEFAULT_EMPLOYEES);
    DEFAULT_EMPLOYEES.forEach(emp => {
      upsertDocument('employees', emp.id, emp);
    });
    addToast('✅ Se han cargado los 12 colaboradores completos en el Maestro de Personal HCM (PA20/PA30).', 'success');
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
    addToast('Todos los datos locales han sido restaurados.', 'info');
  };

  return (
    <SAPContext.Provider
      value={{
        plants,
        activePlant,
        setActivePlant,
        createPlant,
        materials,
        assets,
        createAsset,
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
        createNotification,
        convertNotificationToWO,
        resetData
      }}
    >
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
