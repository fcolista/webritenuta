import type { 
  AppSettings, 
  Receipt, 
  BackupData, 
  TaxConfig, 
  NumberingConfig, 
  Prestatore, 
  Committente 
} from '../types';

const SETTINGS_KEY = 'webritenuta_settings_v1';
const RECEIPTS_KEY = 'webritenuta_receipts_v1';

export const DEFAULT_PRESTATORE: Prestatore = {
  nome: '',
  cognome: '',
  codiceFiscale: '',
  partitaIva: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  nazione: 'Italia',
  iban: '',
  email: '',
  telefono: '',
  altriDatiFiscali: '',
};

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  ritenutaPercentuale: 20,
  hasContributoPrevidenziale: false,
  contributoLabel: 'Rivalsa INPS (4%)',
  contributoPercentuale: 4,
  contributoInclusoInBaseRitenuta: true,
  hasMarcaDaBollo: true,
  marcaDaBolloImporto: 2.00,
  marcaDaBolloSoglia: 77.47,
  marcaDaBolloAddebito: 'committente',
  altreVoci: [],
};

export const DEFAULT_NUMBERING_CONFIG: NumberingConfig = {
  prefisso: `${new Date().getFullYear()}/`,
  suffisso: '',
  numeroProssimo: 1,
  cifreMinime: 3,
};

export const DEFAULT_COMMITTENTE_SAMPLE: Committente = {
  id: 'comm_default_1',
  denominazione: 'DATAITALIA',
  denominazioneSeconda: 'Servizi per l’informatica s.r.l.',
  indirizzo: 'Via di Grotta Perfetta, 556',
  cap: '00142',
  citta: 'Roma',
  provincia: 'RM',
  nazione: 'Italia',
  partitaIva: '04623591006',
  codiceFiscale: '04623591006',
};

export const DEFAULT_SETTINGS: AppSettings = {
  prestatore: DEFAULT_PRESTATORE,
  taxConfig: DEFAULT_TAX_CONFIG,
  numberingConfig: DEFAULT_NUMBERING_CONFIG,
  committenti: [DEFAULT_COMMITTENTE_SAMPLE],
  defaultCommittenteId: DEFAULT_COMMITTENTE_SAMPLE.id,
  firmaBase64: null,
  themeColor: 'blue',
  profiles: [],
  activeProfileId: undefined,
};

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
  try {
    const dataStr = localStorage.getItem(SETTINGS_KEY);
    if (!dataStr) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(dataStr);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themeColor: parsed.themeColor || 'blue',
      profiles: parsed.profiles || [],
      prestatore: { ...DEFAULT_PRESTATORE, ...(parsed.prestatore || {}) },
      taxConfig: { ...DEFAULT_TAX_CONFIG, ...(parsed.taxConfig || {}) },
      numberingConfig: { ...DEFAULT_NUMBERING_CONFIG, ...(parsed.numberingConfig || {}) },
      committenti: parsed.committenti || [DEFAULT_COMMITTENTE_SAMPLE],
    };
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}


/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}

/**
 * Load all receipts from localStorage
 */
export function loadReceipts(): Receipt[] {
  try {
    const dataStr = localStorage.getItem(RECEIPTS_KEY);
    if (!dataStr) return [];
    return JSON.parse(dataStr);
  } catch (err) {
    console.error('Error loading receipts:', err);
    return [];
  }
}

/**
 * Save all receipts to localStorage
 */
export function saveReceipts(receipts: Receipt[]): void {
  try {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  } catch (err) {
    console.error('Error saving receipts:', err);
  }
}

/**
 * Save single receipt (insert or update)
 */
export function saveReceipt(receipt: Receipt): Receipt[] {
  const receipts = loadReceipts();
  const index = receipts.findIndex((r) => r.id === receipt.id);
  if (index >= 0) {
    receipts[index] = { ...receipt, updatedAt: new Date().toISOString() };
  } else {
    receipts.unshift(receipt);
  }
  saveReceipts(receipts);
  return receipts;
}

/**
 * Delete receipt by ID
 */
export function deleteReceipt(id: string): Receipt[] {
  const receipts = loadReceipts().filter((r) => r.id !== id);
  saveReceipts(receipts);
  return receipts;
}

/**
 * Export full backup as JSON string
 */
export function exportBackupData(): string {
  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    settings: loadSettings(),
    receipts: loadReceipts(),
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Import backup data from JSON string
 */
export function importBackupData(jsonString: string): boolean {
  try {
    const backup: BackupData = JSON.parse(jsonString);
    if (!backup.settings || !Array.isArray(backup.receipts)) {
      throw new Error('Formato backup non valido');
    }
    saveSettings(backup.settings);
    saveReceipts(backup.receipts);
    return true;
  } catch (err) {
    console.error('Error importing backup:', err);
    return false;
  }
}
