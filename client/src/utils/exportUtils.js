import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees WITHOUT the ₹ glyph.
 * jsPDF's built-in Helvetica font cannot render the ₹ Unicode character,
 * so it renders as "'" or a box. We use "Rs." prefix instead.
 */
function fmtRs(val) {
  const num = Number(val) || 0;
  return (
    'Rs. ' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ─── 1. CSV Export ─────────────────────────────────────────────────────────────
export function exportToCSV(filename, headers, rows) {
  const esc = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const content = [
    headers.map(esc).join(','),
    ...rows.map((row) => row.map(esc).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 2. Excel Export (SpreadsheetML XML → proper .xls columns) ────────────────
/**
 * Previous implementation used TSV inside an .xls wrapper which Excel refused
 * to split into columns. This version generates true SpreadsheetML XML which
 * Excel (2003+) natively parses into properly separated columns with formatting.
 */
export function exportToExcel(filename, headers, rows) {
  const esc = (str) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // Determine if a cell value is a plain number (so Excel treats it as numeric)
  const isNumeric = (v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v));

  const makeRow = (cells, isHeader = false) => {
    const cellXml = cells
      .map((cell) => {
        const val = cell ?? '';
        if (isHeader) {
          return `<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
        }
        if (isNumeric(val)) {
          return `<Cell ss:StyleID="Num"><Data ss:Type="Number">${Number(val)}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="Normal"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
      })
      .join('');
    return `<Row>${cellXml}</Row>`;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="Normal">
   <Font ss:Size="9"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Num">
   <Font ss:Size="9"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Invoices">
  <Table>
   ${makeRow(headers, true)}
   ${rows.map((r) => makeRow(r)).join('\n   ')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 3. JSON Export ────────────────────────────────────────────────────────────
export function exportToJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 4. PDF Export ─────────────────────────────────────────────────────────────
/**
 * Two fixes applied:
 * (a) All currency values must be pre-formatted with fmtRs() (Rs. prefix) —
 *     the ₹ glyph is not in jsPDF's Helvetica and renders as "'" garbage.
 * (b) columnStyles provides explicit widths so numbers are never clipped.
 */
export function exportToPDF({
  title = 'GST Compliance Report',
  subtitle = '',
  headers = [],
  rows = [],
  filename = 'gst_report.pdf',
  orientation = 'landscape',
  companyInfo = 'PATHIRIPALA TRADE CENTRE | GSTIN: 32AAOFP8734E1Z3',
  columnStyles = {},  // caller can override per-column widths
}) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Header bar ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LEDGERLY GST COMPLIANCE SUITE', 14, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(companyInfo, 14, 17);

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated: ${reportDate}`, pageWidth - 14, 17, { align: 'right' });

  // ── Title ──
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);

  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 37);
  }

  // ── Table ──
  autoTable(doc, {
    startY: subtitle ? 42 : 35,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak',   // wrap text instead of clipping
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    margin: { left: 10, right: 10, bottom: 18 },
    didDrawPage: () => {
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text(
        'Confidential \u2013 For GST Statutory Review Only',
        10,
        pageHeight - 8
      );
    },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

// ─── Convenience re-export so callers don't need to import fmtRs separately ──
export { fmtRs };
