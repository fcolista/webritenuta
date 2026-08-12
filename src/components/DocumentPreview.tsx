import React from 'react';
import type { Receipt, ThemeColor } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { downloadReceiptPDF } from '../services/pdfGenerator';
import { Download, Printer, Share2, Edit3, ArrowLeft, Mail } from 'lucide-react';

interface DocumentPreviewProps {
  receipt: Receipt;
  themeColor?: ThemeColor;
  onEdit: (receipt: Receipt) => void;
  onBack: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  receipt,
  themeColor,
  onEdit,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    const toEmail = receipt.committente.email || '';
    const subject = encodeURIComponent(`Ritenuta d'Acconto N. ${receipt.numero} - ${receipt.prestatore.nome} ${receipt.prestatore.cognome}`);
    const body = encodeURIComponent(
      `Spett.le ${receipt.committente.denominazione},\n\n` +
      `In allegato trasmetto la Ritenuta d'Acconto N. ${receipt.numero} del ${formatDate(receipt.data)} relativa a "${receipt.oggetto}".\n\n` +
      `Totale Lordo Compensi: ${formatCurrency(receipt.taxResult.totaleCompensi)}\n` +
      `Ritenuta d'Acconto (20%): -${formatCurrency(receipt.taxResult.ritenutaImporto)}\n` +
      `Totale Netto da Corrispondere: ${formatCurrency(receipt.taxResult.totaleNetto)}\n\n` +
      `Resto a disposizione per qualsiasi chiarimento.\n\n` +
      `Cordiali saluti,\n` +
      `${receipt.prestatore.nome} ${receipt.prestatore.cognome}\n` +
      `${receipt.prestatore.telefono || ''}`
    );
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ritenuta d'Acconto N. ${receipt.numero}`,
          text: `Ritenuta d'Acconto N. ${receipt.numero} del ${formatDate(receipt.data)} per ${receipt.committente.denominazione}`,
        });
      } catch (e) {
        console.log('Share canceled or failed:', e);
      }
    } else {
      alert('La condivisione tramite il sistema operativo non è supportata dal browser in uso. Utilizza il pulsante Scarica PDF.');
    }
  };

  const signatureImg = receipt.firmaBase64 || receipt.prestatore?.altriDatiFiscali;

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Controls Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna indietro</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={() => onEdit(receipt)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>Modifica</span>
          </button>

          <button
            onClick={handleSendEmail}
            title="Invia email precompilata al committente"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Invia Email</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Stampa</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Condividi</span>
            </button>
          )}

          <button
            onClick={() => downloadReceiptPDF(receipt, themeColor)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Scarica PDF</span>
          </button>
        </div>
      </div>

      {/* Visual A4 Document Paper Container */}
      <div className="mx-auto max-w-[800px] bg-white border border-slate-300 rounded-lg shadow-xl p-8 sm:p-12 text-slate-800 text-sm leading-relaxed select-text print:shadow-none print:border-none print:p-0">
        
        {/* Document Header Accent */}
        <div className="h-1 bg-blue-600 mb-8 rounded-full"></div>

        {/* Header Title & Date Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
              RITENUTA D'ACCONTO
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Documento per prestazioni di lavoro autonomo occasionale
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
            <p className="text-base font-bold text-slate-900">
              Numero: <span className="text-blue-600">{receipt.numero}</span>
            </p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Data: {formatDate(receipt.data)}
            </p>
          </div>
        </div>

        {/* Committente & Prestatore Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Committente Box */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              COMMITTENTE (Spett.le)
            </p>
            <p className="font-bold text-slate-900 text-base">{receipt.committente.denominazione}</p>
            {receipt.committente.denominazioneSeconda && (
              <p className="text-xs font-medium text-slate-700">{receipt.committente.denominazioneSeconda}</p>
            )}
            <p className="text-xs text-slate-600">{receipt.committente.indirizzo}</p>
            <p className="text-xs text-slate-600">
              {receipt.committente.cap} {receipt.committente.citta} ({receipt.committente.provincia}) - {receipt.committente.nazione}
            </p>
            {receipt.committente.partitaIva && (
              <p className="text-xs font-semibold text-slate-700 pt-1">
                P.IVA: {receipt.committente.partitaIva}
              </p>
            )}
            {receipt.committente.codiceFiscale && receipt.committente.codiceFiscale !== receipt.committente.partitaIva && (
              <p className="text-xs text-slate-600">
                C.F.: {receipt.committente.codiceFiscale}
              </p>
            )}
          </div>

          {/* Prestatore Box */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              PRESTATORE D'OPERA
            </p>
            <p className="font-bold text-slate-900 text-base">
              {receipt.prestatore.nome} {receipt.prestatore.cognome}
            </p>
            <p className="text-xs font-medium text-slate-700">
              Codice Fiscale: <span className="font-mono">{receipt.prestatore.codiceFiscale}</span>
            </p>
            {receipt.prestatore.partitaIva && (
              <p className="text-xs text-slate-600">P.IVA: {receipt.prestatore.partitaIva}</p>
            )}
            <p className="text-xs text-slate-600">{receipt.prestatore.indirizzo}</p>
            <p className="text-xs text-slate-600">
              {receipt.prestatore.cap} {receipt.prestatore.citta} ({receipt.prestatore.provincia})
            </p>
            {receipt.prestatore.iban && (
              <p className="text-xs font-semibold text-slate-800 pt-1">
                IBAN: <span className="font-mono text-xs">{receipt.prestatore.iban}</span>
              </p>
            )}
          </div>
        </div>

        {/* Oggetto Box */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 mb-8 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <span className="font-bold text-blue-800 uppercase tracking-wider shrink-0">
            OGGETTO DELLA PRESTAZIONE:
          </span>
          <span className="font-medium text-slate-800 text-sm">{receipt.oggetto}</span>
        </div>

        {/* Prestazioni Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 rounded-tl-lg">Descrizione della Prestazione / Servizio</th>
                <th className="py-3 px-4 text-right rounded-tr-lg w-40">Importo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {receipt.prestazioni.map((p, idx) => (
                <tr key={p.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-3 px-4 font-medium text-slate-800">{p.descrizione}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(p.importo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Breakdown Table */}
        <div className="flex justify-end mb-10">
          <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-bold text-slate-700">Totale compensi lordi:</span>
              <span className="font-bold text-slate-900">{formatCurrency(receipt.taxResult.totaleCompensi)}</span>
            </div>

            {receipt.taxConfig.hasContributoPrevidenziale && receipt.taxResult.contributoPrevidenziale > 0 && (
              <div className="flex justify-between py-1 text-slate-700">
                <span>{receipt.taxConfig.contributoLabel || 'Contributo previdenziale'}:</span>
                <span className="font-semibold">{formatCurrency(receipt.taxResult.contributoPrevidenziale)}</span>
              </div>
            )}

            {receipt.taxResult.baseImponibileRitenuta !== receipt.taxResult.totaleCompensi && (
              <div className="flex justify-between py-1 text-slate-500 italic">
                <span>Base imponibile ritenuta:</span>
                <span>{formatCurrency(receipt.taxResult.baseImponibileRitenuta)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-amber-800">
              <span>Ritenuta d'acconto ({receipt.taxConfig.ritenutaPercentuale}%):</span>
              <span className="font-bold">- {formatCurrency(receipt.taxResult.ritenutaImporto)}</span>
            </div>

            {receipt.taxResult.marcaDaBollo > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Marca da bollo (D.P.R. 642/72):</span>
                <span className="font-semibold">{formatCurrency(receipt.taxResult.marcaDaBollo)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-sm font-extrabold text-blue-700 bg-blue-50/80 p-2 rounded-lg">
              <span>NETTO DA CORRISPONDERE:</span>
              <span className="text-base">{formatCurrency(receipt.taxResult.totaleNetto)}</span>
            </div>
          </div>
        </div>

        {/* Legal Notes & Notes */}
        <div className="border-t border-slate-200 pt-6 space-y-2 text-[11px] text-slate-500 italic">
          <p>Prestazione svolta in regime di lavoro autonomo occasionale ai sensi dell'art. 2222 e segg. del Codice Civile.</p>
          <p>Operazione fuori campo di applicazione IVA ai sensi dell'art. 5 del D.P.R. 633/1972.</p>
          {receipt.taxResult.marcaDaBollo > 0 && (
            <p>Imposta di bollo assolta sull'originale per importi superiori a € 77,47 ai sensi del D.P.R. 642/1972.</p>
          )}
          {receipt.note && <p className="font-medium not-italic text-slate-700 mt-2">Note: {receipt.note}</p>}
        </div>

        {/* Signature Area */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-56 space-y-2">
            <p className="text-xs font-bold text-slate-700">Firma del prestatore</p>
            {signatureImg && signatureImg.startsWith('data:image') ? (
              <div className="h-16 flex items-center justify-center">
                <img src={signatureImg} alt="Firma" className="max-h-14 max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-16 border-b border-dashed border-slate-400"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
