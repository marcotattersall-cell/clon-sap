import React, { createContext, useContext, useState, useEffect } from 'react';

const SAPContext = createContext(null);

const INITIAL_MATERIALS = [
  {
    id: 'MAT-8092',
    name: 'Rodamiento de Bolas Ranurado SKF 6208 2RS',
    type: 'SPARE', // SPARE (Repuesto), RAW (Materia Prima), FIN (Producto Terminado)
    stock: 45,
    unit: 'EA',
    storageLocation: '0001',
    storageBin: 'A1-02',
    reorderPoint: 15,
    safetyStock: 10,
    unitPrice: 45.50,
    supplier: 'SKF Bearings SA',
    lastMovement: '2026-08-14'
  },
  {
    id: 'MAT-4102',
    name: 'Aceite Sintético Industrial ISO VG 220 Shell Omala',
    type: 'RAW',
    stock: 120,
    unit: 'L',
    storageLocation: '0002',
    storageBin: 'B3-01',
    reorderPoint: 50,
    safetyStock: 30,
    unitPrice: 18.20,
    supplier: 'Shell Lubricantes SA',
    lastMovement: '2026-08-12'
  },
  {
    id: 'MAT-1055',
    name: 'Filtro de Aire Alta Eficiencia HEPA H14',
    type: 'SPARE',
    stock: 8,
    unit: 'EA',
    storageLocation: '0001',
    storageBin: 'A2-04',
    reorderPoint: 10,
    safetyStock: 5,
    unitPrice: 125.00,
    supplier: 'Mann+Hummel Filters',
    lastMovement: '2026-08-10'
  },
  {
    id: 'MAT-9301',
    name: 'Empaque de Silicona Sanitaria 2" FDA',
    type: 'SPARE',
    stock: 300,
    unit: 'EA',
    storageLocation: '0003',
    storageBin: 'C1-05',
    reorderPoint: 50,
    safetyStock: 25,
    unitPrice: 3.80,
    supplier: 'Flowserve Seals',
    lastMovement: '2026-08-15'
  },
  {
    id: 'MAT-7720',
    name: 'Sensor de Temperatura Pt100 RTD Industrial',
    type: 'SPARE',
    stock: 4,
    unit: 'EA',
    storageLocation: '0001',
    storageBin: 'A3-01',
    reorderPoint: 6,
    safetyStock: 3,
    unitPrice: 210.00,
    supplier: 'Endress+Hauser',
    lastMovement: '2026-08-01'
  },
  {
    id: 'MAT-5044',
    name: 'Válvula Solenoide 24V DC 1/2" Inox 316',
    type: 'SPARE',
    stock: 14,
    unit: 'EA',
    storageLocation: '0002',
    storageBin: 'B2-02',
    reorderPoint: 6,
    safetyStock: 4,
    unitPrice: 185.00,
    supplier: 'Burkert Fluid Control',
    lastMovement: '2026-08-11'
  },
  {
    id: 'MAT-6011',
    name: 'Correa de Transmisión Dentada Optibelt 1200-8M',
    type: 'SPARE',
    stock: 22,
    unit: 'EA',
    storageLocation: '0001',
    storageBin: 'A4-03',
    reorderPoint: 8,
    safetyStock: 5,
    unitPrice: 32.40,
    supplier: 'Optibelt Transmission',
    lastMovement: '2026-08-08'
  }
];

