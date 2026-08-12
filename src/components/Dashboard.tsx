import React from 'react';
import type { Receipt, ViewMode, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  TrendingUp, 
  FolderArchive, 
  Building2,
  Calendar,
  Eye,
  Edit3,
  FilePlus,
  AlertCircle,
  DollarSign,
  Download,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { downloadReceiptPDF } from '../services/pdfGenerator';
import { exportReceiptsToCSV } from '../services/reportExporter';

interface DashboardProps {
  receipts: Receipt[];
  settings: AppSettings;
  onNavigate: (view: ViewMode) => void;
  onEditReceipt: (receipt: Receipt) => void;
  onPreviewReceipt: (receipt: Receipt) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  receipts,
  settings,
  onNavigate,
  onEditReceipt,
  onPreviewReceipt,
}) => {
  const currentYearStr = new Date().getFullYear().toString();
  const currentYearReceipts = receipts.filter((r) => r.data && r.data.startsWith(currentYearStr));

  const currentYearGross = currentYearReceipts.reduce((acc, r) => acc + (r.taxResult?.totaleCompensi || 0), 0);
  const totalRitenute = receipts.reduce((acc, r) => acc + (r.taxResult?.ritenutaImporto || 0), 0);
  const totalNetto = receipts.reduce((acc, r) => acc + (r.taxResult?.totaleNetto || 0), 0);

  // Pending payments calculation
  const pendingReceipts = receipts.filter((r) => r.statoPagamento === 'in_attesa' || r.statoPagamento === 'scaduta');
  const pendingNetTotal = pendingReceipts.reduce((acc, r) => acc + (r.taxResult?.totaleNetto || 0), 0);

  // Soglia € 5.000 prestazione occasionale
  const sogliaMax = 5000;
  const percentualeSoglia = Math.min(100, Math.round((currentYearGross / sogliaMax) * 100));

  const recentReceipts = receipts.slice(0, 5);

  const isProfileIncomplete =
    !settings.prestatore.nome ||
    !settings.prestatore.cognome ||
    !settings.prestatore.codiceFiscale;

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {settings.prestatore.nome ? `Bentornato, ${settings.prestatore.nome}` : 'Gestione Ritenute d\'Acconto'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Compila, calcola e genera ritenute d'acconto con PDF professionali pronti per l'invio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReceiptsToCSV(receipts, currentYearStr)}
            title="Esporta foglio Excel per il commercialista"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel {currentYearStr}</span>
          </button>

          <button
            onClick={() => onNavigate('new-receipt')}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Nuova Ritenuta</span>
          </button>
        </div>
      </div>

      {/* Incomplete Profile Alert */}
      {isProfileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">Completa le tue impostazioni personali</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Configura i tuoi dati fiscali (Nome, Cognome, Codice Fiscale, Indirizzo) per generare ritenute corrette.
            </p>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 shrink-0"
          >
            Impostazioni &rarr;
          </button>
        </div>
      )}

      {/* Threshold Monitor Widget (€ 5.000 / Anno Occasionale) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className={currentYearGross > 5000 ? "text-red-600" : "text-emerald-600"} />
            <h3 className="font-semibold text-slate-800 text-sm">
              Soglia Prestazione Occasionale {currentYearStr} (€ 5.000,00)
            </h3>
          </div>
          <span className="text-xs font-extrabold text-slate-700">
            {formatCurrency(currentYearGross)} / {formatCurrency(sogliaMax)} ({percentualeSoglia}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              currentYearGross > 5000
                ? 'bg-red-600'
                : percentualeSoglia > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percentualeSoglia}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {currentYearGross > 5000
              ? '⚠️ Soglia di legge superata! Obbligo iscrizione ed aliquota Gestione Separata INPS.'
              : `Capacità residua nell'anno solare: ${formatCurrency(Math.max(0, sogliaMax - currentYearGross))}`}
          </span>
          <span className="font-medium text-slate-700">{receipts.length} ritenute totali</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lordo {currentYearStr}</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(currentYearGross)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ritenute 20%</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalRitenute)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Netto Incassato</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(totalNetto)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Attesa ({pendingReceipts.length})</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(pendingNetTotal)}</p>
          </div>
        </div>
      </div>

      {/* Recent Receipts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600" />
            Ultime Ritenute d'Acconto Generate
          </h3>
          <button
            onClick={() => onNavigate('archive')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Vedi tutto l'archivio &rarr;
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 text-sm">Non hai ancora creato alcuna ritenuta d'acconto.</p>
            <button
              onClick={() => onNavigate('new-receipt')}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Crea la prima ritenuta</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">
                      N. {receipt.numero}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(receipt.data)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{receipt.committente?.denominazione}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">Netto</p>
                    <p className="font-extrabold text-blue-600 text-sm">
                      {formatCurrency(receipt.taxResult?.totaleNetto || 0)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onPreviewReceipt(receipt)}
                      title="Anteprima Documento"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditReceipt(receipt)}
                      title="Modifica Ritenuta"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadReceiptPDF(receipt, settings.themeColor)}
                      title="Scarica PDF"
                      className="p-2 text-blue-600 hover:bg-blue-100 bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
