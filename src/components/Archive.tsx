import React, { useState } from 'react';
import type { Receipt, ViewMode, ThemeColor } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { downloadReceiptPDF } from '../services/pdfGenerator';
import { exportReceiptsToCSV, exportFiscalPDFReport } from '../services/reportExporter';
import { 
  Search, 
  FolderArchive, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Download, 
  Plus, 
  Building2, 
  Calendar,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ArchiveProps {
  receipts: Receipt[];
  themeColor?: ThemeColor;
  onNavigate: (view: ViewMode) => void;
  onEdit: (receipt: Receipt) => void;
  onPreview: (receipt: Receipt) => void;
  onDuplicate: (receipt: Receipt) => void;
  onDelete: (id: string) => void;
}

export const Archive: React.FC<ArchiveProps> = ({
  receipts,
  themeColor,
  onNavigate,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Extract unique years and tags
  const years = Array.from(
    new Set(receipts.map((r) => r.data?.substring(0, 4)).filter(Boolean))
  ).sort().reverse();

  const tags = Array.from(
    new Set(receipts.map((r) => r.tagProgetto).filter(Boolean) as string[])
  );

  const filteredReceipts = receipts.filter((receipt) => {
    // Search text query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesText =
        (receipt.numero || '').toLowerCase().includes(query) ||
        (receipt.data || '').toLowerCase().includes(query) ||
        (formatDate(receipt.data) || '').toLowerCase().includes(query) ||
        (receipt.committente?.denominazione || '').toLowerCase().includes(query) ||
        (receipt.oggetto || '').toLowerCase().includes(query) ||
        (receipt.tagProgetto || '').toLowerCase().includes(query);

      if (!matchesText) return false;
    }

    // Year filter
    if (selectedYear !== 'all') {
      if (!receipt.data || !receipt.data.startsWith(selectedYear)) return false;
    }

    // Payment Status filter
    if (selectedStatus !== 'all') {
      const status = receipt.statoPagamento || 'in_attesa';
      if (status !== selectedStatus) return false;
    }

    // Tag filter
    if (selectedTag !== 'all') {
      if (receipt.tagProgetto !== selectedTag) return false;
    }

    return true;
  });

  const handleDeleteConfirm = (receipt: Receipt) => {
    if (confirm(`Sei sicuro di voler eliminare la ritenuta N. ${receipt.numero} del ${formatDate(receipt.data)}?`)) {
      onDelete(receipt.id);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600" />
            Archivio Ritenute d'Acconto
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestisci l'archivio, esporta report fiscali in Excel/PDF per il commercialista ed imposta lo stato degli incassi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportReceiptsToCSV(filteredReceipts, selectedYear)}
            title="Esporta elenco in CSV / Excel per il commercialista"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => exportFiscalPDFReport(filteredReceipts, selectedYear)}
            title="Genera Report Fiscale PDF Annua per Modello 730 / Redditi PF"
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-slate-600" />
            <span>Report PDF</span>
          </button>

          <button
            onClick={() => onNavigate('new-receipt')}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Ritenuta</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per numero, data, committente, oggetto o tag..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          {(searchQuery || selectedYear !== 'all' || selectedStatus !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedYear('all');
                setSelectedStatus('all');
                setSelectedTag('all');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 bg-slate-100 rounded-lg cursor-pointer shrink-0"
            >
              Azzera Filtri
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Anno Solare</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none font-medium"
            >
              <option value="all">📅 Tutti gli Anni</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Anno {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stato Incasso</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none font-medium"
            >
              <option value="all">💳 Tutti gli Stati</option>
              <option value="in_attesa">🟡 In Attesa di Pagamento</option>
              <option value="pagata">🟢 Pagate / Incassate</option>
              <option value="scaduta">🔴 Scadute / In Ritardo</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tag Progetto</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none font-medium"
            >
              <option value="all">🏷️ Tutti i Tag</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Archive Items Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderArchive className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-800 text-base">
              Nessuna ritenuta trovata
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Nessun risultato corrispondente ai filtri selezionali.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReceipts.map((receipt) => {
              const status = receipt.statoPagamento || 'in_attesa';

              return (
                <div
                  key={receipt.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Information */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        N. {receipt.numero}
                      </span>
                      <span className="text-xs text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(receipt.data)}
                      </span>

                      {/* Payment Status Badge */}
                      {status === 'pagata' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          <CheckCircle2 size={12} /> Pagata
                        </span>
                      )}
                      {status === 'scaduta' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          <AlertCircle size={12} /> Scaduta
                        </span>
                      )}
                      {status === 'in_attesa' && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                          <Clock size={12} /> In Attesa
                        </span>
                      )}

                      {/* Tag Progetto Badge */}
                      {receipt.tagProgetto && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-md font-semibold">
                          <Tag size={11} /> {receipt.tagProgetto}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{receipt.committente?.denominazione}</span>
                      {receipt.committente?.partitaIva && (
                        <span className="text-slate-400 text-xs">(P.IVA {receipt.committente.partitaIva})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                      <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>"{receipt.oggetto}"</span>
                    </div>
                  </div>

                  {/* Amounts Breakdown */}
                  <div className="flex items-center gap-6 bg-slate-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-100 justify-between lg:justify-end">
                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">Lordo</p>
                      <p className="font-semibold text-slate-700 text-xs">{formatCurrency(receipt.taxResult.totaleCompensi)}</p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-amber-700 uppercase tracking-wider">Ritenuta 20%</p>
                      <p className="font-semibold text-amber-700 text-xs">{formatCurrency(receipt.taxResult.ritenutaImporto)}</p>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">Netto</p>
                      <p className="font-extrabold text-blue-600 text-sm">{formatCurrency(receipt.taxResult.totaleNetto)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => onPreview(receipt)}
                        title="Anteprima Documento"
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(receipt)}
                        title="Modifica Ritenuta"
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(receipt)}
                        title="Duplica Ritenuta"
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadReceiptPDF(receipt, themeColor)}
                        title="Scarica PDF"
                        className="p-2 text-blue-600 hover:bg-blue-100 bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(receipt)}
                        title="Elimina Ritenuta"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
