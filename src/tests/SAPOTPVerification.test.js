import { describe, it, expect, beforeEach } from 'vitest';
import { generate6DigitCode, generateAndSendOTP, verifyOTPCode } from '../services/otpVerificationService';

describe('Servicio de Verificación de Seguridad OTP (6 Dígitos)', () => {
  const testEmail = 'test.user@axomira-erp.com';

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('debe generar un código aleatorio criptográfico de exactamente 6 dígitos numéricos', () => {
    const code = generate6DigitCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('debe generar y almacenar un código OTP activo para un usuario registrado', async () => {
    const otpRes = await generateAndSendOTP(testEmail, 'Test User');
    expect(otpRes.success).toBe(true);
    expect(otpRes.email).toBe(testEmail);
    expect(otpRes.code).toHaveLength(6);
    expect(otpRes.expiresAt).toBeGreaterThan(Date.now());
  });

  it('debe validar exitosamente cuando el usuario ingresa el código correcto de 6 dígitos', async () => {
    const otpRes = await generateAndSendOTP(testEmail, 'Test User');
    const validCode = otpRes.code;

    const verifyRes = await verifyOTPCode(testEmail, validCode);
    expect(verifyRes.success).toBe(true);
  });

  it('debe rechazar la verificación ante códigos incorrectos o incompletos', async () => {
    await generateAndSendOTP(testEmail, 'Test User');

    // Código con menos de 6 dígitos
    const shortRes = await verifyOTPCode(testEmail, '1234');
    expect(shortRes.success).toBe(false);
    expect(shortRes.error).toContain('exactamente 6 dígitos');

    // Código incorrecto de 6 dígitos
    const wrongRes = await verifyOTPCode(testEmail, '000000');
    expect(wrongRes.success).toBe(false);
    expect(wrongRes.error).toContain('Código incorrecto');
  });

  it('debe bloquear la verificación tras superar el límite de 5 intentos fallidos', async () => {
    await generateAndSendOTP(testEmail, 'Test User');

    for (let i = 0; i < 5; i++) {
      await verifyOTPCode(testEmail, '999999');
    }

    const blockedRes = await verifyOTPCode(testEmail, '999999');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.error).toContain('límite máximo de 5 intentos');
  });
});
