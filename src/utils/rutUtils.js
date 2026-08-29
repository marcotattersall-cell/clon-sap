/**
 * 🇨🇱 UTILIDADES DE VALIDACIÓN Y FORMATO DE RUT CHILENO (MÓDULO 11)
 * 
 * Cumple con el estándar oficial de validación de Dígito Verificador (DV)
 * y formateo dinámico de RUT en Chile.
 */

/**
 * Limpia y normaliza una cadena de RUT quitando puntos, guiones y espacios.
 */
export const cleanRUT = (rut) => {
  if (typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Formatea un RUT a su representación visual estándar: 12.345.678-K
 */
export const formatChileanRUT = (rut) => {
  const cleaned = cleanRUT(rut);
  if (cleaned.length <= 1) return cleaned;

  const dv = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  // Formatear cuerpo con puntos separadores de miles
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
};

/**
 * Calcula el Dígito Verificador (DV) mediante el algoritmo Módulo 11.
 */
export const calculateDV = (body) => {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = sum % 11;
  const remainder = 11 - mod;

  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
};

/**
 * Valida si un RUT chileno es matemáticamente correcto según Módulo 11.
 * Retorna { isValid, formattedRUT, error }
 */
export const validateChileanRUT = (rut) => {
  const cleaned = cleanRUT(rut);

  if (!cleaned) {
    return { isValid: false, formattedRUT: '', error: 'El RUT no puede estar vacío.' };
  }

  if (cleaned.length < 8 || cleaned.length > 9) {
    return { isValid: false, formattedRUT: rut, error: 'El RUT debe tener entre 7 y 8 dígitos más el dígito verificador (ej: 12.345.678-K).' };
  }

  const givenDV = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  if (!/^\d+$/.test(body)) {
    return { isValid: false, formattedRUT: rut, error: 'El cuerpo del RUT debe contener solo números.' };
  }

  const expectedDV = calculateDV(body);

  if (givenDV !== expectedDV) {
    return {
      isValid: false,
      formattedRUT: formatChileanRUT(rut),
      error: `El RUT ingresado (${formatChileanRUT(rut)}) no es válido. El dígito verificador correcto para ${body} es "${expectedDV}".`
    };
  }

  return {
    isValid: true,
    formattedRUT: formatChileanRUT(rut),
    error: null
  };
};