const INITIAL_ASSETS = [
  {
    id: 'EQ-1001',
    name: 'Bomba Centrífuga Principal B-101',
    functionalLocation: 'PLANT-01-FLUIDS',
    category: 'Mecánico',
    criticality: 'Alta',
    status: 'Operational', // Operational, Warning, Down
    healthIndex: 94,
    lastMaintenance: '2026-07-20',
    installedDate: '2022-03-15',
    costCenter: 'CC-4100'
  },
  {
    id: 'EQ-1002',
    name: 'Molino Industrial de Impacto M-02',
    functionalLocation: 'PLANT-01-GRINDING',
    category: 'Mecánico / Eléctrico',
    criticality: 'Alta',
    status: 'Warning',
    healthIndex: 72,
    lastMaintenance: '2026-06-10',
    installedDate: '2021-11-01',
    costCenter: 'CC-4100'
  },
  {
    id: 'EQ-1003',
    name: 'Compresor de Aire Tornillo C-04',
    functionalLocation: 'PLANT-01-UTILITIES',
    category: 'Servicios Planta',
    criticality: 'Media',
    status: 'Operational',
    healthIndex: 88,
    lastMaintenance: '2026-05-18',
    installedDate: '2023-01-10',
    costCenter: 'CC-4200'
  },
  {
    id: 'EQ-1004',
    name: 'Envasadora Rotativa Automática E-200',
    functionalLocation: 'PLANT-01-PACKAGING',
    category: 'Automatización / Mecánica',
    criticality: 'Crítica',
    status: 'Down',
    healthIndex: 45,
    lastMaintenance: '2026-08-01',
    installedDate: '2020-08-20',
    costCenter: 'CC-4100'
  },
  {
    id: 'EQ-1005',
    name: 'Intercambiador de Calor Placas HX-50',
    functionalLocation: 'PLANT-01-THERMAL',
    category: 'Térmico',
    criticality: 'Media',
    status: 'Operational',
    healthIndex: 98,
    lastMaintenance: '2026-08-10',
    installedDate: '2022-09-05',
    costCenter: 'CC-4300'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOT-2026-001',
    title: 'Fuga de aceite y vibración anormal en Molino M-02',
    type: 'M1', // M1 Malfuncionamiento, M2 Modificación, M3 Preventivo
    priority: 'Alta',
    equipmentId: 'EQ-1002',
    status: 'En Revisión',
    createdDate: '2026-08-14 09:30',
    reportedBy: 'Carlos Ruiz (Operador de Planta)',
    description: 'Se detecta goteo constante en retén de entrada y patrón de vibración fuera de norma ISO 10816.'
  },
  {
    id: 'NOT-2026-002',
    title: 'Sobrecalentamiento y bloqueo en rodamiento de Envasadora E-200',
    type: 'M1',
    priority: 'Muy Alta',
    equipmentId: 'EQ-1004',
    status: 'Convertido a OT',
    createdDate: '2026-08-15 07:15',
    reportedBy: 'Ana Morales (Ingeniera PM)',
    description: 'Detención imprevista de línea por alta temperatura (>95°C) en soporte accionamiento.'
  },
  {
    id: 'NOT-2026-003',
    title: 'Sustitución programada de filtros y lubricación C-04',
    type: 'M3',
    priority: 'Media',
    equipmentId: 'EQ-1003',
    status: 'Nuevo',
    createdDate: '2026-08-15 08:00',
    reportedBy: 'Sistema Auto-Schedule ERP',
    description: 'Alerta de mantenimiento preventivo basado en 500 horas de operación continua.'
  }
];

