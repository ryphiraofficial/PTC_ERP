import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  FileCheck,
  Clock,
  ArrowUpRight,
  Plus,
  Users,
  Package,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/gstUtils';
import InvoicePrintModal from '../components/InvoicePrintModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole, currentUser, permissions } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [currentRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const statusCounts = stats?.statusCounts || {};
  const recentInvoices = stats?.recentInvoices || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner Tailored to Active Role */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentRole === 'owner' ? 'Owner' : currentRole === 'ca' ? 'CA (Audit)' : 'Biller'}
              </span>
              <span className="text-xs text-slate-400">
                GSTIN: <strong className="text-white font-mono">{stats?.companyGstin}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {currentRole === 'owner'
                ? 'Owner Dashboard'
                : currentRole === 'ca'
                ? 'CA Audit Workspace'
                : 'Biller Workspace'}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              {permissions.isCA
                ? 'Review tax liabilities, audit B2B/B2C line items, and generate GSTR-1 & GSTR-3B filings.'
                : permissions.isOwner
                ? 'Manage financial health, monitor real-time GST collections, approve invoices and configure tax settings.'
                : 'Create customer tax invoices, maintain catalog pricing, and track outstanding invoice payments.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {permissions.canCreateInvoices && (
              <button
                onClick={() => navigate('/invoices/new')}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            )}
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>GST Returns</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatINR(summary.totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {summary.totalInvoices} issued invoices
            </p>
          </div>
        </div>

        {/* GST Tax Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              GST Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatINR(summary.totalTax)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-slate-500 mt-1">
              <span>CGST: {formatINR(summary.totalCgst)}</span>
              <span>•</span>
              <span>SGST: {formatINR(summary.totalSgst)}</span>
              <span>•</span>
              <span>IGST: {formatINR(summary.totalIgst)}</span>
            </div>
          </div>
        </div>

        {/* Paid Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Settled / Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {formatINR(summary.paidAmount)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Outstanding: {formatINR(summary.pendingAmount)}</span>
            </div>
          </div>
        </div>

        {/* CA Compliance Audit Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CA Compliance Audit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 font-mono">
              {summary.caAuditedCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ {summary.totalInvoices}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.caPendingAuditCount > 0 ? (
                <span className="text-amber-700 font-semibold">
                  {summary.caPendingAuditCount} pending CA review
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">All invoices verified</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & GST Tax Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Invoices
              </h2>
              <p className="text-xs text-slate-400">
                Latest tax invoices issued with status and edit options
              </p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All Invoices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[550px]">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px]">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Grand Total</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                        {inv.customerDetails?.companyName || inv.customerDetails?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.customerDetails?.gstin || 'B2C Unregistered'}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 text-right font-bold text-slate-950 font-mono">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          title="Print / View"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {/* INVOICE EDIT ACTION */}
                        <button
                          onClick={() => navigate(`/invoices/${inv._id}/edit`)}
                          title="Edit Invoice"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Tax Breakdown Card & Quick Links (1 Col) */}
        <div className="space-y-6">
          {/* Tax Distribution Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              GST Tax Structure Breakdown
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Central GST (CGST 50% of Intra)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatINR(summary.totalCgst)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-2/5"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">State GST (SGST 50% of Intra)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatINR(summary.totalSgst)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-2/5"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Integrated GST (IGST 100% Inter)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatINR(summary.totalIgst)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-3/5"></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Place of Supply Rules:</span>
              <p className="text-[11px] text-slate-500">
                Supplier registered in <strong>Maharashtra (27)</strong>. Local billing triggers
                CGST + SGST. Inter-state billing across state boundaries triggers IGST automatically.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/customers')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-all"
              >
                <Users className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="font-bold text-slate-900 block">Customers</span>
                <span className="text-[10px] text-slate-400">{summary.totalCustomers} registered</span>
              </button>

              <button
                onClick={() => navigate('/items')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-all"
              >
                <Package className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="font-bold text-slate-900 block">Items & HSN</span>
                <span className="text-[10px] text-slate-400">{summary.totalItems} catalog items</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Print & PDF Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
}
