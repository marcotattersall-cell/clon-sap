/**
 * Fixtures Iniciales para Siembra (Seeding) de Datos Maestros en Operam ERP (PM / MM)
 * Aísla las constantes de prueba iniciales para mantener el contexto limpio y liviano.
 */

export const DEFAULT_PLANTS = [
  { id: '0001', name: 'Planta Central Santiago', address: 'Av. Las Condes 12345', city: 'Santiago', status: 'Activo' },
  { id: '0002', name: 'Centro Logístico Antofagasta', address: 'Panamericana Norte Km 15', city: 'Antofagasta', status: 'Activo' },
  { id: '0003', name: 'Planta Industrial Concepción', address: 'Av. Gran Bretaña 890', city: 'Concepción', status: 'Activo' }
];

export const DEFAULT_MATERIALS = [
  { id: 'MAT-1001', name: 'Filtro de Aceite Hidráulico CAT H-200', type: 'SPARE', category: 'Filtros y Lubricantes', stock: 45, unit: 'UN', unitPrice: 85.50, storageLocation: 'ALM-01', storageBin: 'A1-01', plantId: '0001', reorderPoint: 15, safetyStock: 10, lastMovement: '2026-08-10' },
  { id: 'MAT-1002', name: 'Aceite Sintético Multigrado 15W40 (Tambor 208L)', type: 'RAW', category: 'Lubricantes', stock: 12, unit: 'TBO', unitPrice: 420.00, storageLocation: 'ALM-02', storageBin: 'B1-02', plantId: '0001', reorderPoint: 5, safetyStock: 2, lastMovement: '2026-08-12' },
  { id: 'MAT-1003', name: 'Bomba Hidráulica de Pistones Axiales Komatsu', type: 'SPARE', category: 'Componentes Hidráulicos', stock: 3, unit: 'UN', unitPrice: 3450.00, storageLocation: 'ALM-01', storageBin: 'A2-05', plantId: '0001', reorderPoint: 2, safetyStock: 1, lastMovement: '2026-08-05' },
  { id: 'MAT-1004', name: 'Correa Mecánica Dentada Industrial V-Belt', type: 'SPARE', category: 'Transmisión', stock: 80, unit: 'UN', unitPrice: 24.90, storageLocation: 'ALM-01', storageBin: 'C1-03', plantId: '0001', reorderPoint: 20, safetyStock: 10, lastMovement: '2026-08-14' },
  { id: 'MAT-1005', name: 'Sensor de Temperatura y Presión Digital M12', type: 'SPARE', category: 'Instrumentación', stock: 18, unit: 'UN', unitPrice: 165.00, storageLocation: 'ALM-03', storageBin: 'D1-04', plantId: '0001', reorderPoint: 5, safetyStock: 3, lastMovement: '2026-08-11' }
];