const INITIAL_WORK_ORDERS = [
  {
    id: 'WO-400101',
    title: 'Mantenimiento Correctivo URGENTE - Rodamiento y Sello Envasadora E-200',
    type: 'PM01', // PM01 Correctivo, PM02 Preventivo, PM03 Inspección
    priority: 'Muy Alta',
    status: 'REL', // CRTE (Creada), REL (Liberada), PCNF (Parcial Conf), TECO (Cierre Técnico), CLSD (Cerrada)
    equipmentId: 'EQ-1004',
    costCenter: 'CC-4100',
    hourmeter: 4850.5,
    odometer: 128450,
    startDate: '2026-08-15',
    targetFinishDate: '2026-08-16',
    plannerGroup: 'GRP-MECH',
    assignedTech: 'Jorge Silva (Especialista Senior)',
    plannedHours: 8.0,
    actualHours: 4.5,
    plannedCost: 340.00,
    actualCost: 106.30,
    operations: [
      { id: 1, text: 'Bloqueo y etiquetado de seguridad LOTO 24V/380V', duration: 1.0, assigned: 'Jorge Silva', status: 'Done' },
      { id: 2, text: 'Desmontaje de soporte dañado y extracción de rodamiento', duration: 3.5, assigned: 'Jorge Silva', status: 'Done' },
      { id: 3, text: 'Instalación de rodamiento SKF MAT-8092 y empaque MAT-9301', duration: 2.5, assigned: 'Jorge Silva', status: 'In Progress' },
      { id: 4, text: 'Alineación láser de eje y prueba de carga en vacío', duration: 1.0, assigned: 'Pedro Gómez', status: 'Pending' }
    ],
    components: [
      { materialId: 'MAT-8092', description: 'Rodamiento de Bolas SKF 6208 2RS', qtyPlanned: 2, qtyIssued: 2, unit: 'EA', unitPrice: 45.50 },
      { materialId: 'MAT-9301', description: 'Empaque de Silicona Sanitaria 2"', qtyPlanned: 4, qtyIssued: 4, unit: 'EA', unitPrice: 3.80 }
    ],
    settlementAccount: 'CTR-COSTO-PACKAGING',
    logs: [
      { timestamp: '2026-08-15 07:30', user: 'SYSTEM', text: 'Orden creada automáticamente a partir de Aviso NOT-2026-002.' },
      { timestamp: '2026-08-15 08:00', user: 'M. VALLADARES (Jefe Mantenimiento)', text: 'Estado cambiado a REL (Liberada para ejecución).' },
      { timestamp: '2026-08-15 10:15', user: 'J. SILVA', text: 'Consumo registrado MIGO 261: 2x MAT-8092 y 4x MAT-9301 descontados de Almacén 0001.' }
    ]
  },
  {
    id: 'WO-400102',
    title: 'Mantenimiento Preventivo 500 Horas - Compresor Tornillo C-04',
    type: 'PM02',
    priority: 'Media',
    status: 'CRTE',
    equipmentId: 'EQ-1003',
    costCenter: 'CC-4200',
    hourmeter: 3420.0,
    odometer: 85200,
    startDate: '2026-08-18',
    targetFinishDate: '2026-08-19',
    plannerGroup: 'GRP-ELEC',
    assignedTech: 'Mario Rossi',
    plannedHours: 6.0,
    actualHours: 0,
    plannedCost: 978.00,
    actualCost: 0,
    operations: [
      { id: 1, text: 'Drenado y cambio de aceite sintético Shell Omala 40L', duration: 3.0, assigned: 'Mario Rossi', status: 'Pending' },
      { id: 2, text: 'Sustitución de cartucho filtrante HEPA H14 MAT-1055', duration: 1.5, assigned: 'Mario Rossi', status: 'Pending' },
      { id: 3, text: 'Limpieza de radiador y verificación de presión de carga', duration: 1.5, assigned: 'Mario Rossi', status: 'Pending' }
    ],
    components: [
      { materialId: 'MAT-4102', description: 'Aceite Sintético Shell Omala', qtyPlanned: 40, qtyIssued: 0, unit: 'L', unitPrice: 18.20 },
      { materialId: 'MAT-1055', description: 'Filtro de Aire HEPA H14', qtyPlanned: 2, qtyIssued: 0, unit: 'EA', unitPrice: 125.00 }
    ],
    settlementAccount: 'CTR-COSTO-UTILITIES',
    logs: [
      { timestamp: '2026-08-15 08:00', user: 'AUTO SCHEDULER', text: 'Orden creada por plan semanal de preventivo PM02.' }
    ]
  },
  {
    id: 'WO-400103',
    title: 'Calibración de Instrumentación y Prueba Térmica - HX-50',
    type: 'PM03',
    priority: 'Baja',
    status: 'TECO',
    equipmentId: 'EQ-1005',
    costCenter: 'CC-4300',
    hourmeter: 1890.2,
    odometer: 42100,
    startDate: '2026-08-10',
    targetFinishDate: '2026-08-11',
    plannerGroup: 'GRP-INST',
    assignedTech: 'Elena Torres',
    plannedHours: 3.0,
    actualHours: 2.5,
    plannedCost: 150.00,
    actualCost: 140.00,
    operations: [
      { id: 1, text: 'Verificación de transmisores de temperatura y presión', duration: 2.5, assigned: 'Elena Torres', status: 'Done' }
    ],
    components: [],
    settlementAccount: 'CTR-COSTO-CALIDAD',
    logs: [
      { timestamp: '2026-08-10 09:00', user: 'E. TORRES', text: 'Prueba finalizada con éxito. Certificado registrado en ERP DMS.' },
      { timestamp: '2026-08-11 14:00', user: 'M. VALLADARES', text: 'Cierre Técnico (TECO) ejecutado.' }
    ]
  }
];

