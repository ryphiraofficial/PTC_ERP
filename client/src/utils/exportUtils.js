import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 1. Export Data as CSV
export function exportToCSV(filename, headers, rows) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// 2. Export Data as Excel-compatible TSV/XML format
export function exportToExcel(filename, headers, rows) {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '';
    return String(cell).replace(/\t/g, ' ');
  };

  const tsvContent = [
    headers.map(escapeCell).join('\t'),
    ...rows.map((row) => row.map(escapeCell).join('\t')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// 3. Export Data as JSON
export function exportToJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 4. Export Table as Styled PDF
export function exportToPDF({
  title = 'GST Compliance Report',
  subtitle = '',
  headers = [],
  rows = [],
  filename = 'gst_report.pdf',
  orientation = 'landscape',
  companyInfo = 'Apex Cloud Solutions Pvt Ltd | GSTIN: 27AAACA1234Q1ZP',
}) {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Document Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LEDGERLY GST COMPLIANCE SUITE', 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(companyInfo, 14, 17);

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${reportDate}`, pageWidth - 14, 17, { align: 'right' });

  // Report Title & Subtitle
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 14, 36);
  }

  // Draw Data Table using autoTable
  doc.autoTable({
    startY: subtitle ? 40 : 34,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text('Confidential - For GST Statutory Review Only', 14, doc.internal.pageSize.getHeight() - 10);
    },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
