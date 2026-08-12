export interface Prestatore {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  partitaIva?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  iban?: string;
  email?: string;
  telefono?: string;
  altriDatiFiscali?: string;
}

export interface Committente {
  id: string;
  denominazione: string;
  denominazioneSeconda?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  partitaIva: string;
  codiceFiscale: string;
  note?: string;
  email?: string;
}

export type ItemType = 'prestazione' | 'prestazione_netto' | 'rimborso_spesa';

export interface PrestazioneItem {
  id: string;
  descrizione: string;
  importo: number; // EUR
  tipoItem?: ItemType; // Default 'prestazione' (Lordo). 'prestazione_netto' auto-calculates gross. 'rimborso_spesa' is exempt ex Art. 15 DPR 633/72.
}

export interface AltraVoce {
  id: string;
  label: string;
  importo: number;
  tipo: 'aggiunta' | 'detrazione';
  soggettaARitenuta: boolean;
}

export interface TaxConfig {
  ritenutaPercentuale: number; // e.g. 20
  hasContributoPrevidenziale: boolean;
  contributoLabel: string; // e.g. "Rivalsa INPS (4%)"
  contributoPercentuale: number; // e.g. 4
  contributoInclusoInBaseRitenuta: boolean; // default true for Rivalsa INPS
  hasMarcaDaBollo: boolean;
  marcaDaBolloImporto: number; // 2.00
  marcaDaBolloSoglia: number; // 77.47
  marcaDaBolloAddebito: 'committente' | 'prestatore'; // default 'committente'
  altreVoci: AltraVoce[];
}

export interface TaxCalculationResult {
  totaleCompensi: number; // Sum of prestazione items of type 'prestazione' or calculated gross from 'prestazione_netto'
  totaleRimborsiSpese: number; // Sum of expense reimbursement items (exempt from tax base)
  contributoPrevidenziale: number; // e.g. 4% of totaleCompensi
  baseImponibileRitenuta: number; // totaleCompensi + (if included, contributo) + altreVoci
  ritenutaImporto: number; // e.g. 20% of baseImponibileRitenuta
  marcaDaBollo: number; // 2.00 if applicable
  altreVociTotale: number; // sum of additional items
  totaleLordoDocumento: number; // totaleCompensi + totaleRimborsiSpese + contributo
  totaleNetto: number; // Importo netto da corrispondere al prestatore
}

export interface NumberingConfig {
  prefisso: string; // e.g. "2026/"
  suffisso: string;
  numeroProssimo: number; // e.g. 1
  cifreMinime: number; // e.g. 3 -> "001"
}

export type PaymentStatus = 'in_attesa' | 'pagata' | 'scaduta';

export interface Receipt {
  id: string;
  numero: string;
  data: string; // YYYY-MM-DD
  oggetto: string;
  committente: Committente;
  prestatore: Prestatore;
  prestazioni: PrestazioneItem[];
  taxConfig: TaxConfig;
  taxResult: TaxCalculationResult;
  note?: string;
  firmaBase64?: string | null;
  statoPagamento?: PaymentStatus;
  dataScadenza?: string; // YYYY-MM-DD
  dataIncasso?: string; // YYYY-MM-DD
  tagProgetto?: string; // e.g. "Sito Web", "Consulenza IT"
  linguaDocumento?: 'it' | 'en'; // Default 'it'
  createdAt: string;
  updatedAt: string;
}

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'slate' | 'rose';

export interface UserProfile {
  id: string;
  name: string;
  prestatore: Prestatore;
  firmaBase64: string | null;
  themeColor: ThemeColor;
}

export interface GitConfig {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'gitea';
  repoOwner: string;
  repoName: string;
  branch: string;
  token: string;
  apiUrl?: string;
  filePath: string;
  autoSyncOnSave?: boolean;
  lastSyncTimestamp?: string;
}

export interface AppSettings {
  prestatore: Prestatore;
  taxConfig: TaxConfig;
  numberingConfig: NumberingConfig;
  committenti: Committente[];
  defaultCommittenteId?: string;
  firmaBase64: string | null;
  themeColor: ThemeColor;
  profiles: UserProfile[];
  activeProfileId?: string;
  gitConfig?: GitConfig;
  defaultPaymentTermDays?: number; // e.g. 30 days
  defaultLanguage?: 'it' | 'en';
}

export interface BackupData {
  version: number;
  timestamp: string;
  settings: AppSettings;
  receipts: Receipt[];
}

export type ViewMode = 'dashboard' | 'new-receipt' | 'edit-receipt' | 'archive' | 'settings' | 'preview';

export interface ValidationError {
  field: string;
  message: string;
}