const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'PO-800901',
    supplier: 'SKF Bearings SA',
    createdDate: '2026-08-12',
    deliveryDate: '2026-08-20',
    status: 'Aprobado', // Borrador, Pendiente, Aprobado, Recibido
    totalAmount: 2275.00,
    items: [
      { materialId: 'MAT-8092', materialName: 'Rodamiento SKF 6208 2RS', qty: 50, price: 45.50, unit: 'EA' }
    ]
  },
  {
    id: 'PO-800902',
    supplier: 'Shell Lubricantes SA',
    createdDate: '2026-08-14',
    deliveryDate: '2026-08-22',
    status: 'Pendiente',
    totalAmount: 3640.00,
    items: [
      { materialId: 'MAT-4102', materialName: 'Aceite Sintético Shell Omala', qty: 200, price: 18.20, unit: 'L' }
    ]
  }
];

const INITIAL_MIGO_DOCUMENTS = [
  {
    documentId: 'MIGO-50010091',
    year: '2026',
    movementType: '261', // 261 Consumo para OT, 101 Entrada por Pedido, 311 Traspaso
    typeLabel: 'Salida para Orden de Trabajo',
    materialId: 'MAT-8092',
    materialName: 'Rodamiento de Bolas SKF 6208 2RS',
    qty: 2,
    unit: 'EA',
    storageLocation: '0001',
    refDocument: 'WO-400101',
    timestamp: '2026-08-15 10:15',
    user: 'J. SILVA',
    costCenter: 'CC-4100'
  },
  {
    documentId: 'MIGO-50010090',
    year: '2026',
    movementType: '261',
    typeLabel: 'Salida para Orden de Trabajo',
    materialId: 'MAT-9301',
    materialName: 'Empaque de Silicona Sanitaria 2"',
    qty: 4,
    unit: 'EA',
    storageLocation: '0003',
    refDocument: 'WO-400101',
    timestamp: '2026-08-15 10:15',
    user: 'J. SILVA',
    costCenter: 'CC-4100'
  },
  {
    documentId: 'MIGO-50010088',
    year: '2026',
    movementType: '101',
    typeLabel: 'Entrada de Mercancías por PO',
    materialId: 'MAT-4102',
    materialName: 'Aceite Sintético Shell Omala',
    qty: 120,
    unit: 'L',
    storageLocation: '0002',
    refDocument: 'PO-800890',
    timestamp: '2026-08-12 11:00',
    user: 'M. ALMACEN',
    costCenter: 'N/A'
  }
];

const INITIAL_PLANTS = [
  { id: '0001', name: 'Planta Central', address: 'Av. Industrial 1200', city: 'Santiago', status: 'Activo' },
  { id: '0002', name: 'Planta Norte', address: 'Ruta 5 Norte Km 45', city: 'Antofagasta', status: 'Activo' },
  { id: '0003', name: 'Almacén Sur', address: 'Zona Franca Lote 8', city: 'Concepción', status: 'Activo' }
];

