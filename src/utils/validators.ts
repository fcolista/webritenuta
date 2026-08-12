import type { Prestatore, Committente, PrestazioneItem } from '../types';

export function isValidCodiceFiscale(cf: string): boolean {
  if (!cf) return false;
  const cleanCF = cf.trim().toUpperCase();
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  return cfRegex.test(cleanCF);
}

export function isValidPartitaIva(piva: string): boolean {
  if (!piva) return false;
  const cleanPIVA = piva.trim();
  const pivaRegex = /^[0-9]{11}$/;
  return pivaRegex.test(cleanPIVA);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePrestatore(prestatore: Prestatore): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!prestatore.nome?.trim()) {
    errors.push({ field: 'nome', message: 'Il nome del prestatore è obbligatorio.' });
  }
  if (!prestatore.cognome?.trim()) {
    errors.push({ field: 'cognome', message: 'Il cognome del prestatore è obbligatorio.' });
  }
  if (!prestatore.codiceFiscale?.trim()) {
    errors.push({ field: 'codiceFiscale', message: 'Il Codice Fiscale del prestatore è obbligatorio.' });
  } else if (!isValidCodiceFiscale(prestatore.codiceFiscale)) {
    errors.push({ field: 'codiceFiscale', message: 'Il Codice Fiscale del prestatore non ha un formato valido (16 caratteri alfanumerici).' });
  }
  if (prestatore.partitaIva?.trim() && !isValidPartitaIva(prestatore.partitaIva)) {
    errors.push({ field: 'partitaIva', message: 'La Partita IVA del prestatore deve contenere 11 cifre numeriche.' });
  }
  return errors;
}

export function validateCommittente(committente: Committente): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!committente.denominazione?.trim()) {
    errors.push({ field: 'denominazione', message: 'La denominazione del committente è obbligatoria.' });
  }
  if (!committente.partitaIva?.trim() && !committente.codiceFiscale?.trim()) {
    errors.push({ field: 'partitaIva', message: 'Inserire la Partita IVA o il Codice Fiscale del committente.' });
  }
  if (committente.partitaIva?.trim() && !isValidPartitaIva(committente.partitaIva)) {
    errors.push({ field: 'partitaIva', message: 'La Partita IVA del committente deve essere di 11 cifre.' });
  }
  return errors;
}

export function validateReceipt(data: {
  numero: string;
  data: string;
  oggetto: string;
  committente: Committente;
  prestatore: Prestatore;
  prestazioni: PrestazioneItem[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.numero?.trim()) {
    errors.push({ field: 'numero', message: 'Il numero di documento è obbligatorio.' });
  }
  if (!data.data?.trim()) {
    errors.push({ field: 'data', message: 'La data del documento è obbligatoria.' });
  }
  if (!data.oggetto?.trim()) {
    errors.push({ field: 'oggetto', message: "L'oggetto della ritenuta è obbligatorio (es. Consulenza informatica)." });
  }

  // Prestatore validation
  errors.push(...validatePrestatore(data.prestatore));

  // Committente validation
  errors.push(...validateCommittente(data.committente));

  // Prestazioni validation
  if (!data.prestazioni || data.prestazioni.length === 0) {
    errors.push({ field: 'prestazioni', message: 'Aggiungere almeno una prestazione o servizio.' });
  } else {
    data.prestazioni.forEach((p, idx) => {
      if (!p.descrizione?.trim()) {
        errors.push({ field: `prestazione_${idx}`, message: `Inserire la descrizione per la prestazione #${idx + 1}.` });
      }
      if (isNaN(p.importo) || p.importo < 0) {
        errors.push({ field: `prestazione_importo_${idx}`, message: `L'importo della prestazione #${idx + 1} deve essere un valore numerico valido maggior o uguale a 0.` });
      }
    });
  }

  return errors;
}
