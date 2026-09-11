/**
 * Servicio Transaccional de Correo Electrónico vía Resend API
 * despacha códigos OTP de 6 dígitos a cualquier casilla (iCloud, Gmail, Outlook, etc.)
 */

export const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
export const DEFAULT_FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'AXOMIRA ERP <onboarding@resend.dev>';

/**
 * Envia un correo electrónico con el código OTP de 6 dígitos utilizando Resend REST API
 */
export const sendOTPCodeEmail = async ({ toEmail, displayName = 'Usuario ERP', code }) => {
  if (!toEmail) {
    throw new Error('Correo destinatario requerido para enviar el código OTP.');
  }
  if (!code) {
    throw new Error('Código OTP numérico de 6 dígitos requerido.');
  }

  const cleanEmail = toEmail.toLowerCase().trim();
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Resend Service] ⚠️ VITE_RESEND_API_KEY no configurada en .env.local. Registrando documento de respaldo en Firestore...');
    return {
      success: false,
      reason: 'MISSING_API_KEY',
      message: 'Falta configurar VITE_RESEND_API_KEY en .env.local'
    };
  }

  const payload = {
    from: DEFAULT_FROM_EMAIL,
    to: [cleanEmail],
    subject: `🔑 Tu Código de Verificación: ${code} — AXOMIRA ERP`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Código de Verificación AXOMIRA ERP</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090d16; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                <!-- Header Icon & Brand -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background-color: #0284c7; padding: 12px 20px; border-radius: 12px; font-weight: 900; color: #ffffff; font-size: 18px; letter-spacing: 1px;">
                      AXOMIRA ERP
                    </div>
                    <div style="font-size: 11px; font-family: monospace; color: #38bdf8; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                      Intelligent Cloud ERP System
                    </div>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <h1 style="color: #f8fafc; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
                      Código de Verificación de Registro
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                      Hola <strong style="color: #f1f5f9;">${displayName}</strong>, bienvenido al Portal Corporativo de AXOMIRA. Utiliza el siguiente código de 6 dígitos para verificar tu cuenta:
                    </p>
                  </td>
                </tr>

                <!-- OTP Code Box -->
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px dashed #0284c7; border-radius: 16px; padding: 20px 30px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #38bdf8; letter-spacing: 8px; display: block;">
                        ${code}
                      </span>
                    </div>
                    <div style="font-size: 12px; color: #38bdf8; font-weight: 600; margin-top: 10px;">
                      ⏱️ Válido por 10 minutos
                    </div>
                  </td>
                </tr>

                <!-- Instruction Details -->
                <tr>
                  <td style="background-color: #1e293b; border-radius: 12px; padding: 16px; text-align: left; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                    📌 <strong>Instrucción de Seguridad:</strong> Copia los 6 dígitos o escríbelos directamente en la pantalla de verificación del ERP. Si no has solicitado esta cuenta, puedes ignorar este mensaje.
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="text-align: center; padding-top: 28px; border-top: 1px solid #1e293b; margin-top: 24px;">
                    <p style="font-size: 11px; color: #64748b; margin: 0;">
                      AXOMIRA Enterprise ERP Platform • Sistema Seguro Multi-Inquilino
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`[Resend Service] ✉️ Correo OTP enviado exitosamente a ${cleanEmail}. Resend ID: ${data.id}`);
      return { success: true, resendId: data.id };
    } else if (res.status === 403 && data?.message?.includes('marco.tattersall@gmail.com')) {
      console.warn('[Resend Service Guard] ⚠️ Resend Modo Prueba (Sandbox) detectado. Redirigiendo despacho a marco.tattersall@gmail.com...');
      const fallbackPayload = {
        ...payload,
        to: ['marco.tattersall@gmail.com'],
        subject: `🔑 [RESEND MODALIDAD PRUEBA → Destino: ${cleanEmail}] Código OTP: ${code}`
      };
      const fallbackRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fallbackPayload)
      });
      const fallbackData = await fallbackRes.json();
      if (fallbackRes.ok) {
        console.log(`[Resend Service Guard] 🚀 Correo OTP de prueba enviado a marco.tattersall@gmail.com (ID: ${fallbackData.id})`);
        return { success: true, resendId: fallbackData.id, isSandboxFallback: true, originalRecipient: cleanEmail };
      }
      return { success: false, error: fallbackData.message || 'Error en respaldo Sandbox', data: fallbackData };
    } else {
      console.warn('[Resend Service] ⚠️ Resend devolvió error:', data);
      return { success: false, error: data.message || 'Error en envío Resend', data };
    }
  } catch (err) {
    console.error('[Resend Service] ❌ Error de red al contactar Resend API:', err);
    return { success: false, error: err.message };
  }
};
