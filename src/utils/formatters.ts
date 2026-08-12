import type { NumberingConfig } from '../types';

/**
 * Formats a number as Italian currency: € 1.234,56
 */
export function formatCurrency(amount: number): string {
  const safeVal = isNaN(amount) ? 0 : amount;
  const formattedStr = new Intl.NumberFormat('it-IT', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeVal);
  return `€ ${formattedStr}`;
}

/**
 * Formats ISO date string (YYYY-MM-DD) to Italian date DD/MM/YYYY
 */
export function formatDate(isoDateString?: string): string {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDateString;
}

/**
 * Returns today's date in YYYY-MM-DD ISO format
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates formatted document number based on NumberingConfig
 */
export function generateDocumentNumber(config: NumberingConfig): string {
  const numStr = String(config.numeroProssimo || 1).padStart(config.cifreMinime || 3, '0');
  const pref = config.prefisso || '';
  const suff = config.suffisso || '';
  return `${pref}${numStr}${suff}`;
}
