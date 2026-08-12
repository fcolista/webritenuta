import type { Receipt } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export annual receipts summary to CSV file compatible with Excel
 */
export function exportReceiptsToCSV(receipts: Receipt[], yearFilter?: string): void {
  const filtered = receipts.filter((r) => {
    if (!yearFilter || yearFilter === 'all') return true;
    return r.data && r.data.startsWith(yearFilter);
  });

  const headers = [
    'Numero Documento',
    'Data',
    'Committente',
    'P.IVA / C.F. Committente',
    'Oggetto',
    'Totale Compensi Lordi (€)',
    'Rimborsi Spese (€)',
    'Rivalsa INPS 4% (€)',
    'Base Imponibile Ritenuta (€)',
    'Ritenuta d\'Acconto 20% (€)',
    'Marca da Bollo (€)',
    'Totale Netto Incassato (€)',
    'Stato Pagamento',
    'Data Incasso',
    'Tag Progetto',
  ];

  const rows = filtered.map((r) => [
    `"${r.numero || ''}"`,
    `"${formatDate(r.data)}"`,
    `"${(r.committente?.denominazione || '').replace(/"/g, '""')}"`,
    `"${r.committente?.partitaIva || r.committente?.codiceFiscale || ''}"`,
    `"${(r.oggetto || '').replace(/"/g, '""')}"`,
    (r.taxResult.totaleCompensi || 0).toFixed(2).replace('.', ','),
    (r.taxResult.totaleRimborsiSpese || 0).toFixed(2).replace('.', ','),
    (r.taxResult.contributoPrevidenziale || 0).toFixed(2).replace('.', ','),
    (r.taxResult.baseImponibileRitenuta || 0).toFixed(2).replace('.', ','),
    (r.taxResult.ritenutaImporto || 0).toFixed(2).replace('.', ','),
    (r.taxResult.marcaDaBollo || 0).toFixed(2).replace('.', ','),
    (r.taxResult.totaleNetto || 0).toFixed(2).replace('.', ','),
    `"${r.statoPagamento === 'pagata' ? 'Pagata' : r.statoPagamento === 'scaduta' ? 'Scaduta' : 'In attesa'}"`,
    `"${r.dataIncasso ? formatDate(r.dataIncasso) : ''}"`,
    `"${r.tagProgetto || ''}"`,
  ]);

  // UTF-8 BOM for Excel alignment
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Riepilogo_Fiscale_Ritenute_${yearFilter || 'Tutti'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate PDF annual fiscal report summary for accountant / tax declaration (730 / Redditi PF)
 */
export function exportFiscalPDFReport(receipts: Receipt[], yearFilter: string): void {
  const filtered = receipts.filter((r) => {
    if (!yearFilter || yearFilter === 'all') return true;
    return r.data && r.data.startsWith(yearFilter);
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let currentY = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text(`RIEPILOGO FISCALE ANNUALE RITENUTE D'ACCONTO (${yearFilter === 'all' ? 'Tutti gli anni' : 'Anno ' + yearFilter})`, margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento di sintesi prodotto per Modello 730 / Modello Redditi PF - Generato il ${new Date().toLocaleDateString('it-IT')}`, margin, currentY);

  currentY += 8;

  // Aggregated Totals
  const totalCompensi = filtered.reduce((acc, r) => acc + (r.taxResult.totaleCompensi || 0), 0);
  const totalRimborsi = filtered.reduce((acc, r) => acc + (r.taxResult.totaleRimborsiSpese || 0), 0);
  const totalRitenute = filtered.reduce((acc, r) => acc + (r.taxResult.ritenutaImporto || 0), 0);
  const totalNetto = filtered.reduce((acc, r) => acc + (r.taxResult.totaleNetto || 0), 0);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const colW = (pageWidth - margin * 2) / 5;
  doc.text(`N. Ritenute: ${filtered.length}`, margin + 4, currentY + 7);
  doc.text(`Totale Lordo Compensi: ${formatCurrency(totalCompensi)}`, margin + colW + 2, currentY + 7);
  doc.text(`Ritenuta d'Acconto Subita (20%): ${formatCurrency(totalRitenute)}`, margin + colW * 2 + 2, currentY + 7);
  doc.text(`Totale Rimborsi Spese: ${formatCurrency(totalRimborsi)}`, margin + colW * 3 + 2, currentY + 7);
  doc.text(`Totale Netto Percepito: ${formatCurrency(totalNetto)}`, margin + colW * 4 + 2, currentY + 7);

  // Soglia Occasionale Warning
  if (totalCompensi > 5000) {
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.text(`⚠️ Nota: La soglia di € 5.000,00 annui per prestazioni occasionali è stata superata (${formatCurrency(totalCompensi)}). Verificare iscrizione Gestione Separata INPS.`, margin + 4, currentY + 13);
  } else {
    doc.setTextColor(4, 120, 87);
    doc.setFontSize(8);
    doc.text(`✅ Soglia € 5.000,00 annui prestazione occasionale rispettata (Residuo: ${formatCurrency(5000 - totalCompensi)}).`, margin + 4, currentY + 13);
  }

  currentY += 22;

  // Table Data
  const tableData = filtered.map((r) => [
    r.numero,
    formatDate(r.data),
    r.committente?.denominazione || '',
    r.committente?.partitaIva || r.committente?.codiceFiscale || '',
    formatCurrency(r.taxResult.totaleCompensi),
    formatCurrency(r.taxResult.totaleRimborsiSpese || 0),
    formatCurrency(r.taxResult.ritenutaImporto),
    formatCurrency(r.taxResult.marcaDaBollo || 0),
    formatCurrency(r.taxResult.totaleNetto),
    r.statoPagamento === 'pagata' ? 'Pagata' : r.statoPagamento === 'scaduta' ? 'Scaduta' : 'In attesa',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['N. Doc', 'Data', 'Committente', 'P.IVA / C.F.', 'Compenso Lordo', 'Rimborsi Spese', 'Ritenuta (20%)', 'Bollo', 'Netto', 'Stato']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
  });

  doc.save(`Riepilogo_Fiscale_Ritenute_${yearFilter}.pdf`);
}
