import React, { useState, useEffect } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import { RBAC_PERMISSIONS, SAP_ROLES } from '../../utils/rbacRules';
import { GlobalTenantDashboard } from './GlobalTenantDashboard';
import { upsertDocument, deleteDocument, subscribeCollection } from '../../services/dbService';
import {
  Users,
  ShieldCheck,
  Building2,
  KeyRound,
  Lock,
  Unlock,
  UserPlus,
  Edit3,
  Search,
  CheckCircle2,
  Mail,
  UserCheck,
  Globe,
  X,
  Grid,
  Check,
  Database,
  Trash2,
  Server,
  Download,
  Eye,
  Inbox,
  Sparkles,
  Send,
  Clock,
  Phone,
  Briefcase,
  Layers,
  MessageSquare,
  FileText,
  Tag,
  AlertCircle
} from 'lucide-react';

const INITIAL_DEMO_REQUESTS = [
  {
    id: 'DEMO-REQ-2026-4160',
    ticketId: 'DEMO-REQ-2026-4160',
    timestamp: '2026-09-06 14:30',
    fullName: 'Juan Pablo Bennett',
    email: 'jbennett@mineradelnorte.cl',
    company: 'Minera del Norte SpA',
    industry: 'Gran Minería & Extracción',
    employeeCount: 'Más de 500 colaboradores (Gran Minería)',
    phone: '+56 9 8765 4321',
    primaryModule: 'Mantenimiento PM (IW31/IW32)',
    assetCount: 'Más de 200 Equipos (Gran Minería)',
    notes: 'Requerimos migración urgente de flota de camiones CAT 797F y palas hidráulicas P&H 4100XPC.',
    status: 'Pendiente',
    responseNotes: ''
  },
  {
    id: 'DEMO-REQ-2026-3892',
    ticketId: 'DEMO-REQ-2026-3892',
    timestamp: '2026-09-05 09:15',
    fullName: 'Camila Torres Valenzuela',
    email: 'camila.torres@constructoralatitud.cl',
    company: 'Constructora Latitud Sur',
    industry: 'Construcción & Obras Civiles',
    employeeCount: '201 a 500 colaboradores',
    phone: '+56 9 9123 8877',
    primaryModule: 'Gestión de Materiales MM (MIGO 261/101)',
    assetCount: '51 a 200 Equipos/Maquinarias',
    notes: 'Interesados en trazabilidad en tiempo real de bodega central y despacho de repuestos a faenas.',
    status: 'En Revisión',
    responseNotes: 'Reunión agendada con equipo técnico para el jueves 10 AM.'
  },
  {
    id: 'DEMO-REQ-2026-2741',
    ticketId: 'DEMO-REQ-2026-2741',
    timestamp: '2026-09-04 16:45',
    fullName: 'Rodrigo Morales Sepúlveda',
    email: 'rmorales@transmarlog.com',
    company: 'Transportes y Logística Marítima',
    industry: 'Transporte & Logística de Flota',
    employeeCount: '51 a 200 colaboradores',
    phone: '+56 9 7766 5544',
    primaryModule: 'Control de Flotas & Maquinarias (IE03)',
    assetCount: '51 a 200 Equipos/Maquinarias',
    notes: 'Evaluando integración telemetría GPS y mantenimiento preventivo por kilometraje.',
    status: 'Respondido',
    responseNotes: 'Se envió propuesta técnica personalizada y credenciales de acceso al Sandbox ERP.'
  },
  {
    id: 'DEMO-REQ-2026-1509',
    ticketId: 'DEMO-REQ-2026-1509',
    timestamp: '2026-09-02 11:20',
    fullName: 'Ignacio Salgado Bravo',
    email: 'isalgado@energiapaci.cl',
    company: 'Pacífico Energía & Gas',
    industry: 'Energía, Gas & Petróleo',
    employeeCount: '201 a 500 colaboradores',
    phone: '+56 9 5544 3322',
    primaryModule: 'Suite ERP Completa',
    assetCount: '10 a 50 Equipos/Maquinarias',
    notes: 'Cotización solicitada para suite completa ERP con módulo HCM de personal.',
    status: 'Aprobado',
    responseNotes: 'Demo técnica ejecutada con éxito. Contrato enviado a firma.'
  }
];

