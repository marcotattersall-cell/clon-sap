# 📧 Guía de Configuración: Plantilla de Correo Corporativo & Dominio Personalizado

Esta guía documenta los pasos para configurar el remitente corporativo y la plantilla oficial en español para el restablecimiento de contraseñas en **Operam ERP Enterprise Platform**, una vez que el dominio corporativo definitivo esté registrado y activo.

---

## 📋 1. Plantilla Oficial de Restablecimiento de Contraseña (Español)

Cuando se configure en **Firebase Console** (`Authentication` ➔ `Templates` ➔ `Password reset`), utilizar la siguiente redacción:

### **Asunto del Correo**:
```text
[Operam ERP] Solicitud de Restablecimiento de Contraseña — Seguridad IT
```

### **Remitente (*Sender Name*)**:
```text
Operam ERP Security <soporte@tudominio.com>
```

### **Cuerpo del Mensaje (HTML / Texto)**:
```html
Estimado/a colaborador/a,

Ha recibido este mensaje porque se solicitó el restablecimiento de la contraseña asociada a su cuenta en la plataforma Operam ERP Enterprise.

Para definir una nueva contraseña de forma segura, haga clic en el siguiente enlace corporativo:

--------------------------------------------------
[ RESTABLECER CONTRASEÑA EN OPERAM ERP ] (%LINK%)
--------------------------------------------------

Información Importante de Seguridad:
• Este enlace expira automáticamente por razones de seguridad de la plataforma.
• Si usted no solicitó este cambio, puede ignorar este mensaje. Su contraseña actual no sufrirá ningún cambio.
• El equipo de Operam ERP nunca le solicitará sus credenciales de acceso por teléfono ni correo electrónico.

Atentamente,
Departamento de Seguridad Informática & Administración SAP
Operam ERP Enterprise Platform — Industrial Cloud 2026
```

---

## 🌐 2. Vinculación de Dominio Personalizado en Firebase Console

Cuando cuentes con el dominio corporativo oficial (ej. `operam-erp.cl` o `operam.com`), realizar los siguientes pasos:

1. **Agregar Dominio Autorizado**:
   - Ir a [Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains](https://console.firebase.google.com/project/clon-sap-2026/authentication/settings)
   - Hacer clic en **Add domain** e ingresar `tudominio.com`.

2. **Configurar Remitente SMTP / DKIM (evitar SPAM)**:
   - Ir a [Firebase Console ➔ Authentication ➔ Templates ➔ Password reset](https://console.firebase.google.com/project/clon-sap-2026/authentication/emails)
   - Hacer clic en el icono de **Lápiz / Editar**.
   - En **Customize domain / Dominio de remitente**, ingresar tu dominio corporativo.
   - Agregar los registros DNS tipo **TXT (DKIM / SPF)** y **CNAME** proporcionados por Firebase en el proveedor de tu dominio (Cloudflare, GoDaddy, NIC Chile, etc.).

---

## 💻 3. Actualización de Código en AuthContext.jsx

En [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx):

```javascript
const actionCodeSettings = {
  url: 'https://tudominio.com/login',
  handleCodeInApp: false
};
await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);
```
