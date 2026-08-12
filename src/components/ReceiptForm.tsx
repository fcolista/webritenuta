import React, { useState, useEffect } from 'react';
import type { 
  Receipt, 
  AppSettings, 
  PrestazioneItem, 
  Committente, 
  ValidationError,
  PaymentStatus 
} from '../types';
import { calculateTax, convertNetToGross } from '../services/taxEngine';
import { validateReceipt } from '../utils/validators';
import { formatCurrency, getTodayISO, generateDocumentNumber } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Eye, 
  FileText, 
  AlertTriangle, 
  Building2, 
  Hash, 
  FileCode,
  RefreshCw,
  Sliders,
  Check,
  Tag,
  Globe,
  DollarSign
} from 'lucide-react';
import { downloadReceiptPDF } from '../services/pdfGenerator';

interface ReceiptFormProps {
  initialReceipt?: Receipt | null;
  settings: AppSettings;
  onSave: (receipt: Receipt) => void;
  onPreview: (receipt: Receipt) => void;
  onCancel: () => void;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  initialReceipt,
  settings,
  onSave,
  onPreview,
  onCancel,
}) => {
  // Document state
  const [numero, setNumero] = useState<string>(
    initialReceipt?.numero || generateDocumentNumber(settings.numberingConfig)
  );
  const [data, setData] = useState<string>(initialReceipt?.data || getTodayISO());
  const [oggetto, setOggetto] = useState<string>(
    initialReceipt?.oggetto || 'Consulenza informatica e supporto tecnico'
  );
  const [note, setNote] = useState<string>(initialReceipt?.note || '');
  const [statoPagamento, setStatoPagamento] = useState<PaymentStatus>(
    initialReceipt?.statoPagamento || 'in_attesa'
  );
  const [dataScadenza] = useState<string>(initialReceipt?.dataScadenza || '');
  const [dataIncasso] = useState<string>(initialReceipt?.dataIncasso || '');
  const [tagProgetto, setTagProgetto] = useState<string>(initialReceipt?.tagProgetto || '');
  const [linguaDocumento, setLinguaDocumento] = useState<'it' | 'en'>(
    initialReceipt?.linguaDocumento || settings.defaultLanguage || 'it'
  );

  // Committente state
  const [selectedCommittenteId, setSelectedCommittenteId] = useState<string>(
    initialReceipt?.committente?.id || settings.defaultCommittenteId || settings.committenti[0]?.id || ''
  );
  const [committenteForm, setCommittenteForm] = useState<Committente>(
    initialReceipt?.committente || settings.committenti[0] || {
      id: 'comm_' + Date.now(),
      denominazione: '',
      denominazioneSeconda: '',
      indirizzo: '',
      cap: '',
      citta: '',
      provincia: '',
      nazione: 'Italia',
      partitaIva: '',
      codiceFiscale: '',
    }
  );

  // Prestazioni state
  const [prestazioni, setPrestazioni] = useState<PrestazioneItem[]>(
    initialReceipt?.prestazioni || [
      { id: 'item_1', descrizione: 'Consulenza informatica', importo: 500 },
      { id: 'item_2', descrizione: 'Supporto tecnico sistemistico', importo: 300 },
    ]
  );

  // Tax config state (local override possible per receipt)
  const [taxConfig, setTaxConfig] = useState(initialReceipt?.taxConfig || settings.taxConfig);
  const [showTaxSettingsModal, setShowTaxSettingsModal] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Sync selected committente from dropdown
  const handleCommittenteSelect = (id: string) => {
    setSelectedCommittenteId(id);
    const found = settings.committenti.find((c) => c.id === id);
    if (found) {
      setCommittenteForm(found);
    }
  };

  // Recalculate tax results
  const taxResult = calculateTax(prestazioni, taxConfig);

  // Auto regenerate document number
  const handleRegenerateNumber = () => {
    setNumero(generateDocumentNumber(settings.numberingConfig));
  };

  // Prestazione items handlers
  const handleAddPrestazione = () => {
    const newItem: PrestazioneItem = {
      id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
      descrizione: '',
      importo: 0,
    };
    setPrestazioni([...prestazioni, newItem]);
  };

  const handleUpdatePrestazione = (id: string, field: keyof PrestazioneItem, value: any) => {
    setPrestazioni(
      prestazioni.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePrestazione = (id: string) => {
    if (prestazioni.length <= 1) {
      alert('È necessario inserire almeno una prestazione.');
      return;
    }
    setPrestazioni(prestazioni.filter((p) => p.id !== id));
  };

  const handleMovePrestazione = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= prestazioni.length) return;
    const items = [...prestazioni];
    const temp = items[index];
    items[index] = items[newIdx];
    items[newIdx] = temp;
    setPrestazioni(items);
  };

  // Build complete Receipt object
  const getReceiptObject = (): Receipt => {
    return {
      id: initialReceipt?.id || 'rec_' + Date.now(),
      numero,
      data,
      oggetto,
      committente: committenteForm,
      prestatore: settings.prestatore,
      prestazioni,
      taxConfig,
      taxResult,
      note,
      firmaBase64: settings.firmaBase64,
      statoPagamento,
      dataScadenza: dataScadenza || undefined,
      dataIncasso: dataIncasso || undefined,
      tagProgetto: tagProgetto.trim() || undefined,
      linguaDocumento,
      createdAt: initialReceipt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Validate on change if user already attempted save
  useEffect(() => {
    if (hasAttemptedSave) {
      const receiptObj = getReceiptObject();
      setErrors(validateReceipt(receiptObj));
    }
  }, [numero, data, oggetto, committenteForm, prestazioni, settings.prestatore]);

  const handleSave = () => {
    setHasAttemptedSave(true);
    const receiptObj = getReceiptObject();
    const validationErrors = validateReceipt(receiptObj);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onSave(receiptObj);
  };

  const handlePreview = () => {
    const receiptObj = getReceiptObject();
    onPreview(receiptObj);
  };

  const handleGeneratePDF = () => {
    setHasAttemptedSave(true);
    const receiptObj = getReceiptObject();
    const validationErrors = validateReceipt(receiptObj);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    downloadReceiptPDF(receiptObj);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {initialReceipt ? `Modifica Ritenuta N. ${initialReceipt.numero}` : 'Nuova Ritenuta d\'Acconto'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inserisci i dati del documento, seleziona il committente e aggiungi le prestazioni.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Anteprima</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salva</span>
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Genera PDF</span>
          </button>
        </div>
      </div>

      {/* Errors Banner */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Correggi i seguenti errori prima di salvare o generare il PDF:</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 pl-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Document Metadata Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Hash className="w-4 h-4 text-blue-600" />
          Dati Documento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numero Documento *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="es. 2026/001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleRegenerateNumber}
                title="Genera progressivo automatico"
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data Documento *
            </label>
            <div className="relative">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Oggetto del Documento *
            </label>
            <input
              type="text"
              value={oggetto}
              onChange={(e) => setOggetto(e.target.value)}
              placeholder="es. Consulenza informatica e supporto"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* New Advanced Metadata Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag size={13} className="text-blue-600" />
              Tag / Progetto Opzionale
            </label>
            <input
              type="text"
              value={tagProgetto}
              onChange={(e) => setTagProgetto(e.target.value)}
              placeholder="es. Sito Web, Consulenza IT"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Globe size={13} className="text-blue-600" />
              Lingua Documento (PDF)
            </label>
            <select
              value={linguaDocumento}
              onChange={(e) => setLinguaDocumento(e.target.value as 'it' | 'en')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
            >
              <option value="it">🇮🇹 Italiano (Default)</option>
              <option value="en">🇬🇧 Inglese (English - International)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              Stato Pagamento
            </label>
            <select
              value={statoPagamento}
              onChange={(e) => setStatoPagamento(e.target.value as PaymentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
            >
              <option value="in_attesa">🟡 In Attesa di Pagamento</option>
              <option value="pagata">🟢 Pagata / Incassata</option>
              <option value="scaduta">🔴 Scaduta / In Ritardo</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Committente Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Dati del Committente (Azienda / Cliente)
          </h3>

          {settings.committenti.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Seleziona salvato:</span>
              <select
                value={selectedCommittenteId}
                onChange={(e) => handleCommittenteSelect(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {settings.committenti.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.denominazione} {c.partitaIva ? `(P.IVA ${c.partitaIva})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Denominazione Azienda / Cliente *
            </label>
            <input
              type="text"
              value={committenteForm.denominazione}
              onChange={(e) => setCommittenteForm({ ...committenteForm, denominazione: e.target.value })}
              placeholder="es. DATAITALIA S.r.l."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seconda riga denominazione (opzionale)
            </label>
            <input
              type="text"
              value={committenteForm.denominazioneSeconda || ''}
              onChange={(e) => setCommittenteForm({ ...committenteForm, denominazioneSeconda: e.target.value })}
              placeholder="es. Servizi per l’informatica"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Indirizzo (Via/Piazza e N.)
            </label>
            <input
              type="text"
              value={committenteForm.indirizzo}
              onChange={(e) => setCommittenteForm({ ...committenteForm, indirizzo: e.target.value })}
              placeholder="es. Via di Grotta Perfetta, 556"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CAP</label>
              <input
                type="text"
                value={committenteForm.cap}
                onChange={(e) => setCommittenteForm({ ...committenteForm, cap: e.target.value })}
                placeholder="00142"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Città</label>
              <input
                type="text"
                value={committenteForm.citta}
                onChange={(e) => setCommittenteForm({ ...committenteForm, citta: e.target.value })}
                placeholder="Roma"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prov.</label>
              <input
                type="text"
                value={committenteForm.provincia}
                onChange={(e) => setCommittenteForm({ ...committenteForm, provincia: e.target.value })}
                placeholder="RM"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Partita IVA / Codice Fiscale *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={committenteForm.partitaIva}
                onChange={(e) => setCommittenteForm({ ...committenteForm, partitaIva: e.target.value })}
                placeholder="P.IVA (11 cifre)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                value={committenteForm.codiceFiscale}
                onChange={(e) => setCommittenteForm({ ...committenteForm, codiceFiscale: e.target.value })}
                placeholder="Cod. Fiscale"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Prestazioni / Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            Prestazioni e Servizi Resi
          </h3>
          <span className="text-xs text-slate-500">
            {prestazioni.length} {prestazioni.length === 1 ? 'riga' : 'righe'}
          </span>
        </div>

        <div className="space-y-3">
          {prestazioni.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-6 text-center text-xs font-bold text-slate-400">
                  #{idx + 1}
                </span>
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMovePrestazione(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === prestazioni.length - 1}
                    onClick={() => handleMovePrestazione(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={item.descrizione}
                  onChange={(e) => handleUpdatePrestazione(item.id, 'descrizione', e.target.value)}
                  placeholder="Descrizione della prestazione o del rimborso spesa"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="w-full sm:w-56 shrink-0">
                <select
                  value={item.tipoItem || 'prestazione'}
                  onChange={(e) => handleUpdatePrestazione(item.id, 'tipoItem', e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium outline-none"
                >
                  <option value="prestazione">💼 Prestazione (Lordo)</option>
                  <option value="prestazione_netto">💵 Prestazione (Netto Concordato)</option>
                  <option value="rimborso_spesa">🚗 Rimborso Spesa (Esente Ritenuta)</option>
                </select>
              </div>

              <div className="w-full sm:w-36 shrink-0">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.importo === 0 ? '' : item.importo}
                    onChange={(e) =>
                      handleUpdatePrestazione(item.id, 'importo', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0,00"
                    className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                  />
                </div>
                {item.tipoItem === 'prestazione_netto' && item.importo > 0 && (
                  <p className="text-[10px] text-blue-600 font-semibold text-right mt-1">
                    Equivalent Lordo: {formatCurrency(convertNetToGross(item.importo, taxConfig))}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemovePrestazione(item.id)}
                title="Elimina riga"
                className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors self-end sm:self-center shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddPrestazione}
          className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-blue-600 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Aggiungi prestazione
        </button>
      </div>

      {/* 4. Live Tax Breakdown Summary & Config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Calcolo Ritenuta d'Acconto e Riepilogo Fiscale
          </h3>
          <button
            type="button"
            onClick={() => setShowTaxSettingsModal(!showTaxSettingsModal)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configura aliquote e marche</span>
          </button>
        </div>

        {/* Local Tax Rules Quick Adjustment Drawer */}
        {showTaxSettingsModal && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800">Opzioni di calcolo per questa ritenuta:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">% Ritenuta d'acconto</label>
                <input
                  type="number"
                  value={taxConfig.ritenutaPercentuale}
                  onChange={(e) => setTaxConfig({ ...taxConfig, ritenutaPercentuale: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chkInps"
                  checked={taxConfig.hasContributoPrevidenziale}
                  onChange={(e) => setTaxConfig({ ...taxConfig, hasContributoPrevidenziale: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="chkInps" className="text-slate-700 font-medium cursor-pointer">
                  Applica Rivalsa INPS (4%)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chkBollo"
                  checked={taxConfig.hasMarcaDaBollo}
                  onChange={(e) => setTaxConfig({ ...taxConfig, hasMarcaDaBollo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="chkBollo" className="text-slate-700 font-medium cursor-pointer">
                  Marca da bollo (€ 2,00 &gt; € 77,47)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Calculation Table */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600 font-medium">Totale compensi lordi:</span>
            <span className="font-bold text-slate-900">{formatCurrency(taxResult.totaleCompensi)}</span>
          </div>

          {taxConfig.hasContributoPrevidenziale && taxResult.contributoPrevidenziale > 0 && (
            <div className="flex justify-between items-center py-1 text-slate-700">
              <span className="text-xs font-medium">{taxConfig.contributoLabel || 'Contributo Previdenziale'}:</span>
              <span className="font-semibold">{formatCurrency(taxResult.contributoPrevidenziale)}</span>
            </div>
          )}

          {taxResult.baseImponibileRitenuta !== taxResult.totaleCompensi && (
            <div className="flex justify-between items-center py-1 text-slate-500 text-xs italic">
              <span>Base imponibile della ritenuta:</span>
              <span>{formatCurrency(taxResult.baseImponibileRitenuta)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 text-amber-700">
            <span className="font-medium">Ritenuta d'acconto ({taxConfig.ritenutaPercentuale}%):</span>
            <span className="font-bold">- {formatCurrency(taxResult.ritenutaImporto)}</span>
          </div>

          {taxResult.marcaDaBollo > 0 && (
            <div className="flex justify-between items-center py-1 text-slate-600 text-xs">
              <span>Marca da bollo (D.P.R. 642/72):</span>
              <span className="font-semibold">{formatCurrency(taxResult.marcaDaBollo)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-base">TOTALE NETTO DA CORRISPONDERE:</span>
            <span className="font-extrabold text-blue-600 text-xl">{formatCurrency(taxResult.totaleNetto)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Note o diciture aggiuntive nel documento (opzionale)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. Pagamento a mezzo bonifico bancario entro 30 giorni d.f."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Footer Bottom Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Salva Ritenuta</span>
        </button>
      </div>
    </div>
  );
};