export const UserManagementSU01 = () => {
  const { addToast } = useSAP();
  const { sendPasswordReset, switchTenant } = useAuth();

  // Navigation Sub-tab ('DASHBOARD_GLOBAL' | 'SOLICITUDES_DEMO' | 'VISTA_CLIENTES' | 'DIRECTORIO_USUARIOS' | 'MATRIZ_RBAC')
  const [activeSubTab, setActiveSubTab] = useState('DASHBOARD_GLOBAL');

  // Estado Local de Solicitudes de DEMO con Persistencia en localStorage
  const [demoRequests, setDemoRequests] = useState(() => {
    try {
      const stored = localStorage.getItem('axomira_demo_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DEMO_REQUESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('axomira_demo_requests', JSON.stringify(demoRequests));
    } catch (e) {
      console.error(e);
    }
  }, [demoRequests]);

  useEffect(() => {
    const handleNewDemo = (e) => {
      if (e.detail) {
        setDemoRequests(prev => [e.detail, ...prev.filter(r => r.id !== e.detail.id)]);
      }
    };
    window.addEventListener('axomira-demo-request-added', handleNewDemo);
    return () => window.removeEventListener('axomira-demo-request-added', handleNewDemo);
  }, []);

  // Filtros de Solicitudes Demo
  const [demoSearchQuery, setDemoSearchQuery] = useState('');
  const [demoStatusFilter, setDemoStatusFilter] = useState('ALL');
  const [demoIndustryFilter, setDemoIndustryFilter] = useState('ALL');

  // Modal Estado Edición Solicitud Demo
  const [isEditDemoModalOpen, setIsEditDemoModalOpen] = useState(false);
  const [editingDemoReq, setEditingDemoReq] = useState(null);
  const [editDemoForm, setEditDemoForm] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    industry: 'Gran Minería & Extracción',
    employeeCount: '51 a 200 colaboradores',
    primaryModule: 'Suite ERP Completa',
    assetCount: '10 a 50 Equipos/Maquinarias',
    notes: '',
    status: 'Pendiente',
    responseNotes: ''
  });

  // Modal Estado Respuesta Email
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [respondingDemoReq, setRespondingDemoReq] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('SANDBOX_ACCESS');
  const [autoMarkRespondido, setAutoMarkRespondido] = useState(true);

  // Lista de Tenants Corporativos Conocidos
  const tenantOptions = [
    { id: 'ALL', name: '🏢 Todos los Clientes Corporativos' },
    { id: 'tenant_demo', name: 'Demo Axomira Enterprise (Santiago)' },
    { id: 'tenant_bhp', name: 'BHP Billiton (Minera Escondida)' },
    { id: 'tenant_codelco', name: 'CODELCO Chile (El Teniente / Chuquicamata)' },
    { id: 'tenant_antofagasta_minerals', name: 'Antofagasta Minerals (Pelambres / Centinela)' },
    { id: 'tenant_collahuasi', name: 'Compañía Minera Doña Inés de Collahuasi' }
  ];

  // Estado Local de Clientes Corporativos (Tenants Multi-Tenant Isolation)
  const [corporateClientsList, setCorporateClientsList] = useState([
    {
      id: 'tenant_demo',
      name: 'Demo Axomira Enterprise',
      sector: 'Planta Central Santiago (Demostración Corporativa)',
      tenantId: 'tenant_demo',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      dbStatus: '🟢 BDD Isolada & Cifrada (PostgreSQL Schema)',
      location: 'Santiago, Chile',
      plantsCount: 2,
      createdAt: '2026-01-01',
      lastBackup: '2026-08-23 02:00:00 (SHA-256 Validado)',
      checksum: 'a8f5c9e2b1049c3d8e7a6f5b4c3d2e1f0a9b8c7d',
      contactPerson: 'Marco Vidal Tattersall (Super Admin)'
    },
    {
      id: 'tenant_codelco',
      name: 'CODELCO Chile',
      sector: 'Gran Minería del Cobre (El Teniente / Chuquicamata)',
      tenantId: 'tenant_codelco',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      dbStatus: '🟢 BDD Isolada & Cifrada (PostgreSQL Schema)',
      location: 'Rancagua / Calama, Chile',
      plantsCount: 4,
      createdAt: '2026-02-15',
      lastBackup: '2026-08-23 02:00:00 (SHA-256 Validado)',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      contactPerson: 'Jorge Silva San Martín'
    },
    {
      id: 'tenant_bhp',
      name: 'BHP Billiton',
      sector: 'Explotación Minera & Cobre (Minera Escondida)',
      tenantId: 'tenant_bhp',
      slaTier: 'HIGH',
      slaName: 'SLA Diario (02:00 AM)',
      dbStatus: '🟢 BDD Isolada & Cifrada (PostgreSQL Schema)',
      location: 'Antofagasta, Chile',
      plantsCount: 3,
      createdAt: '2026-03-01',
      lastBackup: '2026-08-23 02:00:00 (SHA-256 Validado)',
      checksum: '7d8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
      contactPerson: 'Carlos Mendoza Vidal'
    },
    {
      id: 'tenant_antofagasta_minerals',
      name: 'Antofagasta Minerals',
      sector: 'Grupo Minero (Los Pelambres / Centinela / Antucoya)',
      tenantId: 'tenant_antofagasta_minerals',
      slaTier: 'MEDIUM',
      slaName: 'SLA Semanal (Dom 03:00 AM)',
      dbStatus: '🟢 BDD Isolada & Cifrada (PostgreSQL Schema)',
      location: 'Coquimbo / Antofagasta, Chile',
      plantsCount: 3,
      createdAt: '2026-04-10',
      lastBackup: '2026-08-17 03:00:00 (SHA-256 Validado)',
      checksum: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
      contactPerson: 'Luis Paredes Ugarte'
    },
    {
      id: 'tenant_collahuasi',
      name: 'Compañía Minera Doña Inés de Collahuasi',
      sector: 'Extracción & Concentrado de Cobre (Pica / Iquique)',
      tenantId: 'tenant_collahuasi',
      slaTier: 'LOW',
      slaName: 'SLA Mensual (1ro 04:00 AM)',
      dbStatus: '🟢 BDD Isolada & Cifrada (PostgreSQL Schema)',
      location: 'Tarapacá, Chile',
      plantsCount: 2,
      createdAt: '2026-05-20',
      lastBackup: '2026-08-01 04:00:00 (SHA-256 Validado)',
      checksum: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      contactPerson: 'Patricia Morales Soto'
    }
  ]);

  // Estado Local de Usuarios para la Transacción SU01
  const [usersList, setUsersList] = useState([
    {
      id: 'USR-1001',
      uid: 'uid-marco-admin',
      name: 'Marco Vidal Tattersall',
      email: 'marco.tattersall@gmail.com',
      role: 'ADMINISTRATOR',
      roleName: 'Administrador Universal (SUPERUSER)',
      tenantId: 'tenant_demo',
      tenantName: 'Demo Axomira Enterprise',
      plant: '0001 (Planta Central Santiago)',
      status: 'Activo',
      lastLogin: '2026-08-23 13:00',
      isUniversalAdmin: true
    },
    {
      id: 'USR-1002',
      uid: 'uid-jorge-silva',
      name: 'Jorge Silva San Martín',
      email: 'jorge.silva@codelco.cl',
      role: 'MAINTENANCE_MGR',
      roleName: 'Jefe de Mantenimiento (PM)',
      tenantId: 'tenant_codelco',
      tenantName: 'CODELCO Chile',
      plant: '0002 (Centro Logístico Antofagasta)',
      status: 'Activo',
      lastLogin: '2026-08-23 11:45',
      isUniversalAdmin: false
    },
    {
      id: 'USR-1003',
      uid: 'uid-carlos-mendoza',
      name: 'Carlos Mendoza Vidal',
      email: 'carlos.mendoza@bhp.com',
      role: 'WAREHOUSE_KEEPER',
      roleName: 'Encargado de Almacén (MM)',
      tenantId: 'tenant_bhp',
      tenantName: 'BHP Billiton',
      plant: '0001 (Planta Central)',
      status: 'Activo',
      lastLogin: '2026-08-22 16:30',
      isUniversalAdmin: false
    },
    {
      id: 'USR-1004',
      uid: 'uid-luis-paredes',
      name: 'Luis Paredes Ugarte',
      email: 'luis.paredes@pelambres.cl',
      role: 'FIELD_MECHANIC',
      roleName: 'Mecánico Especialista Terreno',
      tenantId: 'tenant_antofagasta_minerals',
      tenantName: 'Antofagasta Minerals',
      plant: '0003 (Planta Concepción)',
      status: 'Bloqueado',
      lastLogin: '2026-08-10 09:15',
      isUniversalAdmin: false
    },
    {
      id: 'USR-1005',
      uid: 'uid-patricia-morales',
      name: 'Patricia Morales Soto',
      email: 'patricia.morales@collahuasi.cl',
      role: 'MAINTENANCE_MGR',
      roleName: 'Supervisora de Operaciones PM',
      tenantId: 'tenant_collahuasi',
      tenantName: 'Minera Collahuasi',
      plant: '0001 (Planta Central)',
      status: 'Activo',
      lastLogin: '2026-08-23 10:20',
      isUniversalAdmin: false
    }
  ]);

  // Matriz de Permisos Dinámica e Configurable por el Super Admin
  const [matrixState, setMatrixState] = useState({ ...RBAC_PERMISSIONS });

  // Lista de Funciones Transaccionales para la Matriz RBAC
  const rbacFunctionDefinitions = [
    { key: 'PM_CREATE_ORDER', name: 'Crear / Editar Órdenes PM (IW31 / IW32)', module: 'Mantenimiento (PM)', description: 'Creación de órdenes de trabajo, reserva inicial de materiales y planificación.' },
    { key: 'PM_TECO_CLOSE', name: 'Cierre Técnico de Órdenes (TECO)', module: 'Mantenimiento (PM)', description: 'Confirmación operativa y liquidación de órdenes finalizadas en terreno.' },
    { key: 'PM_CREATE_ASSET', name: 'Crear / Editar Activos de Planta (IE01 / IE03)', module: 'Mantenimiento (PM)', description: 'Alta de nuevos equipos, cambio de estado de operatividad e historial.' },
    { key: 'MM_GOODS_MOVEMENT', name: 'Movimientos de Almacén MIGO (261 / 101 / 311)', module: 'Almacén e Inventarios (MM)', description: 'Salidas por consumo a OT, entradas por pedido y traspasos entre almacenes.' },
    { key: 'MM_CREATE_MATERIAL', name: 'Crear / Editar Maestro Materiales (MM01 / MM03)', module: 'Almacén e Inventarios (MM)', description: 'Registro de SKUs, asignación de stock de seguridad y punto de pedido.' },
    { key: 'HCM_MANAGE_EMPLOYEES', name: 'Gestión de Personal & Nómina (HCM)', module: 'Recursos Humanos (HCM)', description: 'Mantenimiento de técnicos, contratos, acreditaciones y liquidaciones.' },
    { key: 'ANALYTICS_VIEW_FULL', name: 'Tableros Ejecutivos Analytics & Finanzas (CO/FI)', module: 'Analítica Ejecutiva', description: 'Visión consolidada de costos reales vs planificados, MTBF y MTTR.' },
    { key: 'SU01_GLOBAL_USER_MGMT', name: 'Consola Global de Usuarios & Tenants (SU01)', module: 'Administración Global', description: 'Reasignación de empresas, gestión de roles y bloqueo de accesos.' },
    { key: 'BACKUP_EXECUTE', name: 'Ejecución Manual de Respaldos SLA', module: 'Administración Global', description: 'Generación de volcados de respaldo auditados por cliente.' }
  ];

  // Handler para Conmutar Permisos en la Matriz RBAC
  const handleToggleMatrixPermission = (permKey, roleId) => {
    if (roleId === 'ADMINISTRATOR') {
      addToast('🔒 El perfil Administrador Universal (SUPERUSER) posee autorizaciones totales inmodificables.', 'warning');
      return;
    }

    setMatrixState(prev => {
      const currentAllowed = prev[permKey] || [];
      const isAlreadyAllowed = currentAllowed.includes(roleId);

      const updatedAllowed = isAlreadyAllowed
        ? currentAllowed.filter(r => r !== roleId)
        : [...currentAllowed, roleId];

      const roleTitle = SAP_ROLES[roleId]?.title || roleId;
      const funcName = rbacFunctionDefinitions.find(f => f.key === permKey)?.name || permKey;

      if (isAlreadyAllowed) {
        addToast(`🔴 Permiso "${funcName}" DENEGADO para el rol ${roleTitle}.`, 'info');
      } else {
        addToast(`🟢 Permiso "${funcName}" AUTORIZADO para el rol ${roleTitle}.`, 'success');
      }

      return {
        ...prev,
        [permKey]: updatedAllowed
      };
    });
  };

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MAINTENANCE_MGR',
    tenantId: 'tenant_demo',
    plant: '0001 (Planta Central Santiago)',
    status: 'Activo'
  });

  // KPI Metrics
  const totalUsers = usersList.length;
  const activeUsers = usersList.filter(u => u.status === 'Activo').length;
  const blockedUsers = usersList.filter(u => u.status === 'Bloqueado').length;
  const adminUsers = usersList.filter(u => u.role === 'ADMINISTRATOR').length;

  // Handlers para Solicitudes de DEMO
  const handleOpenEditDemo = (req) => {
    setEditingDemoReq(req);
    setEditDemoForm({
      fullName: req.fullName || '',
      email: req.email || '',
      company: req.company || '',
      phone: req.phone || '',
      industry: req.industry || 'Gran Minería & Extracción',
      employeeCount: req.employeeCount || '51 a 200 colaboradores',
      primaryModule: req.primaryModule || 'Suite ERP Completa',
      assetCount: req.assetCount || '10 a 50 Equipos/Maquinarias',
      notes: req.notes || '',
      status: req.status || 'Pendiente',
      responseNotes: req.responseNotes || ''
    });
    setIsEditDemoModalOpen(true);
  };

  const handleSaveEditDemo = (e) => {
    e.preventDefault();
    if (!editingDemoReq) return;

    const updatedData = {
      ...editingDemoReq,
      ...editDemoForm
    };

    upsertDocument('demoRequests', editingDemoReq.ticketId, updatedData).catch(err => {
      console.warn('[UserManagementSU01] Warning syncing demo request to Supabase:', err);
    });

    setDemoRequests(prev => prev.map(r => r.id === editingDemoReq.id ? updatedData : r));

    addToast(`✏️ Solicitud ${editingDemoReq.ticketId} actualizada correctamente.`, 'success');
    setIsEditDemoModalOpen(false);
  };

  const buildEmailTemplate = (templateKey, req) => {
    const name = req?.fullName || 'Estimado/a';
    const company = req?.company || 'su empresa';
    const ticket = req?.ticketId || '';
    const module = req?.primaryModule || 'Suite ERP Completa';

    if (templateKey === 'SANDBOX_ACCESS') {
      return `Estimado/a ${name},

Gracias por su interés en AXOMIRA Cloud ERP para ${company}.

Hemos procesado su solicitud de demostración (Ticket: ${ticket}). Nos complace habilitarle el acceso directo a nuestro Sandbox ERP Interactivo de pruebas, donde podrá explorar el módulo de "${module}" y simular operaciones en vivo.

🔗 Acceso al Sandbox ERP: https://axomira-erp.cloud/sandbox
👤 Usuario de prueba: demo.evaluador@axomira.cl
🔑 Clave temporal: Axomira2026!

Quedamos a su completa disposición para coordinar una sesión guiada con uno de nuestros especialistas técnicos.

Atentamente,
Equipo de Soluciones Corporativas
AXOMIRA Cloud ERP Enterprise`;
    }

    if (templateKey === 'MEETING_SCHEDULE') {
      return `Estimado/a ${name},

Junto con saludarle desde AXOMIRA Cloud ERP, hemos recibido su requerimiento corporativo para ${company} (Ticket ${ticket}).

Nos gustaría agendar una reunión técnica demostrativa de 30 minutos a través de Microsoft Teams o Google Meet para revisar en detalle sus necesidades sobre "${module}".

Por favor indíquenos qué día y horario acomoda mejor a su equipo entre las siguientes opciones:
- Opción A: Mañana a las 10:00 AM
- Opción B: Pasado mañana a las 15:30 PM

Quedamos atentos a su confirmación.

Atentamente,
Consultoría Técnica ERP
AXOMIRA Cloud ERP Enterprise`;
    }

    if (templateKey === 'PROPOSAL_QUOTE') {
      return `Estimado/a ${name},

Es un gusto saludarle. En relación a su solicitud de demostración ${ticket} para ${company}, hemos preparado una propuesta técnica preliminar adaptada a su dotación y volumen de activos.

Adjunto a este correo encontrará la propuesta preliminar de implementación para el módulo "${module}".

Si requiere ajustar el alcance o agregar más usuarios a la prueba corporativa, no dude en responder a este correo.

Atentamente,
Departamento Comercial Corporativo
AXOMIRA Cloud ERP Enterprise`;
    }

    return '';
  };

  const handleOpenEmailModal = (req) => {
    setRespondingDemoReq(req);
    setEmailTo(req.email);
    setEmailSubject(`[AXOMIRA ERP] Respuesta a Solicitud de Demostración (${req.ticketId})`);
    setEmailBody(buildEmailTemplate('SANDBOX_ACCESS', req));
    setEmailTemplate('SANDBOX_ACCESS');
    setIsEmailModalOpen(true);
  };

  const handleTemplateChange = (newTemplateKey) => {
    setEmailTemplate(newTemplateKey);
    if (respondingDemoReq) {
      setEmailBody(buildEmailTemplate(newTemplateKey, respondingDemoReq));
    }
  };

  const handleSendEmailResponse = (e) => {
    e.preventDefault();
    if (!respondingDemoReq || !emailTo.trim()) {
      addToast('❌ Especifica un destinatario válido.', 'error');
      return;
    }

    // Open mailto link
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');

    const nextStatus = autoMarkRespondido ? 'Respondido' : respondingDemoReq.status;
    const newNote = `[${new Date().toLocaleDateString()}] Correo enviado: "${emailSubject}"`;
    const updatedNotes = respondingDemoReq.responseNotes ? `${respondingDemoReq.responseNotes}\n${newNote}` : newNote;

    const updatedData = {
      ...respondingDemoReq,
      status: nextStatus,
      responseNotes: updatedNotes
    };

    upsertDocument('demoRequests', respondingDemoReq.ticketId, updatedData).catch(err => {
      console.warn('[UserManagementSU01] Warning syncing demo response to Supabase:', err);
    });

    // Update state
    setDemoRequests(prev => prev.map(r => r.id === respondingDemoReq.id ? updatedData : r));

    addToast(`📧 Respuesta preparada y enviada por correo para ${respondingDemoReq.company}.`, 'success');
    setIsEmailModalOpen(false);
  };

  const handleDeleteDemoReq = (ticketId, companyName) => {
    if (window.confirm(`¿Está seguro de eliminar la solicitud ${ticketId} de ${companyName}?`)) {
      deleteDocument('demoRequests', ticketId).catch(err => {
        console.warn('[UserManagementSU01] Warning deleting demo request from Supabase:', err);
      });
      setDemoRequests(prev => prev.filter(r => r.ticketId !== ticketId));
      addToast(`🗑️ Solicitud ${ticketId} eliminada del sistema.`, 'info');
    }
  };

  // Filtrado de Solicitudes Demo
  const filteredDemoRequests = demoRequests.filter(req => {
    const matchesSearch =
      (req.ticketId || '').toLowerCase().includes(demoSearchQuery.toLowerCase()) ||
      (req.fullName || '').toLowerCase().includes(demoSearchQuery.toLowerCase()) ||
      (req.email || '').toLowerCase().includes(demoSearchQuery.toLowerCase()) ||
      (req.company || '').toLowerCase().includes(demoSearchQuery.toLowerCase());
    
    const matchesStatus = demoStatusFilter === 'ALL' || req.status === demoStatusFilter;
    const matchesIndustry = demoIndustryFilter === 'ALL' || req.industry === demoIndustryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Handlers para Vista de Clientes Corporativos
  const handleSwitchTenantView = (client) => {
    setSelectedTenantFilter(client.tenantId);
    if (typeof switchTenant === 'function') {
      switchTenant(client.tenantId);
    }
    addToast(`🏢 Vista de contexto activada para ${client.name} (Tenant ID: ${client.tenantId}).`, 'success');
  };

  const handleFilterUsersByTenant = (tenantId) => {
    setSelectedTenantFilter(tenantId);
    setActiveSubTab('DIRECTORIO_USUARIOS');
    addToast(`👥 Filtrando directorio de usuarios para ${tenantId}`, 'info');
  };

  const handleRunClientBackup = (client) => {
    addToast(`💾 Iniciando respaldo SLA dedicado para ${client.name}...`, 'info');
    setTimeout(() => {
      addToast(`✅ Respaldo de ${client.name} completado. Checksum SHA-256: ${client.checksum.substring(0, 16)}...`, 'success');
    }, 600);
  };

  // Handler Bloquear / Desbloquear Usuario
  const handleToggleStatus = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Activo' ? 'Bloqueado' : 'Activo';
        addToast(`✏️ Estado de usuario ${u.name} cambiado a [${nextStatus}].`, nextStatus === 'Bloqueado' ? 'error' : 'success');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Handler Eliminar Usuario
  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario ${userName} (${userId})? esta acción no se puede deshacer.`)) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      addToast(`🗑️ Usuario ${userName} (${userId}) eliminado correctamente del sistema.`, 'info');
    }
  };

  // Handler Resetear Password con Firebase Auth SDK Real
  const handleResetPassword = async (email) => {
    if (!email) {
      addToast('❌ No se especificó un correo válido.', 'error');
      return;
    }
    addToast(`Enviando correo de restablecimiento de contraseña a ${email}...`, 'info');
    const result = await sendPasswordReset(email);
    if (result.success) {
      addToast(`📧 Correo de restablecimiento enviado exitosamente a ${email}. Revisa tu bandeja de entrada.`, 'success');
    } else {
      addToast(`❌ No se pudo enviar el correo a ${email}: ${result.error}`, 'error');
    }
  };

  // Handler Abrir Modal Crear/Editar
  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        tenantId: userToEdit.tenantId,
        plant: userToEdit.plant,
        status: userToEdit.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'MAINTENANCE_MGR',
        tenantId: 'tenant_demo',
        plant: '0001 (Planta Central Santiago)',
        status: 'Activo'
      });
    }
    setIsModalOpen(true);
  };

  // Handler Guardar Modal
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast('❌ Nombre y Correo son obligatorios.', 'error');
      return;
    }

    const matchedTenantObj = tenantOptions.find(t => t.id === formData.tenantId);
    const tenantName = matchedTenantObj ? matchedTenantObj.name.replace(/^🏢\s*/, '') : formData.tenantId;

    const roleNameMap = {
      ADMINISTRATOR: 'Administrador Universal (SUPERUSER)',
      MAINTENANCE_MGR: 'Jefe de Mantenimiento (PM)',
      WAREHOUSE_KEEPER: 'Encargado de Almacén (MM)',
      FIELD_MECHANIC: 'Técnico Especialista Terreno'
    };

    if (editingUser) {
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        roleName: roleNameMap[formData.role] || formData.role,
        tenantId: formData.tenantId,
        tenantName,
        plant: formData.plant,
        status: formData.status
      } : u));
      addToast(`✏️ Permisos y datos del usuario ${formData.name} modificados con éxito.`, 'success');
    } else {
      const newUser = {
        id: `USR-${1000 + usersList.length + 1}`,
        uid: `uid-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        roleName: roleNameMap[formData.role] || formData.role,
        tenantId: formData.tenantId,
        tenantName,
        plant: formData.plant,
        status: formData.status,
        lastLogin: 'Nunca',
        isUniversalAdmin: formData.email.toLowerCase().trim() === 'marco.tattersall@gmail.com'
      };
      setUsersList(prev => [newUser, ...prev]);
      addToast(`✅ Usuario ${formData.name} guardado y creado exitosamente para ${tenantName}.`, 'success');
    }

    setIsModalOpen(false);
  };

  // Filtrado de usuarios
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTenant = selectedTenantFilter === 'ALL' || u.tenantId === selectedTenantFilter;
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter;

    return matchesSearch && matchesTenant && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-mono font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-sap-blue" />
            <span>CONSOLA CENTRAL DE MANTENIMIENTO GLOBAL (#admin-usuarios)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Gestión de Clientes Corporativos & Usuarios (#admin-usuarios)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consola centralizada para inspeccionar el aislamiento de empresas (Multi-Tenant Isolation), gestionar usuarios por cliente y configurar autorizaciones RBAC.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-sap-blue hover:bg-sap-blue-hover text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Crear Usuario (#admin-usuarios)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Ribbon */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('DASHBOARD_GLOBAL')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'DASHBOARD_GLOBAL'
              ? 'border-sap-blue text-sap-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-sap-blue" />
          <span>Dashboard Global de Clientes</span>
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">11 Métricas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SOLICITUDES_DEMO')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'SOLICITUDES_DEMO'
              ? 'border-sky-500 text-sky-500 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4 text-sky-500" />
          <span>Solicitudes de DEMO ({demoRequests.length})</span>
          {demoRequests.filter(r => r.status === 'Pendiente').length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full font-mono animate-pulse">
              {demoRequests.filter(r => r.status === 'Pendiente').length} Nuevas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('VISTA_CLIENTES')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'VISTA_CLIENTES'
              ? 'border-sap-blue text-sap-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vista por Clientes Corporativos ({corporateClientsList.length})</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">Multi-Tenant</span>
        </button>

        <button
          onClick={() => setActiveSubTab('DIRECTORIO_USUARIOS')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'DIRECTORIO_USUARIOS'
              ? 'border-sap-blue text-sap-blue dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio Global de Usuarios ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MATRIZ_RBAC')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'MATRIZ_RBAC'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Matriz de Permisos RBAC por Función</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">Configurable</span>
        </button>
      </div>

      {/* SUB-TAB 0: DASHBOARD GLOBAL DE CLIENTES (11 MÉTIRCAS SUPERADMIN) */}
      {activeSubTab === 'DASHBOARD_GLOBAL' && (
        <GlobalTenantDashboard />
      )}

      {/* SUB-TAB 1: SOLICITUDES DE DEMO DESDE FORMULARIO LANDING PAGE */}
      {activeSubTab === 'SOLICITUDES_DEMO' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Solicitudes</span>
                <Inbox className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{demoRequests.length}</div>
              <div className="text-[11px] text-slate-500">Recibidas desde el Formulario Web</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <span>Pendientes por Atender</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {demoRequests.filter(r => r.status === 'Pendiente').length}
              </div>
              <div className="text-[11px] text-slate-500">Requieren primer contacto</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span>Respuestas Enviadas</span>
                <Send className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {demoRequests.filter(r => r.status === 'Respondido' || r.status === 'En Revisión').length}
              </div>
              <div className="text-[11px] text-slate-500">En gestión o comunicación</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-semibold">
                <span>Demos Aprobadas / Cierre</span>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {demoRequests.filter(r => r.status === 'Aprobado').length}
              </div>
              <div className="text-[11px] text-slate-500">Acceso Sandbox / Reunión agendada</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Search Box */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={demoSearchQuery}
                  onChange={(e) => setDemoSearchQuery(e.target.value)}
                  placeholder="Buscar por Ticket, Nombre, Empresa o Correo..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                />
              </div>

              {/* Status Filter */}
              <div className="md:col-span-1">
                <select
                  value={demoStatusFilter}
                  onChange={(e) => setDemoStatusFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="ALL">📌 Todos los Estados</option>
                  <option value="Pendiente">🟡 Solo Pendientes</option>
                  <option value="En Revisión">🔵 Solo En Revisión</option>
                  <option value="Respondido">🟢 Solo Respondidos por E-mail</option>
                  <option value="Aprobado">🟣 Solo Aprobados</option>
                  <option value="Rechazado">🔴 Solo Rechazados</option>
                </select>
              </div>

              {/* Industry Filter */}
              <div className="md:col-span-1">
                <select
                  value={demoIndustryFilter}
                  onChange={(e) => setDemoIndustryFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="ALL">🏭 Todos los Rubros Industriales</option>
                  <option value="Gran Minería & Extracción">Gran Minería & Extracción</option>
                  <option value="Construcción & Obras Civiles">Construcción & Obras Civiles</option>
                  <option value="Transporte & Logística de Flota">Transporte & Logística de Flota</option>
                  <option value="Energía, Gas & Petróleo">Energía, Gas & Petróleo</option>
                  <option value="Manufactura & Planta Industrial">Manufactura & Planta Industrial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-sky-500" />
                <span>Bandeja de Solicitudes de DEMO ({filteredDemoRequests.length} registros)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Información consolidada desde el Formulario Corporativo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th>Ticket / Fecha</th>
                    <th>Solicitante & Contacto</th>
                    <th>Empresa & Rubro</th>
                    <th>Dotación & Activos</th>
                    <th>Módulo de Interés</th>
                    <th>Comentarios Formulario</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones Directas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredDemoRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400 font-medium">
                        No se encontraron solicitudes de Demo con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredDemoRequests.map(req => (
                      <tr key={req.id} className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Ticket / Fecha */}
                        <td className="py-3">
                          <div className="font-mono font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{req.ticketId}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.timestamp}</div>
                        </td>

                        {/* Solicitante */}
                        <td>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{req.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{req.email}</span>
                          </div>
                          {req.phone && req.phone !== 'No especificado' && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{req.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Empresa & Rubro */}
                        <td>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.company}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{req.industry}</div>
                        </td>

                        {/* Dotación & Activos */}
                        <td>
                          <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{req.employeeCount}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{req.assetCount}</div>
                        </td>

                        {/* Módulo Interés */}
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800 inline-block">
                            {req.primaryModule}
                          </span>
                        </td>

                        {/* Comentarios */}
                        <td className="max-w-xs">
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate" title={req.notes}>
                            {req.notes || 'Sin requerimiento adicional'}
                          </p>
                          {req.responseNotes && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Historial: {req.responseNotes}</span>
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            req.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                            req.status === 'En Revisión' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300' :
                            req.status === 'Respondido' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                            req.status === 'Aprobado' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          }`}>
                            <span>{req.status}</span>
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* BOTON EDITAR */}
                            <button
                              onClick={() => handleOpenEditDemo(req)}
                              className="p-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2.5"
                              title="Editar toda la información de la solicitud de DEMO"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            {/* BOTON ENVIAR RESPUESTA POR E-MAIL */}
                            <button
                              onClick={() => handleOpenEmailModal(req)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-black px-2.5 shadow-sm"
                              title="Redactar y enviar respuesta por correo electrónico"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Responder por E-mail</span>
                            </button>

                            {/* ELIMINAR */}
                            <button
                              onClick={() => handleDeleteDemoReq(req.ticketId, req.company)}
                              className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar solicitud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: VISTA POR CLIENTES CORPORATIVOS (TENANTS) */}
      {activeSubTab === 'VISTA_CLIENTES' && (
        <div className="space-y-6">
          {/* Tenant Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Clientes Corporativos</span>
                <Building2 className="w-4 h-4 text-sap-blue" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{corporateClientsList.length}</div>
              <div className="text-[11px] text-slate-500">Empresas con BDD isolada</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
                <span>Aislamiento Multi-Tenant</span>
                <Database className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">100%</div>
              <div className="text-[11px] text-slate-500">Esquemas y llaves separadas</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-indigo-600 text-xs font-semibold">
                <span>Respaldos Automáticos SLA</span>
                <Server className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">24/7</div>
              <div className="text-[11px] text-slate-500">Diario (HIGH) / Semanal / Mensual</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-purple-600 text-xs font-semibold">
                <span>Total Usuarios Globales</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono">{usersList.length}</div>
              <div className="text-[11px] text-slate-500">Distribuidos entre empresas</div>
            </div>
          </div>

          {/* Cards Grid of Corporate Clients */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {corporateClientsList.map(client => {
              const assignedUsersCount = usersList.filter(u => u.tenantId === client.tenantId).length;

              return (
                <div
                  key={client.id}
                  className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl hover:border-sap-blue/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sap-blue/10 border border-sap-blue/30 text-sap-blue flex items-center justify-center font-black text-base shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                            {client.name}
                          </h3>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Globe className="w-3 h-3 text-sap-blue" />
                            <span>{client.tenantId}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide ${
                        client.slaTier === 'HIGH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                        client.slaTier === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                      }`}>
                        {client.slaTier} SLA
                      </span>
                    </div>

                    {/* Sector Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {client.sector}
                    </p>

                    {/* Technical Specs List */}
                    <div className="space-y-2 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Estado Base de Datos:</span>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">{client.dbStatus}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-sap-blue" />
                          <span>Usuarios Asignados:</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{assignedUsersCount} usuarios</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Server className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Frecuencia Respaldo:</span>
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{client.slaName}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>Plantas / Centros:</span>
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{client.plantsCount} Centros Operativos</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      onClick={() => handleFilterUsersByTenant(client.tenantId)}
                      className="w-full py-2 bg-slate-100 hover:bg-sap-blue hover:text-white dark:bg-slate-800 dark:hover:bg-sap-blue text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Ver Usuarios de {client.name} ({assignedUsersCount})</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSwitchTenantView(client)}
                        className="py-2 bg-purple-50 hover:bg-purple-600 hover:text-white dark:bg-purple-950/60 dark:hover:bg-purple-600 text-purple-800 dark:text-purple-300 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
                        title="Conmutar vista activa del sistema a este cliente"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Conmutar Vista</span>
                      </button>

                      <button
                        onClick={() => handleRunClientBackup(client)}
                        className="py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-[11px] flex items-center justify-center space-x-1 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
                        title="Ejecutar respaldo dedicado en caliente"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Respaldo SLA</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DIRECTORIO GLOBAL DE USUARIOS */}
      {activeSubTab === 'DIRECTORIO_USUARIOS' && (
        <>
          {/* KPI Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Usuarios</span>
                <Users className="w-4 h-4 text-sap-blue" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalUsers}</div>
              <div className="text-[11px] text-slate-500">Registrados en la plataforma</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
                <span>Usuarios Activos</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">{activeUsers}</div>
              <div className="text-[11px] text-slate-500">Con acceso habilitado</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-rose-600 text-xs font-semibold">
                <span>Bloqueados / Inactivos</span>
                <Lock className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono">{blockedUsers}</div>
              <div className="text-[11px] text-slate-500">Restringidos en SU01</div>
            </div>

            <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow">
              <div className="flex items-center justify-between text-indigo-600 text-xs font-semibold">
                <span>Administradores ERP</span>
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">{adminUsers}</div>
              <div className="text-[11px] text-slate-500">Perfil SUPERUSER y Super Admin</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="fiori-glass p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Search Box */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por Nombre, Email o Cliente..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                />
              </div>

              {/* Tenant Filter */}
              <div className="md:col-span-1">
                <select
                  value={selectedTenantFilter}
                  onChange={(e) => setSelectedTenantFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  {tenantOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="md:col-span-1">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="ALL">👥 Todos los Roles ERP</option>
                  <option value="ADMINISTRATOR">Administrador Universal (SUPERUSER)</option>
                  <option value="MAINTENANCE_MGR">Jefe de Mantenimiento (PM)</option>
                  <option value="WAREHOUSE_KEEPER">Encargado de Almacén (MM)</option>
                  <option value="FIELD_MECHANIC">Técnico Especialista Terreno</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-1">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="ALL">📌 Todos los Estados</option>
                  <option value="Activo">🟢 Solo Activos</option>
                  <option value="Bloqueado">🔴 Solo Bloqueados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sap-blue" />
                <span>Directorio Global de Usuarios ({filteredUsers.length} registros)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th>Usuario / Nombre</th>
                    <th>Correo Electrónico</th>
                    <th>Empresa (Tenant)</th>
                    <th>Rol ERP</th>
                    <th>Centro / Planta</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones Mantenimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 py-3">
                        <div className="w-7 h-7 rounded-full bg-sap-blue/10 border border-sap-blue/30 text-sap-blue flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                        </div>
                      </td>
                      <td className="font-mono text-slate-700 dark:text-slate-300">
                        {u.email}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sap-blue" />
                          <span>{u.tenantName}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMINISTRATOR' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                          u.role === 'MAINTENANCE_MGR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          u.role === 'WAREHOUSE_KEEPER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.roleName}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400 font-medium">
                        {u.plant}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          u.status === 'Activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Editar Permisos */}
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-1.5 bg-slate-100 hover:bg-sap-blue hover:text-white dark:bg-slate-800 dark:hover:bg-sap-blue text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Editar Permisos y Empresa (Tenant)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Resetear Clave */}
                          <button
                            onClick={() => handleResetPassword(u.email)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Enviar correo de restablecimiento de contraseña"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Bloquear / Desbloquear */}
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.status === 'Activo'
                                ? 'bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                            title={u.status === 'Activo' ? 'Bloquear acceso de usuario' : 'Desbloquear acceso de usuario'}
                          >
                            {u.status === 'Activo' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Eliminar Usuario */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar usuario permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 3: MATRIZ DE PERMISOS RBAC CONFIGURABLE */}
      {activeSubTab === 'MATRIZ_RBAC' && (
        <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-purple-600" />
                <span>Matriz de Control de Acceso por Función ERP (RBAC Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Haz clic en cualquier casilla para habilitar o denegar inmediatamente el acceso de una función transaccional a cada Rol ERP.
              </p>
            </div>

            <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-800 dark:text-purple-300 font-bold flex items-center space-x-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Modo Editor de Políticas Super Admin</span>
            </div>
          </div>

          {/* Interactive RBAC Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-1/3">Función Transaccional ERP</th>
                  <th className="p-3 w-1/6 text-center text-purple-700 dark:text-purple-300">
                    <div>ADMINISTRATOR</div>
                    <div className="text-[10px] font-normal text-slate-500">Super Admin (SUPERUSER)</div>
                  </th>
                  <th className="p-3 w-1/6 text-center text-blue-700 dark:text-blue-300">
                    <div>MAINTENANCE_MGR</div>
                    <div className="text-[10px] font-normal text-slate-500">Jefe Mantenimiento PM</div>
                  </th>
                  <th className="p-3 w-1/6 text-center text-amber-700 dark:text-amber-300">
                    <div>WAREHOUSE_KEEPER</div>
                    <div className="text-[10px] font-normal text-slate-500">Encargado Almacén MM</div>
                  </th>
                  <th className="p-3 w-1/6 text-center text-orange-700 dark:text-orange-300">
                    <div>FIELD_MECHANIC</div>
                    <div className="text-[10px] font-normal text-slate-500">Técnico Terreno</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rbacFunctionDefinitions.map(func => {
                  const allowedRoles = matrixState[func.key] || [];

                  return (
                    <tr key={func.key} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                      {/* Function Column */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {func.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          <span className="font-semibold text-sap-blue">{func.module}:</span> {func.description}
                        </div>
                      </td>

                      {/* ADMINISTRATOR Column (Always Enabled) */}
                      <td className="p-3 text-center bg-purple-50/20 dark:bg-purple-950/10">
                        <button
                          onClick={() => handleToggleMatrixPermission(func.key, 'ADMINISTRATOR')}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-300 cursor-not-allowed opacity-90 shadow-sm"
                          title="Super Admin posee autorizaciones inmodificables"
                        >
                          <Lock className="w-4 h-4 text-purple-600" />
                        </button>
                      </td>

                      {/* MAINTENANCE_MGR Column */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleMatrixPermission(func.key, 'MAINTENANCE_MGR')}
                          className={`inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                            allowedRoles.includes('MAINTENANCE_MGR')
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                              : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title={`Hacer clic para ${allowedRoles.includes('MAINTENANCE_MGR') ? 'denegar' : 'autorizar'} a Jefe Mantenimiento`}
                        >
                          {allowedRoles.includes('MAINTENANCE_MGR') ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* WAREHOUSE_KEEPER Column */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleMatrixPermission(func.key, 'WAREHOUSE_KEEPER')}
                          className={`inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                            allowedRoles.includes('WAREHOUSE_KEEPER')
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                              : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title={`Hacer clic para ${allowedRoles.includes('WAREHOUSE_KEEPER') ? 'denegar' : 'autorizar'} a Encargado Almacén`}
                        >
                          {allowedRoles.includes('WAREHOUSE_KEEPER') ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* FIELD_MECHANIC Column */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleMatrixPermission(func.key, 'FIELD_MECHANIC')}
                          className={`inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                            allowedRoles.includes('FIELD_MECHANIC')
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                              : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title={`Hacer clic para ${allowedRoles.includes('FIELD_MECHANIC') ? 'denegar' : 'autorizar'} a Técnico Terreno`}
                        >
                          {allowedRoles.includes('FIELD_MECHANIC') ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Creación / Edición SU01 - Estilo PA30 Fiori Enterprise */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-y-auto flex flex-col animate-in fade-in duration-200">
          {/* Sticky Top Fiori Navigation Header */}
          <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shadow-2xl shrink-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
              <div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                  <span>Administración Global</span>
                  <span>/</span>
                  <span>Gestión de Usuarios</span>
                  <span>/</span>
                  <span className="text-purple-400 font-bold">#admin-usuarios</span>
                </div>
                <h2 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>Gestión de Usuarios (axomira:admin:usuarios) — {editingUser ? 'Edición de Permisos & Tenant Corporativo' : 'Alta de Usuario & Asignación Multi-Tenant'}</span>

                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="su01-user-form"
                className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingUser ? 'Actualizar Usuario (#admin-usuarios)' : 'Crear Usuario (#admin-usuarios)'}</span>
              </button>
            </div>
          </div>

          {/* Form Content Body */}
          <div className="max-w-5xl mx-auto p-6 space-y-6 flex-1 w-full">
            <form id="su01-user-form" onSubmit={handleSaveUser} className="space-y-6">

              {/* Seccion 1: Identificación del Usuario */}
              <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Users className="w-4 h-4 text-sap-blue" />
                  <span>1. Identificación del Usuario & Credenciales</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Nombre Completo del Usuario</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej. Marco Vidal Tattersall"
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Correo Electrónico Corporativo</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="usuario@empresa.cl"
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seccion 2: Asignación Multi-Tenant & Centro Operativo */}
              <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>2. Asignación de Cliente Corporativo (Tenant) & Planta</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Cliente / Empresa Asignada (Multi-Tenant Isolation)</label>
                    <select
                      value={formData.tenantId}
                      onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      {tenantOptions.filter(t => t.id !== 'ALL').map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Centro Operativo / Planta Principal</label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      <option value="0001 (Planta Central Santiago)">0001 (Planta Central Santiago)</option>
                      <option value="0002 (Centro Logístico Antofagasta)">0002 (Centro Logístico Antofagasta)</option>
                      <option value="0003 (Planta Industrial Concepción)">0003 (Planta Industrial Concepción)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seccion 3: Rol ERP & Estado de Cuenta */}
              <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>3. Perfil de Autorización ERP & Estado de Acceso</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Rol ERP Asignado</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      <option value="ADMINISTRATOR">ADMINISTRATOR — Administrador Universal (SUPERUSER)</option>
                      <option value="MAINTENANCE_MGR">MAINTENANCE_MGR — Jefe de Mantenimiento (PM)</option>
                      <option value="WAREHOUSE_KEEPER">WAREHOUSE_KEEPER — Encargado de Almacén (MM)</option>
                      <option value="FIELD_MECHANIC">FIELD_MECHANIC — Técnico Especialista Terreno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Estado de Cuenta</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      <option value="Activo">🟢 Habilitado / Activo</option>
                      <option value="Bloqueado">🔴 Bloqueado / Restringido</option>
                    </select>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* MODAL 1: EDITAR SOLICITUD DE DEMO (MODIFICAR DATOS + ESTADO) */}
      {isEditDemoModalOpen && editingDemoReq && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 ring-1 ring-sky-500/20 my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold uppercase">Ticket {editingDemoReq.ticketId}</span>
                  <h3 className="text-lg font-black text-white">Editar Registro de Solicitud de Demo</h3>
                </div>
              </div>
              <button
                onClick={() => setIsEditDemoModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditDemo} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Nombre Completo */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nombre Completo del Solicitante</label>
                  <input
                    type="text"
                    value={editDemoForm.fullName}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, fullName: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* Correo Corporativo */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Correo Electrónico Corporativo</label>
                  <input
                    type="email"
                    value={editDemoForm.email}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, email: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Empresa u Organización</label>
                  <input
                    type="text"
                    value={editDemoForm.company}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, company: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Teléfono / WhatsApp de Contacto</label>
                  <input
                    type="text"
                    value={editDemoForm.phone}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                {/* Rubro */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Sector Industrial</label>
                  <select
                    value={editDemoForm.industry}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, industry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Gran Minería & Extracción" className="bg-slate-900 text-slate-100">Gran Minería & Extracción</option>
                    <option value="Mediana & Pequeña Minería" className="bg-slate-900 text-slate-100">Mediana & Pequeña Minería</option>
                    <option value="Construcción & Obras Civiles" className="bg-slate-900 text-slate-100">Construcción & Obras Civiles</option>
                    <option value="Transporte & Logística de Flota" className="bg-slate-900 text-slate-100">Transporte & Logística de Flota</option>
                    <option value="Manufactura & Planta Industrial" className="bg-slate-900 text-slate-100">Manufactura & Planta Industrial</option>
                    <option value="Energía, Gas & Petróleo" className="bg-slate-900 text-slate-100">Energía, Gas & Petróleo</option>
                  </select>
                </div>

                {/* Dotación */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Dotación de Trabajadores</label>
                  <select
                    value={editDemoForm.employeeCount}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, employeeCount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="1 a 20 colaboradores" className="bg-slate-900 text-slate-100">1 a 20 colaboradores</option>
                    <option value="21 a 50 colaboradores" className="bg-slate-900 text-slate-100">21 a 50 colaboradores</option>
                    <option value="51 a 200 colaboradores" className="bg-slate-900 text-slate-100">51 a 200 colaboradores</option>
                    <option value="201 a 500 colaboradores" className="bg-slate-900 text-slate-100">201 a 500 colaboradores</option>
                    <option value="Más de 500 colaboradores (Gran Minería)" className="bg-slate-900 text-slate-100">Más de 500 colaboradores (Gran Minería)</option>
                  </select>
                </div>

                {/* Módulo Clave */}
                <div>
                  <label className="block font-bold text-sky-400 mb-1">Módulo Principal de Interés</label>
                  <select
                    value={editDemoForm.primaryModule}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, primaryModule: e.target.value })}
                    className="w-full bg-slate-950 border border-sky-500/40 rounded-xl px-3 py-2 text-sky-300 font-semibold focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="Suite ERP Completa" className="bg-slate-900 text-slate-100">Suite ERP Completa (PM + MM + Flota + HCM)</option>
                    <option value="Mantenimiento PM (IW31/IW32)" className="bg-slate-900 text-slate-100">Mantenimiento PM & TECO (IW31 / IW32)</option>
                    <option value="Gestión de Materiales MM (MIGO 261/101)" className="bg-slate-900 text-slate-100">Gestión de Materiales MM & MIGO (261 / 101)</option>
                    <option value="Control de Flotas & Maquinarias (IE03)" className="bg-slate-900 text-slate-100">Control de Flotas & Maquinarias (IE03)</option>
                    <option value="Recursos Humanos HCM & Faenas" className="bg-slate-900 text-slate-100">Recursos Humanos HCM & Faenas</option>
                  </select>
                </div>

                {/* Volumen Activos */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Volumen de Activos</label>
                  <select
                    value={editDemoForm.assetCount}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, assetCount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="1 a 10 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">1 a 10 Equipos / Maquinarias</option>
                    <option value="10 a 50 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">10 a 50 Equipos / Maquinarias</option>
                    <option value="51 a 200 Equipos/Maquinarias" className="bg-slate-900 text-slate-100">51 a 200 Equipos / Maquinarias</option>
                    <option value="Más de 200 Equipos (Gran Minería)" className="bg-slate-900 text-slate-100">Más de 200 Equipos (Gran Minería)</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-emerald-400 mb-1">Estado Operativo de la Solicitud</label>
                  <select
                    value={editDemoForm.status}
                    onChange={(e) => setEditDemoForm({ ...editDemoForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="Pendiente" className="bg-slate-900 text-amber-400 font-bold">🟡 Pendiente (Solicitud Recibida sin Atender)</option>
                    <option value="En Revisión" className="bg-slate-900 text-sky-400 font-bold">🔵 En Revisión (En Análisis Técnico / Agendando)</option>
                    <option value="Respondido" className="bg-slate-900 text-emerald-400 font-bold">🟢 Respondido por E-mail (Correo Enviado al Cliente)</option>
                    <option value="Aprobado" className="bg-slate-900 text-purple-400 font-bold">🟣 Aprobado (Demo Ejecutada / Sandbox Activo)</option>
                    <option value="Rechazado" className="bg-slate-900 text-rose-400 font-bold">🔴 Rechazado (Desestimado / Fuera de Cobertura)</option>
                  </select>
                </div>
              </div>

              {/* Mensaje original del cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Comentarios del Formulario (Cliente)</label>
                <textarea
                  rows="2"
                  value={editDemoForm.notes}
                  onChange={(e) => setEditDemoForm({ ...editDemoForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Notas de Seguimiento Interno */}
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>Notas de Seguimiento Interno & Historial de Gestión</span>
                  <span className="text-[10px] text-slate-400 font-normal">Visible solo para administradores</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Ej. Se llamó a cliente por teléfono. Solicitan demo enfocada en trazabilidad MIGO..."
                  value={editDemoForm.responseNotes}
                  onChange={(e) => setEditDemoForm({ ...editDemoForm, responseNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditDemoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios en Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENVIAR RESPUESTA POR E-MAIL */}
      {isEmailModalOpen && respondingDemoReq && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 ring-1 ring-emerald-500/20 my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">E-mail Corporativo • Ticket {respondingDemoReq.ticketId}</span>
                  <h3 className="text-lg font-black text-white">Enviar Respuesta a {respondingDemoReq.fullName} ({respondingDemoReq.company})</h3>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmailResponse} className="p-6 space-y-4 text-xs">
              
              {/* To & Template row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Destinatario (Correo Electrónico)</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1">Cargar Plantilla Predeterminada</label>
                  <select
                    value={emailTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="SANDBOX_ACCESS" className="bg-slate-900 text-slate-100">🔗 Acceso Inmediato a Sandbox ERP + Credenciales</option>
                    <option value="MEETING_SCHEDULE" className="bg-slate-900 text-slate-100">📅 Coordinación de Reunión Demostrativa (Teams)</option>
                    <option value="PROPOSAL_QUOTE" className="bg-slate-900 text-slate-100">📄 Propuesta Técnica & Cotización Comercial</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Asunto del Correo</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Cuerpo del Mensaje de Correo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Puedes modificar o personalizar el texto según el requerimiento</span>
                </label>
                <textarea
                  rows="10"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Checkbox Auto-mark respondido */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="autoMarkRespondido"
                  checked={autoMarkRespondido}
                  onChange={(e) => setAutoMarkRespondido(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="autoMarkRespondido" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Actualizar estado de la solicitud automáticamente a <strong className="text-emerald-400">"Respondido"</strong>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-[11px] text-slate-400 font-mono">
                  💡 Al confirmar se abrirá tu aplicación de correo y se registrará en el historial de la solicitud.
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Respuesta por E-mail</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
