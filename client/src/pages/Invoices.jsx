import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/gstUtils';
import { exportToCSV, exportToExcel, exportToPDF, exportToJSON } from '../utils/exportUtils';
import InvoicePrintModal from '../components/InvoicePrintModal';
import CaAuditModal from '../components/CaAuditModal';

export default function Invoices() {
  const navigate = useNavigate();
  const { currentRole, permissions } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [auditFilter, setAuditFilter] = useState('All');

  // Modals & Export state
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [selectedInvoiceForAudit, setSelectedInvoiceForAudit] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Invoices Export Handlers
  const handleExportCSV = () => {
    const headers = ['Invoice #', 'Date', 'Due Date', 'Customer', 'GSTIN', 'Type', 'Taxable Val', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Status', 'Audit'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      formatDate(inv.dueDate),
      inv.customerDetails?.companyName || inv.customerDetails?.name,
      inv.customerDetails?.gstin || 'B2C',
      inv.isInterState ? 'Inter-State' : 'Intra-State',
      inv.totalTaxableAmount,
      inv.totalCgst,
      inv.totalSgst,
      inv.totalIgst,
      inv.grandTotal,
      inv.status,
      inv.isCaAudited ? 'Verified' : 'Pending',
    ]);
    exportToCSV(`Invoices_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
    setExportDropdownOpen(false);
  };

  const handleExportExcel = () => {
    const headers = ['Invoice #', 'Date', 'Due Date', 'Customer', 'GSTIN', 'Supply Type', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Status', 'CA Audit'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      formatDate(inv.dueDate),
      inv.customerDetails?.companyName || inv.customerDetails?.name,
      inv.customerDetails?.gstin || 'B2C',
      inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
      inv.totalTaxableAmount,
      inv.totalCgst,
      inv.totalSgst,
      inv.totalIgst,
      inv.grandTotal,
      inv.status,
      inv.isCaAudited ? 'Verified' : 'Pending',
    ]);
    exportToExcel(`Invoices_Register_${new Date().toISOString().split('T')[0]}`, headers, rows);
    setExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    const headers = ['Invoice #', 'Date', 'Customer', 'GSTIN', 'Taxable Val', 'Total Tax', 'Grand Total', 'Status', 'CA Audit'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      inv.customerDetails?.companyName || inv.customerDetails?.name,
      inv.customerDetails?.gstin || 'B2C',
      formatINR(inv.totalTaxableAmount),
      formatINR((inv.totalCgst || 0) + (inv.totalSgst || 0) + (inv.totalIgst || 0)),
      formatINR(inv.grandTotal),
      inv.status,
      inv.isCaAudited ? 'Verified' : 'Pending',
    ]);

    exportToPDF({
      title: 'Tax Invoices & Billing Register',
      subtitle: `Total Invoices: ${invoices.length} | Invoiced Turnover: ${formatINR(invoices.reduce((acc, i) => acc + (i.status !== 'Cancelled' ? i.grandTotal : 0), 0))}`,
      headers,
      rows,
      filename: `Invoices_Register_${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    setExportDropdownOpen(false);
  };

  const handleExportJSON = () => {
    exportToJSON(`Invoices_Register_${new Date().toISOString().split('T')[0]}`, invoices);
    setExportDropdownOpen(false);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (auditFilter === 'Audited') params.append('isCaAudited', 'true');
      if (auditFilter === 'Pending') params.append('isCaAudited', 'false');

      const [invData, compData] = await Promise.all([
        api.getInvoices(params.toString()),
        api.getCompany(),
      ]);

      setInvoices(invData);
      setCompany(compData);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, auditFilter]);

  const handleDelete = async (id) => {
    try {
      await api.deleteInvoice(id);
      setInvoices(invoices.filter((inv) => inv._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  const handleStatusChange = async (inv, newStatus) => {
    try {
      const updated = await api.updateInvoice(inv._id, {
        status: newStatus,
        paymentDetails:
          newStatus === 'Paid'
            ? {
                paymentStatus: 'Paid',
                amountPaid: inv.grandTotal,
                paidAt: new Date(),
                paymentMode: 'Bank Transfer / NEFT / RTGS',
              }
            : inv.paymentDetails,
        editReason: `Status marked as ${newStatus}`,
      });
      setInvoices(invoices.map((i) => (i._id === inv._id ? updated : i)));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleAudited = (updatedInvoice) => {
    setInvoices(invoices.map((i) => (i._id === updatedInvoice._id ? updatedInvoice : i)));
  };

  // Metrics summary
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, i) => sum + (i.status !== 'Cancelled' ? i.grandTotal : 0), 0);
  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const auditedCount = invoices.filter((i) => i.isCaAudited).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            GST Invoices & Billing
          </h1>
          <p className="text-xs text-slate-500">
            Issue, edit, print and review GST compliant tax invoices with real-time tax breakdown
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Download Register (PDF)</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export to Excel (.xls)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                  <span>Export to CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Export as JSON</span>
                </button>
              </div>
            )}
          </div>

          {permissions.canCreateInvoice && (
            <button
              onClick={() => navigate('/invoices/new')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Invoices
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-indigo-600 font-semibold">{formatINR(totalAmount)}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Paid / Settled
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-600">{paidCount}</span>
            <span className="text-xs text-slate-400">invoices</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            CA Compliance Audited
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-600">{auditedCount}</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Audit
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-700">{totalCount - auditedCount}</span>
            <span className="text-xs text-slate-400">awaiting CA</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, customer, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['All', 'Paid', 'Sent', 'Draft', 'Overdue'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* CA Audit Filter */}
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All CA Status</option>
            <option value="Audited">CA Verified</option>
            <option value="Pending">Pending Audit</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date & Due</th>
                <th className="p-3.5">Customer & GSTIN</th>
                <th className="p-3.5">Supply Type</th>
                <th className="p-3.5 text-right">Taxable</th>
                <th className="p-3.5 text-right">Tax</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">CA Audit</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-xs">Loading GST invoices...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No invoices found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isInter = inv.isInterState;
                  const totalTax = (inv.totalCgst || 0) + (inv.totalSgst || 0) + (inv.totalIgst || 0);

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Invoice No */}
                      <td className="p-3.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <span>{inv.invoiceNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                        {inv.lastEditedBy && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Edited by {inv.lastEditedBy.role}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDate(inv.invoiceDate)}</div>
                        <div className="text-[10px] text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">
                          {inv.customerDetails?.companyName || inv.customerDetails?.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {inv.customerDetails?.gstin || 'B2C (Unregistered)'}
                        </div>
                      </td>

                      {/* Supply Type */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInter
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isInter ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          POS: {inv.placeOfSupplyStateCode} ({inv.placeOfSupplyState})
                        </div>
                      </td>

                      {/* Taxable */}
                      <td className="p-3.5 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatINR(inv.totalTaxableAmount)}
                      </td>

                      {/* Tax */}
                      <td className="p-3.5 text-right font-medium text-indigo-700 whitespace-nowrap">
                        {formatINR(totalTax)}
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-bold text-slate-950 font-mono text-sm whitespace-nowrap">
                        {formatINR(inv.grandTotal)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {permissions.isCA ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : inv.status === 'Sent'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        ) : (
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : inv.status === 'Sent'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : inv.status === 'Draft'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>

                      {/* CA Audit Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForAudit(inv)}
                          title="Click to view or edit CA audit status"
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                            inv.isCaAudited
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <ShieldCheck
                            className={`w-3.5 h-3.5 ${inv.isCaAudited ? 'text-amber-600' : 'text-slate-400'}`}
                          />
                          <span>{inv.isCaAudited ? 'CA Verified' : 'Pending'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print / View */}
                          <button
                            onClick={() => setSelectedInvoiceForPrint(inv)}
                            title="Print / View Tax Invoice"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* INVOICE EDIT FEATURE BUTTON (Owner & Biller ONLY) */}
                          {permissions.canEditInvoice && (
                            <button
                              onClick={() => navigate(`/invoices/${inv._id}/edit`)}
                              title="Edit Invoice"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* CA Audit Review (CA & Owner ONLY) */}
                          {permissions.canAuditInvoices && (
                            <button
                              onClick={() => setSelectedInvoiceForAudit(inv)}
                              title="CA Compliance Review"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all font-bold"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Owner only or Drafts) */}
                          {permissions.canDeleteInvoices && (
                            <button
                              onClick={() => setDeleteConfirmId(inv._id)}
                              title="Delete Invoice"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Delete Invoice?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this invoice? This will remove all associated tax
              records and audit history.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print & PDF Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          company={company}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* CA Audit Modal */}
      {selectedInvoiceForAudit && (
        <CaAuditModal
          invoice={selectedInvoiceForAudit}
          onClose={() => setSelectedInvoiceForAudit(null)}
          onAudited={handleAudited}
        />
      )}
    </div>
  );
}