export const DEFAULT_ASSETS = [
  {
    id: 'EQ-101',
    name: 'Excavadora Hidráulica CAT 336 GC',
    category: 'Maquinaria Pesada',
    location: 'Mina Norte',
    status: 'OPERATIVE',
    healthScore: 94,
    hourmeter: 4250,
    odometer: 185000,
    model: 'CAT 336 GC 2024',
    serialNumber: 'CAT336GC-2024-99',
    accreditationExpiry: '2026-08-30', // Por vencer (≤30d)
    circulationPermitExpiry: '2027-03-31',
    soapExpiry: '2027-03-31',
    technicalReviewExpiry: '2026-11-15',
    customExpirations: [
      { id: 'CUST-101-1', title: 'Certificado de Operatividad', expiryDate: '2026-12-15' }
    ]
  },
  {
    id: 'EQ-102',
    name: 'Cargador Frontal Komatsu WA470',
    category: 'Maquinaria Pesada',
    location: 'Planta Chancado',
    status: 'MAINTENANCE',
    healthScore: 78,
    hourmeter: 6100,
    odometer: 210000,
    model: 'Komatsu WA470-8',
    serialNumber: 'KOMWA470-881',
    accreditationExpiry: '2026-08-10', // Vencido
    circulationPermitExpiry: '2027-03-31',
    soapExpiry: '2027-03-31',
    technicalReviewExpiry: '2026-09-30',
    customExpirations: [
      { id: 'CUST-102-1', title: 'Certificado de Gases', expiryDate: '2026-10-20' }
    ]
  },
  {
    id: 'EQ-103',
    name: 'Camión Aljibe Mercedes-Benz Atego 1726',
    category: 'Flota Transporte',
    location: 'Campamento Central',
    status: 'OPERATIVE',
    healthScore: 98,
    hourmeter: 1890,
    odometer: 95400,
    model: 'Atego 1726 4x2',
    serialNumber: 'MBAT1726-2023-41',
    accreditationExpiry: '2026-12-31',
    circulationPermitExpiry: '2027-03-31',
    soapExpiry: '2027-03-31',
    technicalReviewExpiry: '2026-08-25', // Por vencer (≤30d)
    customExpirations: [
      { id: 'CUST-103-1', title: 'Inspección de Extintores', expiryDate: '2026-12-01' }
    ]
  },
  {
    id: 'EQ-104',
    name: 'Chancador Primario de Quijada Metso C125',
    category: 'Planta Procesamiento',
    location: 'Línea de Molienda 1',
    status: 'OPERATIVE',
    healthScore: 89,
    hourmeter: 12400,
    odometer: 0,
    model: 'Nordberg C125',
    serialNumber: 'METC125-9921',
    accreditationExpiry: '2027-05-15',
    circulationPermitExpiry: '2027-03-31',
    soapExpiry: '2027-03-31',
    technicalReviewExpiry: '2027-04-15',
    customExpirations: []
  }
];

export const DEFAULT_WORK_ORDERS = [
  {
    id: 'WO-400101',
    title: 'Mantenimiento Preventivo 500 hrs - Excavadora CAT 336',
    type: 'PM01',
    priority: 'Alta',
    status: 'REL',
    equipmentId: 'EQ-101',
    costCenter: 'CC-4100',
    assignedTech: 'Jorge Silva',
    plannedHours: 6.0,
    actualHours: 4.5,
    plannedCost: 650.00,
    actualCost: 480.00,
    hourmeter: 4250,
    odometer: 185000,
    startDate: '2026-08-15',
    targetFinishDate: '2026-08-18',
    operations: [
      { id: 1, text: 'Inspección de niveles e inspección visual estructural', duration: 1.5, assigned: 'Jorge Silva', status: 'Completed' },
      { id: 2, text: 'Cambio de filtros hidráulicos y aceite de motor', duration: 3.0, assigned: 'Jorge Silva', status: 'In Progress' }
    ],
    components: [
      { materialId: 'MAT-1001', description: 'Filtro de Aceite Hidráulico CAT H-200', qtyPlanned: 2, qtyIssued: 2, unit: 'UN', unitPrice: 85.50 },
      { materialId: 'MAT-1002', description: 'Aceite Sintético Multigrado 15W40', qtyPlanned: 1, qtyIssued: 1, unit: 'TBO', unitPrice: 420.00 }
    ],
    logs: [
      { id: 'LOG-1', timestamp: '15/08/2026 09:00:00', user: 'Marco Vidal (Especialista PM)', previousStatus: 'CRTE', newStatus: 'REL', text: 'Transición de Estado: [CRTE] ➔ [REL]. Orden Liberada para ejecución.', comment: 'Liberación autorizada' }
    ]
  },
  {
    id: 'WO-400102',
    title: 'Reparación de Fuga Hidráulica en Cilindro Principal WA470',
    type: 'PM02',
    priority: 'Muy Alta',
    status: 'CRTE',
    equipmentId: 'EQ-102',
    costCenter: 'CC-4200',
    assignedTech: 'Carlos Mendoza',
    plannedHours: 8.0,
    actualHours: 0,
    plannedCost: 1200.00,
    actualCost: 0,
    hourmeter: 6100,
    odometer: 210000,
    startDate: '2026-08-16',
    targetFinishDate: '2026-08-19',
    operations: [
      { id: 1, text: 'Desmontaje de cilindro hidráulico de elevación', duration: 4.0, assigned: 'Carlos Mendoza', status: 'Pending' },
      { id: 2, text: 'Reemplazo de empaquetaduras y prueba de presión', duration: 4.0, assigned: 'Carlos Mendoza', status: 'Pending' }
    ],
    components: [],
    logs: [
      { id: 'LOG-2', timestamp: '16/08/2026 11:30:00', user: 'OPERADOR SISTEMA', previousStatus: 'N/A', newStatus: 'CRTE', text: 'Orden de Trabajo WO-400102 creada por aviso de fuga.', comment: 'Creación manual' }
    ]
  }
];

