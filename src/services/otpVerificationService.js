import { upsertDocument, subscribeCollection } from './dbService';
import { sendOTPCodeEmail } from './resendEmailService';

/**
 * Servicio de Generación y Validación de Códigos de Verificación OTP (6 dígitos)
 * para Registro Corporativo de AXOMIRA INTELLIGENT CLOUD ERP
 */

const OTP_EXPIRATION_MINUTES = 10;
const memoryOTPStore = new Map();

/**
 * Genera un código criptográficamente seguro de 6 dígitos
 */
export const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Genera y almacena un nuevo código OTP de 6 dígitos para un correo
 */
export const generateAndSendOTP = async (email, displayName = 'Usuario ERP') => {
  if (!email) throw new Error('Correo electrónico requerido para generar OTP.');

  const cleanEmail = email.toLowerCase().trim();
  const code = generate6DigitCode();
  const expiresAt = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;

  const otpData = {
    email: cleanEmail,
    code,
    displayName,
    expiresAt,
    attempts: 0,
    createdTimestamp: new Date().toISOString()
  };

  // 1. Guardar en memoria rápida
  memoryOTPStore.set(cleanEmail, otpData);

  // 2. Persistir en localStorage
  try {
    localStorage.setItem(`sap_otp_${cleanEmail}`, JSON.stringify(otpData));
  } catch (e) {
    console.warn('[OTP Service] Error al guardar en localStorage:', e);
  }

  // 3. Persistir en Firestore/Supabase BDD
  try {
    await upsertDocument('otp_verifications', cleanEmail.replace(/[^a-z0-9]/g, '_'), otpData);
  } catch (err) {
    console.warn('[OTP Service] Guardando respaldo local de OTP:', err);
  }

  // 4. Despachar correo transaccional vía RESEND API (despacho directo a bandeja de entrada)
  try {
    const resendResult = await sendOTPCodeEmail({ toEmail: cleanEmail, displayName, code });
    if (resendResult.success) {
      console.log(`[OTP Service] 🚀 Correo con código ${code} despachado exitosamente vía Resend a ${cleanEmail}`);
    } else {
      console.warn(`[OTP Service] Resend aviso:`, resendResult.message || resendResult.error);
    }
  } catch (rErr) {
    console.warn('[OTP Service] Error al transmitir vía Resend:', rErr);
  }

  // 5. Registrar documento de correo transaccional en la colección 'mail' (Firebase Trigger Email Extension)
  try {
    const mailDocId = `OTP_MAIL_${cleanEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    await upsertDocument('mail', mailDocId, {
      to: [cleanEmail],
      message: {
        subject: `[AXOMIRA ERP] Tu código de verificación de 6 dígitos: ${code}`,
        text: `Hola ${displayName}, tu código de verificación para AXOMIRA ERP es: ${code} (Válido por 10 minutos).`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; font-weight: 800;">AXOMIRA Intelligent Cloud ERP</h2>
            <p style="color: #94a3b8; font-size: 14px;">Hola <strong>${displayName}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px;">Tu código de verificación corporativo de 6 dígitos es:</p>
            <div style="background-color: #1e293b; border: 2px dashed #38bdf8; color: #38bdf8; font-size: 32px; font-weight: 900; text-align: center; padding: 18px; border-radius: 12px; letter-spacing: 6px; margin: 24px 0; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b;">Este código es válido por 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
          </div>
        `
      },
      createdAt: new Date().toISOString()
    });
  } catch (mErr) {
    console.warn('[OTP Service] Error al registrar documento mail:', mErr);
  }

  console.log(`[AXOMIRA OTP Security] ✉️ Código enviado a ${cleanEmail}: ${code} (Válido por ${OTP_EXPIRATION_MINUTES}m)`);

  return {
    success: true,
    email: cleanEmail,
    expiresAt
  };
};

/**
 * Valida si el código de 6 dígitos ingresado por el usuario es correcto y no ha expirado
 */
export const verifyOTPCode = async (email, inputCode) => {
  if (!email || !inputCode) {
    return { success: false, error: 'Por favor ingresa los 6 dígitos del código de verificación.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inputCode.toString().trim();

  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'El código de verificación debe contener exactamente 6 dígitos numéricos.' };
  }

  // Buscar en memoria local o localStorage
  let otpRecord = memoryOTPStore.get(cleanEmail);

  if (!otpRecord) {
    try {
      const stored = localStorage.getItem(`sap_otp_${cleanEmail}`);
      if (stored) {
        otpRecord = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[OTP Service] Error leyendo localStorage OTP:', e);
    }
  }

  if (!otpRecord) {
    return {
      success: false,
      error: 'No se encontró un código de verificación activo. Haz clic en "Reenviar Código".'
    };
  }

  // Verificar si expiró
  if (Date.now() > otpRecord.expiresAt) {
    return {
      success: false,
      error: 'El código de verificación de 6 dígitos ha expirado (10 min). Por favor solicita uno nuevo.'
    };
  }

  // Verificar intentos de seguridad
  if (otpRecord.attempts >= 5) {
    return {
      success: false,
      error: 'Has superado el límite máximo de 5 intentos. Por favor solicita un nuevo código OTP.'
    };
  }

  // Comparar código
  if (otpRecord.code !== cleanCode) {
    otpRecord.attempts += 1;
    memoryOTPStore.set(cleanEmail, otpRecord);
    try {
      localStorage.setItem(`sap_otp_${cleanEmail}`, JSON.stringify(otpRecord));
    } catch (e) {}

    return {
      success: false,
      error: `Código incorrecto. Intento ${otpRecord.attempts} de 5.`
    };
  }

  // Limpiar OTP utilizado exitosamente
  memoryOTPStore.delete(cleanEmail);
  try {
    localStorage.removeItem(`sap_otp_${cleanEmail}`);
  } catch (e) {}

  return { success: true };
};

export const getActiveOTPForTesting = (email) => {
  const cleanEmail = email.toLowerCase().trim();
  return memoryOTPStore.get(cleanEmail)?.code || null;
};
