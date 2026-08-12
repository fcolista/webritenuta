import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Receipt, ThemeColor } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTheme } from '../utils/theme';
import { loadSettings } from './storage';
import { convertNetToGross } from './taxEngine';

export function generateReceiptPDF(receipt: Receipt, themeColor?: ThemeColor): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isEn = receipt.linguaDocumento === 'en';
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let currentY = margin;

  // Resolve theme color (from parameter or global stored settings)
  const settings = loadSettings();
  const activeColor: ThemeColor = themeColor || settings.themeColor || 'blue';
  const activeTheme = getTheme(activeColor);

  // Colors
  const primaryColor: [number, number, number] = activeTheme.hexPrimary;
  const textColor: [number, number, number] = [30, 41, 59]; // #1e293b
  const lightBgColor: [number, number, number] = [248, 250, 252]; // #f8fafc
  const borderColor: [number, number, number] = [226, 232, 240]; // #e2e8f0

  // 1. Header Title & Doc Info
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 2, 'F');
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text(isEn ? "RECEIPT FOR FREELANCE SERVICES" : "RITENUTA D'ACCONTO", margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  const docNumText = isEn ? `Number: ${receipt.numero}` : `Numero: ${receipt.numero}`;
  const docDateText = isEn ? `Date: ${formatDate(receipt.data)}` : `Data: ${formatDate(receipt.data)}`;
  
  doc.setFont('helvetica', 'bold');
  doc.text(docNumText, pageWidth - margin, currentY - 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(docDateText, pageWidth - margin, currentY + 4, { align: 'right' });

  currentY += 12;

  // 2. Sender (Prestatore) & Recipient (Committente) Boxes
  const boxWidth = (contentWidth - 6) / 2; // ~87mm
  const boxHeight = 44;

  // Committente Box (Left)
  doc.setDrawColor(...borderColor);
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  let commY = currentY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text(isEn ? 'CLIENT / RECIPIENT' : 'COMMITTENTE (Spett.le)', margin + 4, commY);
  commY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(receipt.committente.denominazione || '', margin + 4, commY);
  commY += 4.5;

  if (receipt.committente.denominazioneSeconda) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(receipt.committente.denominazioneSeconda, margin + 4, commY);
    commY += 4.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(receipt.committente.indirizzo || '', margin + 4, commY);
  commY += 4.5;
  const capCitta = `${receipt.committente.cap || ''} ${receipt.committente.citta || ''} (${receipt.committente.provincia || ''})`;
  doc.text(capCitta, margin + 4, commY);
  commY += 4.5;
  if (receipt.committente.nazione) {
    doc.text(receipt.committente.nazione, margin + 4, commY);
    commY += 4.5;
  }
  if (receipt.committente.partitaIva) {
    doc.text(`VAT ID / P.IVA: ${receipt.committente.partitaIva}`, margin + 4, commY);
    commY += 4.5;
  }
  if (receipt.committente.codiceFiscale && receipt.committente.codiceFiscale !== receipt.committente.partitaIva) {
    doc.text(`Tax ID / C.F.: ${receipt.committente.codiceFiscale}`, margin + 4, commY);
  }

  // Prestatore Box (Right)
  const rightBoxX = margin + boxWidth + 6;
  doc.setDrawColor(...borderColor);
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(rightBoxX, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  let prestY = currentY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text(isEn ? 'SERVICE PROVIDER' : 'PRESTATORE D\'OPERA', rightBoxX + 4, prestY);
  prestY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  const fullName = `${receipt.prestatore.nome || ''} ${receipt.prestatore.cognome || ''}`.trim();
  doc.text(fullName, rightBoxX + 4, prestY);
  prestY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Tax ID / C.F.: ${receipt.prestatore.codiceFiscale || ''}`, rightBoxX + 4, prestY);
  prestY += 4.5;
  if (receipt.prestatore.partitaIva) {
    doc.text(`VAT / P.IVA: ${receipt.prestatore.partitaIva}`, rightBoxX + 4, prestY);
    prestY += 4.5;
  }

  const prestAddress = `${receipt.prestatore.indirizzo || ''}, ${receipt.prestatore.cap || ''} ${receipt.prestatore.citta || ''} (${receipt.prestatore.provincia || ''})`;
  doc.text(prestAddress, rightBoxX + 4, prestY);
  prestY += 4.5;

  if (receipt.prestatore.iban) {
    doc.text(`IBAN: ${receipt.prestatore.iban}`, rightBoxX + 4, prestY);
    prestY += 4.5;
  }
  if (receipt.prestatore.email || receipt.prestatore.telefono) {
    const contactStr = [receipt.prestatore.email, receipt.prestatore.telefono].filter(Boolean).join(' - ');
    doc.text(contactStr, rightBoxX + 4, prestY);
  }

  currentY += boxHeight + 10;

  // 3. Oggetto (Subject)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text(isEn ? 'DESCRIPTION OF SERVICES:' : 'OGGETTO DELLA PRESTAZIONE:', margin + 4, currentY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text(receipt.oggetto || (isEn ? 'Autonomous freelance service' : 'Prestazione occasionale di lavoro autonomo'), margin + (isEn ? 58 : 62), currentY + 7.5);

  currentY += 16;

  // 4. Prestazioni Table (AutoTable)
  const tableData = receipt.prestazioni.map((p) => {
    const isNet = p.tipoItem === 'prestazione_netto';
    const grossVal = isNet ? convertNetToGross(p.importo, receipt.taxConfig) : p.importo;
    const suffix = p.tipoItem === 'rimborso_spesa'
      ? (isEn ? ' (Documented Expense Reimbursement)' : ' (Rimborso Spesa Documentato)')
      : '';
    return [
      `${p.descrizione}${suffix}`,
      formatCurrency(grossVal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[isEn ? 'Service / Item Description' : 'Descrizione della prestazione / servizio', isEn ? 'Amount' : 'Importo']],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: textColor,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Tax Breakdown Summary Box
  const summaryWidth = 105;
  const summaryX = pageWidth - margin - summaryWidth;

  const summaryRows: Array<{ label: string; value: string; isBold?: boolean; isTotal?: boolean }> = [
    { label: isEn ? 'Total Gross Fee:' : 'Totale compensi lordi:', value: formatCurrency(receipt.taxResult.totaleCompensi), isBold: true },
  ];

  if (receipt.taxResult.totaleRimborsiSpese > 0) {
    summaryRows.push({
      label: isEn ? 'Documented Expense Reimbursements:' : 'Rimborsi Spese Documentati (Art. 15):',
      value: formatCurrency(receipt.taxResult.totaleRimborsiSpese),
    });
  }

  if (receipt.taxConfig.hasContributoPrevidenziale && receipt.taxResult.contributoPrevidenziale > 0) {
    summaryRows.push({
      label: `${receipt.taxConfig.contributoLabel || (isEn ? 'Social Security Surcharge' : 'Contributo previdenziale')}:`,
      value: formatCurrency(receipt.taxResult.contributoPrevidenziale),
    });
  }

  if (receipt.taxResult.baseImponibileRitenuta !== receipt.taxResult.totaleCompensi) {
    summaryRows.push({
      label: isEn ? 'Withholding Taxable Base:' : 'Base imponibile ritenuta:',
      value: formatCurrency(receipt.taxResult.baseImponibileRitenuta),
    });
  }

  summaryRows.push({
    label: `${isEn ? 'Withholding Tax' : "Ritenuta d'acconto"} (${receipt.taxConfig.ritenutaPercentuale}%):`,
    value: `- ${formatCurrency(receipt.taxResult.ritenutaImporto)}`,
  });

  if (receipt.taxResult.marcaDaBollo > 0) {
    summaryRows.push({
      label: isEn ? 'Stamp Duty (D.P.R. 642/72):' : 'Marca da bollo (D.P.R. 642/72):',
      value: formatCurrency(receipt.taxResult.marcaDaBollo),
    });
  }

  summaryRows.push({
    label: isEn ? 'TOTAL NET PAYABLE:' : 'TOTALE NETTO DA CORRISPONDERE:',
    value: formatCurrency(receipt.taxResult.totaleNetto),
    isBold: true,
    isTotal: true,
  });

  doc.setFontSize(9);
  summaryRows.forEach((row) => {
    if (row.isTotal) {
      doc.setFillColor(...primaryColor);
      doc.setDrawColor(...primaryColor);
      doc.roundedRect(summaryX, currentY - 3.5, summaryWidth, 9, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(row.label, summaryX + 3, currentY + 2);
      doc.text(row.value, summaryX + summaryWidth - 3, currentY + 2, { align: 'right' });
      currentY += 10;
    } else {
      doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
      doc.setTextColor(...textColor);
      doc.text(row.label, summaryX + 3, currentY);
      doc.text(row.value, summaryX + summaryWidth - 3, currentY, { align: 'right' });
      currentY += 5.5;
    }
  });

  currentY += 8;

  // 6. Notes & Legal Text
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  const legalNotes = isEn
    ? [
        "Independent freelance activity carried out pursuant to Art. 2222 et seq. of the Italian Civil Code.",
        "Transaction exempt from VAT pursuant to Art. 5 of D.P.R. 633/1972 and subsequent amendments.",
      ]
    : [
        "Prestazione svolta in regime di lavoro autonomo occasionale ai sensi dell'art. 2222 e seguenti del Codice Civile.",
        "Operazione non soggetta ad IVA ai sensi dell'art. 5 del D.P.R. 633/1972 e successive modificazioni.",
      ];

  if (receipt.taxResult.marcaDaBollo > 0) {
    legalNotes.push(
      isEn
        ? "Stamp duty fulfilled on the original document for amounts exceeding € 77,47 pursuant to D.P.R. 642/1972."
        : "Imposta di bollo assolta sull'originale per importi superiori a € 77,47 ai sensi del D.P.R. 642/1972."
    );
  }

  if (receipt.taxResult.totaleRimborsiSpese > 0) {
    legalNotes.push(
      isEn
        ? "Documented expense reimbursements excluded from withholding tax base pursuant to Art. 15 D.P.R. 633/72."
        : "Rimborsi spese documentati esclusi dalla base imponibile ritenuta ai sensi dell'art. 15 D.P.R. 633/1972."
    );
  }

  if (receipt.note) {
    legalNotes.push(`Note: ${receipt.note}`);
  }

  legalNotes.forEach((line) => {
    doc.text(line, margin, currentY);
    currentY += 4.5;
  });

  // 7. Signature (Firma)
  const signatureBase64 = receipt.firmaBase64 || receipt.prestatore?.altriDatiFiscali;
  let signatureBoxY = Math.max(currentY + 6, 230);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text(isEn ? 'Provider Signature:' : 'Firma del prestatore:', pageWidth - margin - 50, signatureBoxY);

  if (signatureBase64 && signatureBase64.startsWith('data:image')) {
    try {
      doc.addImage(signatureBase64, 'PNG', pageWidth - margin - 50, signatureBoxY + 2, 45, 18);
    } catch (e) {
      console.warn('Unable to embed signature image into PDF:', e);
    }
  } else {
    doc.setDrawColor(150, 150, 150);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(pageWidth - margin - 55, signatureBoxY + 16, pageWidth - margin, signatureBoxY + 16);
    doc.setLineDashPattern([], 0);
  }

  // 8. Footer Page Number
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${isEn ? 'Page' : 'Pagina'} ${i} ${isEn ? 'of' : 'di'} ${totalPages}`, pageWidth / 2, 287, { align: 'center' });
  }

  return doc;
}

/**
 * Downloads generated PDF with formatted filename
 */
export function downloadReceiptPDF(receipt: Receipt, themeColor?: ThemeColor): void {
  const doc = generateReceiptPDF(receipt, themeColor);
  const safeNum = (receipt.numero || '001').replace(/[/\\?%*:|"<>]/g, '-');
  const safeDate = receipt.data || '2026-01-01';
  const fileName = `Ritenuta_${safeNum}_${safeDate}.pdf`;
  doc.save(fileName);
}