export const DEFAULT_NOTIFICATIONS = [
  { id: 'NOT-2026-001', title: 'Ruido inusual en chancador primario Metso', type: 'M1', priority: 'Alta', equipmentId: 'EQ-104', reporter: 'Roberto Araya', status: 'Nuevo', createdDate: '16/08/2026 14:20:00', description: 'Vibración y ruido metálico detectado en el rodamiento lado mando.' },
  { id: 'NOT-2026-002', title: 'Fuga de refrigerante en camión aljibe', type: 'M2', priority: 'Media', equipmentId: 'EQ-103', reporter: 'Luis Paredes', status: 'En Proceso', createdDate: '17/08/2026 08:15:00', description: 'Goteo leve en manguera radiador superior.' }
];

export const DEFAULT_PURCHASE_ORDERS = [
  { id: 'PO-45008912', vendor: 'Caterpillar Finning Chile', date: '2026-08-10', totalAmount: 4250.00, status: 'Aprobado', itemsCount: 3 }
];

export const DEFAULT_MIGO_DOCUMENTS = [
  { documentId: 'MIGO-50019283', year: '2026', movementType: '261', typeLabel: 'Salida para Orden de Trabajo (261)', materialId: 'MAT-1001', materialName: 'Filtro de Aceite Hidráulico CAT H-200', qty: 2, unit: 'UN', storageLocation: 'ALM-01', targetStorageLocation: 'N/A', refDocument: 'WO-400101', timestamp: '15/08/2026 10:15:00', user: 'M. ALMACEN', costCenter: 'CC-4100' }
];

