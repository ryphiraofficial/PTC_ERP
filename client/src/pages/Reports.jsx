import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronDown,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/gstUtils';
import { exportToCSV, exportToExcel, exportToPDF, exportToJSON, fmtRs } from '../utils/exportUtils';

export default function Reports() {
  const { currentRole, currentUser, permissions } = useAuth();

  const [activeTab, setActiveTab] = useState('gstr1'); // 'gstr1' | 'gstr3b' | 'ratewise'
  const [loading, setLoading] = useState(true);
  const [gstr1Data, setGstr1Data] = useState(null);
  const [gstr3bData, setGstr3bData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [g1, g3] = await Promise.all([
        api.getGstr1(params.toString()),
        api.getGstr3b(params.toString()),
      ]);

      setGstr1Data(g1);
      setGstr3bData(g3);
    } catch (err) {
      console.error('Failed to load GST reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'GSTIN',
      'Place of Supply',
      'Taxable Amount (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Total Tax (INR)',
      'Invoice Value (INR)',
      'CA Audited',
    ];

    const allInvoices = [...(gstr1Data?.b2b?.invoices || []), ...(gstr1Data?.b2c?.invoices || [])];
    const rows = allInvoices.map((inv) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      inv.customerName,
      inv.gstin,
      inv.placeOfSupply,
      inv.taxableAmount,
      inv.cgst,
      inv.sgst,
      inv.igst,
      inv.totalTax,
      inv.grandTotal,
      inv.isCaAudited ? 'Verified' : 'Pending',
    ]);

    exportToCSV(`GSTR_Sales_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
    setExportDropdownOpen(false);
  };

  const handleExportExcel = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Tax',
      'Invoice Value',
      'CA Audit Status',
    ];

    const allInvoices = [...(gstr1Data?.b2b?.invoices || []), ...(gstr1Data?.b2c?.invoices || [])];
    const rows = allInvoices.map((inv) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      inv.customerName,
      inv.gstin,
      inv.placeOfSupply,
      inv.taxableAmount,
      inv.cgst,
      inv.sgst,
      inv.igst,
      inv.totalTax,
      inv.grandTotal,
      inv.isCaAudited ? 'Verified' : 'Pending',
    ]);

    exportToExcel(`GSTR_Sales_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    if (activeTab === 'gstr1') {
      const headers = ['Invoice #', 'Date', 'Customer', 'GSTIN', 'Taxable Val', 'CGST', 'SGST', 'IGST', 'Total Val', 'Audit'];
      const allInvoices = [...(gstr1Data?.b2b?.invoices || []), ...(gstr1Data?.b2c?.invoices || [])];
      const rows = allInvoices.map((inv) => [
        inv.invoiceNumber,
        formatDate(inv.invoiceDate),
        inv.customerName,
        inv.gstin,
        fmtRs(inv.taxableAmount),
        fmtRs(inv.cgst),
        fmtRs(inv.sgst),
        fmtRs(inv.igst),
        fmtRs(inv.grandTotal),
        inv.isCaAudited ? 'Verified' : 'Pending',
      ]);

      exportToPDF({
        title: 'Form GSTR-1: Outward Supplies & Statutory Audit Report',
        subtitle: `Period: ${startDate || 'All Time'} to ${endDate || 'Present'} | Table 4 (B2B) & Table 7 (B2C)`,
        headers,
        rows,
        filename: `GSTR1_Report_${new Date().toISOString().split('T')[0]}`,
        orientation: 'landscape',
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 20 },
          2: { cellWidth: 36 },
          3: { cellWidth: 30 },
          4: { cellWidth: 26, halign: 'right' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 22, halign: 'right' },
          8: { cellWidth: 26, halign: 'right' },
          9: { cellWidth: 18, halign: 'center' },
        },
      });
    } else if (activeTab === 'gstr3b') {
      const headers = ['Nature of Supplies', 'Taxable Value', 'Integrated Tax (IGST)', 'Central Tax (CGST)', 'State/UT Tax (SGST)', 'Total Tax Liability'];
      const s31 = gstr3bData?.section31?.outwardTaxableSupplies || {};
      const rows = [
        [
          '3.1 (a) Outward Taxable Supplies (Normal)',
          fmtRs(s31.totalTaxableValue),
          fmtRs(s31.integratedTax),
          fmtRs(s31.centralTax),
          fmtRs(s31.stateUtTax),
          fmtRs((s31.integratedTax || 0) + (s31.centralTax || 0) + (s31.stateUtTax || 0)),
        ],
        [
          '3.2 Inter-State Supplies to Unregistered Persons',
          fmtRs(gstr3bData?.section32?.suppliesToUnregistered?.taxableValue || 0),
          fmtRs(gstr3bData?.section32?.suppliesToUnregistered?.integratedTax || 0),
          '-',
          '-',
          fmtRs(gstr3bData?.section32?.suppliesToUnregistered?.integratedTax || 0),
        ],
      ];

      exportToPDF({
        title: 'Form GSTR-3B: Monthly Summary Return & Tax Liability',
        subtitle: `Net Tax Payable to Government: ${fmtRs(gstr3bData?.totalTaxLiability)}`,
        headers,
        rows,
        filename: `GSTR3B_Report_${new Date().toISOString().split('T')[0]}`,
        orientation: 'landscape',
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 34, halign: 'right' },
          2: { cellWidth: 34, halign: 'right' },
          3: { cellWidth: 34, halign: 'right' },
          4: { cellWidth: 34, halign: 'right' },
          5: { cellWidth: 34, halign: 'right' },
        },
      });
    } else {
      const headers = ['Rate Slab', 'Taxable Turnover', 'CGST', 'SGST', 'IGST', 'Total GST Tax'];
      const rows = (gstr1Data?.rateWiseTax || []).map((r) => [
        `${r.rate}%`,
        fmtRs(r.taxableValue),
        fmtRs(r.cgst),
        fmtRs(r.sgst),
        fmtRs(r.igst),
        fmtRs(r.totalTax),
      ]);

      exportToPDF({
        title: 'GST Tax Rate Distribution Analysis (0%, 5%, 12%, 18%, 28%)',
        subtitle: 'Slab-wise breakdown of turnover and collected output tax',
        headers,
        rows,
        filename: `GST_Rate_Distribution_${new Date().toISOString().split('T')[0]}`,
        orientation: 'portrait',
        columnStyles: {
          0: { cellWidth: 22, halign: 'center' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
          5: { cellWidth: 40, halign: 'right' },
        },
      });
    }
    setExportDropdownOpen(false);
  };

  const handleExportJSON = () => {
    const payload = {
      gstin: '27AAACA1234Q1ZP',
      fp: new Date().toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }).replace('/', ''),
      version: 'GST_OFFLINE_TOOL_V3.0',
      b2b: gstr1Data?.b2b?.invoices || [],
      b2cs: gstr1Data?.b2c?.invoices || [],
      hsn: { data: gstr1Data?.hsnSummary || [] },
      doc_issue: gstr1Data?.documentSummary || {},
      auditedBy: currentUser?.name,
      auditTimestamp: new Date().toISOString(),
    };

    exportToJSON(`GSTR1_Offline_Tool_Export_${new Date().toISOString().split('T')[0]}`, payload);
    setExportDropdownOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              GST Compliance & Audit Reports
            </h1>
            {permissions.isCA && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                CA Audit Desk
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory GSTR-1 & GSTR-3B filings, HSN summaries, and multi-format exports (PDF, Excel, CSV, JSON)
          </p>
        </div>

        {/* All Format Export Button Dropdown */}
        <div className="relative flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Print Report"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Print</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Download Report (All Formats)</span>
              <span className="sm:hidden">Download Report</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 flex-shrink-0" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Download Format
                </div>

                {/* PDF */}
                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <div>
                    <span className="block text-xs font-bold">Download as PDF Report</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Formatted print-ready document</span>
                  </div>
                </button>

                {/* Excel */}
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="block text-xs font-bold">Export to Excel (.xls)</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Full spreadsheet workbook</span>
                  </div>
                </button>

                {/* CSV */}
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="block text-xs font-bold">Export to CSV</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Comma-separated values</span>
                  </div>
                </button>

                {/* JSON */}
                <button
                  onClick={handleExportJSON}
                  className="w-full px-3.5 py-2.5 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2.5"
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="block text-xs font-bold">GST Portal JSON (Offline Tool)</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Direct upload to GST portal</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Filter & Tabs Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
              activeTab === 'gstr1'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GSTR-1 (Outward Supplies)
          </button>
          <button
            onClick={() => setActiveTab('gstr3b')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
              activeTab === 'gstr3b'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GSTR-3B (Summary Return)
          </button>
          <button
            onClick={() => setActiveTab('ratewise')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
              activeTab === 'ratewise'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tax Rate Distribution
          </button>
        </div>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-indigo-600 font-semibold underline px-1 text-xs"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-3 text-xs">Generating GST compliance returns...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: GSTR-1 */}
          {activeTab === 'gstr1' && (
            <div className="space-y-6">
              {/* B2B Invoices Section (Table 4) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                        Table 4
                      </span>
                      <span>4A, 4B, 4C - Taxable Outward Supplies to Registered Persons (B2B)</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Invoices issued to registered business clients with active GSTINs
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Taxable: {formatINR(gstr1Data?.b2b?.totalTaxable)}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 font-mono block">
                      Tax: {formatINR(gstr1Data?.b2b?.totalTax)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase">
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Buyer Trade Name</th>
                        <th className="p-3">Buyer GSTIN</th>
                        <th className="p-3">Place of Supply</th>
                        <th className="p-3 text-right">Taxable Value</th>
                        <th className="p-3 text-right">IGST</th>
                        <th className="p-3 text-right">CGST</th>
                        <th className="p-3 text-right">SGST</th>
                        <th className="p-3 text-right">Invoice Value</th>
                        <th className="p-3 text-center">CA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gstr1Data?.b2b?.invoices?.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-3 whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                          <td className="p-3 font-semibold text-slate-900">{inv.customerName}</td>
                          <td className="p-3 font-mono text-slate-700 font-semibold">{inv.gstin}</td>
                          <td className="p-3 whitespace-nowrap">{inv.placeOfSupply}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(inv.taxableAmount)}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(inv.igst)}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(inv.cgst)}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(inv.sgst)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(inv.grandTotal)}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.isCaAudited
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {inv.isCaAudited ? 'Audited' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HSN Summary (Table 12) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                      Table 12
                    </span>
                    <span>HSN-Wise Summary of Outward Supplies</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Aggregated quantities, taxable values, and taxes categorized by HSN/SAC codes
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase">
                        <th className="p-3">HSN/SAC</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">UQC</th>
                        <th className="p-3 text-center">Total Quantity</th>
                        <th className="p-3 text-right">Total Value</th>
                        <th className="p-3 text-right">Taxable Value</th>
                        <th className="p-3 text-right">Integrated Tax</th>
                        <th className="p-3 text-right">Central Tax</th>
                        <th className="p-3 text-right">State Tax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gstr1Data?.hsnSummary?.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-indigo-700">{h.hsnSac}</td>
                          <td className="p-3 font-medium text-slate-900">{h.description}</td>
                          <td className="p-3 text-center">{h.uqc}</td>
                          <td className="p-3 text-center font-semibold">{h.totalQuantity}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(h.totalValue)}</td>
                          <td className="p-3 text-right font-mono font-semibold whitespace-nowrap">
                            {formatINR(h.taxableValue)}
                          </td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(h.igst)}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(h.cgst)}</td>
                          <td className="p-3 text-right font-mono whitespace-nowrap">{formatINR(h.sgst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GSTR-3B */}
          {activeTab === 'gstr3b' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900">
                    Form GSTR-3B Summary Return
                  </h2>
                  <p className="text-xs text-slate-500">
                    Self-assessed monthly summary for eligible tax liabilities and supplies
                  </p>
                </div>

                {/* Section 3.1 */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {gstr3bData?.section31?.title}
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Nature of Supplies</th>
                          <th className="p-3 text-right">Total Taxable Value</th>
                          <th className="p-3 text-right">Integrated Tax</th>
                          <th className="p-3 text-right">Central Tax</th>
                          <th className="p-3 text-right">State/UT Tax</th>
                          <th className="p-3 text-right">Cess</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">
                            (a) Outward taxable supplies (other than zero rated, nil rated and
                            exempted)
                          </td>
                          <td className="p-3 text-right font-bold whitespace-nowrap">
                            {formatINR(
                              gstr3bData?.section31?.outwardTaxableSupplies?.totalTaxableValue
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {formatINR(gstr3bData?.section31?.outwardTaxableSupplies?.integratedTax)}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {formatINR(gstr3bData?.section31?.outwardTaxableSupplies?.centralTax)}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {formatINR(gstr3bData?.section31?.outwardTaxableSupplies?.stateUtTax)}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">₹0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3.2 */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {gstr3bData?.section32?.title}
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs min-w-[480px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Supply Classification</th>
                          <th className="p-3 text-right">Total Taxable Value</th>
                          <th className="p-3 text-right">Amount of Integrated Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="p-3 font-sans font-medium text-slate-900">
                            Supplies made to Unregistered Persons (B2C Inter-State)
                          </td>
                          <td className="p-3 text-right font-bold whitespace-nowrap">
                            {formatINR(
                              gstr3bData?.section32?.suppliesToUnregistered?.taxableValue
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-indigo-700 whitespace-nowrap">
                            {formatINR(
                              gstr3bData?.section32?.suppliesToUnregistered?.integratedTax
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Tax Liability Box */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Net Output Tax Liability to be Discharged:
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatINR(gstr3bData?.totalTaxLiability)}
                    </span>
                  </div>
                  <div className="sm:text-right text-xs text-slate-300">
                    <p className="font-semibold text-emerald-400">Status: Ready for E-Filing</p>
                    <p className="text-[11px] text-slate-400">Statutory review certified by CA Ramesh Mehta, FCA</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RATE WISE TAX DISTRIBUTION */}
          {activeTab === 'ratewise' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  GST Tax Rate Slabs Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Breakdown by Indian GST standard tax rates (0%, 5%, 12%, 18%, 28%)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase">
                      <th className="p-3">GST Rate Slab</th>
                      <th className="p-3 text-right">Taxable Turnover</th>
                      <th className="p-3 text-right">Central GST (CGST)</th>
                      <th className="p-3 text-right">State GST (SGST)</th>
                      <th className="p-3 text-right">Integrated GST (IGST)</th>
                      <th className="p-3 text-right">Total GST Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {gstr1Data?.rateWiseTax?.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-sans">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                            {r.rate}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatINR(r.taxableValue)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">{formatINR(r.cgst)}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatINR(r.sgst)}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatINR(r.igst)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {formatINR(r.totalTax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
