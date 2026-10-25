import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { formatINR } from '../utils/gstUtils';
import { api } from '../api';

export default function CaAuditModal({ invoice, onClose, onAudited }) {
  const [isCaAudited, setIsCaAudited] = useState(invoice.isCaAudited ?? true);
  const [caNotes, setCaNotes] = useState(invoice.caNotes || 'Verified all tax line items and counterpart GSTIN compliance.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const updated = await api.auditInvoice(invoice._id, {
        isCaAudited,
        caNotes,
      });
      onAudited(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit CA audit status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-slate-950" />
            <div>
              <h3 className="font-bold text-base">CA Tax Compliance Audit</h3>
              <p className="text-xs text-amber-950 font-medium">
                Chartered Accountant Review & Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-600 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-950" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Pill */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900">{invoice.customerDetails?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Buyer GSTIN:</span>
              <span className="font-mono text-slate-900">{invoice.customerDetails?.gstin || 'Unregistered B2C'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Supply Type:</span>
              <span className="font-semibold text-indigo-700">
                {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
              <span className="text-slate-700">Total Tax Amount:</span>
              <span className="text-slate-950">
                {formatINR(invoice.totalCgst + invoice.totalSgst + invoice.totalIgst)}
              </span>
            </div>
          </div>

          {/* Audit Verification Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Compliance Status:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsCaAudited(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  isCaAudited
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark Verified</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCaAudited(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  !isCaAudited
                    ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Needs Adjustment</span>
              </button>
            </div>
          </div>

          {/* CA Audit Comments */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              CA Compliance Notes / Filing Reference:
            </label>
            <textarea
              rows={3}
              value={caNotes}
              onChange={(e) => setCaNotes(e.target.value)}
              placeholder="e.g. Rate cross-checked with HSN portal, ITC match confirmed for monthly GSTR-1"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              {loading ? 'Saving...' : 'Save Audit Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