export const DEFAULT_EMPLOYEES = [
  {
    id: 'EMP-1001',
    rut: '15.482.910-3',
    name: 'Jorge Silva San Martín',
    position: 'Técnico Senior de Mantenimiento',
    department: 'Mantenimiento de Planta',
    plantId: '0001',
    faena: 'Mina Norte - Sector A',
    baseSalary: 1850000,
    contractType: 'Indefinido',
    hireDate: '2021-03-15',
    contractExpiry: null,
    status: 'Activo',
    email: 'jorge.silva@empresa.cl',
    phone: '+56 9 8765 4321',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 12.5,
    medicalExamExpiry: '2026-08-30', // Por vencer en 13 días
    accreditationExpiry: '2026-12-15',
    safetyCourseExpiry: '2026-11-20',
    faenasAccredited: [
      {
        id: 'ACC-1001-1',
        faenaName: 'Mina Norte - Sector A',
        medicalExamExpiry: '2026-08-30', // Por vencer en 13d
        accreditationExpiry: '2026-12-15',
        safetyCourseExpiry: '2026-11-20'
      },
      {
        id: 'ACC-1001-2',
        faenaName: 'Planta Chancado Concepción',
        medicalExamExpiry: '2027-02-10',
        accreditationExpiry: '2026-08-25', // Por vencer en 8d
        safetyCourseExpiry: '2027-01-15'
      }
    ]
  },
  {
    id: 'EMP-1002',
    rut: '17.320.145-K',
    name: 'Carlos Mendoza Morales',
    position: 'Especialista Mecánico Hidráulico',
    department: 'Mantenimiento de Planta',
    plantId: '0001',
    faena: 'Mina Norte - Sector B',
    baseSalary: 1950000,
    contractType: 'Indefinido',
    hireDate: '2019-07-01',
    contractExpiry: null,
    status: 'Activo',
    email: 'carlos.mendoza@empresa.cl',
    phone: '+56 9 7654 3210',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 8.0,
    medicalExamExpiry: '2026-08-01', // Vencido hace 16 días
    accreditationExpiry: '2026-08-25', // Por vencer en 8 días
    safetyCourseExpiry: '2026-09-01', // Por vencer en 15 días
    faenasAccredited: [
      {
        id: 'ACC-1002-1',
        faenaName: 'Mina Norte - Sector B',
        medicalExamExpiry: '2026-08-01', // Vencido (🔴)
        accreditationExpiry: '2026-08-25',
        safetyCourseExpiry: '2026-09-01'
      },
      {
        id: 'ACC-1002-2',
        faenaName: 'Centro Logístico Antofagasta',
        medicalExamExpiry: '2027-05-15',
        accreditationExpiry: '2027-06-30',
        safetyCourseExpiry: '2027-04-20'
      }
    ]
  },
  {
    id: 'EMP-1003',
    rut: '16.891.432-8',
    name: 'Roberto Araya Fuentes',
    position: 'Operador Chancador Primario',
    department: 'Operaciones Mina',
    plantId: '0002',
    faena: 'Centro Logístico Antofagasta',
    baseSalary: 1450000,
    contractType: 'Indefinido',
    hireDate: '2022-01-10',
    contractExpiry: null,
    status: 'Activo',
    email: 'roberto.araya@empresa.cl',
    phone: '+56 9 6543 2109',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 4.0,
    medicalExamExpiry: '2027-05-10',
    accreditationExpiry: '2027-06-20',
    safetyCourseExpiry: '2027-04-15',
    faenasAccredited: [
      {
        id: 'ACC-1003-1',
        faenaName: 'Centro Logístico Antofagasta',
        medicalExamExpiry: '2027-05-10',
        accreditationExpiry: '2027-06-20',
        safetyCourseExpiry: '2027-04-15'
      }
    ]
  },
  {
    id: 'EMP-1004',
    rut: '18.102.554-2',
    name: 'Luis Paredes Ugarte',
    position: 'Chofer Flota Pesada y Aljibe',
    department: 'Gestión de Flota',
    plantId: '0001',
    faena: 'Planta Chancado Concepción',
    baseSalary: 1350000,
    contractType: 'Plazo Fijo',
    hireDate: '2024-02-01',
    contractExpiry: '2026-08-28', // Por vencer en 11 días (Plazo Fijo)
    status: 'Licencia Médica',
    email: 'luis.paredes@empresa.cl',
    phone: '+56 9 5432 1098',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 0,
    medicalExamExpiry: '2026-09-10', // Por vencer en 24 días
    accreditationExpiry: '2027-01-10',
    safetyCourseExpiry: '2026-08-10', // Vencido hace 7 días
    faenasAccredited: [
      {
        id: 'ACC-1004-1',
        faenaName: 'Planta Chancado Concepción',
        medicalExamExpiry: '2026-09-10',
        accreditationExpiry: '2027-01-10',
        safetyCourseExpiry: '2026-08-10' // Vencido (🔴)
      },
      {
        id: 'ACC-1004-2',
        faenaName: 'Mina Norte - Sector A',
        medicalExamExpiry: '2026-08-28', // Por vencer 11d
        accreditationExpiry: '2027-03-15',
        safetyCourseExpiry: '2026-08-20' // Por vencer 3d
      }
    ]
  },
  {
    id: 'EMP-1005',
    rut: '14.990.211-5',
    name: 'Mariana Reyes Sepúlveda',
    position: 'Analista de Logística y Almacén',
    department: 'Almacén e Inventarios',
    plantId: '0003',
    faena: 'Planta Industrial Concepción',
    baseSalary: 1600000,
    contractType: 'Indefinido',
    hireDate: '2020-09-15',
    contractExpiry: null,
    status: 'Activo',
    email: 'mariana.reyes@empresa.cl',
    phone: '+56 9 4321 0987',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 2.5,
    medicalExamExpiry: '2027-03-30',
    accreditationExpiry: '2027-08-14',
    safetyCourseExpiry: '2027-02-28',
    faenasAccredited: [
      {
        id: 'ACC-1005-1',
        faenaName: 'Planta Industrial Concepción',
        medicalExamExpiry: '2027-03-30',
        accreditationExpiry: '2027-08-14',
        safetyCourseExpiry: '2027-02-28'
      }
    ]
  },
  {
    id: 'EMP-1006',
    rut: '13.854.190-7',
    name: 'Francisco Zúñiga Alarcón',
    position: 'Supervisor Prevención de Riesgos (HSEC)',
    department: 'Prevención de Riesgos',
    plantId: '0002',
    faena: 'Centro Logístico Antofagasta',
    baseSalary: 2100000,
    contractType: 'Indefinido',
    hireDate: '2018-04-01',
    contractExpiry: null,
    status: 'Activo',
    email: 'francisco.zuniga@empresa.cl',
    phone: '+56 9 3210 9876',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 6.0,
    medicalExamExpiry: '2027-09-15',
    accreditationExpiry: '2027-11-20',
    safetyCourseExpiry: '2027-10-10',
    faenasAccredited: [
      {
        id: 'ACC-1006-1',
        faenaName: 'Centro Logístico Antofagasta',
        medicalExamExpiry: '2027-09-15',
        accreditationExpiry: '2027-11-20',
        safetyCourseExpiry: '2027-10-10'
      }
    ]
  },
  {
    id: 'EMP-1007',
    rut: '17.654.321-9',
    name: 'Andrea Villagrán Castro',
    position: 'Ingeniera de Fiabilidad de Equipos',
    department: 'Mantenimiento de Planta',
    plantId: '0001',
    faena: 'Mina Norte - Sector A',
    baseSalary: 2350000,
    contractType: 'Indefinido',
    hireDate: '2022-08-01',
    contractExpiry: null,
    status: 'Activo',
    email: 'andrea.villagran@empresa.cl',
    phone: '+56 9 2109 8765',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 5.0,
    medicalExamExpiry: '2026-09-05', // Por vencer 19d
    accreditationExpiry: '2027-01-20',
    safetyCourseExpiry: '2026-10-01',
    faenasAccredited: [
      {
        id: 'ACC-1007-1',
        faenaName: 'Mina Norte - Sector A',
        medicalExamExpiry: '2026-09-05',
        accreditationExpiry: '2027-01-20',
        safetyCourseExpiry: '2026-10-01'
      }
    ]
  },
  {
    id: 'EMP-1008',
    rut: '16.112.987-4',
    name: 'Gonzalo Tapia Henríquez',
    position: 'Técnico Electromecánico Senior',
    department: 'Mantenimiento de Planta',
    plantId: '0001',
    faena: 'Mina Norte - Sector B',
    baseSalary: 1780000,
    contractType: 'Indefinido',
    hireDate: '2021-11-15',
    contractExpiry: null,
    status: 'Activo',
    email: 'gonzalo.tapia@empresa.cl',
    phone: '+56 9 1098 7654',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 10.0,
    medicalExamExpiry: '2027-04-12',
    accreditationExpiry: '2027-05-30',
    safetyCourseExpiry: '2027-03-22',
    faenasAccredited: [
      {
        id: 'ACC-1008-1',
        faenaName: 'Mina Norte - Sector B',
        medicalExamExpiry: '2027-04-12',
        accreditationExpiry: '2027-05-30',
        safetyCourseExpiry: '2027-03-22'
      }
    ]
  },
  {
    id: 'EMP-1009',
    rut: '19.234.567-8',
    name: 'Camila Fuentes Orellana',
    position: 'Planificadora de Mantenimiento PM',
    department: 'Mantenimiento de Planta',
    plantId: '0003',
    faena: 'Planta Industrial Concepción',
    baseSalary: 1900000,
    contractType: 'Indefinido',
    hireDate: '2023-01-10',
    contractExpiry: null,
    status: 'Activo',
    email: 'camila.fuentes@empresa.cl',
    phone: '+56 9 0987 6543',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 3.0,
    medicalExamExpiry: '2027-07-25',
    accreditationExpiry: '2027-09-01',
    safetyCourseExpiry: '2027-08-15',
    faenasAccredited: [
      {
        id: 'ACC-1009-1',
        faenaName: 'Planta Industrial Concepción',
        medicalExamExpiry: '2027-07-25',
        accreditationExpiry: '2027-09-01',
        safetyCourseExpiry: '2027-08-15'
      }
    ]
  },
  {
    id: 'EMP-1010',
    rut: '15.876.543-1',
    name: 'Rodrigo Bravo Saavedra',
    position: 'Operador de Pala Hidráulica CAT 6020',
    department: 'Operaciones Mina',
    plantId: '0002',
    faena: 'Centro Logístico Antofagasta',
    baseSalary: 2250000,
    contractType: 'Indefinido',
    hireDate: '2017-06-20',
    contractExpiry: null,
    status: 'Activo',
    email: 'rodrigo.bravo@empresa.cl',
    phone: '+56 9 9876 5432',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 14.0,
    medicalExamExpiry: '2026-08-29', // Por vencer 12d
    accreditationExpiry: '2027-02-14',
    safetyCourseExpiry: '2026-11-30',
    faenasAccredited: [
      {
        id: 'ACC-1010-1',
        faenaName: 'Centro Logístico Antofagasta',
        medicalExamExpiry: '2026-08-29',
        accreditationExpiry: '2027-02-14',
        safetyCourseExpiry: '2026-11-30'
      }
    ]
  },
  {
    id: 'EMP-1011',
    rut: '12.345.678-9',
    name: 'Patricia Morales Guajardo',
    position: 'Superintendente de Recursos Humanos',
    department: 'Recursos Humanos',
    plantId: '0001',
    faena: 'Planta Central Santiago',
    baseSalary: 3200000,
    contractType: 'Indefinido',
    hireDate: '2015-03-01',
    contractExpiry: null,
    status: 'Activo',
    email: 'patricia.morales@empresa.cl',
    phone: '+56 9 8765 1234',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 0,
    medicalExamExpiry: '2028-01-10',
    accreditationExpiry: '2028-03-15',
    safetyCourseExpiry: '2028-02-20',
    faenasAccredited: [
      {
        id: 'ACC-1011-1',
        faenaName: 'Planta Central Santiago',
        medicalExamExpiry: '2028-01-10',
        accreditationExpiry: '2028-03-15',
        safetyCourseExpiry: '2028-02-20'
      }
    ]
  },
  {
    id: 'EMP-1012',
    rut: '17.987.654-3',
    name: 'Esteban Godoy Donoso',
    position: 'Jefe de Turno Operaciones Mina',
    department: 'Operaciones Mina',
    plantId: '0002',
    faena: 'Centro Logístico Antofagasta',
    baseSalary: 2600000,
    contractType: 'Indefinido',
    hireDate: '2019-10-15',
    contractExpiry: null,
    status: 'Activo',
    email: 'esteban.godoy@empresa.cl',
    phone: '+56 9 7654 9876',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    overtimeHours: 8.5,
    medicalExamExpiry: '2027-06-18',
    accreditationExpiry: '2027-08-22',
    safetyCourseExpiry: '2027-07-05',
    faenasAccredited: [
      {
        id: 'ACC-1012-1',
        faenaName: 'Centro Logístico Antofagasta',
        medicalExamExpiry: '2027-06-18',
        accreditationExpiry: '2027-08-22',
        safetyCourseExpiry: '2027-07-05'
      }
    ]
  }
];

export const DEFAULT_ABSENCES = [
  {
    id: 'ABS-2026-001',
    employeeId: 'EMP-1004',
    employeeName: 'Luis Paredes Ugarte',
    type: 'Licencia Médica',
    startDate: '2026-08-12',
    endDate: '2026-08-26',
    daysCount: 15,
    status: 'Aprobado',
    reason: 'Lumbago agudo certificado por Achs',
    requestDate: '2026-08-11'
  },
  {
    id: 'ABS-2026-002',
    employeeId: 'EMP-1005',
    employeeName: 'Mariana Reyes Sepúlveda',
    type: 'Vacaciones',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    daysCount: 8,
    status: 'Pendiente Aprobación',
    reason: 'Vacaciones legales acumuladas 2025-2026',
    requestDate: '2026-08-14'
  }
];

export const DEFAULT_PAYROLL_RUNS = [
  {
    id: 'PY-2026-07',
    period: 'Julio 2026',
    runDate: '2026-07-28',
    totalEmployees: 5,
    grossSalaryTotal: 8200000,
    totalDeductions: 1640000,
    netSalaryTotal: 6560000,
    status: 'Pagado',
    processedBy: 'Recursos Humanos HCM'
  }
];

