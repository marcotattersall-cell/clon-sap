import React, { useState } from 'react';
import { useSAP } from '../../context/SAPContext';
import { useAuth } from '../../context/AuthContext';
import { RBAC_PERMISSIONS, SAP_ROLES } from '../../utils/rbacRules';
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
  Eye
} from 'lucide-react';

export const UserManagementSU01 = () => {
  const { addToast } = useSAP();
  const { sendPasswordReset, switchTenant } = useAuth();

  // Navigation Sub-tab ('VISTA_CLIENTES' | 'DIRECTORIO_USUARIOS' | 'MATRIZ_RBAC')
  const [activeSubTab, setActiveSubTab] = useState('VISTA_CLIENTES');

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
      roleName: 'Administrador Universal (SAP_ALL)',
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
      addToast('🔒 El perfil Administrador Universal (SAP_ALL) posee autorizaciones totales inmodificables.', 'warning');
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
      ADMINISTRATOR: 'Administrador Universal (SAP_ALL)',
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
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('VISTA_CLIENTES')}
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
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
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
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
          className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
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
                <span>Administradores SAP</span>
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">{adminUsers}</div>
              <div className="text-[11px] text-slate-500">Perfil SAP_ALL y Super Admin</div>
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
                  <option value="ALL">👥 Todos los Roles SAP</option>
                  <option value="ADMINISTRATOR">Administrador Universal (SAP_ALL)</option>
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
                    <th>Rol SAP</th>
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
                Haz clic en cualquier casilla para habilitar o denegar inmediatamente el acceso de una función transaccional a cada Rol SAP.
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
                    <div className="text-[10px] font-normal text-slate-500">Super Admin (SAP_ALL)</div>
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

              {/* Seccion 3: Rol SAP & Estado de Cuenta */}
              <div className="fiori-glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>3. Perfil de Autorización SAP & Estado de Acceso</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Rol SAP Asignado</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    >
                      <option value="ADMINISTRATOR">ADMINISTRATOR — Administrador Universal (SAP_ALL)</option>
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
    </div>
  );
};