export const SAPProvider = ({ children }) => {
  const [plants, setPlants] = useState(() => {
    const saved = localStorage.getItem('sap_plants');
    return saved ? JSON.parse(saved) : INITIAL_PLANTS;
  });

  const [activePlant, setActivePlant] = useState(() => plants[0] || INITIAL_PLANTS[0]);

  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem('sap_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('sap_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('sap_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [workOrders, setWorkOrders] = useState(() => {
    const saved = localStorage.getItem('sap_work_orders');
    const raw = saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
    return raw.map(wo => ({
      ...wo,
      operations: Array.isArray(wo.operations) ? wo.operations : [],
      components: Array.isArray(wo.components) ? wo.components : [],
      logs: Array.isArray(wo.logs) ? wo.logs : []
    }));
  });

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem('sap_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [migoDocuments, setMigoDocuments] = useState(() => {
    const saved = localStorage.getItem('sap_migo_docs');
    return saved ? JSON.parse(saved) : INITIAL_MIGO_DOCUMENTS;
  });

  const [currentRole, setCurrentRole] = useState('MAINTENANCE_MGR'); // MAINTENANCE_MGR, WAREHOUSE_SPEC, PURCHASING_MGR, FINANCIAL_DIR
  const [themeMode, setThemeMode] = useState('light'); // light, dark (Nordic Minimal Platinum as default)
  const [activeTab, setActiveTab] = useState('LAUNCHPAD'); // LAUNCHPAD, INVENTORY, WORK_ORDERS, ASSETS, NOTIFICATIONS, PROCUREMENT, ANALYTICS, MIGO
  const [searchTerm, setSearchTerm] = useState('');
  const [globalToasts, setGlobalToasts] = useState([]);
  const [tecoModalData, setTecoModalData] = useState(null);

  // Persistence side effects
  useEffect(() => {
    localStorage.setItem('sap_plants', JSON.stringify(plants));
  }, [plants]);
  useEffect(() => {
    localStorage.setItem('sap_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('sap_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('sap_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sap_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('sap_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('sap_migo_docs', JSON.stringify(migoDocuments));
  }, [migoDocuments]);

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setGlobalToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setGlobalToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // MIGO Goods Movement Transaction engine (Types 101, 261, 311)
  const executeGoodsMovement = ({ movementType, materialId, qty, storageLocation, targetStorageLocation, refDocument, notes }) => {
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

    // Update Stock
    setMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        let newStock = m.stock;
        if (movementType === '101') newStock += quantity; // Goods Receipt
        if (movementType === '261') newStock -= quantity; // Issue for WO
        if (movementType === '311') {
          // Transfer posting keeps overall stock but changes location
        }
        return {
          ...m,
          stock: newStock,
          storageLocation: targetStorageLocation || storageLocation || m.storageLocation,
          lastMovement: new Date().toISOString().split('T')[0]
        };
      }
      return m;
    }));

    // Create MIGO Document
    const docNum = `MIGO-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const typeLabels = {
      '101': 'Entrada de Mercancías por Pedido (101)',
      '261': 'Salida para Orden de Trabajo (261)',
      '311': 'Traspaso entre Almacenes (311)'
    };

    const newDoc = {
      documentId: docNum,
      year: '2026',
      movementType,
      typeLabel: typeLabels[movementType] || 'Movimiento de Mercancía',
      materialId: material.id,
      materialName: material.name,
      qty: quantity,
      unit: material.unit,
      storageLocation: storageLocation || material.storageLocation,
      targetStorageLocation: targetStorageLocation || 'N/A',
      refDocument: refDocument || 'Manual',
      timestamp: new Date().toLocaleString('es-CL'),
      user: currentRole === 'WAREHOUSE_SPEC' ? 'M. ALMACEN' : 'OPERADOR SAP',
      costCenter: material.type === 'SPARE' ? 'CC-4100' : 'CC-4200'
    };

    setMigoDocuments(prev => [newDoc, ...prev]);
    addToast(`Documento de Material ${docNum} generado con éxito (${typeLabels[movementType]}).`, 'success');
    return true;
  };

  // Work Order Status Update & Workflow Audit Traceability
  const updateWorkOrderStatus = (woId, newStatus, userName = 'Marco Vidal (Especialista PM)', comment = '') => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
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

        const updatedLogs = [
          ...(wo.logs || []),
          newLogEntry
        ];

        // Trigger Executive Corporate TECO Confirmation Overlay
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

        return {
          ...wo,
          status: newStatus,
          lastUpdated: timestamp,
          lastUpdatedBy: userName,
          logs: updatedLogs
        };
      }
      return wo;
    }));
  };

  // Issue Material Component to Work Order (Links PM and MM directly)
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

    if (success) {
      const material = materials.find(m => m.id === materialId);
      const addedCost = (material?.unitPrice || 0) * quantity;

      setWorkOrders(prev => prev.map(w => {
        if (w.id === woId) {
          const updatedComponents = w.components.map(c => {
            if (c.materialId === materialId) {
              return { ...c, qtyIssued: (c.qtyIssued || 0) + quantity };
            }
            return c;
          });

          // If material wasn't in component list, add it
          const exists = w.components.some(c => c.materialId === materialId);
          if (!exists && material) {
            updatedComponents.push({
              materialId: material.id,
              description: material.name,
              qtyPlanned: quantity,
              qtyIssued: quantity,
              unit: material.unit,
              unitPrice: material.unitPrice
            });
          }

          return {
            ...w,
            components: updatedComponents,
            actualCost: (w.actualCost || 0) + addedCost,
            logs: [
              ...w.logs,
              {
                timestamp: new Date().toLocaleString('es-CL'),
                user: 'MIGO ENGINE',
                text: `Consumidas ${quantity} ${material?.unit || 'UN'} de ${material?.name || materialId} por MIGO 261.`
              }
            ]
          };
        }
        return w;
      }));
    }
    return success;
  };

  // Add new Work Order with Counter Validation
  const createWorkOrder = (newWO) => {
    // 1. Search previous maximum readings for the target equipment
    const prevEqWOs = workOrders.filter(w => w.equipmentId === newWO.equipmentId);
    const lastHourmeter = prevEqWOs.reduce((max, w) => (w.hourmeter && Number(w.hourmeter) > max ? Number(w.hourmeter) : max), 0);
    const lastOdometer = prevEqWOs.reduce((max, w) => (w.odometer && Number(w.odometer) > max ? Number(w.odometer) : max), 0);

    // 2. Validate non-decreasing readings
    if (newWO.hourmeter && lastHourmeter > 0 && Number(newWO.hourmeter) < lastHourmeter) {
      addToast(`❌ Error de Validación IW31: Horómetro (${newWO.hourmeter} hrs) menor al último registro (${lastHourmeter} hrs).`, 'error');
      return false;
    }

    if (newWO.odometer && lastOdometer > 0 && Number(newWO.odometer) < lastOdometer) {
      addToast(`❌ Error de Validación IW31: Kilometraje (${newWO.odometer.toLocaleString()} km) menor al último registro (${lastOdometer.toLocaleString()} km).`, 'error');
      return false;
    }

    // 3. Regla de Negocio IW31: Bloquear duplicación de OT activa con mismo Equipo y mismo Tipo (PM01, PM02, PM03)
    const existingActiveWO = workOrders.find(w =>
      w.equipmentId === newWO.equipmentId &&
      w.type === newWO.type &&
      (w.status === 'CRTE' || w.status === 'REL' || w.status === 'PCNF')
    );

    if (existingActiveWO) {
      addToast(`🚫 Regla de Negocio IW31: Ya existe la Orden de Trabajo activa ${existingActiveWO.id} (${existingActiveWO.status}) para el equipo ${newWO.equipmentId} con el tipo ${newWO.type}. No se permite crear duplicados en proceso.`, 'error');
      return false;
    }

    const nextId = `WO-400${100 + workOrders.length + 1}`;
    const formattedWO = {
      id: nextId,
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
        { timestamp: new Date().toLocaleString('es-CL'), user: 'OPERADOR SISTEMA', text: `Orden de Trabajo ${nextId} creada manualmente.` }
      ],
      ...newWO
    };

    setWorkOrders(prev => [formattedWO, ...prev]);
    addToast(`Nueva Orden de Trabajo ${nextId} creada correctamente.`, 'success');
    return true;
  };

  // Add new Material
  const createMaterial = (newMat) => {
    const formattedMat = {
      ...newMat,
      stock: Number(newMat.stock) || 0,
      reorderPoint: Number(newMat.reorderPoint) || 10,
      safetyStock: Number(newMat.safetyStock) || 5,
      unitPrice: Number(newMat.unitPrice) || 10.0,
      lastMovement: new Date().toISOString().split('T')[0]
    };
    setMaterials(prev => [formattedMat, ...prev]);
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
    addToast(`Aviso de Mantenimiento ${nextId} registrado en el sistema.`, 'info');
  };

  // Convert Notification to Work Order
  const convertNotificationToWO = (notifId) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    createWorkOrder({
      title: `[OT por Aviso ${notif.id}] ${notif.title}`,
      type: notif.type === 'M1' ? 'PM01' : 'PM02',
      priority: notif.priority,
      equipmentId: notif.equipmentId,
      assignedTech: 'Asignación Automática',
      plannedHours: 4.0,
      plannedCost: 250.00
    });

    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, status: 'Convertido a OT' } : n));
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
    addToast(`Nuevo Centro ${formattedPlant.id} (${formattedPlant.name}) creado exitosamente!`, 'success');
  };

  // Reset to Factory Demo State
  const resetData = () => {
    localStorage.clear();
    setPlants(INITIAL_PLANTS);
    setActivePlant(INITIAL_PLANTS[0]);
    setMaterials(INITIAL_MATERIALS);
    setAssets(INITIAL_ASSETS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setMigoDocuments(INITIAL_MIGO_DOCUMENTS);
    addToast('Sistema reseteado a datos originales ERP Enterprise.', 'info');
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
        notifications,
        workOrders,
        purchaseOrders,
        migoDocuments,
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
