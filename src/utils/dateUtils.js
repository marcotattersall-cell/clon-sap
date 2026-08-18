/**
 * Utilidad Global para Formateo de Fechas en Formato dd-MM-yyyy
 */
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'null' || dateStr === 'undefined') {
    return 'N/A';
  }

  // Si ya viene con formato dd-MM-yyyy o dd/MM/yyyy
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(String(dateStr))) {
    return String(dateStr).replace(/\//g, '-').substring(0, 10);
  }

  // Si viene en formato YYYY-MM-DD o ISO string YYYY-MM-DDTHH:mm:ss...
  const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${dd}-${mm}-${yyyy}`;
  }

  return String(dateStr);
};
